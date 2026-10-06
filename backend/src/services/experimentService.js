import fs from 'fs/promises';
import path from 'path';

const CAPSTONE_ROOT = path.resolve(process.cwd(), '../cloud05-release-safety');
const RESULTS_DIR = path.join(CAPSTONE_ROOT, 'experiments/results');

class ExperimentService {
  async getSummary() {
    try {
      const summaryFile = path.join(RESULTS_DIR, 'summary.json');
      const raw = await fs.readFile(summaryFile, 'utf-8');
      const data = JSON.parse(raw);
      return {
        source: 'filesystem',
        status: 'MEASURED',
        results: data,
        count: data.length,
      };
    } catch (err) {
      console.warn('[EXPERIMENTS] Unable to read summary.json:', err.message);
      return {
        source: 'filesystem',
        status: 'PENDING',
        results: [],
        count: 0,
        error: err.message,
      };
    }
  }

  async getExperimentById(id) {
    try {
      const filePath = path.join(RESULTS_DIR, `${id}.json`);
      const raw = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }
}

export const experimentService = new ExperimentService();
export default experimentService;
