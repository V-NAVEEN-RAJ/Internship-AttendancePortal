import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Category = () => {
  const [category, setCategory] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = () => {
    axios.get('https://cybernaut-attendanceportal.onrender.com/admin/category')
      .then(result => {
        if (result.data.Status) {
          setCategory(result.data.Result);
        }
      })
      .catch(err => console.log(err));
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      axios.delete(`https://cybernaut-attendanceportal.onrender.com/admin/delete_category/${id}`)
        .then(result => {
          if (result.data.Status) {
            setMessage({ type: "success", text: "Category deleted successfully" });
            fetchCategories();
          } else {
            setMessage({ type: "error", text: result.data.Error });
          }
        })
        .catch(err => {
          console.error("Error deleting category:", err);
          setMessage({ type: "error", text: "Failed to delete category" });
        });
    }
  };

  return (
    <div className="px-5 mt-3">
      <div className="d-flex justify-content-between align-items-center">
        <h3>Category List</h3>
        <Link to="/dashboard/add_category" className="btn btn-success">
          Add Category
        </Link>
      </div>
      {message && (
        <div className={`alert alert-${message.type} mt-3`} role="alert">
          {message.text}
        </div>
      )}
      <div className="mt-3">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {category.map(c => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>
                  <div className="btn-group">
                    <Link 
                      to={`/dashboard/edit_category/${c.id}`}
                      className="btn btn-warning btn-sm me-2"
                    >
                      Edit
                    </Link>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(c.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Category;
