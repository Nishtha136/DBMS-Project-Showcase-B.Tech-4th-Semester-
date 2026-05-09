<div align="center">

# 🧺 Laundry Buddy

### *Smart Laundry Management System for Hostels & Colleges*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Available-success?style=for-the-badge)](https://laundrybuddy.ayushmaanyadav.me/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Sequelize](https://img.shields.io/badge/Sequelize-ORM-52B0E7?logo=sequelize&logoColor=white)](https://sequelize.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

**No slips. No queues. No stress. Just clean clothes.**

[🌐 Live Project](https://laundrybuddy.ayushmaanyadav.me/) • [🗄️ Database Architecture](#️-database-architecture-dbms-highlights) • [🚀 Features](#-features) • [📦 Installation](#-installation)

</div>

## 📖 About The Project

**Laundry Buddy** is a full-stack DBMS application & Progressive Web App (PWA) designed to revolutionize laundry management in hostels, colleges, and residential facilities. It eliminates paper slips, reduces queues, and provides real-time tracking of laundry orders.

### 🌐 Live Deployment
**Live Link:** [https://laundrybuddy.ayushmaanyadav.me/](https://laundrybuddy.ayushmaanyadav.me/)

---

## 🗄️ Database Architecture (DBMS Highlights)

This project has been explicitly built to demonstrate advanced Relational Database Management concepts (RDBMS) for academic evaluation.

### 1. The Stack
* **Database Engine**: PostgreSQL
* **ORM**: Sequelize ORM (Provides SQL Injection protection, Object mapping, and Schema auto-generation)
* **Pooling**: Configured to handle concurrent queries efficiently.

### 2. Schema Normalization & Design
* **1NF, 2NF, 3NF**: The database is structured in 3NF to remove transitive dependencies (e.g., User details are not cloned into Orders, they are fetched via Foreign Key references).
* **Hybrid Approach**: Utilizing PostgreSQL's native `JSON` DataTypes for `Order Items` and `Tracking Timelines` to optimize read performance and prevent excessive costly `JOIN`s for read-only metadata.

### 3. Constraints & Triggers (Logical)
* **Primary & Foreign Keys**: Heavily relies on strict `PRIMARY KEY` and `FOREIGN KEY` references (`userId`, `orderId`) for referential integrity.
* **Cascading Deletes**: `ON DELETE CASCADE` is implemented. If a student deletes their account, all their orders, support tickets, and tracking data are seamlessly removed.
* **Data Validations**: Email formatting constraints and money Decimal storage constraints are enforced at the DBMS layer.

### 4. Indexing (B-Tree Data Structure)
To optimize querying across thousands of records, we implemented **B-Tree Indexes**:
* **Unique Indexes**: Implemented on `email` (`users` table) and `orderNumber` (`orders` table) for $O(\log n)$ lookup times.
* **Performance Indexes**: Applied to `userId` and `status` to make dashboard filtering blazing fast.
* **Composite Indexes**: Combined `['userId', 'createdAt']` for fetching historical data across date ranges. 
*(Why B-Tree? Because B-Trees support Range queries (`Between dates`) and Pattern matching (`LIKE`), unlike Hash indexes)*

### 5. Advanced SQL Implementation
* **Complex Joins**: E.g., The Admin Support Dashboard executes a 3-way `LEFT OUTER JOIN` between `ContactMessages`, `User` (The student), and `User` (The Admin) to fetch names for a ticket dialog.
* **Security Sub-Systems**: The `Users` table natively tracks `failedLoginAttempts`. After 5 failures, to prevent brute-force attacks, it locks the column `accountLockedUntil` restricting DB access via application-level procedures.

---

## ✨ Features

- **User Authentication**: Secure Sign-up, Login, and Password Reset (OTP verification, JWT caching).
- **Order Management**: Place orders, calculate prices, and manage laundry baskets.
- **Live Tracking**: Step-by-step real-time tracking of clothes timeline.
- **Support Tickets**: Integrated messaging system between admin and students.
- **Android Support**: Native Android wrapper generation available in the `frontend/downloads/` section.

---

## 🚀 Quick Start (Local Setup)

### 1. Clone the repository
```bash
git clone <your-repo-link>
cd Laundry-Buddy-Project
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create a .env file based on .env.example
# Setup your PostgreSQL database and add credentials to .env

# Start the server
npm run dev
```

### 3. Frontend Setup
Simply serve the `frontend` folder using any static server:
```bash
cd frontend
# Using Python
python -m http.server 8000
# Using Node/npx
npx serve
```
Visit `http://localhost:8000`

---
*Created for DBMS Project Showcase (Team 09)*
