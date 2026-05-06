-- advanced database features: views, stored procedures, and triggers
-- run this after schema.sql and before seed.sql

USE hostel_db;

-- VIEWS
-- views are like saved queries, we query them like tables but they always return fresh data

-- shows all students who currently have an approved room, with their hostel and room details
-- used on the admin dashboard and student dashboard to display allocation info
CREATE OR REPLACE VIEW View_Allocated_Students AS
SELECT 
    s.student_id,
    s.name AS student_name,
    s.course,
    h.hostel_name,
    r.room_number,
    a.allocation_date
FROM Students s
JOIN Allocations a ON s.student_id = a.student_id   -- match student to their allocation
JOIN Rooms r ON a.room_id = r.room_id               -- get the room details
JOIN Hostels h ON r.hostel_id = h.hostel_id         -- get the hostel name
WHERE a.status = 'Approved';                         -- only include confirmed allocations

-- shows only rooms that still have free beds
-- this powers the "Browse Rooms" page — students see available_beds > 0 only
CREATE OR REPLACE VIEW View_Available_Rooms AS
SELECT 
    r.room_id,
    r.room_number,
    h.hostel_name,
    h.gender_type,
    r.capacity,
    COALESCE(COUNT(a.student_id), 0) AS current_occupancy,                         -- how many approved students are in the room right now
    (r.capacity - COALESCE(COUNT(a.student_id), 0)) AS available_beds              -- remaining free spots
FROM Rooms r
JOIN Hostels h ON r.hostel_id = h.hostel_id
LEFT JOIN Allocations a ON r.room_id = a.room_id AND a.status = 'Approved'         -- only count approved allocations toward occupancy
GROUP BY r.room_id, r.room_number, h.hostel_name, h.gender_type, r.capacity
HAVING (r.capacity - COALESCE(COUNT(a.student_id), 0)) > 0;                        -- filter out full rooms


-- STORED PROCEDURES

DELIMITER //

