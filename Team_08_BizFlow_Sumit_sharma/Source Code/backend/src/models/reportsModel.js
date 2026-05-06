import db from "../config/db.js";

// 1. GROUP BY + HAVING — Vendors with total purchase > 10000
export const getTopVendors = async () => {
  const [rows] = await db.execute(`
    SELECT p.company_name, p.phone,
           COUNT(po.po_id)          AS total_orders,
           SUM(po.total_amount)     AS total_purchased
    FROM purchase_order po
    JOIN party p ON po.party_id = p.party_id
    GROUP BY p.party_id, p.company_name, p.phone
    HAVING SUM(po.total_amount) > 10000
    ORDER BY total_purchased DESC
  `);
  return rows;
};

// 2. GROUP BY + Aggregate Functions — Sales revenue per product
export const getSalesRevenueByProduct = async () => {
  const [rows] = await db.execute(`
    SELECT pr.name                        AS product,
           SUM(si.quantity)               AS total_qty_sold,
           SUM(si.quantity * si.price)    AS total_revenue,
           AVG(si.price)                  AS avg_selling_price,
           COUNT(DISTINCT si.so_id)       AS orders_count
    FROM so_items si
    JOIN product pr ON si.product_id = pr.product_id
    GROUP BY pr.product_id, pr.name
    ORDER BY total_revenue DESC
  `);
  return rows;
};

// 3. Subquery — Raw materials below average stock level
export const getBelowAverageStock = async () => {
  const [rows] = await db.execute(`
    SELECT name, unit, current_stock, reorder_level,
           (SELECT ROUND(AVG(current_stock), 2) FROM raw_material) AS avg_stock
    FROM raw_material
    WHERE current_stock < (
      SELECT AVG(current_stock) FROM raw_material
    )
    ORDER BY current_stock ASC
  `);
  return rows;
};

// 4. Subquery with IN — Employees on completed production orders
export const getEmployeesOnCompletedOrders = async () => {
  const [rows] = await db.execute(`
    SELECT e.employee_id, e.name, e.designation,
           COUNT(po.production_id) AS completed_orders
    FROM employee e
    JOIN production_order po ON e.employee_id = po.employee_id
    WHERE po.employee_id IN (
      SELECT employee_id FROM production_order
      WHERE status = 'completed' AND employee_id IS NOT NULL
    )
    GROUP BY e.employee_id, e.name, e.designation
    ORDER BY completed_orders DESC
  `);
  return rows;
};

// 5. Scalar Function — Days since last machine service
export const getMachineServiceStatus = async () => {
  const [rows] = await db.execute(`
    SELECT machine_id, name, location,
           last_service_date,
           next_service_date,
           DATEDIFF(CURDATE(), last_service_date)  AS days_since_service,
           DATEDIFF(next_service_date, CURDATE())  AS days_until_next_service,
           UPPER(name)                             AS name_upper,
           CHAR_LENGTH(name)                       AS name_length
    FROM machine
    WHERE last_service_date IS NOT NULL
    ORDER BY days_since_service DESC
  `);
  return rows;
};

// 6. Aggregate + GROUP BY — Payment summary per invoice
export const getPaymentSummary = async () => {
  const [rows] = await db.execute(`
    SELECT i.invoice_id, i.invoice_number,
           i.total_amount                  AS invoice_total,
           COUNT(p.payment_id)             AS payment_count,
           SUM(p.amount_paid)              AS total_paid,
           (i.total_amount - COALESCE(SUM(p.amount_paid), 0)) AS balance_due,
           MAX(p.payment_date)             AS last_payment_date,
           i.status                        AS invoice_status
    FROM invoice i
    LEFT JOIN payment p ON i.invoice_id = p.invoice_id
    GROUP BY i.invoice_id, i.invoice_number, i.total_amount, i.status
    ORDER BY balance_due DESC
  `);
  return rows;
};

// 7. Multi-table JOIN + GROUP BY — Raw material requirement per production order
export const getProductionMaterialRequirements = async () => {
  const [rows] = await db.execute(`
    SELECT po.production_id,
           pr.name                                      AS product_name,
           po.quantity                                  AS production_qty,
           po.status,
           COUNT(b.raw_material_id)                     AS materials_needed,
           SUM(b.quantity_required * po.quantity)       AS total_raw_units_needed
    FROM production_order po
    JOIN product pr ON po.product_id  = pr.product_id
    JOIN bom b      ON b.product_id   = pr.product_id
    GROUP BY po.production_id, pr.name, po.quantity, po.status
    ORDER BY po.production_id
  `);
  return rows;
};

// 8. Subquery with EXISTS — Products that have a BOM defined
export const getProductsWithBOM = async () => {
  const [rows] = await db.execute(`
    SELECT p.product_id, p.name, p.sku,
           p.selling_price, p.current_stock,
           (SELECT COUNT(*) FROM bom b WHERE b.product_id = p.product_id) AS bom_components
    FROM product p
    WHERE EXISTS (
      SELECT 1 FROM bom b WHERE b.product_id = p.product_id
    )
    ORDER BY bom_components DESC
  `);
  return rows;
};

// 9. Joins showcase — Full sales order details (5-table JOIN)
export const getFullSalesDetails = async () => {
  const [rows] = await db.execute(`
    SELECT so.so_number,
           so.order_date,
           so.status                        AS order_status,
           pr.name                          AS product_name,
           si.quantity,
           si.price,
           (si.quantity * si.price)         AS line_total,
           i.invoice_number,
           i.status                         AS invoice_status,
           COALESCE(SUM(p.amount_paid), 0)  AS amount_paid
    FROM sales_order so
    JOIN so_items si   ON so.so_id        = si.so_id
    JOIN product pr    ON si.product_id   = pr.product_id
    LEFT JOIN invoice i ON i.so_id        = so.so_id
    LEFT JOIN payment p ON p.invoice_id   = i.invoice_id
    GROUP BY so.so_id, so.so_number, so.order_date, so.status,
             pr.name, si.quantity, si.price,
             i.invoice_number, i.status
    ORDER BY so.order_date DESC
  `);
  return rows;
};

// 10. HAVING + COUNT — Raw materials used in more than 1 product (via BOM)
export const getSharedRawMaterials = async () => {
  const [rows] = await db.execute(`
    SELECT rm.name                  AS material_name,
           rm.unit,
           rm.current_stock,
           COUNT(b.product_id)      AS used_in_products,
           SUM(b.quantity_required) AS total_qty_required_across_bom
    FROM raw_material rm
    JOIN bom b ON rm.raw_material_id = b.raw_material_id
    GROUP BY rm.raw_material_id, rm.name, rm.unit, rm.current_stock
    HAVING COUNT(b.product_id) >= 1
    ORDER BY used_in_products DESC
  `);
  return rows;
};