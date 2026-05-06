import db from "../config/db.js";

// Sales Order 
export const getAllSOs = async () => {
    const [rows] = await db.execute(`
    SELECT so.*, cp.client_po_number
    FROM sales_order so
    LEFT JOIN customer_po cp ON so.cust_po_id = cp.cust_po_id
    ORDER BY so.order_date DESC   
    `);
    return rows;
};

export const getSOById = async (so_id) => {
    const [so] = await db.execute(`
    SELECT so.*, cp.client_po_number
    FROM sales_order so 
    LEFT JOIN customer_po cp ON so.cust_po_id = cp.cust_po_id
    WHERE so.so_id = ? 
    `, [so_id]);

    if (so.length === 0) {
        return null;
    }

    const [items] = await db.execute(`
    SELECT si.*, p.name AS product_name, p.unit
    FROM so_items si
    JOIN product p ON si.product_id = p.product_id
    WHERE si.so_id = ? 
    `, [so_id]); 

    return {...so[0], items};
};

export const createSO = async(cust_po_id, so_number, order_date, items) => {
    const conn = await db.getConnection(); 
    try {
        await conn.beginTransaction();

        const total_amount = items.reduce((sum, i) => sum + i.quantity * i.price, 0);

        const [result] = await conn.execute(
            "INSERT INTO sales_order (cust_po_id, so_number, order_date, status, total_amount) VALUES (?,?,?, 'pending',?)",
            [cust_po_id || null, so_number, order_date, total_amount]
        );
        const so_id = result.insertId;

        for (const item of items) {
            await conn.execute(
                "INSERT INTO so_items (so_id, product_id, quantity, price) VALUES (?,?,?,?)",
                [so_id, item.product_id, item.quantity, item.price]
            );
        }

        await conn.commit();
        return so_id;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release(); 
    }
};

export const updateSOStatus = async (so_id, status) => {
    const [result] = await db.execute(
        "UPDATE sales_order SET status = ? WHERE so_id = ?",
        [status, so_id]
    );
    return result;
};

// Invoice 
export const createInvoice = async (so_id, invoice_number, invoice_date, tax_amount, total_amount) => {
    const [result] = await db.execute(
      "INSERT INTO invoice (so_id, invoice_number, invoice_date, tax_amount, total_amount, status) VALUES (?,?,?,?,?, 'unpaid')", 
      [so_id, invoice_number, invoice_date, tax_amount, total_amount]  
    );
    return result.insertId;
};

export const getInvoiceById = async (invoice_id) => {
    const [rows] = await db.execute(
        "SELECT * FROM invoice WHERE invoice_id = ?", [invoice_id]
    );
    return rows; 
};

export const getInvoiceBySO = async (so_id) => {
    const [rows] = await db.execute(
        "SELECT * FROM invoice WHERE so_id = ?", [so_id]
    ); 
    return rows;
};

// Payment 
export const addPayment = async (invoice_id, amount_paid, payment_date, payment_mode) => {
    const [result] = await db.execute(
        "INSERT INTO payment (invoice_id, amount_paid, payment_date, payment_mode) VALUES (?,?,?,?)", 
        [invoice_id, amount_paid, payment_date, payment_mode]
    );
    return result.insertId; 
};

export const getPaymentsByInvoice = async (invoice_id) => {
    const [rows] = await db.execute(
        "SELECT * FROM payment WHERE invoice_id = ?", [invoice_id]
    );
    return rows;
};

// Dispatch 
export const createDispatch = async (so_id, tracking_number, transport_name, dispatch_date) => {
  const [result] = await db.execute(
    "INSERT INTO dispatch (so_id, tracking_number, transport_name, dispatch_date, delivery_status) VALUES (?, ?, ?, ?, 'in_transit')",
    [so_id, tracking_number, transport_name, dispatch_date]
  );
  return result.insertId;
};

export const updateDeliveryStatus = async (dispatch_id, delivery_status) => {
  const [result] = await db.execute(
    "UPDATE dispatch SET delivery_status = ? WHERE dispatch_id = ?",
    [delivery_status, dispatch_id]
  );
  return result;
};