-- handles the logic of allocating a room to a student
-- checks three things before inserting: no existing allocation, gender match, and room capacity
DROP PROCEDURE IF EXISTS AllocateRoom//
CREATE PROCEDURE AllocateRoom(IN p_student_id INT, IN p_room_id INT)
BEGIN
    DECLARE v_capacity INT;
    DECLARE v_occupancy INT;
    DECLARE v_existing_allocation INT;
    DECLARE v_student_gender VARCHAR(10);
    DECLARE v_hostel_gender VARCHAR(10);

    -- block if student already has a pending or approved allocation
    SELECT COUNT(*) INTO v_existing_allocation 
    FROM Allocations 
    WHERE student_id = p_student_id AND status IN ('Approved', 'Pending');
    
    IF v_existing_allocation > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student already has a pending or approved allocation.';
    END IF;

    -- make sure the student's gender matches the hostel type
    SELECT gender INTO v_student_gender FROM Students WHERE student_id = p_student_id;
    SELECT h.gender_type INTO v_hostel_gender 
    FROM Rooms r JOIN Hostels h ON r.hostel_id = h.hostel_id 
    WHERE r.room_id = p_room_id;

    IF v_hostel_gender != 'Co-ed' AND 
       ( (v_student_gender = 'Male' AND v_hostel_gender != 'Boys') OR 
         (v_student_gender = 'Female' AND v_hostel_gender != 'Girls') ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Gender mismatch: You cannot book a room in this hostel.';
    END IF;

    -- check the room still has space before inserting
    SELECT capacity INTO v_capacity FROM Rooms WHERE room_id = p_room_id;
    SELECT COUNT(*) INTO v_occupancy FROM Allocations WHERE room_id = p_room_id AND status = 'Approved';

    IF v_occupancy >= v_capacity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Room is fully occupied. Allocation failed.';
    END IF;

    -- all checks passed, insert the allocation as pending (admin will approve)
    INSERT INTO Allocations (student_id, room_id, status)
    VALUES (p_student_id, p_room_id, 'Pending');
END //

-- handles approving a swap — swaps the room_id between both students atomically
-- uses a transaction so if anything fails midway, nothing is changed
DROP PROCEDURE IF EXISTS ApproveSwap//
CREATE PROCEDURE ApproveSwap(IN p_swap_id INT, IN p_admin_id INT)
BEGIN
    DECLARE v_requester_id INT;
    DECLARE v_target_id INT;
    DECLARE v_req_room_id INT;
    DECLARE v_tgt_room_id INT;
    DECLARE v_status VARCHAR(20);

    -- if any SQL error happens inside, rollback everything and re-throw the error
    DECLARE exit handler for sqlexception
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- lock the swap request row so no one else can process it at the same time
    SELECT requester_id, target_student_id, status 
    INTO v_requester_id, v_target_id, v_status
    FROM Swap_Requests 
    WHERE swap_id = p_swap_id FOR UPDATE;

    IF v_status != 'Pending' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Swap request is not pending.';
    END IF;

    -- fetch current rooms of both students (lock rows to prevent race conditions)
    SELECT room_id INTO v_req_room_id FROM Allocations WHERE student_id = v_requester_id AND status = 'Approved' FOR UPDATE;
    SELECT room_id INTO v_tgt_room_id FROM Allocations WHERE student_id = v_target_id AND status = 'Approved' FOR UPDATE;

    -- both students must have an approved allocation to swap
    IF v_req_room_id IS NULL OR v_tgt_room_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Both students must have an approved allocation to swap.';
    END IF;

    -- do the actual swap by exchanging room_ids
    UPDATE Allocations SET room_id = v_tgt_room_id WHERE student_id = v_requester_id AND status = 'Approved';
    UPDATE Allocations SET room_id = v_req_room_id WHERE student_id = v_target_id AND status = 'Approved';
    
    -- mark the swap request as done
    UPDATE Swap_Requests 
    SET status = 'Approved', admin_id = p_admin_id 
    WHERE swap_id = p_swap_id;

    COMMIT;
END //


-- TRIGGERS
-- triggers run automatically on insert/update — they act as a safety net at the database level

-- blocks a new allocation if the room is already at full capacity
-- this fires even if someone tries to insert directly into the table, bypassing the app
DROP TRIGGER IF EXISTS trg_prevent_over_capacity//
CREATE TRIGGER trg_prevent_over_capacity
BEFORE INSERT ON Allocations
FOR EACH ROW
BEGIN
    DECLARE v_capacity INT;
    DECLARE v_occupancy INT;

    -- only check capacity when the status being inserted is already 'Approved'
    IF NEW.status = 'Approved' THEN
        SELECT capacity INTO v_capacity FROM Rooms WHERE room_id = NEW.room_id;
        
        SELECT COUNT(*) INTO v_occupancy 
        FROM Allocations 
        WHERE room_id = NEW.room_id AND status = 'Approved';
        
        IF v_occupancy >= v_capacity THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Trigger Error: Room capacity exceeded.';
        END IF;
    END IF;
END //

-- same capacity check but fires when an admin changes a status from 'Pending' to 'Approved'
-- prevents approving a room allocation when the room is already full
DROP TRIGGER IF EXISTS trg_prevent_over_capacity_update//
CREATE TRIGGER trg_prevent_over_capacity_update
BEFORE UPDATE ON Allocations
FOR EACH ROW
BEGIN
    DECLARE v_capacity INT;
    DECLARE v_occupancy INT;

    -- only check when the status is changing to Approved for the first time
    IF NEW.status = 'Approved' AND OLD.status != 'Approved' THEN
        SELECT capacity INTO v_capacity FROM Rooms WHERE room_id = NEW.room_id;
        
        SELECT COUNT(*) INTO v_occupancy 
        FROM Allocations 
        WHERE room_id = NEW.room_id AND status = 'Approved';
        
        IF v_occupancy >= v_capacity THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Trigger Error: Room capacity exceeded.';
        END IF;
    END IF;
END //

-- blocks swap requests between students of different genders
-- ensures male and female students can't be swapped into each other's rooms
DROP TRIGGER IF EXISTS trg_prevent_cross_gender_swap //

CREATE TRIGGER trg_prevent_cross_gender_swap
BEFORE INSERT ON Swap_Requests
FOR EACH ROW
BEGIN
    DECLARE v_req_gender VARCHAR(10);
    DECLARE v_tgt_gender VARCHAR(10);
    
    SELECT gender INTO v_req_gender FROM Students WHERE student_id = NEW.requester_id;
    SELECT gender INTO v_tgt_gender FROM Students WHERE student_id = NEW.target_student_id;
    
    IF v_req_gender != v_tgt_gender THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Trigger Error: Cross-gender room swaps are strictly prohibited.';
    END IF;
END //

DELIMITER ;
