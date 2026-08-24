import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  buildCanonicalManifest,
  calculateHandoffIntegrity,
  canonicalizeRelativePath,
  freezeHandoffIntegrity,
  verifyHandoffIntegrity,
} from '../../../../scripts/platform/handoff-integrity.mjs';

const roots = [];

async function fixture(files = { 'payload.txt': Buffer.from('payload\n', 'utf8') }) {
  const root = await mkdtemp(join(tmpdir(), 'handoff-sha256-v1-'));
  roots.push(root);
  for (const [relativePath, bytes] of Object.entries(files)) {
    const target = join(root, ...relativePath.split('/'));
    await mkdir(join(target, '..'), { recursive: true });
    await writeFile(target, bytes);
  }
  return root;
}

test.after(async () => {
  await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })));
});

test('TC-PLATFORM-HANDOFF-HASH-001 producer and consumer agree for the same package', async () => {
  const root = await fixture({ 'nested/a.txt': Buffer.from('alpha\n'), 'b.bin': Buffer.from([0, 1, 2, 255]) });
  const produced = await freezeHandoffIntegrity(root);
  const consumed = await verifyHandoffIntegrity(root);
  assert.equal(consumed.status, 'PASS');
  assert.equal(consumed.actualHash, produced.newHash);
  assert.equal(consumed.expectedHash, produced.newHash);
});

test('TC-PLATFORM-HANDOFF-HASH-002 protected byte change returns FAIL', async () => {
  const root = await fixture();
  await freezeHandoffIntegrity(root);
  await writeFile(join(root, 'payload.txt'), Buffer.from('payloae\n'));
  const result = await verifyHandoffIntegrity(root);
  assert.equal(result.status, 'FAIL');
  assert.notEqual(result.actualHash, result.expectedHash);
});

test('TC-PLATFORM-HANDOFF-HASH-003 excluded envelope changes do not change hash', async () => {
  const root = await fixture();
  const before = await calculateHandoffIntegrity(root);
  await writeFile(join(root, '00-handoff-manifest.md'), '# arbitrary envelope change\n');
  await writeFile(join(root, 'handoff.sha256'), 'arbitrary envelope change\n');
  await mkdir(join(root, 'artifacts'), { recursive: true });
  await writeFile(join(root, 'artifacts', 'runtime.log'), 'generated evidence\n');
  await mkdir(join(root, '.runtime'), { recursive: true });
  await writeFile(join(root, '.runtime', 'state.json'), '{"generated":true}\n');
  await writeFile(join(root, 'scratch.tmp'), 'temporary\n');
  const after = await calculateHandoffIntegrity(root);
  assert.equal(after.hash, before.hash);
  assert.equal(after.canonicalManifest, before.canonicalManifest);
});

test('TC-PLATFORM-HANDOFF-HASH-004 Windows separators normalize to slash', () => {
  assert.equal(canonicalizeRelativePath('nested\\child\\file.txt'), 'nested/child/file.txt');
  const digest = 'a'.repeat(64);
  assert.equal(
    buildCanonicalManifest([{ path: 'nested\\child\\file.txt', size: 1, sha256: digest }]),
    buildCanonicalManifest([{ path: 'nested/child/file.txt', size: 1, sha256: digest }]),
  );
});

test('TC-PLATFORM-HANDOFF-HASH-005 creation order does not change manifest or hash', async () => {
  const first = await fixture({ 'z.txt': Buffer.from('z'), 'a.txt': Buffer.from('a') });
  const second = await fixture({ 'a.txt': Buffer.from('a'), 'z.txt': Buffer.from('z') });
  const firstResult = await calculateHandoffIntegrity(first);
  const secondResult = await calculateHandoffIntegrity(second);
  assert.equal(firstResult.canonicalManifest, secondResult.canonicalManifest);
  assert.equal(firstResult.hash, secondResult.hash);
});

test('TC-PLATFORM-HANDOFF-HASH-006 CRLF and LF are distinct protected bytes', async () => {
  const root = await fixture({ 'payload.txt': Buffer.from('one\r\ntwo\r\n') });
  await freezeHandoffIntegrity(root);
  await writeFile(join(root, 'payload.txt'), Buffer.from('one\ntwo\n'));
  const result = await verifyHandoffIntegrity(root);
  assert.equal(result.status, 'FAIL');
});

test('TC-PLATFORM-HANDOFF-HASH-007 missing ContractVersion is legacy BLOCKED', async () => {
  const root = await fixture();
  await writeFile(join(root, 'handoff.sha256'), `${'f'.repeat(64)}  <legacy-object>\n`);
  const result = await verifyHandoffIntegrity(root);
  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.reason, 'LEGACY_HASH_CONTRACT_UNVERSIONED');
});

test('TC-PLATFORM-HANDOFF-HASH-008 canonical path preserves case', () => {
  const digest = 'b'.repeat(64);
  const upper = buildCanonicalManifest([{ path: 'Folder/File.txt', size: 1, sha256: digest }]);
  const lower = buildCanonicalManifest([{ path: 'folder/file.txt', size: 1, sha256: digest }]);
  assert.notEqual(upper, lower);
  assert.match(upper, /Folder\/File\.txt/);
});

test('TC-PLATFORM-HANDOFF-HASH-009 UTF-8 BOM is a protected byte change', async () => {
  const root = await fixture({ 'payload.txt': Buffer.from('中文\n', 'utf8') });
  await freezeHandoffIntegrity(root);
  const original = await readFile(join(root, 'payload.txt'));
  await writeFile(join(root, 'payload.txt'), Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), original]));
  const result = await verifyHandoffIntegrity(root);
  assert.equal(result.status, 'FAIL');
});
