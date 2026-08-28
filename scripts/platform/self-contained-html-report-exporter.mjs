import fs from 'node:fs';
import path from 'node:path';

const nineColumnHeaders = ['测试场景', 'TestCaseId', '前置条件', '测试数据', '操作步骤', '预期结果', '状态', '实际验证', '图片示例'];
const mimeByExtension = new Map([['.png', 'image/png'], ['.jpg', 'image/jpeg'], ['.jpeg', 'image/jpeg'], ['.gif', 'image/gif'], ['.webp', 'image/webp']]);

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function splitMarkdownRow(line) {
  const cells = [];
  let current = '';
  let escaped = false;
  for (const character of line) {
    if (character === '|' && !escaped) {
      cells.push(current);
      current = '';
    } else current += character;
    escaped = character === '\\' && !escaped;
  }
  cells.push(current);
  return cells.slice(1, -1).map((cell) => cell.trim());
}

function isDividerRow(line) {
  return /^\s*\|(?:\s*:?-{3,}:?\s*\|)+\s*$/u.test(line);
}

function detectMime(buffer, extension) {
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg';
  if (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' || buffer.subarray(0, 6).toString('ascii') === 'GIF89a') return 'image/gif';
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return mimeByExtension.get(extension.toLowerCase()) ?? null;
}

export function embedImageReference(reference, markdownPath) {
  const relativePath = String(reference ?? '').split('#', 1)[0].trim();
  const absolutePath = path.resolve(path.dirname(markdownPath), relativePath);
  if (!relativePath || !fs.existsSync(absolutePath)) return { status: 'missing', relativePath, absolutePath, mimeType: null, sourceBytes: 0, dataUri: null };
  const bytes = fs.readFileSync(absolutePath);
  const mimeType = detectMime(bytes, path.extname(relativePath));
  if (!mimeType) return { status: 'unsupported', relativePath, absolutePath, mimeType: null, sourceBytes: bytes.length, dataUri: null };
  return { status: 'embedded', relativePath, absolutePath, mimeType, sourceBytes: bytes.length, dataUri: `data:${mimeType};base64,${bytes.toString('base64')}` };
}

function imageReferences(value) {
  return [...String(value ?? '').matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)].map((match) => ({ alt: match[1], reference: match[2] }));
}

export const MAX_VISUAL_CHARS_PER_LINE = 15;
const protectedTokenPattern = /[A-Za-z0-9]+(?:[_-][A-Za-z0-9<>]+)+/g;
const protectedTokenOnlyPattern = /^[A-Za-z0-9]+(?:[_-][A-Za-z0-9<>]+)+$/u;

