import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class GitIntegration {
  async getMetadata() {
    try {
      const { stdout: commitInfo } = await execAsync('git log -1 --pretty=format:"%H|%h|%s|%an|%cI"');
      const { stdout: branch } = await execAsync('git rev-parse --abbrev-ref HEAD');

      const parts = commitInfo.trim().split('|');
      const metadata = {
        source: 'git',
        commitHash: parts[0] || 'unknown',
        shortCommit: parts[1] || 'unknown',
        message: parts[2] || 'unknown',
        author: parts[3] || 'unknown',
        timestamp: parts[4] || new Date().toISOString(),
        branch: branch.trim() || 'main',
      };

      console.log(`[GIT] Latest commit: ${metadata.shortCommit} (${metadata.branch})`);
      return metadata;
    } catch (err) {
      console.warn('[GIT] Unable to query git repository:', err.message);
      return {
        source: 'git',
        commitHash: 'unknown',
        shortCommit: 'unknown',
        message: 'No git repository metadata found',
        author: 'unknown',
        timestamp: new Date().toISOString(),
        branch: 'main',
        error: err.message
      };
    }
  }

  async getRecentCommits(count = 5) {
    try {
      const { stdout } = await execAsync(`git log -n ${count} --pretty=format:"%H|%h|%s|%an|%cI"`);
      return stdout.trim().split('\n').filter(Boolean).map(line => {
        const parts = line.split('|');
        return {
          commit: parts[0],
          shortCommit: parts[1],
          message: parts[2],
          author: parts[3],
          timestamp: parts[4],
        };
      });
    } catch (err) {
      return [];
    }
  }
}

export const gitIntegration = new GitIntegration();
export default gitIntegration;
