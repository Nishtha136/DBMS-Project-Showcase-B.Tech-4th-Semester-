-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: trial_1
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `user_id` varchar(10) NOT NULL,
  `role` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `admin_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES ('a_301','super_admin'),('a_302','moderator'),('a_303','support'),('a_304','manager'),('a_305','reviewer');
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `developer`
--

DROP TABLE IF EXISTS `developer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `developer` (
  `developer_id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(10) DEFAULT NULL,
  `studio_name` varchar(100) DEFAULT NULL,
  `verification_status` enum('pending','verified','rejected') DEFAULT 'pending',
  PRIMARY KEY (`developer_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `developer_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `developer`
--

LOCK TABLES `developer` WRITE;
/*!40000 ALTER TABLE `developer` DISABLE KEYS */;
INSERT INTO `developer` VALUES (1,'d_201','Studio Alpha','verified'),(2,'d_202','Studio Beta','verified'),(3,'d_203','Studio Gamma','pending'),(4,'d_204','Studio Delta','verified'),(5,'d_205','Studio Omega','pending'),(6,'d_206','Studio Pixel','verified'),(7,'d_207','Studio Nova','verified'),(8,'d_208','Studio Blaze','pending'),(9,'d_209','Studio Titan','verified'),(10,'d_210','Studio Fusion','verified'),(11,'d_201','Studio Alpha','verified'),(12,'d_202','Studio Beta','verified'),(13,'d_203','Studio Gamma','pending'),(14,'d_204','Studio Delta','verified'),(15,'d_205','Studio Omega','pending'),(16,'d_211','Studio Eclipse','verified'),(17,'d_212','Studio Zenith','verified'),(18,'d_213','Studio Horizon','verified'),(19,'d_214','Studio Apex','verified'),(20,'d_215','Studio Vanguard','verified');
/*!40000 ALTER TABLE `developer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `friendship`
--

DROP TABLE IF EXISTS `friendship`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `friendship` (
  `friendship_id` int NOT NULL AUTO_INCREMENT,
  `user_id_1` varchar(10) DEFAULT NULL,
  `user_id_2` varchar(10) DEFAULT NULL,
  `status` enum('pending','accepted','declined') DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`friendship_id`),
  KEY `idx_friendship_user1` (`user_id_1`),
  KEY `idx_friendship_user2` (`user_id_2`)
) ENGINE=InnoDB AUTO_INCREMENT=134 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `friendship`
--

