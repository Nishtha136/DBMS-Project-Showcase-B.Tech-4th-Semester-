
/*
  app.js - Frontend JavaScript for Music Streaming Platform
  
  This file handles all the interactive functionality of the website:
  - Tab switching between different sections
  - Storing all SQL query data (SQL text + explanations)
  - Opening and closing modals to display SQL queries
  - Fetching live data from the Node.js backend API
  - Rendering API results as HTML tables
  - Search functions that call the backend with user input
  
  The frontend communicates with the backend (server.js) using
  the fetch() API. The backend runs SQL queries on MySQL and
  returns JSON data which this file renders as tables.
*/

/*
  showTab() - Handles tab switching in the Queries section.
  
  When a user clicks a tab button (Basic, Joins, Group By etc.),
  this function:
  1. Removes 'active' class from ALL tab content divs (hides them all)
  2. Removes 'active' class from ALL tab buttons (deselects them all)
  3. Adds 'active' class to the selected tab content (shows it)
  4. Adds 'active' class to the clicked button (highlights it)
  
  The CSS uses display:none for non-active tabs and display:block
  for the active tab, so only one tab is visible at a time.
*/
function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  event.target.classList.add('active');
}

/*
  queries object - Stores all SQL query data for the Queries section.
  
  Each key (q1, q2, ... vw1, vw2 etc.) maps to an object with:
  - title: The display name shown in the modal header
  - sql: The actual SQL query text shown in the code block
  - explanation: A plain English explanation of what the query does
    and why it is used
  
  When a user clicks a query card, the openModal() function reads
  from this object and populates the modal with the correct content.
  
  This approach keeps all query data in one place, making it easy
  to update or add new queries without changing the HTML.
*/
const queries = {
  q1: {
    title: 'Q1 — List All Users',
    sql: `SELECT * FROM User;`,
    explanation: 'Basic SELECT to retrieve all registered users. Used to verify data insertion and get a full user list.'
  },
  q2: {
    title: 'Q2 — Active Subscriptions',
    sql: `SELECT * FROM Subscription WHERE Status = 'Active';`,
    explanation: "Filters subscriptions using WHERE clause. Only returns rows where Status = 'Active'."
  },
  q3: {
    title: 'Q3 — Songs with Duration in Minutes (Scalar Functions)',
    sql: `SELECT
    SongID,
    Title,
    Duration                    AS Duration_Seconds,
    ROUND(Duration / 60, 2)     AS Duration_Minutes,
    UPPER(Title)                AS Title_Uppercase,
    LENGTH(Title)               AS Title_Length
FROM Song;`,
    explanation: 'Demonstrates scalar functions: ROUND() converts seconds to minutes, UPPER() uppercases the title, LENGTH() returns character count.'
  },
  q4: {
    title: 'Q4 — Artists from India',
    sql: `SELECT * FROM Artist WHERE Country = 'India';`,
    explanation: 'Simple WHERE filter on the Artist table to find all Indian artists.'
  },
  q5: {
    title: 'Q5 — Songs Released After 2015',
    sql: `SELECT s.Title, a.AlbumName, a.ReleaseYear
FROM Song s
JOIN Album a ON s.AlbumID = a.AlbumID
WHERE a.ReleaseYear > 2015;`,
    explanation: 'JOIN between Song and Album, then filtered by ReleaseYear. Shows how to filter on a joined column.'
  },
  q6: {
    title: 'Q6 — Songs with Album & Artist (INNER JOIN)',
    sql: `SELECT
    s.SongID,
    s.Title          AS SongTitle,
    a.AlbumName,
    ar.ArtistName,
    ar.Country,
    a.ReleaseYear
FROM Song s
INNER JOIN Album a   ON s.AlbumID  = a.AlbumID
INNER JOIN Artist ar ON a.ArtistID = ar.ArtistID
ORDER BY ar.ArtistName;`,
    explanation: 'Three-table INNER JOIN: Song → Album → Artist. Only returns songs that have an album AND an artist. Results ordered by artist name.'
  },
  q7: {
    title: 'Q7 — All Songs including those without an Album (LEFT JOIN)',
    sql: `SELECT
    s.SongID,
    s.Title,
    IFNULL(a.AlbumName,   'No Album') AS Album,
    IFNULL(ar.ArtistName, 'Unknown')  AS Artist
FROM Song s
LEFT JOIN Album a   ON s.AlbumID  = a.AlbumID
LEFT JOIN Artist ar ON a.ArtistID = ar.ArtistID;`,
    explanation: 'LEFT JOIN keeps all songs even if AlbumID is NULL (standalone singles). IFNULL() replaces NULL with a readable label.'
  },
  q8: {
    title: 'Q8 — All Artists even if they have no Songs (RIGHT JOIN)',
    sql: `SELECT
    ar.ArtistName,
    a.AlbumName,
    s.Title AS SongTitle
FROM Song s
RIGHT JOIN Album a   ON s.AlbumID  = a.AlbumID
RIGHT JOIN Artist ar ON a.ArtistID = ar.ArtistID;`,
    explanation: 'RIGHT JOIN ensures every artist appears in results even if they have no songs in the database yet.'
  },
  q9: {
    title: 'Q9 — User → Playlist → Song (3-Table JOIN)',
    sql: `SELECT
    u.Name        AS UserName,
    p.PlaylistName,
    s.Title       AS SongTitle,
    ps.AddedOn
FROM User u
JOIN Playlist p       ON u.UserID     = p.UserID
JOIN Playlist_Song ps ON p.PlaylistID = ps.PlaylistID
JOIN Song s           ON ps.SongID    = s.SongID
ORDER BY u.Name, p.PlaylistName;`,
    explanation: 'Four-table JOIN traversing the full path: User → Playlist → Playlist_Song (bridge) → Song. Shows which user has which songs in which playlist.'
  },
  q10: {
    title: 'Q10 — Songs with their Genres (GROUP_CONCAT)',
    sql: `SELECT
    s.Title,
    GROUP_CONCAT(g.GenreName ORDER BY g.GenreName SEPARATOR ', ') AS Genres
FROM Song s
JOIN Song_Genre sg ON s.SongID   = sg.SongID
JOIN Genre g       ON sg.GenreID = g.GenreID
GROUP BY s.SongID, s.Title
ORDER BY s.Title;`,
    explanation: 'Uses GROUP_CONCAT to collapse multiple genre rows into a single comma-separated string per song. Demonstrates M:N relationship traversal.'
  },
  q11: {
    title: 'Q11 — Full Listening History with Song & Artist',
    sql: `SELECT
    u.Name        AS UserName,
    s.Title       AS SongTitle,
    IFNULL(ar.ArtistName, 'Unknown') AS Artist,
    lh.PlayedAt
FROM ListeningHistory lh
JOIN User u         ON lh.UserID  = u.UserID
JOIN Song s         ON lh.SongID  = s.SongID
LEFT JOIN Album a   ON s.AlbumID  = a.AlbumID
LEFT JOIN Artist ar ON a.ArtistID = ar.ArtistID
ORDER BY lh.PlayedAt DESC;`,
    explanation: 'Five-table JOIN showing complete listening history. LEFT JOIN on Album/Artist handles standalone songs with no album.'
  },
  q12: {
    title: 'Q12 — Subscription + Payment Details per User',
    sql: `SELECT
    u.Name,
    u.Email,
    sub.PlanType,
    sub.Status        AS SubStatus,
    p.Amount,
    p.PaymentMethod,
    p.PaymentDate,
    p.Status          AS PaymentStatus
FROM User u
JOIN Subscription sub ON u.UserID           = sub.UserID
JOIN Payment p        ON sub.SubscriptionID = p.SubscriptionID
ORDER BY p.PaymentDate DESC;`,
    explanation: 'Three-table JOIN linking User → Subscription → Payment. Useful for billing reports and audits.'
  },
  q13: {
    title: 'Q13 — Number of Songs per Genre',
    sql: `SELECT
    g.GenreName,
    COUNT(sg.SongID) AS TotalSongs
FROM Genre g
JOIN Song_Genre sg ON g.GenreID = sg.GenreID
GROUP BY g.GenreID, g.GenreName
ORDER BY TotalSongs DESC;`,
    explanation: 'GROUP BY with COUNT aggregate. Groups all song-genre pairs by genre and counts songs in each. ORDER BY shows most popular genre first.'
  },
  q14: {
    title: 'Q14 — Artists with more than 1 Album (HAVING)',
    sql: `SELECT
    ar.ArtistName,
    COUNT(a.AlbumID) AS AlbumCount
FROM Artist ar
JOIN Album a ON ar.ArtistID = a.ArtistID
GROUP BY ar.ArtistID, ar.ArtistName
HAVING AlbumCount > 1;`,
    explanation: 'HAVING filters groups after aggregation (unlike WHERE which filters rows before). Only artists with more than 1 album are returned.'
  },
  q15: {
    title: 'Q15 — Revenue per Payment Method',
    sql: `SELECT
    PaymentMethod,
    COUNT(*)       AS TransactionCount,
    SUM(Amount)    AS TotalRevenue,
    AVG(Amount)    AS AvgAmount
FROM Payment
WHERE Status = 'Success'
GROUP BY PaymentMethod
HAVING TotalRevenue > 100
ORDER BY TotalRevenue DESC;`,
    explanation: 'Combines WHERE (filter before grouping), GROUP BY, multiple aggregates (COUNT, SUM, AVG), and HAVING (filter after grouping).'
  },
  q16: {
    title: 'Q16 — Top 5 Most Played Songs',
    sql: `SELECT
    s.Title,
    IFNULL(ar.ArtistName, 'Unknown') AS Artist,
    COUNT(lh.HistoryID)              AS PlayCount
FROM ListeningHistory lh
JOIN Song s         ON lh.SongID  = s.SongID
LEFT JOIN Album a   ON s.AlbumID  = a.AlbumID
LEFT JOIN Artist ar ON a.ArtistID = ar.ArtistID
GROUP BY s.SongID, s.Title, ar.ArtistName
HAVING PlayCount >= 2
ORDER BY PlayCount DESC
LIMIT 5;`,
    explanation: 'Full pipeline: JOIN → GROUP BY → HAVING → ORDER BY → LIMIT. Finds the 5 most-played songs with at least 2 plays.'
  },
  q17: {
    title: 'Q17 — Users who listened to more than 2 unique songs',
    sql: `SELECT
    u.Name,
    COUNT(DISTINCT lh.SongID) AS UniqueSongsPlayed
FROM User u
JOIN ListeningHistory lh ON u.UserID = lh.UserID
GROUP BY u.UserID, u.Name
HAVING UniqueSongsPlayed > 2
ORDER BY UniqueSongsPlayed DESC;`,
    explanation: 'COUNT(DISTINCT) counts unique songs per user, not total plays. HAVING filters to only active listeners.'
  },
  q18: {
    title: 'Q18 — Average Subscription Duration per Plan',
    sql: `SELECT
    PlanType,
    COUNT(*)  AS TotalSubscriptions,
    AVG(DATEDIFF(IFNULL(EndDate, CURDATE()), StartDate)) AS AvgDurationDays
FROM Subscription
GROUP BY PlanType;`,
    explanation: 'DATEDIFF calculates days between dates. IFNULL handles Free plans with no EndDate by using today. AVG aggregates per plan type.'
  },
  q19: {
    title: 'Q19 — Premium Users (Subquery with IN)',
    sql: `SELECT Name, Email
FROM User
WHERE UserID IN (
    SELECT UserID
    FROM Subscription
    WHERE PlanType = 'Premium' AND Status = 'Active'
);`,
    explanation: 'Subquery in WHERE clause using IN. The inner query returns a list of UserIDs with active Premium plans; the outer query fetches those users.'
  },
  q20: {
    title: 'Q20 — Songs NOT in any Playlist (NOT IN)',
    sql: `SELECT SongID, Title
FROM Song
WHERE SongID NOT IN (
    SELECT DISTINCT SongID FROM Playlist_Song
);`,
    explanation: 'NOT IN subquery finds songs that have never been added to any playlist. Useful for content recommendation.'
  },
  q21: {
    title: 'Q21 — Songs longer than Average Duration',
    sql: `SELECT Title, Duration,
       ROUND(Duration / 60, 2) AS Minutes
FROM Song
WHERE Duration > (SELECT AVG(Duration) FROM Song)
ORDER BY Duration DESC;`,
    explanation: 'Scalar subquery: the inner SELECT returns a single value (average duration) which is used in the outer WHERE comparison.'
  },
  q22: {
    title: 'Q22 — Artist with Most Songs (Subquery in FROM)',
    sql: `SELECT ArtistName, TotalSongs
FROM (
    SELECT ar.ArtistName, COUNT(s.SongID) AS TotalSongs
    FROM Artist ar
    JOIN Album a ON ar.ArtistID = a.ArtistID
    JOIN Song s  ON a.AlbumID  = s.AlbumID
    GROUP BY ar.ArtistID, ar.ArtistName
) AS ArtistSongCount
ORDER BY TotalSongs DESC
LIMIT 1;`,
    explanation: 'Derived table (subquery in FROM clause). The inner query builds a summary table; the outer query selects from it. Also called an inline view.'
  },
  q23: {
    title: 'Q23 — Users with a Failed Payment (EXISTS)',
    sql: `SELECT u.Name, u.Email
FROM User u
WHERE EXISTS (
    SELECT 1
    FROM Subscription sub
    JOIN Payment p ON sub.SubscriptionID = p.SubscriptionID
    WHERE sub.UserID = u.UserID AND p.Status = 'Failed'
);`,
    explanation: 'EXISTS subquery: returns TRUE as soon as one matching row is found. More efficient than IN for large datasets. The outer query references the inner (correlated).'
  },
  q24: {
    title: 'Q24 — Most Expensive Payment per Plan Type (Correlated Subquery)',
    sql: `SELECT sub.PlanType, p.Amount, p.PaymentDate, p.PaymentMethod
FROM Payment p
JOIN Subscription sub ON p.SubscriptionID = sub.SubscriptionID
WHERE p.Amount = (
    SELECT MAX(p2.Amount)
    FROM Payment p2
    JOIN Subscription sub2 ON p2.SubscriptionID = sub2.SubscriptionID
    WHERE sub2.PlanType = sub.PlanType
);`,
    explanation: 'Correlated subquery: the inner query references the outer query (sub.PlanType). It runs once per row of the outer query to find the max amount for that plan type.'
  },
  q25: {
    title: 'Q25 — Payment Aggregate Functions',
    sql: `SELECT
    COUNT(*)        AS TotalPayments,
    SUM(Amount)     AS TotalRevenue,
    AVG(Amount)     AS AvgPayment,
    MAX(Amount)     AS MaxPayment,
    MIN(Amount)     AS MinPayment
FROM Payment
WHERE Status = 'Success';`,
    explanation: 'All five standard aggregate functions in one query: COUNT, SUM, AVG, MAX, MIN — applied only to successful payments.'
  },
  q26: {
    title: 'Q26 — User String & Date Scalar Functions',
    sql: `SELECT
    UserID,
    UPPER(Name)                                       AS NameUpper,
    LOWER(Email)                                      AS EmailLower,
    LENGTH(Name)                                      AS NameLength,
    SUBSTRING(Email, 1, LOCATE('@', Email) - 1)       AS EmailUsername,
    DATEDIFF(CURDATE(), JoiningDate)                  AS DaysSinceJoining,
    DATE_FORMAT(JoiningDate, '%d %M %Y')              AS FormattedDate
FROM User;`,
    explanation: 'Scalar functions: UPPER, LOWER, LENGTH, SUBSTRING, LOCATE, DATEDIFF, DATE_FORMAT — all applied per row without grouping.'
  },
  q27: {
    title: 'Q27 — Song Title String Manipulation',
    sql: `SELECT
    SongID,
    Title,
    CONCAT(Title, ' (', ROUND(Duration/60, 1), ' min)') AS TitleWithDuration,
    REPLACE(Title, ' ', '_')                             AS TitleSlug
FROM Song;`,
    explanation: 'CONCAT builds a display string combining title and duration. REPLACE creates a URL-friendly slug by replacing spaces with underscores.'
  },
  q28: {
    title: 'Q28 — Payment Date Functions',
    sql: `SELECT
    PaymentID,
    PaymentDate,
    YEAR(PaymentDate)        AS PayYear,
    MONTH(PaymentDate)       AS PayMonth,
    MONTHNAME(PaymentDate)   AS MonthName,
    DAYNAME(PaymentDate)     AS DayName
FROM Payment;`,
    explanation: 'Date scalar functions: YEAR(), MONTH(), MONTHNAME(), DAYNAME() — extract components from a DATE column.'
  },
  vw1: {
    title: 'View 1 — Active Premium Users',
    sql: `CREATE OR REPLACE VIEW vw_ActivePremiumUsers AS
SELECT
    u.UserID,
    u.Name,
    u.Email,
    sub.PlanType,
    sub.StartDate,
    sub.EndDate
FROM User u
JOIN Subscription sub ON u.UserID = sub.UserID
WHERE sub.PlanType = 'Premium' AND sub.Status = 'Active';

-- Query the view:
SELECT * FROM vw_ActivePremiumUsers;`,
    explanation: "A VIEW is a saved SELECT query. It acts like a virtual table. This view hides the JOIN complexity — users just query vw_ActivePremiumUsers to get premium users."
  },
  vw2: {
    title: 'View 2 — Full Song Details',
    sql: `CREATE OR REPLACE VIEW vw_SongDetails AS
SELECT
    s.SongID,
    s.Title,
    ROUND(s.Duration/60, 2)          AS Duration_Min,
    IFNULL(a.AlbumName, 'Single')    AS Album,
    IFNULL(ar.ArtistName, 'Unknown') AS Artist,
    ar.Country,
    a.ReleaseYear,
    GROUP_CONCAT(g.GenreName SEPARATOR ', ') AS Genres
FROM Song s
LEFT JOIN Album a       ON s.AlbumID  = a.AlbumID
LEFT JOIN Artist ar     ON a.ArtistID = ar.ArtistID
LEFT JOIN Song_Genre sg ON s.SongID   = sg.SongID
LEFT JOIN Genre g       ON sg.GenreID = g.GenreID
GROUP BY s.SongID, s.Title, s.Duration,
         a.AlbumName, ar.ArtistName, ar.Country, a.ReleaseYear;

-- Query the view:
SELECT * FROM vw_SongDetails;`,
    explanation: 'This view joins 5 tables and uses GROUP_CONCAT. Once created, a simple SELECT * gives full song info without writing the complex JOIN every time.'
  },
  vw3: {
    title: 'View 3 — Revenue Summary by Plan',
    sql: `CREATE OR REPLACE VIEW vw_RevenueSummary AS
SELECT
    sub.PlanType,
    COUNT(p.PaymentID) AS TotalTransactions,
    SUM(p.Amount)      AS TotalRevenue,
    AVG(p.Amount)      AS AvgRevenue
FROM Payment p
JOIN Subscription sub ON p.SubscriptionID = sub.SubscriptionID
WHERE p.Status = 'Success'
GROUP BY sub.PlanType;

-- Query the view:
SELECT * FROM vw_RevenueSummary;`,
    explanation: 'Aggregation view — encapsulates revenue calculation logic. Business teams can query this without knowing the underlying table structure.'
  },
  vw4: {
    title: 'View 4 — User Playlist Summary',
    sql: `CREATE OR REPLACE VIEW vw_UserPlaylistSummary AS
SELECT
    u.Name                           AS UserName,
    COUNT(DISTINCT p.PlaylistID)     AS TotalPlaylists,
    COUNT(ps.SongID)                 AS TotalSongsInPlaylists
FROM User u
LEFT JOIN Playlist p       ON u.UserID     = p.UserID
LEFT JOIN Playlist_Song ps ON p.PlaylistID = ps.PlaylistID
GROUP BY u.UserID, u.Name;

-- Query the view:
SELECT * FROM vw_UserPlaylistSummary;`,
    explanation: 'LEFT JOIN ensures users with no playlists still appear (with 0 counts). COUNT(DISTINCT) counts unique playlists; COUNT(ps.SongID) counts total songs across all playlists.'
  }
};

