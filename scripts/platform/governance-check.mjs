import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const contractLinks = [
  'contracts/status-contract.md',
  'contracts/testcase-contract.md',
  'contracts/coverage-contract.md',
  'contracts/evidence-contract.md',
  'contracts/confidence-contract.md',
  'contracts/id-contract.md',
];
const vocabulary = [
  'ExecutionStatus',
  'ApplicabilityStatus',
  'CoverageStatus',
  'GateStatus',
  'BaselineStatus',
  'ExpectedBasis',
  'SourceRuntimeAlignment',
  'Confidence',
  'LegacyFieldAdapter',
];
const forbiddenPatterns = [
  { pattern: /ExpectedBasis[^\n]*RUNTIME_OBSERVED/, label: 'RUNTIME_OBSERVED as ExpectedBasis' },
  { pattern: /final statuses[^\n]*NOT_APPLICABLE/i, label: 'NOT_APPLICABLE as ExecutionStatus' },
  { pattern: /ExpectedBasis[^\n]*(?:CONFIRMED_FROM_CODE|CONFIRMED_FROM_RUNTIME|INFERRED)/, label: 'Confidence value used as ExpectedBasis' },
  { pattern: /(?:coverage|reconciliation) states[^\n]*(?:COVERED_PASS|COVERED_FAIL|COVERED_ERROR|MANUAL_PENDING)/i, label: 'legacy coverage state used as active vocabulary' },
];

function requiredIssues(text, required, label) {
  return required.filter((marker) => !text.includes(marker)).map((marker) => `${label} missing ${marker}`);
}

function activeSkillIssues(name, text) {
  const issues = [
    ...requiredIssues(text, ['## Canonical Contracts', ...contractLinks, ...vocabulary], `${name} Skill`),
  ];
  for (const { pattern, label } of forbiddenPatterns) {
    if (pattern.test(text)) issues.push(`${name} Skill drift: ${label}`);
  }

  const boundaries = {
    dev: ['Source', 'As-Built', 'Handoff'],
    test: ['Handoff', 'Evidence'],
    whitebox: ['Source', 'Baseline', 'PRODUCT SOURCE', 'CODE_COVERAGE_NON_INVASIVE'],
  };
  if (boundaries[name]) issues.push(...requiredIssues(text, boundaries[name], `${name} Skill boundary`));
  return issues;
}

export function findGovernanceIssues({
  skillTexts = {},
  readmeText = '',
  testcaseReadmeText = '',
  configReadmeText = '',
  reportsReadmeText = '',
} = {}) {
  const issues = [];
  for (const [name, text] of Object.entries(skillTexts)) issues.push(...activeSkillIssues(name, text));
  issues.push(...requiredIssues(readmeText, [
    'Platform Overview', 'Architecture', 'Skill Modes', 'Safe Commands', 'CI Scope',
    'Directory Guide', 'Current Capability Status', 'Known Limitations', 'Historical',
    'GITHUB_HOSTED_RUN = NOT_EXECUTED', 'AGENT_ACCEPTANCE = BLOCKED',
  ], 'README'));
  issues.push(...requiredIssues(testcaseReadmeText, ['TestCase-first', 'TestCaseId', 'contracts/testcase-contract.md', 'LegacyFieldAdapter'], 'TestCase README'));
  issues.push(...requiredIssues(configReadmeText, ['local-projects.example.json', 'environments.example.json', 'ignored'], 'Config README'));
  issues.push(...requiredIssues(reportsReadmeText, ['Committed', 'generated', 'artifacts/'], 'Reports README'));
  return issues;
}

function read(relativePath) {
  return readFileSync(resolve(repoRoot, relativePath), 'utf8');
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const issues = findGovernanceIssues({
    skillTexts: {
      dev: read('skills/dev-test-handoff/SKILL.md'),
      test: read('skills/test-execution/SKILL.md'),
      whitebox: read('skills/whitebox-test-execution/SKILL.md'),
    },
    readmeText: read('README.md'),
    testcaseReadmeText: read('test-cases/README.md'),
    configReadmeText: read('config/README.md'),
    reportsReadmeText: read('reports/README.md'),
  });
  if (issues.length > 0) {
    console.error(issues.map((issue) => `- ${issue}`).join('\n'));
    process.exitCode = 1;
  } else {
    console.log('CONTRACT_DRIFT=PASS');
  }
}
