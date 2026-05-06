# Hostel Room Allocation & Smart Swap System

This project is a comprehensive database management system demonstrating advanced SQL concepts as per academic evaluation rubrics. 

## Features
- **Student Module**: Registration, Room Allocation Request, Smart Swap Request.
- **Admin Module**: View Stats, Approve/Reject Allocations, Handle Swap Requests.
- **Advanced SQL Components**: Uses 3NF Normalized tables, JOINs, Subqueries, Views, Stored Procedures, Triggers, and Transactions.

## Prerequisites
- Node.js (v14+)
- **MySQL Workbench** (or any MySQL server running on your computer)

## Setup Instructions

### 1. Database Setup in MySQL Workbench
1. Open **MySQL Workbench** and connect to your local database connection.
2. Open the following scripts in order and execute them (Click the lightning bolt icon ⚡):
   - First: `db/schema.sql` (Creates tables and indexes)
   - Second: `db/advanced.sql` (Creates views, stored procedures, and triggers)
   - Third: `db/seed.sql` (Inserts sample data)

### 2. Configure Database Connection
If your MySQL root user does not have a blank password, open `db/index.js` (or create a `.env` file) and update the password:
```javascript
// db/index.js
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'YOUR_MYSQL_PASSWORD', // Enter your password here if you have one
  database: 'hostel_db',
  port: 3306
});
```

### 3. Run the Node.js Server
Open a terminal in this project folder and run:
```bash
npm install
npm start
```
The application will be running at `http://localhost:3000`.

## Testing Credentials
**Admin:**
- Email: `admin@hostel.edu`
- Password: `hashed_pwd_123`

**Students (from seed data):**
- Email: `john@student.edu` -> Password: `pwd1`
- Email: `william@student.edu` -> Password: `pwd4`

## Core SQL Requirements Delivered
- **ER Diagram**: `ER_Diagram.md`
- **Normalized Schema & DDL**: `db/schema.sql`
- **DML (Sample Data)**: `db/seed.sql`
- **DQL (Complex Queries)**: `db/queries.sql`
- **Procedures, Triggers, Views, Transactions**: `db/advanced.sql`
