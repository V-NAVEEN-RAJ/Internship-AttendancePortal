import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Modal, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const AdminPage = () => {
  const [selectedSection, setSelectedSection] = useState("dashboard");
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [taskDescription, setTaskDescription] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState({
    id: "",
    name: "",
    email: "",
    address: "",
    salary: "",
    category_id: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchEmployees();
    fetchTasks();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("/api/employees");
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get("/api/tasks");
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/categories", { name: categoryName });
      setCategoryName("");
      fetchCategories();
      toast.success("Category added successfully!");
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category.");
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/tasks", {
        employee_id: selectedEmployee.id,
        description: taskDescription,
      });
      setTaskDescription("");
      setShowModal(false);
      fetchTasks();
      toast.success("Task assigned successfully!");
    } catch (error) {
      console.error("Error assigning task:", error);
      toast.error("Failed to assign task.");
    }
  };

  const handleEditEmployee = (employee) => {
    setEditEmployee(employee);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/employees/${editEmployee.id}`, editEmployee);
      setShowEditModal(false);
      fetchEmployees();
      toast.success("Employee updated successfully!");
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error("Failed to update employee.");
    }
  };

  const handleDeleteEmployee = async (id) => {
    try {
      await axios.delete(`/api/employees/${id}`);
      fetchEmployees();
      toast.success("Employee deleted successfully!");
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error("Failed to delete employee.");
    }
  };

  const handleLogout = () => {
    // Clear any authentication tokens or session data
    navigate("/login");
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-3">
          <div className="list-group">
            <button
              className={`list-group-item list-group-item-action ${
                selectedSection === "dashboard" ? "active" : ""
              }`}
              onClick={() => setSelectedSection("dashboard")}
            >
              Dashboard
            </button>
            <button
              className={`list-group-item list-group-item-action ${
                selectedSection === "category" ? "active" : ""
              }`}
              onClick={() => setSelectedSection("category")}
            >
              Categories
            </button>
            <button
              className={`list-group-item list-group-item-action ${
                selectedSection === "employee" ? "active" : ""
              }`}
              onClick={() => setSelectedSection("employee")}
            >
              Employees
            </button>
            <button
              className={`list-group-item list-group-item-action ${
                selectedSection === "task" ? "active" : ""
              }`}
              onClick={() => setSelectedSection("task")}
            >
              Tasks
            </button>
            <button
              className="list-group-item list-group-item-action"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
        <div className="col-md-9">
          {selectedSection === "dashboard" && (
            <div>
              <h2>Dashboard</h2>
              <p>Welcome to the admin dashboard!</p>
            </div>
          )}
          {selectedSection === "category" && (
            <div 
              className="d-flex justify-content-center align-items-center vh-100" 
              style={{
                backgroundImage: 'url("/Images/loginimg.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                overflow: 'hidden'
              }}
            >
              <div 
                className="p-4 rounded border w-100 mx-3 mx-md-0 shadow"
                style={{
                  maxWidth: '400px',
                  background: 'rgba(212, 206, 206, 0.8)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <h2 className="text-center mb-3">Add Category</h2>
                <form onSubmit={handleCategorySubmit}>
                  <div className="mb-3">
                    <label htmlFor="category"><strong>Category:</strong></label>
                    <input
                      id="category"
                      type="text"
                      className="form-control rounded-0"
                      placeholder="Enter Category"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-success w-100 rounded-0">
                    Add Category
                  </button>
                </form>
              </div>
            </div>
          )}
          {selectedSection === "employee" && (
            <div>
              <h2>Employees</h2>
              <button
                className="btn btn-primary mb-3"
                onClick={() => setShowModal(true)}
              >
                Assign Task
              </button>
              <ul className="list-group">
                {employees.map((employee) => (
                  <li key={employee.id} className="list-group-item">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5>{employee.name}</h5>
                        <p>{employee.email}</p>
                      </div>
                      <div>
                        <button
                          className="btn btn-sm btn-info me-2"
                          onClick={() => handleEditEmployee(employee)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteEmployee(employee.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {selectedSection === "task" && (
            <div>
              <h2>Tasks</h2>
              <ul className="list-group">
                {tasks.map((task) => (
                  <li key={task.id} className="list-group-item">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5>{task.description}</h5>
                        <p>Status: {task.status}</p>
                      </div>
                      <div>
                        <button
                          className="btn btn-sm btn-info me-2"
                          onClick={() => handleEditEmployee(task)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteEmployee(task.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Assign Task Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Assign Task</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleTaskSubmit}>
            <div className="mb-3">
              <label htmlFor="employeeSelect" className="form-label">
                Select Employee
              </label>
              <select
                id="employeeSelect"
                className="form-select"
                value={selectedEmployee?.id || ""}
                onChange={(e) =>
                  setSelectedEmployee(
                    employees.find((emp) => emp.id === e.target.value)
                  )
                }
                required
              >
                <option value="">Select an employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label htmlFor="taskDescription" className="form-label">
                Task Description
              </label>
              <textarea
                id="taskDescription"
                className="form-control"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                required
              ></textarea>
            </div>
            <Button variant="primary" type="submit">
              Assign Task
            </Button>
          </form>
        </Modal.Body>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Employee</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleEditSubmit}>
            <div className="mb-3">
              <label htmlFor="editName" className="form-label">
                Name
              </label>
              <input
                type="text"
                id="editName"
                className="form-control"
                value={editEmployee.name}
                onChange={(e) =>
                  setEditEmployee({ ...editEmployee, name: e.target.value })
                }
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="editEmail" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="editEmail"
                className="form-control"
                value={editEmployee.email}
                onChange={(e) =>
                  setEditEmployee({ ...editEmployee, email: e.target.value })
                }
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="editAddress" className="form-label">
                Address
              </label>
              <input
                type="text"
                id="editAddress"
                className="form-control"
                value={editEmployee.address}
                onChange={(e) =>
                  setEditEmployee({ ...editEmployee, address: e.target.value })
                }
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="editSalary" className="form-label">
                Salary
              </label>
              <input
                type="number"
                id="editSalary"
                className="form-control"
                value={editEmployee.salary}
                onChange={(e) =>
                  setEditEmployee({ ...editEmployee, salary: e.target.value })
                }
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="editCategory" className="form-label">
                Category
              </label>
              <select
                id="editCategory"
                className="form-select"
                value={editEmployee.category_id}
                onChange={(e) =>
                  setEditEmployee({
                    ...editEmployee,
                    category_id: e.target.value,
                  })
                }
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="primary" type="submit">
              Save Changes
            </Button>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AdminPage;