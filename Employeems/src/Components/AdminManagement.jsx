import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminManagement = () => {
    const [admins, setAdmins] = useState([]);
    const [message, setMessage] = useState(null);
    const [newAdmin, setNewAdmin] = useState({ email: '', password: '' });
    const [updateAdmin, setUpdateAdmin] = useState({ 
        id: '', 
        email: '', 
        password: '', 
        currentPassword: '' 
    });

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const result = await axios.get('https://cybernaut-attendanceportal.onrender.com/admin/admins');
            if (result.data.Status) {
                setAdmins(result.data.Result);
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to fetch admins' });
        }
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        try {
            const result = await axios.post(
                'https://cybernaut-attendanceportal.onrender.com/admin/add_admin',
                newAdmin
            );
            if (result.data.Status) {
                setMessage({ type: 'success', text: 'Admin added successfully' });
                setNewAdmin({ email: '', password: '' });
                fetchAdmins();
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.Error || 'Failed to add admin' });
        }
    };

    const handleUpdateAdmin = async (e) => {
        e.preventDefault();
        try {
            const result = await axios.put(
                `https://cybernaut-attendanceportal.onrender.com/admin/update_admin/${updateAdmin.id}`,
                updateAdmin
            );
            if (result.data.Status) {
                setMessage({ type: 'success', text: 'Admin updated successfully' });
                setUpdateAdmin({ id: '', email: '', password: '', currentPassword: '' });
                fetchAdmins();
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.Error || 'Failed to update admin' });
        }
    };

    return (
        <div className="container mt-4">
            <h2 className="text-center mb-4">Admin Management</h2>
            
            {message && (
                <div className={`alert alert-${message.type}`} role="alert">
                    {message.text}
                </div>
            )}

            <div className="row">
                {/* Add Admin Form */}
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header">
                            <h4>Add New Admin</h4>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleAddAdmin}>
                                <div className="mb-3">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={newAdmin.email}
                                        onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={newAdmin.password}
                                        onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary">Add Admin</button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Update Admin Form */}
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header">
                            <h4>Update Admin</h4>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleUpdateAdmin}>
                                <div className="mb-3">
                                    <label className="form-label">Select Admin</label>
                                    <select 
                                        className="form-select"
                                        value={updateAdmin.id}
                                        onChange={(e) => {
                                            const admin = admins.find(a => a.id === parseInt(e.target.value));
                                            setUpdateAdmin({
                                                ...updateAdmin,
                                                id: e.target.value,
                                                email: admin ? admin.email : ''
                                            });
                                        }}
                                        required
                                    >
                                        <option value="">Select Admin</option>
                                        {admins.map(admin => (
                                            <option key={admin.id} value={admin.id}>
                                                {admin.email}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">New Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={updateAdmin.email}
                                        onChange={(e) => setUpdateAdmin({...updateAdmin, email: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Current Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={updateAdmin.currentPassword}
                                        onChange={(e) => setUpdateAdmin({...updateAdmin, currentPassword: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">New Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={updateAdmin.password}
                                        onChange={(e) => setUpdateAdmin({...updateAdmin, password: e.target.value})}
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-warning">Update Admin</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin List */}
            <div className="mt-4">
                <h4>Admin List</h4>
                <div className="table-responsive">
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Email</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.map(admin => (
                                <tr key={admin.id}>
                                    <td>{admin.id}</td>
                                    <td>{admin.email}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminManagement;
