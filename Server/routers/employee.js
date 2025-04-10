import express from "express";
import pool from "../Config/db.js";
import { format } from "mysql2";
import multer from "multer";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const route = express.Router();

// Update multer configuration to store in memory
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Middleware to verify employee access
const verifyEmployeeAccess = (req, res, next) => {
  const token = req.cookies?.token; // Ensure cookies are being read properly
  if (!token) {
    return res.status(401).json({ Status: false, Error: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, "employee_secret_key"); // Use the employee secret key
    if (decoded.id !== parseInt(req.params.id, 10)) {
      return res.status(403).json({ Status: false, Error: "Forbidden: Access denied" });
    }
    next();
  } catch (err) {
    console.error("JWT Verification Error:", err); // Log the error for debugging
    return res.status(401).json({ Status: false, Error: "Invalid token" });
  }
};

// Fetch employee details by ID
route.get("/detail/:id", (req, res) => {
  const { id } = req.params;

  // Define the SQL query
  const sql = `
    SELECT 
        id, name, email, address, category_id, image_blob 
    FROM 
        employee 
    WHERE 
        id = ?`;

  // Execute the query
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting connection:", err);
      return res.status(500).json({ Status: false, Error: "Database connection error" });
    }

    connection.query(sql, [id], (err, result) => {
      connection.release(); // Always release the connection

      if (err) {
        console.error("Error fetching employee details:", err.message);
        return res.status(500).json({ Status: false, Error: "Database Error: " + err.message });
      }

      if (result.length === 0) {
        return res.status(404).json({ Status: false, Error: "Employee not found" });
      }

      // Convert image_blob to base64 if it exists
      const employee = {
        ...result[0],
        image_blob: result[0].image_blob
          ? Buffer.from(result[0].image_blob).toString("base64")
          : null,
      };

      return res.json({ Status: true, Data: employee });
    });
  });
});

// Remove duplicate or misplaced con.query calls
// Employee Details Route
route.get('/employees', (req, res) => {
    const sql = "SELECT id, name FROM employee"; // Ensure 'id' is included in the query

    pool.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting connection:", err);
        return res.status(500).json({ Status: false, Error: "Database connection error" });
      }

      connection.query(sql, (err, result) => {
        connection.release(); // Always release the connection

        if (err) {
            console.error("Error fetching employees:", err.message); // Log detailed error
            return res.status(500).json({ Status: false, Error: "Query Error: " + err.message });
        }
        if (result.length === 0) {
            return res.status(404).json({ Status: false, Error: "No employees found", Data: [] }); // Return empty array
        }
        return res.json({ Status: true, Data: result }); // Ensure correct response structure
      });
    });
});

// API to fetch image_blob for a specific employee
route.get('/image_blob/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT image_blob FROM employee WHERE id = ?";

    pool.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting connection:", err);
        return res.status(500).json({ Status: false, Error: "Database connection error" });
      }

      connection.query(sql, [id], (err, result) => {
        connection.release(); // Always release the connection

        if (err) {
            console.error("Error fetching image_blob:", err.message);
            return res.status(500).json({ Status: false, Error: "Database Error: " + err.message });
        }
        if (result.length === 0) {
            return res.status(404).json({ Status: false, Error: "Employee not found" });
        }
        // Convert image_blob to base64 if it exists
        const imageBlob = result[0].image_blob
            ? Buffer.from(result[0].image_blob).toString("base64")
            : null;
        return res.json({ Status: true, Data: imageBlob });
      });
    });
});

