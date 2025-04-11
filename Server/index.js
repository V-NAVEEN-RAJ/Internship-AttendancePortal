import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { pool, promisePool } from './Config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: ['http://localhost:5173', 'https://cybernautattendanceportal.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Basic middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

import adminRouter from "./routers/admin.js";
import employeeRouter from "./routers/employee.js";
import attendanceRouter from "./routers/attendance.js";

app.use("/admin", adminRouter);
app.use("/employee", employeeRouter);
app.use("/attendance", attendanceRouter);

app.get("/verify", (req, res) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, "jwt_secret_key");
    return res.json({ success: true, role: decoded.role, id: decoded.id });
  } catch (err) {
    console.error("JWT Verification Error:", err);
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

// Add global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    Status: false, 
    Error: "Internal server error",
    Details: err.message 
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({ 
    status: true, 
    message: "ERP System API" 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
