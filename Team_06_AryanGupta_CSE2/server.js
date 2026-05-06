const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");
const { authenticate } = require("./middleware/auth");

const patientRoutes = require("./routes/patients");
const doctorRoutes = require("./routes/doctors");
const appointmentRoutes = require("./routes/appointments");
const prescriptionRoutes = require("./routes/prescriptions");
const billRoutes = require("./routes/bills");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);
app.get("/api/health", (req, res) => res.json({ message: "Hospital Management API is running." }));


app.use("/api", authenticate);

app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/bills", billRoutes);

app.get("/api/health", (req, res) => {
  res.json({ message: "Hospital Management API is running." });
});

async function startServer() {
  try {
    await db.testConnection();
    console.log("Database connected successfully.");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    console.error("Check your DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME values.");
    process.exit(1);
  }
}

startServer();
