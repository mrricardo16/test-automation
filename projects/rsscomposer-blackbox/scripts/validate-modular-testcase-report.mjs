import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, '..');
const reportPath = path.join(projectDirectory, 'runs', 'BB-REAL-20260824-174308', '模块化测试用例报告预览.md');

function fail(message) {
  throw new Error(`MODULAR_REPORT_VALIDATION=FAIL: ${message}`);
}

if (!fs.existsSync(reportPath)) fail('generated modular report is missing');
const content = fs.readFileSync(reportPath, 'utf8');
for (const term of ['MODULE', 'FEATURE', '## 2. 测试执行摘要', '## 3. 模块覆盖概览', '## 4. 完整模块化测试用例', '图片示例', 'TESTCASE_INFORMATION_ARCHITECTURE_STATUS: PASS']) {
  if (!content.includes(term)) fail(`missing report term: ${term}`);
}
if (/[A-Za-z]:[\\/]/.test(content)) fail('report contains an absolute Windows path');

const rows = content
  .split(/\r?\n/)
  .filter((line) => line.startsWith('|') && line.endsWith('|'))
  .map((line) => line.slice(1, -1).split('|').map((cell) => cell.trim()));
const caseRows = rows.filter((row) => /^TC-BB-REAL-[0-9]{3}-[A-Z]$/.test(row[5] ?? ''));
const ids = caseRows.map((row) => row[5]);
if (caseRows.length !== 22) fail(`expected 22 main matrix rows, got ${caseRows.length}`);
if (new Set(ids).size !== 22) fail('a TestCaseId is presented more than once in the main matrix');
if (rows.filter((row) => row.at(-1) === '图片示例').length !== 8) fail('each module table must place 图片示例 at the right edge');

for (const match of content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
  const imagePath = path.resolve(path.dirname(reportPath), match[1]);
  if (!fs.existsSync(imagePath)) fail(`image evidence is missing: ${match[1]}`);
}

console.log('MODULAR_REPORT_VALIDATION=PASS (22 unique main rows, rightmost image column, local evidence)');
