import db from "../config/db.js";

export const getAllRoles = async () => {
  const [rows] = await db.execute(`
    SELECT role_id, role_name FROM role ORDER BY role_id
  `);
  return rows;
};

export const getAllEmployees = async () => {
  const [rows] = await db.execute(`
    SELECT e.*, u.user_name, u.email AS user_email, u.role_id, r.role_name
    FROM employee e
    LEFT JOIN user u ON e.user_id = u.user_id
    LEFT JOIN role r ON u.role_id = r.role_id
    ORDER BY e.employee_id
  `);
  return rows;
};

export const getEmployeeById = async (employee_id) => {
  const [rows] = await db.execute(`
    SELECT e.*, u.user_name, u.email AS user_email, u.role_id, r.role_name
    FROM employee e
    LEFT JOIN user u ON e.user_id = u.user_id
    LEFT JOIN role r ON u.role_id = r.role_id
    WHERE e.employee_id = ?
  `, [employee_id]);
  return rows[0];
};

export const createEmployee = async (user_id, name, email, phone, designation, salary, join_date) => {
  const [result] = await db.execute(
    `INSERT INTO employee (user_id, name, email, phone, designation, salary, join_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [user_id || null, name, email, phone, designation, salary, join_date]
  );
  return result.insertId;
};

export const updateEmployee = async (employee_id, name, email, phone, designation, salary, role_id, join_date) => {
  const [result] = await db.execute(
    `UPDATE employee SET name=?, email=?, phone=?, designation=?, salary=?, join_date=?
     WHERE employee_id=?`,
    [name, email, phone, designation, salary, join_date, employee_id]
  );
  
  // If role_id is provided and employee has a user_id, update the user's role
  if (role_id) {
    const [rows] = await db.execute(
      `SELECT user_id FROM employee WHERE employee_id = ?`,
      [employee_id]
    );
    if (rows.length > 0 && rows[0].user_id) {
      await db.execute(
        `UPDATE user SET role_id=? WHERE user_id=?`,
        [role_id, rows[0].user_id]
      );
    }
  }
  
  return result;
};

export const deleteEmployee = async (employee_id) => {
  const [result] = await db.execute(
    "DELETE FROM employee WHERE employee_id = ?", [employee_id]
  );
  return result;
};