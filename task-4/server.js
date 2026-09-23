const express = require('express');

const app = express();
const DEFAULT_PORT = 5000;
const PORT = process.env.PORT || DEFAULT_PORT;
const HOST = process.env.HOST || '0.0.0.0';

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the API!'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

// 404 handler for unmatched routes
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

let server;

function startServer(port) {
  server = app.listen(port, HOST);

  server.on('listening', () => {
    console.log(
      `Server running on http://${HOST}:${port}`
    );
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && !process.env.PORT && port === DEFAULT_PORT) {
      console.warn(`Port ${port} is in use, falling back to port 5001...`);
      startServer(5001);
      return;
    }
    console.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  });
}

// Graceful shutdown handling for SIGTERM and SIGINT
function gracefulShutdown(signal) {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  if (server) {
    server.close(() => {
      console.log('HTTP server closed cleanly.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }

  // Force shutdown after timeout if connections remain open
  setTimeout(() => {
    console.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer(PORT);