import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, '..');
const reportPath = path.join(projectDirectory, 'runs', 'BB-REAL-20260824-174308', '测试用例设计质量预览.md');

function fail(message) { throw new Error(`DESIGN_QUALITY_PREVIEW_VALIDATION=FAIL: ${message}`); }
if (!fs.existsSync(reportPath)) fail('quality preview is missing');
const content = fs.readFileSync(reportPath, 'utf8');
for (const term of ['## 2. 设计质量摘要', '## 3. Feature Coverage Matrix', '## 4. 完整设计质量用例目录', '当前执行资格', '最近执行结果', '业务后置条件', '图片示例', 'TESTCASE_DESIGN_QUALITY_STANDARD_STATUS: PASS']) {
  if (!content.includes(term)) fail(`missing quality preview term: ${term}`);
}
if (/[A-Za-z]:[\\/]/.test(content)) fail('quality preview contains an absolute Windows path');
const main = content.split('## 4. 完整设计质量用例目录', 2)[1].split('## 5. 逐条设计质量审计', 2)[0];
if (main.includes('| SKIPPED |')) fail('design preview generated SKIPPED');
const rows = main.split(/\r?\n/).filter((line) => line.startsWith('|') && line.endsWith('|')).map((line) => line.slice(1, -1).split('|').map((cell) => cell.trim()));
const caseRows = rows.filter((row) => /^TC-BB-REAL-[0-9]{3}-[A-Z]$/.test(row[5] ?? ''));
if (caseRows.length !== 22) fail(`expected 22 quality rows, got ${caseRows.length}`);
if (new Set(caseRows.map((row) => row[5])).size !== 22) fail('quality preview repeats a main TestCaseId');
if (rows.filter((row) => row.at(-1) === '图片示例').length !== 8) fail('each module table must end with 图片示例');
const machineEnums = new Set(['QUERY', 'CREATE', 'UPDATE', 'DELETE', 'VALIDATION', 'STATE_TRANSITION', 'RELATIONSHIP', 'AUTHENTICATION', 'SESSION', 'COMPOSITE_LIFECYCLE', 'VISUAL', 'HAPPY_PATH', 'NEGATIVE', 'BOUNDARY', 'EMPTY_STATE', 'DUPLICATE', 'PERMISSION', 'STATE', 'RECOVERY', 'POST_CONDITION', 'COMPOSITE_FLOW', 'AUTO_ALLOWED', 'MANUAL_REQUIRED', 'NOT_EXECUTABLE', 'ATOMIC', 'COMPOSITE']);
for (const row of caseRows) for (const cell of row) if (machineEnums.has(cell)) fail(`machine enum leaked into user-facing row: ${cell}`);
for (const match of content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
  const imagePath = path.resolve(path.dirname(reportPath), match[1]);
  if (!fs.existsSync(imagePath)) fail(`missing image evidence: ${match[1]}`);
}
console.log('DESIGN_QUALITY_PREVIEW_VALIDATION=PASS (22 rows, no design SKIPPED, Chinese fields, local images)');
