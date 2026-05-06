import * as ReportsModel from "../models/reportsModel.js";

export const getTopVendors = async (req, res) => {
  try {
    const data = await ReportsModel.getTopVendors();
    res.json({ query: "GROUP BY + HAVING — Vendors with total purchase > ₹10,000", data });
  } catch (err) {
    console.log("getTopVendors ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSalesRevenueByProduct = async (req, res) => {
  try {
    const data = await ReportsModel.getSalesRevenueByProduct();
    res.json({ query: "GROUP BY + Aggregate — Sales revenue per product", data });
  } catch (err) {
    console.log("getSalesRevenueByProduct ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getBelowAverageStock = async (req, res) => {
  try {
    const data = await ReportsModel.getBelowAverageStock();
    res.json({ query: "Subquery — Raw materials below average stock level", data });
  } catch (err) {
    console.log("getBelowAverageStock ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getEmployeesOnCompletedOrders = async (req, res) => {
  try {
    const data = await ReportsModel.getEmployeesOnCompletedOrders();
    res.json({ query: "Subquery with IN — Employees on completed production orders", data });
  } catch (err) {
    console.log("getEmployeesOnCompletedOrders ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMachineServiceStatus = async (req, res) => {
  try {
    const data = await ReportsModel.getMachineServiceStatus();
    res.json({ query: "Scalar Functions — DATEDIFF, UPPER, CHAR_LENGTH on machine service", data });
  } catch (err) {
    console.log("getMachineServiceStatus ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPaymentSummary = async (req, res) => {
  try {
    const data = await ReportsModel.getPaymentSummary();
    res.json({ query: "Aggregate + GROUP BY — Payment summary per invoice with balance due", data });
  } catch (err) {
    console.log("getPaymentSummary ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getProductionMaterialRequirements = async (req, res) => {
  try {
    const data = await ReportsModel.getProductionMaterialRequirements();
    res.json({ query: "Multi-table JOIN + GROUP BY — Raw material requirements per production order", data });
  } catch (err) {
    console.log("getProductionMaterialRequirements ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getProductsWithBOM = async (req, res) => {
  try {
    const data = await ReportsModel.getProductsWithBOM();
    res.json({ query: "Subquery with EXISTS — Products that have a BOM defined", data });
  } catch (err) {
    console.log("getProductsWithBOM ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFullSalesDetails = async (req, res) => {
  try {
    const data = await ReportsModel.getFullSalesDetails();
    res.json({ query: "5-table JOIN — Full sales order details with invoice and payment", data });
  } catch (err) {
    console.log("getFullSalesDetails ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSharedRawMaterials = async (req, res) => {
  try {
    const data = await ReportsModel.getSharedRawMaterials();
    res.json({ query: "HAVING + COUNT — Raw materials used across products in BOM", data });
  } catch (err) {
    console.log("getSharedRawMaterials ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};