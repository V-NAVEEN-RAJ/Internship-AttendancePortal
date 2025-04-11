import React, { useState, useEffect } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import "./style.css";

function AttendancePortal() {
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [newAttendance, setNewAttendance] = useState({
    employee_id: "",
    attendance_date: "",
    attendance_time: "",
    out_time: "",
    attendance_status: "Present",
    final_status: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) fetchAttendanceRecords();
  }, [employees]);

  useEffect(() => {
    setFilteredRecords(attendanceRecords); // Initialize filtered records
  }, [attendanceRecords]);

  // Auto-refresh attendance records every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Auto-refreshing attendance records...");
      fetchAttendanceRecords();
    }, 60000); // 60 seconds

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  useEffect(() => {
    if (newAttendance.attendance_time && newAttendance.attendance_status === "Present") {
      const entryTime = new Date(`1970-01-01T${newAttendance.attendance_time}`);
      const cutoffTime = new Date(`1970-01-01T09:45:00`);
      setNewAttendance((prev) => ({
        ...prev,
        final_status: entryTime <= cutoffTime ? "On-time" : "Late",
      }));
    } else if (newAttendance.attendance_status === "Absent") {
      setNewAttendance((prev) => ({ ...prev, final_status: "Absent" }));
    }
  }, [newAttendance.attendance_time, newAttendance.attendance_status]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("https://cybernaut-attendanceportal.onrender.com/employee/employees");
      console.log("Fetched employees:", response.data); // Debugging log
      if (response.data && response.data.Status && Array.isArray(response.data.Data)) {
        setEmployees(response.data.Data); // Use the 'Data' property from the response
      } else {
        setMessage({ type: "error", text: "Invalid employee data received." });
      }
    } catch (error) {
      console.error("Error fetching employees:", error); // Debugging log
      setMessage({ type: "error", text: "Failed to load employees." });
    }
  };

  const fetchAttendanceRecords = async () => {
    setLoading(true);
    try {
      const response = await axios.get("https://cybernaut-attendanceportal.onrender.com/attendance/records");
      const records = response.data.Data || [];

      if (response.data.Message) {
        setMessage({ type: "info", text: response.data.Message }); // Show "No entries were inserted today"
      } else {
        setMessage(null); // Clear any previous messages
      }

      // Format the date for display
      const formattedRecords = records.map((record) => ({
        ...record,
        attendance_date: new Date(record.attendance_date).toLocaleDateString("en-GB"),
      }));

      setAttendanceRecords(formattedRecords);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load attendance records." });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const attendanceData = {
        employee_id: newAttendance.employee_id,
        date_of_attendance: newAttendance.attendance_date,
        in_time: newAttendance.attendance_time,
        status: newAttendance.attendance_status
    };

    fetch("https://cybernaut-attendanceportal.onrender.com/attendance/postattendance", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(attendanceData),
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.Status) {
            setMessage({ type: "success", text: "Attendance recorded successfully!" });
            fetchAttendanceRecords();
            setNewAttendance({
                employee_id: "",
                attendance_date: "",
                attendance_time: "",
                attendance_status: "Present",
                final_status: "",
            });
        } else {
            throw new Error(data.Error || "Failed to record attendance");
        }
    })
    .catch((error) => {
        console.error("Error submitting attendance:", error);
        setMessage({ type: "error", text: error.message });
    });
};

