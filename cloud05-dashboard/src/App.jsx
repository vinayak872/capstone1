import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Releases from './pages/Releases';
import Rollout from './pages/Rollout';
import Metrics from './pages/Metrics';
import GitOps from './pages/GitOps';
import Experiments from './pages/Experiments';
import Evidence from './pages/Evidence';

export default function App() {
  const [connectionStatus, setConnectionStatus] = useState('LIVE');

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div className="main-content-wrapper">
        <Topbar connectionStatus={connectionStatus} />

        <main style={{ flex: 1 }}>
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  connectionStatus={connectionStatus}
                  setConnectionStatus={setConnectionStatus}
                />
              }
            />
            <Route path="/releases" element={<Releases />} />
            <Route path="/rollout" element={<Rollout />} />
            <Route path="/metrics" element={<Metrics />} />
            <Route path="/gitops" element={<GitOps />} />
            <Route path="/experiments" element={<Experiments />} />
            <Route path="/evidence" element={<Evidence />} />
          </Routes>
        </main>

        {/* Academic Capstone Footer (Honest Disclaimer) */}
        <footer className="app-footer">
          <div>
            <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>CLOUD-05</strong>: GitOps CI/CD with Progressive Delivery — Software Modelling &amp; DevOps Capstone
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Research prototype &amp; experimental evaluation environment.
          </div>
        </footer>
      </div>
    </div>
  );
}
