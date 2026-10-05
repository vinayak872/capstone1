const os = require('os');

const config = {
  application: 'cloud05-demo-service',
  version: process.env.APP_VERSION || '1.0.0',
  environment: process.env.ENVIRONMENT || 'demo',
  port: parseInt(process.env.PORT, 10) || 8080,
  hostname: os.hostname(),

  // Failure Injection Controls
  // Supported modes: 'none' | 'error' | 'latency' | 'intermittent' | 'unready'
  // If version is 3.0.0, default to 'error' unless explicitly overridden
  failureMode: (process.env.FAILURE_MODE && process.env.FAILURE_MODE !== 'none')
    ? process.env.FAILURE_MODE
    : ((process.env.APP_VERSION === '3.0.0' || (process.env.APP_VERSION && process.env.APP_VERSION.startsWith('3.'))) ? 'error' : 'none'),

  // Error rate for 'error' and 'intermittent' modes: 0.0 (0%) to 1.0 (100%)
  failureErrorRate: parseFloat(process.env.FAILURE_ERROR_RATE) || 1.0,

  // Latency injection in milliseconds
  failureLatencyMs: parseInt(process.env.FAILURE_LATENCY_MS, 10) || 1500,

  // Readiness override
  ready: process.env.INITIAL_READY !== 'false',
  alive: true,
};

module.exports = config;
