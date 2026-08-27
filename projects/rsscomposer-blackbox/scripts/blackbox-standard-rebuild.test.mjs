import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { buildFineGrainedCatalog } from './fine-grained-testcase-catalog.mjs';
import {
  ARTIFACT_FILE_NAMES,
  buildBlackboxStandardRebuild,
  writeBlackboxStandardRebuild,
} from './blackbox-standard-rebuild.mjs';
import { validateBlackboxStandardRebuild } from './validate-blackbox-standard-rebuild.mjs';

test('TC-PLATFORM-14-BLACKBOX-STANDARD-REBUILD-001 preserves 22 confirmed cases and materializes 33 pending cases', () => {
  const source = buildFineGrainedCatalog();
  const originalHistory = structuredClone(source.ApprovedDetailedCases);
  const bundle = buildBlackboxStandardRebuild(source);

  assert.deepEqual(source.ApprovedDetailedCases, originalHistory);
  assert.equal(bundle.catalog.TestCases.length, 55);
  assert.equal(bundle.catalog.TestCases.filter((item) => item.ExpectedStatus === 'EXPECTED_CONFIRMED').length, 22);
  assert.equal(bundle.catalog.TestCases.filter((item) => item.ExpectedStatus === 'EXPECTED_PENDING_AUTHORITY').length, 33);
  assert.ok(bundle.catalog.TestCases.every((item) => typeof item.ExpectedResult === 'string' && item.ExpectedResult.trim().length > 0));

  for (const original of originalHistory) {
    const generated = bundle.catalog.TestCases.find((item) => item.TestCaseId === original.TestCaseId);
    assert.equal(generated.ExpectedResult, original.ExpectedResult);
    assert.equal(generated.LatestExecutionResult, original.LatestExecutionResult);
    assert.deepEqual(generated.HistoricalSnapshot, original);
  }
});

test('TC-PLATFORM-14-BLACKBOX-STANDARD-REBUILD-001 completes authority, technique, traceability, and quality models', () => {
  const bundle = buildBlackboxStandardRebuild(buildFineGrainedCatalog());
  const requiredTechniques = [
    'EQUIVALENCE_CLASS', 'BOUNDARY_VALUE', 'DECISION_TABLE', 'STATE_TRANSITION',
    'CRUD_LIFECYCLE', 'QUERY_MATRIX', 'PERMISSION', 'RELATIONSHIP',
    'NEGATIVE_ERROR', 'RECOVERY', 'IDEMPOTENCY', 'CONCURRENCY',
    'POST_CONDITION', 'RISK_MODEL',
  ];

  assert.deepEqual(bundle.designAssessment.TechniqueAssessments.map((item) => item.Technique), requiredTechniques);
  assert.equal(bundle.authorityGate.Status, 'LIMITED_PENDING_AUTHORITY');
  assert.equal(bundle.authorityGate.ExpectedExtractionMissCount, 0);
  assert.equal(bundle.authorityGate.TrueGapCount, 33);
  assert.equal(bundle.authority.ExpectedGaps.every((item) => item.GapClassification === 'TRUE_GAP'), true);
  assert.equal(bundle.traceability.Forward.length, 55);
  assert.equal(bundle.traceability.Reverse.length, 55);
  assert.deepEqual(validateBlackboxStandardRebuild(bundle), []);
});

test('TC-PLATFORM-14-BLACKBOX-STANDARD-REBUILD-001 writes exactly eight UTF-8 JSON artifacts', () => {
  const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'blackbox-standard-rebuild-'));
  try {
    const result = writeBlackboxStandardRebuild({ outputDirectory });
    const files = fs.readdirSync(outputDirectory).sort();
    assert.deepEqual(files, [...ARTIFACT_FILE_NAMES].sort());
    assert.equal(result.ArtifactCount, 8);
    for (const fileName of files) {
      const bytes = fs.readFileSync(path.join(outputDirectory, fileName));
      const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      assert.doesNotThrow(() => JSON.parse(text));
    }
  } finally {
    fs.rmSync(outputDirectory, { recursive: true, force: true });
  }
});

test('TC-PLATFORM-14-BLACKBOX-STANDARD-REBUILD-001 applies synthetic Expected and gap governance rules', () => {
  const bundle = buildBlackboxStandardRebuild(buildFineGrainedCatalog());
  const duplicate = bundle.catalog.TestCases.find((item) => item.Title.includes('用户名重复'));
  const pendingQuery = bundle.catalog.TestCases.find((item) => item.Title === '用户查询-默认查询');
  const pendingBoundary = bundle.catalog.TestCases.find((item) => item.Title === '用户新增-用户名长度边界');

  assert.equal(duplicate.ExpectedStatus, 'EXPECTED_CONFIRMED');
  assert.match(duplicate.ExpectedResult, /创建失败|第二个/);
  assert.equal(pendingQuery.ExpectedStatus, 'EXPECTED_PENDING_AUTHORITY');
  assert.match(pendingQuery.ExpectedResult, /^待权威确认：/);
  assert.equal(pendingQuery.AutomationEligibility, 'NOT_EXECUTABLE');
  assert.equal(pendingBoundary.ExpectedAuthorityCompleteness.SearchCompleteness, 'COMPLETE');
  assert.equal(pendingBoundary.ExpectedAuthorityCompleteness.ExpectedCandidateFound, 'No');

  const overbroad = validateBlackboxStandardRebuild({
    ...bundle,
    catalog: { ...bundle.catalog, TestCases: [{ ...duplicate, TestCaseType: 'ATOMIC', BusinessRuleRefs: ['BR-A', 'BR-B'] }] },
  });
  assert.ok(overbroad.some((item) => item.code === 'MULTIPLE_PRIMARY_BUSINESS_RULES'));

  const runtimeAsExpected = validateBlackboxStandardRebuild({
    ...bundle,
    catalog: { ...bundle.catalog, TestCases: [{ ...duplicate, ExpectedResult: 'Runtime 当前显示成功。' }] },
  });
  assert.ok(runtimeAsExpected.some((item) => item.code === 'RUNTIME_AS_EXPECTED_FORBIDDEN'));
});
