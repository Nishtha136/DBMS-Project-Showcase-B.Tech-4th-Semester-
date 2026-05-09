-- ============================================================
-- MUSIC STREAMING DATABASE - ALL QUERIES
-- Project: Music Streaming Platform
-- This file contains all SQL queries used in the project,
-- organized by category. Each query is explained with a comment
-- describing what it does and why it is used.
-- ============================================================

USE music_streaming;

-- ============================================================
-- SECTION 1: BASIC SELECT QUERIES (DQL)
-- DQL = Data Query Language. Used to retrieve data from tables.
-- ============================================================

-- Retrieves all users from the User table.
-- Used to verify that data was inserted correctly.
SELECT * FROM User;

-- Filters subscriptions using WHERE clause.
-- Only returns rows where Status column equals 'Active'.
SELECT * FROM Subscription WHERE Status = 'Active';

-- Filters artists by country using WHERE.
-- Shows how to filter on a specific column value.
SELECT * FROM Artist WHERE Country = 'India';

-- Uses scalar functions on each row without grouping.
-- ROUND converts duration from seconds to minutes.
-- UPPER converts title to uppercase.
-- LENGTH returns the number of characters in the title.
SELECT SongID, Title, Duration,
    ROUND(Duration/60, 2) AS Duration_Min,
    UPPER(Title) AS Title_Upper,
    LENGTH(Title) AS Title_Len
FROM Song;

-- Joins Song and Album tables, then filters by release year.
-- Shows how to apply WHERE on a column from a joined table.
SELECT s.Title, a.AlbumName, a.ReleaseYear
FROM Song s
JOIN Album a ON s.AlbumID = a.AlbumID
WHERE a.ReleaseYear > 2015;

-- ============================================================
-- SECTION 2: JOINS
-- JOINs combine rows from two or more tables based on a
-- related column. Different types return different row sets.
-- ============================================================

-- INNER JOIN: Returns only rows that have matching values in both tables.
-- Here, only songs that have both an album AND an artist are returned.
-- Standalone singles (AlbumID = NULL) are excluded.
SELECT s.Title, a.AlbumName, ar.ArtistName, a.ReleaseYear
FROM Song s
INNER JOIN Album a ON s.AlbumID = a.AlbumID
INNER JOIN Artist ar ON a.ArtistID = ar.ArtistID
ORDER BY ar.ArtistName;

-- LEFT JOIN: Returns all rows from the left table (Song),
-- even if there is no matching row in the right table (Album).
-- Songs without an album show 'No Album' using IFNULL.
-- This is important because our database has standalone singles.
SELECT s.Title,
    IFNULL(a.AlbumName, 'No Album') AS Album,
    IFNULL(ar.ArtistName, 'Unknown') AS Artist
FROM Song s
LEFT JOIN Album a ON s.AlbumID = a.AlbumID
LEFT JOIN Artist ar ON a.ArtistID = ar.ArtistID;

-- RIGHT JOIN: Returns all rows from the right table (Artist),
-- even if there is no matching row in the left table (Song).
-- Every artist appears even if they have no songs yet.
SELECT ar.ArtistName, a.AlbumName, s.Title
FROM Song s
RIGHT JOIN Album a ON s.AlbumID = a.AlbumID
RIGHT JOIN Artist ar ON a.ArtistID = ar.ArtistID;

-- 4-Table JOIN: Connects User, Playlist, Playlist_Song (bridge), and Song.
-- Playlist_Song is a bridge table that resolves the M:N relationship
-- between Playlist and Song. This query shows which user has which
-- songs in which playlist.
SELECT u.Name, p.PlaylistName, s.Title, ps.AddedOn
FROM User u
JOIN Playlist p ON u.UserID = p.UserID
JOIN Playlist_Song ps ON p.PlaylistID = ps.PlaylistID
JOIN Song s ON ps.SongID = s.SongID
ORDER BY u.Name;

