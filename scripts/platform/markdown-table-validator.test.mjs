import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { splitMarkdownRow, validateMarkdownTables } from './markdown-table-validator.mjs';

function writeTemp(content) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'markdown-table-validator-'));
  const filePath = path.join(directory, 'sample.md');
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

test('TC-PLATFORM-13-MARKDOWN-TABLE-VALIDATION-001 accepts a Typora-compatible table and escaped pipe', () => {
  const filePath = writeTemp('| 场景 | 结果 |\n|---|---|\n| 状态 A \\| 状态 B | PASS<br>可自动执行 |\n');
  const result = validateMarkdownTables(filePath);
  assert.equal(result.invalidTableCount, 0);
  assert.equal(result.tableCount, 1);
  assert.deepEqual(splitMarkdownRow('| 状态 A \\| 状态 B | PASS |'), ['状态 A \\| 状态 B', 'PASS']);
});

test('TC-PLATFORM-13-MARKDOWN-TABLE-VALIDATION-001 rejects a table without a separator row', () => {
  const filePath = writeTemp('| 场景 | 结果 |\n| 登录 | PASS |\n');
  const result = validateMarkdownTables(filePath);
  assert.ok(result.invalidTableCount > 0);
});

test('TC-PLATFORM-13-MARKDOWN-TABLE-VALIDATION-001 rejects inconsistent columns', () => {
  const filePath = writeTemp('| 场景 | 结果 |\n|---|---|\n| 登录 | PASS | 多余列 |\n');
  const result = validateMarkdownTables(filePath);
  assert.ok(result.invalidTableCount > 0);
});
