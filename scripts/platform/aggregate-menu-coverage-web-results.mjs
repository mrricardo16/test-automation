import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const expansionRoot = path.join(repositoryRoot, 'projects', 'rsscomposer-blackbox', 'runs', 'MENU-COVERAGE-EXPANSION-20260827-01');
const artifactRoot = path.join(expansionRoot, 'artifacts', 'web');
const catalog = JSON.parse(fs.readFileSync(path.join(expansionRoot, 'expanded-testcase-catalog.json'), 'utf8'));
const resultFiles = fs.readdirSync(artifactRoot).filter((name) => name.endsWith('.json') && name.includes('playwright') && fs.statSync(path.join(artifactRoot, name)).size > 0).sort();

function rowsFrom(fileName) {
  const document = JSON.parse(fs.readFileSync(path.join(artifactRoot, fileName), 'utf8'));
  const rows = [];
  for (const suite of document.suites ?? []) {
    for (const spec of suite.specs ?? []) {
      const result = spec.tests?.[0]?.results?.[0];
      const caseId = spec.title.match(/^TC-[A-Z0-9-]+/)?.[0];
      if (caseId && result) rows.push({ TestCaseId: caseId, ExecutionStatus: result.status === 'passed' ? 'PASS' : result.status === 'skipped' ? 'SKIPPED' : 'FAIL', SourceResultFile: `projects/rsscomposer-blackbox/runs/MENU-COVERAGE-EXPANSION-20260827-01/artifacts/web/${fileName}`, DurationMs: result.duration, Error: result.error?.message?.split('\n')[0] ?? null });
    }
  }
  return rows;
}

const latestById = new Map();
const orderedResultFiles = [...resultFiles].sort((left, right) => Number(left.includes('-TC_')) - Number(right.includes('-TC_')) || left.localeCompare(right));
for (const fileName of orderedResultFiles) for (const row of rowsFrom(fileName)) latestById.set(row.TestCaseId, row);
const executed = [...latestById.values()].map((row) => {
  const caseDir = path.join(artifactRoot, row.TestCaseId);
  const evidencePaths = fs.existsSync(caseDir) ? fs.readdirSync(caseDir, { recursive: true }).filter((item) => String(item).endsWith('.png')).map((item) => path.posix.join('projects/rsscomposer-blackbox/runs/MENU-COVERAGE-EXPANSION-20260827-01/artifacts/web', String(item).replaceAll(path.sep, '/'))).sort() : [];
  return { ...row, EvidencePaths: evidencePaths, Reason: row.ExecutionStatus === 'PASS' ? '真实 Playwright 页面/查询交互完成，结果符合用例断言。' : row.Error };
});
const addedCases = catalog.TestCases.filter((item) => item.CatalogOrigin === 'MENU_COVERAGE_EXPANSION');
const manual = { TestCaseId: 'TC-DRAW-VISUAL-001', ExecutionStatus: 'MANUAL', Reason: 'Canvas 像素和视觉保真度按规则由人工验收；已保留页面截图。', EvidencePaths: ['projects/rsscomposer-blackbox/runs/MENU-COVERAGE-AUDIT-20260827-01/artifacts/navigation/画图工具.png'] };
const notStarted = addedCases.filter((item) => !latestById.has(item.TestCaseId) && item.TestCaseId !== manual.TestCaseId).map((item) => ({ TestCaseId: item.TestCaseId, ExecutionStatus: 'SKIPPED', Reason: '本轮已完成自动化资格设计，但尚未完成该页面表单的 TEST_OWNED 前置数据准备；未伪造执行结果。', EvidencePaths: [] }));
const rows = [...executed, manual, ...notStarted];
const counts = Object.fromEntries([...new Set(rows.map((row) => row.ExecutionStatus))].sort().map((status) => [status, rows.filter((row) => row.ExecutionStatus === status).length]));
const output = { RunId: 'MENU-COVERAGE-EXPANSION-20260827-01', Scope: 'NEW_CASES_ONLY', FormalTestExecutionStarted: true, ResultSources: orderedResultFiles.map((fileName) => `projects/rsscomposer-blackbox/runs/MENU-COVERAGE-EXPANSION-20260827-01/artifacts/web/${fileName}`), AddedCaseCount: addedCases.length, ResultCount: rows.length, Counts: counts, Rows: rows };
fs.writeFileSync(path.join(expansionRoot, 'menu-coverage-web-execution-results.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({ RunId: output.RunId, AddedCaseCount: output.AddedCaseCount, ResultCount: output.ResultCount, Counts: output.Counts }, null, 2)}\n`);
