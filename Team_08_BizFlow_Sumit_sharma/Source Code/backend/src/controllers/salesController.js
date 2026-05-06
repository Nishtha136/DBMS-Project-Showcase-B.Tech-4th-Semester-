import * as SalesModel from "../models/salesModel.js";

// Sales Order 
export const getAllSOs = async (req, res) => {
    try {
        const data = await SalesModel.getAllSOs();
        res.json(data);
    } catch (err) {
        console.log("getAllSOs Error:", err.message);
        res.status(500).json({ message: "Server error"});
    }
}; 

export const getSOById = async (req, res) => {
    try{
        const data = await SalesModel.getSOById(req.params.id);  
        if (!data) return res.status(404).json({ message: "Sales order not found" }); 
        res.json(data);
    } catch (err) {
        console.log("getSOById error:", err.message); 
        res.status(500).json({message: "Server error"});
    }
};

export const createSO = async (req, res) => {
  try {
    const { cust_po_id, so_number, order_date, items } = req.body;
    if (!so_number || !order_date || !items || items.length === 0) {
      return res.status(400).json({ message: "so_number, order_date and items are required" });
    }
    const so_id = await SalesModel.createSO(cust_po_id, so_number, order_date, items);
    res.status(201).json({ message: "Sales order created successfully", so_id });
  } catch (err) {
    console.log("createSO ERROR:", err.message);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "SO number already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

export const updateSOStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "processing", "dispatched", "completed", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    await SalesModel.updateSOStatus(req.params.id, status);
    res.json({ message: "Sales order status updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Invoice
export const createInvoice = async (req, res) => {
  try {
    const { so_id, invoice_number, invoice_date, tax_amount, total_amount } = req.body;
    if (!so_id || !invoice_number || !invoice_date || !total_amount) {
      return res.status(400).json({ message: "so_id, invoice_number, invoice_date and total_amount are required" });
    }
    const invoice_id = await SalesModel.createInvoice(so_id, invoice_number, invoice_date, tax_amount || 0, total_amount);
    res.status(201).json({ message: "Invoice created successfully", invoice_id });
  } catch (err) {
    console.log("createInvoice ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getInvoiceBySO = async (req, res) => {
  try {
    const data = await SalesModel.getInvoiceBySO(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Payment 
export const addPayment = async (req, res) => {
  try {
    const { invoice_id, amount_paid, payment_date, payment_mode } = req.body;
    if (!invoice_id || !amount_paid || !payment_date || !payment_mode) {
      return res.status(400).json({ message: "invoice_id, amount_paid, payment_date and payment_mode are required" });
    }
    const payment_id = await SalesModel.addPayment(invoice_id, amount_paid, payment_date, payment_mode);
    res.status(201).json({ message: "Payment recorded successfully", payment_id });
  } catch (err) {
    console.log("addPayment ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPaymentsByInvoice = async (req, res) => {
  try {
    const data = await SalesModel.getPaymentsByInvoice(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Dispatch
export const createDispatch = async (req, res) => {
  try {
    const { so_id, tracking_number, transport_name, dispatch_date } = req.body;
    if (!so_id || !dispatch_date) {
      return res.status(400).json({ message: "so_id and dispatch_date are required" });
    }
    const dispatch_id = await SalesModel.createDispatch(so_id, tracking_number, transport_name, dispatch_date);
    res.status(201).json({ message: "Dispatch created. Sales order status updated to dispatched.", dispatch_id });
  } catch (err) {
    console.log("createDispatch ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateDeliveryStatus = async (req, res) => {
  try {
    const { delivery_status } = req.body;
    const allowed = ["pending", "in_transit", "delivered"];
    if (!allowed.includes(delivery_status)) {
      return res.status(400).json({ message: "Invalid delivery status" });
    }
    await SalesModel.updateDeliveryStatus(req.params.id, delivery_status);
    res.json({ message: "Delivery status updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
 