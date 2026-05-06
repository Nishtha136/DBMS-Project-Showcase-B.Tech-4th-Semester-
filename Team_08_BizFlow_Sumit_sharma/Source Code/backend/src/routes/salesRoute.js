import express from "express";
import * as SalesController from "../controllers/salesController.js";
import { verifyToken, authorizeRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

const ADMIN_MGR  = ["Admin", "Manager"];
const SALES      = ["Admin", "Manager", "Sales Executive"];
const ALL        = ["Admin", "Manager", "Store Manager", "Accountant", "Sales Executive"];

// Sales Order
router.get   ("/",                verifyToken, authorizeRole(ALL),      SalesController.getAllSOs);
router.get   ("/:id",             verifyToken, authorizeRole(ALL),      SalesController.getSOById);
router.post  ("/",                verifyToken, authorizeRole(SALES),    SalesController.createSO);
router.patch ("/:id/status",      verifyToken, authorizeRole(ADMIN_MGR),SalesController.updateSOStatus);

// Invoice
router.post  ("/invoice",         verifyToken, authorizeRole(ADMIN_MGR),SalesController.createInvoice);
router.get   ("/:id/invoice",     verifyToken, authorizeRole(ALL),      SalesController.getInvoiceBySO);

// Payment
router.post  ("/payment",         verifyToken, authorizeRole(ADMIN_MGR),SalesController.addPayment);
router.get   ("/invoice/:id/payments", verifyToken, authorizeRole(ALL), SalesController.getPaymentsByInvoice);

// Dispatch
router.post  ("/dispatch",        verifyToken, authorizeRole(ADMIN_MGR),SalesController.createDispatch);
router.patch ("/dispatch/:id",    verifyToken, authorizeRole(ADMIN_MGR),SalesController.updateDeliveryStatus);

export default router;