import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser"; // Import cookie-parser
import { pool, promisePool } from './Config/db.js';

import dotenv from 'dotenv';
dotenv.config();

import adminRouter from "./routers/admin.js";
import employeeRouter from "./routers/employee.js";
import attendanceRouter from "./routers/attendance.js";

const app = express();
const PORT = 3000;

const corsOptions = {
  origin: ['https://cybernaut-attendanceportal.onrender.com/', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']
};

app.use(cors(corsOptions));

app.use(express.json()); // JSON parsing
app.use(cookieParser()); // Parse cookies

app.use("/admin", adminRouter);
app.use("/employee", employeeRouter);
app.use("/attendance", attendanceRouter);

app.get("/api", (req, res) => {
  res.json({ success: true, message: "This is an API for ERP system" });
});

app.get("/verify", (req, res) => {
  const token = req.cookies?.token; // Ensure cookies are being read properly
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, "jwt_secret_key"); // Ensure the secret key matches
    return res.json({ success: true, role: decoded.role, id: decoded.id });
  } catch (err) {
    console.error("JWT Verification Error:", err); // Log the error
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
});

// Update the database connection check
const checkDatabaseConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    if (connection) {
      console.log("Database connection successful");
      connection.release();
    }
  } catch (err) {
    console.error("❌ Database Connection Error:", err);
  }
};

// Test connection at startup
await checkDatabaseConnection();

// Setup error handler for pool
pool.on('error', (err) => {
  console.error('Database error:', err);
});

app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port https://cybernaut-attendanceportal.onrender.com/`);
});
