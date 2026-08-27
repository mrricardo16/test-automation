import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const templatePath = resolve(repoRoot, 'docs/web-test-report-template.md');
const qualityStandardPath = resolve(repoRoot, 'contracts/testcase-design-quality-standard.md');
const reportsDir = resolve(repoRoot, 'projects/test-workflow/reports');
const validStatuses = new Set(['PASS', 'FAIL', 'ERROR', 'BLOCKED', 'MANUAL', 'SKIPPED']);
const feedbackStatuses = new Set(['FAIL', 'ERROR', 'BLOCKED', 'MANUAL', 'SKIPPED']);
const reportDefinitions = [
  {
    file: '功能_02_Web管理端_系统管理_完整测试用例报告.md',
    kind: 'complete',
    required: ['TestCaseId', '实际验证', '图片示例', '测试结论'],
  },
  {
    file: '功能_02_Web管理端_系统管理_问题反馈报告.md',
    kind: 'feedback',
    required: ['TestCaseId', '实际', '分类', '严重程度', '预期', '证据', '图片示例'],
  },
  {
    file: '流程_01_权限与登录_完整测试用例报告.md',
    kind: 'complete',
    required: ['TestCaseId', '实际验证', '图片示例', '流程结论'],
  },
  {
    file: '流程_01_权限与登录_问题反馈报告.md',
    kind: 'feedback',
    required: ['TestCaseId', '实际', '分类', '严重程度', '预期', '证据', '图片示例'],
  },
];
const legacySuffixes = [
  '_功能测试用例报告.md',
  '_功能问题反馈报告.md',
  '_流程测试用例报告.md',
  '_流程问题反馈报告.md',
];
const completeCoverageTerms = [
  '空条件', '精确', '模糊', '无匹配', '前后空格', '特殊字符', '非法字符', '长度', '分页', '重置',
  '必填', '格式', '重复', '修改', '删除', '权限', '状态恢复', '跨步骤',
];

function fail(message) {
  throw new Error(`REPORT_GOVERNANCE=FAIL: ${message}`);
}

