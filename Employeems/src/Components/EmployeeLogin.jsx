import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const EmployeeLogin = () => {
  const [values, setValues] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    axios.post('https://cybernaut-attendanceportal.onrender.com/employee/employee_login', {
      email: values.email,
      password: values.password
    })
    .then(result => {
      if (result.data.loginStatus) {
        localStorage.setItem("valid", true);
        localStorage.setItem("employeeId", result.data.id);
        localStorage.setItem("employeeData", JSON.stringify(result.data.userData));
        navigate(`/employee_detail/${result.data.id}`);
      } else {
        alert(result.data.Error);
      }
    })
    .catch(err => {
      console.error("Error during login:", err);
      alert(err.response?.data?.Error || "Login failed");
    });
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 loginPage">
      <div
        className="p-4 rounded border loginForm w-100 mx-3 mx-md-0"
        style={{ maxWidth: "400px" }}
      >
        <h2 className="text-center">Employee Login</h2>
        {error && <div className="text-danger text-center mb-3">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email:
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-control"
              placeholder="Enter your email"
              value={values.email}
              onChange={(e) => setValues({ ...values, email: e.target.value })}
              autoComplete="email"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password:
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-control"
              placeholder="Enter your password"
              value={values.password}
              onChange={(e) => setValues({ ...values, password: e.target.value })}
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmployeeLogin;
