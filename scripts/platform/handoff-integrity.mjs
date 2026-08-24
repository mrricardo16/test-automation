import { createHash } from 'node:crypto';
import { lstat, readFile, readdir, writeFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';

export const CONTRACT_VERSION = 'HANDOFF-SHA256-V1';
export const EXCLUDED_FILES = Object.freeze(['00-handoff-manifest.md', 'handoff.sha256']);
export const EXCLUDED_RUNTIME_DIRECTORY_NAMES = Object.freeze([
  '.runtime',
  'artifacts',
  'runtime-evidence',
  'runtime-generated',
]);
export const EXCLUDED_TEMP_SUFFIXES = Object.freeze(['.tmp', '.temp']);

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const compareUtf8 = (left, right) => Buffer.compare(Buffer.from(left, 'utf8'), Buffer.from(right, 'utf8'));

export function canonicalizeRelativePath(input) {
  if (typeof input !== 'string' || input.length === 0 || isAbsolute(input)) {
    throw new Error('INVALID_HANDOFF_RELATIVE_PATH');
  }
  const normalized = input.replaceAll('\\', '/');
  const segments = normalized.split('/');
  if (segments.some((segment) => segment.length === 0 || segment === '.' || segment === '..' || /[\0\r\n]/.test(segment))) {
    throw new Error('INVALID_HANDOFF_RELATIVE_PATH');
  }
  return segments.join('/');
}

export function isExcludedHandoffPath(relativePath) {
  const normalized = canonicalizeRelativePath(relativePath);
  if (EXCLUDED_FILES.includes(normalized)) return true;
  const segments = normalized.split('/');
  if (segments.slice(0, -1).some((segment) => EXCLUDED_RUNTIME_DIRECTORY_NAMES.includes(segment))) return true;
  return EXCLUDED_TEMP_SUFFIXES.some((suffix) => segments.at(-1).endsWith(suffix));
}

export function buildCanonicalManifest(records) {
  const normalized = records.map((record) => ({
    path: canonicalizeRelativePath(record.path),
    size: record.size,
    sha256: record.sha256,
  })).sort((left, right) => compareUtf8(left.path, right.path));

  for (let index = 0; index < normalized.length; index += 1) {
    const record = normalized[index];
    if (!Number.isSafeInteger(record.size) || record.size < 0 || !/^[0-9a-f]{64}$/.test(record.sha256)) {
      throw new Error('INVALID_HANDOFF_FILE_RECORD');
    }
    if (index > 0 && normalized[index - 1].path === record.path) {
      throw new Error('DUPLICATE_CANONICAL_HANDOFF_PATH');
    }
  }

  return `${CONTRACT_VERSION}\n${normalized.map((record) =>
    `sha256=${record.sha256} bytes=${record.size} path=${JSON.stringify(record.path)}`
  ).join('\n')}\n`;
}

async function collectProtectedFiles(packageRoot) {
  const absoluteRoot = resolve(packageRoot);
  const rootInfo = await lstat(absoluteRoot);
  if (!rootInfo.isDirectory()) throw new Error('HANDOFF_ROOT_NOT_DIRECTORY');
  const records = [];

  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolutePath = resolve(directory, entry.name);
      const relativePath = canonicalizeRelativePath(relative(absoluteRoot, absolutePath).split(sep).join('/'));
      if (entry.isSymbolicLink()) throw new Error(`HANDOFF_SYMBOLIC_LINK_NOT_ALLOWED:${relativePath}`);
      if (entry.isDirectory()) {
        if (EXCLUDED_RUNTIME_DIRECTORY_NAMES.includes(entry.name)) continue;
        await visit(absolutePath);
      } else if (entry.isFile()) {
        if (isExcludedHandoffPath(relativePath)) continue;
        const bytes = await readFile(absolutePath);
        records.push({ path: relativePath, size: bytes.length, sha256: sha256(bytes) });
      } else {
        throw new Error(`HANDOFF_NON_REGULAR_ENTRY_NOT_ALLOWED:${relativePath}`);
      }
    }
  }

  await visit(absoluteRoot);
  return records;
}

export async function calculateHandoffIntegrity(packageRoot) {
  const files = await collectProtectedFiles(packageRoot);
  const canonicalManifest = buildCanonicalManifest(files);
  const canonicalManifestBytes = Buffer.from(canonicalManifest, 'utf8');
  return {
    contractVersion: CONTRACT_VERSION,
    hash: sha256(canonicalManifestBytes),
    files: [...files].sort((left, right) => compareUtf8(left.path, right.path)),
    exclusions: [...EXCLUDED_FILES],
    excludedRuntimeDirectoryNames: [...EXCLUDED_RUNTIME_DIRECTORY_NAMES],
    excludedTempSuffixes: [...EXCLUDED_TEMP_SUFFIXES],
    canonicalManifest,
    canonicalManifestBytes,
  };
}

export function parseIntegrityEnvelope(text) {
  const fields = new Map();
  for (const line of text.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    if (!line) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    fields.set(line.slice(0, separator), line.slice(separator + 1));
  }
  return Object.fromEntries(fields);
}

function blocked(reason, details = {}) {
  return { status: 'BLOCKED', reason, ...details };
}

