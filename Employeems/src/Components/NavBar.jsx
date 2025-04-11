import React from 'react';
import { useNavigate } from 'react-router-dom';

const NavBar = ({ title, onToggleSidebar, showLogout = true }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("valid");
    localStorage.removeItem("employeeId");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate("/");
  };

  return (
    <nav className="navbar navbar-dark bg-dark sticky-top">
      <div className="container-fluid">
        <span className="navbar-brand mx-auto text-center fw-bold fs-4">
          {title}
        </span>
        <div className="d-flex align-items-center">
          {showLogout && (
            <button 
              className="btn btn-outline-light me-2" 
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right"></i> Logout
            </button>
          )}
          {onToggleSidebar && (
            <button
              className="btn btn-dark"
              onClick={onToggleSidebar}
            >
              <i className="bi bi-list"></i>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
