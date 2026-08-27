import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  catalogDirectory,
  currentEffectiveStatePath,
  formalCatalogPath,
  historicalTraceabilityPath,
  reconciliationPath,
  reportPath,
  sourcePath,
} from './materialize-fine-grained-catalog.mjs';
import { buildEffectiveProjectCases } from './apply-generic-blackbox-policy.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryDirectory = path.resolve(scriptDirectory, '..', '..', '..');
const templatePath = path.join(repositoryDirectory, 'docs', '最终测试报告模板.md');
const genericTemplatePath = path.join(repositoryDirectory, 'docs', 'generic-blackbox-test-report-template.md');

function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
function add(issues, condition, code, message) { if (!condition) issues.push({ code, message }); }
function section(content, start, end) {
  const startIndex = content.indexOf(start);
  const endIndex = content.indexOf(end, startIndex + start.length);
  return startIndex >= 0 && endIndex > startIndex ? content.slice(startIndex, endIndex) : '';
}

export function validateFineGrainedCatalog() {
  const issues = [];
  for (const filePath of [sourcePath, formalCatalogPath, historicalTraceabilityPath, currentEffectiveStatePath, reconciliationPath, reportPath, templatePath, genericTemplatePath]) {
    add(issues, fs.existsSync(filePath), 'MISSING_MATERIALIZATION_ASSET', `Missing asset: ${filePath}`);
  }
  if (issues.length > 0) return issues;

  const source = readJson(sourcePath);
  const catalog = readJson(formalCatalogPath);
  const history = readJson(historicalTraceabilityPath);
  const state = readJson(currentEffectiveStatePath);
  const reconciliation = readJson(reconciliationPath);
  const report = fs.readFileSync(reportPath, 'utf8');
  const template = fs.readFileSync(templatePath, 'utf8');
  const genericTemplate = fs.readFileSync(genericTemplatePath, 'utf8');
  const sourceCases = buildEffectiveProjectCases(source.TestCases ?? []);
  const catalogCases = catalog.TestCases ?? [];
  const stateCases = state.TestCases ?? [];
  const sourceIds = sourceCases.map((item) => item.TestCaseId);
  const catalogIds = catalogCases.map((item) => item.TestCaseId);
  const confirmed = catalogCases.filter((item) => item.ExpectedStatus === 'EXPECTED_CONFIRMED');
  const pending = catalogCases.filter((item) => item.ExpectedStatus === 'EXPECTED_PENDING_AUTHORITY');
  const mainSection = section(report, '## 3. 细粒度正式 Catalog', '## 4. 模块状态汇总');
  const mainIds = [...mainSection.matchAll(/\| [^|]+ \| (TC-[A-Z0-9]{2,10}-[A-Z0-9]{2,12}-\d{3}) \|/g)].map((match) => match[1]);

  add(issues, sourceIds.length === catalogIds.length, 'MATERIALIZED_COUNT_MISMATCH', 'Fine-grained source and formal catalog counts differ.');
  add(issues, JSON.stringify(sourceIds) === JSON.stringify(catalogIds), 'MATERIALIZED_ID_SET_MISMATCH', 'Formal catalog IDs do not preserve source order and identity.');
  add(issues, new Set(catalogIds).size === catalogIds.length, 'DUPLICATE_MATERIALIZED_TESTCASE_ID', 'Formal catalog contains duplicate TestCaseId.');
  add(issues, catalogCases.every((item) => typeof item.ExpectedResult === 'string' && item.ExpectedResult.trim() !== ''), 'MISSING_EXPECTED_RESULT', 'Every materialized TestCase must have ExpectedResult.');
  const stateById = new Map(stateCases.map((item) => [item.TestCaseId, item]));
  add(issues, pending.every((item) => item.ExpectationGapId && item.ExpectationGapRefs?.length > 0 && stateById.get(item.TestCaseId)?.ExecutionState === '尚未执行' && stateById.get(item.TestCaseId)?.CurrentEligibility === '当前不可执行'), 'PENDING_CASE_GOVERNANCE_FAILED', 'Every pending case must expose Gap, remain unexecuted, and be non-executable.');
  add(issues, confirmed.every((item) => item.ExpectedSourceRef?.length > 0 && item.ExpectedAuthority), 'CONFIRMED_EXPECTED_TRACEABILITY_FAILED', 'Every confirmed case must retain ExpectedSourceRef and ExpectedAuthority.');
  add(issues, catalogCases.every((item) => item.ExecutionStatus === 'SKIPPED' && stateById.get(item.TestCaseId)?.ExecutionState === '尚未执行' && !['PASS', 'FAIL', 'ERROR', 'BLOCKED', 'MANUAL'].includes(item.ExecutionStatus)), 'NEW_CASE_EXECUTION_STATE_INVALID', 'New catalog cases must be SKIPPED with ExecutionState=尚未执行.');
  add(issues, stateCases.every((item) => item.HistoricalExecutionInherited === false), 'HISTORICAL_PASS_INHERITED', 'Historical execution must not migrate into new fine-grained cases.');
  add(issues, history.HistoricalTestCases?.length === readJson(path.join(repositoryDirectory, 'projects/rsscomposer-blackbox/runs/BB-REAL-20260824-174308/模块化测试用例目录.json')).Cases.length, 'HISTORICAL_CASES_NOT_PRESERVED', 'Historical catalog count is not preserved.');
  add(issues, new Set((history.HistoricalTestCases ?? []).map((item) => item.TestCaseId)).size === history.HistoricalTestCases?.length, 'DUPLICATE_HISTORICAL_TESTCASE_ID', 'Historical catalog contains duplicate IDs.');
  add(issues, stateCases.length === catalogCases.length, 'EFFECTIVE_STATE_COUNT_MISMATCH', 'Current Effective State must cover every materialized case.');
  add(issues, reconciliation.SourceCount === sourceCases.length && reconciliation.MaterializedCount === catalogCases.length, 'RECONCILIATION_COUNT_MISMATCH', 'Reconciliation counts do not match source/catalog.');
  add(issues, reconciliation.MissingCount === 0 && reconciliation.UnexpectedCount === 0, 'RECONCILIATION_CASE_LOSS', 'Reconciliation reports missing or unexpected cases.');
  add(issues, mainIds.length === catalogCases.length && new Set(mainIds).size === catalogCases.length, 'GAP_CASE_MISSING_FROM_MAIN_CATALOG', 'Main report does not contain every fine-grained TestCase.');
  add(issues, JSON.stringify([...mainIds].sort()) === JSON.stringify([...catalogIds].sort()), 'REPORT_CATALOG_ID_MISMATCH', 'Report main catalog IDs differ from formal catalog.');
  add(issues, !report.includes('## 4. 历史用例与正式执行结果') && !report.includes('TC-BB-REAL-'), 'HISTORICAL_CASES_OMITTED_FROM_DELIVERABLE', 'Historical cases must remain internal and must not appear in the final report.');
  add(issues, !mainSection.includes('TC-BB-REAL-'), 'LEGACY_CASE_SHOWN_AS_CURRENT_DESIGN', 'Legacy IDs must not appear in the current fine-grained main catalog.');
  add(issues, mainSection.includes('用户查询-默认加载') && mainSection.includes('待确认'), 'PENDING_EXPECTED_NOT_VISIBLE', 'Pending Expected case or its Gap marker is not visible in the main catalog.');
  add(issues, template.includes('正式 Fine-Grained TestCase Catalog') && template.includes('test-cases/catalog'), 'REPORT_TEMPLATE_MATERIALIZATION_RULE_MISSING', 'Final report template does not declare the formal Fine-Grained Catalog source.');
  add(issues, genericTemplate.includes('测试场景') && genericTemplate.includes('图片示例') && !genericTemplate.includes('RSSComposer'), 'GENERIC_REPORT_TEMPLATE_INVALID', 'Generic report template must be nine-column and business-neutral.');
  add(issues, catalogCases.every((item) => !(item.Preconditions ?? []).some((value) => /管理员具备.*权限/.test(value))), 'PERMISSION_INJECTED_INTO_ORDINARY_CASE', 'Ordinary cases must not contain a generated administrator-permission precondition.');
  add(issues, catalogCases.every((item) => !(item.Steps ?? []).some((value) => /执行目标操作|准备.*隔离测试数据|按批准规则清理/.test(value))), 'GENERIC_FILLER_REMAINS', 'Generic filler steps must be removed from materialized cases.');
  add(issues, reconciliation.InheritedHistoricalExecutionCount === 0, 'HISTORICAL_PASS_INHERITED_BY_SPLIT_CASE', 'Historical status was inherited by a new case.');
  return issues;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const issues = validateFineGrainedCatalog();
  if (issues.length > 0) {
    process.stderr.write(`${JSON.stringify(issues, null, 2)}\n`);
    process.exitCode = 1;
  } else {
    const source = readJson(sourcePath);
    const catalog = readJson(formalCatalogPath);
    const report = fs.readFileSync(reportPath, 'utf8');
    process.stdout.write(`FINE_GRAINED_CATALOG_VALIDATION=PASS (source=${catalog.TestCases.length}, materialized=${catalog.TestCases.length}, report=${catalog.TestCases.length})\n`);
    process.stdout.write('CURRENT_TESTCASE_CATALOG_STATUS=PASS\n');
    process.stdout.write('HISTORICAL_CASE_RECONCILIATION_STATUS=PASS\n');
    process.stdout.write('FINE_GRAINED_REPORT_REGENERATION_STATUS=PASS\n');
    process.stdout.write('FINAL_MARKDOWN_REPORT_STATUS=PASS\n');
    process.stdout.write('FINAL_TEST_REPORT_TEMPLATE_STATUS=PASS\n');
  }
}