function readUtf8(filePath) {
  const bytes = readFileSync(filePath);
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

function assertReportLocalImage(reportPath, target) {
  const cleanTarget = target.split('#', 1)[0].split('?', 1)[0].trim();
  if (!cleanTarget || !/\.(png|jpe?g|gif|webp)$/i.test(cleanTarget)) return;
  if (/^(?:https?:|file:|data:|\\\\|\/\/)/i.test(cleanTarget) || /^\.{1,2}[\\/]/.test(cleanTarget) || /^[A-Za-z]:[\\/]/.test(cleanTarget)) {
    fail(`${relative(repoRoot, reportPath)} contains non-local image path: ${target}`);
  }
  const imagePath = resolve(dirname(reportPath), cleanTarget);
  const reportRoot = resolve(reportsDir);
  const outside = relative(reportRoot, imagePath).startsWith('..');
  if (outside || !existsSync(imagePath)) {
    fail(`${relative(repoRoot, reportPath)} image does not resolve within reports: ${target}`);
  }
}

function checkImages(reportPath, content) {
  const htmlImages = [...content.matchAll(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi)];
  for (const match of htmlImages) assertReportLocalImage(reportPath, match[1]);
  const htmlLinks = [...content.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>\s*<img\b/gi)];
  for (const match of htmlLinks) assertReportLocalImage(reportPath, match[1]);
  const markdownImages = [...content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)];
  for (const match of markdownImages) assertReportLocalImage(reportPath, match[1]);
  const markdownLinks = [...content.matchAll(/\[[^\]]*\]\(([^)]+\.(?:png|jpe?g|gif|webp)(?:#[^)]*)?)\)/gi)];
  for (const match of markdownLinks) assertReportLocalImage(reportPath, match[1]);
}

function tableStatuses(content) {
  return content
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith('|') && line.trim().endsWith('|'))
    .flatMap((line) => line.split('|').map((cell) => cell.trim()).filter((cell) => validStatuses.has(cell)));
}

function validateTemplate() {
  if (!existsSync(templatePath)) fail('tracked unified report template is missing: docs/web-test-report-template.md');
  let content;
  try {
    content = readUtf8(templatePath);
  } catch (error) {
    fail(`docs/web-test-report-template.md is not strict UTF-8: ${error.message}`);
  }
  const requiredTerms = [
    '## 1. 适用范围',
    '## 2. 完整报告统一结构',
    '## 3. 功能报告覆盖规则',
    '## 4. 流程报告覆盖规则',
    '## 5. 问题反馈报告生成规则',
    '## 6. 生成前检查',
    '## 7. 生成后治理检查',
    '## 2. 测试执行摘要',
    '## 4. 完整模块化测试用例',
    'MODULE',
    'FEATURE',
    '图片示例',
    'FAIL',
    'ERROR',
    'BLOCKED',
    'MANUAL',
    'SKIPPED',
  ];
  for (const required of requiredTerms) if (!content.includes(required)) fail(`unified report template is missing: ${required}`);
  if (/\b[A-Za-z]:[\\/]/.test(content)) fail('unified report template contains an absolute Windows path');
  if (/^\s*###?\s+人工复审图片证据/m.test(content)) fail('unified report template contains a standalone image-review section');
}

function validateQualityStandard() {
  if (!existsSync(qualityStandardPath)) fail('testcase design quality standard is missing');
  const content = readUtf8(qualityStandardPath);
  for (const required of ['用例粒度与独立性', '测试数据设计', '等价类、边界和参数化', '查询矩阵', 'CRUD 生命周期', '状态、决策、权限和关系模型', 'Expected 与成熟度', '中文报告展示', 'CATALOG_GENERATED_SKIPPED_INVALID']) {
    if (!content.includes(required)) fail(`design quality standard is missing: ${required}`);
  }
}

function validateRuntimeReports() {
  if (!existsSync(reportsDir)) return false;

  const rootFiles = readdirSync(reportsDir, { withFileTypes: true }).filter((entry) => entry.isFile()).map((entry) => entry.name);
  const runtimeFiles = reportDefinitions.map((definition) => definition.file);
  const hasRuntimeReports = runtimeFiles.some((file) => rootFiles.includes(file));
  if (!hasRuntimeReports) return false;
  for (const suffix of legacySuffixes) {
    const legacy = rootFiles.filter((file) => file.endsWith(suffix));
    if (legacy.length > 0) fail(`legacy report suffix remains: ${legacy.join(', ')}`);
  }

  for (const definition of reportDefinitions) {
    const reportPath = join(reportsDir, definition.file);
    if (!existsSync(reportPath)) fail(`required report is missing: ${definition.file}`);
    let content;
    try {
      content = readUtf8(reportPath);
    } catch (error) {
      fail(`${definition.file} is not strict UTF-8: ${error.message}`);
    }
    for (const required of definition.required) if (!content.includes(required)) fail(`${definition.file} is missing required field: ${required}`);
    if (/\b[A-Za-z]:[\\/]/.test(content)) fail(`${definition.file} contains an absolute Windows path`);
    if (/^\s*###?\s+人工复审图片证据/m.test(content)) fail(`${definition.file} contains a standalone image-review section`);
    checkImages(reportPath, content);

    const statuses = tableStatuses(content);
    if (statuses.length === 0) fail(`${definition.file} has no executable result status`);
    if (definition.kind === 'complete') {
      const missingTerms = completeCoverageTerms.filter((term) => !content.includes(term));
      if (missingTerms.length > 0) fail(`${definition.file} is missing coverage terms: ${missingTerms.join(', ')}`);
    } else {
      const issueStatuses = statuses.filter((status) => feedbackStatuses.has(status));
      if (issueStatuses.length === 0) fail(`${definition.file} has no feedback-worthy result row`);
      if (statuses.includes('PASS')) fail(`${definition.file} contains PASS in a feedback row`);
    }
  }
  return true;
}

validateTemplate();
validateQualityStandard();
const runtimeReports = validateRuntimeReports();
console.log(`REPORT_GOVERNANCE=TC-DOC-GOV-001:PASS (template${runtimeReports ? '+runtime-reports' : ''})`);
