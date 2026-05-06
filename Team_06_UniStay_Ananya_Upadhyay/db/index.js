// mysql connection pool — shared across all route files
// uses environment variables for credentials, falls back to localhost defaults
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'abhinav2005',
  database: process.env.DB_NAME || 'hostel_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,  // queue requests if all connections are busy
  connectionLimit: 10,       // max 10 simultaneous connections
  queueLimit: 0              // no limit on how many requests can wait in queue
});

// expose a simple query() wrapper so routes don't need to manage connections directly
module.exports = {
  query: (text, params) => pool.execute(text, params),
  pool: pool
};
