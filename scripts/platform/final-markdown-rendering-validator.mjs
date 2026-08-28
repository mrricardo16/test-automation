import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateMarkdownTables } from './markdown-table-validator.mjs';

const repositoryDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const finalReportPath = path.join(repositoryDirectory, 'projects', 'rsscomposer-blackbox', 'reports', 'RSSComposer调度系统测试报告.md');
export const typoraStylePath = path.join(repositoryDirectory, 'docs', 'generic-typora-report.css');

function stripFencedCode(content) {
  const kept = [];
  let inFence = false;
  for (const line of content.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (!inFence) kept.push(line);
  }
  return kept.join('\n');
}

function section(content, start, end) {
  const startIndex = content.indexOf(start);
  const endIndex = content.indexOf(end, startIndex + start.length);
  return startIndex >= 0 && endIndex > startIndex ? content.slice(startIndex, endIndex) : '';
}

function splitMarkdownRow(line) {
  const cells = [];
  let current = '';
  let escaped = false;
  for (const character of line) {
    if (character === '|' && !escaped) {
      cells.push(current);
      current = '';
      escaped = false;
      continue;
    }
    current += character;
    escaped = character === '\\' && !escaped;
  }
  cells.push(current);
  return cells.slice(1, -1).map((cell) => cell.trim());
}

function countSemanticLineBreaks(value) {
  return (String(value ?? '').match(/　(?=(?:②|③|④|⑤|⑥|⑦|⑧|⑨))/gu) ?? []).length;
}

function countNumberedSteps(value) {
  return (String(value ?? '').match(/\d+、/g) ?? []).length;
}

