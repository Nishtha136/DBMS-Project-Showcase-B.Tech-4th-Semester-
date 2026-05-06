USE trial_1;

ALTER TABLE purchase DROP FOREIGN KEY purchase_ibfk_2;
ALTER TABLE purchase ADD CONSTRAINT purchase_ibfk_2 FOREIGN KEY (game_id) REFERENCES game (game_id) ON DELETE CASCADE;

ALTER TABLE match_session DROP FOREIGN KEY match_session_ibfk_1;
ALTER TABLE match_session ADD CONSTRAINT match_session_ibfk_1 FOREIGN KEY (game_id) REFERENCES game (game_id) ON DELETE CASCADE;

ALTER TABLE player_game_stats DROP FOREIGN KEY player_game_stats_ibfk_2;
ALTER TABLE player_game_stats ADD CONSTRAINT player_game_stats_ibfk_2 FOREIGN KEY (game_id) REFERENCES game (game_id) ON DELETE CASCADE;

ALTER TABLE participation DROP FOREIGN KEY participation_ibfk_1;
ALTER TABLE participation ADD CONSTRAINT participation_ibfk_1 FOREIGN KEY (match_id) REFERENCES match_session (match_id) ON DELETE CASCADE;
