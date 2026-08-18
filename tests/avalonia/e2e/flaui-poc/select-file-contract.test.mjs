import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSingleFileSelection } from './select-file-contract.mjs';

test('accepts exactly one existing absolute ZIP path', () => {
  const filePath = String.raw`E:\测试项目部署\测试项目部署\RSS\log\hz.carlog_20260717160532098_20260717162532098.zip`;
  const selection = buildSingleFileSelection(filePath);
  assert.deepEqual(selection, { filePath, isSingleFile: true });
});

test('rejects more than one path value', () => {
  assert.throws(() => buildSingleFileSelection('a.zip b.zip'), /single file/i);
});
