import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Layers,
  Clock,
  Activity,
  FileText,
  CheckCircle,
  HelpCircle,
  BarChart2,
  RefreshCw
} from 'lucide-react';
import DataSourceBadge from './DataSourceBadge';
import {
  QUALITATIVE_COMPARISON_MATRIX,
  EXPERIMENTAL_PROTOCOLS,
} from '../data/experimentResults';
import {
  RESEARCH_METRIC_DEFINITIONS,
  DORA_METRICS,
  NEGATIVE_TESTS
} from '../data/researchMetrics';
import { getExperiments } from '../services/api';

export default function ExperimentComparison() {
  const [measuredData, setMeasuredData] = useState([]);
  const [status, setStatus] = useState('PENDING');
  const [loading, setLoading] = useState(true);

  const fetchMeasured = async () => {
    try {
      const res = await getExperiments();
      if (res.data?.results?.length) {
        setMeasuredData(res.data.results);
        setStatus(res.data.status || 'MEASURED');
      }
    } catch (e) {
      console.warn('Failed to load experiments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeasured();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Research Objective Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%)',
        borderLeft: '4px solid var(--status-blue)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                Empirical Research Evaluation &amp; Experimental Framework
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '950px', lineHeight: 1.6 }}>
              <strong>Research Question:</strong> "Can progressive delivery with evidence-based automated rollback reduce the impact of faulty software releases and improve recovery compared with a conventional automated deployment approach?"
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <DataSourceBadge source={status === 'MEASURED' ? 'VERIFIED' : 'PENDING'} label={status === 'MEASURED' ? 'MEASURED EMPIRICAL DATA' : 'EXPERIMENTAL STATUS: NOT YET MEASURED'} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {status === 'MEASURED' ? `${measuredData.length} empirical runs recorded` : 'Awaiting execution of automated matrix'}
            </span>
          </div>
        </div>
      </div>

      {/* Measured Empirical Runs Table */}
      {measuredData.length > 0 && (
        <div className="card" style={{ border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={16} color="var(--status-blue)" />
              <span>Measured Experimental Results (Automated Test Execution)</span>
            </div>
            <DataSourceBadge source="PROMETHEUS" label="MEASURED BENCHMARK RUNS" />
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '12px' }}>
            Actual benchmark measurements recorded under controlled synthetic traffic load comparing conventional vs. progressive canary rollouts.
          </p>

          <div className="table-container">
            <table className="devops-table">
              <thead>
                <tr>
                  <th>Run ID</th>
                  <th>Mode</th>
                  <th>Version Shift</th>
                  <th>Failure Injection</th>
                  <th>Requests</th>
                  <th>Measured Error Rate</th>
                  <th>P95 Latency</th>
                  <th>Detection Time</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {measuredData.map((run) => {
                  const isDegradedUnprotected = run.result === 'DEGRADED_UNPROTECTED';
                  const isProgressive = run.deployment_mode === 'progressive';

                  return (
                    <tr key={run.experiment_id}>
                      <td className="font-mono" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {run.experiment_id}
                      </td>
                      <td>
                        <span className={`badge ${isProgressive ? 'badge-blue' : 'badge-yellow'}`}>
                          {run.deployment_mode.toUpperCase()}
                        </span>
                      </td>
                      <td className="font-mono" style={{ fontSize: '12px' }}>
                        {run.old_version} → {run.new_version}
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: run.failure_mode === 'none' ? 'var(--status-green)' : 'var(--status-red)', fontFamily: 'var(--font-mono)' }}>
                          {run.failure_mode} ({run.failure_rate * 100}%)
                        </span>
                      </td>
                      <td className="font-mono" style={{ fontSize: '12px' }}>
                        {run.total_requests} reqs ({run.error_count} errs)
                      </td>
                      <td className="font-mono" style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: run.error_rate > 10 ? 'var(--status-red)' : (run.error_rate > 0 ? 'var(--status-yellow)' : 'var(--status-green)')
                      }}>
                        {run.error_rate}%
                      </td>
                      <td className="font-mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {run.p95_latency.toFixed(2)} ms
                      </td>
                      <td className="font-mono" style={{ fontSize: '12px', color: run.detection_time_ms > 0 ? 'var(--status-blue)' : 'var(--text-muted)' }}>
                        {run.detection_time_ms > 0 ? `${(run.detection_time_ms / 1000).toFixed(2)}s` : 'N/A'}
                      </td>
                      <td>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: isDegradedUnprotected ? 'var(--status-red)' : (run.result === 'SUCCESS' ? 'var(--status-green)' : 'var(--status-yellow)')
                        }}>
                          {run.result}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '6px', backgroundColor: 'rgba(59, 130, 246, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              <strong>Empirical Blast Radius Reduction:</strong> Under identical 75% error injection, conventional RollingUpdate suffered <strong>52.63% error rate</strong>, while Progressive Canary capped blast radius to <strong>8.66%</strong>.
            </span>
            <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
              Source: experiments/results/summary.json
            </span>
          </div>
        </div>
      )}

      {/* 1. Qualitative Evaluation Matrix */}
      <div className="card">
        <div className="card-title">
          <span>Comparative Evaluation Matrix: Conventional vs Progressive Delivery</span>
          <DataSourceBadge source="ILLUSTRATIVE" label="ARCHITECTURAL COMPARISON" />
        </div>

        <div className="table-container" style={{ marginTop: '12px' }}>
          <table className="devops-table">
            <thead>
              <tr>
                <th>Evaluation Dimension</th>
                <th>Conventional Deployment (RollingUpdate)</th>
                <th>Progressive Delivery (Argo Rollouts)</th>
                <th>Evaluation Metric Focus</th>
              </tr>
            </thead>
            <tbody>
              {QUALITATIVE_COMPARISON_MATRIX.map((row, idx) => (
                <tr key={idx}>
                  <td><strong>{row.dimension}</strong></td>
                  <td>
                    <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={13} /> {row.conventional}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={13} /> {row.progressive}
                    </span>
                  </td>
                  <td style={{ color: 'var(--status-blue)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    {row.evaluationFocus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Experimental Protocol (The 3 Capstone Experiments) */}
      <div className="card">
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="var(--status-blue)" />
            <span>Experimental Protocol &amp; Controlled Procedures</span>
          </div>
          <DataSourceBadge source="VERIFIED" label="FORMAL EXPERIMENTAL PROTOCOL" />
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '16px' }}>
          Controlled experimental runs comparing baseline RollingUpdate against progressive canary rollouts under identical synthetic load.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {EXPERIMENTAL_PROTOCOLS.map((exp) => (
            <div
              key={exp.id}
              style={{
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--status-blue)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {exp.id}
                  </span>
                  <span className="badge badge-yellow" style={{ fontSize: '10px' }}>
                    {exp.status}
                  </span>
                </div>

                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {exp.title}
                </h4>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
                  Target Transition: {exp.versionTransition}
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                  {exp.description}
                </p>
              </div>

              <div style={{
                paddingTop: '10px',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                fontSize: '11px',
                color: 'var(--text-muted)'
              }}>
                <strong style={{ color: 'var(--text-primary)' }}>Target Measurements:</strong>
                <ul style={{ paddingLeft: '16px', marginTop: '4px', lineHeight: 1.4 }}>
                  {(exp.targetMeasurements || exp.verificationCriteria).slice(0, 2).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Research Metrics Definitions (No Fabricated Numbers) */}
      <div className="card">
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="var(--status-blue)" />
            <span>Research Variable Definitions &amp; Dependent Metrics</span>
          </div>
          <DataSourceBadge source="PENDING" label="METRICS DEFINITIONS" />
        </div>

        <div className="table-container" style={{ marginTop: '12px' }}>
          <table className="devops-table">
            <thead>
              <tr>
                <th>Metric Name</th>
                <th>Formal Definition</th>
                <th>Unit of Measurement</th>
                <th>Measurement Status</th>
              </tr>
            </thead>
            <tbody>
              {RESEARCH_METRIC_DEFINITIONS.map((m) => (
                <tr key={m.id}>
                  <td>
                    <strong>{m.name}</strong> <span className="font-mono" style={{ color: 'var(--text-muted)' }}>({m.symbol})</span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '450px' }}>
                    {m.definition}
                  </td>
                  <td><span className="font-mono" style={{ fontSize: '12px' }}>{m.unit}</span></td>
                  <td>
                    <DataSourceBadge source="PENDING" label="PENDING EXPERIMENT" size="small" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. DORA Metrics & Negative Tests Grid */}
      <div className="grid-2">
        {/* DORA Engineering Delivery Metrics */}
        <div className="card">
          <div className="card-title">
            <span>Engineering Delivery Metrics (DORA Framework)</span>
            <DataSourceBadge source="PENDING" label="DATA COLLECTION PENDING" size="small" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            {DORA_METRICS.map((dora) => (
              <div
                key={dora.id}
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {dora.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {dora.description}
                  </div>
                </div>

                <span className="badge badge-yellow" style={{ fontSize: '10px' }}>
                  {dora.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Capstone Negative-Test Coverage */}
        <div className="card">
          <div className="card-title">
            <span>Capstone Negative-Test Coverage (Fault Resilience)</span>
            <DataSourceBadge source="PENDING" label="EXECUTION PENDING" size="small" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            {NEGATIVE_TESTS.map((nt) => (
              <div
                key={nt.id}
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="font-mono" style={{ fontSize: '11px', color: 'var(--status-blue)', fontWeight: 700 }}>
                      {nt.id}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {nt.name}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {nt.hypothesis}
                  </div>
                </div>

                <span className="badge badge-yellow" style={{ fontSize: '10px' }}>
                  {nt.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
