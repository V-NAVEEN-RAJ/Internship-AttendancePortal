import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProfileSection from "./ProfileSection";
import NavBar from './NavBar';

const EmployeeDetail = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [e, setEmployee] = useState({});
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedSection, setSelectedSection] = useState("profile");
  const [updatedEmployee, setUpdatedEmployee] = useState({
    name: "",
    email: "",
    address: "",
    password: "",
    photo: null,
  });
  const [salaryStatus, setSalaryStatus] = useState("Pending");
  const [attendanceDetails, setAttendanceDetails] = useState([]);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, late: 0 });
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const sidebarRef = useRef(null);
  const [salaryRequests, setSalaryRequests] = useState([]);
  const [requestMonth, setRequestMonth] = useState("");
  const [message, setMessage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editMessage, setEditMessage] = useState(null);
  const [taskMessage, setTaskMessage] = useState(null); // Add this state variable

  useEffect(() => {
    const isValid = localStorage.getItem("valid");
    const storedEmpId = localStorage.getItem("employeeId");
    if (!isValid || !storedEmpId || storedEmpId !== id) {
      navigate("/employee_login");
      return;
    }
    if (id) {
      setIsLoading(true);
      axios.get(`https://cybernaut-attendanceportal.onrender.com/employee/detail/${id}`)
        .then(result => {
          if (result.data.Status) {
            console.log('Employee data received:', result.data.Data);
            setEmployee(result.data.Data);
          } else {
            setMessage({ type: "error", text: result.data.Error });
            navigate("/employee_login");
          }
        })
        .catch(err => {
          console.error("Error fetching employee details:", err);
          setMessage({ type: "error", text: "Failed to load employee details" });
          navigate("/employee_login");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      switch (selectedSection) {
        case 'attendance':
          fetchAttendanceDetails();
          break;
        case 'tasks':
          fetchTasks();
          break;
        case 'salary':
          fetchSalaryRequests();
          break;
        default:
          break;
      }
    }
  }, [id, selectedSection]);

  const fetchSectionData = (section) => {
    switch (section) {
      case 'attendance':
        fetchAttendanceDetails();
        break;
      case 'tasks':
        fetchTasks();
        break;
      case 'salary':
        fetchSalaryRequests();
        break;
      default:
        break;
    }
  };

  const fetchAttendanceDetails = () => {
    const promises = [
      axios.get(`https://cybernaut-attendanceportal.onrender.com/attendance/details/${id}`),
      axios.get(`https://cybernaut-attendanceportal.onrender.com/attendance/stats?date=${new Date().toISOString().split('T')[0]}`)
    ];
    Promise.all(promises)
      .then(([attendanceResult, statsResult]) => {
        if (attendanceResult.data.Status) {
          setAttendanceDetails(attendanceResult.data.Data);
        }
        if (statsResult.data.Status) {
          setAttendanceStats(statsResult.data.Data);
        }
      })
      .catch(err => {
        console.error("Error fetching attendance data:", err);
        setMessage({ type: "error", text: "Failed to load attendance data" });
      });
  };

  const fetchTasks = () => {
    axios.get(`https://cybernaut-attendanceportal.onrender.com/employee/tasks/${id}`)
      .then(result => {
        if (result.data.Status) {
          setDailyTasks(result.data.Data);
        } else {
          setMessage({ type: "error", text: "Failed to fetch tasks" });
        }
      })
      .catch(err => {
        console.error("Error fetching tasks:", err);
        setMessage({ type: "error", text: "Failed to fetch tasks" });
      });
  };

  const handleLogout = () => {
    localStorage.removeItem("valid");
    localStorage.removeItem("employeeId");
    navigate("/");
  };

  const handleEditSubmit = (event) => {
    event.preventDefault();
    
    const formData = new FormData();
    if (updatedEmployee.name.trim()) formData.append('name', updatedEmployee.name.trim());
    if (updatedEmployee.email.trim()) formData.append('email', updatedEmployee.email.trim());
    if (updatedEmployee.address.trim()) formData.append('address', updatedEmployee.address.trim());
    if (updatedEmployee.password) formData.append('password', updatedEmployee.password);
    if (updatedEmployee.photo) formData.append('image', updatedEmployee.photo);

    axios.put(`https://cybernaut-attendanceportal.onrender.com/employee/edit/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then(result => {
      if (result.data.Status) {
        setEditMessage({ type: "success", text: "Profile updated successfully!" });
        setTimeout(() => {
          setEditMessage(null);
          setSelectedSection("profile");
          // Refresh employee data
          axios.get(`https://cybernaut-attendanceportal.onrender.com/employee/detail/${id}`)
            .then(result => {
              if (result.data.Status) {
                setEmployee(result.data.Data);
              }
            });
        }, 2000);
      } else {
        setEditMessage({ type: "error", text: result.data.Error });
      }
    })
    .catch(err => {
      console.error("Error updating profile:", err);
      setEditMessage({ type: "error", text: "Failed to update profile" });
    });
  };

  const getImageSrc = () => {
    if (e.image_blob) {
      return `data:image/jpeg;base64,${e.image_blob}`;
    }
    if (e.image) {
      return `https://cybernaut-attendanceportal.onrender.com/Images/${e.image}`;
    }
    return "https://cybernaut-attendanceportal.onrender.com/Images/default.png";
  };

  const handleEditToggle = () => {
    setUpdatedEmployee({
      name: e.name || "",
      email: e.email || "",
      address: e.address || "",
      password: "",
      photo: null,
    });
    setSelectedSection("edit");
  };

  const handleOutsideClick = (event) => {
    if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
      setSidebarVisible(false);
    }
  };

  useEffect(() => {
    if (isSidebarVisible) {
      document.addEventListener("mousedown", handleOutsideClick);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isSidebarVisible]);

  const fetchSalaryRequests = () => {
    axios
      .get(`https://cybernaut-attendanceportal.onrender.com/employee/salary_requests/${id}`)
      .then((result) => {
        if (result.data.Status) {
          setSalaryRequests(result.data.Data);
        }
      })
      .catch((err) => console.error("Error fetching salary requests:", err));
  };

  const handleSalaryRequest = (e) => {
    e.preventDefault();
    if (!id) {
      setMessage({ type: "error", text: "Employee ID not found" });
      return;
    }
    if (!requestMonth) {
      setMessage({ type: "error", text: "Please select a month" });
      return;
    }
    const requestData = {
      employee_id: parseInt(id, 10),
      request_month: `${requestMonth}-01`
    };
    axios
      .post("https://cybernaut-attendanceportal.onrender.com/employee/salary_request", requestData)
      .then((result) => {
        if (result.data.Status) {
          setMessage({ type: "success", text: "Salary request submitted successfully" });
          fetchSalaryRequests();
          setRequestMonth("");
        } else {
          setMessage({ type: "error", text: result.data.Error || "Failed to submit request" });
        }
      })
      .catch((err) => {
        console.error("Error submitting salary request:", err);
        const errorMessage = err.response?.data?.Error || "Failed to submit salary request";
        setMessage({ type: "error", text: errorMessage });
      });
  };

  const handleReceiptStatus = (requestId, newStatus) => {
    axios.put(`https://cybernaut-attendanceportal.onrender.com/admin/salary-receipt/${requestId}`, {
      receipt_status: newStatus
    })
    .then(result => {
      if (result.data.Status) {
        setMessage({ type: "success", text: "Receipt status updated successfully" });
        fetchSalaryRequests(); // Refresh the salary requests
      } else {
        setMessage({ type: "error", text: result.data.Error || "Failed to update status" });
      }
    })
    .catch(err => {
      console.error("Error updating receipt status:", err);
      setMessage({ type: "error", text: "Failed to update receipt status" });
    });
  };

  const handleTaskStatusUpdate = (taskId, newStatus) => {
    axios.put(`https://cybernaut-attendanceportal.onrender.com/admin/task-status/${taskId}`, {
      status: newStatus,
      employee_id: id
    })
    .then(result => {
      if (result.data.Status) {
        fetchTasks();
        setTaskMessage({ type: "success", text: "Task status updated successfully" }); // Use taskMessage instead
        setTimeout(() => setTaskMessage(null), 3000); // Clear message after 3 seconds
      } else {
        setTaskMessage({ type: "error", text: result.data.Error });
      }
    })
    .catch(err => {
      console.error("Error updating task status:", err);
      setTaskMessage({ type: "error", text: "Failed to update task status" });
    });
  };

  const handleTaskDelete = (taskId) => {
    if (!window.confirm('Are you sure you want to delete this completed task?')) {
      return;
    }
  
    axios.delete(`https://cybernaut-attendanceportal.onrender.com/employee/tasks/${taskId}`)
      .then(result => {
        if (result.data.Status) {
          setMessage({ type: "success", text: "Task deleted successfully" });
          fetchTasks(); // Refresh tasks list
        } else {
          setMessage({ type: "error", text: result.data.Error || "Failed to delete task" });
        }
      })
      .catch(err => {
        console.error("Error deleting task:", err);
        setMessage({ type: "error", text: "Failed to delete task" });
      });
  };

  const handleSectionChange = (newSection) => {
    setSelectedSection(newSection);
    const newUrl = `${window.location.pathname}?section=${newSection}`;
    window.history.pushState(null, '', newUrl);
    fetchSectionData(newSection);
  };

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      axios.get(`https://cybernaut-attendanceportal.onrender.com/employee/detail/${id}`)
        .then(result => {
          if (result.data.Status) {
            console.log('Employee data:', result.data.Data);
            setEmployee(result.data.Data);
          } else {
            setMessage({ type: "error", text: result.data.Error });
          }
        })
        .catch(err => {
          console.error("Error:", err);
          setMessage({ type: "error", text: "Failed to load employee details" });
        })
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUpdatedEmployee({ ...updatedEmployee, photo: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add this new function
  const updateReceiptStatus = (requestId, status) => {
    if (!window.confirm(`Are you sure you want to mark this salary as ${status}?`)) {
      return;
    }
  
    axios.put(`https://cybernaut-attendanceportal.onrender.com/admin/salary-receipt-confirmation/${requestId}`, {
      receipt_status: status,
      employee_id: id
    })
    .then(result => {
      if (result.data.Status) {
        setMessage({ type: "success", text: `Payment marked as ${status.toLowerCase()}` });
        fetchSalaryRequests();
      } else {
        setMessage({ type: "error", text: result.data.Error });
      }
    })
    .catch(err => {
      console.error("Error updating receipt status:", err);
      setMessage({ type: "error", text: "Failed to update receipt status" });
    });
  };

  // Add this new function at the component level
  const handleSalaryReceiptUpdate = (requestId, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this salary as ${newStatus}?`)) {
      return;
    }
  
    axios.put(`https://cybernaut-attendanceportal.onrender.com/employee/salary-receipt/${requestId}`, {
      receipt_status: newStatus,
      employee_id: id
    })
    .then(result => {
      if (result.data.Status) {
        setMessage({ type: "success", text: `Payment marked as ${newStatus}` });
        fetchSalaryRequests();
      } else {
        setMessage({ type: "error", text: result.data.Error || "Failed to update status" });
      }
    })
    .catch(err => {
      console.error("Error updating salary receipt:", err);
      setMessage({ type: "error", text: "Failed to update status" });
    });
  };

  const handleReceiptUpdate = (requestId, status) => {
    if (!window.confirm(`Are you sure you want to mark this salary as ${status}?`)) {
      return;
    }
  
    axios.put(`https://cybernaut-attendanceportal.onrender.com/employee/salary-receipt-update/${requestId}`, {
      receipt_status: status,
      employee_id: id
    })
    .then(result => {
      if (result.data.Status) {
        setMessage({ type: "success", text: `Receipt status successfully updated to ${status.toLowerCase()}` });
        fetchSalaryRequests();
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      } else {
        setMessage({ type: "error", text: result.data.Error || "Failed to update status" });
      }
    })
    .catch(err => {
      console.error("Error updating receipt status:", err);
      setMessage({ type: "error", text: "Failed to update status" });
    });
  };

  return (
    <div className="d-flex flex-column">
      <NavBar 
        title="Employee Portal"
        onToggleSidebar={() => setSidebarVisible(!isSidebarVisible)}
      />
      
      <div className="d-flex">
        <div
          className="content w-100"
          style={{
            marginRight: isSidebarVisible ? "300px" : "0",
            transition: "margin-right 0.3s ease",
            padding: "20px",
            minHeight: "calc(100vh - 56px)",
            backgroundColor: "#f4f6f9",
            color: "#000",
          }}
        >
          {selectedSection === "attendance" && (
            <div className="card shadow-sm p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="text-center mb-0">Attendance Records</h3>
                <button 
                  className="btn btn-secondary"
                  onClick={() => navigate(-1)}
                >
                  <i className="bi bi-arrow-left me-2"></i>Back
                </button>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>In Time</th>
                      <th>Out Time</th>
                      <th>Status</th>
                      <th>Final Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceDetails.length > 0 ? (
                      attendanceDetails.map((attendance) => (
                        <tr key={attendance.id}>
                          <td>{new Date(attendance.date_of_attendance).toLocaleDateString()}</td>
                          <td>{attendance.in_time || "N/A"}</td>
                          <td>{attendance.out_time || "N/A"}</td>
                          <td>{attendance.status}</td>
                          <td>{attendance.final_status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center">
                          No attendance records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {selectedSection === "tasks" && (
            <div className="card shadow-sm p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="mb-0">Task Management</h3>
                {taskMessage && (
                  <div className={`alert alert-${taskMessage.type} mb-0`} role="alert">
                    {taskMessage.text}
                  </div>
                )}
                <div className="task-stats d-flex gap-3">
                  <span className="badge bg-success">Completed: {dailyTasks.filter(t => t.status === 'Completed').length}</span>
                  <span className="badge bg-warning">Pending: {dailyTasks.filter(t => t.status === 'Pending').length}</span>
                </div>
              </div>
              <div className="list-group">
                {dailyTasks.length > 0 ? (
                  dailyTasks.map((task) => (
                    <div key={task.id} className="list-group-item list-group-item-action mb-2 border rounded shadow-sm">
                      <div className="d-flex w-100 justify-content-between align-items-center">
                        <div className="task-content">
                          <div className="text-muted small mb-1">
                            <i className="bi bi-calendar-event me-2"></i>
                            {new Date(task.created_at).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <p className="mb-1 task-description">{task.description}</p>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <select
                            className={`form-select form-select-sm ${
                              task.status === 'Completed' ? 'border-success text-success' : 'border-warning'
                            }`}
                            value={task.status}
                            onChange={(e) => handleTaskStatusUpdate(task.id, e.target.value)}
                            style={{ minWidth: '120px' }}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Completed">Completed</option>
                          </select>
                          {task.status === 'Completed' && (
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => handleTaskDelete(task.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-5 bg-light rounded">
                    <i className="bi bi-clipboard-check fs-1 text-muted"></i>
                    <p className="text-muted mt-3">No tasks assigned yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {selectedSection === "profile" && (
            <ProfileSection 
              e={e}
              isLoading={isLoading}
              handleEditToggle={handleEditToggle}
            />
          )}
          {selectedSection === "edit" && (
            <div className="container py-5">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h3 className="card-title text-center mb-4">Edit Profile</h3>
                  {editMessage && (
                    <div className={`alert alert-${editMessage.type} mb-3`} role="alert">
                      {editMessage.text}
                    </div>
                  )}
                  <form onSubmit={handleEditSubmit}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={updatedEmployee.name}
                          onChange={(e) => setUpdatedEmployee({ ...updatedEmployee, name: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          value={updatedEmployee.email}
                          onChange={(e) => setUpdatedEmployee({ ...updatedEmployee, email: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Address</label>
                      <textarea
                        className="form-control"
                        value={updatedEmployee.address}
                        onChange={(e) => setUpdatedEmployee({ ...updatedEmployee, address: e.target.value })}
                        rows="2"
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={updatedEmployee.password}
                        onChange={(e) => setUpdatedEmployee({
                          ...updatedEmployee,
                          password: e.target.value,
                        })}
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Profile Photo</label>
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={imagePreview || getImageSrc()}
                          alt="Preview"
                          className="rounded-circle"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                        />
                        <input
                          type="file"
                          className="form-control"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </div>
                    </div>
                    <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                      <button
                        type="button"
                        className="btn btn-secondary me-md-2"
                        onClick={() => setSelectedSection("profile")}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
          {selectedSection === "salary" && (
            <div className="card shadow-sm p-4">
              <h3 className="text-center mb-4">Salary Section</h3>
              <form onSubmit={handleSalaryRequest} className="mb-4">
                <div className="mb-3">
                  <label className="form-label">Request Month</label>
                  <input
                    type="month"
                    className="form-control"
                    value={requestMonth}
                    onChange={(e) => setRequestMonth(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Submit Request
                </button>
              </form>
              <div className="mt-4">
                <h4 className="mb-3">Request History</h4>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Request Date</th>
                        <th>Month</th>
                        <th>Status</th>
                        <th>Receipt Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaryRequests.map((request) => (
                        <tr key={request.id}>
                          <td>{new Date(request.request_date).toLocaleDateString()}</td>
                          <td>{new Date(request.request_month).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long'
                          })}</td>
                          <td>
                            <span className={`badge ${
                              request.status === 'Completed' ? 'bg-success' :
                              request.status === 'In Progress' ? 'bg-warning' :
                              'bg-secondary'
                            }`}>
                              {request.status}
                            </span>
                          </td>
                          <td>
                            {request.status === 'Completed' ? (
                              <select
                                className={`form-select form-select-sm ${
                                  request.receipt_status === 'Received' ? 'border-success text-success' :
                                  request.receipt_status === 'Not Received' ? 'border-danger text-danger' :
                                  'border-warning text-warning'
                                }`}
                                value={request.receipt_status || 'Pending'}
                                onChange={(e) => handleReceiptUpdate(request.id, e.target.value)}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Received">Received</option>
                                <option value="Not Received">Not Received</option>
                              </select>
                            ) : (
                              <span className="badge bg-secondary">Not Available</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {message && (
                <div className={`alert alert-${message.type} mt-3`} role="alert">
                  {message.text}
                </div>
              )}
            </div>
          )}
        </div>
        {isSidebarVisible && (
          <div
            ref={sidebarRef}
            className="bg-dark text-white p-3"
            style={{
              width: "300px",
              height: "100vh",
              position: "fixed",
              right: 0,
              top: 0,
              overflowY: "auto",
              zIndex: 1030,
            }}
          >
            <div className="text-center mb-4">
              <img
                src={getImageSrc()}
                alt="Employee"
                className="rounded-circle border border-secondary"
                style={{ width: "100px", height: "100px", objectFit: "cover" }}
                onError={(event) => {
                  event.target.src = "https://cybernaut-attendanceportal.onrender.com/Images/default.png";
                }}
              />
              <h5 className="mt-2">{e.name}</h5>
            </div>
            <ul className="nav flex-column mt-4">
              <li className="nav-item mb-3">
                <button
                  className={`btn btn-primary w-100 ${selectedSection === "attendance" ? "active" : ""}`}
                  onClick={() => handleSectionChange("attendance")}
                >
                  Attendance
                </button>
              </li>
              <li className="nav-item mb-3">
                <button
                  className={`btn btn-primary w-100 ${selectedSection === "tasks" ? "active" : ""}`}
                  onClick={() => handleSectionChange("tasks")}
                >
                  Daily Tasks
                </button>
              </li>
              <li className="nav-item mb-3">
                <button
                  className={`btn btn-primary w-100 ${selectedSection === "profile" ? "active" : ""}`}
                  onClick={() => handleSectionChange("profile")}
                >
                  Profile
                </button>
              </li>
              <li className="nav-item mb-3">
                <button
                  className={`btn btn-primary w-100 ${selectedSection === "salary" ? "active" : ""}`}
                  onClick={() => handleSectionChange("salary")}
                >
                  Salary Section
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetail;
