const app = require('./app');
const config = require('./config');

const server = app.listen(config.port, () => {
  console.log(`[${new Date().toISOString()}] ${config.application} v${config.version} running on port ${config.port} (env=${config.environment}, failureMode=${config.failureMode})`);
});

// Graceful shutdown handling
const shutdown = (signal) => {
  console.log(`[${new Date().toISOString()}] Received ${signal}, shutting down gracefully...`);
  config.ready = false; // Stop accepting new readiness traffic
  server.close(() => {
    console.log(`[${new Date().toISOString()}] HTTP server closed.`);
    process.exit(0);
  });

  // Force exit after 10s if connections remain open
  setTimeout(() => {
    console.error(`[${new Date().toISOString()}] Forcefully terminating after timeout`);
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = server;