route.post('/salary_request', (req, res) => {
    let { employee_id, request_month } = req.body;
    
    // Validate employee_id
    employee_id = parseInt(employee_id, 10);
    if (!employee_id || isNaN(employee_id)) {
        return res.status(400).json({ 
            Status: false, 
            Error: "Invalid employee ID" 
        });
    }

    // Validate request_month
    if (!request_month) {
        return res.status(400).json({ 
            Status: false, 
            Error: "Request month is required" 
        });
    }

    try {
        // Ensure proper date format
        const formattedDate = new Date(request_month);
        if (isNaN(formattedDate.getTime())) {
            throw new Error("Invalid date format");
        }

        const sqlDate = formattedDate.toISOString().split('T')[0];

        // Check for existing request
        const checkSql = `
            SELECT id FROM salary_requests 
            WHERE employee_id = ? 
            AND DATE_FORMAT(request_month, '%Y-%m') = DATE_FORMAT(?, '%Y-%m') 
        `;

        pool.getConnection((err, connection) => {
          if (err) {
            console.error("Error getting connection:", err);
            return res.status(500).json({ Status: false, Error: "Database connection error" });
          }

          connection.query(checkSql, [employee_id, sqlDate], (checkErr, checkResult) => {
            if (checkErr) {
                console.error("Check error:", checkErr);
                return res.status(500).json({ 
                    Status: false, 
                    Error: "Database error during check" 
                });
            }

            if (checkResult.length > 0) {
                return res.status(400).json({ 
                    Status: false, 
                    Error: "A request for this month already exists" 
                });
            }

            // Insert new request
            const insertSql = "INSERT INTO salary_requests (employee_id, request_month) VALUES (?, ?)";
            connection.query(insertSql, [employee_id, sqlDate], (err, result) => {
                connection.release(); // Always release the connection

                if (err) {
                    console.error("Insert error:", err);
                    return res.status(500).json({ 
                        Status: false, 
                        Error: "Failed to create salary request" 
                    });
                }
                return res.json({ 
                    Status: true, 
                    Message: "Salary request submitted successfully" 
                });
            });
          });
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(400).json({ 
            Status: false, 
            Error: error.message 
        });
    }
});

route.get('/logout', (req, res) => {
    res.clearCookie('token');
    return res.json({ Status: true });
});

route.get('/verify', (req, res) => {
    const token = req.cookies?.token; // Ensure cookies are being read properly
    if (!token) {
        return res.status(401).json({ Status: false, Error: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, "jwt_secret_key"); // Ensure the secret key matches
        return res.json({ Status: true, role: decoded.role, id: decoded.id });
    } catch (err) {
        console.error("JWT Verification Error:", err); // Log the error for debugging
        return res.status(401).json({ Status: false, Error: "Invalid token" });
    }
});

route.get('/tasks/:id', (req, res) => {
    const employeeId = req.params.id;
    const sql = "SELECT * FROM tasks WHERE employee_id = ?";
    pool.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting connection:", err);
        return res.status(500).json({ Status: false, Error: "Database connection error" });
      }

      connection.query(sql, [employeeId], (err, result) => {
        connection.release(); // Always release the connection

        if (err) {
            console.error("Error fetching tasks:", err.message);
            return res.status(500).json({ Status: false, Error: "Database Error: " + err.message });
        }
        return res.json({ Status: true, Data: result });
      });
    });
});

route.put('/edit/:id', upload.single('image'), async (req, res) => {
    const id = req.params.id;
    const { name, email, address, password } = req.body;
    
    try {
        let updates = [];
        let values = [];

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }

        if (email) {
            updates.push('email = ?');
            values.push(email);
        }

        if (address) {
            updates.push('address = ?');
            values.push(address);
        }
        
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push('password = ?');
            values.push(hashedPassword);
        }

        if (req.file) {
            updates.push('image_blob = ?');
            values.push(req.file.buffer);
        }

        if (updates.length === 0) {
            return res.json({ Status: false, Error: "No fields to update" });
        }

        const sql = `UPDATE employee SET ${updates.join(', ')} WHERE id = ?`;
        values.push(id);

        pool.query(sql, values, (err, result) => {
            if (err) {
                console.error("Error updating employee:", err);
                return res.json({ Status: false, Error: "Database error" });
            }
            return res.json({ Status: true, Message: "Profile updated successfully" });
        });
    } catch (err) {
        console.error("Error in employee update:", err);
        return res.json({ Status: false, Error: "Server error" });
    }
});

route.get('/attendance/details/:id', (req, res) => {
    const employeeId = req.params.id;
    const sql = "SELECT id, date_of_attendance, in_time, out_time, status, final_status FROM attendance WHERE employee_id = ?";
    pool.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting connection:", err);
        return res.status(500).json({ Status: false, Error: "Database connection error" });
      }

      connection.query(sql, [employeeId], (err, result) => {
        connection.release(); // Always release the connection

        if (err) {
            console.error("Error fetching attendance details:", err.message);
            return res.status(500).json({ Status: false, Error: "Database Error: " + err.message });
        }
        return res.json({ Status: true, Data: result });
      });
    });
});

