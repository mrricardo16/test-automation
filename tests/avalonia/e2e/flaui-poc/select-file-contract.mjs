import fs from 'node:fs';
import path from 'node:path';

export function buildSingleFileSelection(filePath) {
  if (typeof filePath !== 'string' || !filePath.trim()) {
    throw new Error('single file path is required');
  }

  const normalized = path.normalize(filePath);
  if (/\r|\n/u.test(normalized) || (/[\s]/u.test(normalized) && !fs.existsSync(normalized))) {
    throw new Error('single file path is required');
  }
  if (!path.isAbsolute(normalized) || !fs.existsSync(normalized)) {
    throw new Error(`test data file does not exist: ${filePath}`);
  }
  return { filePath: normalized, isSingleFile: true };
}
