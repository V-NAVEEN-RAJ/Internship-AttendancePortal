import React from "react";
import { useNavigate } from "react-router-dom";

const Start = () => {
  const navigate = useNavigate();

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 loginPage">
      <div
        className="p-4 rounded border loginForm w-100 mx-3 mx-md-0"
        style={{ maxWidth: "400px" }}
      >
        <h2 className="text-center">Login As</h2>
        <div className="d-flex justify-content-between mt-5 mb-2">
          <button
            type="button"
            className="btn btn-primary w-45"
            onClick={() => navigate("/employee_login")}
          >
            Employee
          </button>
          <button
            type="button"
            className="btn btn-success w-45"
            onClick={() => navigate("/adminlogin")}
          >
            Admin
          </button>
        </div>
      </div>
    </div>
  );
};

export default Start;