// TCL demo SQL for COMMIT, ROLLBACK, and SAVEPOINT scenarios
const tclData = {
  commit: {
    title: '✅ COMMIT — Successful Transaction',
    sql: `-- SCENARIO: New user signs up, gets a subscription, makes payment.
-- All 3 inserts must succeed together (Atomicity).

START TRANSACTION;

    -- Step 1: Create the user
    INSERT INTO User (Name, Email, Password, JoiningDate)
    VALUES ('Test User', 'testuser@gmail.com', 'hashed_test', CURDATE());

    SET @new_user_id = LAST_INSERT_ID();

    -- Step 2: Create subscription for that user
    INSERT INTO Subscription (UserID, PlanType, StartDate, EndDate, Status)
    VALUES (@new_user_id, 'Premium', CURDATE(),
            DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'Active');

    SET @new_sub_id = LAST_INSERT_ID();

    -- Step 3: Record the payment
    INSERT INTO Payment (SubscriptionID, Amount, PaymentDate, PaymentMethod, Status)
    VALUES (@new_sub_id, 199.00, CURDATE(), 'UPI', 'Success');

COMMIT;
-- All 3 rows are now permanently saved.
-- Verify: SELECT * FROM User WHERE Email = 'testuser@gmail.com';`
  },
  rollback: {
    title: '❌ ROLLBACK — Failed Transaction',
    sql: `-- SCENARIO: Payment gateway returns failure.
-- We must rollback the subscription too — no partial data.

START TRANSACTION;

    -- Step 1: Create the user
    INSERT INTO User (Name, Email, Password, JoiningDate)
    VALUES ('Rollback User', 'rollback@gmail.com', 'hashed_rb', CURDATE());

    SET @rb_user_id = LAST_INSERT_ID();

    -- Step 2: Create subscription
    INSERT INTO Subscription (UserID, PlanType, StartDate, EndDate, Status)
    VALUES (@rb_user_id, 'Basic', CURDATE(),
            DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'Active');

    -- Step 3: Payment gateway returns FAILURE
    -- (In real app: payment API call fails here)
    -- We do NOT insert into Payment table.

ROLLBACK;
-- Neither User nor Subscription row is saved.
-- Verify: SELECT * FROM User WHERE Email = 'rollback@gmail.com';
-- Result: 0 rows — as if the transaction never happened.

-- WHY THIS MATTERS (Atomicity):
-- Without transactions, Step 1 & 2 would be saved even if payment fails.
-- The user would have a subscription they never paid for.`
  },
  savepoint: {
    title: '📌 SAVEPOINT — Partial Rollback',
    sql: `-- SCENARIO: Batch insert — Artist + Album succeed,
-- but one Song insert fails. Roll back only the bad song.

START TRANSACTION;

    -- Step 1: Insert artist
    INSERT INTO Artist (ArtistName, Country)
    VALUES ('New Artist', 'India');
    SET @new_artist = LAST_INSERT_ID();

    SAVEPOINT after_artist;   -- checkpoint 1

    -- Step 2: Insert album
    INSERT INTO Album (AlbumName, ReleaseYear, ArtistID)
    VALUES ('New Album', 2024, @new_artist);
    SET @new_album = LAST_INSERT_ID();

    SAVEPOINT after_album;    -- checkpoint 2

    -- Step 3a: First song — OK
    INSERT INTO Song (Title, Duration, AlbumID)
    VALUES ('Good Song', 200, @new_album);

    SAVEPOINT after_good_song;

    -- Step 3b: Second song — validation fails in app layer
    -- (e.g., duration is 0, which is invalid per business rule)
    -- Roll back ONLY to after_album checkpoint:
    ROLLBACK TO SAVEPOINT after_album;

    -- Artist + Album are still in the transaction.
    -- The failed song insert is undone.

COMMIT;
-- Result: Artist and Album are saved. Bad song is not.

-- HOW LOCKING WORKS IN REAL LIFE:
-- InnoDB places a row-level lock on inserted rows during the transaction.
-- Other sessions cannot modify these rows until COMMIT or ROLLBACK.
-- SELECT ... FOR UPDATE explicitly locks rows for update:
--   START TRANSACTION;
--   SELECT * FROM Subscription WHERE SubscriptionID = 3 FOR UPDATE;
--   UPDATE Subscription SET Status = 'Expired' WHERE SubscriptionID = 3;
--   COMMIT;`
  }
};

