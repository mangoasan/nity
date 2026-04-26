import { existsSync } from 'fs';
import { join } from 'path';

function uniquePaths(paths: string[]) {
  return [...new Set(paths)];
}

export function getUploadsDir() {
  const candidates = uniquePaths([
    join(process.cwd(), 'uploads'),
    join(process.cwd(), 'apps', 'api', 'uploads'),
    join(__dirname, '..', '..', '..', 'uploads'),
    join(__dirname, '..', '..', '..', '..', 'uploads'),
  ]);

  const existingDir = candidates.find((candidate) => existsSync(candidate));
  return existingDir || candidates[0];
}

export function getMasterUploadsDir() {
  return join(getUploadsDir(), 'masters');
}
