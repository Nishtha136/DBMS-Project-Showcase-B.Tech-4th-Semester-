import * as ProductionModel from "../models/productionModel.js"; 

export const getAllProductionOrders = async (req, res) => {
  try {
    const data = await ProductionModel.getAllProductionOrders();
    res.json(data);
  } catch (err) {
    console.log("getAllProductionOrders ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getProductionOrderById = async (req, res) => {
  try {
    const data = await ProductionModel.getProductionOrderById(req.params.id);
    if (!data) return res.status(404).json({ message: "Production order not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const createProductionOrder = async (req, res) => {
  try {
    const { product_id, quantity, employee_id, start_date, so_item_id } = req.body;
    if (!product_id || !quantity) {
      return res.status(400).json({ message: "product_id and quantity are required" });
    }
    const production_id = await ProductionModel.createProductionOrder(
      product_id, quantity, employee_id, start_date, so_item_id
    );
    res.status(201).json({ message: "Production order created successfully", production_id });
  } catch (err) {
    console.log("createProductionOrder ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const processProductionOrder = async (req, res) => {
  try {
    await ProductionModel.processProductionOrder(req.params.id);
    res.json({ message: "Production order processed. Stock updated successfully." });
  } catch (err) {
    console.log("processProductionOrder ERROR:", err.message);
    // Return the stored procedure error message directly — useful for insufficient stock
    res.status(400).json({ message: err.message });
  }
};

export const updateProductionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["planned", "in_progress", "completed", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    await ProductionModel.updateProductionStatus(req.params.id, status);
    res.json({ message: "Production order status updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};