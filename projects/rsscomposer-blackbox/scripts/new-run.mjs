import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const runId = process.argv[2];
if (!runId || !/^[A-Z0-9-]+$/.test(runId)) {
  throw new Error('Usage: node scripts/new-run.mjs <RUN-ID> (uppercase letters, digits, and hyphens only)');
}

const projectRoot = resolve(import.meta.dirname, '..');
const runDirectory = resolve(projectRoot, 'runs', runId);
if (existsSync(runDirectory)) throw new Error(`Run already exists: ${runId}`);

mkdirSync(runDirectory, { recursive: true });
writeFileSync(resolve(runDirectory, 'reference.json'), `${JSON.stringify({ RunId: runId, Status: 'NOT_EXECUTED', CreatedBy: 'new-run.mjs', ExecutionAuthorized: false }, null, 2)}\n`, 'utf8');
writeFileSync(resolve(runDirectory, 'index.json'), `${JSON.stringify({ RunId: runId, TestCaseIds: [], ArtifactsCopied: false, ExecutionPerformed: false }, null, 2)}\n`, 'utf8');
console.log(`Created non-executing run skeleton: ${runDirectory}`);
