import fs from 'node:fs';
import path from 'node:path';
import { parseMarkdownReport } from './self-contained-html-report-exporter.mjs';

function decodeHtml(value) { return String(value ?? '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'); }
function count(content, pattern) { return [...content.matchAll(pattern)].length; }
function normalize(value) { return decodeHtml(value).replace(/&#10;/g, '\n').replace(/\s+/g, ' ').trim(); }
function attributes(tag) { return Object.fromEntries([...tag.matchAll(/\b(data-[\w-]+)="([^"]*)"/g)].map((match) => [match[1], decodeHtml(match[2])])); }

function markdownSemanticRows(markdownPath) {
  const model = parseMarkdownReport(fs.readFileSync(markdownPath, 'utf8'), markdownPath);
  return model.blocks.filter((block) => block.isTestCase).flatMap((block) => block.rows.map((row) => Object.fromEntries(block.headers.map((header, index) => [header, row[index] ?? '']))));
}

export function validateSelfContainedHtmlReport({ htmlPath, markdownPath } = {}) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const css = html.match(/<style>([^]*?)<\/style>/i)?.[1] ?? '';
  const hasMarkdown = Boolean(markdownPath && fs.existsSync(markdownPath));
  const markdown = hasMarkdown ? fs.readFileSync(markdownPath, 'utf8') : '';
  const markdownImageReferenceCount = [...markdown.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].length;
  const externalStylesheetCount = count(html, /<link\b[^>]*\bhref=["'][^"']+["']/gi) + count(html, /@import\s+(?:url\()?\s*["'][^"']+["']/gi);
  const externalScriptCount = count(html, /<script\b[^>]*\bsrc=["'][^"']+["']/gi);
  const externalImageCount = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]*)"/gi)].filter((match) => !match[1].startsWith('data:image/')).length;
  const externalFontCount = count(html, /(?:@font-face[\s\S]*?url\(|fonts?\.googleapis|fonts?\.gstatic)/gi);
  const remoteResourceCount = count(html, /(?:src|href)=["']https?:\/\//gi) + count(html, /(?:fetch|XMLHttpRequest|WebSocket)\s*\(/g);
  const rows = [...html.matchAll(/<tr\b[^>]*\bdata-case-id="[^"]*"[^>]*>/gi)].map((match) => attributes(match[0]));
  const sourceRows = hasMarkdown ? markdownSemanticRows(markdownPath) : [];
  const sourceMap = new Map(sourceRows.map((row) => [row.TestCaseId, row]));
  const htmlMap = new Map(rows.map((row) => [row['data-case-id'], row]));
  const caseIdChanges = hasMarkdown ? [...new Set([...sourceMap.keys(), ...htmlMap.keys()])].filter((id) => !sourceMap.has(id) || !htmlMap.has(id)).length : 0;
  const scenarioChanges = hasMarkdown ? [...sourceMap.keys()].filter((id) => htmlMap.has(id) && normalize(sourceMap.get(id).测试场景) !== normalize(htmlMap.get(id)['data-scenario'])).length : 0;
  const expectedChanges = hasMarkdown ? [...sourceMap.keys()].filter((id) => htmlMap.has(id) && normalize(sourceMap.get(id).预期结果) !== normalize(htmlMap.get(id)['data-expected'])).length : 0;
  const executionChanges = hasMarkdown ? [...sourceMap.keys()].filter((id) => htmlMap.has(id) && normalize(sourceMap.get(id).状态) !== normalize(htmlMap.get(id)['data-status'])).length : 0;
  const sourceGapIds = new Set(sourceRows.filter((row) => /【待确认】/u.test(row.预期结果)).map((row) => row.TestCaseId));
  const htmlGapIds = new Set(rows.filter((row) => /【待确认】/u.test(row['data-expected'] ?? '')).map((row) => row['data-case-id']));
  const expectationGapChanges = hasMarkdown ? [...new Set([...sourceGapIds, ...htmlGapIds])].filter((id) => !sourceGapIds.has(id) || !htmlGapIds.has(id)).length : 0;
  const missingImageCount = count(html, /class="missing-image"/g);
  const embeddedImageCount = count(html, /<img\b[^>]*\bsrc="data:image\/(?:png|jpeg|gif|webp);base64,/gi);
  const embeddedImageBytes = [...html.matchAll(/<img\b[^>]*\bsrc="data:image\/(?:png|jpeg|gif|webp);base64,([^"]+)"/gi)].reduce((sum, match) => sum + Buffer.from(match[1], 'base64').length, 0);
  const mainTableCount = count(html, /<table\b[^>]*class="testcase-table"/g);
  const nineColumnMainTableCount = [...html.matchAll(/<table\b[^>]*class="testcase-table"[\s\S]*?<\/thead>/g)].filter((match) => count(match[0], /<th>/g) === 9).length;
  const headerWrappingStylePresent = /thead\s+th[\s\S]*?white-space:\s*nowrap[\s\S]*?word-break:\s*keep-all[\s\S]*?overflow-wrap:\s*normal/i.test(css);
  const testCaseIdWrappingStylePresent = /\.testcase-table\s+td:nth-child\(2\)[\s\S]*?white-space:\s*nowrap[\s\S]*?word-break:\s*keep-all[\s\S]*?overflow-wrap:\s*normal/i.test(css);
  const statusWrappingStylePresent = /\.testcase-table\s+td:nth-child\(7\)[\s\S]*?white-space:\s*nowrap[\s\S]*?word-break:\s*keep-all[\s\S]*?overflow-wrap:\s*normal/i.test(css);
  const shortTokenWrappingStylePresent = /\.short-token[\s\S]*?white-space:\s*nowrap\s*!important[\s\S]*?word-break:\s*keep-all\s*!important[\s\S]*?overflow-wrap:\s*normal\s*!important/i.test(css);
  const adaptiveSemanticStepStylePresent = /\.step-line[\s\S]*?display:\s*block[\s\S]*?white-space:\s*normal[\s\S]*?word-break:\s*normal[\s\S]*?overflow-wrap:\s*normal/i.test(css) && /\.step-list\s+\.cleanup-line[\s\S]*?display:\s*block/i.test(css);
  const brokenWordSuspectCount = /word-break:\s*break-all|overflow-wrap:\s*anywhere/i.test(css) ? rows.length : 0;
  const semanticStepSingleLineOverflowCount = adaptiveSemanticStepStylePresent ? 0 : count(html, /class="step-list"[^>]*>(?:(?!class="cleanup-line")[^])*class="step-line"/gi);
  const rowStyleBlocks = css.match(/(?:tr|td)\s*\{[^}]*\}/gi) ?? [];
  const oversizedRowCount = rowStyleBlocks.some((block) => /(?:^|[^\w-])(?:height|min-height)\s*:/i.test(block)) ? rows.length : 0;
  const renderedMarkup = html.replace(/\sdata-[\w-]+="[^"]*"/gi, '');
  const lineRecords = [...html.matchAll(/<div\s+class="([^"]*\bcell-line\b[^"]*)"\s+data-visible-char-count="(\d+)"(?:\s+data-protected-token="true")?[^>]*>/gi)].map((match) => ({ classes: match[1], length: Number(match[2]), protected: /data-protected-token="true"/i.test(match[0]) }));
  const hardWrappedCellCount = [...html.matchAll(/<td>([\s\S]*?)<\/td>/gi)].filter((match) => (match[1].match(/\bcell-line\b/g) ?? []).length > 1).length;
  const maxObservedVisualLineLength = lineRecords.reduce((max, item) => Math.max(max, item.length), 0);
  const visualLinesOver15Count = lineRecords.filter((item) => item.length > 15 && !item.protected).length;
  const protectedTokenExceptionCount = lineRecords.filter((item) => item.length > 15 && item.protected).length;
  const visibleBrTagCount = count(renderedMarkup, /<br\s*\/?\s*>|&lt;br\b|&amp;lt;br\b/gi);
  const visibleNewlineEntityCount = count(renderedMarkup, /(?:&amp;)?#10;/gi);
  const headerWrappedCount = count(renderedMarkup, /<th[^>]*>[\s\S]*?(?:<br\s*\/?\s*>|&lt;br\b|&amp;lt;br\b)[\s\S]*?<\/th>/gi);
  const testCaseIdWrappedCount = count(renderedMarkup, /class="testcase-id[^"]*"[^>]*>[\s\S]*?(?:<br\s*\/?\s*>|&lt;br\b|&amp;lt;br\b)[\s\S]*?<\/span>/gi);
  const statusWrappedCount = count(renderedMarkup, /class="status-token[^"]*"[^>]*>[\s\S]*?(?:<br\s*\/?\s*>|&lt;br\b|&amp;lt;br\b)[\s\S]*?<\/span>/gi);
  const layoutMetrics = {
    HeaderWrappedCount: headerWrappedCount + (headerWrappingStylePresent ? 0 : 1),
    TestCaseIdWrappedCount: testCaseIdWrappedCount + (testCaseIdWrappingStylePresent ? 0 : 1),
    StatusWrappedCount: statusWrappedCount + (statusWrappingStylePresent ? 0 : 1),
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
  const result = {
    HtmlPath: path.resolve(htmlPath), Status: 'FAIL', SourceMarkdownBytes: hasMarkdown ? Buffer.byteLength(markdown) : null, FinalHtmlBytes: Buffer.byteLength(html), MarkdownImageReferenceCount: markdownImageReferenceCount, ResolvedImageCount: embeddedImageCount, EmbeddedImageCount: embeddedImageCount, EmbeddedImageBytes: embeddedImageBytes, MissingImageCount: missingImageCount, BrokenImageCount: missingImageCount,
    ExternalStylesheetCount: externalStylesheetCount, ExternalScriptCount: externalScriptCount, ExternalImageCount: externalImageCount, ExternalFontCount: externalFontCount, RemoteResourceCount: remoteResourceCount,
    EmbeddedStylePresent: /<style>[^]*<\/style>/i.test(html), EmbeddedScriptPresent: /<script>(?!\s*<\/script>)[^]*<\/script>/i.test(html),
    MainTestCaseTableCount: mainTableCount, NineColumnMainTableCount: nineColumnMainTableCount, LocalHorizontalScroll: /\.testcase-table-scroll\s*\{[^}]*overflow-x\s*:\s*auto/i.test(css), PageLevelHorizontalScroll: !/html\s*,\s*body\s*\{[^}]*overflow-x\s*:\s*hidden/i.test(css), StickyHeader: /thead\s+th\s*,?[\s\S]*?position\s*:\s*sticky/i.test(css), ImageLightbox: /id="image-lightbox"/.test(html) && /event\.key === 'Escape'/.test(html), AnchorNavigation: /class="report-toc"/.test(html) && /href="#/.test(html),
    TestCaseSemanticChanges: caseIdChanges + scenarioChanges + expectedChanges + executionChanges + expectationGapChanges, TestCaseIdChanges: caseIdChanges, ScenarioChanges: scenarioChanges, ExpectedSemanticChanges: expectedChanges, ExecutionStatusChanges: executionChanges, ExpectationGapChanges: expectationGapChanges,
    HeaderWrappedCount: layoutMetrics.HeaderWrappedCount, TestCaseIdWrappedCount: layoutMetrics.TestCaseIdWrappedCount, StatusWrappedCount: layoutMetrics.StatusWrappedCount, ShortTokenWrappedCount: layoutMetrics.ShortTokenWrappedCount, BrokenWordSuspectCount: layoutMetrics.BrokenWordSuspectCount, SemanticStepSingleLineOverflowCount: layoutMetrics.SemanticStepSingleLineOverflowCount, OversizedRowCount: layoutMetrics.OversizedRowCount, VisibleBrTagCount: layoutMetrics.VisibleBrTagCount, VisibleNewlineEntityCount: layoutMetrics.VisibleNewlineEntityCount, HardWrappedCellCount: layoutMetrics.HardWrappedCellCount, MaxObservedVisualLineLength: layoutMetrics.MaxObservedVisualLineLength, VisualLinesOver15Count: layoutMetrics.VisualLinesOver15Count, ProtectedTokenExceptionCount: layoutMetrics.ProtectedTokenExceptionCount,
  };
  result.LayoutMetrics = layoutMetrics;
  result.PortableSingleFile = result.ExternalStylesheetCount === 0 && result.ExternalScriptCount === 0 && result.ExternalImageCount === 0 && result.ExternalFontCount === 0 && result.RemoteResourceCount === 0;
  result.OfflineOpenSupported = result.PortableSingleFile && result.EmbeddedStylePresent && result.EmbeddedScriptPresent;
  result.ImageStatus = missingImageCount > 0 ? 'LIMITED' : 'PASS';
  const requirements = [result.PortableSingleFile, result.OfflineOpenSupported, result.MainTestCaseTableCount > 0, result.NineColumnMainTableCount === result.MainTestCaseTableCount, result.LocalHorizontalScroll, !result.PageLevelHorizontalScroll, result.StickyHeader, result.ImageLightbox, result.AnchorNavigation, result.TestCaseSemanticChanges === 0, result.HardWrappedCellCount > 0, result.VisualLinesOver15Count === 0, result.HeaderWrappedCount === 0, result.TestCaseIdWrappedCount === 0, result.StatusWrappedCount === 0, result.OversizedRowCount === 0, result.VisibleBrTagCount === 0, result.VisibleNewlineEntityCount === 0];
  result.Status = requirements.every(Boolean) ? 'PASS' : 'FAIL';
  return result;
}
