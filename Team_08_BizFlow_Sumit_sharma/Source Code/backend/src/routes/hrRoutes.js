import express from "express";
import * as HRController from "../controllers/hrController.js";
import { verifyToken, authorizeRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

const ADMIN_MGR = ["Admin", "Manager"];
const ALL       = ["Admin", "Manager", "Store Manager", "Accountant", "Sales Executive"];

router.get   ("/roles", verifyToken, authorizeRole(ALL),       HRController.getAllRoles);
router.get   ("/",      verifyToken, authorizeRole(ALL),       HRController.getAllEmployees);
router.get   ("/:id",   verifyToken, authorizeRole(ALL),       HRController.getEmployeeById);
router.post  ("/",      verifyToken, authorizeRole(ADMIN_MGR), HRController.createEmployee);
router.put   ("/:id",   verifyToken, authorizeRole(ADMIN_MGR), HRController.updateEmployee);
router.delete("/:id",   verifyToken, authorizeRole(ADMIN_MGR), HRController.deleteEmployee);

export default router;