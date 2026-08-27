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
  const result = {
    HtmlPath: path.resolve(htmlPath), Status: 'FAIL', SourceMarkdownBytes: hasMarkdown ? Buffer.byteLength(markdown) : null, FinalHtmlBytes: Buffer.byteLength(html), MarkdownImageReferenceCount: markdownImageReferenceCount, ResolvedImageCount: embeddedImageCount, EmbeddedImageCount: embeddedImageCount, EmbeddedImageBytes: embeddedImageBytes, MissingImageCount: missingImageCount, BrokenImageCount: missingImageCount,
    ExternalStylesheetCount: externalStylesheetCount, ExternalScriptCount: externalScriptCount, ExternalImageCount: externalImageCount, ExternalFontCount: externalFontCount, RemoteResourceCount: remoteResourceCount,
    EmbeddedStylePresent: /<style>[^]*<\/style>/i.test(html), EmbeddedScriptPresent: /<script>(?!\s*<\/script>)[^]*<\/script>/i.test(html),
    MainTestCaseTableCount: mainTableCount, NineColumnMainTableCount: nineColumnMainTableCount, LocalHorizontalScroll: /\.testcase-table-scroll\s*\{[^}]*overflow-x\s*:\s*auto/i.test(html), PageLevelHorizontalScroll: !/html\s*,\s*body\s*\{[^}]*overflow-x\s*:\s*hidden/i.test(html), StickyHeader: /thead\s+th\s*\{[^}]*position\s*:\s*sticky/i.test(html), ImageLightbox: /id="image-lightbox"/.test(html) && /event\.key === 'Escape'/.test(html), AnchorNavigation: /class="report-toc"/.test(html) && /href="#/.test(html),
    TestCaseSemanticChanges: caseIdChanges + scenarioChanges + expectedChanges + executionChanges + expectationGapChanges, TestCaseIdChanges: caseIdChanges, ScenarioChanges: scenarioChanges, ExpectedSemanticChanges: expectedChanges, ExecutionStatusChanges: executionChanges, ExpectationGapChanges: expectationGapChanges,
  };
  result.PortableSingleFile = result.ExternalStylesheetCount === 0 && result.ExternalScriptCount === 0 && result.ExternalImageCount === 0 && result.ExternalFontCount === 0 && result.RemoteResourceCount === 0;
  result.OfflineOpenSupported = result.PortableSingleFile && result.EmbeddedStylePresent && result.EmbeddedScriptPresent;
  result.ImageStatus = missingImageCount > 0 ? 'LIMITED' : 'PASS';
  const requirements = [result.PortableSingleFile, result.OfflineOpenSupported, result.MainTestCaseTableCount > 0, result.NineColumnMainTableCount === result.MainTestCaseTableCount, result.LocalHorizontalScroll, !result.PageLevelHorizontalScroll, result.StickyHeader, result.ImageLightbox, result.AnchorNavigation, result.TestCaseSemanticChanges === 0];
  result.Status = requirements.every(Boolean) ? 'PASS' : 'FAIL';
  return result;
}
