import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // Import the plugin

function ReportSection() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [reportData, setReportData] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("http://localhost:3000/employee/employees"); // Ensure full URL
      if (response.data && response.data.Status === true && Array.isArray(response.data.Data)) {
        setEmployees(response.data.Data);
      } else {
        console.error("Invalid employee data received:", response.data); // Log unexpected data
        alert("Failed to fetch employees. Invalid data received from the server.");
      }
    } catch (error) {
      console.error("Error fetching employees:", error.message); // Log error details
      alert("Failed to fetch employees. Please check your network connection or contact support.");
    }
  };

  const fetchReport = async () => {
    try {
      const response = await axios.get("http://localhost:3000/attendance/report", {
        params: { startDate, endDate, employeeId },
      });

      const records = response.data.Data || [];

      // Format the date for display
      const formattedRecords = records.map((record) => ({
        ...record,
        attendance_date: new Date(record.attendance_date).toLocaleDateString("en-GB"), // Format date as DD-MM-YYYY
      }));

      setReportData(formattedRecords);
    } catch (error) {
      console.error("Error fetching report:", error);
      setMessage({ type: "error", text: "Failed to fetch report data." });
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, { // Use the plugin
      head: [["Employee", "Date", "Time", "Out Time", "Status", "Final Status"]],
      body: reportData.map((record) => [
        record.employee_name,
        record.attendance_date,
        record.in_time || "N/A",
        record.out_time || "N/A",
        record.status,
        record.final_status,
      ]),
    });

    if (startDate && endDate) {
      const totalDays = reportData.length;
      const presentDays = reportData.filter((r) => r.status === "Present").length;
      const percentage = ((presentDays / totalDays) * 100).toFixed(2);
      doc.text(`Overall Attendance Percentage: ${percentage}%`, 14, doc.lastAutoTable.finalY + 10);
    }

    doc.save("attendance_report.pdf");
  };

  return (
    <div className="container mt-4">
      <header className="text-center mb-4">
        <h1 className="display-5">Report Section</h1>
        <p className="text-muted">Generate and download attendance reports</p>
      </header>

      <main>
        <div className="card p-4 shadow-sm mb-4">
          <h2 className="h5 mb-3">Filter Options</h2>
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Start Date:</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">End Date:</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Employee:</label>
              <select
                className="form-select"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              >
                <option value="">All Employees</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="d-flex justify-content-between">
            <button className="btn btn-primary" onClick={fetchReport}>
              Generate Report
            </button>
            <button className="btn btn-success" onClick={downloadPDF}>
              Download PDF
            </button>
          </div>
        </div>

        <section>
          <h2 className="h5 mb-3">Report Data</h2>
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
                </tr>
              </thead>
              <tbody>
                {reportData.map((record) => (
                  <tr key={record.id}>
                    <td>{record.employee_name}</td>
                    <td>{record.attendance_date}</td> {/* Display the formatted date */}
                    <td>{record.in_time || "N/A"}</td>
                    <td>{record.out_time || "N/A"}</td>
                    <td>{record.status}</td>
                    <td>{record.final_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ReportSection;
