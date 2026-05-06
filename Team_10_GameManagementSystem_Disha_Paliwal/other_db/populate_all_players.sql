-- =====================================================
-- STEP 1: Clear stale player_game_stats (keep only what has real matches)
-- =====================================================

-- We'll rebuild player_game_stats completely at the end
DELETE FROM player_game_stats;

-- =====================================================
-- STEP 2: Add realistic match_session + participation for ALL players
-- Each player plays each purchased game 2-4 times with varied scores
-- =====================================================

-- ─── p_102: games 6,7,8,9,10,26 ───
-- game 6 (PUBG) - 3 matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(6, '2026-04-28 10:15:00', '2026-04-28 10:25:30', 630, 'completed'),
(6, '2026-04-29 14:00:00', '2026-04-29 14:12:00', 720, 'completed'),
(6, '2026-04-30 20:30:00', '2026-04-30 20:42:15', 735, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1; SET @m3 = @m1+2;
INSERT INTO participation VALUES (@m1,'p_102',85,'win'), (@m2,'p_102',120,'win'), (@m3,'p_102',45,'loss');

-- game 7 (Apex Legends) - 2 matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(7, '2026-04-28 11:00:00', '2026-04-28 11:18:00', 1080, 'completed'),
(7, '2026-04-30 16:00:00', '2026-04-30 16:20:00', 1200, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1;
INSERT INTO participation VALUES (@m1,'p_102',200,'win'), (@m2,'p_102',150,'loss');

-- game 8 (Elden Ring) - 2 matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(8, '2026-04-29 09:00:00', '2026-04-29 09:45:00', 2700, 'completed'),
(8, '2026-05-01 11:00:00', '2026-05-01 11:30:00', 1800, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1;
INSERT INTO participation VALUES (@m1,'p_102',310,'win'), (@m2,'p_102',180,'loss');

-- game 9 (God of War) - 3 matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(9, '2026-04-28 19:00:00', '2026-04-28 19:35:00', 2100, 'completed'),
(9, '2026-04-29 20:00:00', '2026-04-29 20:25:00', 1500, 'completed'),
(9, '2026-05-01 15:00:00', '2026-05-01 15:40:00', 2400, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1; SET @m3 = @m1+2;
INSERT INTO participation VALUES (@m1,'p_102',400,'win'), (@m2,'p_102',350,'win'), (@m3,'p_102',275,'loss');

-- game 10 (AC Valhalla) - 2 matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(10, '2026-04-30 10:00:00', '2026-04-30 10:50:00', 3000, 'completed'),
(10, '2026-05-01 09:00:00', '2026-05-01 09:30:00', 1800, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1;
INSERT INTO participation VALUES (@m1,'p_102',500,'win'), (@m2,'p_102',320,'loss');

-- game 26 (Game A) - already has 1 match, add 2 more
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(26, '2026-04-30 18:00:00', '2026-04-30 18:00:15', 15, 'completed'),
(26, '2026-05-01 12:00:00', '2026-05-01 12:00:10', 10, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1;
INSERT INTO participation VALUES (@m1,'p_102',12,'win'), (@m2,'p_102',8,'loss');


-- ─── p_103: games 11,12,13,14,15,27 ───
-- game 11 (Cyberpunk 2077) - 3 matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(11, '2026-04-27 14:00:00', '2026-04-27 14:45:00', 2700, 'completed'),
(11, '2026-04-29 16:30:00', '2026-04-29 17:00:00', 1800, 'completed'),
(11, '2026-05-01 10:00:00', '2026-05-01 10:20:00', 1200, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1; SET @m3 = @m1+2;
INSERT INTO participation VALUES (@m1,'p_103',250,'win'), (@m2,'p_103',180,'loss'), (@m3,'p_103',300,'win');

-- game 12 (RDR2) - 2 matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(12, '2026-04-28 20:00:00', '2026-04-28 20:50:00', 3000, 'completed'),
(12, '2026-04-30 13:00:00', '2026-04-30 13:40:00', 2400, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1;
INSERT INTO participation VALUES (@m1,'p_103',420,'win'), (@m2,'p_103',380,'win');

-- game 13 (FIFA 23) - 3 matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(13, '2026-04-28 15:00:00', '2026-04-28 15:15:00', 900, 'completed'),
(13, '2026-04-29 18:00:00', '2026-04-29 18:15:00', 900, 'completed'),
(13, '2026-05-01 21:00:00', '2026-05-01 21:15:00', 900, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1; SET @m3 = @m1+2;
INSERT INTO participation VALUES (@m1,'p_103',3,'win'), (@m2,'p_103',1,'loss'), (@m3,'p_103',5,'win');

-- game 14 (NBA 2K24) - 2 matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(14, '2026-04-29 11:00:00', '2026-04-29 11:30:00', 1800, 'completed'),
(14, '2026-05-01 17:00:00', '2026-05-01 17:25:00', 1500, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1;
INSERT INTO participation VALUES (@m1,'p_103',95,'win'), (@m2,'p_103',78,'loss');

-- game 15 (Valorant) - 3 matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(15, '2026-04-28 22:00:00', '2026-04-28 22:40:00', 2400, 'completed'),
(15, '2026-04-30 21:00:00', '2026-04-30 21:35:00', 2100, 'completed'),
(15, '2026-05-01 23:00:00', '2026-05-01 23:30:00', 1800, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1; SET @m3 = @m1+2;
INSERT INTO participation VALUES (@m1,'p_103',22,'win'), (@m2,'p_103',18,'loss'), (@m3,'p_103',25,'win');

-- game 27 (Game B) - already has 1 match, add 2 more
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(27, '2026-04-30 19:00:00', '2026-04-30 19:00:08', 8, 'completed'),
(27, '2026-05-01 14:00:00', '2026-05-01 14:00:05', 5, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1;
INSERT INTO participation VALUES (@m1,'p_103',6,'win'), (@m2,'p_103',4,'loss');


-- ─── p_104: games 16,17,18,19,20 ───
-- game 16 (LoL) - 3 matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(16, '2026-04-27 09:00:00', '2026-04-27 09:40:00', 2400, 'completed'),
(16, '2026-04-29 13:00:00', '2026-04-29 13:35:00', 2100, 'completed'),
(16, '2026-05-01 20:00:00', '2026-05-01 20:45:00', 2700, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1; SET @m3 = @m1+2;
INSERT INTO participation VALUES (@m1,'p_104',15,'win'), (@m2,'p_104',8,'loss'), (@m3,'p_104',22,'win');

-- game 17 (Dota 2) - 2 matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(17, '2026-04-28 10:00:00', '2026-04-28 10:50:00', 3000, 'completed'),
(17, '2026-04-30 15:00:00', '2026-04-30 15:45:00', 2700, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1;
INSERT INTO participation VALUES (@m1,'p_104',30,'win'), (@m2,'p_104',18,'loss');

-- game 18 (Overwatch) - 3 matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(18, '2026-04-28 16:00:00', '2026-04-28 16:20:00', 1200, 'completed'),
(18, '2026-04-29 19:00:00', '2026-04-29 19:15:00', 900, 'completed'),
(18, '2026-05-01 14:00:00', '2026-05-01 14:25:00', 1500, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1; SET @m3 = @m1+2;
INSERT INTO participation VALUES (@m1,'p_104',45,'win'), (@m2,'p_104',32,'loss'), (@m3,'p_104',50,'win');

-- game 19 (Horizon Zero Dawn) - 2 matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(19, '2026-04-29 08:00:00', '2026-04-29 08:55:00', 3300, 'completed'),
(19, '2026-05-01 11:00:00', '2026-05-01 11:40:00', 2400, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1;
INSERT INTO participation VALUES (@m1,'p_104',600,'win'), (@m2,'p_104',450,'loss');

-- game 20 (Spider-Man) - 3 matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(20, '2026-04-28 21:00:00', '2026-04-28 21:30:00', 1800, 'completed'),
(20, '2026-04-30 17:00:00', '2026-04-30 17:25:00', 1500, 'completed'),
(20, '2026-05-01 22:00:00', '2026-05-01 22:40:00', 2400, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1; SET @m3 = @m1+2;
INSERT INTO participation VALUES (@m1,'p_104',350,'win'), (@m2,'p_104',280,'loss'), (@m3,'p_104',420,'win');


-- ─── p_105: games 21,22,23,24,25 ───
-- game 21 (Resident Evil Village) - 2 matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(21, '2026-04-27 20:00:00', '2026-04-27 20:45:00', 2700, 'completed'),
(21, '2026-04-30 22:00:00', '2026-04-30 22:35:00', 2100, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1;
INSERT INTO participation VALUES (@m1,'p_105',280,'win'), (@m2,'p_105',210,'loss');

-- game 22 (Far Cry 6) - 3 matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(22, '2026-04-28 13:00:00', '2026-04-28 13:40:00', 2400, 'completed'),
(22, '2026-04-29 15:00:00', '2026-04-29 15:30:00', 1800, 'completed'),
(22, '2026-05-01 18:00:00', '2026-05-01 18:50:00', 3000, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1; SET @m3 = @m1+2;
INSERT INTO participation VALUES (@m1,'p_105',175,'win'), (@m2,'p_105',130,'loss'), (@m3,'p_105',220,'win');

-- game 23 (Dark Souls III) - 2 matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(23, '2026-04-29 21:00:00', '2026-04-29 22:00:00', 3600, 'completed'),
(23, '2026-05-01 16:00:00', '2026-05-01 16:45:00', 2700, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1;
INSERT INTO participation VALUES (@m1,'p_105',90,'loss'), (@m2,'p_105',150,'win');

-- game 24 (Sekiro) - 3 matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(24, '2026-04-28 18:00:00', '2026-04-28 19:00:00', 3600, 'completed'),
(24, '2026-04-30 11:00:00', '2026-04-30 11:40:00', 2400, 'completed'),
(24, '2026-05-01 13:00:00', '2026-05-01 13:50:00', 3000, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1; SET @m3 = @m1+2;
INSERT INTO participation VALUES (@m1,'p_105',110,'loss'), (@m2,'p_105',200,'win'), (@m3,'p_105',180,'win');

-- game 25 (Halo Infinite) - 2 matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(25, '2026-04-29 10:00:00', '2026-04-29 10:25:00', 1500, 'completed'),
(25, '2026-05-01 19:00:00', '2026-05-01 19:30:00', 1800, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1;
INSERT INTO participation VALUES (@m1,'p_105',35,'win'), (@m2,'p_105',28,'loss');


-- ─── p_106 to p_110: no purchases, but let's give them a few games for variety ───
-- p_106 plays game 1 (Call of Duty) - 2 matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(1, '2026-04-29 12:00:00', '2026-04-29 12:20:00', 1200, 'completed'),
(1, '2026-04-30 14:00:00', '2026-04-30 14:15:00', 900, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1;
INSERT INTO participation VALUES (@m1,'p_106',320,'win'), (@m2,'p_106',250,'loss');

-- p_107 plays game 2 (GTA V) - 2 matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(2, '2026-04-28 17:00:00', '2026-04-28 17:30:00', 1800, 'completed'),
(2, '2026-05-01 20:00:00', '2026-05-01 20:25:00', 1500, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1;
INSERT INTO participation VALUES (@m1,'p_107',380,'win'), (@m2,'p_107',290,'loss');

-- p_108 plays game 3 (Witcher 3) - 2 matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(3, '2026-04-27 15:00:00', '2026-04-27 15:45:00', 2700, 'completed'),
(3, '2026-04-30 19:00:00', '2026-04-30 19:30:00', 1800, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1;
INSERT INTO participation VALUES (@m1,'p_108',440,'win'), (@m2,'p_108',350,'loss');

-- p_109 plays game 26 (Game A) - 2 matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(26, '2026-04-29 16:00:00', '2026-04-29 16:00:12', 12, 'completed'),
(26, '2026-05-01 10:00:00', '2026-05-01 10:00:08', 8, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1;
INSERT INTO participation VALUES (@m1,'p_109',9,'win'), (@m2,'p_109',5,'loss');

-- p_110 plays game 27 (Game B) - 2 matches
INSERT INTO match_session (game_id, started_at, ended_at, duration, match_status) VALUES
(27, '2026-04-30 11:00:00', '2026-04-30 11:00:10', 10, 'completed'),
(27, '2026-05-01 15:00:00', '2026-05-01 15:00:06', 6, 'completed');
SET @m1 = LAST_INSERT_ID(); SET @m2 = @m1+1;
INSERT INTO participation VALUES (@m1,'p_110',8,'win'), (@m2,'p_110',5,'loss');


-- =====================================================
-- STEP 3: Rebuild player_game_stats from actual participation data
-- For each (user, game), calculate total_play_time, experience, best_score
-- =====================================================

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


-- =====================================================
-- STEP 4: Recalculate rank_level globally per game (by best_score desc)
-- =====================================================

UPDATE player_game_stats pgs
JOIN (
    SELECT user_id, game_id,
           ROW_NUMBER() OVER (PARTITION BY game_id ORDER BY best_score DESC) AS rn
    FROM player_game_stats
) ranked ON pgs.user_id = ranked.user_id AND pgs.game_id = ranked.game_id
SET pgs.rank_level = ranked.rn;