-- 5-Table JOIN: The most complex join in this project.
-- Connects ListeningHistory to User, Song, Album, and Artist.
-- LEFT JOIN is used for Album and Artist because some songs
-- are standalone singles with no album.
SELECT u.Name, s.Title, ar.ArtistName, lh.PlayedAt
FROM ListeningHistory lh
JOIN User u ON lh.UserID = u.UserID
JOIN Song s ON lh.SongID = s.SongID
LEFT JOIN Album a ON s.AlbumID = a.AlbumID
LEFT JOIN Artist ar ON a.ArtistID = ar.ArtistID
ORDER BY lh.PlayedAt DESC;

-- JOIN with GROUP_CONCAT: Collapses multiple genre rows into one.
-- Without GROUP_CONCAT, a song with 3 genres would appear as 3 rows.
-- GROUP_CONCAT combines them into one comma-separated string per song.
SELECT s.Title,
    GROUP_CONCAT(g.GenreName SEPARATOR ', ') AS Genres
FROM Song s
JOIN Song_Genre sg ON s.SongID = sg.SongID
JOIN Genre g ON sg.GenreID = g.GenreID
GROUP BY s.SongID, s.Title;

-- 3-Table JOIN for billing: User → Subscription → Payment.
-- Useful for generating billing reports and payment audits.
SELECT u.Name, sub.PlanType, p.Amount, p.PaymentMethod, p.PaymentDate
FROM User u
JOIN Subscription sub ON u.UserID = sub.UserID
JOIN Payment p ON sub.SubscriptionID = p.SubscriptionID
ORDER BY p.PaymentDate DESC;

-- ============================================================
-- SECTION 3: GROUP BY AND HAVING
-- GROUP BY groups rows with the same value in a column.
-- Aggregate functions (COUNT, SUM, AVG) are applied per group.
-- HAVING filters groups after aggregation (unlike WHERE which
-- filters rows before grouping).
-- ============================================================

-- Groups songs by genre and counts how many songs each genre has.
-- ORDER BY TotalSongs DESC shows the most popular genre first.
SELECT g.GenreName, COUNT(sg.SongID) AS TotalSongs
FROM Genre g
JOIN Song_Genre sg ON g.GenreID = sg.GenreID
GROUP BY g.GenreID, g.GenreName
ORDER BY TotalSongs DESC;

-- HAVING example: Only shows artists with more than 1 album.
-- HAVING is used here because we are filtering on an aggregated value
-- (AlbumCount), which cannot be done with WHERE.
SELECT ar.ArtistName, COUNT(a.AlbumID) AS AlbumCount
FROM Artist ar
JOIN Album a ON ar.ArtistID = a.ArtistID
GROUP BY ar.ArtistID, ar.ArtistName
HAVING AlbumCount > 1;

-- Combines WHERE, GROUP BY, multiple aggregates, and HAVING.
-- WHERE filters only successful payments before grouping.
-- HAVING filters out payment methods with revenue below 100.
SELECT PaymentMethod, COUNT(*) AS Transactions,
    SUM(Amount) AS TotalRevenue, AVG(Amount) AS AvgAmount
FROM Payment
WHERE Status = 'Success'
GROUP BY PaymentMethod
HAVING TotalRevenue > 100
ORDER BY TotalRevenue DESC;

-- Full pipeline: JOIN + GROUP BY + HAVING + ORDER BY + LIMIT.
-- Finds the top 5 most played songs with at least 2 plays.
SELECT s.Title, ar.ArtistName, COUNT(lh.HistoryID) AS PlayCount
FROM ListeningHistory lh
JOIN Song s ON lh.SongID = s.SongID
LEFT JOIN Album a ON s.AlbumID = a.AlbumID
LEFT JOIN Artist ar ON a.ArtistID = ar.ArtistID
GROUP BY s.SongID, s.Title, ar.ArtistName
HAVING PlayCount >= 2
ORDER BY PlayCount DESC
LIMIT 5;