export async function verifyHandoffIntegrity(packageRoot) {
  let envelopeText;
  try {
    envelopeText = await readFile(resolve(packageRoot, 'handoff.sha256'), 'utf8');
  } catch (error) {
    return blocked('HANDOFF_INTEGRITY_ENVELOPE_UNREADABLE', { error: error.message });
  }
  const envelope = parseIntegrityEnvelope(envelopeText);
  if (!envelope.ContractVersion) return blocked('LEGACY_HASH_CONTRACT_UNVERSIONED');
  if (envelope.ContractVersion !== CONTRACT_VERSION) {
    return blocked('UNSUPPORTED_HASH_CONTRACT_VERSION', { contractVersion: envelope.ContractVersion });
  }
  if (!/^[0-9a-f]{64}$/.test(envelope.HandoffHash ?? '')) return blocked('INVALID_EXPECTED_HANDOFF_HASH');

  try {
    const calculated = await calculateHandoffIntegrity(packageRoot);
    return {
      status: calculated.hash === envelope.HandoffHash ? 'PASS' : 'FAIL',
      reason: calculated.hash === envelope.HandoffHash ? 'HANDOFF_HASH_MATCH' : 'HANDOFF_HASH_MISMATCH',
      contractVersion: CONTRACT_VERSION,
      expectedHash: envelope.HandoffHash,
      actualHash: calculated.hash,
      protectedFileCount: calculated.files.length,
    };
  } catch (error) {
    return blocked('HANDOFF_HASH_CALCULATION_ERROR', { error: error.message });
  }
}

export async function buildHandoffManifest(packageRoot) {
  return (await calculateHandoffIntegrity(packageRoot)).canonicalManifest;
}

export async function computeHandoffHash(packageRoot) {
  return (await calculateHandoffIntegrity(packageRoot)).hash;
}

export async function verifyHandoffHash(packageRoot, expected) {
  const expectedHash = typeof expected === 'string' ? expected : expected?.expectedHash;
  if (!/^[0-9a-f]{64}$/.test(expectedHash ?? '')) {
    return blocked('INVALID_EXPECTED_HANDOFF_HASH');
  }
  try {
    const calculated = await calculateHandoffIntegrity(packageRoot);
    return {
      status: calculated.hash === expectedHash ? 'PASS' : 'FAIL',
      reason: calculated.hash === expectedHash ? 'HANDOFF_HASH_MATCH' : 'HANDOFF_HASH_MISMATCH',
      contractVersion: CONTRACT_VERSION,
      expectedHash,
      actualHash: calculated.hash,
      protectedFileCount: calculated.files.length,
    };
  } catch (error) {
    return blocked('HANDOFF_HASH_CALCULATION_ERROR', { error: error.message });
  }
}

function extractLegacyHash(text) {
  const match = text.match(/[0-9a-fA-F]{64}/);
  return match ? match[0].toLowerCase() : 'UNAVAILABLE';
}

function updateHumanManifest(existing, hash, protectedFileCount) {
  const retained = existing
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => !/^- (?:ContractVersion|Hash scope|Handoff Hash|HashedFileSet|ExcludedFiles|ExcludedRuntimeDirectories|ExcludedTemporarySuffixes|HashChangeReason|BUSINESS_HANDOFF_CONTENT_CHANGED|INTEGRITY_METADATA_CHANGED|Freeze Status):/.test(line));
  while (retained.at(-1) === '') retained.pop();
  retained.push(
    `- ContractVersion: ${CONTRACT_VERSION}`,
    '- Hash scope: canonical manifest of recursive regular files; package-root integrity envelope files are excluded',
    `- Handoff Hash: ${hash}`,
    `- HashedFileSet: ${protectedFileCount} protected regular files`,
    `- ExcludedFiles: ${EXCLUDED_FILES.join(', ')}`,
    `- ExcludedRuntimeDirectories: ${EXCLUDED_RUNTIME_DIRECTORY_NAMES.join(', ')}`,
    `- ExcludedTemporarySuffixes: ${EXCLUDED_TEMP_SUFFIXES.join(', ')}`,
    '- HashChangeReason: INTEGRITY_CONTRACT_STANDARDIZATION',
    '- BUSINESS_HANDOFF_CONTENT_CHANGED: NO',
    '- INTEGRITY_METADATA_CHANGED: YES',
    '- Freeze Status: FROZEN after HANDOFF-SHA256-V1 validation and hash generation',
    '',
  );
  return retained.join('\n');
}

export async function freezeHandoffIntegrity(packageRoot) {
  const hashPath = resolve(packageRoot, 'handoff.sha256');
  const manifestPath = resolve(packageRoot, '00-handoff-manifest.md');
  let oldEnvelope = '';
  let oldManifest = '# Handoff Manifest\n';
  try { oldEnvelope = await readFile(hashPath, 'utf8'); } catch {}
  try { oldManifest = await readFile(manifestPath, 'utf8'); } catch {}

  const calculated = await calculateHandoffIntegrity(packageRoot);
  const envelope = [
    `ContractVersion=${CONTRACT_VERSION}`,
    `HandoffHash=${calculated.hash}`,
    'HashedFileSet=recursive-regular-files',
    `ExcludedFiles=${EXCLUDED_FILES.join(',')}`,
    `ExcludedRuntimeDirectories=${EXCLUDED_RUNTIME_DIRECTORY_NAMES.join(',')}`,
    `ExcludedTemporarySuffixes=${EXCLUDED_TEMP_SUFFIXES.join(',')}`,
    'PathNormalization=relative-forward-slash-case-sensitive',
    'Sorting=utf8-byte-ordinal',
    'ProtectedContent=raw-bytes',
    'CanonicalManifestEncoding=UTF-8-no-BOM',
    'CanonicalManifestLineEnding=LF',
    '',
  ].join('\n');
  await writeFile(hashPath, envelope, 'utf8');
  await writeFile(manifestPath, updateHumanManifest(oldManifest, calculated.hash, calculated.files.length), 'utf8');
  return {
    contractVersion: CONTRACT_VERSION,
    oldHash: extractLegacyHash(oldEnvelope),
    newHash: calculated.hash,
    protectedFileCount: calculated.files.length,
    businessHandoffContentChanged: false,
    integrityMetadataChanged: true,
  };
}
