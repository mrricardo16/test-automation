import test from 'node:test';
import assert from 'node:assert/strict';
import { findGovernanceIssues } from '../../scripts/platform/governance-check.mjs';

const safeSkill = `# Skill\n## Canonical Contracts\ncontracts/status-contract.md contracts/testcase-contract.md contracts/coverage-contract.md contracts/evidence-contract.md contracts/confidence-contract.md contracts/id-contract.md\nExecutionStatus ApplicabilityStatus CoverageStatus GateStatus BaselineStatus ExpectedBasis SourceRuntimeAlignment Confidence\nLegacyFieldAdapter maps old values without rewriting history.\nBoundary: Source -> As-Built -> Sanitized Test Handoff -> STOP\n`;

test('TC-PLATFORM-08-GOV-001 rejects active canonical drift', () => {
  const issues = findGovernanceIssues({
    skillTexts: { test: 'ExpectedBasis: RUNTIME_OBSERVED\nfinal statuses are PASS, NOT_APPLICABLE\n' },
    readmeText: 'Platform Overview',
    testcaseReadmeText: 'TestCase-first contracts/testcase-contract.md',
    configReadmeText: 'environments.example.json local-projects.example.json',
    reportsReadmeText: 'Committed audit reports and generated artifacts',
  });

  assert.ok(issues.some((issue) => issue.includes('RUNTIME_OBSERVED')));
  assert.ok(issues.some((issue) => issue.includes('ExecutionStatus')));
});

test('TC-PLATFORM-08-GOV-001 accepts canonical Skill boundaries and compatibility notes', () => {
  const issues = findGovernanceIssues({
    skillTexts: {
      dev: safeSkill,
      test: `${safeSkill}\nBoundary: Handoff -> Coverage -> TestCase -> Evidence`,
      whitebox: `${safeSkill}\nBoundary: Source + Optional Runtime; PRODUCT SOURCE = READ ONLY; CODE_COVERAGE_NON_INVASIVE`,
    },
    readmeText: 'Platform Overview Architecture Skill Modes Safe Commands CI Scope Directory Guide Current Capability Status Known Limitations Historical Notes GITHUB_HOSTED_RUN = NOT_EXECUTED AGENT_ACCEPTANCE = BLOCKED',
    testcaseReadmeText: 'TestCase-first TestCaseId contracts/testcase-contract.md Schema LegacyFieldAdapter',
    configReadmeText: 'local-projects.example.json environments.example.json ignored local real values',
    reportsReadmeText: 'Committed audit reports generated runtime artifacts artifacts/',
  });

  assert.deepEqual(issues, []);
});
