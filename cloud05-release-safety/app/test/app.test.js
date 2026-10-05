const request = require('supertest');
const app = require('../src/app');
const config = require('../src/config');
const { register } = require('../src/metrics');

describe('Cloud05 Demo Service Integration Tests', () => {
  beforeEach(() => {
    // Reset configuration to clean baseline before each test
    config.failureMode = 'none';
    config.failureErrorRate = 1.0;
    config.failureLatencyMs = 100;
    config.ready = true;
    config.alive = true;
  });

  afterAll(async () => {
    register.clear();
  });

  describe('GET / - Root endpoint', () => {
    it('should return 200 with service metadata in healthy mode', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('application', 'cloud05-demo-service');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('environment');
      expect(res.body).toHaveProperty('status', 'healthy');
      expect(res.body).toHaveProperty('hostname');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /health - Liveness probe', () => {
    it('should return 200 OK when service is alive', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.alive).toBe(true);
      expect(res.body.status).toBe('healthy');
    });

    it('should return 503 Service Unavailable when alive is false', async () => {
      config.alive = false;
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(503);
      expect(res.body.alive).toBe(false);
    });
  });

  describe('GET /ready - Readiness probe', () => {
    it('should return 200 OK when service is ready', async () => {
      const res = await request(app).get('/ready');
      expect(res.statusCode).toBe(200);
      expect(res.body.ready).toBe(true);
      expect(res.body.status).toBe('ready');
    });

    it('should return 503 when service is unready', async () => {
      config.ready = false;
      const res = await request(app).get('/ready');
      expect(res.statusCode).toBe(503);
      expect(res.body.ready).toBe(false);
    });

    it('should return 503 when failureMode is unready', async () => {
      config.failureMode = 'unready';
      const res = await request(app).get('/ready');
      expect(res.statusCode).toBe(503);
      expect(res.body.ready).toBe(false);
    });
  });

  describe('GET /version - Release identification', () => {
    it('should return current application version', async () => {
      const res = await request(app).get('/version');
      expect(res.statusCode).toBe(200);
      expect(res.body.application).toBe('cloud05-demo-service');
      expect(res.body.version).toBe(config.version);
    });
  });

  describe('GET /api/status - Operational status', () => {
    it('should expose runtime metrics and configuration', async () => {
      const res = await request(app).get('/api/status');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('uptimeSeconds');
      expect(res.body).toHaveProperty('memoryUsageBytes');
      expect(res.body.failureConfig).toHaveProperty('mode', 'none');
    });
  });

  describe('GET /metrics - Prometheus metrics', () => {
    it('should export Prometheus format metrics including custom counters', async () => {
      // Trigger a request to increment metrics
      await request(app).get('/api/metrics-test');
      const res = await request(app).get('/metrics');
      expect(res.statusCode).toBe(200);
      expect(res.text).toContain('http_requests_total');
      expect(res.text).toContain('http_request_duration_seconds');
      expect(res.text).toContain('app_health_status');
    });
  });

  describe('Failure Injection Scenarios', () => {
    it('should return 500 when failureMode is error', async () => {
      config.failureMode = 'error';
      config.failureErrorRate = 1.0;
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(500);
      expect(res.body.status).toBe('error');
      expect(res.body.failureMode).toBe('error');
    });

    it('should introduce latency when failureMode is latency', async () => {
      config.failureMode = 'latency';
      config.failureLatencyMs = 80;
      const start = Date.now();
      const res = await request(app).get('/api/metrics-test');
      const duration = Date.now() - start;
      expect(res.statusCode).toBe(200);
      expect(duration).toBeGreaterThanOrEqual(70);
    });

    it('should support dynamic runtime failure reconfiguration via /api/admin/failure', async () => {
      const updateRes = await request(app)
        .post('/api/admin/failure')
        .send({ mode: 'error', errorRate: 1.0 });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.currentConfig.mode).toBe('error');

      const failedRes = await request(app).get('/api/status');
      expect(failedRes.statusCode).toBe(500);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for undefined routes', async () => {
      const res = await request(app).get('/non-existent-endpoint');
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error', 'Not Found');
    });
  });
});
