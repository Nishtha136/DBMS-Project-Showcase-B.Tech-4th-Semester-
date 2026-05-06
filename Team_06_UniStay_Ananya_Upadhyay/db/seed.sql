-- sample data for the hostel system — run after schema.sql and advanced.sql

USE hostel_db;

-- clear old data before re-inserting so we don't get duplicates
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE Swap_Requests;
TRUNCATE TABLE Allocations;
TRUNCATE TABLE Students;
TRUNCATE TABLE Rooms;
TRUNCATE TABLE Hostels;
TRUNCATE TABLE Admins;
SET FOREIGN_KEY_CHECKS = 1;

-- demo admin accounts (first one is the simple login used for the project)
INSERT INTO Admins (name, email, password) VALUES
('Hostel Admin',          'hostel@123',                'hostel'),
('Dr. Ramesh Gupta',      'admin@hostel.edu',          'hashed_pwd_123'),
('Warden Meena Sharma',   'warden.boys@hostel.edu',    'hashed_pwd_456'),
('Warden Kavita Joshi',   'warden.girls@hostel.edu',   'hashed_pwd_789');

-- 7 hostels: 4 for boys, 3 for girls, mix of AC and Non-AC
INSERT INTO Hostels (hostel_name, gender_type, hostel_type) VALUES
('Ratan Tata Boys Hostel',      'Boys',  'AC'),
('Bhagat Singh Boys Hostel',    'Boys',  'Non-AC'),
('Vikram Sarabhai Boys Hostel', 'Boys',  'Non-AC'),
('Homi Bhabha Boys Hostel',     'Boys',  'AC'),
('Kalpana Chawla Girls Hostel', 'Girls', 'AC'),
('Gargi Girls Hostel',          'Girls', 'Non-AC'),
('APJ Girls Hostel',            'Girls', 'AC');

-- rooms per hostel, grouped by hostel_id (matches order above)
-- Ratan Tata Boys (hostel_id = 1)
INSERT INTO Rooms (room_number, capacity, hostel_id) VALUES
('101', 2, 1), ('102', 2, 1), ('103', 3, 1), ('104', 2, 1);

-- Bhagat Singh Boys (hostel_id = 2)
INSERT INTO Rooms (room_number, capacity, hostel_id) VALUES
('201', 2, 2), ('202', 3, 2), ('203', 2, 2), ('204', 2, 2);

-- Vikram Sarabhai Boys (hostel_id = 3)
INSERT INTO Rooms (room_number, capacity, hostel_id) VALUES
('301', 2, 3), ('302', 2, 3), ('305', 2, 3);

-- Homi Bhabha Boys (hostel_id = 4)
INSERT INTO Rooms (room_number, capacity, hostel_id) VALUES
('401', 2, 4), ('402', 1, 4);

-- Kalpana Chawla Girls (hostel_id = 5)
INSERT INTO Rooms (room_number, capacity, hostel_id) VALUES
('102', 2, 5), ('103', 2, 5), ('104', 3, 5);

-- Gargi Girls (hostel_id = 6)
INSERT INTO Rooms (room_number, capacity, hostel_id) VALUES
('201', 2, 6), ('204', 2, 6), ('205', 3, 6);

-- APJ Girls (hostel_id = 7)
INSERT INTO Rooms (room_number, capacity, hostel_id) VALUES
('301', 2, 7), ('306', 2, 7);

-- 12 students (7 male, 5 female) across different courses and years
INSERT INTO Students (name, gender, course, year, contact_number, email, password) VALUES
('Aarav Sharma',    'Male',   'B.Tech CSE',              2, '9876501001', 'aarav@student.edu',    'pwd1'),
('Rahul Yadav',     'Male',   'B.Tech ECE',              3, '9876501002', 'rahul@student.edu',    'pwd2'),
('Kunal Mehta',     'Male',   'Mechanical Engineering',  1, '9876501003', 'kunal@student.edu',    'pwd3'),
('Aditya Gupta',    'Male',   'B.Tech CSE',              4, '9876501004', 'aditya@student.edu',   'pwd4'),
('Rohan Verma',     'Male',   'B.Tech ECE',              2, '9876501005', 'rohan@student.edu',    'pwd5'),
('Arjun Mishra',    'Male',   'Mechanical Engineering',  3, '9876501006', 'arjun@student.edu',    'pwd6'),
('Vikram Patel',    'Male',   'B.Tech CSE',              1, '9876501007', 'vikram@student.edu',   'pwd7'),
('Riya Verma',      'Female', 'B.Tech CSE',              2, '9876501008', 'riya@student.edu',     'pwd8'),
('Priya Singh',     'Female', 'B.Tech ECE',              3, '9876501009', 'priya@student.edu',    'pwd9'),
('Sneha Kapoor',    'Female', 'Mechanical Engineering',  1, '9876501010', 'sneha@student.edu',    'pwd10'),
('Ananya Sharma',   'Female', 'B.Tech CSE',              4, '9876501011', 'ananya@student.edu',   'pwd11'),
('Meera Iyer',      'Female', 'B.Tech ECE',              2, '9876501012', 'meera@student.edu',    'pwd12');

-- assign students to rooms (most approved, a few left pending for demo)
-- room_id reference: Ratan Tata 1-4, Bhagat Singh 5-8, Vikram Sarabhai 9-11
-- Homi Bhabha 12-13, Kalpana Chawla 14-16, Gargi 17-19, APJ 20-21
INSERT INTO Allocations (student_id, room_id, status) VALUES
(1,  1,  'Approved'),  -- Aarav Sharma    → Room 101, Ratan Tata Boys
(2,  7,  'Approved'),  -- Rahul Yadav     → Room 203, Bhagat Singh Boys
(3,  9,  'Approved'),  -- Kunal Mehta     → Room 301, Vikram Sarabhai Boys
(4,  11, 'Pending'),   -- Aditya Gupta    → Room 305, Vikram Sarabhai (waiting for approval)
(5,  5,  'Approved'),  -- Rohan Verma     → Room 201, Bhagat Singh Boys
(6,  12, 'Approved'),  -- Arjun Mishra    → Room 401, Homi Bhabha Boys
(7,  2,  'Pending'),   -- Vikram Patel    → Room 102, Ratan Tata (waiting for approval)
(8,  14, 'Approved'),  -- Riya Verma      → Room 102, Kalpana Chawla Girls
(9,  18, 'Approved'),  -- Priya Singh     → Room 204, Gargi Girls
(10, 21, 'Pending'),   -- Sneha Kapoor    → Room 306, APJ Girls (waiting for approval)
(11, 15, 'Approved'),  -- Ananya Sharma   → Room 103, Kalpana Chawla Girls
(12, 17, 'Approved');  -- Meera Iyer      → Room 201, Gargi Girls

-- two pending swap requests for demo — admin will see these on the dashboard
INSERT INTO Swap_Requests (requester_id, target_student_id, status) VALUES
(1, 2, 'Pending'),   -- Aarav wants to swap with Rahul
(8, 11, 'Pending');  -- Riya wants to swap with Ananya

-- DML example: approve a pending allocation (used for viva demo)
UPDATE Allocations SET status = 'Approved' WHERE student_id = 7;

-- DELETE example (commented out — kept here to show it for viva)
-- INSERT INTO Allocations (student_id, room_id, status) VALUES (13, 10, 'Pending');
-- DELETE FROM Allocations WHERE student_id = 13 AND room_id = 10;
