-- Add New Users
INSERT IGNORE INTO users (user_id, username, email, password) VALUES
('p_111', 'pro_gamer', 'p111@gameverse.com', 'pass'),
('p_112', 'noob_master', 'p112@gameverse.com', 'pass'),
('p_113', 'ninja_23', 'p113@gameverse.com', 'pass'),
('p_114', 'headshot_king', 'p114@gameverse.com', 'pass'),
('p_115', 'casual_play', 'p115@gameverse.com', 'pass');

-- Add Players & Wallets
INSERT IGNORE INTO player (user_id) VALUES
('p_111'), ('p_112'), ('p_113'), ('p_114'), ('p_115');

INSERT IGNORE INTO wallet (user_id, balance) VALUES
('p_111', 5000), ('p_112', 1000), ('p_113', 3000), ('p_114', 4500), ('p_115', 2000);

-- Add Purchases (Games 1, 2, 26, 27)
INSERT IGNORE INTO purchase (user_id, game_id, price, purchase_date) VALUES
('p_111', 1, 50.00, NOW()), ('p_111', 2, 60.00, NOW()), ('p_111', 26, 10.00, NOW()), ('p_111', 27, 10.00, NOW()),
('p_112', 1, 50.00, NOW()), ('p_112', 26, 10.00, NOW()), ('p_112', 27, 10.00, NOW()),
('p_113', 2, 60.00, NOW()), ('p_113', 26, 10.00, NOW()), ('p_113', 27, 10.00, NOW()),
('p_114', 1, 50.00, NOW()), ('p_114', 2, 60.00, NOW()), ('p_114', 27, 10.00, NOW()),
('p_115', 26, 10.00, NOW()), ('p_115', 27, 10.00, NOW());

-- Add Matches and Participation
-- Game 1 (Call of Duty)
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(1, NOW(), NOW(), 1200, 'completed'), (1, NOW(), NOW(), 1500, 'completed'), (1, NOW(), NOW(), 900, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1; SET @m3 = @m1+2;
INSERT INTO participation VALUES (@m1,'p_111',850,'win'), (@m2,'p_112',150,'loss'), (@m3,'p_114',600,'win');

-- Game 2 (GTA V)
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(2, NOW(), NOW(), 2400, 'completed'), (2, NOW(), NOW(), 1800, 'completed'), (2, NOW(), NOW(), 3000, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1; SET @m3 = @m1+2;
INSERT INTO participation VALUES (@m1,'p_111',920,'win'), (@m2,'p_113',400,'loss'), (@m3,'p_114',750,'win');

-- Game 26 (Game A)
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(26, NOW(), NOW(), 15, 'completed'), (26, NOW(), NOW(), 25, 'completed'), (26, NOW(), NOW(), 10, 'completed'), (26, NOW(), NOW(), 20, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1; SET @m3 = @m1+2; SET @m4 = @m1+3;
INSERT INTO participation VALUES (@m1,'p_111',150,'win'), (@m2,'p_112',5,'loss'), (@m3,'p_113',85,'win'), (@m4,'p_115',20,'loss');

-- Game 27 (Game B)
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(27, NOW(), NOW(), 10, 'completed'), (27, NOW(), NOW(), 15, 'completed'), (27, NOW(), NOW(), 12, 'completed'), (27, NOW(), NOW(), 8, 'completed'), (27, NOW(), NOW(), 20, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1; SET @m3 = @m1+2; SET @m4 = @m1+3; SET @m5 = @m1+4;
INSERT INTO participation VALUES (@m1,'p_111',25,'win'), (@m2,'p_112',2,'loss'), (@m3,'p_113',18,'win'), (@m4,'p_114',10,'win'), (@m5,'p_115',1,'loss');


-- Delete and Rebuild player_game_stats
DELETE FROM player_game_stats;

INSERT INTO player_game_stats (user_id, game_id, total_play_time, experience, rank_level, best_score)
SELECT 
    p.user_id,
    m.game_id,
    SUM(m.duration) AS total_play_time,
    SUM(p.score) AS experience,
    1 AS rank_level,
    MAX(p.score) AS best_score
FROM participation p
JOIN match_session m ON p.match_id = m.match_id
GROUP BY p.user_id, m.game_id;

UPDATE player_game_stats pgs
JOIN (
    SELECT user_id, game_id,
           ROW_NUMBER() OVER (PARTITION BY game_id ORDER BY best_score DESC) AS rn
    FROM player_game_stats
) ranked ON pgs.user_id = ranked.user_id AND pgs.game_id = ranked.game_id
SET pgs.rank_level = ranked.rn;
