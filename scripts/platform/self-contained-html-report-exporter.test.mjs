import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { embedImageReference, parseMarkdownReport, renderHtmlDocument } from './self-contained-html-report-exporter.mjs';

const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'self-contained-html-exporter-'));
const markdownPath = path.join(workspace, 'reports', 'report.md');
fs.mkdirSync(path.dirname(markdownPath), { recursive: true });
fs.mkdirSync(path.join(workspace, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(workspace, 'artifacts', 'evidence.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

const markdownFixture = `# 测试报告

## 用例

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 用户创建 | TC-USER-CREATE-001 | 已打开页面。 | 用户名：测试用户　角色：管理员 | 1、打开页面。&#10;2、点击保存。&#10;【清理】删除测试数据。 | 1、保存成功。&#10;2、列表显示用户。 | 尚未执行 / 可自动执行 | — | ![证据](../artifacts/evidence.png) |`;

test('parses nine-column testcase table and turns presentation separators into semantic HTML lines', () => {
  const model = parseMarkdownReport(markdownFixture, markdownPath);
  const html = renderHtmlDocument(model, 'body { overflow-x: hidden; }');
  assert.match(html, /class="testcase-table-scroll"/);
  assert.match(html, /class="[^"]*cell-line[^"]*step-line/);
  assert.match(html, /class="[^"]*cell-line[^"]*expected-line/);
  assert.match(html, /data-visible-char-count="\d+"/);
  assert.doesNotMatch(html, /&#10;|<br\b/i);
  assert.match(html, /TC-USER-CREATE-001/);
  assert.match(html, /data:image\/png;base64,/);
});

test('embeds a local PNG relative to the Markdown report directory', () => {
  const asset = embedImageReference('../artifacts/evidence.png', markdownPath);
  assert.equal(asset.status, 'embedded');
  assert.equal(asset.mimeType, 'image/png');
  assert.match(asset.dataUri, /^data:image\/png;base64,/);
});

test('reports missing images instead of emitting a broken external source', () => {
  const asset = embedImageReference('../artifacts/missing.png', markdownPath);
  assert.equal(asset.status, 'missing');
  assert.equal(asset.dataUri, null);
});

test('escapes report text and never turns report content into executable HTML', () => {
  const html = renderHtmlDocument(parseMarkdownReport('| x | <script>alert(1)</script> |', markdownPath), '');
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/i);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/i);
});
