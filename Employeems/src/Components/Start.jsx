import React from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";

const Start = () => {
  const navigate = useNavigate();

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 loginPage">
      <div 
        className="p-5 rounded border loginForm w-100 mx-3 mx-md-0"
        style={{ 
          maxWidth: "400px",
          background: "rgba(255, 255, 255, 0.95)",
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
          backdropFilter: "blur(4px)",
          border: "1px solid rgba(255, 255, 255, 0.18)"
        }}
      >
        <div className="text-center mb-5">
          <img 
            src="/logo.png" 
            alt="Company Logo" 
            style={{ 
              width: "120px", 
              marginBottom: "20px" 
            }}
          />
          <h2 className="fw-bold text-dark mb-3">Welcome to Cybernaut EMS</h2>
          <p className="text-muted">Please select your role to continue</p>
        </div>

        <div className="d-flex flex-column gap-3">
          <button
            className="btn btn-primary py-3 fw-bold"
            style={{
              backgroundColor: "#4CAF50",
              border: "none",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) => e.target.style.transform = "translateY(-2px)"}
            onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
            onClick={() => navigate("/employee_login")}
          >
            <i className="bi bi-person-workspace me-2"></i>
            Login as Employee
          </button>

          <button
            className="btn btn-primary py-3 fw-bold"
            style={{
              backgroundColor: "#2196F3",
              border: "none",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) => e.target.style.transform = "translateY(-2px)"}
            onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
            onClick={() => navigate("/adminlogin")}
          >
            <i className="bi bi-shield-lock me-2"></i>
            Login as Admin
          </button>
        </div>
      </div>
    </div>
  );
};

export default Start;
