import fs from 'node:fs';

function isEscaped(text, index) {
  let slashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && text[cursor] === '\\'; cursor -= 1) slashCount += 1;
  return slashCount % 2 === 1;
}

export function splitMarkdownRow(line) {
  const text = line.trim();
  if (!text.startsWith('|') || !text.endsWith('|')) return null;
  const cells = [];
  let start = 1;
  for (let index = 1; index < text.length - 1; index += 1) {
    if (text[index] !== '|' || isEscaped(text, index)) continue;
    cells.push(text.slice(start, index).trim());
    start = index + 1;
  }
  cells.push(text.slice(start, -1).trim());
  return cells;
}

function isSeparatorCell(cell) {
  return /^:?-{3,}:?$/.test(cell.trim());
}

function isTableLikeLine(line) {
  const text = line.trim();
  return text.startsWith('|') && text.endsWith('|');
}

export function validateMarkdownTables(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const tables = [];
  const invalid = [];
  let index = 0;
  let inFence = false;

  while (index < lines.length) {
    const line = lines[index];
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      index += 1;
      continue;
    }
    if (inFence || !isTableLikeLine(line)) {
      index += 1;
      continue;
    }

    const header = splitMarkdownRow(line);
    const separator = index + 1 < lines.length ? splitMarkdownRow(lines[index + 1]) : null;
    if (!header || !separator || separator.length !== header.length || !separator.every(isSeparatorCell)) {
      invalid.push({ line: index + 1, reason: '表头后缺少合法分隔行或分隔行列数不一致' });
      index += 1;
      continue;
    }

    const table = { line: index + 1, columns: header.length, rows: 0 };
    index += 2;
    while (index < lines.length && isTableLikeLine(lines[index])) {
      const row = splitMarkdownRow(lines[index]);
      if (!row || row.length !== table.columns) {
        invalid.push({ line: index + 1, reason: `数据行列数为 ${row?.length ?? 0}，表头列数为 ${table.columns}` });
      } else {
        table.rows += 1;
      }
      index += 1;
    }
    tables.push(table);
  }

  return { filePath, tableCount: tables.length, invalidTableCount: invalid.length, tables, invalid };
}

export function validateMarkdownFiles(filePaths) {
  const results = filePaths.map(validateMarkdownTables);
  return {
    files: results,
    markdownTableCount: results.reduce((sum, result) => sum + result.tableCount, 0),
    invalidMarkdownTableCount: results.reduce((sum, result) => sum + result.invalidTableCount, 0),
    allSeparatorRowsPresent: results.every((result) => result.invalidTableCount === 0),
    columnCountConsistent: results.every((result) => result.invalidTableCount === 0),
  };
}

if (process.argv[1] && process.argv[1].endsWith('markdown-table-validator.mjs')) {
  const filePaths = process.argv.slice(2);
  if (filePaths.length === 0) throw new Error('Usage: node markdown-table-validator.mjs <markdown-file> [more-files]');
  const result = validateMarkdownFiles(filePaths);
  if (result.invalidMarkdownTableCount > 0) {
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
  } else {
    console.log(`MARKDOWN_TABLE_RENDERING_STATUS=PASS (tables=${result.markdownTableCount}, invalid=0, separators=present, columns=consistent)`);
  }
}