-- COUNT(DISTINCT) counts unique songs per user, not total plays.
-- A user who played the same song 10 times counts as 1 unique song.
SELECT u.Name, COUNT(DISTINCT lh.SongID) AS UniqueSongs
FROM User u
JOIN ListeningHistory lh ON u.UserID = lh.UserID
GROUP BY u.UserID, u.Name
HAVING UniqueSongs > 2
ORDER BY UniqueSongs DESC;

-- DATEDIFF calculates the number of days between two dates.
-- IFNULL handles Free plan users who have no EndDate by using today.
SELECT PlanType, COUNT(*) AS Total,
    AVG(DATEDIFF(IFNULL(EndDate, CURDATE()), StartDate)) AS AvgDays
FROM Subscription
GROUP BY PlanType;

-- ============================================================
-- SECTION 4: SUBQUERIES
-- A subquery is a SELECT statement inside another SELECT.
-- The inner query runs first and its result is used by the outer query.
-- ============================================================

-- IN subquery: The inner query returns a list of UserIDs with active
-- Premium plans. The outer query fetches name and email of those users.
SELECT Name, Email FROM User
WHERE UserID IN (
    SELECT UserID FROM Subscription
    WHERE PlanType = 'Premium' AND Status = 'Active'
);

-- NOT IN subquery: Finds songs that have never been added to any playlist.
-- The inner query returns all SongIDs that exist in Playlist_Song.
-- NOT IN excludes those, leaving only songs not in any playlist.
SELECT SongID, Title FROM Song
WHERE SongID NOT IN (
    SELECT DISTINCT SongID FROM Playlist_Song
);

-- Scalar subquery: The inner SELECT returns a single value (average duration).
-- The outer WHERE uses that value to find songs longer than average.
-- Called "scalar" because it returns exactly one value.
SELECT Title, Duration, ROUND(Duration/60, 2) AS Minutes
FROM Song
WHERE Duration > (SELECT AVG(Duration) FROM Song)
ORDER BY Duration DESC;

-- Subquery in FROM (derived table): The inner query builds a summary
-- of artist song counts. The outer query selects from that summary.
-- This is also called an inline view or derived table.
SELECT ArtistName, TotalSongs FROM (
    SELECT ar.ArtistName, COUNT(s.SongID) AS TotalSongs
    FROM Artist ar
    JOIN Album a ON ar.ArtistID = a.ArtistID
    JOIN Song s ON a.AlbumID = s.AlbumID
    GROUP BY ar.ArtistID, ar.ArtistName
) AS t
ORDER BY TotalSongs DESC LIMIT 1;

-- EXISTS correlated subquery: Finds users with at least one failed payment.
-- It is "correlated" because the inner query references the outer query's
-- UserID. It runs once per user and returns TRUE on the first match found.
-- EXISTS is more efficient than IN for this case because it stops early.
SELECT u.Name, u.Email FROM User u
WHERE EXISTS (
    SELECT 1 FROM Subscription sub
    JOIN Payment p ON sub.SubscriptionID = p.SubscriptionID
    WHERE sub.UserID = u.UserID AND p.Status = 'Failed'
);

-- Correlated subquery: Finds the maximum payment amount for each plan type.
-- The inner query references the outer query's PlanType and runs once per row.
-- This is the most advanced type of subquery.
SELECT sub.PlanType, p.Amount, p.PaymentDate
FROM Payment p
JOIN Subscription sub ON p.SubscriptionID = sub.SubscriptionID
WHERE p.Amount = (
    SELECT MAX(p2.Amount) FROM Payment p2
    JOIN Subscription s2 ON p2.SubscriptionID = s2.SubscriptionID
    WHERE s2.PlanType = sub.PlanType
);

