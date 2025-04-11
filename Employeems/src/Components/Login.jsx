import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [values, setValues] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  axios.defaults.withCredentials = true;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('https://cybernaut-attendanceportal.onrender.com/admin/adminlogin', values, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.loginStatus) {
        localStorage.setItem('valid', true);
        navigate('/dashboard');
      } else {
        setError(response.data.Error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.Error || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100" 
      style={{
        backgroundImage: 'url("/Images/loginimg.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
      <div className="p-4 rounded w-100 mx-3 mx-md-0" 
        style={{
          maxWidth: '400px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)'
        }}>
        <h2 className="text-center mb-4">Admin Login</h2>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email"><strong>Email</strong></label>
            <input
              type="email"
              id="email"
              placeholder="Enter Email"
              className="form-control"
              onChange={(e) => setValues({...values, email: e.target.value})}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password"><strong>Password</strong></label>
            <input
              type="password"
              id="password"
              placeholder="Enter Password"
              className="form-control"
              onChange={(e) => setValues({...values, password: e.target.value})}
              required
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-success w-100"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
