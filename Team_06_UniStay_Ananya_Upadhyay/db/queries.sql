-- DQL QUERIES 
-- Demonstrates JOINs, GROUP BY, HAVING, SUBQUERIES, AGGREGATE

-- 1. JOINS
-- Get student + room + hostel details (INNER JOIN)
SELECT 
    s.name AS student_name, 
    r.room_number, 
    h.hostel_name, 
    a.status AS allocation_status
FROM Students s
JOIN Allocations a ON s.student_id = a.student_id
JOIN Rooms r ON a.room_id = r.room_id
JOIN Hostels h ON r.hostel_id = h.hostel_id
WHERE a.status = 'Approved';

-- Get pending swap requests with student names (LEFT/INNER JOIN)
SELECT 
    sr.swap_id,
    req_s.name AS requester_name,
    tgt_s.name AS target_name,
    sr.request_date,
    sr.status
FROM Swap_Requests sr
JOIN Students req_s ON sr.requester_id = req_s.student_id
JOIN Students tgt_s ON sr.target_student_id = tgt_s.student_id
WHERE sr.status = 'Pending';

-- 2. GROUP BY + HAVING
-- Count students per hostel
SELECT 
    h.hostel_name, 
    COUNT(a.student_id) AS allocated_students_count
FROM Hostels h
JOIN Rooms r ON h.hostel_id = r.hostel_id
LEFT JOIN Allocations a ON r.room_id = a.room_id AND a.status = 'Approved'
GROUP BY h.hostel_id, h.hostel_name
ORDER BY allocated_students_count DESC;

-- Rooms with occupancy >= 2
SELECT 
    r.room_number, 
    COUNT(a.student_id) AS current_occupancy
FROM Rooms r
JOIN Allocations a ON r.room_id = a.room_id
WHERE a.status = 'Approved'
GROUP BY r.room_id, r.room_number
HAVING COUNT(a.student_id) >= 2;

-- 3. SUBQUERIES
-- Students not allocated any room
SELECT name, email, course
FROM Students
WHERE student_id NOT IN (
    SELECT student_id 
    FROM Allocations 
    WHERE status IN ('Approved', 'Pending')
);

-- Rooms with highest occupancy capacity
SELECT room_number, capacity, hostel_id
FROM Rooms
WHERE capacity = (SELECT MAX(capacity) FROM Rooms);

-- 4. AGGREGATE FUNCTIONS
-- Comprehensive stats
SELECT 
    COUNT(*) AS total_students,
    MAX(year) AS max_study_year,
    MIN(year) AS min_study_year,
    AVG(capacity) AS avg_room_capacity
FROM Students, Rooms;