-- ============================================================
-- SECTION 5: AGGREGATE AND SCALAR FUNCTIONS
-- Aggregate functions work on a group of rows and return one value.
-- Scalar functions work on each individual row and return one value per row.
-- ============================================================

-- All 5 aggregate functions in one query on the Payment table.
-- COUNT counts total rows, SUM adds all amounts, AVG calculates average,
-- MAX finds the highest, MIN finds the lowest.
SELECT COUNT(*) AS Total, SUM(Amount) AS Revenue,
    AVG(Amount) AS Avg, MAX(Amount) AS Max, MIN(Amount) AS Min
FROM Payment WHERE Status = 'Success';

-- Scalar string and date functions applied per row.
-- UPPER/LOWER change case, LENGTH counts characters,
-- SUBSTRING and LOCATE extract the username from email,
-- DATEDIFF calculates days since joining,
-- DATE_FORMAT formats the date in a readable way.
SELECT UPPER(Name), LOWER(Email), LENGTH(Name),
    SUBSTRING(Email, 1, LOCATE('@', Email)-1) AS Username,
    DATEDIFF(CURDATE(), JoiningDate) AS DaysSinceJoining,
    DATE_FORMAT(JoiningDate, '%d %M %Y') AS Formatted
FROM User;

-- CONCAT builds a display string by combining title and duration.
-- REPLACE creates a URL-friendly slug by replacing spaces with underscores.
SELECT Title,
    CONCAT(Title, ' (', ROUND(Duration/60, 1), ' min)') AS Display,
    REPLACE(Title, ' ', '_') AS Slug
FROM Song;

-- Date functions extract specific parts from a date column.
-- YEAR, MONTHNAME, and DAYNAME each return one component of the date.
SELECT PaymentID, PaymentDate,
    YEAR(PaymentDate) AS Year,
    MONTHNAME(PaymentDate) AS Month,
    DAYNAME(PaymentDate) AS Day
FROM Payment;

-- ============================================================
-- SECTION 6: VIEWS
-- A VIEW is a saved SELECT query stored in the database.
-- It acts like a virtual table. It does not store data itself,
-- it runs the underlying query every time it is accessed.
-- Views hide complexity and make queries reusable.
-- ============================================================

-- View 1: Shows all currently active Premium subscribers.
-- Hides the JOIN between User and Subscription.
-- Users can just query this view without knowing the table structure.
CREATE OR REPLACE VIEW vw_ActivePremiumUsers AS
SELECT u.UserID, u.Name, u.Email, sub.PlanType, sub.StartDate, sub.EndDate
FROM User u
JOIN Subscription sub ON u.UserID = sub.UserID
WHERE sub.PlanType = 'Premium' AND sub.Status = 'Active';

SELECT * FROM vw_ActivePremiumUsers;

-- View 2: Full song details joining 5 tables with GROUP_CONCAT.
-- Without this view, getting complete song info requires writing
-- a complex 5-table JOIN every time. The view simplifies it to one line.
CREATE OR REPLACE VIEW vw_SongDetails AS
SELECT s.SongID, s.Title, ROUND(s.Duration/60, 2) AS Duration_Min,
    IFNULL(a.AlbumName, 'Single') AS Album,
    IFNULL(ar.ArtistName, 'Unknown') AS Artist,
    GROUP_CONCAT(g.GenreName SEPARATOR ', ') AS Genres
FROM Song s
LEFT JOIN Album a ON s.AlbumID = a.AlbumID
LEFT JOIN Artist ar ON a.ArtistID = ar.ArtistID
LEFT JOIN Song_Genre sg ON s.SongID = sg.SongID
LEFT JOIN Genre g ON sg.GenreID = g.GenreID
GROUP BY s.SongID, s.Title, s.Duration, a.AlbumName, ar.ArtistName;

SELECT * FROM vw_SongDetails;

