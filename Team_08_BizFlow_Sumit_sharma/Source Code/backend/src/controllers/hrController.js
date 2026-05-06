import * as HRModel from "../models/hrModel.js";

export const getAllRoles = async (req, res) => {
  try {
    const data = await HRModel.getAllRoles();
    res.json(data);
  } catch (err) {
    console.log("getAllRoles ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllEmployees = async (req, res) => {
  try {
    const data = await HRModel.getAllEmployees();
    res.json(data);
  } catch (err) {
    console.log("getAllEmployees ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const data = await HRModel.getEmployeeById(req.params.id);
    if (!data) return res.status(404).json({ message: "Employee not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const { user_id, name, email, phone, designation, salary, join_date } = req.body;
    if (!name || !designation) {
      return res.status(400).json({ message: "name and designation are required" });
    }
    const employee_id = await HRModel.createEmployee(
      user_id, name, email, phone, designation, salary, join_date
    );
    res.status(201).json({ message: "Employee created successfully", employee_id });
  } catch (err) {
    console.log("createEmployee ERROR:", err.message);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { name, email, phone, designation, salary, role_id, join_date } = req.body;
    const result = await HRModel.updateEmployee(
      req.params.id, name, email, phone, designation, salary, role_id, join_date
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "Employee updated successfully" });
  } catch (err) {
    console.log("updateEmployee ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const result = await HRModel.deleteEmployee(req.params.id);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