// Employee login route
route.post("/employee_login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ loginStatus: false, Error: "Email and password are required" });
  }

  const sql = `
    SELECT e.*, c.name as category_name 
    FROM employee e
    LEFT JOIN category c ON e.category_id = c.id 
    WHERE e.email = ?
  `;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting connection:", err);
      return res.status(500).json({ loginStatus: false, Error: "Database connection error" });
    }

    connection.query(sql, [email], (err, result) => {
      connection.release(); // Always release the connection

      if (err) {
        console.error("Error during employee login:", err.message);
        return res.status(500).json({ loginStatus: false, Error: "Database Error: " + err.message });
      }
      if (result.length === 0) {
        return res.status(404).json({ loginStatus: false, Error: "Employee not found" });
      }
      
      const hashedPassword = result[0].password;
      bcrypt.compare(password, hashedPassword, (err, isMatch) => {
        if (err || !isMatch) {
          return res.status(401).json({ loginStatus: false, Error: "Invalid email or password" });
        }
        const token = jwt.sign(
          { 
            role: "employee", 
            id: result[0].id,
            category_id: result[0].category_id,
            email: result[0].email
          },
          "jwt_secret_key",
          { expiresIn: "1d" }
        );
        res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000 // 1 day
        });
        return res.json({ 
          loginStatus: true, 
          id: result[0].id,
          userData: {
            name: result[0].name,
            email: result[0].email,
            category: result[0].category_name
          }
        });
      });
    });
  });
});

// Add auth middleware for protected routes
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ Status: false, Error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, "jwt_secret_key");
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).json({ Status: false, Error: "Invalid token" });
  }
};

// Apply middleware to protected routes
route.get('/attendance/details/:id', verifyToken, (req, res) => {
  const employeeId = req.params.id;
  const sql = "SELECT id, date_of_attendance, in_time, out_time, status, final_status FROM attendance WHERE employee_id = ?";
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting connection:", err);
      return res.status(500).json({ Status: false, Error: "Database connection error" });
    }

    connection.query(sql, [employeeId], (err, result) => {
      connection.release(); // Always release the connection

      if (err) {
          console.error("Error fetching attendance details:", err.message);
          return res.status(500).json({ Status: false, Error: "Database Error: " + err.message });
      }
      return res.json({ Status: true, Data: result });
    });
  });
});

route.get('/tasks/:id', verifyToken, (req, res) => {
  const employeeId = req.params.id;
  const sql = "SELECT * FROM tasks WHERE employee_id = ?";
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting connection:", err);
      return res.status(500).json({ Status: false, Error: "Database connection error" });
    }

    connection.query(sql, [employeeId], (err, result) => {
      connection.release(); // Always release the connection

      if (err) {
          console.error("Error fetching tasks:", err.message);
          return res.status(500).json({ Status: false, Error: "Database Error: " + err.message });
      }
      return res.json({ Status: true, Data: result });
    });
  });
});

route.get('/salary_requests/:id', verifyToken, (req, res) => {
  const employeeId = req.params.id;
  const sql = `
      SELECT 
          sr.id,
          sr.request_month,
          sr.request_date,
          sr.status
      FROM salary_requests sr
      WHERE sr.employee_id = ?
      ORDER BY sr.request_month DESC
  `;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting connection:", err);
      return res.status(500).json({ Status: false, Error: "Database connection error" });
    }

    connection.query(sql, [employeeId], (err, result) => {
      connection.release(); // Always release the connection

      if (err) {
          console.error("Error fetching salary requests:", err);
          return res.status(500).json({ Status: false, Error: "Database Error: " + err.message });
      }
      return res.json({ Status: true, Data: result });
    });
  });
});

route.get('/detail/:id', verifyToken, (req, res) => {
  const employeeId = req.params.id;
  const sql = `
      SELECT e.*, c.name as category_name 
      FROM employee e  
      LEFT JOIN category c ON e.category_id = c.id 
      WHERE e.id = ?
  `;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting connection:", err);
      return res.status(500).json({ Status: false, Error: "Database connection error" });
    }

    connection.query(sql, [employeeId], (err, result) => {
      connection.release(); // Always release the connection

      if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ Status: false, Error: "Failed to fetch employee details" });
      }
      if (result.length === 0) {
          return res.status(404).json({ Status: false, Error: "Employee not found" });
      }
      return res.json({ Status: true, Data: result[0] });
    });
  });
});

