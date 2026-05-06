const express = require("express");
const db = require("../db");

const router = express.Router();


// ADD PATIENT
router.post("/", async (req, res) => {
  try {
    const { name, gender, phone, email } = req.body;

    if (!name || !gender || !phone || !email) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const password = "password123"; // default password for new patients
    const [result] = await db.execute(
      "INSERT INTO Patient (name, gender, phone, email, password) VALUES (?, ?, ?, ?, ?)",
      [name, gender, phone, email, password]
    );

    res.status(201).json({
      message: "Patient added",
      patient_id: result.insertId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Insert failed" });
  }
});


//  GET ALL PATIENTS
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM Patient ORDER BY patient_id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fetch failed" });
  }
});

//  UPDATE PATIENT
router.put("/:id", async (req, res) => {
  try {
    const user = req.user || {};
    const { id } = req.params;
    const { name, gender, phone, email } = req.body;

    if (user.role !== "admin" && Number(user.patient_id) !== Number(id)) {
      return res.status(403).json({ error: "Only admins or the patient themselves can update this record." });
    }

    if (!name || !gender || !phone || !email) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!name || !gender || !phone || !email) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const [result] = await db.execute(
      "UPDATE Patient SET name = ?, gender = ?, phone = ?, email = ? WHERE patient_id = ?",
      [name, gender, phone, email, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.json({ message: "Patient updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

//  DELETE PATIENT
router.delete("/:id", async (req, res) => {
  try {
    const user = req.user || {};
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can delete patients." });
    }

    const { id } = req.params;

    const [result] = await db.execute(
      "DELETE FROM Patient WHERE patient_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.json({ message: "Patient deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;