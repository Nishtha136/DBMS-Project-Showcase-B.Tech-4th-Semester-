import express from "express";
import * as ReportsController from "../controllers/reportsController.js";
import { verifyToken, authorizeRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

const ALL = ["Admin", "Manager", "Store Manager", "Accountant", "Sales Executive"];

// Each endpoint demonstrates a specific SQL concept
router.get("/top-vendors",                verifyToken, authorizeRole(ALL), ReportsController.getTopVendors);
router.get("/sales-by-product",           verifyToken, authorizeRole(ALL), ReportsController.getSalesRevenueByProduct);
router.get("/below-average-stock",        verifyToken, authorizeRole(ALL), ReportsController.getBelowAverageStock);
router.get("/employees-completed-orders", verifyToken, authorizeRole(ALL), ReportsController.getEmployeesOnCompletedOrders);
router.get("/machine-service-status",     verifyToken, authorizeRole(ALL), ReportsController.getMachineServiceStatus);
router.get("/payment-summary",            verifyToken, authorizeRole(ALL), ReportsController.getPaymentSummary);
router.get("/production-requirements",    verifyToken, authorizeRole(ALL), ReportsController.getProductionMaterialRequirements);
router.get("/products-with-bom",          verifyToken, authorizeRole(ALL), ReportsController.getProductsWithBOM);
router.get("/full-sales-details",         verifyToken, authorizeRole(ALL), ReportsController.getFullSalesDetails);
router.get("/shared-raw-materials",       verifyToken, authorizeRole(ALL), ReportsController.getSharedRawMaterials);

export default router;