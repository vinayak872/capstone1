/**
 * Prometheus Observability Service Architecture
 * 
 * Target Endpoint: http://localhost:9090/api/v1/query_range
 * 
 * ACADEMIC HONESTY:
 * This service currently returns prototype example data.
 * Functions are structured to accept standard PromQL queries when real integration is activated.
 */

import { demoMetricsData } from '../data/demoData';

// Base URL for Prometheus HTTP API (accessible locally at port 9090)
export const PROMETHEUS_API_URL = import.meta.env.VITE_PROMETHEUS_URL || 'http://localhost:9090';

// Real-time connection flag: currently false because frontend queries are not yet wired to port 9090
export const isPrometheusLive = false;

/**
 * Retrieves HTTP request rate (requests/sec)
 * PromQL Query Target: sum(rate(cloud05_http_requests_total[1m]))
 */
export const getRequestRate = async () => {
  // TODO: Replace demo implementation with Prometheus HTTP API query.
  // Example: await axios.get(`${PROMETHEUS_API_URL}/api/v1/query?query=sum(rate(cloud05_http_requests_total[1m]))`)
  return {
    source: 'PROTOTYPE',
    isLive: false,
    value: demoMetricsData.summary.requestRate,
    timeSeries: demoMetricsData.timeSeries.map(d => ({ time: d.time, value: d.requests }))
  };
};

/**
 * Retrieves HTTP 5xx error rate (%)
 * PromQL Query Target: sum(rate(cloud05_http_requests_total{status_code=~"5.."}[1m])) / sum(rate(cloud05_http_requests_total[1m])) * 100
 */
export const getErrorRate = async () => {
  // TODO: Replace demo implementation with Prometheus HTTP API query.
  return {
    source: 'PROTOTYPE',
    isLive: false,
    value: demoMetricsData.summary.errorRate,
    threshold: 5.0,
    timeSeries: demoMetricsData.timeSeries.map(d => ({ time: d.time, value: d.errorRate }))
  };
};

/**
 * Retrieves P95 response latency in milliseconds
 * PromQL Query Target: histogram_quantile(0.95, sum(rate(cloud05_http_request_duration_seconds_bucket[1m])) by (le)) * 1000
 */
export const getP95Latency = async () => {
  // TODO: Replace demo implementation with Prometheus HTTP API query.
  return {
    source: 'PROTOTYPE',
    isLive: false,
    value: demoMetricsData.summary.p95Latency,
    threshold: 150,
    timeSeries: demoMetricsData.timeSeries.map(d => ({ time: d.time, value: d.latencyP95 }))
  };
};

/**
 * Retrieves service availability SLA percentage
 * PromQL Query Target: sum(rate(cloud05_http_requests_total{status_code!~"5.."}[5m])) / sum(rate(cloud05_http_requests_total[5m])) * 100
 */
export const getAvailability = async () => {
  // TODO: Replace demo implementation with Prometheus HTTP API query.
  return {
    source: 'PROTOTYPE',
    isLive: false,
    value: demoMetricsData.summary.availability,
    threshold: 99.5,
    timeSeries: demoMetricsData.timeSeries.map(d => ({ time: d.time, value: d.successRate }))
  };
};

export default {
  isPrometheusLive,
  getRequestRate,
  getErrorRate,
  getP95Latency,
  getAvailability,
};
