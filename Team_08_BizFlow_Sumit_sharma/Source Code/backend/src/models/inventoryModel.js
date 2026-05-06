import db from "../config/db.js";

// Raw Material 
export const getAllRawMaterials = async () => {
    const [rows] = await db.execute("SELECT * from raw_material");
    return rows; 
}; 

export const getRawMaterialById = async(id) => {
    const [rows] = await db.execute(
    "SELECT * FROM raw_material WHERE raw_material_id = ?", [id]
  );
  return rows[0];
}

export const createRawMaterial = async (name, unit, current_stock, reorder_level) => {
  const [result] = await db.execute(
    "INSERT INTO raw_material (name, unit, current_stock, reorder_level) VALUES (?, ?, ?, ?)",
    [name, unit, current_stock, reorder_level]
  );
  return result;
};

export const updateRawMaterial = async (id, name, unit, current_stock, reorder_level) => {
  const [result] = await db.execute(
    "UPDATE raw_material SET name=?, unit=?, current_stock=?, reorder_level=? WHERE raw_material_id=?",
    [name, unit, current_stock, reorder_level, id]
  );
  return result;
};

export const deleteRawMaterial = async (id) => {
  const [result] = await db.execute(
    "DELETE FROM raw_material WHERE raw_material_id = ?", [id]
  );
  return result;
};

// Product
export const getAllProducts = async () => {
  const [rows] = await db.execute("SELECT * FROM product");
  return rows;
};

export const getProductById = async (id) => {
  const [rows] = await db.execute(
    "SELECT * FROM product WHERE product_id = ?", [id]
  );
  return rows[0];
};

export const createProduct = async (name, sku, unit, selling_price, current_stock) => {
  const [result] = await db.execute(
    "INSERT INTO product (name, sku, unit, selling_price, current_stock) VALUES (?, ?, ?, ?, ?)",
    [name, sku, unit, selling_price, current_stock]
  );
  return result;
};

export const updateProduct = async (id, name, sku, unit, selling_price, current_stock) => {
  const [result] = await db.execute(
    "UPDATE product SET name=?, sku=?, unit=?, selling_price=?, current_stock=? WHERE product_id=?",
    [name, sku, unit, selling_price, current_stock, id]
  );
  return result;
};

export const deleteProduct = async (id) => {
  const [result] = await db.execute(
    "DELETE FROM product WHERE product_id = ?", [id]
  );
  return result;
};

// Low Stock
export const getLowStockItems = async () => {
  const [rows] = await db.execute(
    "SELECT * FROM raw_material WHERE current_stock <= reorder_level"
  );
  return rows;
};
