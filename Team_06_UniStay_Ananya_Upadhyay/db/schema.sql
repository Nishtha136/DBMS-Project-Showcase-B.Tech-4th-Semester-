-- hostel database setup — defines all tables, constraints, and indexes
-- run this first before seed.sql or advanced.sql

CREATE DATABASE IF NOT EXISTS hostel_db;
USE hostel_db;

-- drop tables in reverse dependency order so foreign key constraints don't block deletion
DROP TABLE IF EXISTS Swap_Requests;
DROP TABLE IF EXISTS Allocations;
DROP TABLE IF EXISTS Rooms;
DROP TABLE IF EXISTS Hostels;
DROP TABLE IF EXISTS Students;
DROP TABLE IF EXISTS Admins;

-- store warden/admin accounts
CREATE TABLE Admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,  -- unique id for each admin
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,       -- email used to log in, must be unique
    password VARCHAR(255) NOT NULL            -- stored as bcrypt hash in production (Antigravity[AI Tool by Google])
);

-- store all registered students
CREATE TABLE Students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),  -- used to match student to correct hostel
    course VARCHAR(100) NOT NULL,
    year INT CHECK (year >= 1 AND year <= 5),   -- academic year, 1 to 5 only
    contact_number VARCHAR(15) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,          -- unique login identifier
    password VARCHAR(255) NOT NULL
);

-- store each hostel building on campus
CREATE TABLE Hostels (
    hostel_id INT AUTO_INCREMENT PRIMARY KEY,
    hostel_name VARCHAR(100) NOT NULL,
    gender_type VARCHAR(10) CHECK (gender_type IN ('Boys', 'Girls', 'Co-ed')),  -- controls which students can be allocated here
    hostel_type VARCHAR(50)   -- e.g., AC or Non-AC
);

-- store rooms inside each hostel
CREATE TABLE Rooms (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL,
    capacity INT CHECK (capacity > 0),   -- max students allowed in this room
    hostel_id INT NOT NULL,              -- link room to its hostel
    FOREIGN KEY (hostel_id) REFERENCES Hostels(hostel_id) ON DELETE CASCADE,  -- delete rooms if hostel is removed
    UNIQUE(room_number, hostel_id)       -- same room number can exist in different hostels, not in the same one (learnt from ai)
);

-- track which student is assigned to which room
CREATE TABLE Allocations (
    allocation_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNIQUE NOT NULL,   -- one student can only have one allocation at a time
    room_id INT NOT NULL,
    allocation_date DATE DEFAULT (CURRENT_DATE),
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES Rooms(room_id) ON DELETE CASCADE
);

-- track room swap requests between students
CREATE TABLE Swap_Requests (
    swap_id INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT NOT NULL,          -- student who initiated the swap
    target_student_id INT NOT NULL,     -- student they want to swap with
    target_consent BOOLEAN DEFAULT FALSE,  -- target must agree before admin can approve
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    admin_id INT,                        -- which admin processed this swap (set on approve/reject)
    request_date DATE DEFAULT (CURRENT_DATE),
    FOREIGN KEY (requester_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (target_student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES Admins(admin_id) ON DELETE SET NULL,  -- keep swap record even if admin is deleted
    CHECK (requester_id != target_student_id)  -- can't swap with yourself
);

-- indexes to speed up the most common lookups
CREATE INDEX idx_student_email ON Students(email);          -- used on every login
CREATE INDEX idx_allocation_status ON Allocations(status); -- admin filters by status frequently
CREATE INDEX idx_room_hostel ON Rooms(hostel_id);          -- finding all rooms in a hostel
CREATE INDEX idx_swap_status ON Swap_Requests(status);     -- admin filters pending swaps
