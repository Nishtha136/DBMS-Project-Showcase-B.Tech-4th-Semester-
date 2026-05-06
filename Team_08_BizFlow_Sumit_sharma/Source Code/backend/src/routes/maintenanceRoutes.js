import express from "express";
import * as MaintenanceController from "../controllers/maintenanceController.js";
import { verifyToken, authorizeRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

const ADMIN_MGR = ["Admin", "Manager"];
const ALL       = ["Admin", "Manager", "Store Manager", "Accountant", "Sales Executive"];

// Machine
router.get ("/machines",       verifyToken, authorizeRole(ALL),       MaintenanceController.getAllMachines);
router.get ("/machines/:id",   verifyToken, authorizeRole(ALL),       MaintenanceController.getMachineById);
router.post("/machines",       verifyToken, authorizeRole(ADMIN_MGR), MaintenanceController.createMachine);
router.put ("/machines/:id",   verifyToken, authorizeRole(ADMIN_MGR), MaintenanceController.updateMachine);

// Maintenance Log
router.get ("/machines/:id/logs", verifyToken, authorizeRole(ALL),       MaintenanceController.getLogsByMachine);
router.post("/logs",              verifyToken, authorizeRole(ADMIN_MGR), MaintenanceController.createMaintenanceLog);

export default router;