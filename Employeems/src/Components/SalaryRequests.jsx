import React, { useEffect, useState } from "react";
import axios from "axios";

const SalaryRequests = () => {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchSalaryRequests();
  }, []);

  const fetchSalaryRequests = () => {
    axios
      .get("https://cybernaut-attendanceportal.onrender.com/admin/salary_requests")
      .then((result) => {
        if (result.data.Status) {
          setRequests(result.data.Data);
        } else {
          setMessage({ type: "error", text: result.data.Error || "Failed to fetch salary requests." });
        }
      })
      .catch((err) => {
        console.error("Error fetching salary requests:", err);
        setMessage({ type: "error", text: "Failed to fetch salary requests." });
      });
  };

  const handleApprove = (requestId) => {
    axios
      .post(`https://cybernaut-attendanceportal.onrender.com/admin/approve_salary_request/${requestId}`)
      .then((result) => {
        if (result.data.Status) {
          setMessage({ type: "success", text: "Salary request approved successfully!" });
          fetchSalaryRequests();
        } else {
          setMessage({ type: "error", text: result.data.Error || "Failed to approve salary request." });
        }
      })
      .catch((err) => {
        console.error("Error approving salary request:", err);
        setMessage({ type: "error", text: "Failed to approve salary request." });
      });
  };

  const handleReject = (requestId) => {
    axios
      .post(`https://cybernaut-attendanceportal.onrender.com/admin/reject_salary_request/${requestId}`)
      .then((result) => {
        if (result.data.Status) {
          setMessage({ type: "success", text: "Salary request rejected successfully!" });
          fetchSalaryRequests();
        } else {
          setMessage({ type: "error", text: result.data.Error || "Failed to reject salary request." });
        }
      })
      .catch((err) => {
        console.error("Error rejecting salary request:", err);
        setMessage({ type: "error", text: "Failed to reject salary request." });
      });
  };

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      const response = await axios.put(
        `https://cybernaut-attendanceportal.onrender.com/admin/salary_request_status/${requestId}`,
        { status: newStatus },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.Status) {
        setMessage({ type: "success", text: "Status updated successfully!" });
        fetchSalaryRequests(); // Refresh the list
      } else {
        setMessage({ type: "error", text: response.data.Error || "Failed to update status" });
      }
    } catch (err) {
      console.error("Error updating status:", err);
      setMessage({ 
        type: "error", 
        text: err.response?.data?.Error || "Failed to update status. Please try again." 
      });
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return 'bg-success text-white';
      case 'In Progress': return 'bg-warning text-dark';
      case 'Started': return 'bg-secondary text-white';
      default: return '';
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center">Salary Requests</h2>
      {message && (
        <div className={`alert alert-${message.type}`} role="alert">
          {message.text}
        </div>
      )}
      <div className="table-responsive">
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Request Date</th>
              <th>Request Month</th>
              <th>Status</th>
              <th>Receipt Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>{request.employee_name}</td>
                <td>{new Date(request.request_date).toLocaleDateString()}</td>
                <td>
                  {new Date(request.request_month).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'
                  })}
                </td>
                <td>
                  <select
                    className={`form-select form-select-sm ${getStatusColor(request.status)}`}
                    value={request.status}
                    onChange={(e) => handleStatusChange(request.id, e.target.value)}
                  >
                    <option value="Started">Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </td>
                <td>
                  <span className={`badge ${
                    request.receipt_status === 'Received' ? 'bg-success' :
                    request.receipt_status === 'Not Received' ? 'bg-danger' : 'bg-warning'
                  }`}>
                    {request.receipt_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalaryRequests;
