import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const EditCategory = () => {
  const { id } = useParams();
  const [categoryName, setCategoryName] = useState('');
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Ensure the API endpoint is correct
    axios.get(`http://localhost:3000/admin/category/${id}`)
      .then(result => {
        if (result.data.Status && result.data.Result) {
          setCategoryName(result.data.Result.name); // Ensure 'Result' contains the category details
        } else {
          setMessage({ type: "error", text: result.data.Error || "Failed to fetch category details." });
        }
      })
      .catch(err => {
        console.error("Error fetching category details:", err);
        setMessage({ type: "error", text: "Failed to fetch category details. Please check the API endpoint or server." });
      });
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.put(`http://localhost:3000/admin/edit_category/${id}`, { name: categoryName })
      .then(result => {
        if (result.data.Status) {
          setMessage({ type: "success", text: "Category updated successfully." });
          setTimeout(() => navigate('/dashboard/category'), 2000); // Redirect after success
        } else {
          setMessage({ type: "error", text: result.data.Error || "Failed to update category." });
        }
      })
      .catch(err => {
        console.error("Error updating category:", err);
        setMessage({ type: "error", text: "Failed to update category. Please check the API endpoint or server." });
      });
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="p-4 rounded border w-100 mx-3 mx-md-0" style={{ maxWidth: "400px" }}>
        <h2 className="text-center">Edit Category</h2>
        {message && (
          <div className={`alert alert-${message.type} mt-3`} role="alert">
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="categoryName" className="form-label">Category Name</label>
            <input
              type="text"
              id="categoryName"
              className="form-control"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">Update Category</button>
        </form>
      </div>
    </div>
  );
};

export default EditCategory;
