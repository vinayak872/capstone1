import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import infrastructureRoutes from './routes/infrastructure.js';
import releasesRoutes from './routes/releases.js';
import gitopsRoutes from './routes/gitops.js';
import rolloutRoutes from './routes/rollout.js';
import metricsRoutes from './routes/metrics.js';
import healthRoutes from './routes/health.js';
import experimentsRoutes from './routes/experiments.js';
import streamRoutes from './routes/stream.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  if (req.path !== '/api/stream') {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

// Mount Routes
app.use('/api/infrastructure', infrastructureRoutes);
app.use('/api/releases', releasesRoutes);
app.use('/api/gitops', gitopsRoutes);
app.use('/api/rollout', rolloutRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/experiments', experimentsRoutes);
app.use('/api/stream', streamRoutes);

// Root Health
app.get('/health', (req, res) => {
  res.json({
    service: 'cloud05-dashboard-backend',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

const server = app.listen(PORT, () => {
  console.log(`==========================================================`);
  console.log(`  CLOUD-05 Dashboard Integration Backend Running         `);
  console.log(`  Port:       http://localhost:${PORT}                   `);
  console.log(`  K8s NS:     ${process.env.K8S_NAMESPACE || 'cloud05'}  `);
  console.log(`  Prometheus: ${process.env.PROMETHEUS_URL || 'http://localhost:9090'}`);
  console.log(`  Argo CD:    ${process.env.ARGOCD_URL || 'http://localhost:8085'}`);
  console.log(`==========================================================`);
});

export default server;
