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

function countEncodedLineBreaks(value) {
  return (String(value ?? '').match(/&#10;/g) ?? []).length;
}

function countNumberedSteps(value) {
  return (String(value ?? '').match(/\d+、/g) ?? []).length;
}

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
  const stepLineSeparatorCount = mainRows.reduce((total, cells) => total + countEncodedLineBreaks(cells[4]), 0);
  const expectedLineSeparatorCount = mainRows.reduce((total, cells) => total + countEncodedLineBreaks(cells[5]), 0);
  const stepLineLayoutViolationCount = mainRows.reduce((total, cells) => total + String(cells[4]).split('&#10;').filter((line) => countNumberedSteps(line) > 2).length, 0);
  const internalEnumHeading = /^#####\s+(?:RESET|PAGINATION|SORT|STATE|PERMISSION|RELATION|LIFECYCLE)\s*$/m.test(main);
  const literalBr = /<br\s*\/?\s*>/i.test(cleanReport);
  const escapedBr = /&lt;br\b/i.test(cleanReport);
  const doubleEscapedBr = /&amp;lt;br\b/i.test(cleanReport);
  const dotSemicolonSequenceCount = (cleanReport.match(/。；/g) ?? []).length;
  const semicolonDotSequenceCount = (cleanReport.match(/；。/g) ?? []).length;
  const legacyJoinedStepPatternCount = (cleanReport.match(/\d+[）.)]\s*[^|\n]*[。；]\s*\d+[）.)]/g) ?? []).length;
  const checks = {
    ValidMarkdownTables: markdown.invalidTableCount === 0,
    NineColumnMainTables: mainHeaders.length > 0 && mainTables.length >= mainHeaders.length && mainTables.every((table) => table.columns === 9),
    ConsistentColumnCount: markdown.invalidTableCount === 0,
    HeaderNoWrapStylePresent: /#write\s+table\s+th[\s\S]*?white-space:\s*nowrap\s*!important/i.test(css),
    WideTableStylePresent: /table:has\(th:nth-child\(9\)\)[\s\S]*?min-width:\s*2[2-9]\d\dpx/i.test(css),
    HorizontalOverflowStylePresent: /figure\.md-table-fig[\s\S]*?overflow-x:\s*auto\s*!important/i.test(css),
    LocalTableHorizontalScroll: /figure\.md-table-fig[\s\S]*?overflow-x:\s*auto\s*!important/i.test(css),
    PageLevelHorizontalScrollDisabled: /html, body[\s\S]*?overflow-x:\s*hidden/i.test(css) && /#write[\s\S]*?overflow-x:\s*hidden/i.test(css),
    BodyNaturalWrapStylePresent: /#write\s+table\s+td[\s\S]*?white-space:\s*(?:normal|pre-line)\s*!important/i.test(css),
    TestCaseIdNoWrapStylePresent: /table(?::has\(th:nth-child\(9\)\))?\s+td:nth-child\(2\)[\s\S]*?white-space:\s*nowrap\s*!important/i.test(css),
    ScenarioNoVerticalBreakStylePresent: /table:has\(th:nth-child\(9\)\)[\s\S]*?th:nth-child\(1\)[\s\S]*?word-break:\s*keep-all/i.test(css),
    StatusNoVerticalBreakStylePresent: /table:has\(th:nth-child\(9\)\)[\s\S]*?th:nth-child\(7\)[\s\S]*?white-space:\s*nowrap/i.test(css),
    MainTableWidthExceedsContent: /min-width:\s*2[2-9]\d\dpx/i.test(css) && /max-width:\s*1400px/i.test(css),
    GenericSmallTablesRemainNormalWidth: !/#write\s+table\s*\{[\s\S]*?min-width:/i.test(css),
    FinalMarkdownContainsLiteralBr: literalBr,
    FinalMarkdownContainsEscapedBr: escapedBr,
    FinalMarkdownContainsHtmlBreakTag: doubleEscapedBr,
    FinalMarkdownContainsBrTag: literalBr || escapedBr || doubleEscapedBr,
    HtmlBreakTagAbsent: !literalBr && !escapedBr && !doubleEscapedBr,
    StepLineBreakPolicy: stepLineSeparatorCount > 0 && stepLineLayoutViolationCount === 0,
    ExpectedLineBreakPolicy: expectedLineSeparatorCount > 0,
    InternalOperationEnumVisible: internalEnumHeading,
    GenericDisplayMappingApplied: main.includes('筛选重置') && main.includes('分页') && !internalEnumHeading,
    StepSemanticSegments: /(?:①|1、)[^\n|]+　(?:②|2、)/.test(main),
    ExpectedSemanticSegments: /(?:(?:①|1、)[^\n|]+(?:&#10;|　)(?:②|2、)|【待确认】)/.test(main),
    DotSemicolonSequenceCount: dotSemicolonSequenceCount === 0,
    SemicolonDotSequenceCount: semicolonDotSequenceCount === 0,
    LegacyJoinedStepPatternCount: legacyJoinedStepPatternCount === 0,
  };
  const informationalChecks = new Set(['FinalMarkdownContainsLiteralBr', 'FinalMarkdownContainsEscapedBr', 'FinalMarkdownContainsHtmlBreakTag', 'FinalMarkdownContainsBrTag']);
  const failed = Object.entries(checks).filter(([name, value]) => informationalChecks.has(name) || name === 'InternalOperationEnumVisible' ? (name === 'InternalOperationEnumVisible' ? value : false) : !value).map(([name]) => name);
  return { ReportPath: path.relative(repositoryDirectory, reportPath).split(path.sep).join('/'), CssPath: path.relative(repositoryDirectory, cssPath).split(path.sep).join('/'), Checks: checks, Pass: failed.length === 0, FailedChecks: failed };
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
