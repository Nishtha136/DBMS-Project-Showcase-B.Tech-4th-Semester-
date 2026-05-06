USE trial_1;

-- ===================== SCHEMA UPDATE =====================

-- Add approved_by column to track which admin approved each game
ALTER TABLE game ADD COLUMN IF NOT EXISTS approved_by VARCHAR(50) DEFAULT NULL;

-- ===================== VIEWS =====================

-- VIEW 1: Game Catalog (used in Player Dashboard - Available Games)
CREATE OR REPLACE VIEW vw_game_catalog AS
SELECT g.game_id, g.title, g.genre, g.price, g.release_date,
       d.studio_name AS developer_studio, u.username AS developer_name
FROM game g
JOIN developer d ON g.developer_id = d.user_id
JOIN users u ON d.user_id = u.user_id
WHERE g.approval_status = 'approved';

-- VIEW 2: Leaderboard (used in Player Dashboard - Stats tab)
CREATE OR REPLACE VIEW vw_leaderboard AS
SELECT u.username, g.title AS game_title,
       s.best_score, s.experience AS xp, s.rank_level,
       s.total_play_time, s.user_id, s.game_id
FROM player_game_stats s
JOIN users u ON s.user_id = u.user_id
JOIN game g ON s.game_id = g.game_id
ORDER BY s.game_id, s.rank_level ASC;

-- VIEW 3: Developer Revenue (used in Developer Dashboard - Summary)
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

-- VIEW 4: Transaction History (used in Admin Dashboard - Wallet)
CREATE OR REPLACE VIEW vw_transaction_history AS
SELECT t.transaction_id, u.username, t.amount, t.transaction_type,
       t.description, t.transaction_status, t.payment_method, t.created_at
FROM transaction t
JOIN users u ON t.user_id = u.user_id;

-- VIEW 5: Active Players
CREATE OR REPLACE VIEW vw_active_players AS
SELECT DISTINCT u.user_id, u.username, u.email,
       MAX(m.ended_at) AS last_played
FROM users u
JOIN participation p ON u.user_id = p.user_id
JOIN match_session m ON p.match_id = m.match_id
WHERE m.ended_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY u.user_id, u.username, u.email;

-- =============== STORED PROCEDURES ===============

-- PROCEDURE 1: Register User (used in SignUp form)
DROP PROCEDURE IF EXISTS sp_register_user;
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

-- PROCEDURE 2: Recalculate Ranks (used in FakeGame1, FakeGame2, PongGame, PlayerDashboard)
DROP PROCEDURE IF EXISTS sp_recalculate_ranks;
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

-- PROCEDURE 3: Purchase Game
DROP PROCEDURE IF EXISTS sp_purchase_game;
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

-- PROCEDURE 4: Get Player Stats (OUT params demo)
DROP PROCEDURE IF EXISTS sp_get_player_stats;
DELIMITER //
CREATE PROCEDURE sp_get_player_stats(
    IN p_user_id VARCHAR(50),
    OUT p_total_games INT,
    OUT p_total_matches INT,
    OUT p_win_rate DECIMAL(5,2)
)
BEGIN
    SELECT COUNT(DISTINCT game_id) INTO p_total_games FROM purchase WHERE user_id = p_user_id;
    SELECT COUNT(*) INTO p_total_matches FROM participation WHERE user_id = p_user_id;
    SELECT IFNULL(ROUND(SUM(CASE WHEN result='win' THEN 1 ELSE 0 END)*100.0/NULLIF(COUNT(*),0),2),0)
        INTO p_win_rate FROM participation WHERE user_id = p_user_id;
END //
DELIMITER ;

-- =============== INDEXES ===============

CREATE INDEX idx_game_status ON game(approval_status);
CREATE INDEX idx_purchase_user ON purchase(user_id);
CREATE INDEX idx_purchase_game ON purchase(game_id);
CREATE INDEX idx_participation_user ON participation(user_id);
CREATE INDEX idx_transaction_user ON transaction(user_id);
CREATE INDEX idx_friendship_user1 ON friendship(user_id_1);
CREATE INDEX idx_friendship_user2 ON friendship(user_id_2);


