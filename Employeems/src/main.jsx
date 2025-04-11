import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from "axios";

// Function to get server URL
const getServerUrl = async () => {
  // Try ports 3000 through 3005
  for (let port = 3000; port <= 3005; port++) {
    try {
      const response = await fetch(`https://cybernaut-attendanceportal.onrender.com/api`);
      if (response.ok) {
        return `https://cybernaut-attendanceportal.onrender.com/`;
      }
    } catch (err) {
      continue;
    }
  }
  return 'https://cybernaut-attendanceportal.onrender.com'; // Default fallback
};

// Configure axios
getServerUrl().then(baseURL => {
  axios.defaults.baseURL = baseURL;
  axios.defaults.withCredentials = true;
  
  // Create React root after axios is configured
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}).catch(err => {
  console.error('Failed to initialize app:', err);
  // Show error message to user
  document.getElementById('root').innerHTML = 
    '<div style="color: red; padding: 20px;">Failed to connect to server. Please try again later.</div>';
});
