import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ARTIFACT_FILE_NAMES, buildBlackboxStandardRebuild } from './blackbox-standard-rebuild.mjs';

function add(issues, condition, code, message) {
  if (!condition) issues.push({ code, message });
}

export function validateBlackboxStandardRebuild(bundle) {
  const issues = [];
  const cases = bundle?.catalog?.TestCases ?? [];
  const confirmed = cases.filter((item) => item.ExpectedStatus === 'EXPECTED_CONFIRMED');
  const pending = cases.filter((item) => item.ExpectedStatus === 'EXPECTED_PENDING_AUTHORITY');
  add(issues, cases.length === 55, 'INVALID_TESTCASE_COUNT', 'Expected 55 scenario-linked TestCases.');
  add(issues, confirmed.length === 22, 'HISTORICAL_CONFIRMED_COUNT_CHANGED', 'Historical confirmed TestCase count must remain 22.');
  add(issues, pending.length === 33, 'PENDING_AUTHORITY_COUNT_CHANGED', 'Pending-authority TestCase count must remain 33.');
  add(issues, new Set(cases.map((item) => item.TestCaseId)).size === cases.length, 'DUPLICATE_TESTCASE_ID', 'Every scenario requires a unique TestCaseId.');
  add(issues, cases.every((item) => typeof item.ExpectedResult === 'string' && item.ExpectedResult.trim() !== ''), 'EMPTY_EXPECTED_RESULT', 'Every TestCase requires a non-empty ExpectedResult.');
  add(issues, confirmed.every((item) => item.ExpectedResult === item.HistoricalSnapshot?.ExpectedResult && item.LatestExecutionResult === item.HistoricalSnapshot?.LatestExecutionResult), 'HISTORICAL_RESULT_CHANGED', 'Historical ExpectedResult and execution state must remain unchanged.');
  add(issues, pending.every((item) => item.ExpectedAuthority === 'PENDING_AUTHORITY' && item.AutomationEligibility === 'NOT_EXECUTABLE' && item.GapClassification), 'PENDING_AUTHORITY_UNPROTECTED', 'Pending Expected must remain non-executable and gap-classified.');
  for (const item of cases) {
    if (typeof item.ExpectedResult !== 'string' || item.ExpectedResult.trim() === '') issues.push({ code: 'MISSING_EXPECTED_RESULT', message: `${item.TestCaseId} has no ExpectedResult.` });
    if (item.ExpectedStatus === 'EXPECTED_CONFIRMED' && (!item.ExpectedAuthority || !Array.isArray(item.ExpectedSourceRef) || item.ExpectedSourceRef.length === 0)) issues.push({ code: 'EXPECTED_WITHOUT_AUTHORITY', message: `${item.TestCaseId} has confirmed Expected without authority traceability.` });
    if (item.ExpectedStatus === 'EXPECTED_PENDING_AUTHORITY' && (!Array.isArray(item.ExpectationGapRefs) || item.ExpectationGapRefs.length === 0)) issues.push({ code: 'PENDING_EXPECTED_WITHOUT_GAP', message: `${item.TestCaseId} has pending Expected without ExpectationGapRefs.` });
    if (item.ExpectedStatus === 'EXPECTED_PENDING_AUTHORITY' && item.ExpectedAuthorityCompleteness?.SearchCompleteness === 'COMPLETE' && item.ExpectedAuthorityCompleteness?.ExpectedCandidateFound === 'Yes') issues.push({ code: 'POTENTIAL_EXPECTED_EXTRACTION_MISSED', message: `${item.TestCaseId} is pending although a complete authority search found an Expected candidate.` });
    if (Array.isArray(item.BusinessRuleRefs) && item.TestCaseType === 'ATOMIC' && item.BusinessRuleRefs.length > 1) issues.push({ code: 'MULTIPLE_PRIMARY_BUSINESS_RULES', message: `${item.TestCaseId} has multiple primary business rules.` });
    if (!item.TestDataDesign || !Array.isArray(item.TestDataDesign.DataFields) || item.TestDataDesign.DataFields.length === 0) issues.push({ code: 'MISSING_TEST_DATA', message: `${item.TestCaseId} has no detailed TestDataDesign.` });
    if (typeof item.ExpectedResult === 'string' && /页面正常|操作正常|显示正确|结果符合预期|页面结果可观察|状态与提示一致/.test(item.ExpectedResult)) issues.push({ code: 'VAGUE_EXPECTED_RESULT', message: `${item.TestCaseId} contains a vague ExpectedResult.` });
    if (!Array.isArray(item.BusinessRuleRefs) || item.BusinessRuleRefs.length === 0 || !Array.isArray(item.TraceabilityRefs) || item.TraceabilityRefs.length === 0) issues.push({ code: 'MISSING_BUSINESS_RULE_TRACEABILITY', message: `${item.TestCaseId} is missing BusinessRule/Traceability references.` });
    const forbiddenExpected = `${item.ExpectedResult} ${item.ExpectedAuthority ?? ''}`;
    if (/Runtime|数据库当前|DB当前|当前行为/.test(forbiddenExpected)) issues.push({ code: 'RUNTIME_AS_EXPECTED_FORBIDDEN', message: `${item.TestCaseId} appears to derive Expected from runtime or current DB behavior.` });
    if (Array.isArray(item.ExpectedSourceRef) && item.ExpectedSourceRef.some((ref) => /产品源码|whitebox|DLL|PDB|source map|Runtime/i.test(ref))) issues.push({ code: 'SOURCE_AS_EXPECTED_FOR_BLACKBOX_FORBIDDEN', message: `${item.TestCaseId} cites a forbidden source as black-box Expected authority.` });
  }
  add(issues, (bundle.quality?.CoverageGapCount ?? 0) === (bundle.quality?.CoverageGapConvertedToTestCaseCount ?? -1), 'COVERAGE_GAP_WITHOUT_TESTCASE_ATTEMPT', 'Every identified Coverage Gap must have a TestCase generation attempt.');
  add(issues, bundle.authority?.ExpectedExtractionMisses?.length === 0, 'EXPECTED_EXTRACTION_MISS_UNRESOLVED', 'Expected extraction misses must be resolved before the gate completes.');
  add(issues, bundle.authority?.TrueGaps?.length === pending.length, 'TRUE_GAP_MISMATCH', 'Every pending-authority case must map to a True Gap.');
  add(issues, bundle.traceability?.Forward?.length === cases.length && bundle.traceability?.Reverse?.length === cases.length, 'TRACEABILITY_COUNT_MISMATCH', 'Forward and reverse traceability must cover every TestCase.');
  add(issues, bundle.quality?.Status === 'PASS', 'QUALITY_GATE_FAILED', 'Machine quality checks must pass.');
  return issues;
}

export function validateWrittenBlackboxStandardRebuild(outputDirectory) {
  const issues = [];
  const files = fs.readdirSync(outputDirectory).sort();
  add(issues, JSON.stringify(files) === JSON.stringify([...ARTIFACT_FILE_NAMES].sort()), 'ARTIFACT_SET_MISMATCH', 'Output directory must contain exactly the eight declared artifacts.');
  for (const fileName of ARTIFACT_FILE_NAMES) {
    const filePath = path.join(outputDirectory, fileName);
    try {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(filePath));
      JSON.parse(text);
    } catch (error) {
      issues.push({ code: 'INVALID_UTF8_OR_JSON', message: `${fileName}: ${error.message}` });
    }
  }
  return issues;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const outputDirectory = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../outputs/blackbox-testcase-generation-standard-rebuild');
  const issues = [...validateBlackboxStandardRebuild(buildBlackboxStandardRebuild()), ...validateWrittenBlackboxStandardRebuild(outputDirectory)];
  if (issues.length > 0) {
    process.stderr.write(`${JSON.stringify(issues, null, 2)}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write('BLACKBOX_STANDARD_REBUILD_VALIDATION=PASS\n');
  }
}
