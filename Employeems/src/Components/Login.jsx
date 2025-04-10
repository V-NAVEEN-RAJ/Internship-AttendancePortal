import React, { useState } from 'react';
import './style.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Configure axios with base URL and credentials
axios.defaults.baseURL = 'http://localhost:5173';
axios.defaults.withCredentials = true;

const Login = () => {
    const [values, setValues] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await axios.post('/admin/adminlogin', {
                email: values.email,
                password: values.password
            });

            if (response.data.loginStatus) {
                navigate('/dashboard');
            } else {
                setError(response.data.Error);
            }
        } catch (err) {
            console.error('Login Error:', err);
            setError('Server connection failed. Please try again.');
        }
    };

    return (
        <div
            className="d-flex justify-content-center align-items-center vh-100 loginPage"
            style={{
                backgroundImage: "url('/Images/background.jpg')", // Replace with your background image
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        >
            <div
                className="p-4 rounded loginForm w-100 mx-3 mx-md-0"
                style={{
                    maxWidth: "400px",
                    background: "rgba(255, 255, 255, 0.2)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                }}
            >
                <h2 className="text-center" style={{ color: "#000" }}>Admin Login</h2> {/* Ensure text is visible */}
                {error && <div className="text-danger text-center mb-3">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label" style={{ color: "#000" }}>Email</label> {/* Ensure text is visible */}
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="form-control"
                            placeholder="Enter your email"
                            value={values.email}
                            onChange={(e) => setValues({ ...values, email: e.target.value })}
                            autoComplete="email"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label" style={{ color: "#000" }}>Password</label> {/* Ensure text is visible */}
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="form-control"
                            placeholder="Enter your password"
                            value={values.password}
                            onChange={(e) => setValues({ ...values, password: e.target.value })}
                            autoComplete="current-password"
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100">
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
