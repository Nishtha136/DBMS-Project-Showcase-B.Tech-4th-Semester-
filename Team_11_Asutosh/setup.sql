-- ============================================================
-- CBIRS DATABASE SETUP
-- Community-Based Information & Reporting System
-- ============================================================
-- Covers: it covers DDL, DML, DQL, TCL, JOINs, GROUP BY, HAVING,
--         Subqueries, Aggregate & Scalar Functions,
--         Views, Stored Procedures, Transactions, Indexing
-- ============================================================

CREATE DATABASE IF NOT EXISTS cbirs_db;
USE cbirs_db;

-- ============================================================
-- SECTION 1 : DDL — CREATE TABLES (Primary Keys & Foreign Keys)
-- ============================================================

CREATE TABLE IF NOT EXISTS USER (
    user_id    INT          AUTO_INCREMENT PRIMARY KEY,   -- PK
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,             -- Candidate Key
    password   VARCHAR(255) NOT NULL,
    role       ENUM('Admin','Citizen') DEFAULT 'Citizen',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ISSUE (
    issue_id    INT          AUTO_INCREMENT PRIMARY KEY,  -- PK
    category    VARCHAR(50)  NOT NULL,
    description TEXT,
    location    VARCHAR(200) NOT NULL,
    status      ENUM('Pending','In Progress','Resolved') DEFAULT 'Pending',
    user_id     INT          NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE   -- FK
);

CREATE TABLE IF NOT EXISTS LOST_FOUND (
    lf_id        INT          AUTO_INCREMENT PRIMARY KEY, -- PK
    item_name    VARCHAR(100) NOT NULL,
    description  TEXT,
    location     VARCHAR(200) NOT NULL,
    contact_info VARCHAR(150) NOT NULL,
    type         ENUM('Lost','Found') DEFAULT 'Lost',
    status       ENUM('Open','Claimed','Resolved') DEFAULT 'Open',
    user_id      INT          NOT NULL,
    claimed_by   INT          DEFAULT NULL,
    claimed_at   TIMESTAMP    NULL DEFAULT NULL,
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)    REFERENCES USER(user_id) ON DELETE CASCADE,
    FOREIGN KEY (claimed_by) REFERENCES USER(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS EVENT (
    event_id    INT          AUTO_INCREMENT PRIMARY KEY, -- PK
    title       VARCHAR(150) NOT NULL,
    description TEXT,
    date        DATE         NOT NULL,
    location    VARCHAR(200) NOT NULL
);

CREATE TABLE IF NOT EXISTS SERVICE (
    service_id INT          AUTO_INCREMENT PRIMARY KEY,  -- PK
    name       VARCHAR(100) NOT NULL,
    type       VARCHAR(50)  NOT NULL,
    address    VARCHAR(200) NOT NULL
);

-- ============================================================
-- SECTION 2 : INDEXING
-- Improves SELECT query performance on frequently filtered columns
-- ============================================================

CREATE INDEX idx_issue_user     ON ISSUE(user_id);      -- speeds up user-wise filtering
CREATE INDEX idx_issue_status   ON ISSUE(status);       -- speeds up status filtering
CREATE INDEX idx_issue_category ON ISSUE(category);     -- speeds up GROUP BY category
CREATE INDEX idx_lf_user        ON LOST_FOUND(user_id); -- speeds up user-wise filtering
CREATE INDEX idx_lf_type        ON LOST_FOUND(type);    -- speeds up type filtering
CREATE INDEX idx_lf_status      ON LOST_FOUND(status);  -- speeds up status filtering
CREATE INDEX idx_user_email     ON USER(email);         -- speeds up login lookup

-- ============================================================
-- SECTION 3 : VIEWS
-- Virtual tables — no data stored, always fresh
-- ============================================================

-- View 1: Full issue details with reporter name (uses JOIN internally)
CREATE OR REPLACE VIEW issue_summary_view AS
    SELECT
        I.issue_id,
        I.category,
        I.description,
        I.location,
        I.status,
        I.created_at,
        U.name  AS reporter_name,
        U.email AS reporter_email
    FROM ISSUE I
    INNER JOIN USER U ON I.user_id = U.user_id;

-- View 2: User activity summary (uses LEFT JOIN + GROUP BY internally)
CREATE OR REPLACE VIEW user_activity_view AS
    SELECT
        U.user_id,
        U.name,
        U.email,
        U.role,
        COUNT(DISTINCT I.issue_id)  AS total_issues,
        COUNT(DISTINCT L.lf_id)     AS total_lf_posts
    FROM USER U
    LEFT JOIN ISSUE      I ON U.user_id = I.user_id
    LEFT JOIN LOST_FOUND L ON U.user_id = L.user_id
    GROUP BY U.user_id, U.name, U.email, U.role;

-- ============================================================
-- SECTION 4 : STORED PROCEDURES
-- ============================================================

DELIMITER $$

-- Procedure 1: Update issue status (wraps UPDATE in a TRANSACTION)
CREATE PROCEDURE update_issue_status(
    IN p_issue_id INT,
    IN p_status   VARCHAR(20)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;   -- Roll back on any SQL error
        SELECT 'Error occurred — transaction rolled back.' AS message;
    END;

    START TRANSACTION;
        UPDATE ISSUE SET status = p_status WHERE issue_id = p_issue_id;
    COMMIT;          -- Persist the change
    SELECT CONCAT('Issue #', p_issue_id, ' updated to ', p_status) AS message;
END$$

-- Procedure 2: Get issue count per category (GROUP BY + aggregate)
CREATE PROCEDURE get_category_stats()
BEGIN
    SELECT
        category,
        COUNT(*)                                                   AS total_issues,
        SUM(CASE WHEN status = 'Resolved'    THEN 1 ELSE 0 END)  AS resolved,
        SUM(CASE WHEN status = 'Pending'     THEN 1 ELSE 0 END)  AS pending,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END)  AS in_progress
    FROM ISSUE
    GROUP BY category
    HAVING total_issues > 0        -- HAVING filters grouped results
    ORDER BY total_issues DESC;
END$$

-- Procedure 3: Delete a resolved issue (DML DELETE inside procedure)
CREATE PROCEDURE delete_resolved_issue(IN p_issue_id INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;

    START TRANSACTION;
        DELETE FROM ISSUE WHERE issue_id = p_issue_id AND status = 'Resolved';
    COMMIT;
END$$

DELIMITER ;

-- ============================================================
-- SECTION 5 : DML — Sample Data (INSERT)
-- ============================================================

INSERT IGNORE INTO USER (name, email, password, role) VALUES
('Admin User',    'admin@cbirs.com',  '$2y$10$E5JrpBs5TvH8C5QqFQ3fLeVBKD3l6wL2AQz4ZBw1Fk4MfNeGb7JmG', 'Admin'),
('John Citizen',  'john@cbirs.com',   '$2y$10$E5JrpBs5TvH8C5QqFQ3fLeVBKD3l6wL2AQz4ZBw1Fk4MfNeGb7JmG', 'Citizen'),
('Priya Sharma',  'priya@cbirs.com',  '$2y$10$E5JrpBs5TvH8C5QqFQ3fLeVBKD3l6wL2AQz4ZBw1Fk4MfNeGb7JmG', 'Citizen');

INSERT IGNORE INTO EVENT (title, description, date, location) VALUES
('Community Clean-Up Drive', 'Join us to clean the neighbourhood park.', '2026-05-20', 'Central Park'),
('Town Hall Meeting',        'Discuss civic issues with local reps.',     '2026-05-25', 'City Hall'),
('Health Camp',              'Free health check-up for all citizens.',    '2026-06-01', 'Community Centre');

INSERT IGNORE INTO SERVICE (name, type, address) VALUES
('City General Hospital',  'Hospital', '14 Medical Lane, Sector 3'),
('Central Police Station', 'Police',   '1 Law Road, Main Square'),
('Public Library',         'Library',  '22 Knowledge Street, Block B'),
('Fire Station No. 4',     'Fire',     '7 Emergency Ave, West Zone');

-- ============================================================
-- SECTION 6 : DQL — Advanced Query Examples
-- ============================================================

-- 6A. JOIN: Issues with reporter name
SELECT I.issue_id, I.category, I.status, U.name, U.email
FROM ISSUE I
INNER JOIN USER U ON I.user_id = U.user_id
ORDER BY I.created_at DESC;

-- 6B. LEFT JOIN: All users and their issue counts (including 0)
SELECT U.name, U.email, COUNT(I.issue_id) AS issue_count
FROM USER U
LEFT JOIN ISSUE I ON U.user_id = I.user_id
GROUP BY U.user_id, U.name, U.email
ORDER BY issue_count DESC;

-- 6C. GROUP BY + HAVING: Categories with more than 1 issue
SELECT category, COUNT(*) AS issue_count
FROM ISSUE
GROUP BY category
HAVING issue_count > 1
ORDER BY issue_count DESC;

-- 6D. Subquery: Users who reported MORE than the average number of issues
SELECT name, email
FROM USER
WHERE user_id IN (
    SELECT user_id
    FROM ISSUE
    GROUP BY user_id
    HAVING COUNT(*) > (
        SELECT AVG(cnt)
        FROM (SELECT COUNT(*) AS cnt FROM ISSUE GROUP BY user_id) AS sub
    )
);

-- 6E. Aggregate Functions
SELECT
    COUNT(*)                    AS total_issues,
    COUNT(DISTINCT user_id)     AS unique_reporters,
    MAX(created_at)             AS latest_report,
    MIN(created_at)             AS earliest_report
FROM ISSUE;

-- 6F. Scalar Functions (string + date)
SELECT
    issue_id,
    UPPER(category)                          AS category_upper,
    LENGTH(description)                      AS desc_length,
    DATE_FORMAT(created_at, '%D %M %Y')      AS formatted_date,
    DATEDIFF(NOW(), created_at)              AS days_since_report
FROM ISSUE;

-- 6G. Using Views
SELECT * FROM issue_summary_view WHERE status = 'Pending';
SELECT * FROM user_activity_view  ORDER BY total_issues DESC;

-- 6H. Calling Stored Procedures
CALL update_issue_status(1, 'Resolved');
CALL get_category_stats();

-- ============================================================
-- SECTION 7 : TCL — Transactions (ACID)
-- ============================================================

-- Manual transaction: update status and verify atomicity
START TRANSACTION;
    UPDATE ISSUE SET status = 'In Progress' WHERE category = 'Garbage' AND status = 'Pending';
    -- If anything goes wrong, run: ROLLBACK;
COMMIT;

-- Rollback demo:
START TRANSACTION;
    DELETE FROM ISSUE WHERE issue_id = 999; -- Non-existent, safe demo
ROLLBACK;  -- Nothing committed — atomicity preserved
