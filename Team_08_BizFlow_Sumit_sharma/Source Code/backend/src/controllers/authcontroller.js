import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createUser, loginUser as loginUserModel } from "../models/userModel.js";
import { createEmployee } from "../models/hrModel.js";

export const loginUser = async (req, res) => {
  console.log("LOGIN API HIT");

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await loginUserModel(email);

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }


    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    
    const token = jwt.sign(
      { 
        id: user.user_id,
        user_name: user.user_name,
        role_id:   user.role_id,
        role_name: user.role_name 
      }, 
      process.env.JWT_SECRET,
      { expiresIn: "1d"}
    ); 

    res.json({
      message: "User logged in successfully",
      token,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const registerUser = async (req, res) => {
  console.log("REGISTER API HIT");

  const { user_name, email, password, role_id } = req.body;

  const resolvedRoleId = Number(role_id ?? process.env.DEFAULT_ROLE_ID ?? 1);

  if (!Number.isInteger(resolvedRoleId) || resolvedRoleId <= 0) {
    return res.status(400).json({ message: "A valid role_id is required" });
  }

  try {
    const hashedPwd = await bcrypt.hash(password,10);

    const result = await createUser(user_name, email, hashedPwd, resolvedRoleId);

    const newUserId = result?.insertId || result?.insert_id || null;

    // If the new user is not Admin (role_id 1), create a corresponding employee record
    if (newUserId && resolvedRoleId !== 1) {
      try {
        // Set join_date to today
        const today = new Date().toISOString().split('T')[0];
        await createEmployee(newUserId, user_name, email, null, null, null, today);
      } catch (err) {
        console.log("createEmployee ERROR:", err.message);
        // continue without failing registration — employee can be added later via HR UI
      }
    }

    res.json({ message: "User registered successfully" });

  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Email already exists" });
    }

    res.status(500).json({ message: "Server error" });
  }
};