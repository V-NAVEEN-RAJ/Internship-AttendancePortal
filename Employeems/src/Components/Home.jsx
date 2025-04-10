import axios from "axios";
import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

axios.defaults.baseURL = 'http://localhost:3000';
axios.defaults.withCredentials = true;

// Add interceptor for error handling
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error?.response?.data || error.message);
    throw error;
  }
);

const Home = () => {
  const [adminTotal, setAdminTotal] = useState(0);
  const [employeeTotal, setEmployeeTotal] = useState(0);
  const [salaryTotal, setSalaryTotal] = useState(0);
  const [admins, setAdmins] = useState([]);
  const [message, setMessage] = useState(null);
  const [employees, setEmployees] = useState([]); // Add this state

  const fetchData = async (endpoint) => {
    try {
      const response = await axios.get(endpoint);
      if (response.data.Status) {
        return response.data.Result;
      }
      throw new Error(response.data.Error || `Failed to fetch data from ${endpoint}`);
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      setMessage({
        type: "error",
        text: err.response?.data?.Error || err.message
      });
      return [];
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          adminCount(),
          employeeCount(),
          salaryCount(),
          fetchData('/admin/admins').then(setAdmins),
          fetchData('/admin/employee_details').then(setEmployees)
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
        setMessage({
          type: "error",
          text: "Failed to load dashboard data"
        });
      }
    };
    loadData();
  }, []);

  const adminCount = async () => {
    try {
      const response = await axios.get('/admin/admin_count');
      if (response.data.Status) {
        setAdminTotal(response.data.Result[0].admin);
      }
    } catch (err) {
      console.error('Error fetching admin count:', err);
      setMessage({ type: "error", text: "Failed to load admin count" });
    }
  };

  const employeeCount = async () => {
    try {
      const result = await axios.get("/employee/employees");
      if (result.data.Status && Array.isArray(result.data.Data)) {
        setEmployeeTotal(result.data.Data.length);
      } else {
        console.error("Unexpected response structure:", result.data);
        setEmployeeTotal(0);
      }
    } catch (error) {
      console.error("Error fetching employee count:", error);
      setEmployeeTotal(0);
    }
  };

  const salaryCount = async () => {
    try {
      const result = await axios.get("/admin/salary_count");
      if (result.data.Status) {
        setSalaryTotal(result.data.Result[0].salaryOFEmp);
      }
    } catch (error) {
      console.error("Error fetching salary count:", error);
    }
  };

  return (
    <div
      className="container-fluid p-0"
      style={{
        backgroundColor: "#f8f9fa", // Light gray background for better contrast
      }}
    >
      <div className="container mt-5">
        <header className="text-center mb-4">
          <h1 className="display-4" style={{ color: "#2c3e50" }}>Overall Employee Details </h1> {/* Dark blue-gray for header */}
          <p className="text-muted">Overview of system statistics</p>
        </header>

        <div className="row g-4">
          <div className="col-lg-4 col-md-6">
            <div className="card shadow-sm border-0" style={{ backgroundColor: "#ffffff" }}> {/* White background for cards */}
              <div className="card-body text-center">
                <h5 className="card-title" style={{ color: "#2c3e50" }}>Admins</h5> {/* Dark blue-gray for text */}
                <p className="card-text fs-4 fw-bold" style={{ color: "#007bff" }}>{adminTotal}</p> {/* Blue for numbers */}
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-md-6">
            <div className="card shadow-sm border-0" style={{ backgroundColor: "#ffffff" }}>
              <div className="card-body text-center">
                <h5 className="card-title" style={{ color: "#2c3e50" }}>Employees</h5>
                <p className="card-text fs-4 fw-bold" style={{ color: "#007bff" }}>{employeeTotal}</p>
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-md-12">
            <div className="card shadow-sm border-0" style={{ backgroundColor: "#ffffff" }}>
              <div className="card-body text-center">
                <h5 className="card-title" style={{ color: "#2c3e50" }}>Total Salary</h5>
                <p className="card-text fs-4 fw-bold" style={{ color: "#007bff" }}>₹{salaryTotal}</p>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className={`alert alert-${message.type} mt-4`} role="alert">
            {message.text}
          </div>
        )}

        <section className="mt-5">
          <h3 className="text-center mb-3" style={{ color: "#2c3e50" }}>Admin List</h3>
          {admins.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-bordered table-hover bg-white">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{a.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // Muted text for no data
            <p className="text-center" style={{ color: "#6c757d" }}>No Admins Found</p>
          )}
        </section>

        {/* Employee List Section */}
        <section className="mt-5">
          <h3 className="text-center mb-3" style={{ color: "#2c3e50" }}>Employee List</h3>
          {employees.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-bordered table-hover bg-white">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, index) => (
                    <tr key={emp.id}>
                      <td>{index + 1}</td>
                      <td>{emp.name || 'N/A'}</td>
                      <td>{emp.email || 'N/A'}</td>
                      <td>{emp.category_name || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center" style={{ color: "#6c757d" }}>No Employees Found</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;
