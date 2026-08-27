import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { exportSelfContainedHtml } from './self-contained-html-report-exporter.mjs';
import { validateSelfContainedHtmlReport } from './self-contained-html-report-validator.mjs';

test('validates self-containment, wide table, images, and testcase semantics from final HTML', () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'self-contained-html-validator-'));
  const markdownPath = path.join(workspace, 'report.md');
  const htmlPath = path.join(workspace, 'report.html');
  fs.writeFileSync(markdownPath, `# 报告\n\n## 用例\n\n| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n| 用户创建 | TC-USER-CREATE-001 | 页面已打开。 | 用户名：测试用户 | 1、打开页面。&#10;2、保存。 | 1、保存成功。&#10;2、显示用户。 | 尚未执行 / 可自动执行 | — | — |`, 'utf8');
  exportSelfContainedHtml({ markdownPath, cssText: 'html, body { overflow-x: hidden; } .testcase-table-scroll { overflow-x: auto; } .testcase-table { min-width: 2200px; } thead th { position: sticky; top: 0; }', outputPath: htmlPath });

  const result = validateSelfContainedHtmlReport({ htmlPath, markdownPath });
  assert.equal(result.Status, 'PASS', JSON.stringify(result, null, 2));
  assert.equal(result.ExternalStylesheetCount, 0);
  assert.equal(result.ExternalScriptCount, 0);
  assert.equal(result.ExternalImageCount, 0);
  assert.equal(result.RemoteResourceCount, 0);
  assert.equal(result.MainTestCaseTableCount, 1);
  assert.equal(result.NineColumnMainTableCount, 1);
  assert.equal(result.LocalHorizontalScroll, true);
  assert.equal(result.PageLevelHorizontalScroll, false);
  assert.equal(result.StickyHeader, true);
  assert.equal(result.ImageLightbox, true);
  assert.equal(result.PortableSingleFile, true);
  assert.equal(result.OfflineOpenSupported, true);
  assert.equal(result.TestCaseSemanticChanges, 0);
  assert.equal(result.TestCaseIdChanges, 0);
  assert.equal(result.ScenarioChanges, 0);
  assert.equal(result.ExpectedSemanticChanges, 0);
  assert.equal(result.ExecutionStatusChanges, 0);
  assert.equal(result.ExpectationGapChanges, 0);
});
