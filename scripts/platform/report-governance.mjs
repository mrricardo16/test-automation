import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEST_CASE_ID = 'TC-DOC-GOV-001';
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const reportsRoot = resolve(repoRoot, 'projects/test-workflow/reports');
const namingRulePath = join(reportsRoot, '测试文档命名规则.md');
const strictUtf8 = new TextDecoder('utf-8', { fatal: true });

function fail(message) {
  throw new Error(`[${TEST_CASE_ID}] ${message}`);
}

function readUtf8(path, label) {
  try {
    return strictUtf8.decode(readFileSync(path));
  } catch (error) {
    fail(`${label} is missing or not valid UTF-8: ${error.message}`);
  }
}

if (!existsSync(reportsRoot)) fail(`reports directory is missing: ${reportsRoot}`);

const namingRule = readUtf8(namingRulePath, '测试文档命名规则.md');
for (const requiredText of [
  '测试依据原文件名（去掉 .md）_测试类型报告.md',
  '功能_02_Web管理端_系统管理(4)_功能测试报告.md',
  '流程_01_权限与登录(3)_流程测试报告.md',
  '图片示例',
]) {
  if (!namingRule.includes(requiredText)) fail(`naming rule is missing: ${requiredText}`);
}

const reportNames = readdirSync(reportsRoot, { withFileTypes: true })
  .filter((entry) => entry.isFile() && /^(功能|流程)_.+_(功能|流程)测试报告\.md$/.test(entry.name))
  .map((entry) => entry.name);

if (reportNames.length < 2) fail('at least one functional and one flow report are required');

for (const name of reportNames) {
  const reportPath = join(reportsRoot, name);
  const content = readUtf8(reportPath, name);
  const isFunctional = name.startsWith('功能_');
  const expectedSuffix = isFunctional ? '_功能测试报告.md' : '_流程测试报告.md';

  if (!name.endsWith(expectedSuffix)) fail(`${name} has an inconsistent report suffix`);
  if (!content.includes('| 图片示例 |')) fail(`${name} must include the right-side 图片示例 table column`);
  if (/^#{1,6}\s+.*人工复审图片证据/m.test(content)) fail(`${name} must not create a standalone image-review module`);
  if (/\b[A-Za-z]:[\\/]/.test(content)) fail(`${name} contains a local-machine absolute path`);

  const imageReferences = [...content.matchAll(/(?:src|href)="([^"]+\.(?:png|jpg|jpeg))"/gi)]
    .map((match) => match[1]);
  if (imageReferences.length === 0) fail(`${name} has no image evidence reference`);

  for (const relativeImage of imageReferences) {
    if (relativeImage.includes('..')) fail(`${name} image reference escapes the report directory: ${relativeImage}`);
    const imagePath = resolve(reportsRoot, relativeImage);
    if (!imagePath.startsWith(`${reportsRoot}${process.platform === 'win32' ? '\\' : '/'}`)) {
      fail(`${name} image reference resolves outside the report directory: ${relativeImage}`);
    }
    if (!existsSync(imagePath)) fail(`${name} image reference does not exist: ${relativeImage}`);
  }
}

console.log(`REPORT_GOVERNANCE=${TEST_CASE_ID}:PASS`);
