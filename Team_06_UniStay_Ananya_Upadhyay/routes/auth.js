// handles registration and login for both students and admins
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');

// show the registration form
router.get('/register', (req, res) => res.render('register', { error: null }));

// handle new student registration
router.post('/register', async (req, res) => {
    const { name, gender, course, year, contact_number, email, password } = req.body;
    try {
        // hash the password before saving — never store plain text
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO Students (name, gender, course, year, contact_number, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, gender, course, year, contact_number, email, hashedPassword]
        );
        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        // most likely cause is a duplicate email address
        res.render('register', { error: 'Registration failed. Email might already exist.' });
    }
});

// show the login form (role can be pre-set via query param, e.g. /login?role=admin)
router.get('/login', (req, res) => res.render('login', { error: null, role: req.query.role }));

// handle login for both students and admins
router.post('/login', async (req, res) => {
    const { email, password, role } = req.body;
    try {
        if (role === 'admin') {
            // look up admin by email
            const [rows] = await db.query('SELECT * FROM Admins WHERE email = ?', [email]);
            if (rows.length > 0) {
                // support both plain-text passwords (seed data) and bcrypt hashes (production)
                if (password === rows[0].password || await bcrypt.compare(password, rows[0].password)) {
                    req.session.user = rows[0];
                    req.session.role = 'admin';
                    return res.redirect('/admin/dashboard');
                }
            }
        } else {
            // look up student by email
            const [rows] = await db.query('SELECT * FROM Students WHERE email = ?', [email]);
            if (rows.length > 0) {
                if (await bcrypt.compare(password, rows[0].password) || password === rows[0].password) { // password=pwd1 is for seed
                    req.session.user = rows[0];
                    req.session.role = 'student';
                    return res.redirect('/student/dashboard');
                }
            }
        }
        // if we reach here, credentials didn't match
        res.render('login', { error: 'Invalid credentials.' });
    } catch (err) {
        console.error(err);
        res.render('login', { error: 'Login error.' });
    }
});

// destroy session and send user back to home
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