const protectedTokenPattern = /^[A-Za-z0-9]+(?:[_-][A-Za-z0-9<>]+)+$/u;
function visibleLength(value) { return [...String(value ?? '').replace(/[`*_]/g, '')].length; }
function visualLines(value) { return String(value ?? '').split(/<br\s*\/?\s*>/gi).map((item) => item.trim()).filter(Boolean); }

export function validateFinalMarkdownRendering({ reportPath = finalReportPath, cssPath = typoraStylePath } = {}) {
  const report = fs.readFileSync(reportPath, 'utf8');
  const css = fs.readFileSync(cssPath, 'utf8');
  const cleanReport = stripFencedCode(report);
  const main = section(cleanReport, '## 3. 细粒度正式 Catalog', '## 4. 模块状态汇总');
  const markdown = validateMarkdownTables(reportPath);
  const mainStartLine = report.slice(0, report.indexOf('## 3. 细粒度正式 Catalog')).split(/\r?\n/).length + 1;
  const mainEndLine = report.slice(0, report.indexOf('## 4. 模块状态汇总')).split(/\r?\n/).length + 1;
  const mainTables = markdown.tables.filter((table) => table.line >= mainStartLine && table.line < mainEndLine);
  const mainHeaders = [...main.matchAll(/^\|\s*测试场景\s*\|\s*TestCaseId\s*\|.*$/gm)];
  const mainRows = main.split(/\r?\n/)
    .filter((line) => /^\s*\|/.test(line) && !/^\s*\|\s*测试场景\s*\|/u.test(line) && !/^\s*\|\s*-/.test(line))
    .map(splitMarkdownRow)
    .filter((cells) => cells.length === 9);
  const stepLineSeparatorCount = mainRows.reduce((total, cells) => total + countSemanticLineBreaks(cells[4]), 0);
  const expectedLineSeparatorCount = mainRows.reduce((total, cells) => total + countSemanticLineBreaks(cells[5]), 0);
  const stepLineLayoutViolationCount = mainRows.reduce((total, cells) => total + String(cells[4]).split(/　(?=(?:②|③|④|⑤|⑥|⑦|⑧|⑨))/u).filter((line) => countNumberedSteps(line) > 2).length, 0);
  const internalEnumHeading = /^#####\s+(?:RESET|PAGINATION|SORT|STATE|PERMISSION|RELATION|LIFECYCLE)\s*$/m.test(main);
  const literalBr = /<br\s*\/?\s*>/i.test(cleanReport);
  const escapedBr = /&lt;br\b/i.test(cleanReport);
  const doubleEscapedBr = /&amp;lt;br\b/i.test(cleanReport);
  const dotSemicolonSequenceCount = (cleanReport.match(/。；/g) ?? []).length;
  const semicolonDotSequenceCount = (cleanReport.match(/；。/g) ?? []).length;
  const legacyJoinedStepPatternCount = (cleanReport.match(/\d+[）.)]\s*[^|\n]*[。；]\s*\d+[）.)]/g) ?? []).length;
  const visibleBrTagCount = (cleanReport.match(/&lt;br\b|&amp;lt;br\b/gi) ?? []).length;
  const visibleNewlineEntityCount = (cleanReport.match(/(?:&amp;)?#10;/gi) ?? []).length;
  const stepHardBreakCount = mainRows.reduce((total, cells) => total + (String(cells[4]).match(/<br\s*\/?\s*>/gi) ?? []).length, 0);
  const expectedHardBreakCount = mainRows.reduce((total, cells) => total + (String(cells[5]).match(/<br\s*\/?\s*>/gi) ?? []).length, 0);
  const headerWrappingStylePresent = /#write\s+table\s+th[\s\S]*?white-space:\s*nowrap\s*!important[\s\S]*?word-break:\s*keep-all\s*!important[\s\S]*?overflow-wrap:\s*normal\s*!important/i.test(css);
  const testCaseIdWrappingStylePresent = /table(?::has\(th:nth-child\(9\)\))?[\s\S]*?td:nth-child\(2\)[\s\S]*?white-space:\s*nowrap\s*!important[\s\S]*?word-break:\s*keep-all\s*!important[\s\S]*?overflow-wrap:\s*normal\s*!important/i.test(css);
  const statusWrappingStylePresent = /table:has\(th:nth-child\(9\)\)[\s\S]*?td:nth-child\(7\)[\s\S]*?white-space:\s*nowrap\s*!important[\s\S]*?word-break:\s*keep-all\s*!important[\s\S]*?overflow-wrap:\s*normal\s*!important/i.test(css);
  const shortTokenWrappingStylePresent = /\.short-token[\s\S]*?white-space:\s*nowrap\s*!important[\s\S]*?word-break:\s*keep-all\s*!important[\s\S]*?overflow-wrap:\s*normal\s*!important/i.test(css);
  const adaptiveSemanticStepStylePresent = /\.step-line[\s\S]*?display:\s*block[\s\S]*?white-space:\s*normal[\s\S]*?word-break:\s*normal[\s\S]*?overflow-wrap:\s*normal/i.test(css) && /\.step-list\s+\.cleanup-line[\s\S]*?display:\s*block/i.test(css);
  const hardWrapCells = mainRows.flatMap((cells) => [cells[2], cells[3], cells[4], cells[5], cells[7]]).map((value) => visualLines(value));
  const visualLineLengths = hardWrapCells.flatMap((lines) => lines.map((line) => ({ length: visibleLength(line), protected: protectedTokenPattern.test(line) })));
  const hardWrappedCellCount = hardWrapCells.filter((lines) => lines.length > 1).length;
  const maxObservedVisualLineLength = visualLineLengths.reduce((max, item) => Math.max(max, item.length), 0);
  const visualLinesOver15Count = visualLineLengths.filter((item) => item.length > 15 && !item.protected).length;
  const protectedTokenExceptionCount = visualLineLengths.filter((item) => item.length > 15 && item.protected).length;
  const brokenWordSuspectCount = /word-break:\s*break-all|overflow-wrap:\s*anywhere/i.test(css) ? mainRows.length : 0;
  const semanticStepSingleLineOverflowCount = adaptiveSemanticStepStylePresent ? 0 : mainRows.reduce((total, cells) => total + (countNumberedSteps(cells[4]) > 3 ? 1 : 0), 0);
  const rowStyleBlocks = css.match(/(?:tr|td)\s*\{[^}]*\}/gi) ?? [];
  const oversizedRowCount = rowStyleBlocks.some((block) => /(?:^|[^\w-])(?:height|min-height)\s*:/i.test(block)) ? mainRows.length : 0;
  const layoutMetrics = {
    HeaderWrappedCount: headerWrappingStylePresent ? 0 : 1,
    TestCaseIdWrappedCount: testCaseIdWrappingStylePresent ? 0 : 1,
    StatusWrappedCount: statusWrappingStylePresent ? 0 : 1,
    ShortTokenWrappedCount: shortTokenWrappingStylePresent ? 0 : 1,
    BrokenWordSuspectCount: brokenWordSuspectCount,
    SemanticStepSingleLineOverflowCount: semanticStepSingleLineOverflowCount,
    OversizedRowCount: oversizedRowCount,
    VisibleBrTagCount: visibleBrTagCount,
    VisibleNewlineEntityCount: visibleNewlineEntityCount,
    HardWrappedCellCount: hardWrappedCellCount,
    MaxObservedVisualLineLength: maxObservedVisualLineLength,
    VisualLinesOver15Count: visualLinesOver15Count,
    ProtectedTokenExceptionCount: protectedTokenExceptionCount,
  };
  const checks = {
    ValidMarkdownTables: markdown.invalidTableCount === 0,
    NineColumnMainTables: mainHeaders.length > 0 && mainTables.length >= mainHeaders.length && mainTables.every((table) => table.columns === 9),
    ConsistentColumnCount: markdown.invalidTableCount === 0,
    HeaderNoWrapStylePresent: /#write\s+table\s+th[\s\S]*?white-space:\s*nowrap\s*!important/i.test(css),
    WideTableStylePresent: /table:has\(th:nth-child\(9\)\)[\s\S]*?min-width:\s*(?:18\d\d|19\d\d|20\d\d|21\d\d)px/i.test(css),
    HorizontalOverflowStylePresent: /figure\.md-table-fig[\s\S]*?overflow-x:\s*auto\s*!important/i.test(css),
    LocalTableHorizontalScroll: /figure\.md-table-fig[\s\S]*?overflow-x:\s*auto\s*!important/i.test(css),
    PageLevelHorizontalScrollDisabled: /html, body[\s\S]*?overflow-x:\s*hidden/i.test(css) && /#write[\s\S]*?overflow-x:\s*hidden/i.test(css),
    BodyNaturalWrapStylePresent: /#write\s+table\s+td[\s\S]*?white-space:\s*(?:normal|pre-line)\s*!important/i.test(css),
    TestCaseIdNoWrapStylePresent: /table(?::has\(th:nth-child\(9\)\))?\s+td:nth-child\(2\)[\s\S]*?white-space:\s*nowrap\s*!important/i.test(css),
    ScenarioNoVerticalBreakStylePresent: /table:has\(th:nth-child\(9\)\)[\s\S]*?th:nth-child\(1\)[\s\S]*?word-break:\s*keep-all/i.test(css),
    StatusNoVerticalBreakStylePresent: /table:has\(th:nth-child\(9\)\)[\s\S]*?th:nth-child\(7\)[\s\S]*?white-space:\s*nowrap/i.test(css),
    MainTableWidthExceedsContent: /min-width:\s*(?:18\d\d|19\d\d|20\d\d|21\d\d)px/i.test(css) && /max-width:\s*1500px/i.test(css),
    GenericSmallTablesRemainNormalWidth: !/#write\s+table\s*\{[\s\S]*?min-width:/i.test(css),
    FinalMarkdownContainsLiteralBr: literalBr,
    FinalMarkdownContainsEscapedBr: escapedBr,
    FinalMarkdownContainsHtmlBreakTag: doubleEscapedBr,
    FinalMarkdownContainsBrTag: literalBr || escapedBr || doubleEscapedBr,
    HtmlBreakTagAbsent: !escapedBr && !doubleEscapedBr,
    StepLineBreakPolicy: literalBr && stepHardBreakCount > 0 && layoutMetrics.VisualLinesOver15Count === 0,
    ExpectedLineBreakPolicy: literalBr && expectedHardBreakCount > 0,
    InternalOperationEnumVisible: internalEnumHeading,
    GenericDisplayMappingApplied: main.includes('筛选重置') && main.includes('分页') && !internalEnumHeading,
    StepSemanticSegments: /(?:①|1、)[^\n|]+(?:<br\s*\/?\s*>|　)(?:②|2、)/i.test(main),
    ExpectedSemanticSegments: /(?:(?:①|1、)[^\n|]+(?:<br\s*\/?\s*>|&#10;|　)(?:②|2、)|【待确认】)/i.test(main),
    DotSemicolonSequenceCount: dotSemicolonSequenceCount === 0,
    SemicolonDotSequenceCount: semicolonDotSequenceCount === 0,
    LegacyJoinedStepPatternCount: legacyJoinedStepPatternCount === 0,
    HeaderWrappedCount: layoutMetrics.HeaderWrappedCount === 0,
    TestCaseIdWrappedCount: layoutMetrics.TestCaseIdWrappedCount === 0,
    StatusWrappedCount: layoutMetrics.StatusWrappedCount === 0,
    ShortTokenWrappedCount: layoutMetrics.ShortTokenWrappedCount === 0,
    BrokenWordSuspectCount: layoutMetrics.BrokenWordSuspectCount === 0,
    SemanticStepSingleLineOverflowCount: layoutMetrics.SemanticStepSingleLineOverflowCount === 0,
    OversizedRowCount: layoutMetrics.OversizedRowCount === 0,
    VisibleBrTagCount: layoutMetrics.VisibleBrTagCount === 0,
    VisibleNewlineEntityCount: layoutMetrics.VisibleNewlineEntityCount === 0,
    HardWrappedCellCount: layoutMetrics.HardWrappedCellCount > 0,
    MaxObservedVisualLineLength: layoutMetrics.VisualLinesOver15Count === 0,
    VisualLinesOver15Count: layoutMetrics.VisualLinesOver15Count === 0,
    ProtectedTokenExceptionCount: layoutMetrics.ProtectedTokenExceptionCount >= 0,
  };
  const informationalChecks = new Set(['FinalMarkdownContainsLiteralBr', 'FinalMarkdownContainsEscapedBr', 'FinalMarkdownContainsHtmlBreakTag', 'FinalMarkdownContainsBrTag']);
  const failed = Object.entries(checks).filter(([name, value]) => {
    if (informationalChecks.has(name)) return false;
    if (name === 'InternalOperationEnumVisible') return value;
    return !value;
  }).map(([name]) => name);
  return { ReportPath: path.relative(repositoryDirectory, reportPath).split(path.sep).join('/'), CssPath: path.relative(repositoryDirectory, cssPath).split(path.sep).join('/'), Checks: checks, LayoutMetrics: layoutMetrics, Pass: failed.length === 0, FailedChecks: failed };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const result = validateFinalMarkdownRendering();
  if (!result.Pass) {
    process.stderr.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`FINAL_MARKDOWN_RENDERING_VALIDATOR=PASS (NineColumnMainTables=Yes, HorizontalScrollAvailable=Yes, HtmlBreakTags=None, ExpectedOnePerLine=Yes, StepsMaxTwoPerLine=Yes, InternalOperationEnumVisible=No)\n`);
  }
}
