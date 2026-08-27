import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildDesignQualityAudit } from './design-quality-audit.mjs';
import { generatePreview } from './render-design-quality-preview.mjs';

test('TC-PLATFORM-11-TESTCASE-DESIGN-QUALITY-001 audits all 22 candidates without generating execution SKIPPED', () => {
  const audit = buildDesignQualityAudit();
  assert.equal(audit.Cases.length, 22);
  assert.ok(audit.Summary.CasesWithMissingTestData > 0);
  assert.ok(audit.Summary.CoverageGapsDetected > 0);
  assert.ok(audit.SplitRecommendations.some((item) => item.SourceTestCaseId === 'TC-BB-REAL-002-B'));
  assert.ok(audit.Cases.every((item) => item.LatestExecutionResult !== 'SKIPPED'));
});

test('TC-PLATFORM-11-TESTCASE-DESIGN-QUALITY-001 keeps statistics query design cases adjacent', () => {
  const audit = buildDesignQualityAudit();
  const ids = audit.Cases.filter((item) => item.FeatureId === 'STATISTICS_QUERY').map((item) => item.TestCaseId);
  assert.deepEqual(ids, ['TC-BB-REAL-011-A', 'TC-BB-REAL-011-B', 'TC-BB-REAL-011-C']);
});

test('TC-PLATFORM-11-TESTCASE-DESIGN-QUALITY-001 renders Chinese quality fields without design SKIPPED rows', () => {
  const output = generatePreview();
  const content = fs.readFileSync(output.outputPath, 'utf8');
  const main = content.split('## 4. 完整设计质量用例目录', 2)[1].split('## 5. 逐条设计质量审计', 2)[0];
  assert.equal((main.match(/\| TC-BB-REAL-[0-9]{3}-[A-Z] \|/g) ?? []).length, 22);
  assert.equal(content.includes('| SKIPPED |'), false);
  assert.ok(content.includes('当前执行资格'));
  assert.ok(content.includes('业务后置条件'));
  assert.ok(content.includes('图片示例'));
});
