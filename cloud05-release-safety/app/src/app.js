const express = require('express');
const config = require('./config');
const { register, httpRequestsTotal, httpRequestDurationSeconds, appHealthStatus } = require('./metrics');

const app = express();
app.use(express.json());

// Track deterministic request index for intermittent failure patterns
let requestCount = 0;

// Observability: Metrics and Request Timing Middleware
app.use((req, res, next) => {
  const startHrTime = process.hrtime();

  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const durationInSeconds = elapsedHrTime[0] + elapsedHrTime[1] / 1e9;
    const route = req.route ? req.route.path : req.path;
    const statusCode = res.statusCode.toString();

    // Increment Prometheus counters
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: statusCode,
      version: config.version
    });

    httpRequestDurationSeconds.observe({
      method: req.method,
      route,
      status_code: statusCode,
      version: config.version
    }, durationInSeconds);

    // Structured JSON log for observability
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? 'ERROR' : 'INFO',
      app: config.application,
      version: config.version,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Math.round(durationInSeconds * 1000),
      failureMode: config.failureMode,
      hostname: config.hostname
    };
    if (req.path !== '/metrics' && req.path !== '/health' && req.path !== '/ready') {
      console.log(JSON.stringify(logEntry));
    }
  });

  next();
});

// Middleware for controlled failure injection (applied to business endpoints)
const failureInjectionMiddleware = async (req, res, next) => {
  requestCount++;

  // 1. Latency injection mode
  if (config.failureMode === 'latency') {
    await new Promise((resolve) => setTimeout(resolve, config.failureLatencyMs));
  }

  // 2. Controlled error injection mode
  if (config.failureMode === 'error') {
    const shouldFail = Math.random() <= config.failureErrorRate;
    if (shouldFail) {
      appHealthStatus.labels(config.version).set(0);
      return res.status(500).json({
        application: config.application,
        version: config.version,
        environment: config.environment,
        status: 'error',
        error: 'Simulated runtime failure (mode=error)',
        failureMode: config.failureMode,
        timestamp: new Date().toISOString(),
        hostname: config.hostname
      });
    }
  }

  // 3. Intermittent failure mode (every Nth request or probabilistic)
  if (config.failureMode === 'intermittent') {
    const shouldFail = (requestCount % 2 === 0) || (Math.random() <= config.failureErrorRate);
    if (shouldFail) {
      appHealthStatus.labels(config.version).set(0);
      return res.status(500).json({
        application: config.application,
        version: config.version,
        environment: config.environment,
        status: 'intermittent_failure',
        error: 'Simulated intermittent failure (mode=intermittent)',
        failureMode: config.failureMode,
        timestamp: new Date().toISOString(),
        hostname: config.hostname
      });
    }
  }

  next();
};

// Root endpoint
app.get('/', failureInjectionMiddleware, (req, res) => {
  res.json({
    application: config.application,
    version: config.version,
    environment: config.environment,
    status: config.failureMode === 'none' ? 'healthy' : `degraded (${config.failureMode})`,
    timestamp: new Date().toISOString(),
    hostname: config.hostname,
    message: `Release version ${config.version} active.`
  });
});

// Liveness Probe Endpoint: /health
app.get('/health', (req, res) => {
  if (!config.alive) {
    return res.status(503).json({
      status: 'unhealthy',
      alive: false,
      timestamp: new Date().toISOString()
    });
  }
  res.status(200).json({
    status: 'healthy',
    alive: true,
    version: config.version,
    timestamp: new Date().toISOString(),
    hostname: config.hostname
  });
});

// Readiness Probe Endpoint: /ready
app.get('/ready', (req, res) => {
  if (!config.ready || config.failureMode === 'unready') {
    return res.status(503).json({
      status: 'not_ready',
      ready: false,
      reason: config.failureMode === 'unready' ? 'Injected unready failure mode' : 'Service starting or drained',
      timestamp: new Date().toISOString()
    });
  }
  res.status(200).json({
    status: 'ready',
    ready: true,
    version: config.version,
    timestamp: new Date().toISOString(),
    hostname: config.hostname
  });
});

// Version Endpoint: /version
app.get('/version', (req, res) => {
  res.json({
    application: config.application,
    version: config.version,
    environment: config.environment,
    failureMode: config.failureMode,
    hostname: config.hostname,
    timestamp: new Date().toISOString()
  });
});

// Detailed API Status Endpoint: /api/status
app.get('/api/status', failureInjectionMiddleware, (req, res) => {
  res.json({
    application: config.application,
    version: config.version,
    environment: config.environment,
    status: config.failureMode === 'none' ? 'healthy' : 'degraded',
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageBytes: process.memoryUsage().rss,
    failureConfig: {
      mode: config.failureMode,
      errorRate: config.failureErrorRate,
      latencyMs: config.failureLatencyMs
    },
    hostname: config.hostname,
    timestamp: new Date().toISOString()
  });
});

// Metrics Test endpoint for controlled load testing
app.get('/api/metrics-test', failureInjectionMiddleware, (req, res) => {
  res.json({
    status: 'ok',
    version: config.version,
    processedBy: config.hostname,
    timestamp: new Date().toISOString()
  });
});

// Admin endpoint for dynamic runtime failure configuration (useful in live tests/experiments)
app.post('/api/admin/failure', (req, res) => {
  const { mode, errorRate, latencyMs, ready, alive } = req.body || {};
  if (mode !== undefined) config.failureMode = mode;
  if (errorRate !== undefined) config.failureErrorRate = parseFloat(errorRate);
  if (latencyMs !== undefined) config.failureLatencyMs = parseInt(latencyMs, 10);
  if (ready !== undefined) config.ready = Boolean(ready);
  if (alive !== undefined) config.alive = Boolean(alive);

  appHealthStatus.labels(config.version).set(config.failureMode === 'none' && config.ready && config.alive ? 1 : 0);

  res.json({
    message: 'Failure configuration updated successfully',
    currentConfig: {
      mode: config.failureMode,
      errorRate: config.failureErrorRate,
      latencyMs: config.failureLatencyMs,
      ready: config.ready,
      alive: config.alive
    }
  });
});

// Prometheus Metrics Endpoint: /metrics
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    version: config.version
  });
});

module.exports = app;
