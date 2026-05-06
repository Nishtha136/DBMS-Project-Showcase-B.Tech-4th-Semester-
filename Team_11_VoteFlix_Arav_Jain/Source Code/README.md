# VoteFlix - Movie Award Voting System

VoteFlix is a full-stack web application designed for movie award voting. Users can browse nominations, view movie details, and cast their votes for their favorite films and artists. The project features a robust backend powered by Node.js and MySQL, with a dynamic and responsive frontend built using React.

## 🚀 Features

- **Nomination Browsing**: Explore various award categories and their nominees.
- **Dynamic Voting**: Real-time voting system with data persistence.
- **Admin Management**: Interface for managing movies, categories, and nominations.
- **Rich UI**: Interactive and responsive design for a premium user experience.
- **MySQL Integration**: Persistent storage for all voting and movie data.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Vanilla CSS
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Tooling**: ESLint, Concurrently (to run frontend and backend together)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MySQL Server](https://www.mysql.com/)

## ⚙️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd "VoteFlix Source Code"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   - Create a `.env` file in the root directory by copying `.env.example`:
     ```bash
     cp .env.example .env
     ```
   - Update the `.env` file with your MySQL credentials:
     ```env
     PORT=4000
     MYSQL_HOST=localhost
     MYSQL_PORT=3306
     MYSQL_USER=your_username
     MYSQL_PASSWORD=your_password
     MYSQL_DATABASE=movie_awards
     ```

4. **Database Setup**:
   - Ensure you have a MySQL database named `movie_awards` (or as specified in your `.env`).
   - (Optional) Import the database schema if provided in a `.sql` file.

## 🚀 Running the Application

You can run both the frontend and backend concurrently using a single command:

```bash
npm start
```

- **Frontend**: Accessible at `http://localhost:5173`
- **Backend API**: Accessible at `http://localhost:4000`

### Other Scripts

- `npm run dev`: Run only the Vite frontend development server.
- `npm run server`: Run only the Node.js backend server.
- `npm run build`: Build the frontend for production.

## 📁 Project Structure

```text
├── server/             # Backend source code
│   ├── config/         # Environment and app configuration
│   ├── db/             # Database connection and scripts
│   ├── routes/         # API endpoint definitions
│   ├── services/       # Business logic and DB queries
│   └── index.js        # Backend entry point
├── src/                # Frontend source code
│   ├── api/            # API client services
│   ├── assets/         # Images and static assets
│   ├── App.jsx         # Main React component (Router & Logic)
│   ├── main.jsx        # React entry point
│   └── index.css       # Global styles
├── public/             # Static files for the frontend
├── .env.example        # Template for environment variables
├── package.json        # Project dependencies and scripts
└── vite.config.js      # Vite configuration
```

## 📝 License

This project is for educational purposes as part of a DBMS coursework.
