// all routes for the admin/warden side — dashboard, approvals, hostel details
const express = require('express');
const router = express.Router();
const db = require('../db');

// block non-admins from accessing anything in this file
const requireAdmin = (req, res, next) => {
    if (req.session.role === 'admin') next();
    else res.redirect('/auth/login');
};

router.use(requireAdmin);

// admin dashboard — shows occupancy stats, pending allocations, and pending swaps
router.get('/dashboard', async (req, res) => {
    try {
        // count how many students are approved in each hostel (GROUP BY hostel)
        const [stats] = await db.query(`
            SELECT h.hostel_id, h.hostel_name, COUNT(a.student_id) AS allocated_students_count
            FROM Hostels h
            JOIN Rooms r ON h.hostel_id = r.hostel_id
            LEFT JOIN Allocations a ON r.room_id = a.room_id AND a.status = 'Approved'
            GROUP BY h.hostel_id, h.hostel_name
        `);

        // get all allocation requests waiting for admin review
        const [pendingAllocations] = await db.query(`
            SELECT a.allocation_id, s.name as student_name, r.room_number, h.hostel_name, a.allocation_date
            FROM Allocations a
            JOIN Students s ON a.student_id = s.student_id
            JOIN Rooms r ON a.room_id = r.room_id
            JOIN Hostels h ON r.hostel_id = h.hostel_id
            WHERE a.status = 'Pending'
        `);

        // get swap requests where target already gave consent — these are ready for admin approval
        const [pendingSwaps] = await db.query(`
            SELECT sr.swap_id, req.name as requester_name, tgt.name as target_name, sr.request_date,
                   r1.room_number as requester_room, h1.hostel_name as requester_hostel,
                   r2.room_number as target_room, h2.hostel_name as target_hostel
            FROM Swap_Requests sr
            JOIN Students req ON sr.requester_id = req.student_id
            JOIN Students tgt ON sr.target_student_id = tgt.student_id
            JOIN Allocations a1 ON req.student_id = a1.student_id AND a1.status = 'Approved'
            JOIN Rooms r1 ON a1.room_id = r1.room_id
            JOIN Hostels h1 ON r1.hostel_id = h1.hostel_id
            JOIN Allocations a2 ON tgt.student_id = a2.student_id AND a2.status = 'Approved'
            JOIN Rooms r2 ON a2.room_id = r2.room_id
            JOIN Hostels h2 ON r2.hostel_id = h2.hostel_id
            WHERE sr.status = 'Pending' AND sr.target_consent = TRUE  -- only show swaps the target has agreed to
        `);

        res.render('admin_dashboard', { stats, pendingAllocations, pendingSwaps });
    } catch (err) {
        console.error(err);
        res.send(`Error loading admin dashboard: ${err.message}`);
    }
});

// approve or reject a room allocation request
router.post('/allocation/:id/:action', async (req, res) => {
    const { id, action } = req.params;
    const status = action === 'approve' ? 'Approved' : 'Rejected';
    try {
        // simple status update — triggers in the DB will enforce capacity before setting Approved
        await db.query('UPDATE Allocations SET status = ? WHERE allocation_id = ?', [status, id]);
        res.redirect(`/admin/dashboard?success=Allocation ${action}d successfully!`);
    } catch (err) {
        res.redirect(`/admin/dashboard?error=${encodeURIComponent(err.message)}`);
    }
});

// approve or reject a swap request
router.post('/swap/:id/:action', async (req, res) => {
    const { id, action } = req.params;
    const adminId = req.session.user.admin_id;
    try {
        if (action === 'approve') {
            // use the stored procedure which swaps rooms atomically inside a transaction
            await db.query('CALL ApproveSwap(?, ?)', [id, adminId]);
        } else {
            // rejection is a simple status update — no room changes needed
            await db.query('UPDATE Swap_Requests SET status = ?, admin_id = ? WHERE swap_id = ?', ['Rejected', adminId, id]);
        }
        res.redirect(`/admin/dashboard?success=Swap ${action}d successfully!`);
    } catch (err) {
        res.redirect(`/admin/dashboard?error=${encodeURIComponent(err.message)}`);
    }
});

// show full room-by-room breakdown for a specific hostel
router.get('/hostel/:id', async (req, res) => {
    try {
        const hostelId = req.params.id;
        const [hostelData] = await db.query('SELECT hostel_name, hostel_type, gender_type FROM Hostels WHERE hostel_id = ?', [hostelId]);
        
        if (hostelData.length === 0) return res.redirect('/admin/dashboard?error=Hostel not found');

        // get every room in the hostel along with whoever is approved in it
        // LEFT JOIN so empty rooms still show up
        const [rooms] = await db.query(`
            SELECT r.room_number, r.capacity, s.name as student_name, s.course, s.year, s.contact_number
            FROM Rooms r
            LEFT JOIN Allocations a ON r.room_id = a.room_id AND a.status = 'Approved'
            LEFT JOIN Students s ON a.student_id = s.student_id
            WHERE r.hostel_id = ?
            ORDER BY r.room_number ASC
        `, [hostelId]);

        res.render('hostel_details', { 
            hostel: hostelData[0], 
            rooms 
        });
    } catch (err) {
        res.redirect(`/admin/dashboard?error=${encodeURIComponent(err.message)}`);
    }
});

module.exports = router;
