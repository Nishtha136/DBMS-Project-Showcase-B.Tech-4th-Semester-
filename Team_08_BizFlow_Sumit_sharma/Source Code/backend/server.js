import "dotenv/config"
import express from "express";
import cors from "cors";
import db from "./src/config/db.js";

import authRoute      from "./src/routes/authRoutes.js";
import inventoryRoute from "./src/routes/inventoryRoutes.js";
import purchaseRoute from "./src/routes/purchaseRoutes.js";
import salesRoute from "./src/routes/salesRoute.js"; 
import productionRoute from "./src/routes/productionRoute.js";
import hrRoute from "./src/routes/hrRoutes.js";
import maintenanceRoute from "./src/routes/maintenanceRoutes.js";
import reportsRoute from "./src/routes/reportsRoutes.js";

const app = express();

app.use(cors()); 
app.use(express.json());

app.use("/api",           authRoute);
app.use("/api/inventory", inventoryRoute);
app.use("/api/purchase", purchaseRoute); 
app.use("/api/sales", salesRoute);
app.use("/api/production", productionRoute);
app.use("/api/hr", hrRoute);
app.use("/api/maintenance", maintenanceRoute);
app.use("/api/reports", reportsRoute);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {  
  console.log(`server started at port ${PORT}`);
});

db.execute("SELECT 1")
  .then(() => console.log("DB Connected ✅"))
  .catch((err) => console.log("DB Error ❌", err));