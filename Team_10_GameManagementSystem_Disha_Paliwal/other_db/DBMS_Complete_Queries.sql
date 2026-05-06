-- ================================================================
-- GAME MANAGEMENT SYSTEM — COMPLETE DBMS IMPLEMENTATION
-- Database: trial_1 | Engine: MySQL/InnoDB
-- ================================================================
-- Covers: DDL, DML, DQL, TCL, Joins, Group By, Having,
--         Subqueries, Functions, Views, Stored Procedures,
--         Transactions, Indexing, Keys, Normalization
-- ================================================================

-- ████████████████████████████████████████████████████████████████
-- SECTION 1: ER DIAGRAM DESCRIPTION
-- ████████████████████████████████████████████████████████████████
-- ENTITIES & RELATIONSHIPS:
--
-- users ──(1:1)──> player        (ISA / Specialization)
-- users ──(1:1)──> developer     (ISA / Specialization)
-- users ──(1:1)──> admin         (ISA / Specialization)
-- users ──(1:1)──> wallet
-- developer ──(1:N)──> game
-- game ──(M:N)──> users  via BRIDGE TABLE: purchase
-- game ──(1:N)──> match_session
-- match_session ──(M:N)──> users  via BRIDGE TABLE: participation
-- users ──(M:N)──> users  via BRIDGE TABLE: friendship  (Self-Referencing M:N)
-- users ──(1:N)──> transaction
-- player ──(M:N)──> game  via BRIDGE TABLE: player_game_stats
--
-- CARDINALITY SUMMARY:
--   1:1  → users-wallet, users-player, users-developer, users-admin
--   1:N  → developer-game, game-match_session, users-transaction
--   M:N  → users-game (purchase), match-users (participation),
--          users-users (friendship), player-game (stats)

-- ████████████████████████████████████████████████████████████████
-- SECTION 2: NORMALIZATION PROOF
-- ████████████████████████████████████████████████████████████████
-- 1NF: ✅ All columns have atomic values, no repeating groups.
--      Each table has a PRIMARY KEY.
-- 2NF: ✅ No partial dependency. Non-key attributes depend on the
--      FULL primary key (e.g. participation PK = match_id+user_id,
--      score depends on both, not just one).
-- 3NF: ✅ No transitive dependency. Example: game.developer_id is
--      a FK, studio_name is stored in developer table (not game).
--      wallet.balance depends on user_id directly, not via username.

-- ████████████████████████████████████████████████████████████████
-- SECTION 3: DDL — DATA DEFINITION LANGUAGE
-- ████████████████████████████████████████████████████████████████

CREATE DATABASE IF NOT EXISTS trial_1;
USE trial_1;

-- 3.1 CREATE TABLES (with PK, FK, UNIQUE, NOT NULL, DEFAULT, CHECK, ENUM, AUTO_INCREMENT)

CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(50) PRIMARY KEY,                          -- PK
    username VARCHAR(100) NOT NULL UNIQUE,                    -- UNIQUE + NOT NULL
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    account_status ENUM('active','suspended','banned') DEFAULT 'active',  -- ENUM + DEFAULT
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS player (
    user_id VARCHAR(50) PRIMARY KEY,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE    -- FK with CASCADE
);

