import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolves the path to cloud05-release-safety reliably regardless of
 * whether the process is started from the project root, backend directory,
 * or via external scripts.
 */
export function getCapstoneRoot() {
  if (process.env.CAPSTONE_ROOT && fs.existsSync(process.env.CAPSTONE_ROOT)) {
    return path.resolve(process.env.CAPSTONE_ROOT);
  }

  // Check from module directory (__dirname = backend/src/utils)
  const fromModule = path.resolve(__dirname, '../../../cloud05-release-safety');
  if (fs.existsSync(fromModule)) {
    return fromModule;
  }

  // Check from current working directory (project root)
  const fromCwdRoot = path.resolve(process.cwd(), 'cloud05-release-safety');
  if (fs.existsSync(fromCwdRoot)) {
    return fromCwdRoot;
  }

  // Check from backend cwd (../cloud05-release-safety)
  const fromCwdBackend = path.resolve(process.cwd(), '../cloud05-release-safety');
  if (fs.existsSync(fromCwdBackend)) {
    return fromCwdBackend;
  }

  return fromModule;
}

export const CAPSTONE_ROOT = getCapstoneRoot();
export default CAPSTONE_ROOT;
