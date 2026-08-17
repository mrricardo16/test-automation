import fs from 'node:fs/promises';
import path from 'node:path';
import { repositoryRoot } from './project-config.mjs';

export const evidenceDirectory = path.join(repositoryRoot, 'artifacts', 'phase3b');

export async function writeEvidence(fileName, content) {
  await fs.mkdir(evidenceDirectory, { recursive: true });
  const destination = path.join(evidenceDirectory, fileName);
  await fs.writeFile(destination, content, 'utf8');
  return destination;
}
