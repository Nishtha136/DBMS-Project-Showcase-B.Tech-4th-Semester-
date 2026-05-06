import * as InventoryModel from "../models/inventoryModel.js";

// Raw Material 
export const getAllRawMaterials = async (req, res) => {
  try {
    const data = await InventoryModel.getAllRawMaterials();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getRawMaterialById = async (req, res) => {
    try {
        const data = await InventoryModel.getRawMaterialById(req.params.id);
        if (!data) return res.status(404).json({message: "Raw material not found"}); 
        res.json(data);
    } catch (err){
        res.status(500).json({ message: "Server error" });
    }
}

export const createRawMaterial = async(req, res) => {
    try {
        const { name, unit, current_stock, reorder_level } = req.body; 
        if ( !name || !unit ) return res.status(400).json({ message: "name and unit are required" });
        await InventoryModel.createRawMaterial(name, unit, current_stock ?? 0, reorder_level ?? 0);
        res.status(201).json({ message: "Raw material created successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

export const updateRawMaterial = async(req, res) => {
    try {
        const { name, unit, current_stock, reorder_level } = req.body; 
        const result = await InventoryModel.updateRawMaterial(req.params.id, name, unit, current_stock, reorder_level);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Raw material updated successfully" });
    } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteRawMaterial = async (req, res) => {
    try { 
        const result = await InventoryModel.deleteRawMaterial(req.params.id); 
        if (result.affectedRows === 0) return res.status(404).json({message: "Not found"}); 
        res.json({message: "Raw material was deleted successfully"});
    } catch (err) {
        res.status(500).json({message: "Server error"}); 
    }
}; 

// Product 
export const getAllProducts = async (req, res) => {
    try {
        const data = await InventoryModel.getAllProducts();
        res.json(data);
    } catch (err) {
        res.status(500).json({message: "Server error"}); 
    }
};

export const getProductById = async (req, res) => {
    try {
        const data = await InventoryModel.getProductById(req.params.id); 
        if (!data) return res.status(404).json({message: "Product not found"}); 
        res.json(data);
    } catch (err) {
        res.status(500).json({message: "Server error"}); 
    } 
};

export const createProduct = async (req, res) => {
    try {
        const { name, sku, unit, selling_price, current_stock } = req.body; 
        if (!name || !unit || !selling_price) {
            return res.status(400).json({message: "name, sku and selling_price are required"});
        } 
        await InventoryModel.createProduct(name, sku, unit, selling_price, current_stock ?? 0); 
        res.status(201).json({message: "Product created successfully"}); 
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({message: "SKU already exists"}); 
        } 
        res.status(500).json({message: "Server error"});
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { name, sku, unit, selling_price, current_stock } = req.body; 
        const result = await InventoryModel.updateProduct(req.params.id, name, sku, unit, selling_price, current_stock);
        if (result.affectedRows === 0) return res.status(404).json({message : "Not found"});
        res.json({message: "Product updated successfully"});
    } catch (err) {
        res.status(500).json({message: "Server error"});
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const result = await InventoryModel.deleteProduct(req.params.id);
        if (result.affectedRows === 0) return res.status(404).json({message: "Not found"}); 
        res.json({message: "Product deleted successfully"});
    } catch (err) {
        res.status(500).json({message: "Server error"});
    }
};

// Low Stock
export const getLowStock = async (req, res) => {
    try {
        const data = await InventoryModel.getLowStockItems(); 
        res.json(data);
    } catch (err) {
        res.status(500).json({message: "Server error"});
    }
};