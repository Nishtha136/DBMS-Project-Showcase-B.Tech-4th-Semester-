-- ============================================================
-- StudyLabs DBMS — consolidated schema
-- Database: studylab_dbms
-- Contents: tables, views, functions, procedures, triggers
-- Load order respects all foreign-key dependencies.
-- ============================================================

CREATE DATABASE IF NOT EXISTS `studylab_dbms` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `studylab_dbms`;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------
-- DROP existing objects (idempotent reload)
-- ----------------------------------------
DROP TRIGGER IF EXISTS `trg_accounts_after_insert`;
DROP TRIGGER IF EXISTS `trg_accounts_after_update`;
DROP TRIGGER IF EXISTS `trg_assessments_after_insert`;
DROP TRIGGER IF EXISTS `trg_check_ins_after_insert`;
DROP TRIGGER IF EXISTS `trg_dailyentries_after_insert`;
DROP TRIGGER IF EXISTS `trg_focus_events_after_insert`;
DROP TRIGGER IF EXISTS `trg_habits_status_change`;
DROP TRIGGER IF EXISTS `trg_mentor_tasks_after_insert`;
DROP TRIGGER IF EXISTS `trg_study_sessions_after_insert`;
DROP TRIGGER IF EXISTS `trg_study_sessions_after_update`;
DROP TRIGGER IF EXISTS `trg_subjects_after_delete`;
DROP TRIGGER IF EXISTS `trg_subjects_after_insert`;
DROP TRIGGER IF EXISTS `trg_vault_files_after_insert`;
DROP TRIGGER IF EXISTS `trg_vault_links_after_insert`;
DROP FUNCTION IF EXISTS `fn_account_storage_kb`;
DROP FUNCTION IF EXISTS `fn_habit_average_score`;
DROP FUNCTION IF EXISTS `fn_subject_total_items`;
DROP FUNCTION IF EXISTS `fn_user_consistency_streak`;
DROP PROCEDURE IF EXISTS `ArchiveInactiveMentees`;
DROP PROCEDURE IF EXISTS `proc_archive_subject`;
DROP PROCEDURE IF EXISTS `proc_log_daily_entry`;
DROP PROCEDURE IF EXISTS `proc_mark_notifications_read`;
DROP PROCEDURE IF EXISTS `proc_recompute_habit_analysis`;
DROP PROCEDURE IF EXISTS `proc_register_account`;
DROP PROCEDURE IF EXISTS `sp_add_column`;
DROP PROCEDURE IF EXISTS `sp_add_index`;
DROP VIEW IF EXISTS `mentee_performance_summary`;
DROP VIEW IF EXISTS `vw_account_overview`;
DROP VIEW IF EXISTS `vw_account_public`;
DROP VIEW IF EXISTS `vw_daily_score_heatmap`;
DROP VIEW IF EXISTS `vw_habit_score_stats`;
DROP VIEW IF EXISTS `vw_mentee_activity_summary`;
DROP VIEW IF EXISTS `vw_mentor_roster`;
DROP VIEW IF EXISTS `vw_question_difficulty`;
DROP VIEW IF EXISTS `vw_subject_overview`;
DROP VIEW IF EXISTS `vw_top_engaged_accounts`;
DROP TABLE IF EXISTS `activity_log`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `mentor_tasks`;
DROP TABLE IF EXISTS `mentor_assignments`;
DROP TABLE IF EXISTS `assessments`;
DROP TABLE IF EXISTS `vault_links`;
DROP TABLE IF EXISTS `vault_files`;
DROP TABLE IF EXISTS `check_ins`;
DROP TABLE IF EXISTS `focus_mode_events`;
DROP TABLE IF EXISTS `study_sessions`;
DROP TABLE IF EXISTS `habit_tags`;
DROP TABLE IF EXISTS `analysisvisuals`;
DROP TABLE IF EXISTS `habitanalysis`;
DROP TABLE IF EXISTS `scores`;
DROP TABLE IF EXISTS `dailyentries`;
DROP TABLE IF EXISTS `questions`;
DROP TABLE IF EXISTS `habits`;
DROP TABLE IF EXISTS `subjects`;
DROP TABLE IF EXISTS `tags`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `accounts`;

-- ============================================================
-- TABLES
-- ============================================================