// Stored procedure SQL for all 5 procedures
const procData = {
  p1: {
    title: '🎤 GetSongsByArtist(artistName)',
    sql: `DELIMITER $$

CREATE PROCEDURE GetSongsByArtist(IN p_ArtistName VARCHAR(150))
BEGIN
    SELECT
        s.SongID,
        s.Title,
        ROUND(s.Duration/60, 2) AS Duration_Min,
        a.AlbumName,
        a.ReleaseYear
    FROM Song s
    JOIN Album a   ON s.AlbumID  = a.AlbumID
    JOIN Artist ar ON a.ArtistID = ar.ArtistID
    WHERE ar.ArtistName LIKE CONCAT('%', p_ArtistName, '%')
    ORDER BY a.ReleaseYear, s.Title;
END$$

DELIMITER ;

-- Call it:
CALL GetSongsByArtist('Arijit');
CALL GetSongsByArtist('Taylor');`
  },
  p2: {
    title: '📜 GetUserHistory(userID)',
    sql: `DELIMITER $$

CREATE PROCEDURE GetUserHistory(IN p_UserID INT)
BEGIN
    SELECT
        u.Name,
        s.Title                          AS SongTitle,
        IFNULL(ar.ArtistName, 'Unknown') AS Artist,
        lh.PlayedAt
    FROM ListeningHistory lh
    JOIN User u         ON lh.UserID  = u.UserID
    JOIN Song s         ON lh.SongID  = s.SongID
    LEFT JOIN Album a   ON s.AlbumID  = a.AlbumID
    LEFT JOIN Artist ar ON a.ArtistID = ar.ArtistID
    WHERE lh.UserID = p_UserID
    ORDER BY lh.PlayedAt DESC;
END$$

DELIMITER ;

-- Call it:
CALL GetUserHistory(1);
CALL GetUserHistory(5);`
  },
  p3: {
    title: '➕ AddSongToPlaylist(playlistID, songID, OUT message)',
    sql: `DELIMITER $$

CREATE PROCEDURE AddSongToPlaylist(
    IN  p_PlaylistID INT,
    IN  p_SongID     INT,
    OUT p_Message    VARCHAR(100)
)
BEGIN
    -- Check if song already exists in playlist
    IF EXISTS (
        SELECT 1 FROM Playlist_Song
        WHERE PlaylistID = p_PlaylistID AND SongID = p_SongID
    ) THEN
        SET p_Message = 'Song already exists in playlist.';
    ELSE
        INSERT INTO Playlist_Song (PlaylistID, SongID)
        VALUES (p_PlaylistID, p_SongID);
        SET p_Message = 'Song added successfully.';
    END IF;
END$$

DELIMITER ;

-- Call it:
SET @msg = '';
CALL AddSongToPlaylist(1, 50, @msg);
SELECT @msg AS Result;

-- Try adding same song again:
CALL AddSongToPlaylist(1, 50, @msg);
SELECT @msg AS Result;`
  },
  p4: {
    title: '🏆 GetTopSongs(limit)',
    sql: `DELIMITER $$

CREATE PROCEDURE GetTopSongs(IN p_Limit INT)
BEGIN
    SELECT
        s.Title,
        IFNULL(ar.ArtistName, 'Unknown') AS Artist,
        COUNT(lh.HistoryID)              AS PlayCount
    FROM ListeningHistory lh
    JOIN Song s         ON lh.SongID  = s.SongID
    LEFT JOIN Album a   ON s.AlbumID  = a.AlbumID
    LEFT JOIN Artist ar ON a.ArtistID = ar.ArtistID
    GROUP BY s.SongID, s.Title, ar.ArtistName
    ORDER BY PlayCount DESC
    LIMIT p_Limit;
END$$

DELIMITER ;

-- Call it:
CALL GetTopSongs(5);
CALL GetTopSongs(10);`
  },
  p5: {
    title: '📊 GetMonthlyRevenue(year)',
    sql: `DELIMITER $$

CREATE PROCEDURE GetMonthlyRevenue(IN p_Year INT)
BEGIN
    SELECT
        MONTHNAME(PaymentDate)  AS Month,
        MONTH(PaymentDate)      AS MonthNum,
        COUNT(*)                AS Transactions,
        SUM(Amount)             AS Revenue
    FROM Payment
    WHERE Status = 'Success'
      AND YEAR(PaymentDate) = p_Year
    GROUP BY MONTH(PaymentDate), MONTHNAME(PaymentDate)
    ORDER BY MonthNum;
END$$

DELIMITER ;

-- Call it:
CALL GetMonthlyRevenue(2024);
CALL GetMonthlyRevenue(2025);`
  }
};

