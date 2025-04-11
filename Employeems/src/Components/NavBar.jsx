import React from 'react';
import { useNavigate } from 'react-router-dom';

const NavBar = ({ title, onToggleSidebar, showLogout = true }) => {
  const navigate = useNavigate();

  return (
    <nav className="navbar sticky-top" style={{
      backgroundColor: '#212A3E', // Professional dark navy color
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      color: 'white'
    }}>
      <div className="container-fluid">
        <span className="navbar-brand text-white mx-auto text-center fw-bold fs-4">
          {title}
        </span>
        <div className="d-flex align-items-center">
          {showLogout && (
            <button 
              className="btn btn-outline-light me-2" 
              onClick={() => {
                localStorage.removeItem("valid");
                localStorage.removeItem("employeeId");
                document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                navigate("/");
              }}
            >
              <i className="bi bi-box-arrow-right"></i> Logout
            </button>
          )}
          {onToggleSidebar && (
            <button
              className="btn text-white"
              onClick={onToggleSidebar}
            >
              <i className="bi bi-list fs-4"></i>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
