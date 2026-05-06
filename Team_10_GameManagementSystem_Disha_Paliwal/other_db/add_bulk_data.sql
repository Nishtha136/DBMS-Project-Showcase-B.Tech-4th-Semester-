-- =====================================================
-- STEP 1: Add 15 New Players (making it 30 total) & 5 New Developers (making it 15 total)
-- =====================================================

INSERT IGNORE INTO users (user_id, username, email, password, account_status) VALUES
('p_116', 'ghost_rider', 'p116@gameverse.com', 'pass', 'active'),
('p_117', 'shadow_hunter', 'p117@gameverse.com', 'pass', 'active'),
('p_118', 'dragon_slayer', 'p118@gameverse.com', 'pass', 'active'),
('p_119', 'cyber_punk', 'p119@gameverse.com', 'pass', 'active'),
('p_120', 'night_hawk', 'p120@gameverse.com', 'pass', 'active'),
('p_121', 'iron_fist', 'p121@gameverse.com', 'pass', 'active'),
('p_122', 'silent_assassin', 'p122@gameverse.com', 'pass', 'active'),
('p_123', 'crazy_frog', 'p123@gameverse.com', 'pass', 'active'),
('p_124', 'speed_demon', 'p124@gameverse.com', 'pass', 'active'),
('p_125', 'magic_mage', 'p125@gameverse.com', 'pass', 'active'),
('p_126', 'sniper_wolf', 'p126@gameverse.com', 'pass', 'active'),
('p_127', 'tank_buster', 'p127@gameverse.com', 'pass', 'active'),
('p_128', 'healer_main', 'p128@gameverse.com', 'pass', 'active'),
('p_129', 'stealth_pro', 'p129@gameverse.com', 'pass', 'active'),
('p_130', 'loot_goblin', 'p130@gameverse.com', 'pass', 'active'),
('d_211', 'dev11', 'dev11@gameverse.com', 'pass', 'active'),
('d_212', 'dev12', 'dev12@gameverse.com', 'pass', 'active'),
('d_213', 'dev13', 'dev13@gameverse.com', 'pass', 'active'),
('d_214', 'dev14', 'dev14@gameverse.com', 'pass', 'active'),
('d_215', 'dev15', 'dev15@gameverse.com', 'pass', 'active');

-- Step 2: Populate player, wallet, and developer profiles
INSERT IGNORE INTO player (user_id) VALUES
('p_116'), ('p_117'), ('p_118'), ('p_119'), ('p_120'),
('p_121'), ('p_122'), ('p_123'), ('p_124'), ('p_125'),
('p_126'), ('p_127'), ('p_128'), ('p_129'), ('p_130');

INSERT IGNORE INTO wallet (user_id, balance) VALUES
('p_116', 5000), ('p_117', 5000), ('p_118', 5000), ('p_119', 5000), ('p_120', 5000),
('p_121', 5000), ('p_122', 5000), ('p_123', 5000), ('p_124', 5000), ('p_125', 5000),
('p_126', 5000), ('p_127', 5000), ('p_128', 5000), ('p_129', 5000), ('p_130', 5000);

INSERT IGNORE INTO developer (user_id, studio_name, verification_status) VALUES
('d_211', 'Studio Eclipse', 'verified'),
('d_212', 'Studio Zenith', 'verified'),
('d_213', 'Studio Horizon', 'verified'),
('d_214', 'Studio Apex', 'verified'),
('d_215', 'Studio Vanguard', 'verified');


-- =====================================================
-- STEP 3: Add 5 New Games for the 5 New Developers
-- =====================================================
INSERT INTO game (title, genre, price, release_date, developer_id, approval_status) VALUES
('Neon Drift', 'Racing', 25.00, '2026-01-10', 'd_211', 'approved'),
('Space Miner', 'Simulation', 15.00, '2026-02-15', 'd_212', 'approved'),
('Zombie Survival', 'Horror', 30.00, '2026-03-20', 'd_213', 'approved'),
('Mystic Quest', 'RPG', 40.00, '2026-04-05', 'd_214', 'approved'),
('Battle Arena', 'Action', 0.00, '2026-04-25', 'd_215', 'approved');

-- Let's fetch the new game IDs into variables
SET @g1 = LAST_INSERT_ID(); 
SET @g2 = @g1+1; 
SET @g3 = @g1+2; 
SET @g4 = @g1+3; 
SET @g5 = @g1+4;