-- View 3: Revenue summary grouped by plan type.
-- Encapsulates revenue calculation logic so business teams
-- can query revenue without knowing the underlying table structure.
CREATE OR REPLACE VIEW vw_RevenueSummary AS
SELECT sub.PlanType, COUNT(p.PaymentID) AS Transactions,
    SUM(p.Amount) AS TotalRevenue, AVG(p.Amount) AS AvgRevenue
FROM Payment p
JOIN Subscription sub ON p.SubscriptionID = sub.SubscriptionID
WHERE p.Status = 'Success'
GROUP BY sub.PlanType;

SELECT * FROM vw_RevenueSummary;

-- View 4: Playlist and song count per user.
-- LEFT JOIN ensures users with no playlists still appear with 0 counts.
-- COUNT(DISTINCT) counts unique playlists, not total songs.
CREATE OR REPLACE VIEW vw_UserPlaylistSummary AS
SELECT u.Name, COUNT(DISTINCT p.PlaylistID) AS TotalPlaylists,
    COUNT(ps.SongID) AS TotalSongs
FROM User u
LEFT JOIN Playlist p ON u.UserID = p.UserID
LEFT JOIN Playlist_Song ps ON p.PlaylistID = ps.PlaylistID
GROUP BY u.UserID, u.Name;

SELECT * FROM vw_UserPlaylistSummary;

-- ============================================================
-- SECTION 7: STORED PROCEDURES
-- A stored procedure is a reusable block of SQL stored in the database.
-- It accepts input parameters (IN) and can return values via output
-- parameters (OUT). Instead of writing the same query multiple times,
-- you write it once as a procedure and call it with CALL.
-- ============================================================

DELIMITER $$

-- Procedure 1: Returns all songs by a given artist name.
-- IN parameter accepts partial name (LIKE with % wildcards).
-- Useful for searching songs by artist from the frontend.
CREATE PROCEDURE GetSongsByArtist(IN p_ArtistName VARCHAR(150))
BEGIN
    SELECT s.Title, ROUND(s.Duration/60, 2) AS Duration_Min,
        a.AlbumName, a.ReleaseYear
    FROM Song s
    JOIN Album a ON s.AlbumID = a.AlbumID
    JOIN Artist ar ON a.ArtistID = ar.ArtistID
    WHERE ar.ArtistName LIKE CONCAT('%', p_ArtistName, '%');
END$$

-- Procedure 2: Returns full listening history for a specific user.
-- Takes UserID as input and returns songs with artist and timestamp.
CREATE PROCEDURE GetUserHistory(IN p_UserID INT)
BEGIN
    SELECT u.Name, s.Title, ar.ArtistName, lh.PlayedAt
    FROM ListeningHistory lh
    JOIN User u ON lh.UserID = u.UserID
    JOIN Song s ON lh.SongID = s.SongID
    LEFT JOIN Album a ON s.AlbumID = a.AlbumID
    LEFT JOIN Artist ar ON a.ArtistID = ar.ArtistID
    WHERE lh.UserID = p_UserID
    ORDER BY lh.PlayedAt DESC;
END$$

-- Procedure 3: Adds a song to a playlist with duplicate check.
-- Uses IF EXISTS to check if the song is already in the playlist.
-- OUT parameter returns a message: 'added' or 'already exists'.
-- This demonstrates the use of conditional logic inside a procedure.
CREATE PROCEDURE AddSongToPlaylist(
    IN p_PlaylistID INT,
    IN p_SongID INT,
    OUT p_Message VARCHAR(100)
)
BEGIN
    IF EXISTS (SELECT 1 FROM Playlist_Song
               WHERE PlaylistID = p_PlaylistID AND SongID = p_SongID) THEN
        SET p_Message = 'Song already exists in playlist.';
    ELSE
        INSERT INTO Playlist_Song (PlaylistID, SongID) VALUES (p_PlaylistID, p_SongID);
        SET p_Message = 'Song added successfully.';
    END IF;
END$$