LOCK TABLES `friendship` WRITE;
/*!40000 ALTER TABLE `friendship` DISABLE KEYS */;
INSERT INTO `friendship` VALUES (1,'d_201','d_202','accepted','2026-05-01 17:19:50'),(2,'d_201','d_203','declined','2026-05-01 17:19:50'),(3,'d_201','p_101','accepted','2026-05-01 17:19:50'),(4,'d_201','p_102','accepted','2026-05-01 17:19:50'),(5,'d_201','p_103','pending','2026-05-01 17:19:50'),(6,'d_202','d_201','accepted','2026-05-01 17:19:50'),(7,'d_202','d_204','declined','2026-05-01 17:19:50'),(8,'d_202','p_101','accepted','2026-05-01 17:19:50'),(9,'d_202','p_104','pending','2026-05-01 17:19:50'),(10,'d_202','p_105','accepted','2026-05-01 17:19:50'),(11,'d_203','d_201','accepted','2026-05-01 17:19:50'),(12,'d_203','d_205','declined','2026-05-01 17:19:50'),(13,'d_203','p_102','accepted','2026-05-01 17:19:50'),(14,'d_203','p_106','pending','2026-05-01 17:19:50'),(15,'d_203','p_107','accepted','2026-05-01 17:19:50'),(16,'d_204','d_202','accepted','2026-05-01 17:19:50'),(17,'d_204','d_206','declined','2026-05-01 17:19:50'),(18,'d_204','p_102','accepted','2026-05-01 17:19:50'),(19,'d_204','p_108','pending','2026-05-01 17:19:50'),(20,'d_204','p_109','accepted','2026-05-01 17:19:50'),(21,'d_205','d_203','accepted','2026-05-01 17:19:50'),(22,'d_205','d_207','declined','2026-05-01 17:19:50'),(23,'d_205','p_103','accepted','2026-05-01 17:19:50'),(24,'d_205','p_108','pending','2026-05-01 17:19:50'),(25,'d_205','p_110','accepted','2026-05-01 17:19:50'),(26,'d_206','d_204','accepted','2026-05-01 17:19:50'),(27,'d_206','d_208','declined','2026-05-01 17:19:50'),(28,'d_206','p_103','accepted','2026-05-01 17:19:50'),(29,'d_206','p_108','pending','2026-05-01 17:19:50'),(30,'d_206','p_109','accepted','2026-05-01 17:19:50'),(31,'d_207','d_205','accepted','2026-05-01 17:19:50'),(32,'d_207','d_209','declined','2026-05-01 17:19:50'),(33,'d_207','p_104','accepted','2026-05-01 17:19:50'),(34,'d_207','p_109','pending','2026-05-01 17:19:50'),(35,'d_207','p_110','accepted','2026-05-01 17:19:50'),(36,'d_208','d_206','accepted','2026-05-01 17:19:50'),(37,'d_208','d_210','declined','2026-05-01 17:19:50'),(38,'d_208','p_104','accepted','2026-05-01 17:19:50'),(39,'d_208','p_109','pending','2026-05-01 17:19:50'),(40,'d_208','p_110','accepted','2026-05-01 17:19:50'),(41,'d_209','d_207','accepted','2026-05-01 17:19:50'),(42,'d_209','d_210','declined','2026-05-01 17:19:50'),(43,'d_209','p_105','accepted','2026-05-01 17:19:50'),(44,'d_209','p_108','accepted','2026-05-01 17:19:50'),(45,'d_209','p_110','declined','2026-05-01 17:19:50'),(46,'d_210','d_208','accepted','2026-05-01 17:19:50'),(47,'d_210','d_209','declined','2026-05-01 17:19:50'),(48,'d_210','p_105','accepted','2026-05-01 17:19:50'),(49,'d_210','p_107','accepted','2026-05-01 17:19:50'),(50,'d_210','p_110','declined','2026-05-01 17:19:50'),(51,'p_101','d_201','accepted','2026-05-01 17:19:50'),(52,'p_101','d_202','declined','2026-05-01 17:19:50'),(53,'p_101','p_102','accepted','2026-05-01 17:19:50'),(54,'p_101','p_103','pending','2026-05-01 17:19:50'),(55,'p_101','p_104','accepted','2026-05-01 17:19:50'),(56,'p_102','d_203','accepted','2026-05-01 17:19:50'),(57,'p_102','d_204','declined','2026-05-01 17:19:50'),(58,'p_102','p_101','accepted','2026-05-01 17:19:50'),(59,'p_102','p_103','accepted','2026-05-01 17:19:50'),(60,'p_102','p_105','accepted','2026-05-01 17:19:50'),(61,'p_103','d_205','accepted','2026-05-01 17:19:50'),(62,'p_103','d_206','declined','2026-05-01 17:19:50'),(63,'p_103','p_101','accepted','2026-05-01 17:19:50'),(64,'p_103','p_102','accepted','2026-05-01 17:19:50'),(65,'p_103','p_106','accepted','2026-05-01 17:19:50'),(66,'p_104','d_207','accepted','2026-05-01 17:19:50'),(67,'p_104','d_208','declined','2026-05-01 17:19:50'),(68,'p_104','p_101','accepted','2026-05-01 17:19:50'),(69,'p_104','p_105','pending','2026-05-01 17:19:50'),(70,'p_104','p_106','accepted','2026-05-01 17:19:50'),(71,'p_105','d_209','accepted','2026-05-01 17:19:50'),(72,'p_105','d_210','declined','2026-05-01 17:19:50'),(73,'p_105','p_102','accepted','2026-05-01 17:19:50'),(74,'p_105','p_104','pending','2026-05-01 17:19:50'),(75,'p_105','p_107','accepted','2026-05-01 17:19:50'),(76,'p_106','d_201','accepted','2026-05-01 17:19:50'),(77,'p_106','d_202','declined','2026-05-01 17:19:50'),(78,'p_106','p_101','accepted','2026-05-01 17:19:50'),(79,'p_106','p_102','pending','2026-05-01 17:19:50'),(80,'p_106','p_103','accepted','2026-05-01 17:19:50'),(81,'p_107','d_203','accepted','2026-05-01 17:19:50'),(82,'p_107','d_204','declined','2026-05-01 17:19:50'),(83,'p_107','p_104','accepted','2026-05-01 17:19:50'),(84,'p_107','p_105','pending','2026-05-01 17:19:50'),(85,'p_107','p_106','accepted','2026-05-01 17:19:50'),(86,'p_108','d_205','accepted','2026-05-01 17:19:50'),(87,'p_108','d_206','declined','2026-05-01 17:19:50'),(88,'p_108','p_105','accepted','2026-05-01 17:19:50'),(89,'p_108','p_106','pending','2026-05-01 17:19:50'),(90,'p_108','p_107','accepted','2026-05-01 17:19:50'),(91,'p_109','d_207','accepted','2026-05-01 17:19:50'),(92,'p_109','d_208','declined','2026-05-01 17:19:50'),(93,'p_109','p_106','accepted','2026-05-01 17:19:50'),(94,'p_109','p_107','pending','2026-05-01 17:19:50'),(95,'p_109','p_108','accepted','2026-05-01 17:19:50'),(96,'p_110','d_209','accepted','2026-05-01 17:19:50'),(97,'p_110','d_210','declined','2026-05-01 17:19:50'),(98,'p_110','p_107','accepted','2026-05-01 17:19:50'),(99,'p_110','p_108','pending','2026-05-01 17:19:50'),(100,'p_110','p_109','accepted','2026-05-01 17:19:50'),(128,'p_110','p_101','declined','2026-05-01 18:48:24'),(129,'d_201','a_301','pending','2026-05-02 21:19:20'),(130,'d_201','p_105','pending','2026-05-03 19:25:45'),(131,'p_101','p_105','accepted','2026-05-04 22:25:57'),(132,'d_201','p_104','accepted','2026-05-04 22:27:34'),(133,'p_101','p_119','pending','2026-05-06 12:08:04');
/*!40000 ALTER TABLE `friendship` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `game`
--

DROP TABLE IF EXISTS `game`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `game` (
  `game_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) DEFAULT NULL,
  `genre` varchar(50) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `release_date` date DEFAULT NULL,
  `developer_id` varchar(10) DEFAULT NULL,
  `approval_status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approved_by` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`game_id`),
  KEY `idx_game_status` (`approval_status`),
  KEY `game_ibfk_1` (`developer_id`),
  CONSTRAINT `game_ibfk_1` FOREIGN KEY (`developer_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game`
--

LOCK TABLES `game` WRITE;
/*!40000 ALTER TABLE `game` DISABLE KEYS */;
INSERT INTO `game` VALUES (1,'Call of Duty','FPS',70.00,'2023-11-10','d_201','approved','a_302'),(2,'Grand Theft Auto V','Action',60.00,'2013-09-17','d_202','approved','a_303'),(4,'Minecraft','Sandbox',30.00,'2011-11-18','d_204','approved','a_305'),(5,'Fortnite','Battle Royale',0.00,'2017-07-21','d_205','approved','a_301'),(6,'PUBG','Battle Royale',40.00,'2017-12-20','d_206','approved','a_302'),(7,'Apex Legends','FPS',0.00,'2019-02-04','d_207','approved','a_303'),(8,'Elden Ring','RPG',60.00,'2022-02-25','d_208','approved','a_304'),(9,'God of War','Action',50.00,'2018-04-20','d_209','approved','a_305'),(10,'Assassin???s Creed Valhalla','Action',60.00,'2020-11-10','d_210','pending',NULL),(11,'Cyberpunk 2077','RPG',60.00,'2020-12-10','d_201','approved','a_301'),(12,'Red Dead Redemption 2','Adventure',70.00,'2018-10-26','d_202','approved','a_302'),(13,'FIFA 23','Sports',50.00,'2022-09-30','d_203','approved','a_303'),(14,'NBA 2K24','Sports',60.00,'2023-09-08','d_204','pending',NULL),(15,'Valorant','FPS',0.00,'2020-06-02','d_205','approved','a_304'),(16,'League of Legends','MOBA',0.00,'2009-10-27','d_206','approved','a_305'),(17,'Dota 2','MOBA',0.00,'2013-07-09','d_207','approved','a_301'),(18,'Overwatch','FPS',40.00,'2016-05-24','d_208','approved','a_302'),(19,'Horizon Zero Dawn','Adventure',50.00,'2017-02-28','d_209','approved','a_303'),(20,'Spider-Man','Action',60.00,'2018-09-07','d_210','approved','a_304'),(21,'Resident Evil Village','Horror',60.00,'2021-05-07','d_201','approved','a_305'),(22,'Far Cry 6','Action',60.00,'2021-10-07','d_202','approved','a_301'),(23,'Dark Souls III','RPG',50.00,'2016-04-12','d_203','approved','a_302'),(24,'Sekiro: Shadows Die Twice','Action',60.00,'2019-03-22','d_204','approved','a_303'),(25,'Halo Infinite','FPS',60.00,'2021-12-08','d_205','approved','a_304'),(26,'Game A','Action',50.00,'2024-01-01','d_201','approved','a_305'),(27,'Game B','RPG',60.00,'2024-01-02','d_202','approved','a_301'),(28,'Game C','FPS',70.00,'2024-01-03','d_203','approved','a_302'),(29,'xyz','Action',200.00,'2026-05-02','d_201','approved','a_303'),(30,'Neon Drift','Racing',25.00,'2026-01-10','d_211','approved','a_304'),(31,'Space Miner','Simulation',15.00,'2026-02-15','d_212','approved','a_305'),(32,'Zombie Survival','Horror',30.00,'2026-03-20','d_213','approved','a_301'),(33,'Mystic Quest','RPG',40.00,'2026-04-05','d_214','approved','a_302'),(34,'Battle Arena','Action',0.00,'2026-04-25','d_215','approved','a_303'),(35,'Cyberpunk 2077','RPG',59.99,NULL,'d_210','pending',NULL),(36,'Elden Ring','Action',49.99,NULL,'d_210','rejected',NULL),(37,'Hades','Rogue-like',24.99,NULL,'d_210','approved','a_301'),(38,'Stardew Valley','Simulation',14.99,NULL,'d_210','pending',NULL),(39,'Among Us','Social',4.99,NULL,'d_210','approved','a_304'),(40,'Cyberpunk 2077','RPG',59.99,NULL,'d_210','pending',NULL),(41,'Elden Ring','Action',49.99,NULL,'d_210','pending',NULL),(42,'Hades','Rogue-like',24.99,NULL,'d_210','pending',NULL),(43,'Stardew Valley','Simulation',14.99,NULL,'d_210','approved','a_301'),(44,'Among Us','Social',4.99,NULL,'d_210','pending',NULL),(45,'avc','Horror',2000.00,'2026-05-02','d_201','approved','a_303'),(47,'ccc','Action',15000.00,'2026-05-04','d_201','approved','a_301'),(49,'ddd','apd',4600.00,'2026-05-05','d_204','approved','a_303'),(52,'xyz','Action Khelunga',90000.00,'2026-05-06','d_203','pending',NULL),(53,'dddd','vbvb',40000.00,'2026-05-06','d_201','pending',NULL),(54,'aaa','axction',120.00,'2026-05-06','d_203','pending',NULL);
/*!40000 ALTER TABLE `game` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `match_session`
--

DROP TABLE IF EXISTS `match_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `match_session` (
  `match_id` int NOT NULL AUTO_INCREMENT,
  `game_id` int DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `ended_at` datetime DEFAULT NULL,
  `duration` int DEFAULT NULL,
  `match_status` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`match_id`),
  KEY `match_session_ibfk_1` (`game_id`),
  CONSTRAINT `match_session_ibfk_1` FOREIGN KEY (`game_id`) REFERENCES `game` (`game_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=195 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `match_session`
--

LOCK TABLES `match_session` WRITE;
/*!40000 ALTER TABLE `match_session` DISABLE KEYS */;
INSERT INTO `match_session` VALUES (1,26,'2026-05-01 17:37:12','2026-05-01 17:37:19',7,'completed'),(2,1,'2026-05-01 17:39:25','2026-05-01 17:39:25',120,'completed'),(3,2,'2026-05-01 17:39:25','2026-05-01 17:39:25',300,'completed'),(5,1,'2026-05-01 17:44:45','2026-05-01 17:44:45',0,'completed'),(6,2,'2026-05-01 17:44:45','2026-05-01 17:44:45',0,'completed'),(8,26,'2026-05-01 17:46:23','2026-05-01 17:46:25',2,'completed'),(9,26,'2026-05-01 17:48:44','2026-05-01 17:48:44',30,'completed'),(10,27,'2026-05-01 17:59:23','2026-05-01 17:59:27',4,'completed'),(11,28,'2026-05-01 18:24:39','2026-05-01 18:25:09',30,'completed'),(12,27,'2026-05-01 18:41:42','2026-05-01 18:41:45',3,'completed'),(13,27,'2026-05-01 18:41:51','2026-05-01 18:42:04',13,'completed'),(14,27,'2026-05-01 18:42:11','2026-05-01 18:42:12',1,'completed'),(15,27,'2026-05-01 18:42:16','2026-05-01 18:42:18',2,'completed'),(16,27,'2026-05-01 18:42:21','2026-05-01 18:42:34',13,'completed'),(17,27,'2026-05-01 18:42:40','2026-05-01 18:42:50',10,'completed'),(18,28,'2026-05-01 18:43:14','2026-05-01 18:43:44',30,'completed'),(19,27,'2026-05-01 18:57:08','2026-05-01 18:57:10',2,'completed'),(20,26,'2026-05-02 02:05:19','2026-05-02 02:05:22',3,'completed'),(21,27,'2026-05-02 13:54:09','2026-05-02 13:54:10',1,'completed'),(22,6,'2026-04-28 10:15:00','2026-04-28 10:25:30',630,'completed'),(23,6,'2026-04-29 14:00:00','2026-04-29 14:12:00',720,'completed'),(24,6,'2026-04-30 20:30:00','2026-04-30 20:42:15',735,'completed'),(25,7,'2026-04-28 11:00:00','2026-04-28 11:18:00',1080,'completed'),(26,7,'2026-04-30 16:00:00','2026-04-30 16:20:00',1200,'completed'),(27,8,'2026-04-29 09:00:00','2026-04-29 09:45:00',2700,'completed'),(28,8,'2026-05-01 11:00:00','2026-05-01 11:30:00',1800,'completed'),(29,9,'2026-04-28 19:00:00','2026-04-28 19:35:00',2100,'completed'),(30,9,'2026-04-29 20:00:00','2026-04-29 20:25:00',1500,'completed'),(31,9,'2026-05-01 15:00:00','2026-05-01 15:40:00',2400,'completed'),(32,10,'2026-04-30 10:00:00','2026-04-30 10:50:00',3000,'completed'),(33,10,'2026-05-01 09:00:00','2026-05-01 09:30:00',1800,'completed'),(34,26,'2026-04-30 18:00:00','2026-04-30 18:00:15',15,'completed'),(35,26,'2026-05-01 12:00:00','2026-05-01 12:00:10',10,'completed'),(36,11,'2026-04-27 14:00:00','2026-04-27 14:45:00',2700,'completed'),(37,11,'2026-04-29 16:30:00','2026-04-29 17:00:00',1800,'completed'),(38,11,'2026-05-01 10:00:00','2026-05-01 10:20:00',1200,'completed'),(39,12,'2026-04-28 20:00:00','2026-04-28 20:50:00',3000,'completed'),(40,12,'2026-04-30 13:00:00','2026-04-30 13:40:00',2400,'completed'),(41,13,'2026-04-28 15:00:00','2026-04-28 15:15:00',900,'completed'),(42,13,'2026-04-29 18:00:00','2026-04-29 18:15:00',900,'completed'),(43,13,'2026-05-01 21:00:00','2026-05-01 21:15:00',900,'completed'),(44,14,'2026-04-29 11:00:00','2026-04-29 11:30:00',1800,'completed'),(45,14,'2026-05-01 17:00:00','2026-05-01 17:25:00',1500,'completed'),(46,15,'2026-04-28 22:00:00','2026-04-28 22:40:00',2400,'completed'),(47,15,'2026-04-30 21:00:00','2026-04-30 21:35:00',2100,'completed'),(48,15,'2026-05-01 23:00:00','2026-05-01 23:30:00',1800,'completed'),(49,27,'2026-04-30 19:00:00','2026-04-30 19:00:08',8,'completed'),(50,27,'2026-05-01 14:00:00','2026-05-01 14:00:05',5,'completed'),(51,16,'2026-04-27 09:00:00','2026-04-27 09:40:00',2400,'completed'),(52,16,'2026-04-29 13:00:00','2026-04-29 13:35:00',2100,'completed'),(53,16,'2026-05-01 20:00:00','2026-05-01 20:45:00',2700,'completed'),(54,17,'2026-04-28 10:00:00','2026-04-28 10:50:00',3000,'completed'),(55,17,'2026-04-30 15:00:00','2026-04-30 15:45:00',2700,'completed'),(56,18,'2026-04-28 16:00:00','2026-04-28 16:20:00',1200,'completed'),(57,18,'2026-04-29 19:00:00','2026-04-29 19:15:00',900,'completed'),(58,18,'2026-05-01 14:00:00','2026-05-01 14:25:00',1500,'completed'),(59,19,'2026-04-29 08:00:00','2026-04-29 08:55:00',3300,'completed'),(60,19,'2026-05-01 11:00:00','2026-05-01 11:40:00',2400,'completed'),(61,20,'2026-04-28 21:00:00','2026-04-28 21:30:00',1800,'completed'),(62,20,'2026-04-30 17:00:00','2026-04-30 17:25:00',1500,'completed'),(63,20,'2026-05-01 22:00:00','2026-05-01 22:40:00',2400,'completed'),(64,21,'2026-04-27 20:00:00','2026-04-27 20:45:00',2700,'completed'),(65,21,'2026-04-30 22:00:00','2026-04-30 22:35:00',2100,'completed'),(66,22,'2026-04-28 13:00:00','2026-04-28 13:40:00',2400,'completed'),(67,22,'2026-04-29 15:00:00','2026-04-29 15:30:00',1800,'completed'),(68,22,'2026-05-01 18:00:00','2026-05-01 18:50:00',3000,'completed'),(69,23,'2026-04-29 21:00:00','2026-04-29 22:00:00',3600,'completed'),(70,23,'2026-05-01 16:00:00','2026-05-01 16:45:00',2700,'completed'),(71,24,'2026-04-28 18:00:00','2026-04-28 19:00:00',3600,'completed'),(72,24,'2026-04-30 11:00:00','2026-04-30 11:40:00',2400,'completed'),(73,24,'2026-05-01 13:00:00','2026-05-01 13:50:00',3000,'completed'),(74,25,'2026-04-29 10:00:00','2026-04-29 10:25:00',1500,'completed'),(75,25,'2026-05-01 19:00:00','2026-05-01 19:30:00',1800,'completed'),(76,1,'2026-04-29 12:00:00','2026-04-29 12:20:00',1200,'completed'),(77,1,'2026-04-30 14:00:00','2026-04-30 14:15:00',900,'completed'),(78,2,'2026-04-28 17:00:00','2026-04-28 17:30:00',1800,'completed'),(79,2,'2026-05-01 20:00:00','2026-05-01 20:25:00',1500,'completed'),(82,26,'2026-04-29 16:00:00','2026-04-29 16:00:12',12,'completed'),(83,26,'2026-05-01 10:00:00','2026-05-01 10:00:08',8,'completed'),(84,27,'2026-04-30 11:00:00','2026-04-30 11:00:10',10,'completed'),(85,27,'2026-05-01 15:00:00','2026-05-01 15:00:06',6,'completed'),(86,6,'2026-04-28 10:15:00','2026-04-28 10:25:30',630,'completed'),(87,6,'2026-04-29 14:00:00','2026-04-29 14:12:00',720,'completed'),(88,6,'2026-04-30 20:30:00','2026-04-30 20:42:15',735,'completed'),(89,7,'2026-04-28 11:00:00','2026-04-28 11:18:00',1080,'completed'),(90,7,'2026-04-30 16:00:00','2026-04-30 16:20:00',1200,'completed'),(91,8,'2026-04-29 09:00:00','2026-04-29 09:45:00',2700,'completed'),(92,8,'2026-05-01 11:00:00','2026-05-01 11:30:00',1800,'completed'),(93,9,'2026-04-28 19:00:00','2026-04-28 19:35:00',2100,'completed'),(94,9,'2026-04-29 20:00:00','2026-04-29 20:25:00',1500,'completed'),(95,9,'2026-05-01 15:00:00','2026-05-01 15:40:00',2400,'completed'),(96,10,'2026-04-30 10:00:00','2026-04-30 10:50:00',3000,'completed'),(97,10,'2026-05-01 09:00:00','2026-05-01 09:30:00',1800,'completed'),(98,26,'2026-04-30 18:00:00','2026-04-30 18:00:15',15,'completed'),(99,26,'2026-05-01 12:00:00','2026-05-01 12:00:10',10,'completed'),(100,11,'2026-04-27 14:00:00','2026-04-27 14:45:00',2700,'completed'),(101,11,'2026-04-29 16:30:00','2026-04-29 17:00:00',1800,'completed'),(102,11,'2026-05-01 10:00:00','2026-05-01 10:20:00',1200,'completed'),(103,12,'2026-04-28 20:00:00','2026-04-28 20:50:00',3000,'completed'),(104,12,'2026-04-30 13:00:00','2026-04-30 13:40:00',2400,'completed'),(105,13,'2026-04-28 15:00:00','2026-04-28 15:15:00',900,'completed'),(106,13,'2026-04-29 18:00:00','2026-04-29 18:15:00',900,'completed'),(107,13,'2026-05-01 21:00:00','2026-05-01 21:15:00',900,'completed'),(108,14,'2026-04-29 11:00:00','2026-04-29 11:30:00',1800,'completed'),(109,14,'2026-05-01 17:00:00','2026-05-01 17:25:00',1500,'completed'),(110,15,'2026-04-28 22:00:00','2026-04-28 22:40:00',2400,'completed'),(111,15,'2026-04-30 21:00:00','2026-04-30 21:35:00',2100,'completed'),(112,15,'2026-05-01 23:00:00','2026-05-01 23:30:00',1800,'completed'),(113,27,'2026-04-30 19:00:00','2026-04-30 19:00:08',8,'completed'),(114,27,'2026-05-01 14:00:00','2026-05-01 14:00:05',5,'completed'),(115,16,'2026-04-27 09:00:00','2026-04-27 09:40:00',2400,'completed'),(116,16,'2026-04-29 13:00:00','2026-04-29 13:35:00',2100,'completed'),(117,16,'2026-05-01 20:00:00','2026-05-01 20:45:00',2700,'completed'),(118,17,'2026-04-28 10:00:00','2026-04-28 10:50:00',3000,'completed'),(119,17,'2026-04-30 15:00:00','2026-04-30 15:45:00',2700,'completed'),(120,18,'2026-04-28 16:00:00','2026-04-28 16:20:00',1200,'completed'),(121,18,'2026-04-29 19:00:00','2026-04-29 19:15:00',900,'completed'),(122,18,'2026-05-01 14:00:00','2026-05-01 14:25:00',1500,'completed'),(123,19,'2026-04-29 08:00:00','2026-04-29 08:55:00',3300,'completed'),(124,19,'2026-05-01 11:00:00','2026-05-01 11:40:00',2400,'completed'),(125,20,'2026-04-28 21:00:00','2026-04-28 21:30:00',1800,'completed'),(126,20,'2026-04-30 17:00:00','2026-04-30 17:25:00',1500,'completed'),(127,20,'2026-05-01 22:00:00','2026-05-01 22:40:00',2400,'completed'),(128,21,'2026-04-27 20:00:00','2026-04-27 20:45:00',2700,'completed'),(129,21,'2026-04-30 22:00:00','2026-04-30 22:35:00',2100,'completed'),(130,22,'2026-04-28 13:00:00','2026-04-28 13:40:00',2400,'completed'),(131,22,'2026-04-29 15:00:00','2026-04-29 15:30:00',1800,'completed'),(132,22,'2026-05-01 18:00:00','2026-05-01 18:50:00',3000,'completed'),(133,23,'2026-04-29 21:00:00','2026-04-29 22:00:00',3600,'completed'),(134,23,'2026-05-01 16:00:00','2026-05-01 16:45:00',2700,'completed'),(135,24,'2026-04-28 18:00:00','2026-04-28 19:00:00',3600,'completed'),(136,24,'2026-04-30 11:00:00','2026-04-30 11:40:00',2400,'completed'),(137,24,'2026-05-01 13:00:00','2026-05-01 13:50:00',3000,'completed'),(138,25,'2026-04-29 10:00:00','2026-04-29 10:25:00',1500,'completed'),(139,25,'2026-05-01 19:00:00','2026-05-01 19:30:00',1800,'completed'),(140,1,'2026-04-29 12:00:00','2026-04-29 12:20:00',1200,'completed'),(141,1,'2026-04-30 14:00:00','2026-04-30 14:15:00',900,'completed'),(142,2,'2026-04-28 17:00:00','2026-04-28 17:30:00',1800,'completed'),(143,2,'2026-05-01 20:00:00','2026-05-01 20:25:00',1500,'completed'),(146,26,'2026-04-29 16:00:00','2026-04-29 16:00:12',12,'completed'),(147,26,'2026-05-01 10:00:00','2026-05-01 10:00:08',8,'completed'),(148,27,'2026-04-30 11:00:00','2026-04-30 11:00:10',10,'completed'),(149,27,'2026-05-01 15:00:00','2026-05-01 15:00:06',6,'completed'),(150,27,'2026-05-02 14:34:03','2026-05-02 14:34:04',1,'completed'),(151,27,'2026-05-02 14:34:21','2026-05-02 14:34:23',2,'completed'),(152,1,'2026-05-02 14:37:52','2026-05-02 14:37:52',1200,'completed'),(153,1,'2026-05-02 14:37:52','2026-05-02 14:37:52',1500,'completed'),(154,1,'2026-05-02 14:37:52','2026-05-02 14:37:52',900,'completed'),(155,2,'2026-05-02 14:37:52','2026-05-02 14:37:52',2400,'completed'),(156,2,'2026-05-02 14:37:52','2026-05-02 14:37:52',1800,'completed'),(157,2,'2026-05-02 14:37:52','2026-05-02 14:37:52',3000,'completed'),(158,26,'2026-05-02 14:37:52','2026-05-02 14:37:52',15,'completed'),(159,26,'2026-05-02 14:37:52','2026-05-02 14:37:52',25,'completed'),(160,26,'2026-05-02 14:37:52','2026-05-02 14:37:52',10,'completed'),(161,26,'2026-05-02 14:37:52','2026-05-02 14:37:52',20,'completed'),(162,27,'2026-05-02 14:37:52','2026-05-02 14:37:52',10,'completed'),(163,27,'2026-05-02 14:37:52','2026-05-02 14:37:52',15,'completed'),(164,27,'2026-05-02 14:37:52','2026-05-02 14:37:52',12,'completed'),(165,27,'2026-05-02 14:37:52','2026-05-02 14:37:52',8,'completed'),(166,27,'2026-05-02 14:37:52','2026-05-02 14:37:52',20,'completed'),(167,1,'2026-05-02 14:42:35','2026-05-02 14:42:35',1200,'completed'),(168,1,'2026-05-02 14:42:35','2026-05-02 14:42:35',1200,'completed'),(169,1,'2026-05-02 14:42:35','2026-05-02 14:42:35',1200,'completed'),(170,26,'2026-05-02 14:42:35','2026-05-02 14:42:35',30,'completed'),(171,26,'2026-05-02 14:42:35','2026-05-02 14:42:35',45,'completed'),(172,30,'2026-05-02 14:42:35','2026-05-02 14:42:35',300,'completed'),(173,30,'2026-05-02 14:42:35','2026-05-02 14:42:35',320,'completed'),(174,31,'2026-05-02 14:42:35','2026-05-02 14:42:35',3600,'completed'),(175,32,'2026-05-02 14:42:35','2026-05-02 14:42:35',1800,'completed'),(176,32,'2026-05-02 14:42:35','2026-05-02 14:42:35',2400,'completed'),(177,33,'2026-05-02 14:42:35','2026-05-02 14:42:35',7200,'completed'),(178,34,'2026-05-02 14:42:35','2026-05-02 14:42:35',900,'completed'),(179,34,'2026-05-02 14:42:35','2026-05-02 14:42:35',900,'completed'),(180,28,'2026-05-02 14:57:34','2026-05-02 14:58:04',30,'completed'),(181,28,'2026-05-02 14:57:51','2026-05-02 14:58:21',30,'completed'),(182,26,'2026-05-02 15:00:48','2026-05-02 15:00:49',1,'completed'),(183,4,'2026-05-02 15:03:08','2026-05-02 15:03:08',10,'completed'),(184,28,'2026-05-03 19:24:15','2026-05-03 19:24:45',30,'completed'),(185,28,'2026-05-03 19:24:20','2026-05-03 19:24:50',30,'completed'),(186,47,'2026-05-04 22:30:43','2026-05-04 22:30:43',10,'completed'),(187,27,'2026-05-05 17:53:36','2026-05-05 17:53:42',6,'completed'),(188,26,'2026-05-05 21:46:37','2026-05-05 21:46:48',11,'completed'),(189,26,'2026-05-05 21:54:30','2026-05-05 21:54:43',13,'completed'),(190,26,'2026-05-05 22:20:37','2026-05-05 22:20:38',1,'completed'),(191,26,'2026-05-05 22:22:15','2026-05-05 22:22:27',12,'completed'),(192,26,'2026-05-05 22:29:04','2026-05-05 22:29:18',14,'completed'),(193,26,'2026-05-05 22:32:07','2026-05-05 22:32:24',17,'completed'),(194,26,'2026-05-06 15:24:28','2026-05-06 15:24:32',4,'completed');
/*!40000 ALTER TABLE `match_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `participation`
--

DROP TABLE IF EXISTS `participation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `participation` (
  `match_id` int NOT NULL,
  `user_id` varchar(10) NOT NULL,
  `score` int DEFAULT NULL,
  `result` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`match_id`,`user_id`),
  KEY `idx_participation_user` (`user_id`),
  CONSTRAINT `participation_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `match_session` (`match_id`) ON DELETE CASCADE,
  CONSTRAINT `participation_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `player` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `participation`
--

LOCK TABLES `participation` WRITE;
/*!40000 ALTER TABLE `participation` DISABLE KEYS */;
INSERT INTO `participation` VALUES (1,'p_101',7,'loss'),(2,'p_101',500,'win'),(3,'p_101',500,'win'),(5,'p_101',500,'win'),(6,'p_101',500,'win'),(8,'p_101',2,'win'),(9,'p_101',100,'win'),(10,'p_101',4,'win'),(11,'p_101',0,'loss'),(12,'p_101',3,'loss'),(13,'p_101',13,'win'),(14,'p_101',1,'loss'),(15,'p_101',2,'loss'),(16,'p_101',13,'win'),(17,'p_101',10,'win'),(18,'p_101',0,'loss'),(19,'p_103',2,'loss'),(20,'p_102',3,'loss'),(21,'p_101',1,'loss'),(22,'p_102',85,'win'),(23,'p_102',120,'win'),(24,'p_102',45,'loss'),(25,'p_102',200,'win'),(26,'p_102',150,'loss'),(27,'p_102',310,'win'),(28,'p_102',180,'loss'),(29,'p_102',400,'win'),(30,'p_102',350,'win'),(31,'p_102',275,'loss'),(32,'p_102',500,'win'),(33,'p_102',320,'loss'),(34,'p_102',12,'win'),(35,'p_102',8,'loss'),(36,'p_103',250,'win'),(37,'p_103',180,'loss'),(38,'p_103',300,'win'),(39,'p_103',420,'win'),(40,'p_103',380,'win'),(41,'p_103',3,'win'),(42,'p_103',1,'loss'),(43,'p_103',5,'win'),(44,'p_103',95,'win'),(45,'p_103',78,'loss'),(46,'p_103',22,'win'),(47,'p_103',18,'loss'),(48,'p_103',25,'win'),(49,'p_103',6,'win'),(50,'p_103',4,'loss'),(51,'p_104',15,'win'),(52,'p_104',8,'loss'),(53,'p_104',22,'win'),(54,'p_104',30,'win'),(55,'p_104',18,'loss'),(56,'p_104',45,'win'),(57,'p_104',32,'loss'),(58,'p_104',50,'win'),(59,'p_104',600,'win'),(60,'p_104',450,'loss'),(61,'p_104',350,'win'),(62,'p_104',280,'loss'),(63,'p_104',420,'win'),(64,'p_105',280,'win'),(65,'p_105',210,'loss'),(66,'p_105',175,'win'),(67,'p_105',130,'loss'),(68,'p_105',220,'win'),(69,'p_105',90,'loss'),(70,'p_105',150,'win'),(71,'p_105',110,'loss'),(72,'p_105',200,'win'),(73,'p_105',180,'win'),(74,'p_105',35,'win'),(75,'p_105',28,'loss'),(76,'p_106',320,'win'),(77,'p_106',250,'loss'),(78,'p_107',380,'win'),(79,'p_107',290,'loss'),(82,'p_109',9,'win'),(83,'p_109',5,'loss'),(84,'p_110',8,'win'),(85,'p_110',5,'loss'),(86,'p_102',85,'win'),(87,'p_102',120,'win'),(88,'p_102',45,'loss'),(89,'p_102',200,'win'),(90,'p_102',150,'loss'),(91,'p_102',310,'win'),(92,'p_102',180,'loss'),(93,'p_102',400,'win'),(94,'p_102',350,'win'),(95,'p_102',275,'loss'),(96,'p_102',500,'win'),(97,'p_102',320,'loss'),(98,'p_102',12,'win'),(99,'p_102',8,'loss'),(100,'p_103',250,'win'),(101,'p_103',180,'loss'),(102,'p_103',300,'win'),(103,'p_103',420,'win'),(104,'p_103',380,'win'),(105,'p_103',3,'win'),(106,'p_103',1,'loss'),(107,'p_103',5,'win'),(108,'p_103',95,'win'),(109,'p_103',78,'loss'),(110,'p_103',22,'win'),(111,'p_103',18,'loss'),(112,'p_103',25,'win'),(113,'p_103',6,'win'),(114,'p_103',4,'loss'),(115,'p_104',15,'win'),(116,'p_104',8,'loss'),(117,'p_104',22,'win'),(118,'p_104',30,'win'),(119,'p_104',18,'loss'),(120,'p_104',45,'win'),(121,'p_104',32,'loss'),(122,'p_104',50,'win'),(123,'p_104',600,'win'),(124,'p_104',450,'loss'),(125,'p_104',350,'win'),(126,'p_104',280,'loss'),(127,'p_104',420,'win'),(128,'p_105',280,'win'),(129,'p_105',210,'loss'),(130,'p_105',175,'win'),(131,'p_105',130,'loss'),(132,'p_105',220,'win'),(133,'p_105',90,'loss'),(134,'p_105',150,'win'),(135,'p_105',110,'loss'),(136,'p_105',200,'win'),(137,'p_105',180,'win'),(138,'p_105',35,'win'),(139,'p_105',28,'loss'),(140,'p_106',320,'win'),(141,'p_106',250,'loss'),(142,'p_107',380,'win'),(143,'p_107',290,'loss'),(146,'p_109',9,'win'),(147,'p_109',5,'loss'),(148,'p_110',8,'win'),(149,'p_110',5,'loss'),(150,'p_101',1,'loss'),(151,'p_101',2,'loss'),(152,'p_111',850,'win'),(153,'p_112',150,'loss'),(154,'p_114',600,'win'),(155,'p_111',920,'win'),(156,'p_113',400,'loss'),(157,'p_114',750,'win'),(158,'p_111',150,'win'),(159,'p_112',5,'loss'),(160,'p_113',85,'win'),(161,'p_115',20,'loss'),(162,'p_111',25,'win'),(163,'p_112',2,'loss'),(164,'p_113',18,'win'),(165,'p_114',10,'win'),(166,'p_115',1,'loss'),(167,'p_116',100,'loss'),(167,'p_117',950,'win'),(167,'p_118',200,'loss'),(167,'p_119',400,'loss'),(167,'p_120',880,'win'),(168,'p_121',300,'loss'),(168,'p_122',1000,'win'),(168,'p_123',50,'loss'),(168,'p_124',700,'loss'),(168,'p_125',910,'win'),(169,'p_126',10,'loss'),(169,'p_127',800,'loss'),(169,'p_128',1100,'win'),(169,'p_129',650,'loss'),(169,'p_130',250,'loss'),(170,'p_116',50,'loss'),(170,'p_117',120,'win'),(170,'p_118',200,'win'),(171,'p_119',10,'loss'),(171,'p_120',300,'win'),(172,'p_111',2000,'win'),(172,'p_112',1500,'loss'),(172,'p_113',1800,'loss'),(173,'p_116',2500,'win'),(173,'p_117',1200,'loss'),(174,'p_120',50,'loss'),(174,'p_121',80,'loss'),(174,'p_122',120,'loss'),(174,'p_123',300,'win'),(174,'p_124',25,'loss'),(175,'p_125',450,'win'),(175,'p_126',10,'loss'),(175,'p_127',300,'loss'),(176,'p_128',800,'win'),(176,'p_129',600,'loss'),(177,'p_101',2000,'loss'),(177,'p_102',5000,'win'),(177,'p_103',800,'loss'),(177,'p_104',1200,'loss'),(177,'p_130',1500,'loss'),(178,'p_105',15,'loss'),(178,'p_106',25,'win'),(178,'p_107',10,'loss'),(179,'p_108',30,'win'),(179,'p_109',5,'loss'),(180,'p_101',0,'loss'),(181,'p_101',0,'loss'),(182,'p_101',0,'loss'),(183,'p_101',0,'loss'),(184,'p_101',0,'loss'),(185,'p_101',0,'loss'),(186,'p_333',0,'loss'),(187,'p_101',6,'loss'),(188,'p_101',11,'win'),(189,'p_112',13,'win'),(190,'p_109',1,'loss'),(191,'p_109',12,'win'),(192,'p_119',14,'win'),(193,'p_119',17,'win'),(194,'p_101',4,'loss');
/*!40000 ALTER TABLE `participation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `player`
--

DROP TABLE IF EXISTS `player`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `player` (
  `user_id` varchar(10) NOT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `player_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `player`
--

LOCK TABLES `player` WRITE;
/*!40000 ALTER TABLE `player` DISABLE KEYS */;
INSERT INTO `player` VALUES ('p_101'),('p_102'),('p_103'),('p_104'),('p_105'),('p_106'),('p_107'),('p_108'),('p_109'),('p_110'),('p_111'),('p_112'),('p_113'),('p_114'),('p_115'),('p_116'),('p_117'),('p_118'),('p_119'),('p_120'),('p_121'),('p_122'),('p_123'),('p_124'),('p_125'),('p_126'),('p_127'),('p_128'),('p_129'),('p_130'),('p_333'),('p_3333');
/*!40000 ALTER TABLE `player` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `player_game_stats`
--

DROP TABLE IF EXISTS `player_game_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `player_game_stats` (
  `user_id` varchar(10) NOT NULL,
  `game_id` int NOT NULL,
  `total_play_time` int DEFAULT NULL,
  `experience` int DEFAULT NULL,
  `rank_level` int DEFAULT NULL,
  `best_score` int DEFAULT '0',
  PRIMARY KEY (`user_id`,`game_id`),
  KEY `player_game_stats_ibfk_2` (`game_id`),
  CONSTRAINT `player_game_stats_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `player` (`user_id`),
  CONSTRAINT `player_game_stats_ibfk_2` FOREIGN KEY (`game_id`) REFERENCES `game` (`game_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `player_game_stats`
--

LOCK TABLES `player_game_stats` WRITE;
/*!40000 ALTER TABLE `player_game_stats` DISABLE KEYS */;
INSERT INTO `player_game_stats` VALUES ('p_101',1,2,100,11,500),('p_101',2,2,100,3,500),('p_101',4,1,10,1,0),('p_101',26,6,180,5,100),('p_101',27,11,270,3,13),('p_101',28,6,60,1,0),('p_101',33,1,10,2,2000),('p_102',6,6,220,1,120),('p_102',7,4,120,1,200),('p_102',8,4,120,1,310),('p_102',9,6,220,1,400),('p_102',10,4,120,1,500),('p_102',26,5,130,11,12),('p_102',33,1,50,1,5000),('p_103',11,6,220,1,300),('p_103',12,4,200,1,420),('p_103',13,6,220,1,5),('p_103',14,4,120,1,95),('p_103',15,6,220,1,25),('p_103',27,5,130,6,6),('p_103',33,1,10,5,800),('p_104',16,6,220,1,22),('p_104',17,4,120,1,30),('p_104',18,6,220,1,50),('p_104',19,4,120,1,600),('p_104',20,6,220,1,420),('p_104',33,1,10,4,1200),('p_105',21,4,120,1,280),('p_105',22,6,220,1,220),('p_105',23,4,120,1,150),('p_105',24,6,220,1,200),('p_105',25,4,120,1,35),('p_105',34,1,10,3,15),('p_106',1,4,120,13,320),('p_106',34,1,50,2,25),('p_107',2,4,120,5,380),('p_107',34,1,10,4,10),('p_108',34,1,50,1,30),('p_109',26,6,180,12,12),('p_109',34,1,10,5,5),('p_110',27,4,120,5,8),('p_111',1,1,50,6,850),('p_111',2,1,50,1,920),('p_111',26,1,50,3,150),('p_111',27,1,50,1,25),('p_111',30,1,50,2,2000),('p_112',1,1,10,17,150),('p_112',26,2,60,10,13),('p_112',27,1,10,7,2),('p_112',30,1,10,4,1500),('p_113',2,1,10,4,400),('p_113',26,1,50,6,85),('p_113',27,1,50,2,18),('p_113',30,1,10,3,1800),('p_114',1,1,50,10,600),('p_114',2,1,50,2,750),('p_114',27,1,50,4,10),('p_115',26,1,10,8,20),('p_115',27,1,10,8,1),('p_116',1,1,10,18,100),('p_116',26,1,10,7,50),('p_116',30,1,50,1,2500),('p_117',1,1,50,3,950),('p_117',26,1,50,4,120),('p_117',30,1,10,5,1200),('p_118',1,1,10,16,200),('p_118',26,1,50,2,200),('p_119',1,1,10,12,400),('p_119',26,3,110,9,17),('p_120',1,1,50,5,880),('p_120',26,1,50,1,300),('p_120',31,1,10,4,50),('p_121',1,1,10,14,300),('p_121',31,1,10,3,80),('p_122',1,1,50,2,1000),('p_122',31,1,10,2,120),('p_123',1,1,10,19,50),('p_123',31,1,50,1,300),('p_124',1,1,10,8,700),('p_124',31,1,10,5,25),('p_125',1,1,50,4,910),('p_125',32,1,50,3,450),('p_126',1,1,10,20,10),('p_126',32,1,10,5,10),('p_127',1,1,10,7,800),('p_127',32,1,10,4,300),('p_128',1,1,50,1,1100),('p_128',32,1,50,1,800),('p_129',1,1,10,9,650),('p_129',32,1,10,2,600),('p_130',1,1,10,15,250),('p_130',33,1,10,3,1500),('p_333',47,1,10,1,0);
/*!40000 ALTER TABLE `player_game_stats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase`
--

DROP TABLE IF EXISTS `purchase`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase` (
  `purchase_id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(10) DEFAULT NULL,
  `game_id` int DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `purchase_date` datetime DEFAULT NULL,
  PRIMARY KEY (`purchase_id`),
  KEY `idx_purchase_user` (`user_id`),
  KEY `idx_purchase_game` (`game_id`),
  CONSTRAINT `purchase_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `player` (`user_id`),
  CONSTRAINT `purchase_ibfk_2` FOREIGN KEY (`game_id`) REFERENCES `game` (`game_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase`
--

LOCK TABLES `purchase` WRITE;
/*!40000 ALTER TABLE `purchase` DISABLE KEYS */;
INSERT INTO `purchase` VALUES (1,'p_101',1,70.00,'2026-05-01 17:19:50'),(2,'p_101',2,60.00,'2026-05-01 17:19:50'),(4,'p_101',4,45.00,'2026-05-01 17:19:50'),(5,'p_101',5,30.00,'2026-05-01 17:19:50'),(6,'p_102',6,65.00,'2026-05-01 17:19:50'),(7,'p_102',7,70.00,'2026-05-01 17:19:50'),(8,'p_102',8,50.00,'2026-05-01 17:19:50'),(9,'p_102',9,40.00,'2026-05-01 17:19:50'),(10,'p_102',10,25.00,'2026-05-01 17:19:50'),(11,'p_103',11,75.00,'2026-05-01 17:19:50'),(12,'p_103',12,80.00,'2026-05-01 17:19:50'),(13,'p_103',13,60.00,'2026-05-01 17:19:50'),(14,'p_103',14,55.00,'2026-05-01 17:19:50'),(15,'p_103',15,35.00,'2026-05-01 17:19:50'),(16,'p_104',16,70.00,'2026-05-01 17:19:50'),(17,'p_104',17,65.00,'2026-05-01 17:19:50'),(18,'p_104',18,58.00,'2026-05-01 17:19:50'),(19,'p_104',19,48.00,'2026-05-01 17:19:50'),(20,'p_104',20,28.00,'2026-05-01 17:19:50'),(21,'p_105',21,68.00,'2026-05-01 17:19:50'),(22,'p_105',22,72.00,'2026-05-01 17:19:50'),(23,'p_105',23,62.00,'2026-05-01 17:19:50'),(24,'p_105',24,52.00,'2026-05-01 17:19:50'),(25,'p_105',25,32.00,'2026-05-01 17:19:50'),(26,'p_101',26,50.00,'2026-05-01 17:22:04'),(27,'p_101',27,60.00,'2026-05-01 17:29:08'),(28,'p_101',28,70.00,'2026-05-01 17:57:35'),(29,'p_103',27,60.00,'2026-05-01 18:56:58'),(30,'p_102',26,50.00,'2026-05-02 02:05:11'),(31,'p_111',1,50.00,'2026-05-02 14:37:52'),(32,'p_111',2,60.00,'2026-05-02 14:37:52'),(33,'p_111',26,10.00,'2026-05-02 14:37:52'),(34,'p_111',27,10.00,'2026-05-02 14:37:52'),(35,'p_112',1,50.00,'2026-05-02 14:37:52'),(36,'p_112',26,10.00,'2026-05-02 14:37:52'),(37,'p_112',27,10.00,'2026-05-02 14:37:52'),(38,'p_113',2,60.00,'2026-05-02 14:37:52'),(39,'p_113',26,10.00,'2026-05-02 14:37:52'),(40,'p_113',27,10.00,'2026-05-02 14:37:52'),(41,'p_114',1,50.00,'2026-05-02 14:37:52'),(42,'p_114',2,60.00,'2026-05-02 14:37:52'),(43,'p_114',27,10.00,'2026-05-02 14:37:52'),(44,'p_115',26,10.00,'2026-05-02 14:37:52'),(45,'p_115',27,10.00,'2026-05-02 14:37:52'),(46,'p_116',1,50.00,'2026-05-02 14:42:35'),(47,'p_117',1,50.00,'2026-05-02 14:42:35'),(48,'p_118',1,50.00,'2026-05-02 14:42:35'),(49,'p_119',1,50.00,'2026-05-02 14:42:35'),(50,'p_120',1,50.00,'2026-05-02 14:42:35'),(51,'p_121',1,50.00,'2026-05-02 14:42:35'),(52,'p_122',1,50.00,'2026-05-02 14:42:35'),(53,'p_123',1,50.00,'2026-05-02 14:42:35'),(54,'p_124',1,50.00,'2026-05-02 14:42:35'),(55,'p_125',1,50.00,'2026-05-02 14:42:35'),(56,'p_126',1,50.00,'2026-05-02 14:42:35'),(57,'p_127',1,50.00,'2026-05-02 14:42:35'),(58,'p_128',1,50.00,'2026-05-02 14:42:35'),(59,'p_129',1,50.00,'2026-05-02 14:42:35'),(60,'p_130',1,50.00,'2026-05-02 14:42:35'),(61,'p_116',26,10.00,'2026-05-02 14:42:35'),(62,'p_117',26,10.00,'2026-05-02 14:42:35'),(63,'p_118',26,10.00,'2026-05-02 14:42:35'),(64,'p_119',26,10.00,'2026-05-02 14:42:35'),(65,'p_120',26,10.00,'2026-05-02 14:42:35'),(66,'p_111',30,25.00,'2026-05-02 14:42:35'),(67,'p_112',30,25.00,'2026-05-02 14:42:35'),(68,'p_113',30,25.00,'2026-05-02 14:42:35'),(69,'p_116',30,25.00,'2026-05-02 14:42:35'),(70,'p_117',30,25.00,'2026-05-02 14:42:35'),(71,'p_120',31,15.00,'2026-05-02 14:42:35'),(72,'p_121',31,15.00,'2026-05-02 14:42:35'),(73,'p_122',31,15.00,'2026-05-02 14:42:35'),(74,'p_123',31,15.00,'2026-05-02 14:42:35'),(75,'p_124',31,15.00,'2026-05-02 14:42:35'),(76,'p_125',32,30.00,'2026-05-02 14:42:35'),(77,'p_126',32,30.00,'2026-05-02 14:42:35'),(78,'p_127',32,30.00,'2026-05-02 14:42:35'),(79,'p_128',32,30.00,'2026-05-02 14:42:35'),(80,'p_129',32,30.00,'2026-05-02 14:42:35'),(81,'p_130',33,40.00,'2026-05-02 14:42:35'),(82,'p_101',33,40.00,'2026-05-02 14:42:35'),(83,'p_102',33,40.00,'2026-05-02 14:42:35'),(84,'p_103',33,40.00,'2026-05-02 14:42:35'),(85,'p_104',33,40.00,'2026-05-02 14:42:35'),(86,'p_105',34,0.00,'2026-05-02 14:42:35'),(87,'p_106',34,0.00,'2026-05-02 14:42:35'),(88,'p_107',34,0.00,'2026-05-02 14:42:35'),(89,'p_108',34,0.00,'2026-05-02 14:42:35'),(90,'p_109',34,0.00,'2026-05-02 14:42:35'),(91,'p_102',5,0.00,'2026-05-02 21:46:45'),(92,'p_104',7,0.00,'2026-05-04 22:28:08'),(93,'p_104',1,70.00,'2026-05-04 22:28:21'),(94,'p_333',47,15000.00,'2026-05-04 22:30:34'),(95,'p_109',29,200.00,'2026-05-05 22:10:51'),(96,'p_109',26,50.00,'2026-05-05 22:20:27'),(97,'p_101',11,60.00,'2026-05-06 11:45:10'),(98,'p_101',29,200.00,'2026-05-06 15:23:52');
/*!40000 ALTER TABLE `purchase` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transaction`
--

DROP TABLE IF EXISTS `transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaction` (
  `transaction_id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(10) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `transaction_type` varchar(50) DEFAULT NULL,
  `description` varchar(200) DEFAULT NULL,
  `reference_id` varchar(50) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT 'Wallet',
  `transaction_status` enum('pending','completed','failed') DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`transaction_id`),
  KEY `idx_transaction_user` (`user_id`),
  CONSTRAINT `transaction_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `wallet` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=470 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transaction`
--

LOCK TABLES `transaction` WRITE;
/*!40000 ALTER TABLE `transaction` DISABLE KEYS */;
INSERT INTO `transaction` VALUES (203,'p_101',70.00,'purchase','Purchased: Call of Duty','GAME-91810516','Gameverse Wallet','completed','2026-05-01 17:19:50'),(204,'p_111',50.00,'purchase','Purchased: Call of Duty','GAME-78687484','Gameverse Wallet','completed','2026-05-02 14:37:52'),(205,'p_112',50.00,'purchase','Purchased: Call of Duty','GAME-18005877','Gameverse Wallet','completed','2026-05-02 14:37:52'),(206,'p_114',50.00,'purchase','Purchased: Call of Duty','GAME-53966934','Gameverse Wallet','completed','2026-05-02 14:37:52'),(207,'p_116',50.00,'purchase','Purchased: Call of Duty','GAME-15817046','Gameverse Wallet','completed','2026-05-02 14:42:35'),(208,'p_117',50.00,'purchase','Purchased: Call of Duty','GAME-17184430','Gameverse Wallet','completed','2026-05-02 14:42:35'),(209,'p_118',50.00,'purchase','Purchased: Call of Duty','GAME-38471017','Gameverse Wallet','completed','2026-05-02 14:42:35'),(210,'p_119',50.00,'purchase','Purchased: Call of Duty','GAME-40801798','Gameverse Wallet','completed','2026-05-02 14:42:35'),(211,'p_120',50.00,'purchase','Purchased: Call of Duty','GAME-88595941','Gameverse Wallet','completed','2026-05-02 14:42:35'),(212,'p_121',50.00,'purchase','Purchased: Call of Duty','GAME-20574321','Gameverse Wallet','completed','2026-05-02 14:42:35'),(213,'p_122',50.00,'purchase','Purchased: Call of Duty','GAME-37083782','Gameverse Wallet','completed','2026-05-02 14:42:35'),(214,'p_123',50.00,'purchase','Purchased: Call of Duty','GAME-23695950','Gameverse Wallet','completed','2026-05-02 14:42:35'),(215,'p_124',50.00,'purchase','Purchased: Call of Duty','GAME-07228410','Gameverse Wallet','completed','2026-05-02 14:42:35'),(216,'p_125',50.00,'purchase','Purchased: Call of Duty','GAME-65054202','Gameverse Wallet','completed','2026-05-02 14:42:35'),(217,'p_126',50.00,'purchase','Purchased: Call of Duty','GAME-03585788','Gameverse Wallet','completed','2026-05-02 14:42:35'),(218,'p_127',50.00,'purchase','Purchased: Call of Duty','GAME-22766333','Gameverse Wallet','completed','2026-05-02 14:42:35'),(219,'p_128',50.00,'purchase','Purchased: Call of Duty','GAME-03074305','Gameverse Wallet','completed','2026-05-02 14:42:35'),(220,'p_129',50.00,'purchase','Purchased: Call of Duty','GAME-47072532','Gameverse Wallet','completed','2026-05-02 14:42:35'),(221,'p_130',50.00,'purchase','Purchased: Call of Duty','GAME-26139747','Gameverse Wallet','completed','2026-05-02 14:42:35'),(222,'p_101',60.00,'purchase','Purchased: Grand Theft Auto V','GAME-89481143','Gameverse Wallet','completed','2026-05-01 17:19:50'),(223,'p_111',60.00,'purchase','Purchased: Grand Theft Auto V','GAME-68986482','Gameverse Wallet','completed','2026-05-02 14:37:52'),(224,'p_113',60.00,'purchase','Purchased: Grand Theft Auto V','GAME-76488982','Gameverse Wallet','completed','2026-05-02 14:37:52'),(225,'p_114',60.00,'purchase','Purchased: Grand Theft Auto V','GAME-75485471','Gameverse Wallet','completed','2026-05-02 14:37:52'),(226,'p_101',50.00,'purchase','Purchased: The Witcher 3','GAME-47960411','Gameverse Wallet','completed','2026-05-01 17:19:50'),(227,'p_101',45.00,'purchase','Purchased: Minecraft','GAME-13345649','Gameverse Wallet','completed','2026-05-01 17:19:50'),(228,'p_101',30.00,'purchase','Purchased: Fortnite','GAME-22847012','Gameverse Wallet','completed','2026-05-01 17:19:50'),(229,'p_102',65.00,'purchase','Purchased: PUBG','GAME-74198117','Gameverse Wallet','completed','2026-05-01 17:19:50'),(230,'p_102',70.00,'purchase','Purchased: Apex Legends','GAME-02449555','Gameverse Wallet','completed','2026-05-01 17:19:50'),(231,'p_102',50.00,'purchase','Purchased: Elden Ring','GAME-89653426','Gameverse Wallet','completed','2026-05-01 17:19:50'),(232,'p_102',40.00,'purchase','Purchased: God of War','GAME-40918471','Gameverse Wallet','completed','2026-05-01 17:19:50'),(233,'p_102',25.00,'purchase','Purchased: Assassin???s Creed Valhalla','GAME-35632081','Gameverse Wallet','completed','2026-05-01 17:19:50'),(234,'p_103',75.00,'purchase','Purchased: Cyberpunk 2077','GAME-55404997','Gameverse Wallet','completed','2026-05-01 17:19:50'),(235,'p_103',80.00,'purchase','Purchased: Red Dead Redemption 2','GAME-70128743','Gameverse Wallet','completed','2026-05-01 17:19:50'),(236,'p_103',60.00,'purchase','Purchased: FIFA 23','GAME-84428731','Gameverse Wallet','completed','2026-05-01 17:19:50'),(237,'p_103',55.00,'purchase','Purchased: NBA 2K24','GAME-11757430','Gameverse Wallet','completed','2026-05-01 17:19:50'),(238,'p_103',35.00,'purchase','Purchased: Valorant','GAME-05500958','Gameverse Wallet','completed','2026-05-01 17:19:50'),(239,'p_104',70.00,'purchase','Purchased: League of Legends','GAME-92232506','Gameverse Wallet','completed','2026-05-01 17:19:50'),(240,'p_104',65.00,'purchase','Purchased: Dota 2','GAME-44659660','Gameverse Wallet','completed','2026-05-01 17:19:50'),(241,'p_104',58.00,'purchase','Purchased: Overwatch','GAME-46600786','Gameverse Wallet','completed','2026-05-01 17:19:50'),(242,'p_104',48.00,'purchase','Purchased: Horizon Zero Dawn','GAME-99024952','Gameverse Wallet','completed','2026-05-01 17:19:50'),(243,'p_104',28.00,'purchase','Purchased: Spider-Man','GAME-55322408','Gameverse Wallet','completed','2026-05-01 17:19:50'),(244,'p_105',68.00,'purchase','Purchased: Resident Evil Village','GAME-79537188','Gameverse Wallet','completed','2026-05-01 17:19:50'),(245,'p_105',72.00,'purchase','Purchased: Far Cry 6','GAME-31718721','Gameverse Wallet','completed','2026-05-01 17:19:50'),(246,'p_105',62.00,'purchase','Purchased: Dark Souls III','GAME-19982043','Gameverse Wallet','completed','2026-05-01 17:19:50'),(247,'p_105',52.00,'purchase','Purchased: Sekiro: Shadows Die Twice','GAME-04754056','Gameverse Wallet','completed','2026-05-01 17:19:50'),(248,'p_105',32.00,'purchase','Purchased: Halo Infinite','GAME-63824155','Gameverse Wallet','completed','2026-05-01 17:19:50'),(249,'p_101',50.00,'purchase','Purchased: Game A','GAME-04858615','Gameverse Wallet','completed','2026-05-01 17:22:04'),(250,'p_102',50.00,'purchase','Purchased: Game A','GAME-32820609','Gameverse Wallet','completed','2026-05-02 02:05:11'),(251,'p_111',10.00,'purchase','Purchased: Game A','GAME-49527206','Gameverse Wallet','completed','2026-05-02 14:37:52'),(252,'p_112',10.00,'purchase','Purchased: Game A','GAME-49174205','Gameverse Wallet','completed','2026-05-02 14:37:52'),(253,'p_113',10.00,'purchase','Purchased: Game A','GAME-97289412','Gameverse Wallet','completed','2026-05-02 14:37:52'),(254,'p_115',10.00,'purchase','Purchased: Game A','GAME-38924450','Gameverse Wallet','completed','2026-05-02 14:37:52'),(255,'p_116',10.00,'purchase','Purchased: Game A','GAME-02754018','Gameverse Wallet','completed','2026-05-02 14:42:35'),(256,'p_117',10.00,'purchase','Purchased: Game A','GAME-96996741','Gameverse Wallet','completed','2026-05-02 14:42:35'),(257,'p_118',10.00,'purchase','Purchased: Game A','GAME-76721657','Gameverse Wallet','completed','2026-05-02 14:42:35'),(258,'p_119',10.00,'purchase','Purchased: Game A','GAME-92618068','Gameverse Wallet','completed','2026-05-02 14:42:35'),(259,'p_120',10.00,'purchase','Purchased: Game A','GAME-32925374','Gameverse Wallet','completed','2026-05-02 14:42:35'),(260,'p_101',60.00,'purchase','Purchased: Game B','GAME-86772666','Gameverse Wallet','completed','2026-05-01 17:29:08'),(261,'p_103',60.00,'purchase','Purchased: Game B','GAME-35087217','Gameverse Wallet','completed','2026-05-01 18:56:58'),(262,'p_111',10.00,'purchase','Purchased: Game B','GAME-15118087','Gameverse Wallet','completed','2026-05-02 14:37:52'),(263,'p_112',10.00,'purchase','Purchased: Game B','GAME-70328786','Gameverse Wallet','completed','2026-05-02 14:37:52'),(264,'p_113',10.00,'purchase','Purchased: Game B','GAME-06289679','Gameverse Wallet','completed','2026-05-02 14:37:52'),(265,'p_114',10.00,'purchase','Purchased: Game B','GAME-20462036','Gameverse Wallet','completed','2026-05-02 14:37:52'),(266,'p_115',10.00,'purchase','Purchased: Game B','GAME-83441148','Gameverse Wallet','completed','2026-05-02 14:37:52'),(267,'p_101',70.00,'purchase','Purchased: Game C','GAME-55819638','Gameverse Wallet','completed','2026-05-01 17:57:35'),(268,'p_111',25.00,'purchase','Purchased: Neon Drift','GAME-28774752','Gameverse Wallet','completed','2026-05-02 14:42:35'),(269,'p_112',25.00,'purchase','Purchased: Neon Drift','GAME-76414845','Gameverse Wallet','completed','2026-05-02 14:42:35'),(270,'p_113',25.00,'purchase','Purchased: Neon Drift','GAME-95749977','Gameverse Wallet','completed','2026-05-02 14:42:35'),(271,'p_116',25.00,'purchase','Purchased: Neon Drift','GAME-49505355','Gameverse Wallet','completed','2026-05-02 14:42:35'),(272,'p_117',25.00,'purchase','Purchased: Neon Drift','GAME-60276845','Gameverse Wallet','completed','2026-05-02 14:42:35'),(273,'p_120',15.00,'purchase','Purchased: Space Miner','GAME-52868167','Gameverse Wallet','completed','2026-05-02 14:42:35'),(274,'p_121',15.00,'purchase','Purchased: Space Miner','GAME-83510301','Gameverse Wallet','completed','2026-05-02 14:42:35'),(275,'p_122',15.00,'purchase','Purchased: Space Miner','GAME-58947012','Gameverse Wallet','completed','2026-05-02 14:42:35'),(276,'p_123',15.00,'purchase','Purchased: Space Miner','GAME-44204160','Gameverse Wallet','completed','2026-05-02 14:42:35'),(277,'p_124',15.00,'purchase','Purchased: Space Miner','GAME-44179766','Gameverse Wallet','completed','2026-05-02 14:42:35'),(278,'p_125',30.00,'purchase','Purchased: Zombie Survival','GAME-88286354','Gameverse Wallet','completed','2026-05-02 14:42:35'),(279,'p_126',30.00,'purchase','Purchased: Zombie Survival','GAME-08892479','Gameverse Wallet','completed','2026-05-02 14:42:35'),(280,'p_127',30.00,'purchase','Purchased: Zombie Survival','GAME-79603335','Gameverse Wallet','completed','2026-05-02 14:42:35'),(281,'p_128',30.00,'purchase','Purchased: Zombie Survival','GAME-71339245','Gameverse Wallet','completed','2026-05-02 14:42:35'),(282,'p_129',30.00,'purchase','Purchased: Zombie Survival','GAME-17886224','Gameverse Wallet','completed','2026-05-02 14:42:35'),(283,'p_130',40.00,'purchase','Purchased: Mystic Quest','GAME-75413385','Gameverse Wallet','completed','2026-05-02 14:42:35'),(284,'p_101',40.00,'purchase','Purchased: Mystic Quest','GAME-23408259','Gameverse Wallet','completed','2026-05-02 14:42:35'),(285,'p_102',40.00,'purchase','Purchased: Mystic Quest','GAME-90801143','Gameverse Wallet','completed','2026-05-02 14:42:35'),(286,'p_103',40.00,'purchase','Purchased: Mystic Quest','GAME-83780945','Gameverse Wallet','completed','2026-05-02 14:42:35'),(287,'p_104',40.00,'purchase','Purchased: Mystic Quest','GAME-46501298','Gameverse Wallet','completed','2026-05-02 14:42:35'),(288,'p_105',0.00,'purchase','Purchased: Battle Arena','GAME-81163660','Gameverse Wallet','completed','2026-05-02 14:42:35'),(289,'p_106',0.00,'purchase','Purchased: Battle Arena','GAME-66314411','Gameverse Wallet','completed','2026-05-02 14:42:35'),(290,'p_107',0.00,'purchase','Purchased: Battle Arena','GAME-88081080','Gameverse Wallet','completed','2026-05-02 14:42:35'),(291,'p_108',0.00,'purchase','Purchased: Battle Arena','GAME-41462174','Gameverse Wallet','completed','2026-05-02 14:42:35'),(292,'p_109',0.00,'purchase','Purchased: Battle Arena','GAME-43067629','Gameverse Wallet','completed','2026-05-02 14:42:35'),(330,'p_101',500.00,'deposit','Wallet top-up','BANK-75706700','Bank Transfer','completed','2026-04-25 10:00:00'),(331,'p_101',1000.00,'deposit','Wallet top-up','BANK-91565573','Bank Transfer','completed','2026-04-27 14:30:00'),(332,'p_102',800.00,'deposit','Wallet top-up','BANK-30707769','Bank Transfer','completed','2026-04-26 09:15:00'),(333,'p_102',500.00,'deposit','Wallet top-up','BANK-78842126','Bank Transfer','completed','2026-04-28 16:00:00'),(334,'p_103',600.00,'deposit','Wallet top-up','BANK-02087332','Bank Transfer','completed','2026-04-25 11:00:00'),(335,'p_103',900.00,'deposit','Wallet top-up','BANK-73910282','Bank Transfer','completed','2026-04-29 18:00:00'),(336,'p_104',1200.00,'deposit','Wallet top-up','BANK-63289422','Bank Transfer','completed','2026-04-26 08:00:00'),(337,'p_105',750.00,'deposit','Wallet top-up','BANK-94716266','Bank Transfer','completed','2026-04-27 12:00:00'),(338,'p_105',400.00,'deposit','Wallet top-up','BANK-83713071','Bank Transfer','completed','2026-04-30 20:00:00'),(339,'p_106',300.00,'deposit','Wallet top-up','BANK-34416562','Bank Transfer','completed','2026-04-28 10:00:00'),(340,'p_107',500.00,'deposit','Wallet top-up','BANK-20943599','Bank Transfer','completed','2026-04-29 13:00:00'),(341,'p_108',200.00,'deposit','Wallet top-up','BANK-01468313','Bank Transfer','completed','2026-04-30 15:00:00'),(342,'p_109',350.00,'deposit','Wallet top-up','BANK-44510769','Bank Transfer','completed','2026-04-27 17:00:00'),(343,'p_110',450.00,'deposit','Wallet top-up','BANK-18148912','Bank Transfer','completed','2026-04-28 19:00:00'),(344,'p_111',2000.00,'deposit','Wallet top-up','BANK-57212255','Bank Transfer','completed','2026-04-26 10:00:00'),(345,'p_112',300.00,'deposit','Wallet top-up','BANK-31614544','Bank Transfer','completed','2026-04-27 11:00:00'),(346,'p_113',800.00,'deposit','Wallet top-up','BANK-86435958','Bank Transfer','completed','2026-04-28 14:00:00'),(347,'p_114',1500.00,'deposit','Wallet top-up','BANK-37336163','Bank Transfer','completed','2026-04-29 09:00:00'),(348,'p_115',600.00,'deposit','Wallet top-up','BANK-27372946','Bank Transfer','completed','2026-04-30 16:00:00'),(349,'p_116',1000.00,'deposit','Wallet top-up','BANK-24856245','Bank Transfer','completed','2026-04-25 12:00:00'),(350,'p_117',900.00,'deposit','Wallet top-up','BANK-42162388','Bank Transfer','completed','2026-04-26 15:00:00'),(351,'p_118',700.00,'deposit','Wallet top-up','BANK-36243213','Bank Transfer','completed','2026-04-27 18:00:00'),(352,'p_119',550.00,'deposit','Wallet top-up','BANK-54728901','Bank Transfer','completed','2026-04-28 08:00:00'),(353,'p_120',1100.00,'deposit','Wallet top-up','BANK-64914873','Bank Transfer','completed','2026-04-29 11:00:00'),(354,'p_121',400.00,'deposit','Wallet top-up','BANK-60387667','Bank Transfer','completed','2026-04-30 14:00:00'),(355,'p_122',250.00,'deposit','Wallet top-up','BANK-07193722','Bank Transfer','completed','2026-04-25 17:00:00'),(356,'p_123',800.00,'deposit','Wallet top-up','BANK-54805607','Bank Transfer','completed','2026-04-26 20:00:00'),(357,'p_124',350.00,'deposit','Wallet top-up','BANK-52446878','Bank Transfer','completed','2026-04-27 09:00:00'),(358,'p_125',600.00,'deposit','Wallet top-up','BANK-97817571','Bank Transfer','completed','2026-04-28 12:00:00'),(359,'p_126',450.00,'deposit','Wallet top-up','BANK-31747229','Bank Transfer','completed','2026-04-29 15:00:00'),(360,'p_127',700.00,'deposit','Wallet top-up','BANK-65283431','Bank Transfer','completed','2026-04-30 18:00:00'),(361,'p_128',500.00,'deposit','Wallet top-up','BANK-31175473','Bank Transfer','completed','2026-04-25 21:00:00'),(362,'p_129',300.00,'deposit','Wallet top-up','BANK-60027075','Bank Transfer','completed','2026-04-26 08:30:00'),(363,'p_130',900.00,'deposit','Wallet top-up','BANK-06608964','Bank Transfer','completed','2026-04-27 10:30:00'),(364,'d_201',1500.00,'deposit','Developer earnings','BANK-52963595','Bank Transfer','completed','2026-04-25 10:00:00'),(365,'d_202',1200.00,'deposit','Developer earnings','BANK-44991091','Bank Transfer','completed','2026-04-26 10:00:00'),(366,'d_203',1800.00,'deposit','Developer earnings','BANK-66064670','Bank Transfer','completed','2026-04-27 10:00:00'),(367,'d_204',1400.00,'deposit','Developer earnings','BANK-95350083','Bank Transfer','completed','2026-04-28 10:00:00'),(368,'d_205',1600.00,'deposit','Developer earnings','BANK-78556411','Bank Transfer','completed','2026-04-29 10:00:00'),(369,'d_206',900.00,'deposit','Developer earnings','BANK-06731812','Bank Transfer','completed','2026-04-25 14:00:00'),(370,'d_207',1100.00,'deposit','Developer earnings','BANK-97989825','Bank Transfer','completed','2026-04-26 14:00:00'),(371,'d_208',700.00,'deposit','Developer earnings','BANK-69753698','Bank Transfer','completed','2026-04-27 14:00:00'),(372,'d_209',1300.00,'deposit','Developer earnings','BANK-54799019','Bank Transfer','completed','2026-04-28 14:00:00'),(373,'d_210',1000.00,'deposit','Developer earnings','BANK-64734005','Bank Transfer','completed','2026-04-29 14:00:00'),(374,'d_211',500.00,'deposit','Developer earnings','BANK-59272973','Bank Transfer','completed','2026-04-30 10:00:00'),(375,'d_212',400.00,'deposit','Developer earnings','BANK-02162855','Bank Transfer','completed','2026-04-30 12:00:00'),(376,'d_213',600.00,'deposit','Developer earnings','BANK-32995356','Bank Transfer','completed','2026-04-30 14:00:00'),(377,'d_214',350.00,'deposit','Developer earnings','BANK-58488219','Bank Transfer','completed','2026-04-30 16:00:00'),(378,'d_215',450.00,'deposit','Developer earnings','BANK-93455034','Bank Transfer','completed','2026-04-30 18:00:00'),(379,'p_101',10.00,'deposit','Wallet top-up','BANK-4194411120','Bank Transfer','completed','2026-05-02 14:53:39'),(380,'d_210',14.24,'credit','Game Sale Revenue','GAME_43','System','completed','2026-05-02 20:09:31'),(381,'a_301',0.75,'credit','Admin Commission','COMM_43','System','completed','2026-05-02 20:09:31'),(382,'d_201',66.50,'credit','Sale: Call of Duty','GAME_1','System','completed','2026-05-02 20:39:41'),(383,'a_302',3.50,'credit','Commission: Call of Duty (₹70.00)','COMM_1','System','completed','2026-05-02 20:39:41'),(384,'d_202',57.00,'credit','Sale: Grand Theft Auto V','GAME_2','System','completed','2026-05-02 20:39:41'),(385,'a_303',3.00,'credit','Commission: Grand Theft Auto V (₹60.00)','COMM_2','System','completed','2026-05-02 20:39:41'),(386,'d_203',47.50,'credit','Sale: The Witcher 3','GAME_3','System','completed','2026-05-02 20:39:41'),(387,'a_304',2.50,'credit','Commission: The Witcher 3 (₹50.00)','COMM_3','System','completed','2026-05-02 20:39:41'),(388,'d_204',28.50,'credit','Sale: Minecraft','GAME_4','System','completed','2026-05-02 20:39:41'),(389,'a_305',1.50,'credit','Commission: Minecraft (₹30.00)','COMM_4','System','completed','2026-05-02 20:39:41'),(390,'d_205',0.00,'credit','Sale: Fortnite','GAME_5','System','completed','2026-05-02 20:39:41'),(391,'a_301',0.00,'credit','Commission: Fortnite (₹0.00)','COMM_5','System','completed','2026-05-02 20:39:41'),(392,'d_206',38.00,'credit','Sale: PUBG','GAME_6','System','completed','2026-05-02 20:39:41'),(393,'a_302',2.00,'credit','Commission: PUBG (₹40.00)','COMM_6','System','completed','2026-05-02 20:39:41'),(394,'d_207',0.00,'credit','Sale: Apex Legends','GAME_7','System','completed','2026-05-02 20:39:41'),(395,'a_303',0.00,'credit','Commission: Apex Legends (₹0.00)','COMM_7','System','completed','2026-05-02 20:39:41'),(396,'d_208',57.00,'credit','Sale: Elden Ring','GAME_8','System','completed','2026-05-02 20:39:41'),(397,'a_304',3.00,'credit','Commission: Elden Ring (₹60.00)','COMM_8','System','completed','2026-05-02 20:39:41'),(398,'d_209',47.50,'credit','Sale: God of War','GAME_9','System','completed','2026-05-02 20:39:41'),(399,'a_305',2.50,'credit','Commission: God of War (₹50.00)','COMM_9','System','completed','2026-05-02 20:39:41'),(400,'d_201',57.00,'credit','Sale: Cyberpunk 2077','GAME_11','System','completed','2026-05-02 20:39:41'),(401,'a_301',3.00,'credit','Commission: Cyberpunk 2077 (₹60.00)','COMM_11','System','completed','2026-05-02 20:39:41'),(402,'d_202',66.50,'credit','Sale: Red Dead Redemption 2','GAME_12','System','completed','2026-05-02 20:39:41'),(403,'a_302',3.50,'credit','Commission: Red Dead Redemption 2 (₹70.00)','COMM_12','System','completed','2026-05-02 20:39:41'),(404,'d_203',47.50,'credit','Sale: FIFA 23','GAME_13','System','completed','2026-05-02 20:39:41'),(405,'a_303',2.50,'credit','Commission: FIFA 23 (₹50.00)','COMM_13','System','completed','2026-05-02 20:39:41'),(406,'d_205',0.00,'credit','Sale: Valorant','GAME_15','System','completed','2026-05-02 20:39:41'),(407,'a_304',0.00,'credit','Commission: Valorant (₹0.00)','COMM_15','System','completed','2026-05-02 20:39:41'),(408,'d_206',0.00,'credit','Sale: League of Legends','GAME_16','System','completed','2026-05-02 20:39:41'),(409,'a_305',0.00,'credit','Commission: League of Legends (₹0.00)','COMM_16','System','completed','2026-05-02 20:39:41'),(410,'d_207',0.00,'credit','Sale: Dota 2','GAME_17','System','completed','2026-05-02 20:39:41'),(411,'a_301',0.00,'credit','Commission: Dota 2 (₹0.00)','COMM_17','System','completed','2026-05-02 20:39:41'),(412,'d_208',38.00,'credit','Sale: Overwatch','GAME_18','System','completed','2026-05-02 20:39:41'),(413,'a_302',2.00,'credit','Commission: Overwatch (₹40.00)','COMM_18','System','completed','2026-05-02 20:39:41'),(414,'d_209',47.50,'credit','Sale: Horizon Zero Dawn','GAME_19','System','completed','2026-05-02 20:39:41'),(415,'a_303',2.50,'credit','Commission: Horizon Zero Dawn (₹50.00)','COMM_19','System','completed','2026-05-02 20:39:41'),(416,'d_210',57.00,'credit','Sale: Spider-Man','GAME_20','System','completed','2026-05-02 20:39:41'),(417,'a_304',3.00,'credit','Commission: Spider-Man (₹60.00)','COMM_20','System','completed','2026-05-02 20:39:41'),(418,'d_201',57.00,'credit','Sale: Resident Evil Village','GAME_21','System','completed','2026-05-02 20:39:41'),(419,'a_305',3.00,'credit','Commission: Resident Evil Village (₹60.00)','COMM_21','System','completed','2026-05-02 20:39:41'),(420,'d_202',57.00,'credit','Sale: Far Cry 6','GAME_22','System','completed','2026-05-02 20:39:41'),(421,'a_301',3.00,'credit','Commission: Far Cry 6 (₹60.00)','COMM_22','System','completed','2026-05-02 20:39:41'),(422,'d_203',47.50,'credit','Sale: Dark Souls III','GAME_23','System','completed','2026-05-02 20:39:41'),(423,'a_302',2.50,'credit','Commission: Dark Souls III (₹50.00)','COMM_23','System','completed','2026-05-02 20:39:41'),(424,'d_204',57.00,'credit','Sale: Sekiro: Shadows Die Twice','GAME_24','System','completed','2026-05-02 20:39:41'),(425,'a_303',3.00,'credit','Commission: Sekiro: Shadows Die Twice (₹60.00)','COMM_24','System','completed','2026-05-02 20:39:41'),(426,'d_205',57.00,'credit','Sale: Halo Infinite','GAME_25','System','completed','2026-05-02 20:39:41'),(427,'a_304',3.00,'credit','Commission: Halo Infinite (₹60.00)','COMM_25','System','completed','2026-05-02 20:39:41'),(428,'d_201',47.50,'credit','Sale: Game A','GAME_26','System','completed','2026-05-02 20:39:41'),(429,'a_305',2.50,'credit','Commission: Game A (₹50.00)','COMM_26','System','completed','2026-05-02 20:39:41'),(430,'d_202',57.00,'credit','Sale: Game B','GAME_27','System','completed','2026-05-02 20:39:41'),(431,'a_301',3.00,'credit','Commission: Game B (₹60.00)','COMM_27','System','completed','2026-05-02 20:39:41'),(432,'d_203',66.50,'credit','Sale: Game C','GAME_28','System','completed','2026-05-02 20:39:41'),(433,'a_302',3.50,'credit','Commission: Game C (₹70.00)','COMM_28','System','completed','2026-05-02 20:39:41'),(434,'d_201',190.00,'credit','Sale: xyz','GAME_29','System','completed','2026-05-02 20:39:41'),(435,'a_303',10.00,'credit','Commission: xyz (₹200.00)','COMM_29','System','completed','2026-05-02 20:39:41'),(436,'d_211',23.75,'credit','Sale: Neon Drift','GAME_30','System','completed','2026-05-02 20:39:41'),(437,'a_304',1.25,'credit','Commission: Neon Drift (₹25.00)','COMM_30','System','completed','2026-05-02 20:39:41'),(438,'d_212',14.25,'credit','Sale: Space Miner','GAME_31','System','completed','2026-05-02 20:39:41'),(439,'a_305',0.75,'credit','Commission: Space Miner (₹15.00)','COMM_31','System','completed','2026-05-02 20:39:41'),(440,'d_213',28.50,'credit','Sale: Zombie Survival','GAME_32','System','completed','2026-05-02 20:39:41'),(441,'a_301',1.50,'credit','Commission: Zombie Survival (₹30.00)','COMM_32','System','completed','2026-05-02 20:39:41'),(442,'d_214',38.00,'credit','Sale: Mystic Quest','GAME_33','System','completed','2026-05-02 20:39:41'),(443,'a_302',2.00,'credit','Commission: Mystic Quest (₹40.00)','COMM_33','System','completed','2026-05-02 20:39:41'),(444,'d_215',0.00,'credit','Sale: Battle Arena','GAME_34','System','completed','2026-05-02 20:39:41'),(445,'a_303',0.00,'credit','Commission: Battle Arena (₹0.00)','COMM_34','System','completed','2026-05-02 20:39:41'),(446,'p_102',0.00,'purchase','Purchased: Fortnite','GAME-2057588997','Gameverse Wallet','completed','2026-05-02 21:46:45'),(447,'d_210',4.74,'credit','Sale: Among Us','GAME_39','System','completed','2026-05-02 21:48:38'),(448,'a_304',0.25,'credit','Commission: Among Us (₹4.99)','COMM_39','System','completed','2026-05-02 21:48:38'),(449,'d_201',1900.00,'credit','Sale: avc','GAME_45','System','completed','2026-05-03 11:25:54'),(450,'a_303',100.00,'credit','Commission: avc (₹2000.00)','COMM_45','System','completed','2026-05-03 11:25:54'),(451,'d_210',23.74,'credit','Sale: Hades','GAME_37','System','completed','2026-05-03 19:25:11'),(452,'a_301',1.25,'credit','Commission: Hades (₹24.99)','COMM_37','System','completed','2026-05-03 19:25:11'),(453,'p_101',300.00,'deposit','Wallet top-up','BANK-3148016479','Bank Transfer','completed','2026-05-04 22:25:14'),(454,'p_104',0.00,'purchase','Purchased: Apex Legends','GAME-4882901269','Gameverse Wallet','completed','2026-05-04 22:28:08'),(455,'p_104',70.00,'purchase','Purchased: Call of Duty','GAME-5015227857','Gameverse Wallet','completed','2026-05-04 22:28:21'),(456,'d_201',14250.00,'credit','Sale: ccc','GAME_47','System','completed','2026-05-04 22:28:51'),(457,'a_301',750.00,'credit','Commission: ccc (₹15000.00)','COMM_47','System','completed','2026-05-04 22:28:51'),(458,'d_201',5700.00,'credit','Sale: vvv','GAME_46','System','completed','2026-05-04 22:28:59'),(459,'a_301',300.00,'credit','Commission: vvv (₹6000.00)','COMM_46','System','completed','2026-05-04 22:28:59'),(460,'p_333',300000.00,'deposit','Wallet top-up','BANK-6220675020','Bank Transfer','completed','2026-05-04 22:30:22'),(461,'p_333',15000.00,'purchase','Purchased: ccc','GAME-6345122035','Gameverse Wallet','completed','2026-05-04 22:30:34'),(462,'p_101',200.00,'deposit','Wallet top-up','BANK-4577549848','Bank Transfer','completed','2026-05-05 17:54:17'),(463,'p_109',200.00,'purchase','Purchased: xyz','GAME-8510505741','Gameverse Wallet','completed','2026-05-05 22:10:51'),(464,'p_109',50.00,'purchase','Purchased: Game A','GAME-4277378981','Gameverse Wallet','completed','2026-05-05 22:20:27'),(465,'d_204',4370.00,'credit','Sale: ddd','GAME_49','System','completed','2026-05-05 22:34:00'),(466,'a_303',230.00,'credit','Commission: ddd (₹4600.00)','COMM_49','System','completed','2026-05-05 22:34:00'),(467,'p_101',60.00,'purchase','Purchased: Cyberpunk 2077','GAME-7108133049','Gameverse Wallet','completed','2026-05-06 11:45:10'),(468,'p_101',200.00,'purchase','Purchased: xyz','GAME-8321859393','Gameverse Wallet','completed','2026-05-06 15:23:52'),(469,'p_101',200.00,'deposit','Wallet top-up','BANK-8431814638','Bank Transfer','completed','2026-05-06 15:24:03');
/*!40000 ALTER TABLE `transaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` varchar(10) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `date_joined` datetime DEFAULT CURRENT_TIMESTAMP,
  `account_status` enum('active','inactive','banned') DEFAULT 'active',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('a_301','admin1','a1@mail.com','pass','2026-05-01 17:19:50','active'),('a_302','admin2','a2@mail.com','pass','2026-05-01 17:19:50','active'),('a_303','admin3','a3@mail.com','pass','2026-05-01 17:19:50','active'),('a_304','admin4','a4@mail.com','pass','2026-05-01 17:19:50','active'),('a_305','admin5','a5@mail.com','pass','2026-05-01 17:19:50','active'),('d_201','dev1','d1@mail.com','pass','2026-05-01 17:19:50','active'),('d_202','dev2','d2@mail.com','pass','2026-05-01 17:19:50','active'),('d_203','dev3','d3@mail.com','pass','2026-05-01 17:19:50','active'),('d_204','dev4','d4@mail.com','pass','2026-05-01 17:19:50','active'),('d_205','dev5','d5@mail.com','pass','2026-05-01 17:19:50','active'),('d_206','dev6','d6@mail.com','pass','2026-05-01 17:19:50','active'),('d_207','dev7','d7@mail.com','pass','2026-05-01 17:19:50','active'),('d_208','dev8','d8@mail.com','pass','2026-05-01 17:19:50','active'),('d_209','dev9','d9@mail.com','pass','2026-05-01 17:19:50','active'),('d_210','dev10','d10@mail.com','pass','2026-05-01 17:19:50','active'),('d_211','dev11','dev11@gameverse.com','pass','2026-05-02 14:42:35','active'),('d_212','dev12','dev12@gameverse.com','pass','2026-05-02 14:42:35','active'),('d_213','dev13','dev13@gameverse.com','pass','2026-05-02 14:42:35','active'),('d_214','dev14','dev14@gameverse.com','pass','2026-05-02 14:42:35','active'),('d_215','dev15','dev15@gameverse.com','pass','2026-05-02 14:42:35','active'),('p_101','player1','p1@mail.com','pass','2026-05-01 17:19:50','active'),('p_102','player2','p2@mail.com','pass','2026-05-01 17:19:50','active'),('p_103','player3','p3@mail.com','pass','2026-05-01 17:19:50','active'),('p_104','player4','p4@mail.com','pass','2026-05-01 17:19:50','active'),('p_105','player5','p5@mail.com','pass','2026-05-01 17:19:50','active'),('p_106','player6','p6@mail.com','pass','2026-05-01 17:19:50','active'),('p_107','player7','p7@mail.com','pass','2026-05-01 17:19:50','active'),('p_108','player8','p8@mail.com','pass','2026-05-01 17:19:50','active'),('p_109','player9','p9@mail.com','pass','2026-05-01 17:19:50','active'),('p_110','player10','p10@mail.com','pass','2026-05-01 17:19:50','active'),('p_111','pro_gamer','p111@gameverse.com','pass','2026-05-02 14:36:36','active'),('p_112','noob_master','p112@gameverse.com','pass','2026-05-02 14:36:36','active'),('p_113','ninja_23','p113@gameverse.com','pass','2026-05-02 14:36:36','active'),('p_114','headshot_king','p114@gameverse.com','pass','2026-05-02 14:36:36','active'),('p_115','casual_play','p115@gameverse.com','pass','2026-05-02 14:36:36','active'),('p_116','ghost_rider','p116@gameverse.com','pass','2026-05-02 14:42:35','active'),('p_117','shadow_hunter','p117@gameverse.com','pass','2026-05-02 14:42:35','active'),('p_118','dragon_slayer','p118@gameverse.com','pass','2026-05-02 14:42:35','active'),('p_119','cyber_punk','p119@gameverse.com','pass','2026-05-02 14:42:35','active'),('p_120','night_hawk','p120@gameverse.com','pass','2026-05-02 14:42:35','active'),('p_121','iron_fist','p121@gameverse.com','pass','2026-05-02 14:42:35','active'),('p_122','silent_assassin','p122@gameverse.com','pass','2026-05-02 14:42:35','active'),('p_123','crazy_frog','p123@gameverse.com','pass','2026-05-02 14:42:35','active'),('p_124','speed_demon','p124@gameverse.com','pass','2026-05-02 14:42:35','active'),('p_125','magic_mage','p125@gameverse.com','pass','2026-05-02 14:42:35','active'),('p_126','sniper_wolf','p126@gameverse.com','pass','2026-05-02 14:42:35','active'),('p_127','tank_buster','p127@gameverse.com','pass','2026-05-02 14:42:35','active'),('p_128','healer_main','p128@gameverse.com','pass','2026-05-02 14:42:35','active'),('p_129','stealth_pro','p129@gameverse.com','pass','2026-05-02 14:42:35','active'),('p_130','loot_goblin','p130@gameverse.com','pass','2026-05-02 14:42:35','active'),('p_333','player33','player33@mail.com','pass','2026-05-04 22:29:55','active'),('p_3333','player333','player333@mail.com','pass','2026-05-04 22:31:47','active');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `vw_active_players`
--

DROP TABLE IF EXISTS `vw_active_players`;
/*!50001 DROP VIEW IF EXISTS `vw_active_players`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_active_players` AS SELECT 
 1 AS `user_id`,
 1 AS `username`,
 1 AS `email`,
 1 AS `last_played`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_developer_revenue`
--

DROP TABLE IF EXISTS `vw_developer_revenue`;
/*!50001 DROP VIEW IF EXISTS `vw_developer_revenue`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_developer_revenue` AS SELECT 
 1 AS `developer_id`,
 1 AS `developer_name`,
 1 AS `studio_name`,
 1 AS `total_games`,
 1 AS `total_sales`,
 1 AS `total_revenue`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_game_catalog`
--

DROP TABLE IF EXISTS `vw_game_catalog`;
/*!50001 DROP VIEW IF EXISTS `vw_game_catalog`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_game_catalog` AS SELECT 
 1 AS `game_id`,
 1 AS `title`,
 1 AS `genre`,
 1 AS `price`,
 1 AS `release_date`,
 1 AS `developer_studio`,
 1 AS `developer_name`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_leaderboard`
--

DROP TABLE IF EXISTS `vw_leaderboard`;
/*!50001 DROP VIEW IF EXISTS `vw_leaderboard`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_leaderboard` AS SELECT 
 1 AS `username`,
 1 AS `game_title`,
 1 AS `best_score`,
 1 AS `xp`,
 1 AS `rank_level`,
 1 AS `total_play_time`,
 1 AS `user_id`,
 1 AS `game_id`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_transaction_history`
--

DROP TABLE IF EXISTS `vw_transaction_history`;
/*!50001 DROP VIEW IF EXISTS `vw_transaction_history`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_transaction_history` AS SELECT 
 1 AS `transaction_id`,
 1 AS `username`,
 1 AS `amount`,
 1 AS `transaction_type`,
 1 AS `description`,
 1 AS `transaction_status`,
 1 AS `payment_method`,
 1 AS `created_at`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `wallet`
--

DROP TABLE IF EXISTS `wallet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wallet` (
  `user_id` varchar(10) NOT NULL,
  `balance` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`user_id`),
  CONSTRAINT `wallet_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wallet`
--

LOCK TABLES `wallet` WRITE;
/*!40000 ALTER TABLE `wallet` DISABLE KEYS */;
INSERT INTO `wallet` VALUES ('a_301',1062.50),('a_302',19.00),('a_303',351.00),('a_304',13.00),('a_305',10.25),('d_201',23768.00),('d_202',1437.50),('d_203',2009.00),('d_204',5855.50),('d_205',1657.00),('d_206',1738.00),('d_207',1100.00),('d_208',1395.00),('d_209',1995.00),('d_210',2099.72),('d_211',1023.75),('d_212',1014.25),('d_213',1028.50),('d_214',1038.00),('d_215',1000.00),('p_101',4050.00),('p_102',550.00),('p_103',390.00),('p_104',630.00),('p_105',300.00),('p_106',800.00),('p_107',550.00),('p_108',650.00),('p_109',2150.00),('p_110',750.00),('p_111',5000.00),('p_112',1000.00),('p_113',3000.00),('p_114',4500.00),('p_115',2000.00),('p_116',5000.00),('p_117',5000.00),('p_118',5000.00),('p_119',6000.00),('p_120',5000.00),('p_121',5000.00),('p_122',5000.00),('p_123',5000.00),('p_124',5000.00),('p_125',5000.00),('p_126',5000.00),('p_127',5000.00),('p_128',5000.00),('p_129',5000.00),('p_130',5000.00),('p_333',285000.00),('p_3333',0.00);
/*!40000 ALTER TABLE `wallet` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Final view structure for view `vw_active_players`
--

/*!50001 DROP VIEW IF EXISTS `vw_active_players`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_active_players` AS select `u`.`user_id` AS `user_id`,`u`.`username` AS `username`,`u`.`email` AS `email`,max(`m`.`ended_at`) AS `last_played` from ((`users` `u` join `participation` `p` on((`u`.`user_id` = `p`.`user_id`))) join `match_session` `m` on((`p`.`match_id` = `m`.`match_id`))) where (`m`.`ended_at` >= (now() - interval 30 day)) group by `u`.`user_id`,`u`.`username`,`u`.`email` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_developer_revenue`
--

/*!50001 DROP VIEW IF EXISTS `vw_developer_revenue`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_developer_revenue` AS select `d`.`user_id` AS `developer_id`,`u`.`username` AS `developer_name`,`d`.`studio_name` AS `studio_name`,count(distinct `g`.`game_id`) AS `total_games`,count(distinct `p`.`purchase_id`) AS `total_sales`,ifnull(sum(`p`.`price`),0) AS `total_revenue` from (((`developer` `d` join `users` `u` on((`d`.`user_id` = `u`.`user_id`))) left join `game` `g` on(((`g`.`developer_id` = `d`.`user_id`) and (`g`.`approval_status` = 'approved')))) left join `purchase` `p` on((`p`.`game_id` = `g`.`game_id`))) group by `d`.`user_id`,`u`.`username`,`d`.`studio_name` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_game_catalog`
--

/*!50001 DROP VIEW IF EXISTS `vw_game_catalog`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_game_catalog` AS select `g`.`game_id` AS `game_id`,`g`.`title` AS `title`,`g`.`genre` AS `genre`,`g`.`price` AS `price`,`g`.`release_date` AS `release_date`,`d`.`studio_name` AS `developer_studio`,`u`.`username` AS `developer_name` from ((`game` `g` join `developer` `d` on((`g`.`developer_id` = `d`.`user_id`))) join `users` `u` on((`d`.`user_id` = `u`.`user_id`))) where (`g`.`approval_status` = 'approved') */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_leaderboard`
--

/*!50001 DROP VIEW IF EXISTS `vw_leaderboard`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_leaderboard` AS select `u`.`username` AS `username`,`g`.`title` AS `game_title`,`s`.`best_score` AS `best_score`,`s`.`experience` AS `xp`,`s`.`rank_level` AS `rank_level`,`s`.`total_play_time` AS `total_play_time`,`s`.`user_id` AS `user_id`,`s`.`game_id` AS `game_id` from ((`player_game_stats` `s` join `users` `u` on((`s`.`user_id` = `u`.`user_id`))) join `game` `g` on((`s`.`game_id` = `g`.`game_id`))) order by `s`.`game_id`,`s`.`rank_level` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_transaction_history`
--

/*!50001 DROP VIEW IF EXISTS `vw_transaction_history`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_transaction_history` AS select `t`.`transaction_id` AS `transaction_id`,`u`.`username` AS `username`,`t`.`amount` AS `amount`,`t`.`transaction_type` AS `transaction_type`,`t`.`description` AS `description`,`t`.`transaction_status` AS `transaction_status`,`t`.`payment_method` AS `payment_method`,`t`.`created_at` AS `created_at` from (`transaction` `t` join `users` `u` on((`t`.`user_id` = `u`.`user_id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-06 17:52:06
