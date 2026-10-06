import React, { useState, useEffect, useCallback } from 'react';
import { Gauge, AlertTriangle, Activity, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import MetricsChart from '../components/MetricsChart';
import DataSourceBadge from '../components/DataSourceBadge';
import { getMetricsCurrent, getMetricsRange } from '../services/api';

export default function Metrics() {
  const [currentMetrics, setCurrentMetrics] = useState({
    requestRate: 0,
    errorRate: 0,
    p95Latency: 0,
    successRate: 100,
    availability: 100,
    queries: {}
  });

  const [rangeData, setRangeData] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchPrometheusData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [curRes, rangeRes] = await Promise.all([
        getMetricsCurrent(),
        getMetricsRange(10, '15s'),
      ]);

      if (curRes.data) {
        setCurrentMetrics(curRes.data);
      }

      if (rangeRes.data?.timeSeries) {
        setRangeData(rangeRes.data.timeSeries);
      }

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('[METRICS] Error fetching Prometheus telemetry:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Poll Prometheus metrics every 5 seconds
  useEffect(() => {
    fetchPrometheusData();
    const interval = setInterval(fetchPrometheusData, 5000);
    return () => clearInterval(interval);
  }, [fetchPrometheusData]);

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Gauge size={24} color="var(--status-blue)" />
            Runtime Observability &amp; Telemetry
          </h1>
          <p className="page-subtitle">
            Live Prometheus HTTP API telemetry scraped from the microservice at 15-second intervals.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <DataSourceBadge source="LIVE" label="LIVE PROMETHEUS TELEMETRY" />
          {lastUpdated && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Last scrape: {lastUpdated}
            </span>
          )}
          <button
            onClick={fetchPrometheusData}
            disabled={isRefreshing}
            className="btn btn-secondary"
            style={{ fontSize: '12px' }}
          >
            <RefreshCw size={13} className={isRefreshing ? 'spin-anim' : ''} />
            <span>Query Now</span>
          </button>
        </div>
      </div>

      {/* PromQL Query Diagnostic Banner */}
      <div className="card" style={{
        marginBottom: '24px',
        padding: '16px 20px',
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        borderLeft: '4px solid var(--status-blue)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' }}>
            Active PromQL Queries (Prometheus port 9090)
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Target: http://localhost:9090
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#93c5fd' }}>
          <div><code>req_rate: {currentMetrics.queries?.requestRate || 'sum(rate(http_requests_total[1m]))'}</code></div>
          <div><code>err_rate: {currentMetrics.queries?.errorRate || 'sum(rate(http_requests_total{status_code=~"5.."}[1m]))'}</code></div>
          <div><code>p95_lat : {currentMetrics.queries?.p95Latency || 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[1m])) by (le))'}</code></div>
        </div>
      </div>

      {/* 4 Live Summary Metric Cards */}
      <div className="grid-4">
        <MetricCard
          title="REQUEST RATE"
          value={`${currentMetrics.requestRate} req/s`}
          change="Live vector"
          isPositive={true}
          icon={Activity}
        />

        <MetricCard
          title="ERROR RATE"
          value={`${currentMetrics.errorRate}%`}
          change={currentMetrics.errorRate > 5 ? 'Threshold breach (>5%)' : 'Nominal (<5%)'}
          isPositive={currentMetrics.errorRate <= 5}
          isWarning={currentMetrics.errorRate > 5}
          warningThreshold="5.0%"
          icon={AlertTriangle}
        />

        <MetricCard
          title="P95 LATENCY"
          value={currentMetrics.p95Latency}
          unit="ms"
          change={currentMetrics.p95Latency > 150 ? 'Spike (>150ms)' : 'Nominal (<150ms)'}
          isPositive={currentMetrics.p95Latency <= 150}
          isWarning={currentMetrics.p95Latency > 150}
          warningThreshold="150ms"
          icon={Clock}
        />

        <MetricCard
          title="SUCCESS RATE"
          value={`${currentMetrics.successRate}%`}
          change="Analysis gate: 95%"
          isPositive={currentMetrics.successRate >= 95}
          isWarning={currentMetrics.successRate < 95}
          warningThreshold="95.0%"
          icon={CheckCircle}
        />
      </div>

      {/* Real Prometheus Time-Series Recharts Graphs */}
      <div className="grid-2">
        <MetricsChart
          title="Request Rate Over Time (req/s)"
          data={rangeData}
          dataKey="requests"
          chartType="area"
          color="#3b82f6"
          unit="req/s"
        />

        <MetricsChart
          title="HTTP 5xx Error Rate Over Time (%)"
          data={rangeData}
          dataKey="errorRate"
          chartType="line"
          color="#ef4444"
          unit="%"
          threshold={5.0}
          thresholdLabel="Rollback Threshold"
        />
      </div>

      <div className="grid-2">
        <MetricsChart
          title="P95 Latency Over Time (ms)"
          data={rangeData}
          dataKey="latencyP95"
          chartType="area"
          color="#f59e0b"
          unit="ms"
          threshold={150}
          thresholdLabel="SLA Threshold"
        />

        <MetricsChart
          title="Success Rate Over Time (%)"
          data={rangeData}
          dataKey="successRate"
          chartType="line"
          color="#10b981"
          unit="%"
          threshold={95.0}
          thresholdLabel="Min Success Gate"
        />
      </div>
    </div>
  );
}
