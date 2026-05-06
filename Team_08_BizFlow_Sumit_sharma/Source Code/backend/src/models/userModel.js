import db from "../config/db.js";

export const createUser = async (user_name, email, password, role_id) => {
    const [result] = await db.execute(
        "INSERT INTO user (user_name, email, password, role_id) VALUES (?, ?, ?, ?)", 
        [user_name, email, password, role_id]
    );

    return result; 
};

export const loginUser = async (email, password) => {
    const [result] = await db.execute(
        `SELECT u.user_id, u.user_name, u.email, u.password, u.role_id,
            r.role_name
        FROM user u
        JOIN role r ON u.role_id = r.role_id
        WHERE u.email = ?`,
        [email]
    );

    if (result.length === 0) {
        const err = new Error("User not found");
        err.code = "NOT_FOUND";
        throw err;
    }

    return result[0];
};