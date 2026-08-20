import fs from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const forbiddenPatterns = [
  ['WEB_TEST_BASE_URL', /WEB_TEST_BASE_URL/],
  ['config/local-projects.json', /config[\\/]local-projects\.json/i],
  ['real business localhost', /localhost:\d+/i],
  ['real source path', /(?:D:|E:)[\\/](?:HZ_RSS40|logclient)/i],
  ['HZ.LogClient.dll', /HZ\.LogClient\.dll/i],
  ['real-project test path', /tests[\\/]web[\\/]real-project/i],
  ['desktop/Appium runtime', /appium|flaUI|winappdriver|avalonia/i],
  ['secret reference', /\$\{\{\s*secrets\.|process\.env\.(?:PASSWORD|TOKEN|SECRET|API_KEY)/i],
  ['broad process kill', /process\.kill\(\s*-1\s*\)|taskkill(?:\.exe)?\s+\/IM|killall\b/i],
];

function addIssue(issues, message) {
  if (!issues.includes(message)) issues.push(message);
}

function branchesFor(trigger) {
  if (Array.isArray(trigger)) return trigger;
  if (trigger && typeof trigger === 'object') return trigger.branches ?? [];
  return [];
}

function collectRunCommands(value, commands = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectRunCommands(item, commands);
    return commands;
  }
  if (!value || typeof value !== 'object') return commands;
  if (typeof value.run === 'string') commands.push(value.run);
  for (const child of Object.values(value)) collectRunCommands(child, commands);
  return commands;
}

function checkWorkflow(workflowText, issues) {
  for (const [label, pattern] of forbiddenPatterns) {
    if (pattern.test(workflowText)) addIssue(issues, `workflow contains forbidden ${label}`);
  }
  const isCompleteWorkflow = /^\s*name\s*:|^\s*jobs\s*:/m.test(workflowText);
  if (!isCompleteWorkflow) return;

  let workflow;
  try {
    workflow = YAML.parse(workflowText);
  } catch (error) {
    addIssue(issues, `workflow YAML parse failed: ${error.message}`);
    return;
  }

  if (workflow?.name !== 'Agent-Driven Test Platform') addIssue(issues, 'workflow name is not Agent-Driven Test Platform');
  const triggers = workflow?.on ?? workflow?.true ?? {};
  if (!branchesFor(triggers.push).includes('main')) addIssue(issues, 'workflow push trigger must target main');
  if (!branchesFor(triggers.pull_request).includes('main')) addIssue(issues, 'workflow pull_request trigger must target main');
  if (workflow?.permissions?.contents !== 'read') addIssue(issues, 'workflow must grant contents: read only');

  const jobs = workflow?.jobs && typeof workflow.jobs === 'object' ? Object.values(workflow.jobs) : [];
  const job = jobs.find((candidate) => candidate?.['runs-on'] === 'ubuntu-latest');
  if (!job) addIssue(issues, 'workflow must use an ubuntu-latest runner');
  const steps = job?.steps ?? [];
  const setupNode = steps.find((step) => typeof step?.uses === 'string' && step.uses.startsWith('actions/setup-node@v4'));
  if (!setupNode || String(setupNode.with?.['node-version']) !== '24') addIssue(issues, 'workflow must use setup-node with Node 24');
  const uses = steps.map((step) => String(step?.uses ?? ''));
  if (!uses.some((value) => value.startsWith('actions/checkout@v4'))) addIssue(issues, 'workflow must use checkout@v4');
  if (!uses.some((value) => value.startsWith('actions/upload-artifact@v4'))) addIssue(issues, 'workflow must use upload-artifact@v4');

  const commands = collectRunCommands(workflow).join('\n');
  if (!/npm ci\b/.test(commands)) addIssue(issues, 'workflow must install with npm ci');
  if (!/playwright install --with-deps chromium/.test(commands)) addIssue(issues, 'workflow must install Chromium only');
  if (!/npm run test:ci\b/.test(commands)) addIssue(issues, 'workflow must invoke npm run test:ci');
  const artifactStep = steps.find((step) => typeof step?.uses === 'string' && step.uses.startsWith('actions/upload-artifact@v4'));
  if (!/always\(\)/.test(String(artifactStep?.if ?? ''))) addIssue(issues, 'artifact upload must run with if: always()');
  if (String(artifactStep?.with?.['retention-days']) !== '7') addIssue(issues, 'artifact retention must be 7 days');
}

function checkPackageScripts(packageScripts, issues) {
  const required = {
    'test:web': /run-platform-tests\.mjs\s+web\b/,
    'test:api': /run-platform-tests\.mjs\s+api\b/,
    'test:synthetic': /run-platform-tests\.mjs\s+synthetic\b/,
    'test:platform': /run-platform-quality\.mjs\b/,
    'test:ci': /ci:safety.*validate.*test:platform/s,
  };
  for (const [name, pattern] of Object.entries(required)) {
    if (typeof packageScripts?.[name] !== 'string' || !pattern.test(packageScripts[name])) {
      addIssue(issues, `package script ${name} is not routed through the Synthetic platform command`);
    }
  }
  for (const name of Object.keys(required)) {
    const script = String(packageScripts?.[name] ?? '');
    for (const [label, pattern] of forbiddenPatterns) {
      if (pattern.test(script)) addIssue(issues, `package script ${name} contains forbidden ${label}`);
    }
  }
}

function checkExecutableSurfaces(executableTexts, issues) {
  const entries = Object.entries(executableTexts ?? {});
  for (const [name, text] of entries) {
    for (const [label, pattern] of forbiddenPatterns) {
      if (pattern.test(String(text))) addIssue(issues, `${name} contains forbidden ${label}`);
    }
  }
  const combined = entries.map(([, text]) => String(text)).join('\n');
  if (!/127\.0\.0\.1/.test(combined)) addIssue(issues, 'runtime surface must bind to 127.0.0.1');
  if (!/port\s*[:=]\s*0\b/.test(combined)) addIssue(issues, 'runtime surface must request a dynamic port');
}

export function findSafetyIssues({ workflowText = '', packageScripts = {}, executableTexts = {} } = {}) {
  const issues = [];
  checkWorkflow(workflowText, issues);
  checkPackageScripts(packageScripts, issues);
  checkExecutableSurfaces(executableTexts, issues);
  return issues;
}

function readText(relativePath) {
  return fs.readFileSync(resolve(repoRoot, relativePath), 'utf8');
}

function runCli() {
  const packageJson = JSON.parse(readText('package.json'));
  const executablePaths = [
    'scripts/platform/run-platform-tests.mjs',
    'scripts/platform/run-platform-quality.mjs',
    'scripts/platform/run-platform-validation.mjs',
    'scripts/platform/run-skill-tests.mjs',
    'tests/api/synthetic/api-fixtures.ts',
    'tests/web/synthetic-product-runtime.spec.ts',
  ];
  const issues = findSafetyIssues({
    workflowText: readText('.github/workflows/test-platform.yml'),
    packageScripts: packageJson.scripts,
    executableTexts: Object.fromEntries(executablePaths.map((path) => [path, readText(path)])),
  });
  if (issues.length > 0) {
    console.error('CI_SAFETY=FAIL');
    for (const issue of issues) console.error(`- ${issue}`);
    process.exitCode = 1;
    return;
  }
  console.log('CI_SAFETY=PASS');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runCli();
