import express from "express";
import cors from "cors";
import path from "path";

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173", // Vite's default port
  credentials: true
}));
app.use(express.json());

// Serve static images
app.use("/Images", express.static(path.join(__dirname, "Images")));

const PORT = process.env.PORT || 3000;

// Check if port is in use and try alternative ports
const startServer = (port) => {
  try {
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is busy, trying ${port + 1}`);
        startServer(port + 1);
      } else {
        console.error('Server error:', err);
      }
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
};

startServer(PORT);

export default app;
