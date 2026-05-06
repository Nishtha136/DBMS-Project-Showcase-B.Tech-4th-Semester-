// main server entry point — sets up Express, middleware, sessions, and routes
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// parse form data submitted from HTML forms
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// serve static files (CSS, JS, images) from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// use EJS as the template engine for server-rendered pages
app.set('view engine', 'ejs');

// session config — keeps users logged in across requests
app.use(session({
  secret: 'hostel_secret_key_123',
  resave: false,
  saveUninitialized: true,
}));

// make the logged-in user available in every EJS template without passing it manually
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.role = req.session.role || null;
    next();
});

// mount route handlers under their respective paths
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');

app.use('/auth', authRoutes);
app.use('/student', studentRoutes);
app.use('/admin', adminRoutes);

// serve the landing page
app.get('/', (req, res) => {
  res.render('index');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
