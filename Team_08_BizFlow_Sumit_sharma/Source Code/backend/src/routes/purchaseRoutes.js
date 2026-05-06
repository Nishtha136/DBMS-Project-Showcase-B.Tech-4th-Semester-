import express from "express"; 
import * as PurchaseController from "../controllers/purchaseController.js"; 
import { verifyToken, authorizeRole } from "../middlewares/authMiddleware.js";

const router = express.Router(); 

const ADMIN_MGR = ["Admin", "Manager"];
const STORE_MGR = ["Admin", "Manager", "Store Manager"]; 
const ALL = ["Admin", "Manager", "Store Manager", "Accountant", "Sales Executive"]; 

router.get("/test", (req, res) => res.json({ message: "purchase route works" }));
router.get("/", verifyToken, authorizeRole(ALL), PurchaseController.getAllPOs); 
router.get("/:id", verifyToken, authorizeRole(ALL), PurchaseController.getPOById); 
router.post("/", verifyToken, authorizeRole(ADMIN_MGR), PurchaseController.createPO); 
router.patch("/:id/grn", verifyToken, authorizeRole(STORE_MGR), PurchaseController.receiveGRN); 
router.patch("/:id/status", verifyToken, authorizeRole(ADMIN_MGR), PurchaseController.updatePOStatus); 

export default router; 