// Opens query modal and populates it with SQL and explanation for the clicked query
function showQuery(id) {
  const q = queries[id];
  if (!q) return;
  document.getElementById('modal-title').textContent = q.title;
  document.getElementById('modal-code').textContent = q.sql;
  document.getElementById('modal-explanation').innerHTML =
    '<strong>💡 Explanation:</strong> ' + q.explanation;
  document.getElementById('query-modal').classList.remove('hidden');
}

// Hides the query modal
function closeModal() {
  document.getElementById('query-modal').classList.add('hidden');
}

// Opens TCL modal with the selected transaction demo SQL
function showTCL(type) {
  const t = tclData[type];
  if (!t) return;
  document.getElementById('tcl-modal-title').textContent = t.title;
  document.getElementById('tcl-modal-code').textContent = t.sql;
  document.getElementById('tcl-modal').classList.remove('hidden');
}

function closeTCLModal() {
  document.getElementById('tcl-modal').classList.add('hidden');
}

// Opens stored procedure modal with the selected procedure SQL
function showProc(id) {
  const p = procData[id];
  if (!p) return;
  document.getElementById('proc-modal-title').textContent = p.title;
  document.getElementById('proc-modal-code').textContent = p.sql;
  document.getElementById('proc-modal').classList.remove('hidden');
}