// Route for employees to update task status
route.put('/update_task/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Pending', 'Completed'].includes(status)) {
        return res.status(400).json({ Status: false, Error: "Invalid status. Allowed values are 'Pending' or 'Completed'." });
    }

    const sql = "UPDATE tasks SET status = ? WHERE id = ?";
    pool.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting connection:", err);
        return res.status(500).json({ Status: false, Error: "Database connection error" });
      }

      connection.query(sql, [status, id], (err, result) => {
        connection.release(); // Always release the connection

        if (err) {
            console.error("Error updating task status:", err.message);
            return res.status(500).json({ Status: false, Error: "Database Error: " + err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ Status: false, Error: "Task not found." });
        }
        return res.json({ Status: true, Message: "Task status updated successfully." });
      });
    });
});

// Fetch all tasks with employee details
route.get('/tasks', (req, res) => {
    const sql = `
        SELECT 
            tasks.id AS task_id, 
            tasks.description, 
            tasks.created_at, 
            tasks.status, 
            employee.id AS employee_id, 
            employee.name AS employee_name, 
            employee.email AS employee_email 
        FROM tasks 
        JOIN employee ON tasks.employee_id = employee.id 
    `;
    pool.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting connection:", err);
        return res.status(500).json({ Status: false, Error: "Database connection error" });
      }

      connection.query(sql, (err, result) => {
        connection.release(); // Always release the connection

        if (err) {
            console.error("Error fetching tasks:", err.message);
            return res.status(500).json({ Status: false, Error: "Database Error: " + err.message });
        }
        return res.json({ Status: true, Data: result });
      });
    });
});

