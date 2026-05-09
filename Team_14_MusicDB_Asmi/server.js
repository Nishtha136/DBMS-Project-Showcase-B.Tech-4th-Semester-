// Import required packages
// express: web framework for creating API routes
// mysql2: connects Node.js to MySQL database
// cors: allows frontend (browser) to call this backend API
// path: helps build file paths that work on all operating systems
const express = require('express');
const mysql   = require('mysql2');
const cors    = require('cors');
const path    = require('path');

// Create the Express app and enable JSON body parsing and CORS
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (HTML, CSS, JS) from the frontend folder
app.use(express.static(path.join(__dirname, 'frontend')));

// When user visits http://localhost:3000, send the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// MySQL connection configuration
// This connects Node.js to the music_streaming database on localhost
const db = mysql.createConnection({
  host:     'localhost',
  user:     'root',
  password: 'shoriasmi75',
  database: 'music_streaming'
});

// Try to connect to MySQL and log success or failure
db.connect(err => {
  if (err) { console.error('DB connection failed:', err); return; }
  console.log('Connected to MySQL');
});

// Middleware to log every incoming HTTP request (method + URL)
// Useful for debugging which API endpoints are being called
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Helper function that wraps db.query in a Promise
// This allows us to use async/await instead of callbacks
// params array is used for parameterized queries (prevents SQL injection)
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

// ══════════════════════════════════════════════════════════
// API ROUTES
// Each route handles a GET/POST/DELETE request from the frontend.
// The frontend calls these URLs using fetch(), and the route
// runs a SQL query on MySQL and sends back JSON results.
// ══════════════════════════════════════════════════════════

