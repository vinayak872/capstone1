const client = require('prom-client');
const config = require('./config');

const register = new client.Registry();

// Enable standard default Node.js and process metrics
client.collectDefaultMetrics({
  register,
  prefix: 'cloud05_',
  labels: { version: config.version, app: config.application }
});

// HTTP Requests Total Counter
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total count of HTTP requests processed by the service',
  labelNames: ['method', 'route', 'status_code', 'version'],
  registers: [register]
});

// HTTP Request Duration Histogram
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'version'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 1.5, 2, 5],
  registers: [register]
});

// App Health Status Gauge (1 = healthy, 0 = unhealthy)
const appHealthStatus = new client.Gauge({
  name: 'app_health_status',
  help: 'Operational health status of the application (1 = healthy, 0 = degraded/unhealthy)',
  labelNames: ['version'],
  registers: [register]
});

// Initialize gauge based on failureMode
appHealthStatus.labels(config.version).set(config.failureMode === 'none' ? 1 : 0);

module.exports = {
  register,
  httpRequestsTotal,
  httpRequestDurationSeconds,
  appHealthStatus
};