-- Procedure 4: Returns top N most played songs.
-- LIMIT p_Limit uses the input parameter to control how many rows return.
CREATE PROCEDURE GetTopSongs(IN p_Limit INT)
BEGIN
    SELECT s.Title, ar.ArtistName, COUNT(lh.HistoryID) AS PlayCount
    FROM ListeningHistory lh
    JOIN Song s ON lh.SongID = s.SongID
    LEFT JOIN Album a ON s.AlbumID = a.AlbumID
    LEFT JOIN Artist ar ON a.ArtistID = ar.ArtistID
    GROUP BY s.SongID, s.Title, ar.ArtistName
    ORDER BY PlayCount DESC
    LIMIT p_Limit;
END$$

-- Procedure 5: Returns month-wise revenue for a given year.
-- Groups payments by month and calculates total revenue per month.
-- Useful for generating annual revenue reports.
CREATE PROCEDURE GetMonthlyRevenue(IN p_Year INT)
BEGIN
    SELECT MONTHNAME(PaymentDate) AS Month,
        MONTH(PaymentDate) AS MonthNum,
        COUNT(*) AS Transactions,
        SUM(Amount) AS Revenue
    FROM Payment
    WHERE Status = 'Success' AND YEAR(PaymentDate) = p_Year
    GROUP BY MONTH(PaymentDate), MONTHNAME(PaymentDate)
    ORDER BY MonthNum;
END$$

DELIMITER ;

-- Calling the procedures with sample inputs
CALL GetSongsByArtist('Arijit');
CALL GetUserHistory(1);
CALL GetTopSongs(5);
CALL GetMonthlyRevenue(2024);

SET @msg = '';
CALL AddSongToPlaylist(1, 20, @msg);
SELECT @msg;

-- ============================================================
-- SECTION 8: TCL - TRANSACTION CONTROL LANGUAGE
-- Transactions ensure that a group of SQL operations either all
-- succeed together or all fail together. This is called Atomicity.
-- START TRANSACTION begins a transaction.
-- COMMIT saves all changes permanently.
-- ROLLBACK undoes all changes since the last START TRANSACTION.
-- SAVEPOINT creates a checkpoint within a transaction for partial rollback.
-- ============================================================

-- COMMIT Demo: User signup with subscription and payment.
-- All three inserts are wrapped in one transaction.
-- If all succeed, COMMIT saves everything permanently.
-- This ensures a user cannot have a subscription without a payment record.
START TRANSACTION;
    INSERT INTO User (Name, Email, Password, JoiningDate)
    VALUES ('Test User', 'test@gmail.com', 'hashed', CURDATE());
    SET @uid = LAST_INSERT_ID();
    INSERT INTO Subscription (UserID, PlanType, StartDate, EndDate, Status)
    VALUES (@uid, 'Premium', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'Active');
    SET @sid = LAST_INSERT_ID();
    INSERT INTO Payment (SubscriptionID, Amount, PaymentDate, PaymentMethod, Status)
    VALUES (@sid, 199.00, CURDATE(), 'UPI', 'Success');
COMMIT;

-- ROLLBACK Demo: Payment gateway fails.
-- The user and subscription inserts are rolled back completely.
-- No partial data is saved. This demonstrates Atomicity.
-- Verify after: SELECT * FROM User WHERE Email = 'rb@gmail.com'; returns 0 rows.
START TRANSACTION;
    INSERT INTO User (Name, Email, Password, JoiningDate)
    VALUES ('Rollback User', 'rb@gmail.com', 'hashed', CURDATE());
    -- Payment fails here, so we rollback everything
ROLLBACK;