const handleUpdateOutTime = (recordId, currentOutTime) => {
    const newOutTime = prompt("Enter out time (HH:mm):", currentOutTime || "");
    
    if (!newOutTime) return; // User cancelled or entered empty value
    
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(newOutTime)) {
        setMessage({ type: "error", text: "Please enter time in HH:mm format" });
        return;
    }

    axios.put(
        `https://cybernaut-attendanceportal.onrender.com/attendance/update-out-time/${recordId}`,
        { out_time: newOutTime },
        { headers: { 'Content-Type': 'application/json' } }
    )
    .then(result => {
        if (result.data.Status) {
            setMessage({ type: "success", text: "Out time updated successfully!" });
            fetchAttendanceRecords(); // Refresh the records
        } else {
            throw new Error(result.data.Error || "Failed to update out time");
        }
    })
    .catch(err => {
        console.error("Error updating out time:", err);
        setMessage({ 
            type: "error", 
            text: err.response?.data?.Error || "Failed to update out time" 
        });
    });
};

  const handleFilter = (filter) => {
    if (filter === "all") {
      setFilteredRecords(attendanceRecords);
    } else {
      setFilteredRecords(attendanceRecords.filter((record) => record.status === filter));
    }
  };

  const downloadReport = () => {
    const csvContent = [
      ["Employee", "Date", "Time", "Out Time", "Status", "Final Status"],
      ...attendanceRecords.map((record) => [
        record.employee_name,
        record.attendance_date.split("T")[0],
        record.in_time || "N/A",
        record.out_time || "N/A",
        record.status,
        record.final_status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "attendance_report.csv");
  };

  const total = attendanceRecords.length;
  const present = attendanceRecords.filter((record) => record.status === "Present").length;
  const late = attendanceRecords.filter((record) => record.final_status === "Late").length;
  const absent = attendanceRecords.filter((record) => record.status === "Absent").length;

  return (
    <div className="container mt-4">
      <header className="text-center mb-4">
        <h1 className="display-5">Attendance Portal</h1>
        <p className="text-muted">Manage and track employee attendance efficiently</p>
      </header>

      <main>
        {message && <div className={`alert alert-${message.type} text-center`}>{message.text}</div>}

        {/* Horizontal Navigation Bar */}
        <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4 shadow-sm rounded">
          <div className="container-fluid">
            <div className="d-flex flex-wrap">
              <button className="btn btn-primary me-2 mb-2" onClick={() => handleFilter("all")}>
                Total: {total}
              </button>
              <button className="btn btn-success me-2 mb-2" onClick={() => handleFilter("Present")}>
                Present: {present}
              </button>
              <button className="btn btn-warning me-2 mb-2" onClick={() => handleFilter("Late")}>
                Late: {late}
              </button>
              <button className="btn btn-danger me-2 mb-2" onClick={() => handleFilter("Absent")}>
                Absent: {absent}
              </button>
            </div>
            <div className="d-flex">
              <button className="btn btn-info me-2 mb-2" onClick={downloadReport}>
                Download CSV Report
              </button>
              <button className="btn btn-secondary mb-2" onClick={() => navigate("/report")}>
                Report Section
              </button>
            </div>
          </div>
        </nav>

        <section className="mb-5">
          <h2 className="h4 mb-3">Add Attendance</h2>
          <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
            <div className="mb-3">
              <label className="form-label">Employee:</label>
              <select
                className="form-select"
                value={newAttendance.employee_id || ""}
                onChange={(e) => {
                  const selectedId = parseInt(e.target.value, 10);
                  setNewAttendance({ ...newAttendance, employee_id: Number.isInteger(selectedId) && selectedId > 0 ? selectedId : "" });
                }}
                required
              >
                <option value="">Select Employee</option>
                {employees.length > 0 ? (
                  employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))
                ) : (
                  <option value="">No employees available</option>
                )}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Date:</label>
              <input
                type="date"
                className="form-control"
                value={newAttendance.attendance_date}
                onChange={(e) => setNewAttendance({ ...newAttendance, attendance_date: e.target.value })}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Time:</label>
              <input
                type="time"
                className="form-control"
                value={newAttendance.attendance_time}
                onChange={(e) => setNewAttendance({ ...newAttendance, attendance_time: e.target.value })}
                disabled={newAttendance.attendance_status === "Absent"}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Status:</label>
              <select
                className="form-select"
                value={newAttendance.attendance_status}
                onChange={(e) => setNewAttendance({ ...newAttendance, attendance_status: e.target.value })}
                required
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </button>
          </form>
        </section>

        <section>
          <h2 className="h4 mb-3">Attendance Records</h2>
          {message && <div className={`alert alert-${message.type} text-center`}>{message.text}</div>}
          {loading ? (
            <p className="text-center">Loading attendance records...</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover shadow-sm">
                <thead className="table-light">
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Out Time</th>
                    <th>Status</th>
                    <th>Final Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.length > 0 ? (
                    attendanceRecords.map((record) => (
                      <tr key={record.id}>
                        <td>{record.employee_name || "Unknown"}</td>
                        <td>{record.attendance_date}</td>
                        <td>{record.in_time || "N/A"}</td>
                        <td>
                          {record.out_time || "Not logged"}
                        </td>
                        <td>{record.status || "N/A"}</td>
                        <td>{record.final_status}</td>
                        <td>
                          {record.out_time ? (
                            <span className="badge bg-success">Attendance Recorded</span>
                          ) : (
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => handleUpdateOutTime(record.id, record.out_time)}
                            >
                              Update Out Time
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center">No attendance records available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AttendancePortal;
