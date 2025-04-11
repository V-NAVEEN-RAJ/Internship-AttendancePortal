import React, { useState, useEffect, useRef } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import logo from "../assets/logo.png"; // Ensure logo path is correct
import "./style.css";
import AdminManagement from './AdminManagement';
import NavBar from './NavBar';

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
      <NavBar 
        title="Admin Dashboard"
        onToggleSidebar={() => setSidebarVisible(!isSidebarVisible)}
      />
      
      <div className="d-flex">
        {/* Main Content */}
        <div
          className="content w-100"
          style={{
            marginRight: isSidebarVisible ? "300px" : "0",
            padding: "20px",
            minHeight: "calc(100vh - 56px)",
            backgroundColor: "#f4f6f9",
            transition: "margin-right 0.3s ease",
          }}
        >
          <Outlet />  {/* Add this line to render nested routes */}
        </div>

        {/* Vertical Sidebar */}
        {isSidebarVisible && (
          <div
            ref={sidebarRef}
            style={{
              width: "300px",
              height: "100vh",
              position: "fixed",
              right: 0,
              top: 0,
              overflowY: "auto",
              zIndex: 1020,
              backgroundColor: "#2B3A55", // Professional darker shade
              boxShadow: "-2px 0 5px rgba(0,0,0,0.2)"
            }}
            className="p-3"
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
                { path: "/dashboard/admin-management", text: "Admin Management" }, // New menu item
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
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
