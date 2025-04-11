import express from "express";
import { pool, promisePool } from "../Config/db.js";
import { format } from "mysql2";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import bcrypt from 'bcrypt';

const route = express.Router();

// Admin login route
route.post("/adminlogin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ 
        loginStatus: false, 
        Error: "Email and password are required" 
      });
    }

    const [rows] = await promisePool.query(
      "SELECT * FROM admin WHERE email = ?", 
      [email]
    );

    if (rows.length === 0) {
      return res.json({ 
        loginStatus: false, 
        Error: "Email not found" 
      });
    }

    const isMatch = await bcrypt.compare(password, rows[0].password);
    if (!isMatch) {
      return res.json({ 
        loginStatus: false, 
        Error: "Incorrect password" 
      });
    }

    const token = jwt.sign(
      { role: "admin", email: rows[0].email, id: rows[0].id },
      "jwt_secret_key",
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    return res.json({ loginStatus: true });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ 
      loginStatus: false, 
      Error: "Server error occurred" 
    });
  }
});

// Category route
route.get("/category", async (req, res) => {
  try {
    const [rows] = await promisePool.query("SELECT * FROM category");
    return res.json({ Status: true, Result: rows });
  } catch (err) {
    console.error("Database error:", err);
    return res.json({ Status: false, Error: "Query Error" });
  }
});

// Get specific category by ID
route.get("/category/:id", async (req, res) => {
  try {
    const [rows] = await promisePool.query("SELECT * FROM category WHERE id = ?", [req.params.id]);
    if (rows.length > 0) {
      res.json({ Status: true, Result: rows[0] });
    } else {
      res.json({ Status: false, Error: "Category not found" });
    }
  } catch (err) {
    console.error("Database error:", err);
    res.json({ Status: false, Error: "Query failed" });
  }
});

// Add category route
route.post("/add_category", async (req, res) => {
  try {
    const sql = "INSERT INTO category (name) VALUES (?)";
    await promisePool.query(sql, [req.body.category]);
    return res.json({ Status: true });
  } catch (err) {
    console.error("Error adding category:", err);
    return res.json({ Status: false, Error: "Query Error" });
  }
});

// Edit category by ID
route.put("/edit_category/:id", async (req, res) => {
  const id = req.params.id;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ Status: false, Error: "Category name is required" });
  }

  const sql = "UPDATE category SET name = ? WHERE id = ?";
  try {
    const [result] = await promisePool.query(sql, [name, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ Status: false, Error: "Category not found" });
    }
    return res.json({ Status: true, Message: "Category updated successfully" });
  } catch (err) {
    console.error("Error updating category:", err);
    return res.json({ Status: false, Error: "Query Error" });
  }
});

// Delete category by ID
route.delete("/delete_category/:id", async (req, res) => {
  const id = req.params.id;
  const connection = await promisePool.getConnection();

  try {
    await connection.beginTransaction();
    
    // First check if category exists
    const [category] = await connection.query(
      "SELECT * FROM category WHERE id = ?",
      [id]
    );

    if (category.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        Status: false,
        Error: "Category not found"
      });
    }

    // Then check if category has any employees
    const [employees] = await connection.query(
      "SELECT COUNT(*) as count FROM employee WHERE category_id = ?",
      [id]
    );

    if (employees[0].count > 0) {
      await connection.rollback();
      return res.status(400).json({
        Status: false,
        Error: "Cannot delete category with assigned employees. Please reassign employees first."
      });
    }

    // If no employees, delete the category
    const [result] = await connection.query(
      "DELETE FROM category WHERE id = ?",
      [id]
    );

    await connection.commit();
    return res.status(200).json({
      Status: true,
      Message: "Category deleted successfully"
    });

  } catch (err) {
    await connection.rollback();
    console.error("Error deleting category:", err);
    return res.status(500).json({
      Status: false,
      Error: "Database error occurred while deleting category"
    });
  } finally {
    connection.release();
  }
});

// File upload configuration
const storage = multer.memoryStorage(); // Use memoryStorage to access file buffer
const upload = multer({ storage: storage });

