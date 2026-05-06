import db from "../config/db.js";

// Get all POs
export const getAllPOs = async () => {
  const [rows] = await db.execute(`
    SELECT po.*, p.company_name AS vendor_name
    FROM purchase_order po
    JOIN party p ON po.party_id = p.party_id
    ORDER BY po.order_date DESC
  `);
  return rows;
};

// Get single PO with its items
export const getPOById = async (po_id) => {
  const [po] = await db.execute(`
    SELECT po.*, p.company_name AS vendor_name
    FROM purchase_order po
    JOIN party p ON po.party_id = p.party_id
    WHERE po.po_id = ?
  `, [po_id]);

  if (po.length === 0) {
    return null;
  }

  const [items] = await db.execute(`
    SELECT pi.*, rm.name AS material_name, rm.unit
    FROM po_items pi
    JOIN raw_material rm ON pi.raw_material_id = rm.raw_material_id
    WHERE pi.po_id = ?
  `, [po_id]);

  return { ...po[0], items };
};

// Create PO with items
export const createPO = async (party_id, po_number, order_date, items) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const total_amount = items.reduce((sum, i) => sum + i.quantity * i.price, 0);

    const [result] = await conn.execute(
      "INSERT INTO purchase_order (party_id, po_number, order_date, status, total_amount) VALUES (?, ?, ?, 'pending', ?)",
      [party_id, po_number, order_date, total_amount]
    );
    const po_id = result.insertId;

    for (const item of items) {
      await conn.execute(
        "INSERT INTO po_items (po_id, raw_material_id, quantity, price) VALUES (?, ?, ?, ?)",
        [po_id, item.raw_material_id, item.quantity, item.price]
      );
    }

    await conn.commit();
    return po_id;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// GRN — mark PO as received (trigger fires and updates stock)
export const receiveGRN = async (po_id) => {
  const [result] = await db.execute(
    "UPDATE purchase_order SET status = 'received' WHERE po_id = ? AND status != 'received'",
    [po_id]
  );
  return result;
};

// Update PO status
export const updatePOStatus = async (po_id, status) => {
  const [result] = await db.execute(
    "UPDATE purchase_order SET status = ? WHERE po_id = ?",
    [status, po_id]
  );
  return result;
};