function semanticItems(value) {
  return String(value ?? '')
    .replace(/<br\s*\/?\s*>|&#10;/gi, '\n')
    .split(/[\r\n　]+/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function visibleLength(value) {
  return [...String(value ?? '').replace(/[`*_]/g, '')].length;
}

function isVisualBreakPoint(value) {
  return /[\s，；：、。！？/→]$/u.test(value);
}

function atomize(value) {
  const atoms = [];
  let cursor = 0;
  for (const match of String(value).matchAll(protectedTokenPattern)) {
    atoms.push(...[...String(value).slice(cursor, match.index)]);
    atoms.push(match[0]);
    cursor = match.index + match[0].length;
  }
  atoms.push(...[...String(value).slice(cursor)]);
  return atoms;
}

function hardWrapLine(value) {
  const atoms = atomize(String(value ?? '').trim());
  const lines = [];
  let remaining = atoms;
  while (remaining.length) {
    if (visibleLength(remaining[0]) > MAX_VISUAL_CHARS_PER_LINE) {
      lines.push(remaining.shift());
      continue;
    }
    let length = 0;
    let take = 0;
    let preferredTake = 0;
    while (take < remaining.length) {
      const nextLength = length + visibleLength(remaining[take]);
      if (nextLength > MAX_VISUAL_CHARS_PER_LINE) break;
      length = nextLength;
      take += 1;
      if (length >= 10 && isVisualBreakPoint(remaining.slice(0, take).join(''))) preferredTake = take;
    }
    if (take === 0) take = 1;
    const splitAt = preferredTake > 0 ? preferredTake : take;
    lines.push(remaining.splice(0, splitAt).join('').trim());
  }
  return lines.filter(Boolean);
}

function hardWrappedItems(value) {
  return semanticItems(value).flatMap((item) => hardWrapLine(item));
}

function isShortToken(value) {
  const text = String(value ?? '').replace(/[`*_]/g, '').trim();
  const visibleChinese = (text.match(/[\u3400-\u9fff]/gu) ?? []).length;
  return visibleChinese > 0 && visibleChinese <= 6 && !/[，；：。！？]/u.test(text);
}

function renderSemanticText(value, context) {
  return renderInlineMarkdown(value, context);
}

function renderCellLine(value, context, className, prefix = '') {
  const raw = `${prefix}${value}`;
  const classes = [`cell-line`, className];
  if (isShortToken(raw) || protectedTokenOnlyPattern.test(raw.trim())) classes.push('short-token');
  const protectedToken = protectedTokenOnlyPattern.test(raw.trim());
  return `<div class="${classes.join(' ')}" data-visible-char-count="${visibleLength(raw)}"${protectedToken ? ' data-protected-token="true"' : ''}>${prefix ? `<span class="field-label">${renderInlineMarkdown(prefix, context)}</span>` : ''}${renderSemanticText(value, context)}</div>`;
}

function renderSemanticList(value, context, itemClass) {
  return `<div class="semantic-list ${itemClass}-list">${hardWrappedItems(value).map((line) => renderCellLine(line, context, itemClass)).join('')}</div>`;
}

function renderInlineText(value) {
  return escapeHtml(value).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="report-link">$1</span>');
}

function renderInlineMarkdown(value, context = { assets: [], markdownPath: '' }) {
  const raw = String(value ?? '');
  const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let cursor = 0;
  let output = '';
  for (const match of raw.matchAll(imagePattern)) {
    output += renderInlineText(raw.slice(cursor, match.index));
    output += renderImage(match[1], match[2], context);
    cursor = match.index + match[0].length;
  }
  return output + renderInlineText(raw.slice(cursor));
}

function renderImage(alt, reference, context) {
  const asset = embedImageReference(reference, context.markdownPath);
  context.assets.push(asset);
  if (asset.status !== 'embedded') return `<div class="missing-image" data-image-status="${asset.status}" data-image-reference="${escapeHtml(reference)}">图片证据缺失：${escapeHtml(reference)}</div>`;
  return `<img class="evidence-image" src="${asset.dataUri}" alt="${escapeHtml(alt)}" data-image-reference="${escapeHtml(reference)}">`;
}

function renderStepLines(value, context) {
  const items = semanticItems(value);
  const regular = items.filter((item) => !item.startsWith('【清理】'));
  const cleanup = items.filter((item) => item.startsWith('【清理】'));
  const regularHtml = regular.flatMap((item) => hardWrapLine(item).map((line) => renderCellLine(line, context, 'step-line'))).join('');
  const cleanupHtml = cleanup.flatMap((item) => hardWrapLine(item).map((line) => renderCellLine(line, context, 'cleanup-line'))).join('');
  return `<div class="structured-cell step-list">${regularHtml}${cleanupHtml}</div>`;
}

function renderExpectedLines(value, context) {
  const items = semanticItems(value);
  const lines = items.flatMap((item) => hardWrapLine(item).map((line) => ({ line, pending: item.startsWith('【待确认】') })));
  return `<div class="structured-cell expected-list">${lines.map(({ line, pending }) => renderCellLine(line, context, pending ? 'pending-note' : 'expected-line')).join('')}</div>`;
}

function renderKeyValueLines(value, context) {
  const lines = semanticItems(value).flatMap((line) => {
    const match = /^(.*?：)(.*)$/u.exec(line);
    if (!match) return hardWrapLine(line).map((item) => ({ value: item, prefix: '' }));
    const label = match[1];
    const valueLines = hardWrapLine(match[2]);
    if (!valueLines.length) return [{ value: '', prefix: label }];
    if (visibleLength(label) + visibleLength(valueLines[0]) <= MAX_VISUAL_CHARS_PER_LINE) {
      return [{ value: valueLines[0], prefix: label }, ...valueLines.slice(1).map((item) => ({ value: item, prefix: '' }))];
    }
    return [{ value: '', prefix: label }, ...valueLines.map((item) => ({ value: item, prefix: '' }))];
  });
  return `<div class="kv-list">${lines.map(({ value: item, prefix }) => renderCellLine(item, context, 'kv-line', prefix)).join('')}</div>`;
}

function renderConditionLines(value, context) {
  return renderSemanticList(value, context, 'condition-line');
}

function renderTestCaseCell(header, sourceCell, context) {
  if (header === '操作步骤') return renderStepLines(sourceCell, context);
  if (header === '预期结果') return renderExpectedLines(sourceCell, context);
  if (header === '测试数据') return renderKeyValueLines(sourceCell, context);
  if (header === '前置条件') return renderConditionLines(sourceCell, context);
  if (header === '实际验证') return renderSemanticList(sourceCell, context, 'actual-line');
  if (header === '测试场景') return `<span class="scenario-token no-break">${renderSemanticText(sourceCell, context)}</span>`;
  if (header === 'TestCaseId') return `<span class="testcase-id no-break">${renderInlineMarkdown(sourceCell, context)}</span>`;
  if (header === '状态') return `<span class="status-token no-break">${renderInlineMarkdown(sourceCell, context)}</span>`;
  if (header === '图片示例') return `<div class="image-gallery">${renderInlineMarkdown(sourceCell, context)}</div>`;
  return renderSemanticText(sourceCell, context);
}

export function parseMarkdownReport(markdown, markdownPath) {
  const blocks = [];
  const lines = String(markdown ?? '').replace(/^\uFEFF/, '').split(/\r?\n/);
  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    const heading = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (heading) { blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] }); index += 1; continue; }
    if (/^\s*```/.test(line)) { const code = []; index += 1; while (index < lines.length && !/^\s*```/.test(lines[index])) code.push(lines[index++]); if (index < lines.length) index += 1; blocks.push({ type: 'code', text: code.join('\n') }); continue; }
    if (/^\s*\|/.test(line) && index + 1 < lines.length && isDividerRow(lines[index + 1])) { const headers = splitMarkdownRow(line); const rows = []; index += 2; while (index < lines.length && /^\s*\|/.test(lines[index])) { const cells = splitMarkdownRow(lines[index]); if (cells.length === headers.length) rows.push(cells); index += 1; } blocks.push({ type: 'table', headers, rows, isTestCase: headers.length === 9 && headers.every((header, i) => header === nineColumnHeaders[i]) }); continue; }
    if (/^>\s?/.test(line)) { blocks.push({ type: 'quote', text: line.replace(/^>\s?/, '') }); index += 1; continue; }
    if (/^\s*[-*+]\s+/.test(line) || /^\s*\d+[.)、]\s+/.test(line)) { const ordered = /^\s*\d+[.)、]\s+/.test(line); const items = []; while (index < lines.length && (ordered ? /^\s*\d+[.)、]\s+/.test(lines[index]) : /^\s*[-*+]\s+/.test(lines[index]))) items.push(lines[index++].replace(ordered ? /^\s*\d+[.)、]\s+/ : /^\s*[-*+]\s+/, '')); blocks.push({ type: 'list', ordered, items }); continue; }
    if (!line.trim()) { index += 1; continue; }
    const paragraph = [line]; index += 1; while (index < lines.length && lines[index].trim() && !/^(#{1,6})\s|^\s*\||^\s*>|^\s*```|^\s*[-*+]\s+|^\s*\d+[.)、]\s+/.test(lines[index])) paragraph.push(lines[index++]); blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
  }
  return { markdownPath, blocks, assets: [] };
}

