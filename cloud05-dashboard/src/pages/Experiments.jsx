import React from 'react';
import { Database, ShieldCheck, FileText, ArrowRight } from 'lucide-react';
import ExperimentComparison from '../components/ExperimentComparison';
import DataSourceBadge from '../components/DataSourceBadge';

export default function Experiments() {
  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Database size={24} color="var(--status-blue)" />
            Empirical Research Evaluation &amp; Matrix
          </h1>
          <p className="page-subtitle">
            Controlled comparative evaluation: Conventional Deployment (RollingUpdate) vs. Progressive Delivery (Argo Rollouts).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <DataSourceBadge source="PENDING" label="EXPERIMENTAL STATUS: NOT YET MEASURED" />
        </div>
      </div>

      {/* Main Experiment Comparison Component (Protocols, Metrics Definitions, Matrix) */}
      <ExperimentComparison />
    </div>
  );
}
