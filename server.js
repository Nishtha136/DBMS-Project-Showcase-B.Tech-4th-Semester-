const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ─── DB CONNECTION ────────────────────────────────────────────────
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sqp_db'
});

db.connect((err) => {
    if (err) { console.error('DB connection failed:', err.stack); return; }
    console.log('✅ Connected to MySQL database.');
});

// ─── HELPER ───────────────────────────────────────────────────────
const query = (sql, params = []) =>
    new Promise((resolve, reject) =>
        db.query(sql, params, (err, results) => err ? reject(err) : resolve(results))
    );

// ═══════════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════════
app.get('/api/stats', async (req, res) => {
    try {
        const sql = `
            SELECT 
                (SELECT COUNT(*) FROM USERS)     AS total_users,
                (SELECT COUNT(*) FROM NOTES)     AS total_notes,
                (SELECT COUNT(*) FROM PURCHASES) AS total_purchases,
                (SELECT COALESCE(SUM(TotalEarnings),0) FROM SELLERS) AS total_earnings
        `;
        const [row] = await query(sql);
        res.json(row);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════
// CHARTS
// ═══════════════════════════════════════════════════════════════════
app.get('/api/subject-distribution', async (req, res) => {
    try {
        const sql = `
            SELECT S.SubjectName, COUNT(N.NoteID) AS note_count
            FROM SUBJECTS S
            JOIN NOTES N ON S.SubjectID = N.SubjectID
            GROUP BY S.SubjectID
            ORDER BY note_count DESC LIMIT 8
        `;
        res.json(await query(sql));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/payment-methods', async (req, res) => {
    try {
        const sql = `SELECT Method, COUNT(*) AS count FROM PAYMENTS GROUP BY Method`;
        res.json(await query(sql));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/university-distribution', async (req, res) => {
    try {
        const sql = `
            SELECT uni.UniversityName, COUNT(u.UserID) AS userCount
            FROM UNIVERSITIES uni
            LEFT JOIN USERS u ON uni.UniversityID = u.UniversityID
            GROUP BY uni.UniversityID ORDER BY userCount DESC LIMIT 8
        `;
        res.json(await query(sql));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════
// NOTES — full CRUD
// ═══════════════════════════════════════════════════════════════════
app.get('/api/notes', async (req, res) => {
    try {
        const { search, subject, limit = 50, offset = 0 } = req.query;
        let sql = `
            SELECT n.NoteID, n.Title, n.Price, n.Description,
                   u.Name AS SellerName, u.Email AS SellerEmail,
                   uni.UniversityName, s.SubjectName
            FROM NOTES n
            JOIN SELLERS sel ON n.UploaderID = sel.UserID
            JOIN USERS u ON sel.UserID = u.UserID
            JOIN UNIVERSITIES uni ON u.UniversityID = uni.UniversityID
            JOIN SUBJECTS s ON n.SubjectID = s.SubjectID
        `;
        const params = [];
        const conditions = [];
        if (search) { conditions.push(`(n.Title LIKE ? OR u.Name LIKE ?)`); params.push(`%${search}%`, `%${search}%`); }
        if (subject) { conditions.push(`s.SubjectName = ?`); params.push(subject); }
        if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
        sql += ` ORDER BY n.NoteID DESC LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));
        res.json(await query(sql, params));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/notes', async (req, res) => {
    try {
        const { Title, Price, Description, UploaderID, SubjectID } = req.body;
        if (!Title || !UploaderID || !SubjectID) return res.status(400).json({ error: 'Title, UploaderID and SubjectID are required.' });
        const result = await query(
            `INSERT INTO NOTES (Title, Price, Description, UploaderID, SubjectID, FileURL, UploadDate) VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
            [Title, Price || 0, Description || '', UploaderID, SubjectID, 'https://cdn.sqp.in/notes/pending.pdf']
        );
        res.json({ NoteID: result.insertId, message: 'Note created successfully.' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/notes/:id', async (req, res) => {
    try {
        const { Title, Price, Description, SubjectID } = req.body;
        await query(
            `UPDATE NOTES SET Title=?, Price=?, Description=?, SubjectID=? WHERE NoteID=?`,
            [Title, Price, Description, SubjectID, req.params.id]
        );
        res.json({ message: 'Note updated.' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/notes/:id', async (req, res) => {
    try {
        await query(`DELETE FROM NOTES WHERE NoteID = ?`, [req.params.id]);
        res.json({ message: 'Note deleted.' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════
// USERS — list + detail
// ═══════════════════════════════════════════════════════════════════
app.get('/api/users', async (req, res) => {
    try {
        const { search, limit = 50, offset = 0 } = req.query;
        let sql = `
            SELECT u.UserID, u.Name, u.Email, uni.UniversityName,
                   CASE WHEN s.UserID IS NOT NULL THEN 'Seller' ELSE 'Buyer' END AS Role
            FROM USERS u
            JOIN UNIVERSITIES uni ON u.UniversityID = uni.UniversityID
            LEFT JOIN SELLERS s ON u.UserID = s.UserID
        `;
        const params = [];
        if (search) { sql += ` WHERE u.Name LIKE ? OR u.Email LIKE ?`; params.push(`%${search}%`, `%${search}%`); }
        sql += ` ORDER BY u.UserID DESC LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));
        res.json(await query(sql, params));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        await query(`DELETE FROM USERS WHERE UserID = ?`, [req.params.id]);
        res.json({ message: 'User deleted.' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════
// PURCHASES — list recent
// ═══════════════════════════════════════════════════════════════════
app.get('/api/purchases', async (req, res) => {
    try {
        const sql = `
            SELECT p.PurchaseID, u.Name AS BuyerName, n.Title AS NoteTitle,
                   p.Amount, p.PaymentStatus,
                   pay.Method, COALESCE(pay.Status, p.PaymentStatus) AS Status
            FROM PURCHASES p
            JOIN BUYERS b ON p.BuyerID = b.UserID
            JOIN USERS u ON b.UserID = u.UserID
            JOIN NOTES n ON p.NoteID = n.NoteID
            LEFT JOIN PAYMENTS pay ON p.PurchaseID = pay.PurchaseID
            ORDER BY p.PurchaseID DESC LIMIT 100
        `;
        res.json(await query(sql));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════
// TOP SELLERS
// ═══════════════════════════════════════════════════════════════════
app.get('/api/top-sellers', async (req, res) => {
    try {
        const sql = `
            SELECT u.Name, uni.UniversityName, s.TotalEarnings, s.AverageRating
            FROM SELLERS s
            JOIN USERS u ON s.UserID = u.UserID
            JOIN UNIVERSITIES uni ON u.UniversityID = uni.UniversityID
            ORDER BY s.TotalEarnings DESC LIMIT 10
        `;
        res.json(await query(sql));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════
// SUBJECTS & UNIVERSITIES (for dropdowns)
// ═══════════════════════════════════════════════════════════════════
app.get('/api/subjects', async (req, res) => {
    try { res.json(await query(`SELECT SubjectID, SubjectName FROM SUBJECTS ORDER BY SubjectName`)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/universities', async (req, res) => {
    try { res.json(await query(`SELECT UniversityID, UniversityName FROM UNIVERSITIES ORDER BY UniversityName`)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── START ────────────────────────────────────────────────────────
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));