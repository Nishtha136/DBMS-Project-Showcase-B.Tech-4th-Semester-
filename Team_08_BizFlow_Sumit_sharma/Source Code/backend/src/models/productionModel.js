import db from "../config/db.js";

export const getAllProductionOrders = async () => {
  const [rows] = await db.execute(`
    SELECT po.*, p.name AS product_name, e.name AS assigned_to
    FROM production_order po
    JOIN product p ON po.product_id = p.product_id
    LEFT JOIN employee e ON po.employee_id = e.employee_id
    ORDER BY po.production_id DESC
  `);
  return rows;
};

export const getProductionOrderById = async (production_id) => {
  const [rows] = await db.execute(`
    SELECT po.*, p.name AS product_name, e.name AS assigned_to
    FROM production_order po
    JOIN product p ON po.product_id = p.product_id
    LEFT JOIN employee e ON po.employee_id = e.employee_id
    WHERE po.production_id = ?
  `, [production_id]);
  return rows[0];
};

export const createProductionOrder = async (product_id, quantity, employee_id, start_date, so_item_id) => {
  const [result] = await db.execute(
    `INSERT INTO production_order 
     (product_id, quantity, employee_id, status, start_date, so_item_id) 
     VALUES (?, ?, ?, 'planned', ?, ?)`,
    [product_id, quantity, employee_id || null, start_date || null, so_item_id || null]
  );
  return result.insertId;
};

// Calls the stored procedure — deducts raw materials, updates stock, marks completed
export const processProductionOrder = async (production_id) => {
  await db.execute("CALL ProcessProductionOrder(?)", [production_id]);
};

export const updateProductionStatus = async (production_id, status) => {
  const [result] = await db.execute(
    "UPDATE production_order SET status = ? WHERE production_id = ?",
    [status, production_id]
  );
  return result;
};