function closeProcModal() {
  document.getElementById('proc-modal').classList.add('hidden');
}

// Close any modal when clicking the dark backdrop behind it
document.addEventListener('click', function (e) {
  if (e.target.classList.contains('modal')) {
    e.target.classList.add('hidden');
  }
});

// Close modals on Escape key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  }
});

// ============================================================
// LIVE DATA — fetch from backend and render tables
// ============================================================

/*
  renderTable() - Converts a JSON array into an HTML table.
  
  The API returns data as an array of objects, for example:
  [ { Name: "Arjun", Email: "arjun@gmail.com" }, ... ]
  
  This function:
  1. Gets the column names from the first object's keys
  2. Builds a <table> with <thead> containing column headers
  3. Loops through each row and builds <tr> with <td> cells
  4. Inserts the finished table HTML into the container div
  
  If the data array is empty, it shows a "No results" message instead.
  The ?? operator handles null/undefined values by replacing them with ''.
*/
function renderTable(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!data || data.length === 0) {
    container.innerHTML = '<p style="color:#94a3b8;padding:1rem">No results found.</p>';
    return;
  }
  const cols = Object.keys(data[0]);
  let html = '<table class="explain-table"><thead><tr>';
  cols.forEach(c => html += `<th>${c}</th>`);
  html += '</tr></thead><tbody>';
  data.forEach(row => {
    html += '<tr>';
    cols.forEach(c => html += `<td>${row[c] ?? ''}</td>`);
    html += '</tr>';
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

/*
  loadData() - Fetches data from the Node.js API and renders it as a table.
  
  This is the main function used by all live data buttons and search functions.
  
  How it works:
  1. Shows a "Loading..." message in the result container
  2. Calls fetch() with the API endpoint URL (e.g. /api/users)
  3. The Node.js server receives the request, runs the SQL query on MySQL,
     and sends back JSON data
  4. This function receives the JSON and passes it to renderTable()
  5. If the server is not running or there is a network error,
     it shows an error message telling the user to start the server
  
  The async/await syntax makes the code readable by avoiding callback nesting.
  try/catch handles any errors that occur during the fetch.
*/
async function loadData(endpoint, containerId) {
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = '<p style="color:#94a3b8;padding:1rem">Loading...</p>';
  try {
    const res  = await fetch(`http://localhost:3000${endpoint}`);
    const data = await res.json();
    renderTable(containerId, data);
  } catch (e) {
    if (container) container.innerHTML =
      '<p style="color:#ef4444;padding:1rem">⚠️ Could not connect to server. Make sure Node.js server is running.</p>';
  }
}

/*
  Search and filter functions for the Live Data section.
  
  Each function follows the same pattern:
  1. Read the value from the input field using getElementById
  2. Validate that the value is not empty
  3. Call loadData() with the appropriate API endpoint
     (the input value is encoded using encodeURIComponent to handle
      special characters like spaces and & in URLs)
  4. The result appears in the corresponding result div below the input
  
  These functions are called when the user clicks a Search button
  or presses Enter in an input field.
*/

/*
  searchByArtist() - Searches songs by artist name.
  Calls /api/songs/artist/:name which runs a LIKE query on ArtistName.
  Partial matching is supported (e.g. "Arijit" matches "Arijit Singh").
*/
async function searchByArtist() {
  const name = document.getElementById('inp-artist').value.trim();
  if (!name) { alert('Please enter an artist name'); return; }
  await loadData(`/api/songs/artist/${encodeURIComponent(name)}`, 'res-artist');
}

/*
  getUserHistory() - Fetches listening history for a specific user.
  Calls /api/history/:userId which runs a 5-table JOIN query.
  The UserID is taken from the number input field.
*/
async function getUserHistory() {
  const id = document.getElementById('inp-userid').value.trim();
  if (!id) { alert('Please enter a User ID'); return; }
  await loadData(`/api/history/${id}`, 'res-history');
}

async function getTopSongs() {
  const n = document.getElementById('inp-topn').value.trim();
  if (!n) { alert('Please enter a number'); return; }
  await loadData(`/api/top-songs/${n}`, 'res-topsongs');
}

async function getSongsByGenre() {
  const genre = document.getElementById('inp-genre').value;
  if (!genre) { alert('Please select a genre'); return; }
  await loadData(`/api/songs/genre/${encodeURIComponent(genre)}`, 'res-genre');
}

async function getRevenue() {
  const year = document.getElementById('inp-year').value.trim();
  if (!year) { alert('Please enter a year'); return; }
  await loadData(`/api/monthly-revenue/${year}`, 'res-revenue');
}

// Allow pressing Enter in input fields
document.addEventListener('DOMContentLoaded', () => {
  const enterMap = {
    'inp-artist': searchByArtist,
    'inp-userid': getUserHistory,
    'inp-topn':   getTopSongs,
    'inp-year':   getRevenue,
  };
  Object.entries(enterMap).forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') fn(); });
  });
});
