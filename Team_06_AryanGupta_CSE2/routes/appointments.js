const express = require("express");
const db = require("../db");

const router = express.Router();

//  Book Appointment
router.post("/", async (req, res) => {
  try {
    const {
      patient_id,
      doctor_id,
      appointment_date,
      appointment_time,
      status,
    } = req.body;

    const parsedPatientId = Number(patient_id);
    const parsedDoctorId = Number(doctor_id);

    // Validate input
    if (
      !parsedPatientId ||
      !parsedDoctorId ||
      !appointment_date ||
      !appointment_time
    ) {
      return res.status(400).json({
        error:
          "patient_id, doctor_id, appointment_date, and appointment_time are required.",
      });
    }

    // If a user is logged in, force their own patient ID when possible.
    const user = req.user || {};
    const appointmentPatientId = user.role === "user" && user.patient_id ? Number(user.patient_id) : parsedPatientId;

    const query = `
      INSERT INTO appointment 
      (patient_id, doctor_id, appointment_date, appointment_time, status)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      appointmentPatientId,
      parsedDoctorId,
      appointment_date,
      appointment_time,
      status || "Scheduled",
    ]);

    res.status(201).json({
      message: "Appointment booked successfully.",
      appointment_id: result.insertId,
    });
  } catch (error) {
    console.error("Error booking appointment:", error.message);

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        error: "Invalid patient_id or doctor_id. Please use existing records.",
      });
    }

    res.status(500).json({ error: "Failed to book appointment." });
  }
});


//  Get Appointments (with Patient + Doctor info)
router.get("/", async (req, res) => {
  try {
    const user = req.user || {};
    let query = `
      SELECT
        a.appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        p.patient_id,
        p.name AS patient_name,
        p.phone AS patient_phone,
        d.doctor_id,
        d.name AS doctor_name,
        d.specialization
      FROM appointment a
      JOIN patient p ON a.patient_id = p.patient_id
      JOIN doctor d ON a.doctor_id = d.doctor_id
    `;

    const params = [];
    if (user.role === "user" && user.patient_id) {
      query += " WHERE p.patient_id = ?";
      params.push(Number(user.patient_id));
    }

    query += " ORDER BY a.appointment_date DESC, a.appointment_time DESC";

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching appointments:", error.message);
    res.status(500).json({ error: "Failed to fetch appointments." });
  }
});

//  Update appointment
router.put("/:id", async (req, res) => {
  try {
    const user = req.user || {};
    if (user.role === "user") {
      return res.status(403).json({ error: "Users are not allowed to update appointments." });
    }

    const { id } = req.params;
    const {
      patient_id,
      doctor_id,
      appointment_date,
      appointment_time,
      status,
    } = req.body;

    if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
      return res.status(400).json({
        error:
          "patient_id, doctor_id, appointment_date, and appointment_time are required.",
      });
    }

    const query = `
      UPDATE appointment
      SET patient_id = ?, doctor_id = ?, appointment_date = ?, appointment_time = ?, status = ?
      WHERE appointment_id = ?
    `;

    const [result] = await db.execute(query, [
      Number(patient_id),
      Number(doctor_id),
      appointment_date,
      appointment_time,
      status || "Scheduled",
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Appointment not found." });
    }

    res.json({ message: "Appointment updated successfully." });
  } catch (error) {
    console.error("Error updating appointment:", error.message);
    res.status(500).json({ error: "Failed to update appointment." });
  }
});

//  Delete appointment
router.delete("/:id", async (req, res) => {
  try {
    const user = req.user || {};
    if (user.role === "user") {
      return res.status(403).json({ error: "Users are not allowed to delete appointments." });
    }

    const { id } = req.params;
    const [result] = await db.execute(
      "DELETE FROM appointment WHERE appointment_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Appointment not found." });
    }

    res.json({ message: "Appointment deleted successfully." });
  } catch (error) {
    console.error("Error deleting appointment:", error.message);
    res.status(500).json({ error: "Failed to delete appointment." });
  }
});

module.exports = router;