// Fetch a specific task by task ID with employee details
route.get('/tasks/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT 
            tasks.id AS task_id, 
            tasks.description, 
            tasks.created_at, 
            tasks.status, 
            employee.id AS employee_id, 
            employee.name AS employee_name, 
            employee.email AS employee_email 
        FROM tasks 
        JOIN employee ON tasks.employee_id = employee.id 
        WHERE tasks.id = ?
    `;
    pool.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting connection:", err);
        return res.status(500).json({ Status: false, Error: "Database connection error" });
      }

      connection.query(sql, [id], (err, result) => {
        connection.release(); // Always release the connection

        if (err) {
            console.error("Error fetching task:", err.message);
            return res.status(500).json({ Status: false, Error: "Database Error: " + err.message });
        }
        if (result.length === 0) {
            return res.status(404).json({ Status: false, Error: "Task not found" });
        }
        return res.json({ Status: true, Data: result[0] });
      });
    });
});

// Create a new task
route.post('/tasks', (req, res) => {
    const { employee_id, description } = req.body;

    if (!employee_id || !description) {
        return res.status(400).json({ Status: false, Error: "Employee ID and description are required." });
    }

    const sql = "INSERT INTO tasks (employee_id, description) VALUES (?, ?)";
    pool.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting connection:", err);
        return res.status(500).json({ Status: false, Error: "Database connection error" });
      }

      connection.query(sql, [employee_id, description], (err, result) => {
        connection.release(); // Always release the connection

        if (err) {
            console.error("Error creating task:", err.message);
            return res.status(500).json({ Status: false, Error: "Database Error: " + err.message });
        }
        return res.json({ Status: true, Message: "Task created successfully.", TaskID: result.insertId });
      });
    });
});

// Update a task by task ID
route.put('/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { description, status } = req.body;

    if (!description && !status) {
        return res.status(400).json({ Status: false, Error: "At least one field (description or status) is required for update." });
    }

    const fields = [];
    const values = [];

    if (description) {
        fields.push("description = ?");
        values.push(description);
    }
    if (status) {
        if (!['Pending', 'Completed'].includes(status)) {
            return res.status(400).json({ Status: false, Error: "Invalid status. Allowed values are 'Pending' or 'Completed'." });
        }
        fields.push("status = ?");
        values.push(status);
    }

    const sql = `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`;
    values.push(id);

    pool.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting connection:", err);
        return res.status(500).json({ Status: false, Error: "Database connection error" });
      }

      connection.query(sql, values, (err, result) => {
        connection.release(); // Always release the connection

        if (err) {
            console.error("Error updating task:", err.message);
            return res.status(500).json({ Status: false, Error: "Database Error: " + err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ Status: false, Error: "Task not found" });
        }
        return res.json({ Status: true, Message: "Task updated successfully." });
      });
    });
});

// Delete a task by task ID
route.delete('/tasks/:id', (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM tasks WHERE id = ? AND status = 'Completed'";
    pool.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting connection:", err);
        return res.status(500).json({ Status: false, Error: "Database connection error" });
      }

      connection.query(sql, [id], (err, result) => {
        connection.release(); // Always release the connection

        if (err) {
            console.error("Error deleting task:", err.message);
            return res.status(500).json({ Status: false, Error: "Database Error: " + err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ Status: false, Error: "Task not found or not completed" });
        }
        return res.json({ Status: true, Message: "Task deleted successfully" });
      });
    });
});

// Submit salary request for a specific month
route.post('/salary_request', (req, res) => {
    const { employee_id, request_month } = req.body;
    
    if (!employee_id || !request_month) {
        return res.status(400).json({ Status: false, Error: "Employee ID and request month are required." });
    }

    try {
        // Format the date to ensure proper MySQL format
        const formattedDate = new Date(request_month + '-01').toISOString().split('T')[0];

        // Check if a request already exists for this month
        const checkSql = `
            SELECT * FROM salary_requests 
            WHERE employee_id = ? 
            AND DATE_FORMAT(request_month, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')
        `;

        pool.getConnection((err, connection) => {
          if (err) {
            console.error("Error getting connection:", err);
            return res.status(500).json({ Status: false, Error: "Database connection error" });
          }

          connection.query(checkSql, [employee_id, formattedDate], (checkErr, checkResult) => {
            if (checkErr) {
                console.error("Error checking existing request:", checkErr);
                return res.status(500).json({ Status: false, Error: "Database Error: " + checkErr.message });
            }

            if (checkResult.length > 0) {
                return res.status(400).json({ Status: false, Error: "A salary request for this month already exists." });
            }

            // Insert new request with formatted date
            const sql = "INSERT INTO salary_requests (employee_id, request_month) VALUES (?, ?)";
            connection.query(sql, [employee_id, formattedDate], (err, result) => {
                connection.release(); // Always release the connection

                if (err) {
                    console.error("Error inserting salary request:", err);
                    return res.status(500).json({ Status: false, Error: "Database Error: " + err.message });
                }
                return res.json({ Status: true, Message: "Salary request submitted successfully." });
            });
          });
        });
    } catch (error) {
        console.error("Error processing date:", error);
        return res.status(500).json({ Status: false, Error: "Invalid date format" });
    }
});

// Get salary requests for an employee
route.get('/salary_requests/:id', (req, res) => {
    const employeeId = req.params.id;
    const sql = `
        SELECT 
            sr.id,
            sr.request_month,
            sr.request_date,
            sr.status
        FROM salary_requests sr
        WHERE sr.employee_id = ?
        ORDER BY sr.request_month DESC
    `;

    pool.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting connection:", err);
        return res.status(500).json({ Status: false, Error: "Database connection error" });
      }

      connection.query(sql, [employeeId], (err, result) => {
        connection.release(); // Always release the connection

        if (err) {
            console.error("Error fetching salary requests:", err);
            return res.status(500).json({ Status: false, Error: "Database Error: " + err.message });
        }
        return res.json({ Status: true, Data: result });
      });
    });
});

// Update salary receipt status
route.put('/salary_receipt/:id', (req, res) => {
    const { id } = req.params;
    const { receipt_status } = req.body;

    // Validate inputs
    if (!id || isNaN(id)) {
        return res.status(400).json({ 
            Status: false, 
            Error: "Invalid request ID" 
        });
    }

    if (!receipt_status || !['Received', 'Not Received', 'Pending'].includes(receipt_status)) {
        return res.status(400).json({ 
            Status: false, 
            Error: "Invalid receipt status. Must be 'Received', 'Not Received', or 'Pending'" 
        });
    }

    // First check if request exists and is approved
    const checkSql = "SELECT status FROM salary_requests WHERE id = ?";
    pool.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting connection:", err);
        return res.status(500).json({ Status: false, Error: "Database connection error" });
      }

      connection.query(checkSql, [id], (checkErr, checkResult) => {
        if (checkErr) {
            console.error("Database error during check:", checkErr);
            return res.status(500).json({ 
                Status: false, 
                Error: "Database error during status check" 
            });
        }

        if (checkResult.length === 0) {
            return res.status(404).json({ 
                Status: false, 
                Error: "Salary request not found" 
            });
        }

        if (checkResult[0].status !== 'Approved') {
            return res.status(400).json({ 
                Status: false, 
                Error: "Can only update receipt status for approved requests" 
            });
        }

        // Update receipt status
        const updateSql = "UPDATE salary_requests SET receipt_status = ? WHERE id = ?";
        connection.query(updateSql, [receipt_status, id], (updateErr, updateResult) => {
            connection.release(); // Always release the connection

            if (updateErr) {
                console.error("Database error during update:", updateErr);
                return res.status(500).json({ 
                    Status: false, 
                    Error: "Failed to update receipt status" 
                });
            }

            if (updateResult.affectedRows === 0) {
                return res.status(404).json({ 
                    Status: false, 
                    Error: "Salary request not found" 
                });
            }

            return res.json({ 
                Status: true, 
                Message: "Receipt status updated successfully" 
            });
        });
      });
    });
});

// Get employee details
route.get("/detail/:id", (req, res) => {
    const employeeId = req.params.id;
    const sql = `
SELECT 
    e.id,
    e.name AS employee_name,
    e.email,
    e.salary,
    e.address,
    e.image,
    c.name AS department_name
FROM 
    employee e
LEFT JOIN 
    category c ON e.category_id = c.id
WHERE 
    e.id = 2;

    `;

    

    pool.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting connection:", err);
        return res.status(500).json({ Status: false, Error: "Database connection error" });
      }

      connection.query(sql, [employeeId], (err, result) => {
        connection.release(); // Always release the connection

        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ Status: false, Error: "Failed to fetch employee details" });
        }
        if (result.length === 0) {
            return res.status(404).json({ Status: false, Error: "Employee not found" });
        }
        return res.json({ Status: true, Data: result[0] });
      });
    });
});

// Get salary requests for an employee
route.get("/salary_requests/:id", (req, res) => {
    const employeeId = req.params.id;
    const sql = `
        SELECT 
            id, 
            request_date, 
            request_month, 
            status, 
            receipt_status 
        FROM salary_requests 
        WHERE employee_id = ?
        ORDER BY request_date DESC 
    `;

    pool.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting connection:", err);
        return res.status(500).json({ Status: false, Error: "Database connection error" });
      }

      connection.query(sql, [employeeId], (err, result) => {
        connection.release(); // Always release the connection

        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ Status: false, Error: "Failed to fetch salary requests" });
        }
        return res.json({ Status: true, Data: result });
      });
    });
});

// Get tasks for specific employee
route.get("/tasks/:id", (req, res) => {
  const sql = `
    SELECT id, description, status, created_at 
    FROM tasks 
    WHERE employee_id = ? 
    ORDER BY created_at DESC
  `;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting connection:", err);
      return res.status(500).json({ Status: false, Error: "Database connection error" });
    }

    connection.query(sql, [req.params.id], (err, result) => {
      connection.release(); // Always release the connection

      if (err) {
        console.error("Error fetching tasks:", err);
        return res.json({ Status: false, Error: "Failed to fetch tasks" });
      }
      return res.json({ Status: true, Data: result });
    });
  });
});

// Remove all other '/employee_edit/:id' and '/edit/:id' routes
// Keep only this single employee edit route
route.put('/employee_edit/:id', upload.single('image'), async (req, res) => {
    try {
        const id = req.params.id;
        const { name, email, address, password } = req.body;
        console.log("Received data:", { id, name, email, address, hasPassword: !!password });
        
        let updates = [];
        let values = [];

        // Handle text fields
        if (name) updates.push('name = ?'), values.push(name.trim());
        if (email) updates.push('email = ?'), values.push(email.trim());
        if (address) updates.push('address = ?'), values.push(address.trim());
        
        // Handle password
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push('password = ?');
            values.push(hashedPassword);
        }

        // Handle image upload - only if file is provided
        if (req.file && req.file.buffer) {
            updates.push('image_blob = ?');
            values.push(req.file.buffer);
        }

        if (updates.length === 0) {
            return res.json({ Status: false, Error: "No fields to update" });
        }

        // Add id to values array
        values.push(id);

        // Construct and execute update query
        const sql = `UPDATE employee SET ${updates.join(', ')} WHERE id = ?`;
        console.log("SQL Query:", sql, "Values:", values.map(v => v instanceof Buffer ? 'Buffer' : v));
        
        const [result] = await pool.promise().query(sql, values);

        if (result.affectedRows === 0) {
            return res.json({ Status: false, Error: "Employee not found" });
        }

        res.json({ Status: true, Message: "Profile updated successfully" });
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ Status: false, Error: "Server error: " + err.message });
    }
});

route.get("/detail/:id", verifyToken, (req, res) => {
  const employeeId = req.params.id;

  // Ensure employeeId is a valid integer to prevent SQL injection & invalid queries
  if (isNaN(employeeId)) {
    return res.status(400).json({ success: false, error: "Invalid employee ID" });
  }

  const sql = `
    SELECT 
      e.id AS employee_id,
      e.name AS employee_name,
      e.email,
      e.salary,
      e.address,
      e.image_blob,
      COALESCE(c.name, 'Not Assigned') AS department_name
    FROM employee e
    LEFT JOIN category c ON e.category_id = c.id
    WHERE e.id = ?
  `;

  pool.query(sql, [employeeId], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, error: "Failed to fetch employee details" });
    }
    
    if (result.length === 0) {
      return res.status(404).json({ success: false, error: "Employee not found" });
    }

    // Process employee data
    const employeeData = {
      employee_id: result[0].employee_id,
      name: result[0].employee_name,
      email: result[0].email,
      salary: result[0].salary,
      address: result[0].address,
      image_blob: Buffer.isBuffer(result[0].image_blob) 
        ? result[0].image_blob.toString("base64") 
        : null,
      department_name: result[0].department_name
    };

    return res.json({ success: true, data: employeeData });
  });
});

route.put('/employee_edit/:id', upload.single('image'), async (req, res) => {
    try {
        const id = req.params.id;
        const { name, email, address, password } = req.body;
        
        let updates = [];
        let values = [];

        // Handle text fields
        if (name) updates.push('name = ?'), values.push(name.trim());
        if (email) updates.push('email = ?'), values.push(email.trim());
        if (address) updates.push('address = ?'), values.push(address.trim());
        
        // Handle password
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push('password = ?');
            values.push(hashedPassword);
        }

        // Handle image upload - only if file is provided
        if (req.file && req.file.buffer) {
            updates.push('image_blob = ?');
            values.push(req.file.buffer);
        }

        if (updates.length === 0) {
            return res.json({ Status: false, Error: "No fields to update" });
        }

        values.push(id);
        const sql = `UPDATE employee SET ${updates.join(', ')} WHERE id = ?`;
        
        const [result] = await pool.promise().query(sql, values);

        if (result.affectedRows === 0) {
            return res.json({ Status: false, Error: "Employee not found" });
        }

        res.json({ Status: true, Message: "Profile updated successfully" });
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ Status: false, Error: "Server error: " + err.message });
    }
});

route.get("/detail/:id", verifyToken, (req, res) => {
  const employeeId = req.params.id;

  if (isNaN(employeeId)) {
    return res.status(400).json({ Status: false, Error: "Invalid employee ID" });
  }

  const sql = `
   SELECT 
    e.id,
    e.name AS employee_name,
    e.email,
    e.salary,
    e.address,
    e.image_blob,
    c.name AS department_name
FROM 
    employee e
LEFT JOIN 
    category c ON e.category_id = c.id
WHERE 
    e.id = ?;

  `;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting connection:", err);
      return res.status(500).json({ Status: false, Error: "Database connection error" });
    }

    connection.query(sql, [employeeId], (err, result) => {
      connection.release();

      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ Status: false, Error: "Failed to fetch employee details" });
      }

      if (result.length === 0) {
        return res.status(404).json({ Status: false, Error: "Employee not found" });
      }

      const employeeData = {
        ...result[0],
        department_name: result[0].department_name,
        image_blob: result[0].image_blob 
          ? Buffer.from(result[0].image_blob).toString('base64')
          : null
      };

      return res.json({ Status: true, Data: employeeData });
    });
  });
});

// Update the employee details query
route.get("/detail/:id", verifyToken, (req, res) => {
  const employeeId = req.params.id;

  if (isNaN(employeeId)) {
    return res.status(400).json({ Status: false, Error: "Invalid employee ID" });
  }

  const sql = `
    SELECT 
      e.id,
      e.name,
      e.email,
      e.salary,
      e.address,
      e.category_id,
      e.image_blob,
      c.name AS department_name
    FROM employee e
    LEFT JOIN category c ON e.category_id = c.id
    WHERE e.id = ?
  `;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting connection:", err);
      return res.status(500).json({ Status: false, Error: "Database connection error" });
    }

    connection.query(sql, [employeeId], (err, result) => {
      connection.release();

      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ Status: false, Error: "Failed to fetch employee details" });
      }

      if (result.length === 0) {
        return res.status(404).json({ Status: false, Error: "Employee not found" });
      }

      const employeeData = {
        ...result[0],
        image_blob: result[0].image_blob 
          ? Buffer.from(result[0].image_blob).toString('base64')
          : null
      };

      return res.json({ Status: true, Data: employeeData });
    });
  });
});

// Update the employees list query
route.get('/employees', (req, res) => {
    const sql = `
      SELECT 
        e.id, 
        e.name, 
        e.email, 
        e.salary, 
        e.address,
        e.category_id,
        c.name AS department_name
      FROM employee e
      LEFT JOIN category c ON e.category_id = c.id
    `;

    pool.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting connection:", err);
        return res.status(500).json({ Status: false, Error: "Database connection error" });
      }

      connection.query(sql, (err, result) => {
        connection.release(); // Always release the connection

        if (err) {
            console.error("Error fetching employees:", err.message); // Log detailed error
            return res.status(500).json({ Status: false, Error: "Query Error: " + err.message });
        }
        if (result.length === 0) {
            return res.status(404).json({ Status: false, Error: "No employees found", Data: [] }); // Return empty array
        }
        return res.json({ Status: true, Data: result }); // Ensure correct response structure
      });
    });
});

// Update the employee edit route
route.put('/employee_edit/:id', upload.single('image'), async (req, res) => {
    try {
        const id = req.params.id;
        const { name, email, address, password, salary, category_id } = req.body;
        
        let updates = [];
        let values = [];

        // Handle text fields
        if (name) updates.push('name = ?'), values.push(name.trim());
        if (email) updates.push('email = ?'), values.push(email.trim());
        if (address) updates.push('address = ?'), values.push(address.trim());
        if (salary) updates.push('salary = ?'), values.push(parseInt(salary, 10));
        if (category_id) updates.push('category_id = ?'), values.push(parseInt(category_id, 10));
        
        // Handle password
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push('password = ?');
            values.push(hashedPassword);
        }

        // Handle image upload
        if (req.file && req.file.buffer) {
            updates.push('image_blob = ?');
            values.push(req.file.buffer);
        }

        if (updates.length === 0) {
            return res.json({ Status: false, Error: "No fields to update" });
        }

        values.push(id);
        const sql = `UPDATE employee SET ${updates.join(', ')} WHERE id = ?`;
        
        const [result] = await pool.promise().query(sql, values);

        if (result.affectedRows === 0) {
            return res.json({ Status: false, Error: "Employee not found" });
        }

        res.json({ Status: true, Message: "Profile updated successfully" });
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ Status: false, Error: "Server error: " + err.message });
    }
});

// Update salary receipt status
route.put("/salary-receipt-update/:id", (req, res) => {
    const { id } = req.params;
    const { receipt_status, employee_id } = req.body;

    // Input validation
    if (!id || !receipt_status || !employee_id) {
        return res.status(400).json({
            Status: false,
            Error: "Missing required fields"
        });
    }

    // Validate status value
    if (!['Received', 'Not Received', 'Pending'].includes(receipt_status)) {
        return res.status(400).json({
            Status: false,
            Error: "Invalid receipt status"
        });
    }

    const sql = `
        UPDATE salary_requests 
        SET receipt_status = ? 
        WHERE id = ? 
        AND employee_id = ? 
        AND status = 'Completed'
    `;

    pool.getConnection((err, connection) => {
        if (err) {
            console.error("Database connection error:", err);
            return res.status(500).json({
                Status: false,
                Error: "Database connection failed"
            });
        }

        connection.query(sql, [receipt_status, id, employee_id], (err, result) => {
            connection.release();

            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({
                    Status: false,
                    Error: "Failed to update receipt status"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    Status: false,
                    Error: "Request not found or not eligible for update"
                });
            }

            return res.json({
                Status: true,
                Message: `Receipt status updated to ${receipt_status.toLowerCase()}`
            });
        });
    });
});

export default route;
