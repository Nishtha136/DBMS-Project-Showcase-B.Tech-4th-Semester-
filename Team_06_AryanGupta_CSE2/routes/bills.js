const express = require("express");
const db = require("../db");

const router = express.Router();

// Generate Bill from Prescription
router.post("/from-prescription", async (req, res) => {
  try {
    const { prescription_id, bill_date } = req.body;

    if (!prescription_id || !bill_date) {
      return res.status(400).json({ error: "prescription_id and bill_date are required." });
    }

    await db.execute("CALL Generate_Bill_From_Prescription(?, ?)", [
      prescription_id,
      bill_date,
    ]);

    res.status(201).json({
      message: "Bill generated from prescription successfully.",
    });
  } catch (error) {
    console.error("FULL ERROR:", error);
    res.status(500).json({ error: "Failed to generate bill." });
  }
});

// Bill Summary
router.get("/summary", async (req, res) => {
  try {
    const query = `
      SELECT p.patient_id, p.name AS patient_name,
             COUNT(b.bill_id) AS total_bills,
             SUM(b.total_amount) AS total_amount_paid_or_due
      FROM Bill b
      JOIN Patient p ON b.patient_id = p.patient_id
      GROUP BY p.patient_id, p.name
      ORDER BY total_amount_paid_or_due DESC
    `;

    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error("FULL ERROR:", error);
    res.status(500).json({ error: "Failed to fetch bill summary." });
  }
});

// CREATE BILL  FIXED
router.post("/", async (req, res) => {
  try {
    let { patient_id, total_amount, payment_status } = req.body;

    // Convert types
    patient_id = Number(patient_id);
    total_amount = Number(total_amount);

    // Validation
    if (
      patient_id === undefined ||
      isNaN(patient_id) ||
      total_amount === undefined ||
      isNaN(total_amount) ||
      !payment_status
    ) {
      return res.status(400).json({ error: "Invalid or missing fields" });
    }

    // Insert with bill_date default set to today
    const [result] = await db.execute(
      `INSERT INTO Bill (patient_id, total_amount, payment_status, bill_date)
       VALUES (?, ?, ?, CURDATE())`,
      [patient_id, total_amount, payment_status]
    );

    // Fetch inserted bill
    const [rows] = await db.execute(
      `SELECT b.bill_id, b.patient_id, p.name AS patient_name, b.total_amount, b.payment_status, b.bill_date
       FROM Bill b
       JOIN Patient p ON b.patient_id = p.patient_id
       WHERE b.bill_id = ?`,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("FULL BILL ERROR:", error);
    res.status(500).json({
      error: "Failed to create bill.",
      details: error.message,
    });
  }
});

// GET ALL BILLS
router.get("/", async (req, res) => {
  try {
    const query = `
      SELECT b.bill_id,
             b.patient_id,
             p.name AS patient_name,
             b.total_amount,
             b.payment_status,
             b.bill_date
      FROM Bill b
      JOIN Patient p ON b.patient_id = p.patient_id
      ORDER BY b.bill_id DESC
    `;

    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error("FULL ERROR:", error);
    res.status(500).json({ error: "Failed to fetch bills." });
  }
});

// DOCTOR STATS
router.get("/doctor-stats", async (req, res) => {
  try {
    const query = `
      SELECT d.doctor_id, d.name AS doctor_name, COUNT(a.appointment_id) AS appointment_count
      FROM Doctor d
      LEFT JOIN Appointment a ON d.doctor_id = a.doctor_id
      WHERE a.appointment_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
      GROUP BY d.doctor_id, d.name
      HAVING COUNT(a.appointment_id) > (
        SELECT AVG(appointment_count) FROM (
          SELECT COUNT(appointment_id) AS appointment_count
          FROM Appointment
          WHERE appointment_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
          GROUP BY doctor_id
        ) AS sub
      )
      ORDER BY appointment_count DESC
    `;

    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error("FULL ERROR:", error);
    res.status(500).json({ error: "Failed to fetch doctor stats." });
  }
});

// GET SINGLE BILL
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(
      `SELECT b.bill_id,
              b.patient_id,
              p.name AS patient_name,
              b.total_amount,
              b.payment_status
       FROM Bill b
       JOIN Patient p ON b.patient_id = p.patient_id
       WHERE b.bill_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Bill not found." });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("FULL ERROR:", error);
    res.status(500).json({ error: "Failed to fetch bill." });
  }
});

module.exports = router;