// Returns all 100 users from the User table
// Used in the Quick Queries section of the frontend
app.get('/api/users', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM User');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Returns all songs with album and artist info using LEFT JOIN
// LEFT JOIN is used so standalone singles (no album) also appear
// IFNULL replaces NULL album/artist with readable labels
app.get('/api/songs', async (req, res) => {
  try {
    const rows = await query(`
      SELECT s.SongID, s.Title,
             ROUND(s.Duration/60,2) AS Duration_Min,
             IFNULL(a.AlbumName,'Single') AS Album,
             IFNULL(ar.ArtistName,'Unknown') AS Artist,
             a.ReleaseYear
      FROM Song s
      LEFT JOIN Album a   ON s.AlbumID  = a.AlbumID
      LEFT JOIN Artist ar ON a.ArtistID = ar.ArtistID
      ORDER BY ar.ArtistName
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Returns top N most played songs ranked by play count
// :limit is a URL parameter (e.g. /api/top-songs/5)
// Uses GROUP BY on SongID to count plays from ListeningHistory
// LIMIT ? uses parameterized query to prevent SQL injection
app.get('/api/top-songs/:limit', async (req, res) => {
  try {
    const rows = await query(`
      SELECT s.Title,
             IFNULL(ar.ArtistName,'Unknown') AS Artist,
             COUNT(lh.HistoryID) AS PlayCount
      FROM ListeningHistory lh
      JOIN Song s         ON lh.SongID  = s.SongID
      LEFT JOIN Album a   ON s.AlbumID  = a.AlbumID
      LEFT JOIN Artist ar ON a.ArtistID = ar.ArtistID
      GROUP BY s.SongID, s.Title, ar.ArtistName
      ORDER BY PlayCount DESC
      LIMIT ?
    `, [parseInt(req.params.limit)]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Returns revenue summary grouped by subscription plan type
// Only counts successful payments using WHERE Status = 'Success'
// Uses COUNT, SUM, AVG aggregate functions
app.get('/api/revenue', async (req, res) => {
  try {
    const rows = await query(`
      SELECT sub.PlanType,
             COUNT(p.PaymentID) AS TotalTransactions,
             SUM(p.Amount)      AS TotalRevenue,
             AVG(p.Amount)      AS AvgRevenue
      FROM Payment p
      JOIN Subscription sub ON p.SubscriptionID = sub.SubscriptionID
      WHERE p.Status = 'Success'
      GROUP BY sub.PlanType
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Returns count of songs per genre using Song_Genre bridge table
// JOIN is needed because Song and Genre have M:N relationship
// Results ordered by most songs first
app.get('/api/genres', async (req, res) => {
  try {
    const rows = await query(`
      SELECT g.GenreName, COUNT(sg.SongID) AS TotalSongs
      FROM Genre g
      JOIN Song_Genre sg ON g.GenreID = sg.GenreID
      GROUP BY g.GenreID, g.GenreName
      ORDER BY TotalSongs DESC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Returns users who currently have an active Premium subscription
// Filters using WHERE on both PlanType and Status columns
app.get('/api/premium-users', async (req, res) => {
  try {
    const rows = await query(`
      SELECT u.Name, u.Email, sub.StartDate, sub.EndDate
      FROM User u
      JOIN Subscription sub ON u.UserID = sub.UserID
      WHERE sub.PlanType = 'Premium' AND sub.Status = 'Active'
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Returns listening history for a specific user
// :userId is taken from the URL and passed as a parameterized query
// 5-table JOIN: ListeningHistory → User → Song → Album → Artist
app.get('/api/history/:userId', async (req, res) => {
  try {
    const rows = await query(`
      SELECT s.Title, IFNULL(ar.ArtistName,'Unknown') AS Artist, lh.PlayedAt
      FROM ListeningHistory lh
      JOIN Song s         ON lh.SongID  = s.SongID
      LEFT JOIN Album a   ON s.AlbumID  = a.AlbumID
      LEFT JOIN Artist ar ON a.ArtistID = ar.ArtistID
      WHERE lh.UserID = ?
      ORDER BY lh.PlayedAt DESC
    `, [req.params.userId]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Searches songs by artist name using LIKE for partial matching
// e.g. searching "Arijit" will match "Arijit Singh"
// % wildcards on both sides allow matching anywhere in the name
app.get('/api/songs/artist/:name', async (req, res) => {
  try {
    const rows = await query(`
      SELECT s.Title, ROUND(s.Duration/60,2) AS Duration_Min,
             a.AlbumName, a.ReleaseYear
      FROM Song s
      JOIN Album a   ON s.AlbumID  = a.AlbumID
      JOIN Artist ar ON a.ArtistID = ar.ArtistID
      WHERE ar.ArtistName LIKE ?
      ORDER BY a.ReleaseYear
    `, [`%${req.params.name}%`]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Returns all artists ordered alphabetically by name
app.get('/api/artists', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM Artist ORDER BY ArtistName');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Returns artists filtered by country with album count
// Uses LEFT JOIN so artists with no albums still appear
// LIKE with % allows partial country name matching
app.get('/api/artists/country/:country', async (req, res) => {
  try {
    const rows = await query(`
      SELECT ar.ArtistID, ar.ArtistName, ar.Country,
             COUNT(a.AlbumID) AS TotalAlbums
      FROM Artist ar
      LEFT JOIN Album a ON ar.ArtistID = a.ArtistID
      WHERE ar.Country LIKE ?
      GROUP BY ar.ArtistID, ar.ArtistName, ar.Country
      ORDER BY ar.ArtistName
    `, [`%${req.params.country}%`]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET songs by title search
app.get('/api/songs/title/:title', async (req, res) => {
  try {
    const rows = await query(`
      SELECT s.SongID, s.Title,
             ROUND(s.Duration/60,2)          AS Duration_Min,
             IFNULL(a.AlbumName,'Single')    AS Album,
             IFNULL(ar.ArtistName,'Unknown') AS Artist,
             a.ReleaseYear
      FROM Song s
      LEFT JOIN Album a   ON s.AlbumID  = a.AlbumID
      LEFT JOIN Artist ar ON a.ArtistID = ar.ArtistID
      WHERE s.Title LIKE ?
      ORDER BY s.Title
    `, [`%${req.params.title}%`]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET user subscription + payment details
app.get('/api/user-subscription/:userId', async (req, res) => {
  try {
    const rows = await query(`
      SELECT u.Name, u.Email, u.JoiningDate,
             sub.PlanType, sub.StartDate, sub.EndDate, sub.Status AS SubStatus,
             p.Amount, p.PaymentMethod, p.PaymentDate, p.Status AS PayStatus
      FROM User u
      JOIN Subscription sub ON u.UserID           = sub.UserID
      LEFT JOIN Payment p   ON sub.SubscriptionID = p.SubscriptionID
      WHERE u.UserID = ?
      ORDER BY p.PaymentDate DESC
    `, [req.params.userId]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET playlists by user
app.get('/api/playlists/user/:userId', async (req, res) => {
  try {
    const rows = await query(`
      SELECT p.PlaylistID, p.PlaylistName, p.CreatedDate,
             COUNT(ps.SongID) AS SongCount
      FROM Playlist p
      LEFT JOIN Playlist_Song ps ON p.PlaylistID = ps.PlaylistID
      WHERE p.UserID = ?
      GROUP BY p.PlaylistID, p.PlaylistName, p.CreatedDate
      ORDER BY p.CreatedDate DESC
    `, [req.params.userId]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET songs in a playlist
app.get('/api/playlist-songs/:playlistId', async (req, res) => {
  try {
    const rows = await query(`
      SELECT s.Title,
             ROUND(s.Duration/60,2)          AS Duration_Min,
             IFNULL(ar.ArtistName,'Unknown') AS Artist,
             IFNULL(a.AlbumName,'Single')    AS Album,
             ps.AddedOn
      FROM Playlist_Song ps
      JOIN Song s         ON ps.SongID  = s.SongID
      LEFT JOIN Album a   ON s.AlbumID  = a.AlbumID
      LEFT JOIN Artist ar ON a.ArtistID = ar.ArtistID
      WHERE ps.PlaylistID = ?
      ORDER BY ps.AddedOn
    `, [req.params.playlistId]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET users by subscription plan
app.get('/api/users/plan/:plan', async (req, res) => {
  try {
    const rows = await query(`
      SELECT u.UserID, u.Name, u.Email, u.JoiningDate,
             sub.PlanType, sub.Status, sub.StartDate, sub.EndDate
      FROM User u
      JOIN Subscription sub ON u.UserID = sub.UserID
      WHERE sub.PlanType = ? AND sub.Status = 'Active'
      ORDER BY u.Name
    `, [req.params.plan]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET albums by release year
app.get('/api/albums/year/:year', async (req, res) => {
  try {
    const rows = await query(`
      SELECT a.AlbumID, a.AlbumName, a.ReleaseYear,
             ar.ArtistName, ar.Country,
             COUNT(s.SongID) AS TotalSongs
      FROM Album a
      JOIN Artist ar ON a.ArtistID = ar.ArtistID
      LEFT JOIN Song s ON a.AlbumID = s.AlbumID
      WHERE a.ReleaseYear = ?
      GROUP BY a.AlbumID, a.AlbumName, a.ReleaseYear, ar.ArtistName, ar.Country
      ORDER BY ar.ArtistName
    `, [req.params.year]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET failed payments
app.get('/api/failed-payments', async (req, res) => {
  try {
    const rows = await query(`
      SELECT u.Name, u.Email, sub.PlanType,
             p.Amount, p.PaymentDate, p.PaymentMethod, p.Status
      FROM Payment p
      JOIN Subscription sub ON p.SubscriptionID = sub.SubscriptionID
      JOIN User u           ON sub.UserID        = u.UserID
      WHERE p.Status = 'Failed'
      ORDER BY p.PaymentDate DESC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET songs not in any playlist
app.get('/api/no-playlist-songs', async (req, res) => {
  try {
    const rows = await query(`
      SELECT s.SongID, s.Title,
             ROUND(s.Duration/60,2)          AS Duration_Min,
             IFNULL(ar.ArtistName,'Unknown') AS Artist
      FROM Song s
      LEFT JOIN Album a   ON s.AlbumID  = a.AlbumID
      LEFT JOIN Artist ar ON a.ArtistID = ar.ArtistID
      WHERE s.SongID NOT IN (SELECT DISTINCT SongID FROM Playlist_Song)
      ORDER BY s.Title
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET active subscriptions
app.get('/api/active-subs', async (req, res) => {
  try {
    const rows = await query(`
      SELECT u.Name, u.Email, sub.PlanType,
             sub.StartDate, sub.EndDate,
             DATEDIFF(sub.EndDate, CURDATE()) AS DaysRemaining
      FROM Subscription sub
      JOIN User u ON sub.UserID = u.UserID
      WHERE sub.Status = 'Active' AND sub.EndDate IS NOT NULL
      ORDER BY DaysRemaining ASC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET playlists with song count
app.get('/api/playlists', async (req, res) => {
  try {
    const rows = await query(`
      SELECT p.PlaylistName, u.Name AS Owner,
             COUNT(ps.SongID) AS SongCount,
             p.CreatedDate
      FROM Playlist p
      JOIN User u ON p.UserID = u.UserID
      LEFT JOIN Playlist_Song ps ON p.PlaylistID = ps.PlaylistID
      GROUP BY p.PlaylistID, p.PlaylistName, u.Name, p.CreatedDate
      ORDER BY SongCount DESC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET songs by genre name
app.get('/api/songs/genre/:genre', async (req, res) => {
  try {
    const rows = await query(`
      SELECT s.Title,
             ROUND(s.Duration/60,2)          AS Duration_Min,
             IFNULL(ar.ArtistName,'Unknown') AS Artist,
             IFNULL(a.AlbumName,'Single')    AS Album
      FROM Song s
      JOIN Song_Genre sg ON s.SongID   = sg.SongID
      JOIN Genre g       ON sg.GenreID = g.GenreID
      LEFT JOIN Album a   ON s.AlbumID  = a.AlbumID
      LEFT JOIN Artist ar ON a.ArtistID = ar.ArtistID
      WHERE g.GenreName = ?
      ORDER BY s.Title
    `, [req.params.genre]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
// AGGREGATE ROUTES
// ══════════════════════════════════════════════════════════
app.get('/api/agg/payment-stats', async (req, res) => {
  try {
    const rows = await query(`SELECT COUNT(*) AS TotalPayments, SUM(Amount) AS TotalRevenue, AVG(Amount) AS AvgPayment, MAX(Amount) AS MaxPayment, MIN(Amount) AS MinPayment FROM Payment WHERE Status='Success'`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/agg/subs-per-plan', async (req, res) => {
  try {
    const rows = await query(`SELECT PlanType, COUNT(*) AS TotalUsers, SUM(CASE WHEN Status='Active' THEN 1 ELSE 0 END) AS ActiveUsers, SUM(CASE WHEN Status='Expired' THEN 1 ELSE 0 END) AS ExpiredUsers FROM Subscription GROUP BY PlanType`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/agg/avg-duration', async (req, res) => {
  try {
    const rows = await query(`SELECT PlanType, COUNT(*) AS Total, ROUND(AVG(DATEDIFF(IFNULL(EndDate,CURDATE()), StartDate)),1) AS AvgDays FROM Subscription GROUP BY PlanType`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/agg/big-playlists', async (req, res) => {
  try {
    const rows = await query(`SELECT p.PlaylistName, u.Name AS Owner, COUNT(ps.SongID) AS Songs FROM Playlist p JOIN User u ON p.UserID=u.UserID JOIN Playlist_Song ps ON p.PlaylistID=ps.PlaylistID GROUP BY p.PlaylistID, p.PlaylistName, u.Name HAVING Songs >= 5 ORDER BY Songs DESC`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/agg/songs-per-artist', async (req, res) => {
  try {
    const rows = await query(`SELECT ar.ArtistName, ar.Country, COUNT(s.SongID) AS TotalSongs FROM Artist ar JOIN Album a ON ar.ArtistID=a.ArtistID JOIN Song s ON a.AlbumID=s.AlbumID GROUP BY ar.ArtistID, ar.ArtistName, ar.Country ORDER BY TotalSongs DESC`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/agg/revenue-by-method', async (req, res) => {
  try {
    const rows = await query(`SELECT PaymentMethod, COUNT(*) AS Transactions, SUM(Amount) AS TotalRevenue, AVG(Amount) AS AvgAmount FROM Payment WHERE Status='Success' GROUP BY PaymentMethod ORDER BY TotalRevenue DESC`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
// SUBQUERY ROUTES
// ══════════════════════════════════════════════════════════
app.get('/api/sub/premium-users-in', async (req, res) => {
  try {
    const rows = await query(`SELECT Name, Email, JoiningDate FROM User WHERE UserID IN (SELECT UserID FROM Subscription WHERE PlanType='Premium' AND Status='Active') ORDER BY Name`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/sub/songs-not-in-playlist', async (req, res) => {
  try {
    const rows = await query(`SELECT s.SongID, s.Title, ROUND(s.Duration/60,2) AS Duration_Min, IFNULL(ar.ArtistName,'Unknown') AS Artist FROM Song s LEFT JOIN Album a ON s.AlbumID=a.AlbumID LEFT JOIN Artist ar ON a.ArtistID=ar.ArtistID WHERE s.SongID NOT IN (SELECT DISTINCT SongID FROM Playlist_Song) ORDER BY s.Title`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/sub/above-avg-duration', async (req, res) => {
  try {
    const rows = await query(`SELECT Title, Duration, ROUND(Duration/60,2) AS Minutes, IFNULL(ar.ArtistName,'Unknown') AS Artist FROM Song s LEFT JOIN Album a ON s.AlbumID=a.AlbumID LEFT JOIN Artist ar ON a.ArtistID=ar.ArtistID WHERE Duration > (SELECT AVG(Duration) FROM Song) ORDER BY Duration DESC`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/sub/users-failed-payment', async (req, res) => {
  try {
    const rows = await query(`SELECT u.Name, u.Email FROM User u WHERE EXISTS (SELECT 1 FROM Subscription sub JOIN Payment p ON sub.SubscriptionID=p.SubscriptionID WHERE sub.UserID=u.UserID AND p.Status='Failed')`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/sub/top-artists-subquery', async (req, res) => {
  try {
    const rows = await query(`SELECT ArtistName, TotalSongs FROM (SELECT ar.ArtistName, COUNT(s.SongID) AS TotalSongs FROM Artist ar JOIN Album a ON ar.ArtistID=a.ArtistID JOIN Song s ON a.AlbumID=s.AlbumID GROUP BY ar.ArtistID, ar.ArtistName) AS t ORDER BY TotalSongs DESC LIMIT 5`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/sub/max-payment-per-plan', async (req, res) => {
  try {
    const rows = await query(`SELECT sub.PlanType, p.Amount, p.PaymentDate, p.PaymentMethod FROM Payment p JOIN Subscription sub ON p.SubscriptionID=sub.SubscriptionID WHERE p.Amount = (SELECT MAX(p2.Amount) FROM Payment p2 JOIN Subscription s2 ON p2.SubscriptionID=s2.SubscriptionID WHERE s2.PlanType=sub.PlanType)`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
// ADVANCED ROUTES
// ══════════════════════════════════════════════════════════
app.get('/api/adv/cumulative-revenue', async (req, res) => {
  try {
    const rows = await query(`SELECT PaymentDate, Amount, SUM(Amount) OVER (ORDER BY PaymentDate) AS CumulativeRevenue FROM Payment WHERE Status='Success' ORDER BY PaymentDate`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/adv/multi-genre', async (req, res) => {
  try {
    const rows = await query(`SELECT s.Title, IFNULL(ar.ArtistName,'Unknown') AS Artist FROM Song s LEFT JOIN Album a ON s.AlbumID=a.AlbumID LEFT JOIN Artist ar ON a.ArtistID=ar.ArtistID WHERE s.SongID IN (SELECT sg.SongID FROM Song_Genre sg JOIN Genre g ON sg.GenreID=g.GenreID WHERE g.GenreName='Pop') AND s.SongID IN (SELECT sg.SongID FROM Song_Genre sg JOIN Genre g ON sg.GenreID=g.GenreID WHERE g.GenreName='Electronic')`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/adv/users-no-history', async (req, res) => {
  try {
    const rows = await query(`SELECT u.Name, u.Email, u.JoiningDate FROM User u LEFT JOIN ListeningHistory lh ON u.UserID=lh.UserID WHERE lh.HistoryID IS NULL ORDER BY u.Name`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/adv/user-classification', async (req, res) => {
  try {
    const rows = await query(`SELECT u.Name, COUNT(lh.HistoryID) AS Plays, CASE WHEN COUNT(lh.HistoryID)>=10 THEN 'Heavy' WHEN COUNT(lh.HistoryID)>=5 THEN 'Moderate' WHEN COUNT(lh.HistoryID)>=1 THEN 'Light' ELSE 'Inactive' END AS ListenerType FROM User u LEFT JOIN ListeningHistory lh ON u.UserID=lh.UserID GROUP BY u.UserID, u.Name ORDER BY Plays DESC`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/adv/string-functions', async (req, res) => {
  try {
    const rows = await query(`SELECT Title, UPPER(Title) AS TitleUpper, LENGTH(Title) AS TitleLength, CONCAT(Title,' (',ROUND(Duration/60,1),' min)') AS Display, REPLACE(Title,' ','_') AS Slug FROM Song ORDER BY Title`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/adv/date-functions', async (req, res) => {
  try {
    const rows = await query(`SELECT Name, JoiningDate, YEAR(JoiningDate) AS JoinYear, MONTHNAME(JoiningDate) AS JoinMonth, DATEDIFF(CURDATE(),JoiningDate) AS DaysSinceJoining, DATE_FORMAT(JoiningDate,'%d %M %Y') AS Formatted FROM User ORDER BY JoiningDate`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
// DML ROUTES
// ══════════════════════════════════════════════════════════
app.get('/api/dml/expired-subs', async (req, res) => {
  try {
    await query(`UPDATE Subscription SET Status='Expired' WHERE EndDate < CURDATE() AND Status='Active'`);
    const rows = await query(`SELECT PlanType, Status, COUNT(*) AS Total FROM Subscription GROUP BY PlanType, Status ORDER BY PlanType, Status`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/dml/sub-status-summary', async (req, res) => {
  try {
    const rows = await query(`SELECT PlanType, Status, COUNT(*) AS Total FROM Subscription GROUP BY PlanType, Status ORDER BY PlanType, Status`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/dml/committed-payments', async (req, res) => {
  try {
    const rows = await query(`SELECT u.Name, sub.PlanType, p.Amount, p.PaymentMethod, p.PaymentDate FROM Payment p JOIN Subscription sub ON p.SubscriptionID=sub.SubscriptionID JOIN User u ON sub.UserID=u.UserID WHERE p.Status='Success' ORDER BY p.PaymentDate DESC LIMIT 50`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
// STATS ROUTES
// ══════════════════════════════════════════════════════════
app.get('/api/stats/overview', async (req, res) => {
  try {
    const tables = ['User','Subscription','Payment','Artist','Album','Genre','Song','Song_Genre','Playlist','Playlist_Song','ListeningHistory'];
    const results = await Promise.all(tables.map(t => query(`SELECT '${t}' AS TableName, COUNT(*) AS TotalRows FROM ${t}`)));
    res.json(results.map(r => r[0]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/stats/active-users', async (req, res) => {
  try {
    const rows = await query(`SELECT u.Name, u.Email, COUNT(DISTINCT lh.SongID) AS UniqueSongs, COUNT(lh.HistoryID) AS TotalPlays FROM User u JOIN ListeningHistory lh ON u.UserID=lh.UserID GROUP BY u.UserID, u.Name, u.Email ORDER BY TotalPlays DESC LIMIT 20`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/stats/albums-by-songs', async (req, res) => {
  try {
    const rows = await query(`SELECT a.AlbumName, ar.ArtistName, a.ReleaseYear, COUNT(s.SongID) AS TotalSongs FROM Album a JOIN Artist ar ON a.ArtistID=ar.ArtistID LEFT JOIN Song s ON a.AlbumID=s.AlbumID GROUP BY a.AlbumID, a.AlbumName, ar.ArtistName, a.ReleaseYear ORDER BY TotalSongs DESC`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/stats/artists-by-country', async (req, res) => {
  try {
    const rows = await query(`SELECT Country, COUNT(*) AS TotalArtists FROM Artist GROUP BY Country ORDER BY TotalArtists DESC`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/stats/users-per-month', async (req, res) => {
  try {
    const rows = await query(`SELECT YEAR(JoiningDate) AS Year, MONTHNAME(JoiningDate) AS Month, MONTH(JoiningDate) AS MonthNum, COUNT(*) AS NewUsers FROM User GROUP BY YEAR(JoiningDate), MONTH(JoiningDate), MONTHNAME(JoiningDate) ORDER BY Year, MonthNum`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// INNER JOIN: Songs + Album + Artist
app.get('/api/join/songs-album-artist', async (req, res) => {
  try {
    const rows = await query(`
      SELECT s.SongID, s.Title, ROUND(s.Duration/60,2) AS Duration_Min,
             a.AlbumName, a.ReleaseYear, ar.ArtistName, ar.Country
      FROM Song s
      INNER JOIN Album a   ON s.AlbumID  = a.AlbumID
      INNER JOIN Artist ar ON a.ArtistID = ar.ArtistID
      ORDER BY ar.ArtistName, a.ReleaseYear`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// LEFT JOIN: All songs including singles
app.get('/api/join/all-songs-left', async (req, res) => {
  try {
    const rows = await query(`
      SELECT s.SongID, s.Title, ROUND(s.Duration/60,2) AS Duration_Min,
             IFNULL(a.AlbumName,'No Album')    AS Album,
             IFNULL(ar.ArtistName,'Unknown')   AS Artist
      FROM Song s
      LEFT JOIN Album a   ON s.AlbumID  = a.AlbumID
      LEFT JOIN Artist ar ON a.ArtistID = ar.ArtistID
      ORDER BY s.Title`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// RIGHT JOIN: All artists even no songs
app.get('/api/join/artists-right', async (req, res) => {
  try {
    const rows = await query(`
      SELECT ar.ArtistName, ar.Country,
             IFNULL(a.AlbumName,'No Album') AS Album,
             IFNULL(s.Title,'No Songs')     AS Song
      FROM Song s
      RIGHT JOIN Album a   ON s.AlbumID  = a.AlbumID
      RIGHT JOIN Artist ar ON a.ArtistID = ar.ArtistID
      ORDER BY ar.ArtistName`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4-Table JOIN: User → Playlist → Song
app.get('/api/join/user-playlist-song', async (req, res) => {
  try {
    const rows = await query(`
      SELECT u.Name AS UserName, p.PlaylistName,
             s.Title AS SongTitle, ps.AddedOn
      FROM User u
      JOIN Playlist p       ON u.UserID     = p.UserID
      JOIN Playlist_Song ps ON p.PlaylistID = ps.PlaylistID
      JOIN Song s           ON ps.SongID    = s.SongID
      ORDER BY u.Name, p.PlaylistName
      LIMIT 100`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// JOIN + GROUP BY: Songs per genre
app.get('/api/join/genre-count', async (req, res) => {
  try {
    const rows = await query(`
      SELECT g.GenreName, COUNT(sg.SongID) AS TotalSongs
      FROM Genre g
      JOIN Song_Genre sg ON g.GenreID = sg.GenreID
      GROUP BY g.GenreID, g.GenreName
      ORDER BY TotalSongs DESC`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// JOIN + GROUP_CONCAT: Songs with genres
app.get('/api/join/songs-genres-concat', async (req, res) => {
  try {
    const rows = await query(`
      SELECT s.Title,
             IFNULL(ar.ArtistName,'Unknown') AS Artist,
             GROUP_CONCAT(g.GenreName ORDER BY g.GenreName SEPARATOR ', ') AS Genres
      FROM Song s
      JOIN Song_Genre sg  ON s.SongID   = sg.SongID
      JOIN Genre g        ON sg.GenreID = g.GenreID
      LEFT JOIN Album a   ON s.AlbumID  = a.AlbumID
      LEFT JOIN Artist ar ON a.ArtistID = ar.ArtistID
      GROUP BY s.SongID, s.Title, ar.ArtistName
      ORDER BY s.Title`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3-Table JOIN: User + Subscription + Payment
app.get('/api/join/user-sub-payment', async (req, res) => {
  try {
    const rows = await query(`
      SELECT u.Name, u.Email, sub.PlanType,
             p.Amount, p.PaymentMethod, p.PaymentDate, p.Status AS PayStatus
      FROM User u
      JOIN Subscription sub ON u.UserID           = sub.UserID
      JOIN Payment p        ON sub.SubscriptionID = p.SubscriptionID
      ORDER BY p.PaymentDate DESC
      LIMIT 100`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 5-Table JOIN: Full Listening History
app.get('/api/join/listening-history', async (req, res) => {
  try {
    const rows = await query(`
      SELECT u.Name AS UserName, s.Title AS SongTitle,
             IFNULL(ar.ArtistName,'Unknown') AS Artist,
             IFNULL(a.AlbumName,'Single')    AS Album,
             lh.PlayedAt
      FROM ListeningHistory lh
      JOIN User u         ON lh.UserID  = u.UserID
      JOIN Song s         ON lh.SongID  = s.SongID
      LEFT JOIN Album a   ON s.AlbumID  = a.AlbumID
      LEFT JOIN Artist ar ON a.ArtistID = ar.ArtistID
      ORDER BY lh.PlayedAt DESC
      LIMIT 100`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// INNER JOIN + WHERE: Songs filtered by artist country
app.get('/api/join/songs-by-country/:country', async (req, res) => {
  try {
    const rows = await query(`
      SELECT s.Title, ROUND(s.Duration/60,2) AS Duration_Min,
             ar.ArtistName, ar.Country, a.AlbumName, a.ReleaseYear
      FROM Song s
      INNER JOIN Album a   ON s.AlbumID  = a.AlbumID
      INNER JOIN Artist ar ON a.ArtistID = ar.ArtistID
      WHERE ar.Country LIKE ?
      ORDER BY ar.ArtistName, s.Title
    `, [`%${req.params.country}%`]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// JOIN + HAVING: Artists with more than N albums
app.get('/api/join/artist-albums/:min', async (req, res) => {
  try {
    const rows = await query(`
      SELECT ar.ArtistName, ar.Country,
             COUNT(a.AlbumID)  AS TotalAlbums,
             COUNT(s.SongID)   AS TotalSongs
      FROM Artist ar
      JOIN Album a ON ar.ArtistID = a.ArtistID
      LEFT JOIN Song s ON a.AlbumID = s.AlbumID
      GROUP BY ar.ArtistID, ar.ArtistName, ar.Country
      HAVING TotalAlbums >= ?
      ORDER BY TotalAlbums DESC
    `, [parseInt(req.params.min)]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/revenue/year/:year', async (req, res) => {
  try {
    const rows = await query(`
      SELECT MONTHNAME(PaymentDate) AS Month,
             MONTH(PaymentDate)     AS MonthNum,
             COUNT(*)               AS Transactions,
             SUM(Amount)            AS Revenue
      FROM Payment
      WHERE Status = 'Success' AND YEAR(PaymentDate) = ?
      GROUP BY MONTH(PaymentDate), MONTHNAME(PaymentDate)
      ORDER BY MonthNum
    `, [parseInt(req.params.year)]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/monthly-revenue/:year', async (req, res) => {
  try {
    const rows = await query(`
      SELECT MONTHNAME(PaymentDate) AS Month,
             MONTH(PaymentDate)     AS MonthNum,
             COUNT(*)               AS Transactions,
             SUM(Amount)            AS Revenue
      FROM Payment
      WHERE Status = 'Success' AND YEAR(PaymentDate) = ?
      GROUP BY MONTH(PaymentDate), MONTHNAME(PaymentDate)
      ORDER BY MonthNum
    `, [parseInt(req.params.year)]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
// MANAGE DATA — INSERT / UPDATE / DELETE ROUTES
// ══════════════════════════════════════════════════════════

app.post('/api/manage/add-user', async (req, res) => {
  try {
    const { name, email, password, date } = req.body;
    const joiningDate = date || new Date().toISOString().split('T')[0];
    const result = await query(
      `INSERT INTO User (Name, Email, Password, JoiningDate) VALUES (?, ?, ?, ?)`,
      [name, email, password, joiningDate]
    );
    res.json({ message: `User "${name}" added! UserID: ${result.insertId}` });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') res.status(400).json({ error: 'Email already exists.' });
    else res.status(500).json({ error: e.message });
  }
});

app.post('/api/manage/add-artist', async (req, res) => {
  try {
    const { name, country } = req.body;
    const result = await query(`INSERT INTO Artist (ArtistName, Country) VALUES (?, ?)`, [name, country || null]);
    res.json({ message: `Artist "${name}" added! ArtistID: ${result.insertId}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/manage/add-song', async (req, res) => {
  try {
    const { title, duration, albumId } = req.body;
    const result = await query(`INSERT INTO Song (Title, Duration, AlbumID) VALUES (?, ?, ?)`, [title, duration, albumId || null]);
    res.json({ message: `Song "${title}" added! SongID: ${result.insertId}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/manage/add-playlist', async (req, res) => {
  try {
    const { name, userId } = req.body;
    const result = await query(`INSERT INTO Playlist (PlaylistName, CreatedDate, UserID) VALUES (?, CURDATE(), ?)`, [name, userId]);
    res.json({ message: `Playlist "${name}" created! PlaylistID: ${result.insertId}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/manage/add-song-to-playlist', async (req, res) => {
  try {
    const { playlistId, songId } = req.body;
    const exists = await query(`SELECT 1 FROM Playlist_Song WHERE PlaylistID = ? AND SongID = ?`, [playlistId, songId]);
    if (exists.length > 0) { res.json({ message: 'Song already exists in this playlist.' }); return; }
    await query(`INSERT INTO Playlist_Song (PlaylistID, SongID) VALUES (?, ?)`, [playlistId, songId]);
    res.json({ message: `Song ${songId} added to Playlist ${playlistId}!` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/manage/log-play', async (req, res) => {
  try {
    const { userId, songId } = req.body;
    await query(`INSERT INTO ListeningHistory (UserID, SongID, PlayedAt) VALUES (?, ?, NOW())`, [userId, songId]);
    res.json({ message: `Play logged! User ${userId} played Song ${songId}.` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/manage/update-subscription', async (req, res) => {
  try {
    const { userId, plan } = req.body;
    const result = await query(`UPDATE Subscription SET PlanType = ? WHERE UserID = ? AND Status = 'Active'`, [plan, userId]);
    if (result.affectedRows === 0) res.json({ message: `No active subscription found for User ${userId}.` });
    else res.json({ message: `Subscription updated to "${plan}" for User ${userId}.` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/manage/update-artist', async (req, res) => {
  try {
    const { artistId, country } = req.body;
    const result = await query(`UPDATE Artist SET Country = ? WHERE ArtistID = ?`, [country, artistId]);
    if (result.affectedRows === 0) res.json({ message: `No artist found with ID ${artistId}.` });
    else res.json({ message: `Artist ${artistId} country updated to "${country}".` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/manage/delete-user/:id', async (req, res) => {
  try {
    const result = await query(`DELETE FROM User WHERE UserID = ?`, [req.params.id]);
    if (result.affectedRows === 0) res.json({ message: `No user found with ID ${req.params.id}.` });
    else res.json({ message: `User ${req.params.id} and all related data deleted (CASCADE).` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/manage/clear-history/:userId', async (req, res) => {
  try {
    const result = await query(`DELETE FROM ListeningHistory WHERE UserID = ?`, [req.params.userId]);
    res.json({ message: `Cleared ${result.affectedRows} history records for User ${req.params.userId}.` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── START SERVER ───────────────────────────────────────────
app.listen(3000, () => {
  console.log('🚀 Server running at http://localhost:3000');
});
