import db from "../config/db.js";

// Machine
export const getAllMachines = async () => {
  const [rows] = await db.execute(
    "SELECT * FROM machine ORDER BY machine_id"
  );
  return rows;
};

export const getMachineById = async (machine_id) => {
  const [rows] = await db.execute(
    "SELECT * FROM machine WHERE machine_id = ?", [machine_id]
  );
  return rows[0];
};

export const createMachine = async (name, location, last_service_date, next_service_date) => {
  const [result] = await db.execute(
    `INSERT INTO machine (name, location, last_service_date, next_service_date)
     VALUES (?, ?, ?, ?)`,
    [name, location, last_service_date || null, next_service_date || null]
  );
  return result.insertId;
};

export const updateMachine = async (machine_id, name, location, last_service_date, next_service_date) => {
  const [result] = await db.execute(
    `UPDATE machine SET name=?, location=?, last_service_date=?, next_service_date=?
     WHERE machine_id=?`,
    [name, location, last_service_date, next_service_date, machine_id]
  );
  return result;
};

// Maintenance Log 
export const getLogsByMachine = async (machine_id) => {
  const [rows] = await db.execute(`
    SELECT ml.*, e.name AS technician_name
    FROM maintenance_log ml
    LEFT JOIN employee e ON ml.employee_id = e.employee_id
    WHERE ml.machine_id = ?
    ORDER BY ml.service_date DESC
  `, [machine_id]);
  return rows;
};

export const createMaintenanceLog = async (machine_id, employee_id, description, cost, service_date) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // insert log
    const [result] = await conn.execute(
      `INSERT INTO maintenance_log (machine_id, employee_id, description, cost, service_date)
       VALUES (?, ?, ?, ?, ?)`,
      [machine_id, employee_id || null, description, cost || 0, service_date]
    );

    // update machine last_service_date
    await conn.execute(
      "UPDATE machine SET last_service_date = ? WHERE machine_id = ?",
      [service_date, machine_id]
    );

    await conn.commit();
    return result.insertId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
