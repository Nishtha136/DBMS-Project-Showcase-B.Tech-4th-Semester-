const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "hospital_secret";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@hospital.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const DEMO_USER_EMAIL = process.env.DEMO_USER_EMAIL || "user@hospital.com";
const DEMO_USER_PASSWORD = process.env.DEMO_USER_PASSWORD || "user123";

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "4h" });
}

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const [rows] = await db.execute("SELECT * FROM patient WHERE email = ?", [email]);

    if (rows.length > 0) {
      const patient = rows[0];
      const passwordMatches = await bcrypt.compare(password, patient.password || "");

      if (passwordMatches) {
        const token = createToken({ role: "user", email, name: patient.name || "Patient", patient_id: patient.patient_id });
        return res.json({ token, role: "user", name: patient.name || "Patient", patient_id: patient.patient_id });
      }
    }
  } catch (err) {
    console.error("User login query error:", err.message);
  }

  if (email === DEMO_USER_EMAIL && password === DEMO_USER_PASSWORD) {
    let patientId = null;
    let patientName = "Demo Patient";

    try {
      const [rows] = await db.execute("SELECT patient_id, name FROM patient ORDER BY patient_id LIMIT 1");
      if (rows.length > 0) {
        patientId = rows[0].patient_id;
        patientName = rows[0].name || patientName;
      }
    } catch (lookupErr) {
      console.error("Demo user patient lookup failed:", lookupErr.message);
    }

    const token = createToken({ role: "user", email, name: patientName, patient_id: patientId });
    return res.json({ token, role: "user", name: patientName, patient_id: patientId });
  }

  res.status(401).json({ error: "Invalid user credentials." });
});

router.post("/admin-login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = createToken({ role: "admin", email, name: "Administrator" });
    return res.json({ token, role: "admin", name: "Administrator" });
  }

  res.status(401).json({ error: "Invalid admin credentials." });
});

module.exports = router;