CREATE TABLE IF NOT EXISTS developer (
    user_id VARCHAR(50) PRIMARY KEY,
    studio_name VARCHAR(100) DEFAULT 'New Studio',
    verification_status ENUM('pending','verified','rejected') DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin (
    user_id VARCHAR(50) PRIMARY KEY,
    role VARCHAR(50) DEFAULT 'admin',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wallet (
    wallet_id INT AUTO_INCREMENT PRIMARY KEY,                 -- AUTO_INCREMENT
    user_id VARCHAR(50) NOT NULL UNIQUE,
    balance DECIMAL(12,2) DEFAULT 0.00 CHECK (balance >= 0),  -- CHECK constraint
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS game (
    game_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    genre VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),          -- CHECK
    release_date DATE,
    developer_id VARCHAR(50) NOT NULL,
    approval_status ENUM('pending','approved','rejected') DEFAULT 'pending',
    FOREIGN KEY (developer_id) REFERENCES developer(user_id) ON DELETE CASCADE
);

-- BRIDGE TABLE for M:N relationship: users <-> game
CREATE TABLE IF NOT EXISTS purchase (
    purchase_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    game_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (game_id) REFERENCES game(game_id),
    UNIQUE KEY unique_purchase (user_id, game_id)             -- Composite UNIQUE
);

CREATE TABLE IF NOT EXISTS match_session (
    match_id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    started_at DATETIME,
    ended_at DATETIME,
    duration INT DEFAULT 0,
    match_status ENUM('in_progress','completed','cancelled') DEFAULT 'completed',
    FOREIGN KEY (game_id) REFERENCES game(game_id)
);

-- BRIDGE TABLE for M:N relationship: match_session <-> users
CREATE TABLE IF NOT EXISTS participation (
    match_id INT NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    score INT DEFAULT 0,
    result ENUM('win','loss','draw') NOT NULL,
    PRIMARY KEY (match_id, user_id),                          -- Composite PK
    FOREIGN KEY (match_id) REFERENCES match_session(match_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS player_game_stats (
    user_id VARCHAR(50) NOT NULL,
    game_id INT NOT NULL,
    total_play_time INT DEFAULT 0,
    experience INT DEFAULT 0,
    rank_level INT DEFAULT 1,
    best_score INT DEFAULT 0,
    PRIMARY KEY (user_id, game_id),                           -- Composite PK
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (game_id) REFERENCES game(game_id)
);

CREATE TABLE IF NOT EXISTS friendship (
    friendship_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id_1 VARCHAR(50) NOT NULL,
    user_id_2 VARCHAR(50) NOT NULL,
    status ENUM('pending','accepted','declined') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id_1) REFERENCES users(user_id),
    FOREIGN KEY (user_id_2) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS transaction (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    transaction_type ENUM('deposit','purchase','credit','withdrawal') NOT NULL,
    description VARCHAR(200),
    reference_id VARCHAR(100),
    payment_method VARCHAR(50) DEFAULT 'Wallet',
    transaction_status ENUM('pending','completed','failed') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 3.2 ALTER TABLE
ALTER TABLE game ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.00;

-- 3.3 DROP (commented for safety)
-- DROP TABLE IF EXISTS temp_table;
-- TRUNCATE TABLE temp_table;

-- ████████████████████████████████████████████████████████████████
-- SECTION 4: INDEXING
-- ████████████████████████████████████████████████████████████████

-- Speeds up login query (WHERE username=? AND password=?)
CREATE INDEX idx_users_login ON users(username, password);

-- Speeds up game filtering by status
CREATE INDEX idx_game_status ON game(approval_status);

-- Speeds up purchase lookups
CREATE INDEX idx_purchase_user ON purchase(user_id);
CREATE INDEX idx_purchase_game ON purchase(game_id);

-- Speeds up match history queries
CREATE INDEX idx_participation_user ON participation(user_id);

-- Speeds up transaction history
CREATE INDEX idx_transaction_user ON transaction(user_id);

-- Speeds up friendship queries
CREATE INDEX idx_friendship_user1 ON friendship(user_id_1);
CREATE INDEX idx_friendship_user2 ON friendship(user_id_2);

-- View existing indexes
SHOW INDEX FROM game;
SHOW INDEX FROM purchase;

-- ████████████████████████████████████████████████████████████████
-- SECTION 5: VIEWS
-- ████████████████████████████████████████████████████████████████

-- VIEW 1: Game Catalog with Developer Info (used in Player Dashboard)
CREATE OR REPLACE VIEW vw_game_catalog AS
SELECT g.game_id, g.title, g.genre, g.price, g.release_date,
       d.studio_name AS developer_studio, u.username AS developer_name
FROM game g
JOIN developer d ON g.developer_id = d.user_id
JOIN users u ON d.user_id = u.user_id
WHERE g.approval_status = 'approved';

-- VIEW 2: Player Leaderboard per Game (used in Player Dashboard Stats)
CREATE OR REPLACE VIEW vw_leaderboard AS
SELECT u.username, g.title AS game_title,
       s.best_score, s.experience AS xp, s.rank_level,
       s.total_play_time, s.user_id, s.game_id
FROM player_game_stats s
JOIN users u ON s.user_id = u.user_id
JOIN game g ON s.game_id = g.game_id
ORDER BY s.game_id, s.rank_level ASC;

-- VIEW 3: Developer Revenue Summary (used in Developer Dashboard)
CREATE OR REPLACE VIEW vw_developer_revenue AS
SELECT d.user_id AS developer_id, u.username AS developer_name,
       d.studio_name,
       COUNT(DISTINCT g.game_id) AS total_games,
       COUNT(DISTINCT p.purchase_id) AS total_sales,
       IFNULL(SUM(p.price), 0) AS total_revenue
FROM developer d
JOIN users u ON d.user_id = u.user_id
LEFT JOIN game g ON g.developer_id = d.user_id AND g.approval_status = 'approved'
LEFT JOIN purchase p ON p.game_id = g.game_id
GROUP BY d.user_id, u.username, d.studio_name;

-- VIEW 4: Active Players (players who played in last 30 days)
CREATE OR REPLACE VIEW vw_active_players AS
SELECT DISTINCT u.user_id, u.username, u.email,
       MAX(m.ended_at) AS last_played
FROM users u
JOIN participation p ON u.user_id = p.user_id
JOIN match_session m ON p.match_id = m.match_id
WHERE m.ended_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY u.user_id, u.username, u.email;

-- VIEW 5: Transaction History with User Info
CREATE OR REPLACE VIEW vw_transaction_history AS
SELECT t.transaction_id, u.username, t.amount, t.transaction_type,
       t.description, t.transaction_status, t.payment_method, t.created_at
FROM transaction t
JOIN users u ON t.user_id = u.user_id;

-- Using views:
SELECT * FROM vw_game_catalog;
SELECT * FROM vw_leaderboard WHERE game_id = 1;
SELECT * FROM vw_developer_revenue ORDER BY total_revenue DESC;

-- ████████████████████████████████████████████████████████████████
-- SECTION 6: STORED PROCEDURES
-- ████████████████████████████████████████████████████████████████

-- PROCEDURE 1: Register New User (with Transaction)
DELIMITER //
CREATE PROCEDURE sp_register_user(
    IN p_user_id VARCHAR(50),
    IN p_username VARCHAR(100),
    IN p_email VARCHAR(150),
    IN p_password VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Registration failed';
    END;

    START TRANSACTION;
        INSERT INTO users(user_id, username, email, password) VALUES(p_user_id, p_username, p_email, p_password);
        INSERT INTO wallet(user_id, balance) VALUES(p_user_id, 0);

        IF p_user_id LIKE 'p_%' THEN
            INSERT INTO player(user_id) VALUES(p_user_id);
        ELSEIF p_user_id LIKE 'd_%' THEN
            INSERT INTO developer(user_id, studio_name) VALUES(p_user_id, 'New Studio');
        ELSEIF p_user_id LIKE 'a_%' THEN
            INSERT INTO admin(user_id, role) VALUES(p_user_id, 'admin');
        END IF;
    COMMIT;
END //
DELIMITER ;

-- PROCEDURE 2: Purchase Game (with balance check + transaction logging)
DELIMITER //
CREATE PROCEDURE sp_purchase_game(
    IN p_user_id VARCHAR(50),
    IN p_game_id INT
)
BEGIN
    DECLARE v_price DECIMAL(10,2);
    DECLARE v_balance DECIMAL(10,2);
    DECLARE v_title VARCHAR(150);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Purchase failed. Rolled back.';
    END;

    SELECT price, title INTO v_price, v_title FROM game WHERE game_id = p_game_id;
    SELECT balance INTO v_balance FROM wallet WHERE user_id = p_user_id;

    IF v_balance < v_price THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient balance';
    END IF;

    START TRANSACTION;
        UPDATE wallet SET balance = balance - v_price WHERE user_id = p_user_id;
        INSERT INTO purchase(user_id, game_id, price, purchase_date) VALUES(p_user_id, p_game_id, v_price, NOW());
        INSERT INTO transaction(user_id, amount, transaction_type, description, reference_id, payment_method, transaction_status)
            VALUES(p_user_id, v_price, 'purchase', CONCAT('Purchased: ', v_title), CONCAT('GAME-', p_game_id), 'Gameverse Wallet', 'completed');
    COMMIT;
END //
DELIMITER ;

-- PROCEDURE 3: Get Player Stats (uses OUT parameters)
DELIMITER //
CREATE PROCEDURE sp_get_player_stats(
    IN p_user_id VARCHAR(50),
    OUT p_total_games INT,
    OUT p_total_matches INT,
    OUT p_win_rate DECIMAL(5,2)
)
BEGIN
    SELECT COUNT(DISTINCT game_id) INTO p_total_games
    FROM purchase WHERE user_id = p_user_id;

    SELECT COUNT(*) INTO p_total_matches
    FROM participation WHERE user_id = p_user_id;

    SELECT IFNULL(
        ROUND(SUM(CASE WHEN result='win' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*),0), 2),
    0) INTO p_win_rate
    FROM participation WHERE user_id = p_user_id;
END //
DELIMITER ;

-- PROCEDURE 4: Recalculate Rankings for a Game
DELIMITER //
CREATE PROCEDURE sp_recalculate_ranks(IN p_game_id INT)
BEGIN
    UPDATE player_game_stats pgs
    JOIN (
        SELECT user_id, game_id,
               ROW_NUMBER() OVER (PARTITION BY game_id ORDER BY best_score DESC) AS rn
        FROM player_game_stats WHERE game_id = p_game_id
    ) ranked ON pgs.user_id = ranked.user_id AND pgs.game_id = ranked.game_id
    SET pgs.rank_level = ranked.rn;
END //
DELIMITER ;

-- Calling procedures:
-- CALL sp_register_user('p_999', 'test_player', 'test@email.com', 'pass123');
-- CALL sp_purchase_game('p_102', 1);
-- CALL sp_get_player_stats('p_102', @games, @matches, @winrate);
-- SELECT @games, @matches, @winrate;
-- CALL sp_recalculate_ranks(1);

-- ████████████████████████████████████████████████████████████████
-- SECTION 7: DML — DATA MANIPULATION LANGUAGE
-- ████████████████████████████████████████████████████████████████

-- 7.1 INSERT
INSERT IGNORE INTO users VALUES('p_999','test_user','test@test.com','pass123','active',NOW());

-- 7.2 INSERT with Subquery
INSERT IGNORE INTO wallet(user_id, balance)
SELECT user_id, 0 FROM users WHERE user_id NOT IN (SELECT user_id FROM wallet);

-- 7.3 UPDATE
UPDATE wallet SET balance = balance + 500 WHERE user_id = 'p_999';

-- 7.4 UPDATE with JOIN
UPDATE game g
JOIN developer d ON g.developer_id = d.user_id
SET g.rating = 4.5
WHERE d.studio_name = 'New Studio' AND g.approval_status = 'approved';

-- 7.5 DELETE
DELETE FROM users WHERE user_id = 'p_999';

-- ████████████████████████████████████████████████████████████████
-- SECTION 8: DQL + JOINS + GROUP BY + HAVING + SUBQUERIES + FUNCTIONS
-- ████████████████████████████████████████████████████████████████

-- 8.1 BASIC SELECT with WHERE, ORDER BY, LIMIT
SELECT user_id, username, email FROM users WHERE account_status = 'active' ORDER BY username LIMIT 10;

-- 8.2 SELECT DISTINCT
SELECT DISTINCT genre FROM game WHERE approval_status = 'approved';

-- 8.3 LIKE, IN, BETWEEN
SELECT * FROM game WHERE title LIKE '%Game%';
SELECT * FROM users WHERE user_id IN ('p_101','p_102','p_103');
SELECT * FROM game WHERE price BETWEEN 10 AND 50;

-- 8.4 INNER JOIN — Players with their purchased games
SELECT u.username, g.title, p.price, p.purchase_date
FROM purchase p
INNER JOIN users u ON p.user_id = u.user_id
INNER JOIN game g ON p.game_id = g.game_id;

-- 8.5 LEFT JOIN — All games, even those with no purchases
SELECT g.title, g.price, COUNT(p.purchase_id) AS times_bought
FROM game g
LEFT JOIN purchase p ON g.game_id = p.game_id
WHERE g.approval_status = 'approved'
GROUP BY g.game_id;

-- 8.6 RIGHT JOIN — All users, even those without wallets
SELECT u.username, w.balance
FROM wallet w
RIGHT JOIN users u ON w.user_id = u.user_id;

-- 8.7 SELF JOIN — Mutual friendships
SELECT u1.username AS player1, u2.username AS player2, f.status
FROM friendship f
JOIN users u1 ON f.user_id_1 = u1.user_id
JOIN users u2 ON f.user_id_2 = u2.user_id
WHERE f.status = 'accepted';

-- 8.8 CROSS JOIN — All possible player-game combinations (limited)
SELECT u.username, g.title
FROM users u
CROSS JOIN game g
WHERE u.user_id LIKE 'p_%' AND g.approval_status = 'approved'
LIMIT 20;

-- 8.9 Multi-table JOIN (3+ tables)
SELECT u.username, g.title, pt.score, pt.result, ms.duration
FROM participation pt
JOIN match_session ms ON pt.match_id = ms.match_id
JOIN game g ON ms.game_id = g.game_id
JOIN users u ON pt.user_id = u.user_id
ORDER BY pt.score DESC LIMIT 10;

-- 8.10 GROUP BY with Aggregate Functions (COUNT, SUM, AVG, MIN, MAX)
SELECT g.title,
       COUNT(p.purchase_id) AS total_purchases,
       SUM(p.price) AS total_revenue,
       AVG(p.price) AS avg_price,
       MIN(p.purchase_date) AS first_purchase,
       MAX(p.purchase_date) AS last_purchase
FROM game g
JOIN purchase p ON g.game_id = p.game_id
GROUP BY g.game_id, g.title;

-- 8.11 GROUP BY with HAVING (filter groups)
SELECT g.title, COUNT(p.purchase_id) AS sales
FROM game g
JOIN purchase p ON g.game_id = p.game_id
GROUP BY g.game_id
HAVING sales >= 5;

-- 8.12 GROUP BY + HAVING — Developers earning more than ₹100
SELECT u.username AS developer, SUM(p.price) AS revenue
FROM purchase p
JOIN game g ON p.game_id = g.game_id
JOIN users u ON g.developer_id = u.user_id
GROUP BY g.developer_id
HAVING revenue > 100
ORDER BY revenue DESC;

-- 8.13 Subquery in WHERE (players who purchased more than 3 games)
SELECT username FROM users
WHERE user_id IN (
    SELECT user_id FROM purchase GROUP BY user_id HAVING COUNT(*) > 3
);

-- 8.14 Correlated Subquery (each player's best score across all games)
SELECT u.username,
    (SELECT MAX(s.best_score) FROM player_game_stats s WHERE s.user_id = u.user_id) AS overall_best
FROM users u
WHERE u.user_id LIKE 'p_%';

-- 8.15 Subquery in FROM (derived table)
SELECT top_players.username, top_players.total_xp
FROM (
    SELECT u.username, SUM(s.experience) AS total_xp
    FROM player_game_stats s
    JOIN users u ON s.user_id = u.user_id
    GROUP BY s.user_id
) AS top_players
WHERE top_players.total_xp > 100
ORDER BY top_players.total_xp DESC;

-- 8.16 EXISTS subquery
SELECT u.username FROM users u
WHERE EXISTS (SELECT 1 FROM purchase p WHERE p.user_id = u.user_id);

-- 8.17 COUNT(DISTINCT)
SELECT COUNT(DISTINCT user_id) AS unique_players FROM participation;
SELECT COUNT(DISTINCT game_id) AS games_with_matches FROM match_session;

-- 8.18 SUM with CASE WHEN
SELECT u.username,
       SUM(CASE WHEN pt.result = 'win' THEN 1 ELSE 0 END) AS wins,
       SUM(CASE WHEN pt.result = 'loss' THEN 1 ELSE 0 END) AS losses,
       COUNT(*) AS total_matches
FROM participation pt
JOIN users u ON pt.user_id = u.user_id
GROUP BY pt.user_id
ORDER BY wins DESC;

-- 8.19 Scalar Functions
SELECT UPPER(username) AS name_upper, LENGTH(email) AS email_length,
       CONCAT(username, ' (', email, ')') AS full_info
FROM users LIMIT 5;

SELECT title, ROUND(price, 0) AS rounded_price, CEIL(price) AS ceil_price
FROM game LIMIT 5;

-- 8.20 Date Functions
SELECT username, created_at,
       DATEDIFF(NOW(), created_at) AS days_since_join,
       DATE_FORMAT(created_at, '%d-%b-%Y') AS formatted_date
FROM users LIMIT 5;

-- 8.21 IFNULL / COALESCE
SELECT u.username, IFNULL(w.balance, 0) AS balance,
       COALESCE(u.account_status, 'unknown') AS status
FROM users u LEFT JOIN wallet w ON u.user_id = w.user_id;

-- ████████████████████████████████████████████████████████████████
-- SECTION 9: TRANSACTIONS — TCL (ACID PROPERTIES)
-- ████████████████████████████████████████████████████████████████
-- ACID:
-- Atomicity   → All or nothing (BEGIN + COMMIT/ROLLBACK)
-- Consistency  → Constraints enforced (CHECK, FK, UNIQUE)
-- Isolation    → Concurrent transactions don't interfere
-- Durability   → Committed data persists

-- 9.1 Transaction with COMMIT
START TRANSACTION;
    UPDATE wallet SET balance = balance - 50 WHERE user_id = 'p_102';
    INSERT INTO transaction(user_id, amount, transaction_type, description, transaction_status)
        VALUES('p_102', 50, 'purchase', 'Demo purchase', 'completed');
COMMIT;

-- 9.2 Transaction with ROLLBACK
START TRANSACTION;
    UPDATE wallet SET balance = balance - 99999 WHERE user_id = 'p_102';
    -- Oops, not enough money — undo everything
ROLLBACK;

-- 9.3 Transaction with SAVEPOINT
START TRANSACTION;
    UPDATE wallet SET balance = balance + 100 WHERE user_id = 'p_102';
    SAVEPOINT after_deposit;

    UPDATE wallet SET balance = balance - 200 WHERE user_id = 'p_102';
    -- Undo only the withdrawal, keep the deposit
    ROLLBACK TO SAVEPOINT after_deposit;
COMMIT;
-- Result: Only the +100 deposit was applied

