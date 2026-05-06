import * as PurchaseModel from "../models/purchaseModel.js"; 

export const getAllPOs = async (req, res) => {
    try {
        const data = await PurchaseModel.getAllPOs(); 
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

export const getPOById = async (req, res) => {
    try {
        const data = await PurchaseModel.getPOById(req.params.id);
        if (!data) return res.status(404).json({ message: "PO not found" });
        res.json(data);
    } catch (err) {
        res.status(500).json({message: "Server error"});
    }
}; 

export const createPO = async (req, res) => {
    try {
        const { party_id, po_number, order_date, items } = req.body; 

        if (!party_id || !po_number || !order_date || !items || items.length === 0) {
            return res.status(400).json({message:"party_id, po_number, order_date and items are required"}); 
        }
        
        const po_id = await PurchaseModel.createPO(party_id, po_number, order_date, items);
        res.status(201).json({message: "Purchase order created successfully", po_id}); 
    } catch (err) {
        console.log("getAllPOs ERROR:", err.message);
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({message: "PO number already exists"});
        }
        res.status(500).json({message: "Server error"});
    }
};

export const receiveGRN = async (req, res) => {
    try {
        const result = await PurchaseModel.receiveGRN(req.params.id);
        if (result.affectedRows === 0) {
            return res.status(400).json({message: "PO not found or already received"});
        }
        res.json({message: "GRN received. Stock updated successfully."});
    } catch (err) {
        res.status(500).json({message: "Server error"});
    }
};

export const updatePOStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ["pending", "approved", "received", "cancelled"];
        if (!allowed.includes(status)) {
            return res.status(400).json({ message: "Invalid status"});
        }
        await PurchaseModel.updatePOStatus(req.params.id, status); 
        res.json({ message: "PO status updated successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}; 