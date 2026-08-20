import fs from 'node:fs/promises';
import path from 'node:path';
import { repositoryRoot } from './project-config.mjs';

export const evidenceDirectory = path.join(repositoryRoot, 'projects', 'test-workflow', 'artifacts', 'phase3b');
export const runEvidenceDirectory = path.join(repositoryRoot, 'projects', 'test-workflow', 'artifacts', 'phase3b-run');

export async function writeEvidence(fileName, content, directory = evidenceDirectory) {
  await fs.mkdir(directory, { recursive: true });
  const destination = path.join(directory, fileName);
  await fs.writeFile(destination, content, 'utf8');
  return destination;
}
