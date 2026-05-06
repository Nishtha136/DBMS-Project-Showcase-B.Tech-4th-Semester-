import express from "express";
import * as ProductionController from "../controllers/productionController.js";
import { verifyToken, authorizeRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

const ADMIN_MGR = ["Admin", "Manager"];
const ALL       = ["Admin", "Manager", "Store Manager", "Accountant", "Sales Executive"];

router.get  ("/",            verifyToken, authorizeRole(ALL),       ProductionController.getAllProductionOrders);
router.get  ("/:id",         verifyToken, authorizeRole(ALL),       ProductionController.getProductionOrderById);
router.post ("/",            verifyToken, authorizeRole(ADMIN_MGR), ProductionController.createProductionOrder);
router.patch("/:id/process", verifyToken, authorizeRole(ADMIN_MGR), ProductionController.processProductionOrder);
router.patch("/:id/status",  verifyToken, authorizeRole(ADMIN_MGR), ProductionController.updateProductionStatus);

export default router;