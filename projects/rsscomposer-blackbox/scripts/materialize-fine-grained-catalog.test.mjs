import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildEffectiveProjectCases } from './apply-generic-blackbox-policy.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, '..');
const catalogDirectory = path.join(projectDirectory, 'test-cases', 'catalog');
const sourcePath = path.join(projectDirectory, 'outputs', 'blackbox-testcase-generation-standard-rebuild', '黑盒细粒度测试用例.json');
const catalogPath = path.join(catalogDirectory, 'fine-grained-catalog.json');
const historyPath = path.join(catalogDirectory, 'historical-traceability.json');
const statePath = path.join(catalogDirectory, 'current-effective-state.json');
const reconciliationPath = path.join(catalogDirectory, 'MATERIALIZATION_RECONCILIATION.json');
const reportPath = path.join(projectDirectory, 'reports', 'RSSComposer调度系统测试报告.md');

function readJson(filePath) {
  assert.equal(fs.existsSync(filePath), true, `missing required materialized asset: ${path.relative(projectDirectory, filePath)}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

test('TC-PLATFORM-15-BLACKBOX-CATALOG-MATERIALIZATION-001 reconciles source, formal catalog, current state, history, and report', () => {
  const source = readJson(sourcePath);
  const catalog = readJson(catalogPath);
  const history = readJson(historyPath);
  const state = readJson(statePath);
  const reconciliation = readJson(reconciliationPath);
  const report = fs.readFileSync(reportPath, 'utf8');

  const effectiveSourceCases = buildEffectiveProjectCases(source.TestCases);
  assert.equal(catalog.TestCases.length, effectiveSourceCases.length);
  assert.deepEqual(catalog.TestCases.map((item) => item.TestCaseId), effectiveSourceCases.map((item) => item.TestCaseId));
  for (const field of ['CatalogVersion', 'GeneratedFrom', 'AuthorityVersion', 'HandoffHash', 'GenerationStandardVersion', 'MaterializedAt']) {
    assert.ok(catalog[field], `catalog metadata missing ${field}`);
  }
  assert.deepEqual(catalog.HandoffHashSource, ['handoff/current.json', `handoff/baselines/${catalog.AuthorityVersion}/manifest-summary.json`]);
  assert.equal(catalog.TestCases.every((item) => ['PASS', 'FAIL', 'ERROR', 'BLOCKED', 'MANUAL', 'SKIPPED'].includes(item.ExecutionStatus)), true);
  assert.equal(catalog.TestCases.every((item) => item.ExecutionStatus === 'SKIPPED' && item.ExecutionState === '尚未执行'), true);

  assert.equal(catalog.TestCases.filter((item) => item.ExpectedStatus === 'EXPECTED_CONFIRMED').length + catalog.TestCases.filter((item) => item.ExpectedStatus === 'EXPECTED_PENDING_AUTHORITY').length, catalog.TestCases.length);
  assert.equal(catalog.TestCases.some((item) => item.ExpectedBasis === 'DESIGN_DEFAULT'), true);
  assert.equal(catalog.TestCases.every((item) => item.LatestExecutionResult === '尚未执行'), true);
  assert.equal(catalog.TestCases.some((item) => ['PASS', 'FAIL', 'ERROR'].includes(item.ExecutionStatus)), false);

  assert.equal(history.HistoricalTestCases.length, 22);
  assert.equal(new Set(history.HistoricalTestCases.map((item) => item.TestCaseId)).size, 22);
  assert.equal(state.TestCases.length, catalog.TestCases.length);
  assert.equal(state.TestCases.every((item) => item.ExecutionStatus === 'SKIPPED' && item.ExecutionState === '尚未执行'), true);
  const pending = state.TestCases.filter((item) => item.ExpectedStatus === 'EXPECTED_PENDING_AUTHORITY');
  assert.equal(pending.length, catalog.PendingCount);
  assert.equal(pending.every((item) => item.CurrentEligibility === '当前不可执行' && item.LatestExecutionResult === '尚未执行' && item.ExpectationGapId), true);

  assert.equal(reconciliation.SourceCount, effectiveSourceCases.length);
  assert.equal(reconciliation.MaterializedCount, catalog.TestCases.length);
  assert.equal(reconciliation.ReportMainCatalogCount, catalog.TestCases.length);
  assert.equal(reconciliation.MissingCount, 0);
  assert.equal(reconciliation.ConfirmedCount, catalog.ConfirmedCount);
  assert.equal(reconciliation.PendingCount, catalog.PendingCount);
  assert.equal(reconciliation.GapCount, catalog.PendingCount);
  assert.equal(reconciliation.HistoricalRetainedCount, 22);
  assert.equal(reconciliation.InheritedHistoricalExecutionCount, 0);

  const mainSection = report.slice(report.indexOf('## 3. 细粒度正式 Catalog'), report.indexOf('## 4. 模块状态汇总'));
  const mainIds = [...mainSection.matchAll(/\| [^|]+ \| (TC-[A-Z0-9]{2,10}-[A-Z0-9]{2,12}-\d{3}) \|/g)].map((match) => match[1]);
  assert.equal(mainIds.length, catalog.TestCases.length);
  assert.equal(new Set(mainIds).size, catalog.TestCases.length);
  assert.equal(reconciliation.ReportHistoricalCount, 0);
  assert.equal(report.includes('## 4. 历史用例与正式执行结果'), false);
  assert.equal(report.includes('TC-BB-REAL-'), false);
});
