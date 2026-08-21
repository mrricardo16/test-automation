import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const python = spawnSync('python', ['--version'], { cwd: repoRoot, stdio: 'ignore' }).status === 0 ? 'python' : 'python3';
const testCaseId = 'TC-SYN-CONTRACT-004';

function run(command, args) {
  const result = spawnSync(command, args, { cwd: repoRoot, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function runDevValidator() {
  const asBuiltFiles = [
    '00-index.md', '01-system-overview.md', '02-frontend-design.md', '03-backend-design.md',
    '04-module-inventory.md', '05-page-route-map.md', '06-api-design.md', '07-frontend-backend-mapping.md',
    '08-business-rules.md', '09-business-flows.md', '10-auth-permission.md', '11-validation-rules.md',
    '12-state-model.md', '13-data-and-external-dependencies.md', '14-error-behavior.md', '15-known-unknowns.md',
    '16-design-coverage.md',
  ];
  const handoffFiles = [
    '00-TEST-WORKFLOW.md', '01-scope.md', '02-module-inventory.md', '03-page-route-map.md',
    '04-business-rules.md', '05-business-flows.md', '06-api-contracts.md', '07-validation-rules.md',
    '08-auth-permission.md', '09-state-model.md', '10-test-data-contract.md', '11-testability-map.md',
    '12-error-behavior.md', '13-risk-priority.md', '14-manual-boundaries.md', '15-known-issues-and-limitations.md',
    '16-coverage-contract.md', '17-traceability-matrix.md', '18-runtime-observability.md',
  ];
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'platform-08-dev-validator-'));
  const writeFixture = (relative, content) => {
    const path = join(fixtureRoot, relative);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content, 'utf8');
  };
  try {
    for (const relative of asBuiltFiles) writeFixture(join('as-built', relative), '# As-Built baseline\n');
    for (const relative of handoffFiles) writeFixture(join('test-handoff', relative), '# Handoff\n');
    writeFixture('as-built/00-index.md', '# As-Built Design Index\nMOD-ALPHA FEAT-ALPHA RULE-ALPHA FLOW-ALPHA API-ALPHA VALID-ALPHA STATE-ALPHA\n');
    writeFixture('as-built/16-design-coverage.md', '# Design Gate\nPASS\n');
    writeFixture('test-handoff/00-TEST-WORKFLOW.md', '# black-box Test Agent\nTestCase remains test-owned.\n');
    writeFixture('test-handoff/16-coverage-contract.md', '# Coverage Contract\n');
    writeFixture('test-handoff/17-traceability-matrix.md', '# Traceability\nMOD-ALPHA FEAT-ALPHA RULE-ALPHA FLOW-ALPHA API-ALPHA VALID-ALPHA STATE-ALPHA\n');
    run(python, ['skills/dev-test-handoff/scripts/validate_contract.py', fixtureRoot]);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

console.log(`TESTCASE=${testCaseId}`);
run(python, ['skills/dev-test-handoff/scripts/self_test.py']);
runDevValidator();
run(python, ['skills/test-execution/scripts/self_test.py']);
run(python, ['skills/test-execution/scripts/validate_contract.py']);
run(python, ['skills/whitebox-test-execution/scripts/self_test.py']);
run(python, ['skills/whitebox-test-execution/scripts/validate_contract.py']);
console.log('SKILL_COMMANDS=PASS');
