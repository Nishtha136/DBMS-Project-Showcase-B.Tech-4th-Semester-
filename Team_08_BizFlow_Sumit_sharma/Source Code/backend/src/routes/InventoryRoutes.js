import express from "express"; 
import * as InventoryController from "../controllers/inventoryController.js"; 
import { verifyToken, authorizeRole } from "../middlewares/authMiddleware.js";

const router = express.Router(); 

const ADMIN = ["Admin"]; 
const ADMIN_MGR = ["Admin", "Manager"]; 
const STORE_MGR = ["Admin", "Manager", "Store Manager", "Accountant", "Sales Executive"];
const ALL         = ["Admin", "Manager", "Store Manager", "Accountant", "Sales Executive"];

// Raw Material 
router.get ("/raw-materials", verifyToken, authorizeRole(ALL), InventoryController.getAllRawMaterials);
router.get ("/raw-materials/:id", verifyToken, authorizeRole(ALL), InventoryController.getRawMaterialById);
router.post ("/raw-materials", verifyToken, authorizeRole(STORE_MGR), InventoryController.createRawMaterial);
router.put ("/raw-materials/:id", verifyToken, authorizeRole(STORE_MGR), InventoryController.updateRawMaterial); 
router.delete("/raw-materials/:id", verifyToken, authorizeRole(ADMIN_MGR), InventoryController.deleteRawMaterial); 

// Product 
router.get("/products", verifyToken, authorizeRole(ALL), InventoryController.getAllProducts); 
router.get("/products/:id",verifyToken, authorizeRole(ALL), InventoryController.getProductById);
router.post("/products", verifyToken, authorizeRole(STORE_MGR), InventoryController.createProduct);
router.put("/products/:id", verifyToken, authorizeRole(STORE_MGR), InventoryController.updateProduct); 
router.delete("/products/:id", verifyToken, authorizeRole(ADMIN_MGR), InventoryController.deleteProduct); 

// Low Stock 
router.get("/low-stock", verifyToken, authorizeRole(STORE_MGR), InventoryController.getLowStock);

export default router; 
