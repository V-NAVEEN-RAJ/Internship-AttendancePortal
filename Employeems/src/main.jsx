import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from "axios";

// Configure axios with the production URL
axios.defaults.baseURL = 'https://cybernaut-attendanceportal.onrender.com';
axios.defaults.withCredentials = true;

// Create React root and render app
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