-- Table: accounts
CREATE TABLE `accounts` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `role` enum('student','mentor','admin') NOT NULL DEFAULT 'student',
  `last_login_at` datetime DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `bio` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: users
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `firebase_uid` varchar(128) NOT NULL,
  `username` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `display_name` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `firebase_uid` (`firebase_uid`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: tags
CREATE TABLE `tags` (
  `tag_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `color_hex` varchar(10) NOT NULL DEFAULT '#999999',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`tag_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: subjects
CREATE TABLE `subjects` (
  `id` varchar(36) NOT NULL,
  `firebase_uid` varchar(128) NOT NULL,
  `name` varchar(255) NOT NULL,
  `color_hex` varchar(10) NOT NULL DEFAULT '#22C1A8',
  `color_light_hex` varchar(10) NOT NULL DEFAULT '#E1F7F2',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_archived` tinyint(1) NOT NULL DEFAULT '0',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_subjects_uid` (`firebase_uid`),
  KEY `firebase_uid` (`firebase_uid`,`is_archived`,`created_at` DESC),
  FULLTEXT KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: habits
CREATE TABLE `habits` (
  `habit_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `habit_label` varchar(10) DEFAULT NULL,
  `habit_name` varchar(150) DEFAULT NULL,
  `habit_description` text,
  `experiment_duration` int DEFAULT NULL,
  `completion_window` int DEFAULT NULL,
  `status` enum('active','completed','abandoned') NOT NULL DEFAULT 'active',
  `registered_at` date DEFAULT NULL,
  `completed_at` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_archived` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`habit_id`),
  KEY `user_id` (`user_id`),
  KEY `user_id_2` (`user_id`,`status`),
  FULLTEXT KEY `habit_name` (`habit_name`,`habit_description`),
  CONSTRAINT `habits_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: questions
CREATE TABLE `questions` (
  `question_id` int NOT NULL AUTO_INCREMENT,
  `habit_id` int NOT NULL,
  `question_text` text,
  `question_order` int DEFAULT NULL,
  `category` enum('focus','energy','mood','productivity','other') NOT NULL DEFAULT 'other',
  `is_ai_generated` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`question_id`),
  KEY `habit_id` (`habit_id`),
  CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`habit_id`) REFERENCES `habits` (`habit_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=225 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: dailyentries
CREATE TABLE `dailyentries` (
  `entry_id` int NOT NULL AUTO_INCREMENT,
  `habit_id` int NOT NULL,
  `user_id` int NOT NULL,
  `entry_date` date NOT NULL,
  `day_number` int DEFAULT NULL,
  `daily_note` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `day_of_week` varchar(10) GENERATED ALWAYS AS (dayname(`entry_date`)) STORED,
  PRIMARY KEY (`entry_id`),
  KEY `user_id` (`user_id`),
  KEY `habit_id` (`habit_id`),
  KEY `user_id_2` (`user_id`,`entry_date`),
  KEY `habit_id_2` (`habit_id`,`entry_date`),
  CONSTRAINT `dailyentries_ibfk_1` FOREIGN KEY (`habit_id`) REFERENCES `habits` (`habit_id`) ON DELETE CASCADE,
  CONSTRAINT `dailyentries_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1636 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: scores
CREATE TABLE `scores` (
  `score_id` int NOT NULL AUTO_INCREMENT,
  `entry_id` int NOT NULL,
  `question_id` int NOT NULL,
  `score` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`score_id`),
  KEY `entry_id` (`entry_id`),
  KEY `question_id` (`question_id`),
  CONSTRAINT `scores_ibfk_1` FOREIGN KEY (`entry_id`) REFERENCES `dailyentries` (`entry_id`) ON DELETE CASCADE,
  CONSTRAINT `scores_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `questions` (`question_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4978 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: habitanalysis
CREATE TABLE `habitanalysis` (
  `analysis_id` int NOT NULL AUTO_INCREMENT,
  `habit_id` int NOT NULL,
  `average_score` decimal(4,2) DEFAULT NULL,
  `score_variance` decimal(6,4) DEFAULT NULL,
  `stability_index` decimal(4,2) DEFAULT NULL,
  `min_score` decimal(4,2) DEFAULT NULL,
  `max_score` decimal(4,2) DEFAULT NULL,
  `trend_direction` enum('improving','declining','stable') NOT NULL DEFAULT 'stable',
  `effectiveness` enum('high','medium','low') NOT NULL DEFAULT 'medium',
  `ai_summary` text,
  `ai_recommendation` text,
  `generated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`analysis_id`),
  KEY `habit_id` (`habit_id`),
  CONSTRAINT `habitanalysis_ibfk_1` FOREIGN KEY (`habit_id`) REFERENCES `habits` (`habit_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: analysisvisuals
CREATE TABLE `analysisvisuals` (
  `visual_id` int NOT NULL AUTO_INCREMENT,
  `analysis_id` int NOT NULL,
  `visual_type` enum('bar','line','pie','heatmap','other') NOT NULL DEFAULT 'other',
  `visual_title` varchar(200) DEFAULT NULL,
  `chart_data` json DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`visual_id`),
  KEY `analysis_id` (`analysis_id`),
  CONSTRAINT `analysisvisuals_ibfk_1` FOREIGN KEY (`analysis_id`) REFERENCES `habitanalysis` (`analysis_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: habit_tags
CREATE TABLE `habit_tags` (
  `habit_id` int NOT NULL,
  `tag_id` int NOT NULL,
  `tagged_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`habit_id`,`tag_id`),
  KEY `fk_ht_tag` (`tag_id`),
  CONSTRAINT `fk_ht_habit` FOREIGN KEY (`habit_id`) REFERENCES `habits` (`habit_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ht_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`tag_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: study_sessions
CREATE TABLE `study_sessions` (
  `id` varchar(36) NOT NULL,
  `student_id` varchar(36) NOT NULL,
  `subject_id` varchar(36) DEFAULT NULL,
  `subject_label` varchar(120) DEFAULT NULL,
  `started_at` datetime NOT NULL,
  `ended_at` datetime DEFAULT NULL,
  `duration_minutes` decimal(8,2) GENERATED ALWAYS AS ((case when (`ended_at` is null) then NULL else (timestampdiff(SECOND,`started_at`,`ended_at`) / 60.0) end)) STORED,
  `focus_seconds` int NOT NULL DEFAULT '0',
  `notes` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_ss_subject` (`subject_id`),
  KEY `idx_ss_student_started` (`student_id`,`started_at` DESC),
  KEY `idx_ss_student_ended` (`student_id`,`ended_at`),
  CONSTRAINT `fk_ss_student` FOREIGN KEY (`student_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ss_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: focus_mode_events
CREATE TABLE `focus_mode_events` (
  `id` varchar(36) NOT NULL,
  `session_id` varchar(36) DEFAULT NULL,
  `student_id` varchar(36) NOT NULL,
  `event_type` enum('enabled','disabled') NOT NULL,
  `event_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `metadata` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_fme_student_at` (`student_id`,`event_at` DESC),
  KEY `idx_fme_session` (`session_id`,`event_at`),
  CONSTRAINT `fk_fme_session` FOREIGN KEY (`session_id`) REFERENCES `study_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fme_student` FOREIGN KEY (`student_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: check_ins
CREATE TABLE `check_ins` (
  `id` varchar(36) NOT NULL,
  `student_id` varchar(36) NOT NULL,
  `experiment_local_id` int DEFAULT NULL,
  `date_at` datetime NOT NULL,
  `metric_values` json DEFAULT NULL,
  `notes` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ci_student_date` (`student_id`,`date_at` DESC),
  CONSTRAINT `fk_ci_student` FOREIGN KEY (`student_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: vault_files
CREATE TABLE `vault_files` (
  `id` varchar(36) NOT NULL,
  `subject_id` varchar(36) NOT NULL,
  `note_name` varchar(255) DEFAULT NULL,
  `note_description` text,
  `file_name` varchar(255) DEFAULT NULL,
  `file_local_path` varchar(500) DEFAULT NULL,
  `file_type` varchar(20) DEFAULT NULL,
  `file_size_kb` bigint NOT NULL DEFAULT '0',
  `uploaded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `subject_id` (`subject_id`),
  KEY `subject_id_2` (`subject_id`,`uploaded_at` DESC),
  FULLTEXT KEY `note_name` (`note_name`,`note_description`,`file_name`),
  CONSTRAINT `vault_files_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: vault_links
CREATE TABLE `vault_links` (
  `id` varchar(36) NOT NULL,
  `subject_id` varchar(36) NOT NULL,
  `link_name` varchar(255) DEFAULT NULL,
  `url` varchar(2000) DEFAULT NULL,
  `added_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `subject_id` (`subject_id`),
  CONSTRAINT `vault_links_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: assessments
CREATE TABLE `assessments` (
  `id` varchar(36) NOT NULL,
  `student_id` varchar(36) NOT NULL,
  `mentor_id` varchar(36) DEFAULT NULL,
  `subject_id` varchar(36) DEFAULT NULL,
  `type` enum('quiz','exam','assignment','project') NOT NULL DEFAULT 'assignment',
  `title` varchar(200) NOT NULL,
  `notes` text,
  `due_at` datetime DEFAULT NULL,
  `is_done` tinyint(1) NOT NULL DEFAULT '0',
  `score` decimal(5,2) DEFAULT NULL,
  `max_score` decimal(5,2) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_a_subject` (`subject_id`),
  KEY `idx_a_student` (`student_id`,`is_done`,`due_at`),
  KEY `idx_a_mentor` (`mentor_id`,`is_done`,`due_at`),
  CONSTRAINT `fk_a_mentor` FOREIGN KEY (`mentor_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_a_student` FOREIGN KEY (`student_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_a_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: mentor_assignments
CREATE TABLE `mentor_assignments` (
  `id` varchar(36) NOT NULL,
  `mentor_account_id` varchar(36) NOT NULL,
  `student_account_id` varchar(36) NOT NULL,
  `assigned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_self_mentored` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_one_mentor_per_student` (`student_account_id`),
  KEY `mentor_account_id` (`mentor_account_id`),
  KEY `mentor_account_id_3` (`mentor_account_id`,`student_account_id`),
  CONSTRAINT `fk_ma_mentor` FOREIGN KEY (`mentor_account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ma_student` FOREIGN KEY (`student_account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: mentor_tasks
CREATE TABLE `mentor_tasks` (
  `id` varchar(36) NOT NULL,
  `mentor_id` varchar(36) DEFAULT NULL,
  `student_id` varchar(36) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text,
  `due_date` datetime DEFAULT NULL,
  `priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `status` enum('pending','in_progress','done','cancelled') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mt_mentor` (`mentor_id`,`status`,`created_at` DESC),
  KEY `idx_mt_student` (`student_id`,`status`,`due_date`),
  CONSTRAINT `fk_mt_mentor` FOREIGN KEY (`mentor_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_mt_student` FOREIGN KEY (`student_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: notifications
CREATE TABLE `notifications` (
  `id` varchar(36) NOT NULL,
  `account_id` varchar(36) NOT NULL,
  `type` varchar(32) NOT NULL,
  `message` text NOT NULL,
  `link` varchar(500) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `account_id` (`account_id`,`is_read`,`created_at` DESC),
  CONSTRAINT `fk_notif_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: activity_log
CREATE TABLE `activity_log` (
  `log_id` bigint NOT NULL AUTO_INCREMENT,
  `account_id` varchar(36) DEFAULT NULL,
  `action_type` varchar(32) NOT NULL,
  `entity_type` varchar(32) DEFAULT NULL,
  `entity_id` varchar(64) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `performed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `account_id` (`account_id`,`performed_at` DESC),
  CONSTRAINT `fk_log_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=19489 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ============================================================
-- VIEWS
-- ============================================================

-- View: mentee_performance_summary
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `mentee_performance_summary` AS select `a`.`id` AS `student_id`,`a`.`name` AS `student_name`,`a`.`email` AS `email`,count(distinct `s`.`id`) AS `total_subjects`,coalesce(sum(`ss`.`duration_minutes`),0) AS `total_study_minutes`,count(distinct `mt`.`id`) AS `total_tasks`,sum((case when (`mt`.`status` = 'done') then 1 else 0 end)) AS `completed_tasks` from (((`accounts` `a` left join `subjects` `s` on(((`a`.`id` = `s`.`firebase_uid`) and (`s`.`is_archived` = 0)))) left join `study_sessions` `ss` on(((`a`.`id` = `ss`.`student_id`) and (`ss`.`ended_at` is not null)))) left join `mentor_tasks` `mt` on((`a`.`id` = `mt`.`student_id`))) where (`a`.`role` = 'student') group by `a`.`id`,`a`.`name`,`a`.`email`;

-- View: vw_account_overview
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_account_overview` AS select `a`.`id` AS `account_id`,`a`.`name` AS `account_name`,upper(`a`.`email`) AS `email_upper`,`a`.`role` AS `role`,`a`.`is_active` AS `is_active`,count(distinct `s`.`id`) AS `subject_count`,count(distinct `vf`.`id`) AS `file_count`,count(distinct `vl`.`id`) AS `link_count`,coalesce(sum(`vf`.`file_size_kb`),0) AS `total_storage_kb`,round((coalesce(sum(`vf`.`file_size_kb`),0) / nullif(1024,0)),2) AS `total_storage_mb`,greatest(coalesce(max(`vf`.`uploaded_at`),'1970-01-01'),coalesce(max(`vl`.`added_at`),'1970-01-01'),coalesce(max(`s`.`created_at`),'1970-01-01')) AS `last_activity_at` from (((`accounts` `a` left join `subjects` `s` on(((`s`.`firebase_uid` = `a`.`id`) and (`s`.`is_archived` = 0)))) left join `vault_files` `vf` on((`vf`.`subject_id` = `s`.`id`))) left join `vault_links` `vl` on((`vl`.`subject_id` = `s`.`id`))) group by `a`.`id`,`a`.`name`,`a`.`email`,`a`.`role`,`a`.`is_active`;

-- View: vw_account_public
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_account_public` AS select `a`.`id` AS `account_id`,`a`.`name` AS `name`,`a`.`email` AS `email`,`a`.`role` AS `role`,`a`.`is_active` AS `is_active`,`a`.`bio` AS `bio`,`a`.`last_login_at` AS `last_login_at`,`a`.`created_at` AS `created_at`,`a`.`updated_at` AS `updated_at` from `accounts` `a`;

-- View: vw_daily_score_heatmap
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_daily_score_heatmap` AS select `de`.`user_id` AS `user_id`,`de`.`entry_date` AS `entry_date`,date_format(`de`.`entry_date`,'%Y-%m') AS `month_bucket`,dayname(`de`.`entry_date`) AS `weekday_name`,extract(week from `de`.`entry_date`) AS `iso_week`,count(distinct `de`.`entry_id`) AS `entry_count`,count(`sc`.`score_id`) AS `score_count`,coalesce(sum(`sc`.`score`),0) AS `total_score`,coalesce(round(avg(`sc`.`score`),2),0) AS `avg_score` from (`dailyentries` `de` left join `scores` `sc` on((`sc`.`entry_id` = `de`.`entry_id`))) group by `de`.`user_id`,`de`.`entry_date`;

-- View: vw_habit_score_stats
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_habit_score_stats` AS select `h`.`habit_id` AS `habit_id`,`h`.`user_id` AS `user_id`,`h`.`habit_name` AS `habit_name`,`h`.`status` AS `status`,`h`.`is_archived` AS `is_archived`,count(distinct `q`.`question_id`) AS `question_count`,count(distinct `de`.`entry_id`) AS `entry_count`,count(`sc`.`score_id`) AS `score_count`,coalesce(min(`sc`.`score`),0) AS `min_score`,coalesce(max(`sc`.`score`),0) AS `max_score`,coalesce(round(avg(`sc`.`score`),2),0) AS `avg_score`,coalesce(round(stddev_samp(`sc`.`score`),2),0) AS `score_stddev`,(select max(`de2`.`entry_date`) from `dailyentries` `de2` where (`de2`.`habit_id` = `h`.`habit_id`)) AS `last_entry_date` from (((`habits` `h` left join `questions` `q` on(((`q`.`habit_id` = `h`.`habit_id`) and (`q`.`is_active` = 1)))) left join `dailyentries` `de` on((`de`.`habit_id` = `h`.`habit_id`))) left join `scores` `sc` on((`sc`.`entry_id` = `de`.`entry_id`))) group by `h`.`habit_id`,`h`.`user_id`,`h`.`habit_name`,`h`.`status`,`h`.`is_archived`;

-- View: vw_mentee_activity_summary
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_mentee_activity_summary` AS select `a`.`id` AS `student_id`,`a`.`name` AS `student_name`,`a`.`email` AS `email`,coalesce((select sum(`ss`.`duration_minutes`) from `study_sessions` `ss` where ((`ss`.`student_id` = `a`.`id`) and (`ss`.`ended_at` is not null))),0) AS `total_study_minutes`,coalesce((select sum(`ss`.`duration_minutes`) from `study_sessions` `ss` where ((`ss`.`student_id` = `a`.`id`) and (`ss`.`ended_at` is not null) and (`ss`.`ended_at` >= (now() - interval 7 day)))),0) AS `study_minutes_7d`,coalesce((select sum(`ss`.`focus_seconds`) from `study_sessions` `ss` where (`ss`.`student_id` = `a`.`id`)),0) AS `total_focus_seconds`,(select max(`al`.`performed_at`) from `activity_log` `al` where (`al`.`account_id` = `a`.`id`)) AS `last_activity_at`,(case when exists(select 1 from `activity_log` `al` where ((`al`.`account_id` = `a`.`id`) and (`al`.`performed_at` >= (now() - interval 2 day)))) then 1 else 0 end) AS `is_active_recent` from `accounts` `a`;

-- View: vw_mentor_roster
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_mentor_roster` AS select `ma`.`mentor_account_id` AS `mentor_id`,`a`.`id` AS `student_id`,`a`.`name` AS `student_name`,`a`.`email` AS `student_email`,`a`.`last_login_at` AS `last_login_at`,`a`.`is_active` AS `is_active`,count(distinct `s`.`id`) AS `subjects_count`,count(distinct `vf`.`id`) AS `files_count`,count(distinct `h`.`habit_id`) AS `habits_count`,count(distinct (case when (`de`.`entry_date` >= (curdate() - interval 7 day)) then `de`.`entry_id` end)) AS `daily_entries_7d`,count(distinct `mt`.`id`) AS `open_tasks`,`ma`.`assigned_at` AS `assigned_at` from (((((((`mentor_assignments` `ma` join `accounts` `a` on((`a`.`id` = `ma`.`student_account_id`))) left join `users` `u` on((`u`.`email` = `a`.`email`))) left join `habits` `h` on(((`h`.`user_id` = `u`.`user_id`) and (`h`.`is_archived` = 0)))) left join `dailyentries` `de` on((`de`.`user_id` = `u`.`user_id`))) left join `subjects` `s` on(((`s`.`firebase_uid` = `a`.`id`) and (`s`.`is_archived` = 0)))) left join `vault_files` `vf` on((`vf`.`subject_id` = `s`.`id`))) left join `mentor_tasks` `mt` on(((`mt`.`student_id` = `a`.`id`) and (`mt`.`mentor_id` = `ma`.`mentor_account_id`) and (`mt`.`status` in ('pending','in_progress'))))) group by `ma`.`mentor_account_id`,`a`.`id`,`a`.`name`,`a`.`email`,`a`.`last_login_at`,`a`.`is_active`,`ma`.`assigned_at`;

-- View: vw_question_difficulty
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_question_difficulty` AS select `q`.`question_id` AS `question_id`,`q`.`habit_id` AS `habit_id`,`q`.`question_text` AS `question_text`,`q`.`category` AS `category`,count(`sc`.`score_id`) AS `times_answered`,coalesce(round(avg(`sc`.`score`),2),0) AS `avg_score`,(case when (avg(`sc`.`score`) is null) then 'unrated' when (avg(`sc`.`score`) >= 8) then 'easy' when (avg(`sc`.`score`) >= 5) then 'moderate' else 'hard' end) AS `difficulty_band`,(select `h`.`habit_name` from `habits` `h` where (`h`.`habit_id` = `q`.`habit_id`)) AS `habit_name` from (`questions` `q` left join `scores` `sc` on((`sc`.`question_id` = `q`.`question_id`))) group by `q`.`question_id`,`q`.`habit_id`,`q`.`question_text`,`q`.`category`;

-- View: vw_subject_overview
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_subject_overview` AS select `s`.`id` AS `subject_id`,`s`.`firebase_uid` AS `account_id`,`s`.`name` AS `name`,upper(`s`.`name`) AS `name_upper`,length(`s`.`name`) AS `name_length`,`s`.`color_hex` AS `color_hex`,`s`.`color_light_hex` AS `color_light_hex`,`s`.`is_archived` AS `is_archived`,`s`.`created_at` AS `created_at`,`s`.`updated_at` AS `updated_at`,count(distinct `vf`.`id`) AS `file_count`,count(distinct `vl`.`id`) AS `link_count`,coalesce(sum(`vf`.`file_size_kb`),0) AS `total_storage_kb`,coalesce(round(avg(`vf`.`file_size_kb`),2),0) AS `avg_file_size_kb`,coalesce(max(`vf`.`uploaded_at`),`s`.`created_at`) AS `last_upload_at`,date_format(`s`.`created_at`,'%Y-%m-%d') AS `created_date` from ((`subjects` `s` left join `vault_files` `vf` on((`vf`.`subject_id` = `s`.`id`))) left join `vault_links` `vl` on((`vl`.`subject_id` = `s`.`id`))) group by `s`.`id`,`s`.`firebase_uid`,`s`.`name`,`s`.`color_hex`,`s`.`color_light_hex`,`s`.`is_archived`,`s`.`created_at`,`s`.`updated_at`;

-- View: vw_top_engaged_accounts
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_top_engaged_accounts` AS select `a`.`id` AS `account_id`,`a`.`name` AS `name`,`a`.`email` AS `email`,count(distinct `s`.`id`) AS `subject_count`,count(distinct `vf`.`id`) AS `file_count`,count(distinct `vl`.`id`) AS `link_count`,((count(distinct `s`.`id`) + count(distinct `vf`.`id`)) + count(distinct `vl`.`id`)) AS `engagement_score` from (((`accounts` `a` left join `subjects` `s` on((`s`.`firebase_uid` = `a`.`id`))) left join `vault_files` `vf` on((`vf`.`subject_id` = `s`.`id`))) left join `vault_links` `vl` on((`vl`.`subject_id` = `s`.`id`))) where (`a`.`is_active` = 1) group by `a`.`id`,`a`.`name`,`a`.`email` having (`engagement_score` > 0);


-- ============================================================
-- FUNCTIONS
-- ============================================================

DELIMITER $$

-- Function: fn_account_storage_kb
CREATE FUNCTION `fn_account_storage_kb`(p_account_id VARCHAR(36)) RETURNS bigint
    READS SQL DATA
    DETERMINISTIC
BEGIN
    DECLARE v_kb BIGINT;
    SELECT COALESCE(SUM(vf.file_size_kb), 0)
      INTO v_kb
      FROM vault_files vf
      JOIN subjects   s ON s.id = vf.subject_id
     WHERE s.firebase_uid = p_account_id;
    RETURN v_kb;
END$$

-- Function: fn_habit_average_score
CREATE FUNCTION `fn_habit_average_score`(p_habit_id INT) RETURNS decimal(5,2)
    READS SQL DATA
    DETERMINISTIC
BEGIN
    DECLARE v_avg DECIMAL(5,2);
    SELECT ROUND(AVG(sc.score), 2)
      INTO v_avg
      FROM scores sc
      JOIN dailyentries de ON de.entry_id = sc.entry_id
     WHERE de.habit_id = p_habit_id;
    RETURN v_avg;
END$$

-- Function: fn_subject_total_items
CREATE FUNCTION `fn_subject_total_items`(p_subject_id VARCHAR(36)) RETURNS int
    READS SQL DATA
    DETERMINISTIC
BEGIN
    DECLARE v_files INT;
    DECLARE v_links INT;
    SELECT COUNT(*) INTO v_files FROM vault_files WHERE subject_id = p_subject_id;
    SELECT COUNT(*) INTO v_links FROM vault_links WHERE subject_id = p_subject_id;
    RETURN v_files + v_links;
END$$

-- Function: fn_user_consistency_streak
CREATE FUNCTION `fn_user_consistency_streak`(p_user_id INT) RETURNS int
    READS SQL DATA
BEGIN
    DECLARE v_streak    INT  DEFAULT 0;
    DECLARE v_prev_date DATE DEFAULT NULL;
    DECLARE v_cur_date  DATE;
    DECLARE v_done      INT  DEFAULT 0;
    DECLARE cur CURSOR FOR
        SELECT DISTINCT entry_date
          FROM dailyentries
         WHERE user_id = p_user_id
         ORDER BY entry_date DESC;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    OPEN cur;
    streak_loop: LOOP
        FETCH cur INTO v_cur_date;
        IF v_done = 1 THEN
            LEAVE streak_loop;
        END IF;

        IF v_prev_date IS NULL THEN
            -- Today or yesterday must be present for a live streak.
            IF v_cur_date >= DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN
                SET v_streak     = 1;
                SET v_prev_date  = v_cur_date;
            ELSE
                LEAVE streak_loop;
            END IF;
        ELSEIF DATEDIFF(v_prev_date, v_cur_date) = 1 THEN
            SET v_streak    = v_streak + 1;
            SET v_prev_date = v_cur_date;
        ELSE
            LEAVE streak_loop;
        END IF;
    END LOOP;
    CLOSE cur;

    RETURN v_streak;
END$$

DELIMITER ;


-- ============================================================
-- PROCEDURES
-- ============================================================

DELIMITER $$

-- Procedure: ArchiveInactiveMentees
CREATE PROCEDURE `ArchiveInactiveMentees`(OUT archived_count INT)
BEGIN
        DECLARE exit handler for sqlexception
        BEGIN
            ROLLBACK;
            SET archived_count = -1;
        END;

        START TRANSACTION;
        
        SELECT COUNT(*) INTO archived_count
        FROM accounts 
        WHERE role = 'student' AND last_login_at < DATE_SUB(NOW(), INTERVAL 30 DAY) AND is_active = 1;

        UPDATE accounts 
        SET is_active = 0 
        WHERE role = 'student' AND last_login_at < DATE_SUB(NOW(), INTERVAL 30 DAY) AND is_active = 1;

        COMMIT;
    END$$

-- Procedure: proc_archive_subject
CREATE PROCEDURE `proc_archive_subject`(
    IN p_subject_id VARCHAR(36),
    IN p_account_id VARCHAR(36)
)
BEGIN
    DECLARE v_owner VARCHAR(128);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SELECT firebase_uid INTO v_owner FROM subjects WHERE id = p_subject_id;
    IF v_owner IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Subject not found';
    END IF;
    IF v_owner <> p_account_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Not the subject owner';
    END IF;

    START TRANSACTION;
    UPDATE subjects SET is_archived = 1 WHERE id = p_subject_id;

    INSERT INTO activity_log (account_id, action_type, entity_type, entity_id, metadata)
    VALUES (p_account_id, 'ARCHIVE', 'subject', p_subject_id,
            JSON_OBJECT('archived_at', NOW()));
    COMMIT;
END$$

-- Procedure: proc_log_daily_entry
CREATE PROCEDURE `proc_log_daily_entry`(
    IN  p_user_id     INT,
    IN  p_habit_id    INT,
    IN  p_entry_date  DATE,
    IN  p_daily_note  TEXT,
    IN  p_scores_json JSON,
    OUT p_entry_id    INT
)
BEGIN
    DECLARE v_count    INT;
    DECLARE v_i        INT DEFAULT 0;
    DECLARE v_qid      INT;
    DECLARE v_score    INT;
    DECLARE v_existing INT DEFAULT NULL;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- `Pseudo-UPSERT`: dailyentries has no UNIQUE on (user, habit, date),
    -- so we look up an existing row first and either UPDATE it or INSERT
    -- a new one. Demonstrates DML INSERT + UPDATE inside a transaction.
    SELECT entry_id INTO v_existing
      FROM dailyentries
     WHERE user_id    = p_user_id
       AND habit_id   = p_habit_id
       AND entry_date = p_entry_date
     LIMIT 1;

    IF v_existing IS NULL THEN
        INSERT INTO dailyentries (habit_id, user_id, entry_date, daily_note)
        VALUES (p_habit_id, p_user_id, p_entry_date, p_daily_note);
        SET p_entry_id = LAST_INSERT_ID();
    ELSE
        UPDATE dailyentries
           SET daily_note = p_daily_note
         WHERE entry_id = v_existing;
        SET p_entry_id = v_existing;
        -- Drop any old score rows so the savepoint demo below replaces them.
        DELETE FROM scores WHERE entry_id = v_existing;
    END IF;

    SAVEPOINT before_scores;                                            -- TCL: SAVEPOINT

    SET v_count = JSON_LENGTH(p_scores_json);
    WHILE v_i < v_count DO
        SET v_qid   = JSON_EXTRACT(p_scores_json, CONCAT('$[', v_i, '].question_id'));
        SET v_score = JSON_EXTRACT(p_scores_json, CONCAT('$[', v_i, '].score'));

        IF v_score < 0 OR v_score > 10 THEN
            -- Roll back only the scores -- the dailyentry is preserved.
            ROLLBACK TO SAVEPOINT before_scores;                        -- TCL: ROLLBACK TO
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Score must be in [0..10]';
        END IF;

        INSERT INTO scores (entry_id, question_id, score)
        VALUES (p_entry_id, v_qid, v_score);
        SET v_i = v_i + 1;
    END WHILE;

    RELEASE SAVEPOINT before_scores;                                    -- TCL: RELEASE
    COMMIT;
END$$

-- Procedure: proc_mark_notifications_read
CREATE PROCEDURE `proc_mark_notifications_read`(IN p_account_id VARCHAR(36))
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    UPDATE notifications
       SET is_read = 1, read_at = NOW()
     WHERE account_id = p_account_id AND is_read = 0;
    SET v_count = ROW_COUNT();

    IF v_count > 0 THEN
        INSERT INTO activity_log (account_id, action_type, entity_type, metadata)
        VALUES (p_account_id, 'BULK_NOTIF_READ', 'notification',
                JSON_OBJECT('count', v_count));
    END IF;
    COMMIT;
END$$

-- Procedure: proc_recompute_habit_analysis
CREATE PROCEDURE `proc_recompute_habit_analysis`(IN p_habit_id INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    DELETE FROM habitanalysis WHERE habit_id = p_habit_id;

    INSERT INTO habitanalysis
        (habit_id, average_score, score_variance, stability_index,
         min_score, max_score, trend_direction, effectiveness)
    SELECT
        de.habit_id,
        ROUND(AVG(sc.score), 2),
        ROUND(VAR_SAMP(sc.score), 4),
        ROUND(10 - COALESCE(STDDEV_SAMP(sc.score), 0), 2),
        MIN(sc.score),
        MAX(sc.score),
        CASE
            WHEN AVG(sc.score) >= 7 THEN 'improving'
            WHEN AVG(sc.score) <  4 THEN 'declining'
            ELSE                         'stable'
        END,
        CASE
            WHEN AVG(sc.score) >= 7 THEN 'high'
            WHEN AVG(sc.score) >= 4 THEN 'medium'
            ELSE                         'low'
        END
      FROM dailyentries de
      JOIN scores       sc ON sc.entry_id = de.entry_id
     WHERE de.habit_id = p_habit_id
     GROUP BY de.habit_id;
    COMMIT;
END$$

-- Procedure: proc_register_account
CREATE PROCEDURE `proc_register_account`(
    IN p_id            VARCHAR(36),
    IN p_name          VARCHAR(100),
    IN p_email         VARCHAR(255),
    IN p_password_hash VARCHAR(255),
    IN p_role          VARCHAR(20)
)
BEGIN
    -- Any error in the body raises here; the handler rolls back and re-throws.
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Non-correlated subquery used as a guard.
    IF (SELECT COUNT(*) FROM accounts WHERE email = p_email) > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Email already registered';
    END IF;

    START TRANSACTION;                                                  -- TCL: BEGIN

    INSERT INTO accounts (id, name, email, password_hash, role)
    VALUES (p_id, p_name, p_email, p_password_hash, COALESCE(p_role,'student'));

    INSERT INTO notifications (id, account_id, type, message, link)
    VALUES (UUID(), p_id, 'WELCOME',
            CONCAT('Welcome, ', p_name, '! Create your first subject to begin.'),
            '/vault');

    INSERT INTO activity_log (account_id, action_type, entity_type, entity_id, metadata)
    VALUES (p_id, 'REGISTER', 'account', p_id,
            JSON_OBJECT('email', p_email, 'role', COALESCE(p_role,'student')));

    COMMIT;                                                             -- TCL: COMMIT
END$$

-- Procedure: sp_add_column
CREATE PROCEDURE `sp_add_column`(
    IN p_table  VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_def    TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = p_table
          AND COLUMN_NAME  = p_column
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE `', p_table,
                          '` ADD COLUMN `', p_column, '` ', p_def);
        PREPARE s FROM @ddl;
        EXECUTE s;
        DEALLOCATE PREPARE s;
    END IF;
END$$

-- Procedure: sp_add_index
CREATE PROCEDURE `sp_add_index`(
    IN p_table VARCHAR(64),
    IN p_index VARCHAR(64),
    IN p_def   TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = p_table
          AND INDEX_NAME   = p_index
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE `', p_table,
                          '` ADD ', p_def);
        PREPARE s FROM @ddl;
        EXECUTE s;
        DEALLOCATE PREPARE s;
    END IF;
END$$

DELIMITER ;


-- ============================================================
-- TRIGGERS
-- ============================================================

DELIMITER $$

-- Trigger: trg_accounts_after_insert
CREATE TRIGGER `trg_accounts_after_insert` AFTER INSERT ON `accounts` FOR EACH ROW BEGIN
    INSERT INTO activity_log (account_id, action_type, entity_type, entity_id, metadata)
    VALUES (NEW.id, 'INSERT', 'account', NEW.id,
            JSON_OBJECT('email', NEW.email, 'role', NEW.role));
END$$

-- Trigger: trg_accounts_after_update
CREATE TRIGGER `trg_accounts_after_update` AFTER UPDATE ON `accounts` FOR EACH ROW BEGIN
    -- Only audit meaningful changes (not just bumping last_login_at).
    IF NEW.email <> OLD.email
       OR NEW.role <> OLD.role
       OR NEW.is_active <> OLD.is_active THEN
        INSERT INTO activity_log (account_id, action_type, entity_type, entity_id, metadata)
        VALUES (NEW.id, 'UPDATE', 'account', NEW.id,
                JSON_OBJECT('old_email', OLD.email,  'new_email', NEW.email,
                            'old_role',  OLD.role,   'new_role',  NEW.role,
                            'old_active',OLD.is_active,'new_active',NEW.is_active));
    END IF;
END$$

-- Trigger: trg_assessments_after_insert
CREATE TRIGGER `trg_assessments_after_insert` AFTER INSERT ON `assessments` FOR EACH ROW BEGIN
    INSERT INTO notifications (id, account_id, type, message, link)
    VALUES (UUID(), NEW.student_id, 'NEW_ASSESSMENT',
            CONCAT('New ', NEW.type, ': ', NEW.title),
            CONCAT('/student/assessments/', NEW.id));

    INSERT INTO activity_log (account_id, action_type, entity_type, entity_id, metadata)
    VALUES (COALESCE(NEW.mentor_id, NEW.student_id), 'CREATE_ASSESSMENT',
            'assessment', NEW.id,
            JSON_OBJECT('student_id', NEW.student_id,
                        'title',      NEW.title,
                        'type',       NEW.type,
                        'due_at',     NEW.due_at,
                        'self',       NEW.mentor_id IS NULL));
END$$

-- Trigger: trg_check_ins_after_insert
CREATE TRIGGER `trg_check_ins_after_insert` AFTER INSERT ON `check_ins` FOR EACH ROW BEGIN
    INSERT INTO activity_log (account_id, action_type, entity_type, entity_id, metadata)
    VALUES (NEW.student_id, 'CHECK_IN', 'check_in', NEW.id,
            JSON_OBJECT('date_at', NEW.date_at,
                        'experiment_local_id', NEW.experiment_local_id));
END$$

-- Trigger: trg_dailyentries_after_insert
CREATE TRIGGER `trg_dailyentries_after_insert` AFTER INSERT ON `dailyentries` FOR EACH ROW BEGIN
    -- Logged against users.user_id (legacy) so account_id is left NULL.
    INSERT INTO activity_log (account_id, action_type, entity_type, entity_id, metadata)
    VALUES (NULL, 'INSERT', 'dailyentry', CAST(NEW.entry_id AS CHAR),
            JSON_OBJECT('user_id', NEW.user_id,
                        'habit_id', NEW.habit_id,
                        'entry_date', NEW.entry_date));
END$$

-- Trigger: trg_focus_events_after_insert
CREATE TRIGGER `trg_focus_events_after_insert` AFTER INSERT ON `focus_mode_events` FOR EACH ROW BEGIN
    INSERT INTO activity_log (account_id, action_type, entity_type, entity_id, metadata)
    VALUES (NEW.student_id,
            CASE NEW.event_type WHEN 'enabled' THEN 'FOCUS_ON' ELSE 'FOCUS_OFF' END,
            'focus_event', NEW.id,
            JSON_OBJECT('session_id', NEW.session_id,
                        'event_at',   NEW.event_at));
END$$

-- Trigger: trg_habits_status_change
CREATE TRIGGER `trg_habits_status_change` AFTER UPDATE ON `habits` FOR EACH ROW BEGIN
    IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
        INSERT INTO notifications (id, account_id, type, message)
        SELECT UUID(),
               a.id,
               'HABIT_COMPLETED',
               CONCAT('You completed the habit: ', NEW.habit_name)
          FROM users u
          JOIN accounts a ON a.email = u.email
         WHERE u.user_id = NEW.user_id;
    END IF;
END$$

-- Trigger: trg_mentor_tasks_after_insert
CREATE TRIGGER `trg_mentor_tasks_after_insert` AFTER INSERT ON `mentor_tasks` FOR EACH ROW BEGIN
    INSERT INTO notifications (id, account_id, type, message, link)
    VALUES (UUID(), NEW.student_id, 'NEW_TASK',
            CONCAT('New task from your mentor: ', NEW.title),
            CONCAT('/student/tasks/', NEW.id));

    INSERT INTO activity_log (account_id, action_type, entity_type, entity_id, metadata)
    VALUES (NEW.mentor_id, 'ASSIGN_TASK', 'mentor_task', NEW.id,
            JSON_OBJECT('student_id', NEW.student_id,
                        'title',      NEW.title,
                        'priority',   NEW.priority,
                        'due_date',   NEW.due_date));
END$$

-- Trigger: trg_study_sessions_after_insert
CREATE TRIGGER `trg_study_sessions_after_insert` AFTER INSERT ON `study_sessions` FOR EACH ROW BEGIN
    INSERT INTO activity_log (account_id, action_type, entity_type, entity_id, metadata)
    VALUES (NEW.student_id, 'STUDY_START', 'study_session', NEW.id,
            JSON_OBJECT('subject_id',    NEW.subject_id,
                        'subject_label', NEW.subject_label,
                        'started_at',    NEW.started_at));
END$$

-- Trigger: trg_study_sessions_after_update
CREATE TRIGGER `trg_study_sessions_after_update` AFTER UPDATE ON `study_sessions` FOR EACH ROW BEGIN
    -- Only audit the END transition (ended_at went from NULL -> not NULL).
    IF OLD.ended_at IS NULL AND NEW.ended_at IS NOT NULL THEN
        INSERT INTO activity_log (account_id, action_type, entity_type, entity_id, metadata)
        VALUES (NEW.student_id, 'STUDY_END', 'study_session', NEW.id,
                JSON_OBJECT('subject_id',       NEW.subject_id,
                            'subject_label',    NEW.subject_label,
                            'started_at',       NEW.started_at,
                            'ended_at',         NEW.ended_at,
                            'duration_minutes', NEW.duration_minutes,
                            'focus_seconds',    NEW.focus_seconds));
    END IF;
END$$

-- Trigger: trg_subjects_after_delete
CREATE TRIGGER `trg_subjects_after_delete` AFTER DELETE ON `subjects` FOR EACH ROW BEGIN
    INSERT INTO activity_log (account_id, action_type, entity_type, entity_id, metadata)
    VALUES (OLD.firebase_uid, 'DELETE', 'subject', OLD.id,
            JSON_OBJECT('name', OLD.name));
END$$

-- Trigger: trg_subjects_after_insert
CREATE TRIGGER `trg_subjects_after_insert` AFTER INSERT ON `subjects` FOR EACH ROW BEGIN
    INSERT INTO activity_log (account_id, action_type, entity_type, entity_id, metadata)
    VALUES (NEW.firebase_uid, 'INSERT', 'subject', NEW.id,
            JSON_OBJECT('name', NEW.name, 'color', NEW.color_hex));
END$$

-- Trigger: trg_vault_files_after_insert
CREATE TRIGGER `trg_vault_files_after_insert` AFTER INSERT ON `vault_files` FOR EACH ROW BEGIN
    INSERT INTO activity_log
        (account_id, action_type, entity_type, entity_id, metadata)
    SELECT s.firebase_uid, 'INSERT', 'vault_file', NEW.id,
           JSON_OBJECT('subject_id', NEW.subject_id,
                       'file_name',  NEW.file_name,
                       'size_kb',    NEW.file_size_kb)
      FROM subjects s
     WHERE s.id = NEW.subject_id;
END$$

-- Trigger: trg_vault_links_after_insert
CREATE TRIGGER `trg_vault_links_after_insert` AFTER INSERT ON `vault_links` FOR EACH ROW BEGIN
    INSERT INTO activity_log
        (account_id, action_type, entity_type, entity_id, metadata)
    SELECT s.firebase_uid, 'INSERT', 'vault_link', NEW.id,
           JSON_OBJECT('subject_id', NEW.subject_id,
                       'link_name',  NEW.link_name,
                       'url',        NEW.url)
      FROM subjects s
     WHERE s.id = NEW.subject_id;
END$$

DELIMITER ;


SET FOREIGN_KEY_CHECKS = 1;
