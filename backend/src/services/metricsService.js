import prometheusIntegration from '../integrations/prometheus.js';

class MetricsService {
  async getCurrent() {
    return await prometheusIntegration.getCurrentMetrics();
  }

  async getRange(minutes = 10, step = '15s') {
    const end = Math.floor(Date.now() / 1000);
    const start = end - (minutes * 60);

    const qReqRate = process.env.PROMQL_REQUEST_RATE || 'sum(rate(http_requests_total[1m])) or vector(0)';
    const qErrRate = process.env.PROMQL_ERROR_RATE || '(sum(rate(http_requests_total{status_code=~"5.."}[1m])) / sum(rate(http_requests_total[1m])) * 100) or vector(0)';
    const qP95 = process.env.PROMQL_P95_LATENCY || 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[1m])) by (le)) * 1000 or vector(0)';
    const qSuccess = process.env.PROMQL_SUCCESS_RATE || '(sum(rate(http_requests_total{status_code!~"5.."}[1m])) / sum(rate(http_requests_total[1m])) * 100) or vector(100)';

    const [reqSeries, errSeries, p95Series, successSeries] = await Promise.all([
      prometheusIntegration.queryRange(qReqRate, start, end, step),
      prometheusIntegration.queryRange(qErrRate, start, end, step),
      prometheusIntegration.queryRange(qP95, start, end, step),
      prometheusIntegration.queryRange(qSuccess, start, end, step),
    ]);

    // Align series by timestamp into unified time-series objects for Recharts
    const pointMap = new Map();

    reqSeries.forEach(p => {
      pointMap.set(p.timestamp, { time: p.time, timestamp: p.timestamp, requests: p.value, errorRate: 0, latencyP95: 0, successRate: 100 });
    });

    errSeries.forEach(p => {
      const existing = pointMap.get(p.timestamp) || { time: p.time, timestamp: p.timestamp, requests: 0 };
      existing.errorRate = p.value;
      pointMap.set(p.timestamp, existing);
    });

    p95Series.forEach(p => {
      const existing = pointMap.get(p.timestamp) || { time: p.time, timestamp: p.timestamp, requests: 0 };
      existing.latencyP95 = p.value;
      pointMap.set(p.timestamp, existing);
    });

    successSeries.forEach(p => {
      const existing = pointMap.get(p.timestamp) || { time: p.time, timestamp: p.timestamp, requests: 0 };
      existing.successRate = p.value;
      pointMap.set(p.timestamp, existing);
    });

    const combinedSeries = Array.from(pointMap.values()).sort((a, b) => a.timestamp - b.timestamp);

    return {
      source: 'prometheus',
      start,
      end,
      step,
      timeSeries: combinedSeries,
      queries: {
        requestRate: qReqRate,
        errorRate: qErrRate,
        p95Latency: qP95,
      }
    };
  }

  async getTargets() {
    return await prometheusIntegration.getTargets();
  }

  async getAlerts() {
    return await prometheusIntegration.getAlerts();
  }
}

export const metricsService = new MetricsService();
export default metricsService;
