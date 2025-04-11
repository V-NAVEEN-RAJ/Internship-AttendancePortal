import express from "express";
import con from "../Config/db.js";
import cron from "node-cron";

const route = express.Router();

// Fetch attendance records
route.get("/records", (req, res) => {
    const today = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format
    const sql = `
        SELECT 
            attendance.id,
            employee.name AS employee_name,
            attendance.date_of_attendance AS attendance_date,
            attendance.in_time,
            attendance.out_time,
            attendance.status,
            attendance.final_status
        FROM attendance
        JOIN employee ON attendance.employee_id = employee.id
        WHERE attendance.date_of_attendance = ?
    `;

    con.query(sql, [today], (err, result) => {
        if (err) {
            console.error("Error fetching attendance records:", err.message);
            return res.status(500).json({ Status: false, Error: "Query Error: " + err.message });
        }
        if (result.length === 0) {
            return res.json({ Status: true, Message: "No entries were inserted today", Data: [] });
        }
        return res.json({ Status: true, Data: result });
    });
});

// Fetch attendance records for the report
route.get("/report", (req, res) => {
    const { startDate, endDate, employeeId } = req.query;

    let sql = `
        SELECT 
            attendance.id,
            employee.name AS employee_name,
            DATE_FORMAT(attendance.date_of_attendance, '%Y-%m-%d') AS attendance_date,
            attendance.in_time,
            attendance.out_time,
            attendance.status,
            attendance.final_status
        FROM attendance
        JOIN employee ON attendance.employee_id = employee.id
        WHERE attendance.date_of_attendance BETWEEN ? AND ?
    `;

    const params = [startDate, endDate];

    if (employeeId) {
        sql += " AND attendance.employee_id = ?";
        params.push(employeeId);
    }

    con.query(sql, params, (err, result) => {
        if (err) {
            console.error("Error fetching report:", err.message);
            return res.status(500).json({ Status: false, Error: "Query Error: " + err.message });
        }
        return res.json({ Status: true, Data: result });
    });
});

// Add attendance record
route.post("/postattendance", (req, res) => {
    const { employee_id, date_of_attendance, in_time, status } = req.body;

    if (!employee_id || !date_of_attendance || !in_time || !status) {
        return res.status(400).json({ Status: false, Error: "Missing required fields" });
    }

    const parsedEmployeeId = parseInt(employee_id, 10);
    if (isNaN(parsedEmployeeId) || parsedEmployeeId <= 0) {
        return res.status(400).json({ Status: false, Error: "Invalid employee_id. Must be a positive integer." });
    }

    // First check if employee exists
    const checkEmployeeSql = "SELECT id FROM employee WHERE id = ?";
    con.query(checkEmployeeSql, [parsedEmployeeId], (empErr, empResult) => {
        if (empErr) {
            console.error("Error checking employee:", empErr.message);
            return res.status(500).json({ Status: false, Error: "Database Error: " + empErr.message });
        }

        if (empResult.length === 0) {
            return res.status(400).json({ Status: false, Error: "Employee does not exist" });
        }

        // Then check for duplicate attendance
        const checkSql = `SELECT * FROM attendance WHERE employee_id = ? AND date_of_attendance = ?`;
        con.query(checkSql, [parsedEmployeeId, date_of_attendance], (checkErr, checkResult) => {
            if (checkErr) {
                console.error("Error checking duplicate attendance:", checkErr.message);
                return res.status(500).json({ Status: false, Error: "Database Error: " + checkErr.message });
            }

            if (checkResult.length > 0) {
                return res.status(400).json({ Status: false, Error: "Attendance record already exists for this employee on the given date." });
            }

            let final_status = status === "Present" ? 
                (new Date(`1970-01-01T${in_time}`) <= new Date(`1970-01-01T09:45:00`) ? "On-time" : "Late") 
                : "Absent";

            const sql = `
                INSERT INTO attendance (employee_id, date_of_attendance, in_time, out_time, status, final_status)
                VALUES (?, ?, ?, '', ?, ?)
            `;

            con.query(sql, [parsedEmployeeId, date_of_attendance, in_time, status, final_status], (err, result) => {
                if (err) {
                    console.error("Error inserting attendance:", err.message);
                    return res.status(500).json({ Status: false, Error: "Database Error: " + err.message });
                }
                return res.json({ Status: true, Message: "Attendance recorded successfully" });
            });
        });
    });
});