// Add employee route
route.post("/employeeAdd", upload.single("image"), async (req, res) => {
  if (!req.file || !req.body.name || !req.body.email || !req.body.password || !req.body.salary || !req.body.address || !req.body.category_id) {
    console.error("Validation Error: Missing required fields.");
    return res.json({ Status: false, Error: "All fields are required, including the image." });
  }

  const sql = `
    INSERT INTO employee 
    (name, email, password, salary, address, category_id, image_blob) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    const hash = await bcrypt.hash(req.body.password, 10);
    const values = [
      req.body.name,
      req.body.email,
      hash,
      req.body.salary,
      req.body.address,
      req.body.category_id,
      req.file.buffer  // Store only the buffer as BLOB
    ];

    await promisePool.query(sql, values);
    return res.json({ Status: true, Message: "Employee added successfully." });
  } catch (err) {
    console.error("Error adding employee:", err);
    return res.json({ Status: false, Error: "Database insertion failed. " + (err.sqlMessage || err) });
  }
});

// Get all employees
route.get("/employee", async (req, res) => {
  const sql = `
    SELECT e.id, e.name, e.email, e.salary, e.address, e.image_blob, 
           c.name as department 
    FROM employee e
    LEFT JOIN category c ON e.category_id = c.id
  `;
    
  try {
    const [result] = await promisePool.query(sql);
    // Convert image_blob to base64 if it exists
    const employees = result.map((employee) => ({
      ...employee,
      image_blob: employee.image_blob
        ? Buffer.from(employee.image_blob).toString("base64")
        : null,
    }));

    return res.json({ Status: true, Result: employees });
  } catch (err) {
    console.error("Database Query Error:", err);
    return res.json({ Status: false, Error: "Query Error" });
  }
});

// Get specific employee
route.get("/employee/:id", async (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM employee WHERE id = ?";
  try {
    const [result] = await promisePool.query(sql, [id]);
    if (result.length === 0) {
      return res.status(404).json({ Status: false, Error: "Employee not found" });
    }
    return res.json({ Status: true, Result: result });
  } catch (err) {
    console.error("Error fetching employee:", err.message);
    return res.status(500).json({ Status: false, Error: "Query Error: " + err.message });
  }
});

// Edit employee details
route.put("/edit_employee/:id", async (req, res) => {
  const id = req.params.id;
  const updates = req.body;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ Status: false, Error: "No fields provided for update" });
  }

  const fields = Object.keys(updates).map((key) => `${key} = ?`).join(", ");
  const values = Object.values(updates);
  const sql = `UPDATE employee SET ${fields} WHERE id = ?`;
  try {
    const [result] = await promisePool.query(sql, [...values, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ Status: false, Error: "Employee not found" });
    }
    return res.json({ Status: true, Message: "Employee updated successfully" });
  } catch (err) {
    console.error("Error updating employee:", err.message);
    return res.status(500).json({ Status: false, Error: "Database Error: " + err.message });
  }
});

// Delete employee
route.delete("/delete_employee/:id", async (req, res) => {
  const id = req.params.id;
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    try {
      await connection.query("DELETE FROM salary_requests WHERE employee_id = ?", [id]);
      await connection.query("DELETE FROM tasks WHERE employee_id = ?", [id]);
      await connection.query("DELETE FROM employee WHERE id = ?", [id]);
    
      await connection.commit();
      res.json({ Status: true, Message: "Employee and all related records deleted successfully" });
    } catch (err) {
      await connection.rollback();
      console.error("Error in transaction:", err);
      res.json({ Status: false, Error: "Failed to delete employee and related records" });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Error deleting employee:", err);
    res.json({ Status: false, Error: "Failed to delete employee" });
  }
});

// Admin and employee count
route.get("/admin_count", async (req, res) => {
  try {
    const [rows] = await promisePool.query("SELECT COUNT(id) as admin FROM admin");
    return res.json({ Status: true, Result: rows });
  } catch (err) {
    console.error("Error getting admin count:", err);
    return res.status(500).json({ Status: false, Error: "Failed to get admin count" });
  }
});

// Employee salary count
route.get("/salary_count", async (req, res) => {
  try {
    const [rows] = await promisePool.query("SELECT SUM(salary) as salaryOFEmp FROM employee");
    return res.json({ Status: true, Result: rows });
  } catch (err) {
    console.error("Error getting salary count:", err);
    return res.status(500).json({ Status: false, Error: "Failed to get salary count" });
  }
});

route.post("/add_admin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = "INSERT INTO `admin` (email, password) VALUES (?, ?)";
    await promisePool.query(sql, [email, hashedPassword]);
    return res.json({ Status: true, Message: "Admin added successfully" });
  } catch (err) {
    console.error("Error adding admin:", err);
    return res.json({ Status: false, Error: "Database insertion failed" });
  }
});

// Get all admins
route.get("/admins", async (req, res) => {
  try {
    const [admins] = await promisePool.query('SELECT * FROM admin');
    res.json({
      Status: true,
      Result: admins
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({
      Status: false,
      Error: 'Failed to fetch admins'
    });
  }
});

route.get('/salary_requests', async (req, res) => {
  const sql = `
    SELECT 
      sr.id,
      sr.request_date,
      sr.request_month,
      sr.status,
      sr.receipt_status,
      e.name AS employee_name,
      e.email AS employee_email,
      e.salary,
      CASE 
        WHEN sr.status = 'Approved' AND sr.receipt_status = 'Not Received' THEN 'Payment Not Received'
        WHEN sr.status = 'Approved' AND sr.receipt_status = 'Pending' THEN 'Receipt Pending'
        WHEN sr.status = 'Approved' AND sr.receipt_status = 'Received' THEN 'Completed'
        ELSE sr.status
      END AS display_status,
      CASE
        WHEN sr.status = 'Approved' AND (sr.receipt_status = 'Not Received' OR sr.receipt_status = 'Pending') THEN true
        ELSE false
      END AS needs_attention
    FROM salary_requests sr
    JOIN employee e ON sr.employee_id = e.id
    ORDER BY 
      needs_attention DESC,
      CASE 
        WHEN sr.status = 'Pending' THEN 1
        WHEN sr.status = 'Approved' AND sr.receipt_status != 'Received' THEN 2
        ELSE 3
      END,
      sr.request_date DESC
  `;
  try {
    const [result] = await promisePool.query(sql);
    return res.json({ Status: true, Data: result });
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ Status: false, Error: "Failed to fetch salary requests" });
  }
});

route.post('/approve_salary_request/:id', async (req, res) => {
  const { id } = req.params;
  const sql = "UPDATE salary_requests SET status = 'Approved' WHERE id = ?";
  try {
    await promisePool.query(sql, [id]);
    return res.json({ Status: true, Message: "Salary request approved successfully." });
  } catch (err) {
    console.error("Error approving salary request:", err.message);
    return res.status(500).json({ Status: false, Error: "Database Error: " + err.message });
  }
});

route.post('/assign_task', async (req, res) => {
  const { employee_id, description } = req.body;

  if (!employee_id || !description) {
    return res.status(400).json({ Status: false, Error: "Employee ID and description are required." });
  }

  const sql = "INSERT INTO tasks (employee_id, description) VALUES (?, ?)";
  try {
    await promisePool.query(sql, [employee_id, description]);
    return res.json({ Status: true, Message: "Task assigned successfully." });
  } catch (err) {
    console.error("Error assigning task:", err.message);
    return res.status(500).json({ Status: false, Error: "Database Error: " + err.message });
  }
});

// Add this new route for complete employee details
route.get("/employee_details", async (req, res) => {
  try {
    const [rows] = await promisePool.query(`
      SELECT e.*, c.name as category_name 
      FROM employee e
      LEFT JOIN category c ON e.category_id = c.id
    `);
    return res.json({ Status: true, Result: rows });
  } catch (error) {
    console.error('Error fetching employee details:', error);
    res.status(500).json({
      Status: false,
      Error: 'Failed to fetch employee details'
    });
  }
});

// Update salary request status
route.put('/salary_request/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ Status: false, Error: "Invalid status value." });
  }

  const sql = "UPDATE salary_requests SET status = ? WHERE id = ?";
  try {
    const [result] = await promisePool.query(sql, [status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ Status: false, Error: "Salary request not found." });
    }
    return res.json({ Status: true, Message: `Salary request ${status.toLowerCase()}.` });
  } catch (err) {
    console.error("Error updating salary request:", err);
    return res.status(500).json({ Status: false, Error: "Database Error: " + err.message });
  }
});

// Update salary request status
route.put("/salary_request_status/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const sql = "UPDATE salary_requests SET status = ? WHERE id = ?";
  try {
    const [result] = await promisePool.query(sql, [status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        Status: false, 
        Error: "Salary request not found" 
      });
    }
    res.json({ 
      Status: true, 
      Message: "Status updated successfully" 
    });
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ 
      Status: false, 
      Error: "Database error while updating status" 
    });
  }
});

// Update salary receipt status
route.put("/salary-receipt/:id", async (req, res) => {
  const { id } = req.params;
  const { receipt_status } = req.body;

  if (!receipt_status || !['Not Received', 'Received', 'Pending'].includes(receipt_status)) {
    return res.status(400).json({ 
      Status: false, 
      Error: "Invalid receipt status" 
    });
  }

  const sql = "UPDATE salary_requests SET receipt_status = ? WHERE id = ?";
  try {
    const [result] = await promisePool.query(sql, [receipt_status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        Status: false, 
        Error: "Salary request not found" 
      });
    }
    return res.json({ 
      Status: true, 
      Message: "Receipt status updated successfully" 
    });
  } catch (err) {
    console.error("Error updating receipt status:", err);
    return res.status(500).json({ 
      Status: false, 
      Error: "Failed to update receipt status" 
    });
  }
});

// Update salary receipt confirmation status
route.put("/salary-receipt-confirmation/:id", async (req, res) => {
  const { id } = req.params;
  const { receipt_status, employee_id } = req.body;

  if (!['Received', 'Not Received', 'Pending'].includes(receipt_status)) {
    return res.status(400).json({ 
      Status: false, 
      Error: "Invalid receipt status" 
    });
  }

  const sql = "UPDATE salary_requests SET receipt_status = ? WHERE id = ? AND employee_id = ?";
  
  try {
    const [result] = await promisePool.query(sql, [receipt_status, id, employee_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        Status: false, 
        Error: "Salary request not found or unauthorized" 
      });
    }
    return res.json({ 
      Status: true, 
      Message: "Receipt status updated successfully" 
    });
  } catch (err) {
    console.error("Error updating receipt status:", err);
    return res.status(500).json({ 
      Status: false, 
      Error: "Failed to update receipt status" 
    });
  }
});

// Delete completed task
route.delete("/tasks/:id", async (req, res) => {
  const sql = "DELETE FROM tasks WHERE id = ? AND status = 'Completed'";
  try {
    await promisePool.query(sql, [req.params.id]);
    return res.json({ Status: true, Message: "Task deleted successfully" });
  } catch (err) {
    console.error("Error deleting task:", err);
    return res.json({ Status: false, Error: "Failed to delete task" });
  }
});

// Route to fetch all admins
route.get('/admins', async (req, res) => {
  try {
    const [rows] = await promisePool.query('SELECT id, email FROM admin');
    return res.json({
      Status: true,
      Result: rows
    });
  } catch (err) {
    console.error('Error fetching admins:', err);
    return res.status(500).json({
      Status: false,
      Error: 'Failed to fetch admins'
    });
  }
});

// Route to fetch employee details with category names
route.get('/employee_details', async (req, res) => {
  try {
    const [rows] = await promisePool.query(`
      SELECT e.*, c.name as category_name 
      FROM employee e
      LEFT JOIN category c ON e.category_id = c.id
    `);
    return res.json({
      Status: true,
      Result: rows
    });
  } catch (err) {
    console.error('Error fetching employee details:', err);
    return res.status(500).json({
      Status: false,
      Error: 'Failed to fetch employee details'
    });
  }
});

// Update task status
route.put("/task-status/:id", async (req, res) => {
  const taskId = req.params.id;
  const { status, employee_id } = req.body;

  if (!status || !['Pending', 'Completed'].includes(status)) {
    return res.status(400).json({ 
      Status: false, 
      Error: "Invalid status value" 
    });
  }

  const sql = "UPDATE tasks SET status = ? WHERE id = ? AND employee_id = ?";
  try {
    const [result] = await promisePool.query(sql, [status, taskId, employee_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        Status: false, 
        Error: "Task not found or not authorized" 
      });
    }
    return res.json({ 
      Status: true, 
      Message: "Task status updated successfully" 
    });
  } catch (err) {
    console.error("Error updating task status:", err);
    return res.status(500).json({ 
      Status: false, 
      Error: "Failed to update task status" 
    });
  }
});

// Add new admin
route.post("/add_admin", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ Status: false, Error: "Email and password are required" });
  }

  // Check if admin already exists
  const checkSql = "SELECT * FROM admin WHERE email = ?";
  con.query(checkSql, [email], (checkErr, checkResult) => {
    if (checkErr) {
      console.error("Error checking admin:", checkErr);
      return res.status(500).json({ Status: false, Error: "Database Error" });
    }

    if (checkResult.length > 0) {
      return res.status(400).json({ Status: false, Error: "Admin with this email already exists" });
    }

    // Hash password and create admin
    bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
      if (hashErr) {
        console.error("Error hashing password:", hashErr);
        return res.status(500).json({ Status: false, Error: "Password hashing failed" });
      }

      const sql = "INSERT INTO admin (email, password) VALUES (?, ?)";
      con.query(sql, [email, hashedPassword], (err, result) => {
        if (err) {
          console.error("Error creating admin:", err);
          return res.status(500).json({ Status: false, Error: "Failed to create admin" });
        }
        return res.json({ Status: true, Message: "Admin created successfully" });
      });
    });
  });
});

// Update admin
route.put("/update_admin/:id", (req, res) => {
  const { id } = req.params;
  const { email, password, currentPassword } = req.body;

  if (!email || (!password && password !== undefined)) {
    return res.status(400).json({ Status: false, Error: "Invalid input" });
  }

  // First verify current password if provided
  if (password) {
    const verifySQL = "SELECT password FROM admin WHERE id = ?";
    con.query(verifySQL, [id], (verifyErr, verifyResult) => {
      if (verifyErr) {
        console.error("Error verifying admin:", verifyErr);
        return res.status(500).json({ Status: false, Error: "Database Error" });
      }

      if (verifyResult.length === 0) {
        return res.status(404).json({ Status: false, Error: "Admin not found" });
      }

      bcrypt.compare(currentPassword, verifyResult[0].password, (compareErr, match) => {
        if (compareErr || !match) {
          return res.status(401).json({ Status: false, Error: "Current password is incorrect" });
        }

        // Hash new password and update
        bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
          if (hashErr) {
            return res.status(500).json({ Status: false, Error: "Password hashing failed" });
          }

          const updateSQL = "UPDATE admin SET email = ?, password = ? WHERE id = ?";
          con.query(updateSQL, [email, hashedPassword, id], (err, result) => {
            if (err) {
              console.error("Error updating admin:", err);
              return res.status(500).json({ Status: false, Error: "Failed to update admin" });
            }
            return res.json({ Status: true, Message: "Admin updated successfully" });
          });
        });
      });
    });
  } else {
    // Update email only
    const updateSQL = "UPDATE admin SET email = ? WHERE id = ?";
    con.query(updateSQL, [email, id], (err, result) => {
      if (err) {
        console.error("Error updating admin:", err);
        return res.status(500).json({ Status: false, Error: "Failed to update admin" });
      }
      return res.json({ Status: true, Message: "Admin updated successfully" });
    });
  }
});

// Delete admin
route.delete("/delete_admin/:id", async (req, res) => {
  const { id } = req.params;
  
  // First check if this is the last admin
  try {
    const [adminCount] = await promisePool.query("SELECT COUNT(*) as count FROM admin");
    if (adminCount[0].count <= 1) {
      return res.status(400).json({
        Status: false,
        Error: "Cannot delete the last admin account"
      });
    }

    // If not the last admin, proceed with deletion
    const [result] = await promisePool.query("DELETE FROM admin WHERE id = ?", [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        Status: false,
        Error: "Admin not found"
      });
    }

    return res.json({
      Status: true,
      Message: "Admin deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting admin:", err);
    return res.status(500).json({
      Status: false,
      Error: "Failed to delete admin"
    });
  }
});

export default route;
