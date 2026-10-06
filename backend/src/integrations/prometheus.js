import axios from 'axios';

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';

class PrometheusIntegration {
  constructor() {
    this.client = axios.create({
      baseURL: PROMETHEUS_URL,
      timeout: 5000,
    });
  }

  async checkConnection() {
    try {
      const res = await this.client.get('/api/v1/status/buildinfo');
      const version = res.data?.data?.version || 'connected';
      console.log(`[PROMETHEUS] Connected successfully to ${PROMETHEUS_URL} (v${version})`);
      return { connected: true, version, error: null };
    } catch (err) {
      console.error('[PROMETHEUS] Connection check failed:', err.message);
      return { connected: false, version: null, error: err.message };
    }
  }

  async queryInstant(promql) {
    try {
      const res = await this.client.get('/api/v1/query', {
        params: { query: promql },
      });
      if (res.data?.status === 'success') {
        const result = res.data.data.result;
        if (result && result.length > 0) {
          const rawVal = result[0].value ? result[0].value[1] : 0;
          return parseFloat(rawVal) || 0;
        }
        return 0;
      }
      return 0;
    } catch (err) {
      console.error(`[PROMETHEUS] Instant query failed [${promql}]:`, err.message);
      return 0;
    }
  }

  async queryRange(promql, start, end, step = '15s') {
    try {
      const res = await this.client.get('/api/v1/query_range', {
        params: {
          query: promql,
          start,
          end,
          step,
        },
      });
      if (res.data?.status === 'success') {
        const result = res.data.data.result;
        if (result && result.length > 0) {
          // Map [[timestamp, "value"], ...] into { time: 'HH:MM:SS', value: float }
          return result[0].values.map(([ts, val]) => {
            const date = new Date(ts * 1000);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return {
              timestamp: ts,
              time: timeStr,
              value: parseFloat(parseFloat(val).toFixed(2)) || 0,
            };
          });
        }
      }
      return [];
    } catch (err) {
      console.error(`[PROMETHEUS] Range query failed [${promql}]:`, err.message);
      return [];
    }
  }

  async getTargets() {
    try {
      const res = await this.client.get('/api/v1/targets');
      return res.data?.data?.activeTargets || [];
    } catch (err) {
      console.error('[PROMETHEUS] Failed to fetch targets:', err.message);
      return [];
    }
  }

  async getAlerts() {
    try {
      const res = await this.client.get('/api/v1/alerts');
      return res.data?.data?.alerts || [];
    } catch (err) {
      console.error('[PROMETHEUS] Failed to fetch alerts:', err.message);
      return [];
    }
  }

  async getCurrentMetrics() {
    const qReqRate = process.env.PROMQL_REQUEST_RATE || 'sum(rate(http_requests_total[1m])) or vector(0)';
    const qErrRate = process.env.PROMQL_ERROR_RATE || '(sum(rate(http_requests_total{status_code=~"5.."}[1m])) / sum(rate(http_requests_total[1m])) * 100) or vector(0)';
    const qP95 = process.env.PROMQL_P95_LATENCY || 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[1m])) by (le)) * 1000 or vector(0)';
    const qSuccess = process.env.PROMQL_SUCCESS_RATE || '(sum(rate(http_requests_total{status_code!~"5.."}[1m])) / sum(rate(http_requests_total[1m])) * 100) or vector(100)';
    const qAvailability = process.env.PROMQL_AVAILABILITY || '(sum(rate(http_requests_total{status_code!~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100) or vector(100)';

    const [reqRate, errRate, p95, successRate, availability] = await Promise.all([
      this.queryInstant(qReqRate),
      this.queryInstant(qErrRate),
      this.queryInstant(qP95),
      this.queryInstant(qSuccess),
      this.queryInstant(qAvailability),
    ]);

    console.log(`[PROMETHEUS] Live metrics: reqRate=${reqRate.toFixed(2)}, errRate=${errRate.toFixed(2)}%, p95=${p95.toFixed(1)}ms`);

    return {
      source: 'prometheus',
      timestamp: new Date().toISOString(),
      requestRate: parseFloat(reqRate.toFixed(2)),
      errorRate: parseFloat(errRate.toFixed(2)),
      p95Latency: parseFloat(p95.toFixed(1)),
      successRate: parseFloat(successRate.toFixed(2)),
      availability: parseFloat(availability.toFixed(2)),
      queries: {
        requestRate: qReqRate,
        errorRate: qErrRate,
        p95Latency: qP95,
      }
    };
  }
}

export const prometheusIntegration = new PrometheusIntegration();
export default prometheusIntegration;