function slugger() { const seen = new Map(); return (text) => { const base = String(text).trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'section'; const count = seen.get(base) ?? 0; seen.set(base, count + 1); return count ? `${base}-${count + 1}` : base; }; }

export function renderHtmlDocument(model, cssText) {
  const makeSlug = slugger();
  const headings = model.blocks.filter((block) => block.type === 'heading').map((block) => ({ ...block, id: makeSlug(block.text) }));
  let headingIndex = 0;
  const context = { markdownPath: model.markdownPath, assets: model.assets };
  const body = model.blocks.map((block) => {
    if (block.type === 'heading') { const heading = headings[headingIndex++]; return `<h${heading.level} id="${heading.id}">${renderInlineMarkdown(heading.text, context)}</h${heading.level}>`; }
    if (block.type === 'paragraph') return `<p>${renderInlineMarkdown(block.text, context)}</p>`;
    if (block.type === 'quote') return `<blockquote>${renderInlineMarkdown(block.text, context)}</blockquote>`;
    if (block.type === 'code') return `<pre><code>${escapeHtml(block.text)}</code></pre>`;
    if (block.type === 'list') return `<${block.ordered ? 'ol' : 'ul'}>${block.items.map((item) => `<li>${renderInlineMarkdown(item, context)}</li>`).join('')}</${block.ordered ? 'ol' : 'ul'}>`;
    if (block.type === 'table') {
      const tableClass = block.isTestCase ? 'testcase-table' : 'report-table';
      const table = `<table class="${tableClass}"><thead><tr>${block.headers.map((header) => `<th><span class="table-header">${escapeHtml(header)}</span></th>`).join('')}</tr></thead><tbody>${block.rows.map((row) => {
        const values = Object.fromEntries(block.headers.map((header, index) => [header, row[index] ?? '']));
        const attributes = block.isTestCase ? ` data-case-id="${escapeHtml(values.TestCaseId)}" data-scenario="${escapeHtml(values.测试场景)}" data-status="${escapeHtml(values.状态)}" data-expected="${escapeHtml(values.预期结果)}"` : '';
        return `<tr${attributes}>${row.map((cell, index) => `<td>${block.isTestCase ? renderTestCaseCell(block.headers[index], cell, context) : renderInlineMarkdown(cell, context)}</td>`).join('')}</tr>`;
      }).join('')}</tbody></table>`;
      return block.isTestCase ? `<div class="testcase-table-scroll">${table}</div>` : table;
    }
    return '';
  }).join('\n');
  const toc = headings.filter((heading) => heading.level <= 3).map((heading) => `<li class="toc-level-${heading.level}"><a href="#${heading.id}">${escapeHtml(heading.text)}</a></li>`).join('');
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(headings[0]?.text ?? '测试报告')}</title><style>${cssText}</style></head><body><main class="report-container"><nav class="report-toc" aria-label="报告目录"><strong>目录</strong><ul>${toc}</ul></nav>${body}</main><div class="lightbox" id="image-lightbox" hidden><button type="button" class="lightbox-close" aria-label="关闭">×</button><img alt="放大图片"></div><script>(() => { const box = document.getElementById('image-lightbox'); const image = box.querySelector('img'); const close = () => { box.hidden = true; image.removeAttribute('src'); }; document.addEventListener('click', (event) => { const target = event.target; if (target.matches('.evidence-image')) { image.src = target.src; image.alt = target.alt; box.hidden = false; } else if (target === box || target.matches('.lightbox-close')) close(); }); document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); }); })();</script></body></html>`;
}

export function exportSelfContainedHtml({ markdownPath, cssText, cssPath, outputPath }) {
  const css = cssText ?? fs.readFileSync(cssPath, 'utf8');
  const model = parseMarkdownReport(fs.readFileSync(markdownPath, 'utf8'), markdownPath);
  const html = renderHtmlDocument(model, css);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html, 'utf8');
  const assets = model.assets;
  return { htmlPath: outputPath, metrics: { MarkdownImageReferenceCount: assets.length, ResolvedImageCount: assets.filter((asset) => asset.status === 'embedded').length, EmbeddedImageCount: assets.filter((asset) => asset.status === 'embedded').length, MissingImageCount: assets.filter((asset) => asset.status === 'missing').length, UnsupportedImageCount: assets.filter((asset) => asset.status === 'unsupported').length, SourceImageBytes: assets.reduce((sum, asset) => sum + asset.sourceBytes, 0), HtmlBytes: Buffer.byteLength(html) }, semantic: { TestCaseRows: model.blocks.filter((block) => block.isTestCase).reduce((sum, block) => sum + block.rows.length, 0) } };
}
