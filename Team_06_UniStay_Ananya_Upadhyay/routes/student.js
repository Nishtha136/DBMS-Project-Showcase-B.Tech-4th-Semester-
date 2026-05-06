// all routes for the student side of the app — dashboard, rooms, swaps
const express = require('express');
const router = express.Router();
const db = require('../db');

// block non-students from accessing any route in this file
const requireStudent = (req, res, next) => {
    if (req.session.role === 'student') next();
    else res.redirect('/auth/login');
};

router.use(requireStudent);

// student's home page — shows their room, roommates, and swap history
router.get('/dashboard', async (req, res) => {
    try {
        const studentId = req.session.user.student_id;
        
        // use the view to get this student's approved allocation with hostel and room name
        const [allocations] = await db.query(
            'SELECT * FROM View_Allocated_Students WHERE student_id = ?', 
            [studentId]
        );
        
        let roommates = [];
        if (allocations.length > 0) {
            // find other students in the same room in the same hostel (excluding the current student)
            [roommates] = await db.query(`
                SELECT s.name, s.course, s.contact_number
                FROM Students s
                JOIN Allocations a ON s.student_id = a.student_id
                JOIN Rooms r ON a.room_id = r.room_id
                JOIN Hostels h ON r.hostel_id = h.hostel_id
                WHERE r.room_number = ? AND h.hostel_name = ? 
                AND a.status = 'Approved' AND s.student_id != ?
            `, [allocations[0].room_number, allocations[0].hostel_name, studentId]);
        }

        // get all swap requests involving this student — both ones they sent and ones received
        const [swaps] = await db.query(`
            SELECT sr.swap_id, s.name as target_name, sr.status, sr.target_consent, 'outgoing' as type 
            FROM Swap_Requests sr
            JOIN Students s ON sr.target_student_id = s.student_id
            WHERE sr.requester_id = ?
            UNION
            SELECT sr.swap_id, s.name as target_name, sr.status, sr.target_consent, 'incoming' as type 
            FROM Swap_Requests sr
            JOIN Students s ON sr.requester_id = s.student_id
            WHERE sr.target_student_id = ?
        `, [studentId, studentId]);

        res.render('student_dashboard', { 
            user: req.session.user, 
            allocation: allocations[0] || null,
            roommates,
            swaps
        });
    } catch (err) {
        console.error(err);
        res.send("Error loading dashboard.");
    }
});

// handle the target student accepting or declining an incoming swap request
router.post('/swap/:id/consent', async (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'accept' or 'decline'
    try {
        if (action === 'accept') {
            // mark target's consent as true so the admin can now see and approve it
            await db.query('UPDATE Swap_Requests SET target_consent = TRUE WHERE swap_id = ? AND target_student_id = ?', [id, req.session.user.student_id]);
        } else {
            // target declined — close the request immediately without admin involvement
            await db.query('UPDATE Swap_Requests SET status = "Rejected" WHERE swap_id = ? AND target_student_id = ?', [id, req.session.user.student_id]);
        }
        res.redirect('/student/dashboard');
    } catch (err) {
        res.redirect('/student/dashboard?error=Failed to update swap consent');
    }
});

// show available rooms filtered to the student's gender (boys see boys' hostels, etc.)
router.get('/rooms', async (req, res) => {
    try {
        const studentId = req.session.user.student_id;
        const studentGender = req.session.user.gender;

        // map student gender to hostel gender_type
        let hostelGender = 'Co-ed';
        if (studentGender === 'Male') hostelGender = 'Boys';
        if (studentGender === 'Female') hostelGender = 'Girls';

        // check if they already have a room so we can show "move here" vs "request"
        const [allocs] = await db.query('SELECT allocation_id FROM Allocations WHERE student_id = ?', [studentId]);
        const hasAllocation = allocs.length > 0;

        // use the view which only returns rooms with available_beds > 0
        const [rows] = await db.query(
            'SELECT * FROM View_Available_Rooms WHERE gender_type = ? OR gender_type = "Co-ed"',
            [hostelGender]
        );
        res.render('available_rooms', { rooms: rows, hasAllocation, error: req.query.error });
    } catch (err) {
        console.error(err);
        res.send("Error loading rooms.");
    }
});

// student requests a room — calls the stored procedure which handles all validation
router.post('/request-room', async (req, res) => {
    const { room_id } = req.body;
    const studentId = req.session.user.student_id;
    try {
        // AllocateRoom checks: no duplicate allocation, gender match, room capacity
        await db.query('CALL AllocateRoom(?, ?)', [studentId, room_id]);
        res.redirect('/student/dashboard');
    } catch (err) {
        console.error(err);
        // error message from the stored procedure is shown to the student
        res.redirect(`/student/rooms?error=${encodeURIComponent(err.message)}`);
    }
});

// move a student to a different room directly (used when they already have an allocation)
router.post('/change-room', async (req, res) => {
    const { room_id } = req.body;
    const studentId = req.session.user.student_id;
    try {
        // direct update — trigger trg_prevent_over_capacity_update will block it if the room is full
        await db.query('UPDATE Allocations SET room_id = ? WHERE student_id = ?', [room_id, studentId]);
        res.redirect('/student/dashboard?success=Successfully moved to the new room!');
    } catch (err) {
        console.error(err);
        res.redirect(`/student/rooms?error=${encodeURIComponent('Could not move to this room. It may be at full capacity.')}`);
    }
});

// show the swap page — list of students the current student can swap with
router.get('/swap', async (req, res) => {
    try {
        const studentId = req.session.user.student_id;
        const studentGender = req.session.user.gender;
        
        // only show students of same gender who have an approved room different from the current student's room
        const [students] = await db.query(`
            SELECT s.student_id, s.name, r.room_number, h.hostel_name
            FROM Students s
            JOIN Allocations a ON s.student_id = a.student_id
            JOIN Rooms r ON a.room_id = r.room_id
            JOIN Hostels h ON r.hostel_id = h.hostel_id
            WHERE a.status = 'Approved' 
            AND s.student_id != ? 
            AND s.gender = ?
            AND a.room_id != (
                SELECT room_id FROM Allocations WHERE student_id = ? AND status = 'Approved' LIMIT 1
            )
        `, [studentId, studentGender, studentId]);
        
        res.render('swap_request', { students });
    } catch (err) {
        res.send("Error loading swap page.");
    }
});

// submit a swap request — trigger will block it if genders don't match
router.post('/swap', async (req, res) => {
    const { target_student_id } = req.body;
    try {
        await db.query(
            'INSERT INTO Swap_Requests (requester_id, target_student_id) VALUES (?, ?)',
            [req.session.user.student_id, target_student_id]
        );
        res.redirect('/student/dashboard');
    } catch (err) {
        res.send("Failed to request swap.");
    }
});

module.exports = router;
