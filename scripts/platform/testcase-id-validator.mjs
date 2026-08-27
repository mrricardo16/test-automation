import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const catalogDirectory = path.join(repositoryDirectory, 'projects', 'rsscomposer-blackbox', 'test-cases', 'catalog');
const reportPath = path.join(repositoryDirectory, 'projects', 'rsscomposer-blackbox', 'reports', 'RSSComposer调度系统测试报告.md');
export const CURRENT_TESTCASE_ID_PATTERN = /^TC-[A-Z0-9]{2,10}-[A-Z0-9]{2,12}-\d{3}$/;
export const LEGACY_HISTORICAL_ID_PATTERN = /^TC-BB-REAL-\d{3}(?:-[A-Z])?$/;
const FORBIDDEN_CURRENT_ID_TOKENS = /(?:^|-)BB(?:-|$)|(?:^|-)(?:GEN|DETAIL|PENDING|REVIEW|AUTO|MANUAL|PASS|FAIL|ERROR|BLOCKED|READY|REAL|HISTORICAL|EXPECTED|GAP|STATE)(?:-|$)/;

export function isAllowedCurrentTestCaseId(value) {
  return CURRENT_TESTCASE_ID_PATTERN.test(value) && !FORBIDDEN_CURRENT_ID_TOKENS.test(value);
}

function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
function issue(code, pathValue, message) { return { code, path: pathValue, message }; }

export function validateStableTestCaseIds() {
  const issues = [];
  const catalog = readJson(path.join(catalogDirectory, 'fine-grained-catalog.json'));
  const state = readJson(path.join(catalogDirectory, 'current-effective-state.json'));
  const history = readJson(path.join(catalogDirectory, 'historical-traceability.json'));
  const registry = readJson(path.join(catalogDirectory, 'testcase-id-registry.json'));
  const migration = readJson(path.join(catalogDirectory, 'TESTCASE_ID_MIGRATION_MAP.json'));
  const cases = catalog.TestCases ?? [];
  const stateIds = new Set((state.TestCases ?? []).map((item) => item.TestCaseId));
  const registryByKey = new Map((registry.Cases ?? []).map((item) => [item.StableCaseKey, item]));
  const ids = cases.map((item) => item.TestCaseId);
  for (const [index, item] of cases.entries()) {
    if (!isAllowedCurrentTestCaseId(item.TestCaseId)) issues.push(issue(FORBIDDEN_CURRENT_ID_TOKENS.test(item.TestCaseId) ? 'FORBIDDEN_STATE_OR_GENERATION_TOKEN' : 'INVALID_CURRENT_ID', `catalog.TestCases[${index}].TestCaseId`, item.TestCaseId));
    const registered = registryByKey.get(item.StableCaseKey);
    if (!registered || registered.TestCaseId !== item.TestCaseId) issues.push(issue('REGISTRY_KEY_MISMATCH', `catalog.TestCases[${index}].TestCaseId`, item.TestCaseId));
    if (!stateIds.has(item.TestCaseId)) issues.push(issue('STATE_ID_MISSING', `catalog.TestCases[${index}].TestCaseId`, item.TestCaseId));
  }
  if (new Set(ids).size !== ids.length) issues.push(issue('DUPLICATE_CURRENT_ID', 'catalog.TestCases', 'Current catalog contains duplicate TestCaseIds.'));
  for (const [index, item] of (history.HistoricalTestCases ?? []).entries()) {
    if (!LEGACY_HISTORICAL_ID_PATTERN.test(item.TestCaseId)) issues.push(issue('INVALID_HISTORICAL_ID', `history.HistoricalTestCases[${index}].TestCaseId`, item.TestCaseId));
  }
  const migrationRows = migration.Mappings ?? [];
  if (migrationRows.length !== cases.length) issues.push(issue('MIGRATION_COUNT_MISMATCH', 'migration.Mappings', `${migrationRows.length} != ${cases.length}`));
  if (new Set(migrationRows.map((item) => item.NewTestCaseId)).size !== migrationRows.length) issues.push(issue('DUPLICATE_MIGRATION_TARGET', 'migration.Mappings', 'Migration targets are not unique.'));
  const report = fs.readFileSync(reportPath, 'utf8');
  const start = report.indexOf('## 3. 细粒度正式 Catalog');
  const end = report.indexOf('## 4. 模块状态汇总', start);
  const main = start >= 0 && end > start ? report.slice(start, end) : '';
  const reportIds = [...main.matchAll(/\| [^|]+ \| (TC-[A-Z0-9]{2,10}-[A-Z0-9]{2,12}-\d{3}) \|/g)].map((match) => match[1]);
  if (JSON.stringify([...reportIds].sort()) !== JSON.stringify([...ids].sort())) issues.push(issue('REPORT_CURRENT_ID_MISMATCH', 'report', 'Report main catalog IDs differ from formal catalog IDs.'));
  if (report.includes('TC-BB-REAL-')) issues.push(issue('HISTORICAL_ID_LEAK', 'report', 'Historical IDs must not appear in the current final report.'));
  return issues;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const issues = validateStableTestCaseIds();
  if (issues.length) { process.stderr.write(`${JSON.stringify(issues, null, 2)}\n`); process.exitCode = 1; }
  else process.stdout.write('STABLE_TESTCASE_ID_VALIDATION=PASS\n');
}
