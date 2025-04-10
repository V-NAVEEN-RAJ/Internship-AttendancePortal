import React, { useEffect, useState } from "react";
import axios from "axios";

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [newTask, setNewTask] = useState({ employee_id: "", description: "" });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, []);

  const fetchTasks = () => {
    axios
      .get("http://localhost:3000/employee/tasks")
      .then((result) => {
        if (result.data.Status) {
          setTasks(result.data.Data);
        } else {
          setMessage({ type: "error", text: result.data.Error || "Failed to fetch tasks." });
        }
      })
      .catch((err) => {
        console.error("Error fetching tasks:", err);
        setMessage({ type: "error", text: "Failed to fetch tasks." });
      });
  };

  const fetchEmployees = () => {
    axios
      .get("http://localhost:3000/employee/employees")
      .then((result) => {
        if (result.data.Status) {
          setEmployees(result.data.Data);
        } else {
          setMessage({ type: "error", text: result.data.Error || "Failed to fetch employees." });
        }
      })
      .catch((err) => {
        console.error("Error fetching employees:", err);
        setMessage({ type: "error", text: "Failed to fetch employees." });
      });
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    axios
      .post("http://localhost:3000/employee/tasks", newTask)
      .then((result) => {
        if (result.data.Status) {
          setMessage({ type: "success", text: "Task added successfully!" });
          setNewTask({ employee_id: "", description: "" });
          fetchTasks();
        } else {
          setMessage({ type: "error", text: result.data.Error || "Failed to add task." });
        }
      })
      .catch((err) => {
        console.error("Error adding task:", err);
        setMessage({ type: "error", text: "Failed to add task." });
      });
  };

  const handleDeleteTask = (taskId) => {
    if (window.confirm('Are you sure you want to delete this completed task?')) {
      axios.delete(`http://localhost:3000/admin/tasks/${taskId}`)
        .then(result => {
          if (result.data.Status) {
            setMessage({ type: "success", text: "Task deleted successfully" });
            fetchTasks();
          } else {
            setMessage({ type: "error", text: "Failed to delete task" });
          }
        })
        .catch(err => {
          console.error("Error deleting task:", err);
          setMessage({ type: "error", text: "Failed to delete task" });
        });
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center">Manage Tasks</h2>
      {message && (
        <div className={`alert alert-${message.type} mt-3`} role="alert">
          {message.text}
        </div>
      )}
      <form onSubmit={handleAddTask} className="card p-4 shadow-sm mb-4">
        <h4>Add New Task</h4>
        <div className="mb-3">
          <label className="form-label">Employee:</label>
          <select
            className="form-select"
            value={newTask.employee_id}
            onChange={(e) => setNewTask({ ...newTask, employee_id: e.target.value })}
            required
          >
            <option value="">Select Employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Description:</label>
          <textarea
            className="form-control"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            required
          ></textarea>
        </div>
        <button type="submit" className="btn btn-primary">
          Add Task
        </button>
      </form>
      <div className="table-responsive">
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Description</th>
              <th>Created At</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className={task.status === 'Completed' ? 'table-success' : 'table-warning'}>
                <td>{task.employee_name}</td>
                <td>{task.description}</td>
                <td>{new Date(task.created_at).toLocaleDateString()}</td>
                <td>{task.status}</td>
                <td>
                  {task.status === 'Completed' ? (
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <i className="bi bi-trash"></i> Delete
                    </button>
                  ) : (
                    <span className="text-muted">
                      <i className="bi bi-clock-history"></i> Pending employee response
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Tasks;
