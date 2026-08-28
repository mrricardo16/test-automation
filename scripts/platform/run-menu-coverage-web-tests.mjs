import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { assertCoverageGate, buildCoverageGate } from './menu-coverage-expansion.mjs';

const root = process.cwd();
const projectRoot = path.join(root, 'projects', 'rsscomposer-blackbox');
const auditRoot = path.join(projectRoot, 'runs', 'MENU-COVERAGE-AUDIT-20260827-01');
const expansionRoot = path.join(projectRoot, 'runs', 'MENU-COVERAGE-EXPANSION-20260827-01');
const config = JSON.parse(await readFile(path.join(projectRoot, 'config', 'project.local.json'), 'utf8'));
const catalog = JSON.parse(await readFile(path.join(projectRoot, 'test-cases', 'catalog', 'menu-coverage-expanded-catalog.json'), 'utf8'));
const discoveryDocument = JSON.parse(await readFile(path.join(auditRoot, 'capability-discovery.json'), 'utf8'));
const discovery = discoveryDocument.Pages ?? discoveryDocument.Entries?.filter((item) => item.ScopeStatus === 'IN_SCOPE') ?? [];
const legacyMapping = JSON.parse(await readFile(path.join(auditRoot, 'legacy-testcase-menu-mapping.json'), 'utf8')).Mappings ?? [];
assertCoverageGate(buildCoverageGate({ catalog, discovery, legacyMapping }));

const evidenceRoot = path.join(expansionRoot, 'artifacts', 'web');
await mkdir(evidenceRoot, { recursive: true });
const environment = {
  ...process.env,
  FORCE_COLOR: '0',
  NO_COLOR: '1',
  WEB_TEST_BASE_URL: config.runtimeBaseUrl,
  WEB_TEST_USERNAME: config.authentication.admin.username,
  WEB_TEST_PASSWORD: config.authentication.admin.password,
  WEB_TEST_RUN_SUFFIX: process.env.WEB_TEST_RUN_SUFFIX ?? `MCX_${Date.now()}`,
  WEB_EVIDENCE_ROOT: evidenceRoot,
};
const args = ['playwright', 'test', 'tests/web/real-project/TC_MENU_COVERAGE_20260827_01.spec.ts', '--workers=1', '--retries=0', '--reporter=json'];
if (process.env.MENU_COVERAGE_GREP) args.push('--grep', process.env.MENU_COVERAGE_GREP);
const command = process.platform === 'win32' ? 'cmd.exe' : 'npx';
const quoteCmdArg = (value) => /[\s|&<>]/.test(value) ? `"${String(value).replaceAll('"', '\\"')}"` : value;
const commandArgs = process.platform === 'win32' ? ['/d', '/s', '/c', `npx ${args.map(quoteCmdArg).join(' ')}`] : args;
const child = spawn(command, commandArgs, { cwd: root, env: environment, stdio: ['ignore', 'pipe', 'pipe'] });
let stdout = '';
let stderr = '';
child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
const exitCode = await new Promise((resolve) => child.on('close', resolve));
const resultSuffix = process.env.MENU_COVERAGE_GREP ? `-${process.env.MENU_COVERAGE_GREP.replace(/[^A-Za-z0-9]+/g, '_')}` : '';
await writeFile(path.join(expansionRoot, 'artifacts', 'web', `TC_MENU_COVERAGE_20260827_01-playwright${resultSuffix}.json`), stdout, 'utf8');
await writeFile(path.join(expansionRoot, 'artifacts', 'web', `TC_MENU_COVERAGE_20260827_01-playwright${resultSuffix}.log`), stderr, 'utf8');
process.stdout.write(JSON.stringify({
  exitCode,
  TestFile: 'tests/web/real-project/TC_MENU_COVERAGE_20260827_01.spec.ts',
  ResultArtifact: 'projects/rsscomposer-blackbox/runs/MENU-COVERAGE-EXPANSION-20260827-01/artifacts/web/TC_MENU_COVERAGE_20260827_01-playwright.json',
  EvidenceRoot: 'projects/rsscomposer-blackbox/runs/MENU-COVERAGE-EXPANSION-20260827-01/artifacts/web',
}) + '\n');
process.exitCode = exitCode ?? 1;
