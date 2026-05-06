const express = require("express");
const db = require("../db");

const router = express.Router();

// Add Prescription
router.post("/", async (req, res) => {
  try {
    const { patient_id, doctor_id, diagnosis, prescription_date, medicines } = req.body;

    if (!patient_id || !doctor_id || !diagnosis || !prescription_date) {
      return res.status(400).json({
        error: "patient_id, doctor_id, diagnosis, and prescription_date are required.",
      });
    }

    const query = `
      INSERT INTO Prescription (patient_id, doctor_id, diagnosis, prescription_date)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [patient_id, doctor_id, diagnosis, prescription_date]);
    const prescription_id = result.insertId;

    // Add medicines if provided
    if (medicines && Array.isArray(medicines)) {
      for (const med of medicines) {
        const medQuery = `
          INSERT INTO Prescription_Medicine (prescription_id, medicine_id, quantity, dosage)
          VALUES (?, ?, ?, ?)
        `;
        await db.execute(medQuery, [prescription_id, med.medicine_id, med.quantity, med.dosage]);
      }
    }

    res.status(201).json({
      message: "Prescription added successfully.",
      prescription_id,
    });
  } catch (error) {
    console.error("Error adding prescription:", error.message);
    res.status(500).json({ error: "Failed to add prescription." });
  }
});

// Get Prescription with medicines (JOIN)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT p.prescription_id, p.patient_id, pat.name AS patient_name, p.doctor_id, d.name AS doctor_name,
             p.diagnosis, p.prescription_date, pm.medicine_id, m.medicine_name, pm.quantity, pm.dosage, m.price
      FROM Prescription p
      JOIN Patient pat ON p.patient_id = pat.patient_id
      JOIN Doctor d ON p.doctor_id = d.doctor_id
      LEFT JOIN Prescription_Medicine pm ON p.prescription_id = pm.prescription_id
      LEFT JOIN Medicine m ON pm.medicine_id = m.medicine_id
      WHERE p.prescription_id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Prescription not found." });
    }
    res.json(rows);
  } catch (error) {
    console.error("Error fetching prescription:", error.message);
    res.status(500).json({ error: "Failed to fetch prescription." });
  }
});

// Get all prescriptions with subquery for medicine count
router.get("/", async (req, res) => {
  try {
    const query = `
      SELECT p.*, pat.name AS patient_name, d.name AS doctor_name,
             (SELECT COUNT(*) FROM Prescription_Medicine pm WHERE pm.prescription_id = p.prescription_id) AS medicine_count
      FROM Prescription p
      JOIN Patient pat ON p.patient_id = pat.patient_id
      JOIN Doctor d ON p.doctor_id = d.doctor_id
      ORDER BY p.prescription_date DESC
    `;
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching prescriptions:", error.message);
    res.status(500).json({ error: "Failed to fetch prescriptions." });
  }
});

module.exports = router;
