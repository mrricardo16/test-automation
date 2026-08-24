import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const repositoryRoot = resolve(projectRoot, '..', '..');
const handoffRunId = 'DEV-HANDOFF-REAL-20260824-105102';
const requiredPaths = [
  'README.md', 'project.json', 'config/project.example.json', 'config/README.md', 'config/.gitignore',
  'handoff/README.md', 'handoff/current.json',
  `handoff/baselines/${handoffRunId}/reference.json`,
  `handoff/baselines/${handoffRunId}/manifest-summary.json`,
  `handoff/baselines/${handoffRunId}/hash-metadata.json`,
  `handoff/baselines/${handoffRunId}/validation-summary.md`,
  'test-cases/README.md', 'tests/README.md', 'runs/README.md', 'runs/index.json',
  'reports/README.md', 'reports/current-status.md', 'scripts/new-run.mjs', 'scripts/validate-project.mjs',
  'docs/00-project-charter.md', 'docs/01-permission-boundary.md', 'docs/02-handoff-baseline.md',
  'docs/03-test-scope.md', 'docs/04-coverage-strategy.md', 'docs/05-testcase-governance.md',
  'docs/06-test-data-policy.md', 'docs/07-execution-policy.md', 'docs/08-evidence-policy.md',
  'docs/09-defect-policy.md', 'docs/10-regression-policy.md', 'docs/11-environment-policy.md',
  'docs/12-known-limitations.md', 'docs/13-current-status.md',
];

const readJson = (relativePath) => JSON.parse(readFileSync(resolve(projectRoot, relativePath), 'utf8'));
const missing = requiredPaths.filter((entry) => !existsSync(resolve(projectRoot, entry)));
const project = readJson('project.json');
const handoff = readJson('handoff/current.json');
const runRegistry = readJson('runs/index.json');
const draftDirectory = resolve(projectRoot, 'test-cases', 'draft');
const caseFiles = readdirSync(draftDirectory).filter((name) => /^TC-BB-REAL-\d{3}\.json$/.test(name));
const cases = caseFiles.map((name) => JSON.parse(readFileSync(resolve(draftDirectory, name), 'utf8')));
const uniqueIds = new Set(cases.map((testCase) => testCase.TestCaseId));
const invalidCases = cases.filter((testCase) =>
  testCase.Status !== 'DRAFT' ||
  testCase.Reason !== 'BLOCKED_BY_HANDOFF_INTEGRITY' ||
  testCase.Active !== 0 ||
  testCase.ExpectedBasis !== 'HANDOFF_BASELINE' ||
  !Array.isArray(testCase.ExpectedSource) ||
  !testCase.ExpectedSource.every((source) => source.startsWith('handoff-package/')),
);
const textFiles = [];
const collectTextFiles = (directory) => {
  for (const entry of readdirSync(directory)) {
    const filePath = resolve(directory, entry);
    if (statSync(filePath).isDirectory()) collectTextFiles(filePath);
    else if (/\.(json|md|mjs)$/i.test(entry) || entry === '.gitignore') textFiles.push(filePath);
  }
};
collectTextFiles(projectRoot);
const decoder = new TextDecoder('utf-8', { fatal: true });
const invalidUtf8 = textFiles.filter((filePath) => {
  try { decoder.decode(readFileSync(filePath)); return false; } catch { return true; }
});
const projectText = textFiles
  .filter((filePath) => filePath !== resolve(projectRoot, 'scripts/validate-project.mjs'))
  .map((filePath) => readFileSync(filePath, 'utf8'))
  .join('\n');
const forbiddenProductPathHits = projectText.match(/(?:D:\\HZ_RSS40|E:\\logclient|HZ\.LogClient\.dll|src_m_logclient)/gi) ?? [];
const credentialValueHits = projectText.match(/(?:password|token|cookie|authorization|connectionstring)\s*[:=]\s*["'][^<\n"']{8,}["']/gi) ?? [];
const rootPackage = existsSync(resolve(repositoryRoot, 'package.json')) ? readFileSync(resolve(repositoryRoot, 'package.json'), 'utf8') : '';
const workflowText = existsSync(resolve(repositoryRoot, '.github')) ? readdirSync(resolve(repositoryRoot, '.github'), { recursive: true }).map((entry) => {
  const filePath = resolve(repositoryRoot, '.github', entry);
  return statSync(filePath).isFile() ? readFileSync(filePath, 'utf8') : '';
}).join('\n') : '';
const syntheticCiIsolated = !`${rootPackage}\n${workflowText}`.includes('projects/rsscomposer-blackbox');
const registryFields = ['RunId', 'RunType', 'StartedAt', 'SourcePath', 'HandoffRunId', 'HandoffHash', 'HandoffIntegrity', 'BlackboxIntegrity', 'RuntimeStatus', 'TestCaseTotal', 'Pass', 'Fail', 'Error', 'Blocked', 'Manual', 'Skipped', 'DefectCount', 'MismatchCount', 'RunStatus', 'FinalReport'];
const invalidRegistryRows = runRegistry.Runs.filter((run) => registryFields.some((field) => !Object.hasOwn(run, field)));
const structurePass = missing.length === 0 && cases.length === 12 && uniqueIds.size === 12 && invalidCases.length === 0 &&
  project.ProjectId === 'REAL-RSSCOMPOSER-BLACKBOX' && project.ProjectMode === 'BLACKBOX' &&
  handoff.HandoffRunId === handoffRunId && handoff.IntegrityStatus === 'BLOCKED' &&
  handoff.IntegrityReason === 'HASH_CONTRACT_AMBIGUOUS' && invalidUtf8.length === 0 &&
  forbiddenProductPathHits.length === 0 && credentialValueHits.length === 0 &&
  invalidRegistryRows.length === 0 && syntheticCiIsolated;

console.log(`PROJECT_STRUCTURE = ${structurePass ? 'PASS' : 'FAIL'}`);
console.log(`EXECUTION_READINESS = BLOCKED`);
console.log(`Reason = ${handoff.IntegrityReason}`);
console.log(`TestCaseDraft = ${cases.length}`);
console.log(`TestCaseActive = ${cases.filter((testCase) => testCase.Active === 1).length}`);
console.log(`UTF8 = ${invalidUtf8.length === 0 ? 'PASS' : 'FAIL'}`);
console.log(`SyntheticCIIsolation = ${syntheticCiIsolated ? 'PASS' : 'FAIL'}`);

if (!structurePass) {
  console.error(JSON.stringify({ missing, caseCount: cases.length, uniqueIds: uniqueIds.size, invalidCases, invalidUtf8, forbiddenProductPathHits, credentialValueHits, invalidRegistryRows, syntheticCiIsolated }, null, 2));
  process.exitCode = 1;
}
