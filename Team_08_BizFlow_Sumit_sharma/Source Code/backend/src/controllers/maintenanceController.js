import * as MaintenanceModel from "../models/maintenanceModel.js";

export const getAllMachines = async (req, res) => {
  try {
    const data = await MaintenanceModel.getAllMachines();
    res.json(data);
  } catch (err) {
    console.log("getAllMachines ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMachineById = async (req, res) => {
  try {
    const data = await MaintenanceModel.getMachineById(req.params.id);
    if (!data) return res.status(404).json({ message: "Machine not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const createMachine = async (req, res) => {
  try {
    const { name, location, last_service_date, next_service_date } = req.body;
    if (!name) return res.status(400).json({ message: "name is required" });
    const machine_id = await MaintenanceModel.createMachine(
      name, location, last_service_date, next_service_date
    );
    res.status(201).json({ message: "Machine created successfully", machine_id });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateMachine = async (req, res) => {
  try {
    const { name, location, last_service_date, next_service_date } = req.body;
    const result = await MaintenanceModel.updateMachine(
      req.params.id, name, location, last_service_date, next_service_date
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Machine not found" });
    res.json({ message: "Machine updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getLogsByMachine = async (req, res) => {
  try {
    const data = await MaintenanceModel.getLogsByMachine(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const createMaintenanceLog = async (req, res) => {
  try {
    const { machine_id, employee_id, description, cost, service_date } = req.body;
    if (!machine_id || !service_date) {
      return res.status(400).json({ message: "machine_id and service_date are required" });
    }
    const log_id = await MaintenanceModel.createMaintenanceLog(
      machine_id, employee_id, description, cost, service_date
    );
    res.status(201).json({ message: "Maintenance log created. Machine service date updated.", log_id });
  } catch (err) {
    console.log("createMaintenanceLog ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
