import React, { useState, useEffect, useRef } from "react";
import { Link, Outlet } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import logo from "../assets/logo.png"; // Ensure logo path is correct
import "./style.css";

const Dashboard = () => {
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const sidebarRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/";
  };

  const handleOutsideClick = (event) => {
    if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
      setSidebarVisible(false);
    }
  };

  useEffect(() => {
    if (isSidebarVisible) {
      document.addEventListener("mousedown", handleOutsideClick);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isSidebarVisible]);

  return (
    <div className="d-flex flex-column">
      <nav className="navbar navbar-dark bg-dark">
        <div className="container-fluid">
          <span className="navbar-brand mx-auto text-center fw-bold fs-4">
            Admin Dashboard
          </span>
          <button
            className="btn btn-dark"
            onClick={() => setSidebarVisible(!isSidebarVisible)}
          >
            <i className="bi bi-list"></i>
          </button>
        </div>
      </nav>

      <div className="d-flex">
        {/* Main Content */}
        <div
          className="content w-100"
          style={{
            marginRight: isSidebarVisible ? "300px" : "0",
            padding: "20px",
            minHeight: "calc(100vh - 56px)",
            backgroundColor: "#f4f6f9",
            color: "#000",
            transition: "margin-right 0.3s ease",
          }}
        >
          <Outlet />
        </div>

        {/* Vertical Sidebar */}
        {isSidebarVisible && (
          <div
            ref={sidebarRef}
            className="bg-dark text-white p-3"
            style={{
              width: "300px",
              height: "100vh",
              position: "fixed",
              right: 0,
              top: 0,
              overflowY: "auto",
              zIndex: 1030,
            }}
          >
            <div className="text-center mb-4">
              <img src={logo} alt="Company Logo" style={{ height: "60px" }} />
            </div>
            <ul className="nav flex-column mt-4">
              {[
                { path: "/dashboard", text: "Dashboard" },
                { path: "/dashboard/employee", text: "Manage Employees" },
                { path: "/dashboard/category", text: "Category" },
                { path: "/dashboard/attendancesystem", text: "Attendance System" },
                { path: "/dashboard/salary_requests", text: "Salary Requests" },
                { path: "/dashboard/tasks", text: "Manage Tasks" }, // New menu item
              ].map((item, index) => (
                <li className="nav-item mb-3" key={index}>
                  <Link
                    to={item.path}
                    className="btn btn-primary w-100"
                    onClick={() => setSidebarVisible(false)}
                  >
                    {item.text}
                  </Link>
                </li>
              ))}
              <li className="nav-item">
                <button
                  className="btn btn-danger w-100"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
