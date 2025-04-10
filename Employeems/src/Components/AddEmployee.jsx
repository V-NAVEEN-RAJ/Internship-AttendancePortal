import React, { useState, useEffect } from "react";
import axios from "axios";
import "./style.css";

const AddEmployee = () => {
  const [employee, setEmployee] = useState({
    name: "",
    email: "",
    password: "",
    salary: "",
    address: "",
    category_id: "",
  });
  const [categories, setCategories] = useState([]);
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    // Fetch categories for the dropdown
    axios
      .get("http://localhost:3000/admin/category")
      .then((result) => {
        if (result.data.Status) {
          setCategories(result.data.Result);
        } else {
          alert(result.data.Error);
        }
      })
      .catch((err) => console.log(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", employee.name);
    formData.append("email", employee.email);
    formData.append("password", employee.password);
    formData.append("salary", employee.salary);
    formData.append("address", employee.address);
    formData.append("category_id", employee.category_id);
    formData.append("image", image); // Ensure the field name is "image"

    try {
      const response = await axios.post(
        "http://localhost:3000/admin/employeeAdd",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.data.Status) {
        setMessage({ type: "success", text: "Employee added successfully!" });
        setEmployee({
          name: "",
          email: "",
          password: "",
          salary: "",
          address: "",
          category_id: "",
        });
        setImage(null);
        setTimeout(() => {
          window.location.href = "/dashboard/employee"; // Redirect to employee list
        }, 2000); // Delay for user to see the success message
      } else {
        console.error("Server Error:", response.data.Error); // Log server error
        setMessage({ type: "error", text: response.data.Error });
      }
    } catch (error) {
      console.error("Error adding employee:", error.response || error); // Log detailed error
      setMessage({ type: "error", text: "Failed to add employee." });
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Add Employee</h2>
      {message && (
        <div
          className={`alert ${
            message.type === "success" ? "alert-success" : "alert-danger"
          }`}
        >
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit} className="p-4 rounded shadow bg-white">
        <div className="mb-3">
          <label htmlFor="name" className="form-label">
            Name
          </label>
          <input
            type="text"
            id="name"
            className="form-control"
            value={employee.name}
            onChange={(e) =>
              setEmployee({ ...employee, name: e.target.value })
            }
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="form-control"
            value={employee.email}
            onChange={(e) =>
              setEmployee({ ...employee, email: e.target.value })
            }
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            type="password"
            id="password"
            className="form-control"
            value={employee.password}
            onChange={(e) =>
              setEmployee({ ...employee, password: e.target.value })
            }
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="salary" className="form-label">
            Salary
          </label>
          <input
            type="number"
            id="salary"
            className="form-control"
            value={employee.salary}
            onChange={(e) =>
              setEmployee({ ...employee, salary: e.target.value })
            }
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="address" className="form-label">
            Address
          </label>
          <input
            type="text"
            id="address"
            className="form-control"
            value={employee.address}
            onChange={(e) =>
              setEmployee({ ...employee, address: e.target.value })
            }
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="category" className="form-label">
            Category
          </label>
          <select
            id="category"
            className="form-select"
            value={employee.category_id}
            onChange={(e) =>
              setEmployee({ ...employee, category_id: e.target.value })
            }
            required
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label htmlFor="image" className="form-label">
            Upload Image
          </label>
          <input
            type="file"
            id="image"
            className="form-control"
            onChange={(e) => setImage(e.target.files[0])}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">
          Add Employee
        </button>
      </form>
    </div>
  );
};

export default AddEmployee;