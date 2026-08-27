import assert from 'node:assert/strict';
import test from 'node:test';
import { validateFinalMarkdownRendering } from './final-markdown-rendering-validator.mjs';
import { validateCanonicalTemplate } from '../../projects/rsscomposer-blackbox/scripts/render-final-test-report.mjs';

test('final report template is bound to the current generator contract', () => {
  assert.deepEqual(validateCanonicalTemplate(), { Status: 'PASS', Missing: [] });
});

test('final Markdown report satisfies wide-table Typora rendering contract', () => {
  const result = validateFinalMarkdownRendering();
  assert.equal(result.Pass, true, JSON.stringify(result, null, 2));
  assert.equal(result.Checks.FinalMarkdownContainsBrTag, false);
  assert.equal(result.Checks.HtmlBreakTagAbsent, true);
  assert.equal(result.Checks.StepLineBreakPolicy, true);
  assert.equal(result.Checks.ExpectedLineBreakPolicy, true);
  assert.equal(result.Checks.InternalOperationEnumVisible, false);
  assert.equal(result.Checks.LocalTableHorizontalScroll, true);
  assert.equal(result.Checks.PageLevelHorizontalScrollDisabled, true);
  assert.equal(result.Checks.GenericSmallTablesRemainNormalWidth, true);
  assert.equal(result.Checks.DotSemicolonSequenceCount, true);
  assert.equal(result.Checks.SemicolonDotSequenceCount, true);
  assert.equal(result.Checks.LegacyJoinedStepPatternCount, true);
});
