import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState(null);
  const [employee, setEmployee] = useState({
    name: "",
    email: "",
    address: "",
    category_id: "",
  });

  useEffect(() => {
    // Fetch employee details
    axios.get(`https://cybernaut-attendanceportal.onrender.com/admin/employee/${id}`)
      .then(result => {
        if (result.data.Status && result.data.Result.length > 0) {
          const emp = result.data.Result[0];
          setEmployee({
            name: emp.name || "",
            email: emp.email || "",
            address: emp.address || "",
            category_id: emp.category_id || "",
          });
        }
      })
      .catch(err => {
        console.error("Error fetching employee:", err);
        setMessage({ type: "error", text: "Failed to load employee details" });
      });

    // Fetch categories
    axios.get("https://cybernaut-attendanceportal.onrender.com/admin/category")
      .then(result => {
        if (result.data.Status) {
          setCategories(result.data.Result);
        }
      })
      .catch(err => {
        console.error("Error fetching categories:", err);
      });
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    axios.put(`https://cybernaut-attendanceportal.onrender.com/admin/edit_employee/${id}`, employee)
      .then(result => {
        if (result.data.Status) {
          setMessage({ type: "success", text: "Employee updated successfully" });
          setTimeout(() => navigate('/dashboard/employee'), 1500);
        } else {
          setMessage({ type: "error", text: result.data.Error });
        }
      })
      .catch(err => {
        console.error("Error updating employee:", err);
        setMessage({ type: "error", text: "Failed to update employee" });
      });
  };

  return (
    <div className="d-flex justify-content-center align-items-center mt-3">
      <div className="p-3 rounded w-50 border">
        <h3 className="text-center">Edit Details</h3>
        <form className="row g-1" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-control"
              value={employee.name}
              onChange={(e) => setEmployee({...employee, name: e.target.value})}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={employee.email}
              onChange={(e) => setEmployee({...employee, email: e.target.value})}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Address</label>
            <textarea
              className="form-control"
              value={employee.address}
              onChange={(e) => setEmployee({...employee, address: e.target.value})}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={employee.category_id}
              onChange={(e) => setEmployee({...employee, category_id: e.target.value})}
              required
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary">
            Update Employee
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditEmployee;