-- =====================================================
-- STEP 4: Add Purchases for the new games and existing games across 30 players
-- =====================================================
INSERT IGNORE INTO purchase (user_id, game_id, price, purchase_date) VALUES
('p_116', 1, 50, NOW()), ('p_117', 1, 50, NOW()), ('p_118', 1, 50, NOW()), ('p_119', 1, 50, NOW()), ('p_120', 1, 50, NOW()),
('p_121', 1, 50, NOW()), ('p_122', 1, 50, NOW()), ('p_123', 1, 50, NOW()), ('p_124', 1, 50, NOW()), ('p_125', 1, 50, NOW()),
('p_126', 1, 50, NOW()), ('p_127', 1, 50, NOW()), ('p_128', 1, 50, NOW()), ('p_129', 1, 50, NOW()), ('p_130', 1, 50, NOW()),
('p_116', 26, 10, NOW()), ('p_117', 26, 10, NOW()), ('p_118', 26, 10, NOW()), ('p_119', 26, 10, NOW()), ('p_120', 26, 10, NOW()),
('p_111', @g1, 25, NOW()), ('p_112', @g1, 25, NOW()), ('p_113', @g1, 25, NOW()), ('p_116', @g1, 25, NOW()), ('p_117', @g1, 25, NOW()),
('p_120', @g2, 15, NOW()), ('p_121', @g2, 15, NOW()), ('p_122', @g2, 15, NOW()), ('p_123', @g2, 15, NOW()), ('p_124', @g2, 15, NOW()),
('p_125', @g3, 30, NOW()), ('p_126', @g3, 30, NOW()), ('p_127', @g3, 30, NOW()), ('p_128', @g3, 30, NOW()), ('p_129', @g3, 30, NOW()),
('p_130', @g4, 40, NOW()), ('p_101', @g4, 40, NOW()), ('p_102', @g4, 40, NOW()), ('p_103', @g4, 40, NOW()), ('p_104', @g4, 40, NOW()),
('p_105', @g5, 0, NOW()), ('p_106', @g5, 0, NOW()), ('p_107', @g5, 0, NOW()), ('p_108', @g5, 0, NOW()), ('p_109', @g5, 0, NOW());

-- =====================================================
-- STEP 5: Generate Massive Varied Matches to shift rankings
-- =====================================================
-- Game 1 (Call of Duty) - massive multiplayer lobbies
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(1, NOW(), NOW(), 1200, 'completed'),
(1, NOW(), NOW(), 1200, 'completed'),
(1, NOW(), NOW(), 1200, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1; SET @m3 = @m1+2;
INSERT INTO participation VALUES 
(@m1,'p_116',100,'loss'), (@m1,'p_117',950,'win'), (@m1,'p_118',200,'loss'), (@m1,'p_119',400,'loss'), (@m1,'p_120',880,'win'),
(@m2,'p_121',300,'loss'), (@m2,'p_122',1000,'win'), (@m2,'p_123',50,'loss'), (@m2,'p_124',700,'loss'), (@m2,'p_125',910,'win'),
(@m3,'p_126',10,'loss'), (@m3,'p_127',800,'loss'), (@m3,'p_128',1100,'win'), (@m3,'p_129',650,'loss'), (@m3,'p_130',250,'loss');

-- Game 26 (Game A) - fast matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(26, NOW(), NOW(), 30, 'completed'), (26, NOW(), NOW(), 45, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1;
INSERT INTO participation VALUES 
(@m1,'p_116',50,'loss'), (@m1,'p_117',120,'win'), (@m1,'p_118',200,'win'),
(@m2,'p_119',10,'loss'), (@m2,'p_120',300,'win');

-- Game 30 (@g1) - Neon Drift
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(@g1, NOW(), NOW(), 300, 'completed'), (@g1, NOW(), NOW(), 320, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1;
INSERT INTO participation VALUES 
(@m1,'p_111',2000,'win'), (@m1,'p_112',1500,'loss'), (@m1,'p_113',1800,'loss'),
(@m2,'p_116',2500,'win'), (@m2,'p_117',1200,'loss');

-- Game 31 (@g2) - Space Miner
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(@g2, NOW(), NOW(), 3600, 'completed');
SET @m1 = LAST_INSERT_ID();
INSERT INTO participation VALUES 
(@m1,'p_120',50,'loss'), (@m1,'p_121',80,'loss'), (@m1,'p_122',120,'loss'), (@m1,'p_123',300,'win'), (@m1,'p_124',25,'loss');

-- Game 32 (@g3) - Zombie Survival
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(@g3, NOW(), NOW(), 1800, 'completed'), (@g3, NOW(), NOW(), 2400, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1;
INSERT INTO participation VALUES 
(@m1,'p_125',450,'win'), (@m1,'p_126',10,'loss'), (@m1,'p_127',300,'loss'),
(@m2,'p_128',800,'win'), (@m2,'p_129',600,'loss');

-- Game 33 (@g4) - Mystic Quest
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(@g4, NOW(), NOW(), 7200, 'completed');
SET @m1 = LAST_INSERT_ID();
INSERT INTO participation VALUES 
(@m1,'p_130',1500,'loss'), (@m1,'p_101',2000,'loss'), (@m1,'p_102',5000,'win'), (@m1,'p_103',800,'loss'), (@m1,'p_104',1200,'loss');

-- Game 34 (@g5) - Battle Arena
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(@g5, NOW(), NOW(), 900, 'completed'), (@g5, NOW(), NOW(), 900, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1;
INSERT INTO participation VALUES 
(@m1,'p_105',15,'loss'), (@m1,'p_106',25,'win'), (@m1,'p_107',10,'loss'),
(@m2,'p_108',30,'win'), (@m2,'p_109',5,'loss');

-- =====================================================
-- STEP 6: Delete and Rebuild player_game_stats
-- =====================================================
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