-- SAVEPOINT Demo: Partial rollback within a transaction.
-- Artist and Album are inserted and a savepoint is set.
-- A bad Song insert fails, so we rollback only to the savepoint.
-- Artist and Album are kept, only the bad Song is discarded.
START TRANSACTION;
    INSERT INTO Artist (ArtistName, Country) VALUES ('New Artist', 'India');
    SET @aid = LAST_INSERT_ID();
    SAVEPOINT after_artist;
    INSERT INTO Album (AlbumName, ReleaseYear, ArtistID) VALUES ('New Album', 2024, @aid);
    SET @alid = LAST_INSERT_ID();
    SAVEPOINT after_album;
    -- Song insert fails validation, rollback to checkpoint
    ROLLBACK TO SAVEPOINT after_album;
COMMIT;

-- ============================================================
-- SECTION 9: DML - DATA MANIPULATION LANGUAGE
-- DML includes INSERT, UPDATE, and DELETE operations.
-- These modify the data stored in the tables.
-- ============================================================

-- UPDATE: Marks subscriptions as Expired when their end date has passed.
-- WHERE filters only Active subscriptions with a past EndDate.
UPDATE Subscription
SET Status = 'Expired'
WHERE EndDate < CURDATE() AND Status = 'Active';

-- UPDATE: Changes the country of a specific artist.
UPDATE Artist
SET Country = 'United Kingdom'
WHERE ArtistID = 3;

-- DELETE: Removes old listening history records older than 1 year.
-- DATE_SUB subtracts 1 year from the current date for comparison.
DELETE FROM ListeningHistory
WHERE PlayedAt < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- ============================================================
-- SECTION 10: QUERY OPTIMIZATION
-- Indexing speeds up queries by allowing MySQL to find rows
-- without scanning the entire table. EXPLAIN shows the query
-- execution plan. SET profiling measures actual execution time.
-- ============================================================

-- Step 1: Drop the index to simulate the "before" state.
-- This forces MySQL to do a full table scan.
ALTER TABLE ListeningHistory DROP INDEX idx_history_user;

-- EXPLAIN without index: type = ALL means full table scan.
-- MySQL reads every row to find matching UserID.
EXPLAIN SELECT * FROM ListeningHistory WHERE UserID = 3;

-- Step 2: Recreate the index on UserID column.
CREATE INDEX idx_history_user ON ListeningHistory(UserID);

-- EXPLAIN with index: type = ref means index scan.
-- MySQL reads only the rows that match UserID = 3.
-- Rows examined drops from 150 to 9.
EXPLAIN SELECT * FROM ListeningHistory WHERE UserID = 3;

-- Measure actual execution time using profiling.
-- SHOW PROFILES displays time taken for each query.
-- Before index: ~0.8ms. After index: ~0.1ms. 8x improvement.
SET profiling = 1;
SELECT * FROM ListeningHistory WHERE UserID = 3;
SHOW PROFILES;

-- ============================================================
-- SECTION 11: NORMALIZATION VERIFICATION
-- These queries demonstrate that our schema is in 3NF.
-- ============================================================

-- 1NF check: Each row in Song_Genre has exactly one SongID and one GenreID.
-- Genres are not stored as comma-separated text in Song table.
SELECT s.SongID, s.Title, g.GenreName
FROM Song s
JOIN Song_Genre sg ON s.SongID = sg.SongID
JOIN Genre g ON sg.GenreID = g.GenreID
ORDER BY s.SongID;

-- 2NF check: Playlist_Song only stores PlaylistID, SongID, AddedOn.
-- Song title and duration are NOT stored here because they depend
-- only on SongID, not on the full composite key (PlaylistID, SongID).
SELECT ps.PlaylistID, ps.SongID, ps.AddedOn, s.Title, s.Duration
FROM Playlist_Song ps
JOIN Song s ON ps.SongID = s.SongID
LIMIT 10;

-- 3NF check: Payment does not store UserEmail.
-- User details are accessed through a join, not stored redundantly.
SELECT p.PaymentID, p.Amount, sub.PlanType, u.Name, u.Email
FROM Payment p
JOIN Subscription sub ON p.SubscriptionID = sub.SubscriptionID
JOIN User u ON sub.UserID = u.UserID
LIMIT 10;
