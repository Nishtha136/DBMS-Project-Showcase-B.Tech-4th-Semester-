-- ==========================================================
-- FINAL DATABASE SCHEMA AND LOGIC UPDATES
-- (Run this if you ever recreate the trial_1 database)
-- ==========================================================

-- 1. ADD MISSING DEVELOPERS TO WALLET
INSERT IGNORE INTO wallet (user_id, balance) VALUES 
('d_211', 1000), ('d_212', 1000), ('d_213', 1000), ('d_214', 1000), ('d_215', 1000);

-- 2. UPDATE TRANSACTION TABLE SCHEMA (if not already updated)
-- Adds description, payment_method, and created_at timestamps.
-- (Note: If you already ran these via the AI, this will throw an error, which is fine)
ALTER TABLE transaction 
ADD COLUMN description VARCHAR(200) DEFAULT NULL AFTER transaction_type,
ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Wallet' AFTER description,
ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP AFTER transaction_status;

-- 3. REBUILD PLAYER_GAME_STATS LOGIC (Playtime = count, XP = 50 for win, 10 for loss)
DELETE FROM player_game_stats;

INSERT INTO player_game_stats (user_id, game_id, total_play_time, experience, rank_level, best_score)
SELECT 
    p.user_id,
    m.game_id,
    COUNT(m.match_id) AS total_play_time,
    SUM(CASE WHEN p.result = 'win' THEN 50 ELSE 10 END) AS experience,
    1 AS rank_level,
    MAX(p.score) AS best_score
FROM participation p
JOIN match_session m ON p.match_id = m.match_id
GROUP BY p.user_id, m.game_id;

-- Recalculate rank_level based on best_score
UPDATE player_game_stats pgs
JOIN (
    SELECT user_id, game_id,
           ROW_NUMBER() OVER (PARTITION BY game_id ORDER BY best_score DESC) AS rn
    FROM player_game_stats
) ranked ON pgs.user_id = ranked.user_id AND pgs.game_id = ranked.game_id
SET pgs.rank_level = ranked.rn;

-- 4. FIX EXISTING TRANSACTIONS (Setting Dummy Payment Methods)
UPDATE transaction 
SET payment_method = 'Bank Transfer', 
    reference_id = CONCAT('BANK-', LPAD(FLOOR(RAND() * 99999999), 8, '0')) 
WHERE transaction_type = 'deposit';

UPDATE transaction 
SET payment_method = 'Gameverse Wallet', 
    reference_id = CONCAT('GAME-', LPAD(FLOOR(RAND() * 99999999), 8, '0')) 
WHERE transaction_type = 'purchase';
