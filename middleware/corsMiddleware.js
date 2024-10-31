const cors = require('cors');
require('dotenv').config();

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://localhost:3000', // Set the origin from environment variables or use default
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization', 'my-custom-header'], // Specify allowed headers
  credentials: true, // Enable credentials (cookies, etc.)
};

// Export the configured CORS middleware
module.exports = cors(corsOptions);