// Add new route specifically for updating out_time
route.put("/update-out-time/:id", (req, res) => {
    const { id } = req.params;
    const { out_time } = req.body;

    if (!out_time) {
        return res.status(400).json({ Status: false, Error: "Out time is required" });
    }

    const updateSql = "UPDATE attendance SET out_time = ? WHERE id = ?";
    
    con.query(updateSql, [out_time, id], (err, result) => {
        if (err) {
            console.error("Error updating out time:", err);
            return res.status(500).json({ Status: false, Error: "Database Error: " + err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ Status: false, Error: "Attendance record not found" });
        }

        return res.json({ Status: true, Message: "Out time updated successfully" });
    });
});

// Edit attendance record
route.put("/editattendance/:id", (req, res) => {
    const { id } = req.params;
    const { out_time } = req.body;

    if (!out_time) {
        return res.status(400).json({ Status: false, Error: "Out time is required" });
    }

    // First check if record exists
    const checkSql = "SELECT * FROM attendance WHERE id = ?";
    con.query(checkSql, [id], (checkErr, checkResult) => {
        if (checkErr) {
            console.error("Error checking attendance:", checkErr);
            return res.status(500).json({ Status: false, Error: "Database Error" });
        }

        if (checkResult.length === 0) {
            return res.status(404).json({ Status: false, Error: "Attendance record not found" });
        }

        // Update only the out_time
        const updateSql = "UPDATE attendance SET out_time = ? WHERE id = ?";
        con.query(updateSql, [out_time, id], (err, result) => {
            if (err) {
                console.error("Error updating out time:", err);
                return res.status(500).json({ Status: false, Error: "Database Error: " + err.message });
            }
            return res.json({ Status: true, Message: "Out time updated successfully" });
        });
    });
});

// Schedule a task to archive and clear attendance records at 5:00 AM daily
cron.schedule("0 5 * * *", () => {
    console.log("Archiving and clearing attendance records...");

    const archiveSql = `
        INSERT INTO attendance_archive (employee_id, date_of_attendance, in_time, out_time, status, final_status)
        SELECT employee_id, date_of_attendance, in_time, out_time, status, final_status
        FROM attendance
    `;

    const clearSql = "DELETE FROM attendance";

    con.query(archiveSql, (archiveErr) => {
        if (archiveErr) {
            console.error("Error archiving attendance records:", archiveErr.message);
            return;
        }

        con.query(clearSql, (clearErr) => {
            if (clearErr) {
                console.error("Error clearing attendance records:", clearErr.message);
                return;
            }

            console.log("Attendance records archived and cleared successfully.");
        });
    });
});

// Fetch attendance stats for a specific date
route.get("/stats", (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ Status: false, Error: "Date is required" });
  }

  const sql = `
    SELECT 
      SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present,
      SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent,
      SUM(CASE WHEN final_status = 'Late' THEN 1 ELSE 0 END) AS late
    FROM attendance
    WHERE date_of_attendance = ?
  `;

  con.query(sql, [date], (err, result) => {
    if (err) {
      console.error("Error fetching attendance stats:", err.message);
      return res.status(500).json({ Status: false, Error: "Database Error: " + err.message });
    }
    return res.json({ Status: true, Data: result[0] });
  });
});

// Fetch attendance details for a specific employee
route.get("/details/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT id, date_of_attendance, in_time, out_time, status, final_status
    FROM attendance
    WHERE employee_id = ?
  `;

  con.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error fetching attendance details:", err.message);
      return res.status(500).json({ Status: false, Error: "Database Error: " + err.message });
    }
    return res.json({ Status: true, Data: result });
  });
});

// Get attendance details for a specific employee
route.get("/details/:id", (req, res) => {
    const employeeId = req.params.id;
    const sql = `
        SELECT 
            id, 
            date_of_attendance, 
            in_time, 
            out_time, 
            status, 
            final_status 
        FROM attendance 
        WHERE employee_id = ?
        ORDER BY date_of_attendance DESC
    `;

    con.query(sql, [employeeId], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ Status: false, Error: "Failed to fetch attendance details" });
        }
        return res.json({ Status: true, Data: result });
    });
});

// Get attendance stats for a specific date
route.get("/stats", (req, res) => {
    const { date } = req.query;
    if (!date) {
        return res.status(400).json({ Status: false, Error: "Date parameter is required" });
    }

    const sql = `
        SELECT 
            COUNT(CASE WHEN status = 'Present' THEN 1 END) as present_count,
            COUNT(CASE WHEN status = 'Absent' THEN 1 END) as absent_count,
            COUNT(CASE WHEN final_status = 'Late' THEN 1 END) as late_count
        FROM attendance 
        WHERE DATE(date_of_attendance) = ?
    `;

    con.query(sql, [date], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ Status: false, Error: "Failed to fetch attendance stats" });
        }
        return res.json({ Status: true, Data: result[0] });
    });
});

export default route;


