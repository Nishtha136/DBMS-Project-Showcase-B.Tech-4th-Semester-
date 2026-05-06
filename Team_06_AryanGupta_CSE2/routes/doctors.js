const express = require("express");
const db = require("../db");

const router = express.Router();

// Add Doctor
router.post("/", async (req, res) => {
  try {
    console.log("POST /doctors called");
    console.log("req.user:", req.user);
    
    const user = req.user || {};
    if (user.role !== "admin") {
      console.log("User role is not admin. Role:", user.role);
      return res.status(403).json({ error: "Only admins can add doctors." });
    }

    const { name, specialization, phone, department_id } = req.body;
    console.log("Form data:", { name, specialization, phone, department_id });

    if (!name || !specialization || !phone) {
      console.log("Missing required fields");
      return res.status(400).json({ error: "name, specialization, and phone are required." });
    }

    const query = "INSERT INTO Doctor (name, specialization, phone, department_id) VALUES (?, ?, ?, ?)";
    console.log("Executing query:", query);
    
    const [result] = await db.execute(query, [name, specialization, phone, department_id || null]);
    console.log("Doctor inserted with ID:", result.insertId);

    res.status(201).json({
      message: "Doctor added successfully.",
      doctor_id: result.insertId,
    });
  } catch (error) {
    console.error("Error adding doctor:", error.message);
    console.error("Full error:", error);
    res.status(500).json({ error: "Failed to add doctor." });
  }
});

// Get Doctors
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM Doctor ORDER BY doctor_id DESC");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching doctors:", error.message);
    res.status(500).json({ error: "Failed to fetch doctors." });
  }
});

// Update Doctor
router.put("/:id", async (req, res) => {
  try {
    const user = req.user || {};
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can update doctors." });
    }

    const { id } = req.params;
    const { name, specialization, phone, department_id } = req.body;

    if (!name || !specialization || !phone) {
      return res.status(400).json({ error: "name, specialization, and phone are required." });
    }

    const query = "UPDATE Doctor SET name = ?, specialization = ?, phone = ?, department_id = ? WHERE doctor_id = ?";
    const [result] = await db.execute(query, [name, specialization, phone, department_id || null, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Doctor not found." });
    }

    res.json({ message: "Doctor updated successfully." });
  } catch (error) {
    console.error("Error updating doctor:", error.message);
    res.status(500).json({ error: "Failed to update doctor." });
  }
});

// Delete Doctor
router.delete("/:id", async (req, res) => {
  try {
    const user = req.user || {};
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can delete doctors." });
    }

    const { id } = req.params;
    const query = "DELETE FROM Doctor WHERE doctor_id = ?";
    const [result] = await db.execute(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Doctor not found." });
    }

    res.json({ message: "Doctor deleted successfully." });
  } catch (error) {
    console.error("Error deleting doctor:", error.message);
    res.status(500).json({ error: "Failed to delete doctor." });
  }
});

module.exports = router;
