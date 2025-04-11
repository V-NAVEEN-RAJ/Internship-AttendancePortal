import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const Employee = () => {
  const [employee, setEmployee] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = () => {
    axios
      .get("https://cybernaut-attendanceportal.onrender.com/admin/employee")
      .then((result) => {
        if (result.data.Status) {
          setEmployee(result.data.Result);
        } else {
          alert(result.data.Error || "Failed to fetch employees.");
        }
      })
      .catch((err) => console.error("Error fetching employees:", err));
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      axios
        .delete(`https://cybernaut-attendanceportal.onrender.com/admin/delete_employee/${id}`)
        .then((result) => {
          if (result.data.Status) {
            setMessage({ type: "success", text: "Employee deleted successfully." });
            fetchEmployees(); // Refresh the employee list
          } else {
            setMessage({ type: "error", text: result.data.Error || "Failed to delete employee." });
          }
        })
        .catch((err) => {
          console.error("Error deleting employee:", err);
          setMessage({ type: "error", text: "Failed to delete employee." });
        });
    }
  };

  return (
    <div className="container-fluid px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Employee List</h3>
        <Link to="/dashboard/add_employee" className="btn btn-primary">
          Add Employee
        </Link>
      </div>

      {message && (
        <div className={`alert alert-${message.type} mb-4`} role="alert">
          {message.text}
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead>
            <tr>
              <th>Name</th>
              <th>Image</th>
              <th>Email</th>
              <th>Address</th>
              <th>Salary</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employee.length > 0 ? (
              employee.map((e) => (
                <tr key={e.id}>
                  <td className="align-middle">{e.name}</td>
                  <td className="text-center align-middle">
                    <img
                      src={
                        e.image_blob
                          ? `data:image/jpeg;base64,${e.image_blob}`
                          : "https://cybernaut-attendanceportal.onrender.com/Images/default.png"
                      }
                      className="employee_image"
                      alt={e.name}
                      onError={(event) => {
                        event.target.src = "https://cybernaut-attendanceportal.onrender.com/Images/default.png";
                      }}
                    />
                  </td>
                  <td className="align-middle">{e.email}</td>
                  <td className="align-middle">{e.address}</td>
                  <td className="align-middle">{e.salary}</td>
                  <td className="align-middle">{e.department}</td>
                  <td className="align-middle">
                    <div className="d-flex gap-2 justify-content-center">
                      <Link
                        to={`/dashboard/edit_employee/${e.id}`}
                        className="btn btn-warning btn-sm"
                      >
                        Edit
                      </Link>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(e.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center">No employees found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add any additional styles here */}
      <style>
        {`
          @media (max-width: 768px) {
            .employee_image {
              width: 40px;
              height: 40px;
            }
            .btn {
              font-size: 0.9rem;
              padding: 6px 12px;
            }
            .table th, .table td {
              font-size: 0.9rem;
              padding: 8px;
            }
          }
          @media (max-width: 576px) {
            .employee_image {
              width: 30px;
              height: 30px;
            }
            .btn {
              font-size: 0.8rem;
              padding: 5px 10px;
            }
            .table th, .table td {
              font-size: 0.8rem;
              padding: 6px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Employee;
