# Handoff Integrity Contract

## Contract identity

`ContractVersion=HANDOFF-SHA256-V1` identifies this complete algorithm. A producer and consumer conform only when both use the rules below. `SHA-256` alone is not a contract version.

An envelope with no `ContractVersion` is legacy and must return `BLOCKED(LEGACY_HASH_CONTRACT_UNVERSIONED)`. An unknown version must return `BLOCKED(UNSUPPORTED_HASH_CONTRACT_VERSION)`. Consumers must not guess a legacy algorithm or classify an unversioned package as tampered.

## HashedFileSet and exclusions

The hash root is the Handoff package directory. The protected set is every recursively discovered regular file below that root except these exact, case-sensitive, package-root relative paths:

```text
00-handoff-manifest.md
handoff.sha256
```

The following exact temporary/runtime-generated path classes are also excluded: any file below a directory named `.runtime`, `artifacts`, `runtime-evidence`, or `runtime-generated`, and any file whose basename ends with `.tmp` or `.temp`. These exclusions are case-sensitive and apply only to the named path classes; all other regular files are protected.

Directories are not records. Symbolic links and other non-regular entries are rejected as ambiguous. Exclusions do not match the same basename in a nested directory and do not match different casing.

## Paths, case, and ordering

Each record uses its path relative to the package root. `\` is normalized to `/`; absolute paths, empty segments, `.`, `..`, NUL, CR, and LF are invalid. Path spelling and Unicode code points are otherwise preserved. Case is not folded: `Folder/File.txt` and `folder/file.txt` are different canonical paths.

Records are sorted by unsigned lexicographic comparison of the canonical path's UTF-8 bytes. Filesystem enumeration and creation order have no effect. Duplicate canonical paths are invalid.

## Protected bytes and per-file digest

Each protected file is read as raw bytes. Its record contains:

- lowercase SHA-256 hex of the raw bytes;
- unsigned decimal byte length;
- canonical relative path serialized as a JSON string.

No text decoding or rewriting occurs. UTF-8 BOM, encoding, CRLF/LF, and every other byte difference are protected differences and therefore change that file digest.

## Canonical manifest and package digest

The in-memory canonical manifest is serialized exactly as:

```text
HANDOFF-SHA256-V1\n
sha256=<64-lowercase-hex> bytes=<decimal> path=<JSON-string>\n
```

There is one record line per protected file. The canonical manifest uses UTF-8 without BOM and LF (`0A`) only, including a final LF. The package `HandoffHash` is lowercase SHA-256 hex over those canonical-manifest bytes. The in-memory canonical manifest is not written into the protected set.

## Envelope and outcomes

`handoff.sha256` is UTF-8 without BOM and LF-only metadata containing these exact keys, one `key=value` per line:

```text
ContractVersion=HANDOFF-SHA256-V1
HandoffHash=<64-lowercase-hex>
HashedFileSet=recursive-regular-files
ExcludedFiles=00-handoff-manifest.md,handoff.sha256
ExcludedRuntimeDirectories=.runtime,artifacts,runtime-evidence,runtime-generated
ExcludedTemporarySuffixes=.tmp,.temp
PathNormalization=relative-forward-slash-case-sensitive
Sorting=utf8-byte-ordinal
ProtectedContent=raw-bytes
CanonicalManifestEncoding=UTF-8-no-BOM
CanonicalManifestLineEnding=LF
```

`00-handoff-manifest.md` repeats the contract version, hash, protected-set rule, and exclusions for human review. Both files are excluded to avoid recursive self-reference.

Consumer outcomes are:

- `PASS`: supported version, valid envelope, and actual hash equals expected hash;
- `FAIL`: supported version and valid envelope, but actual hash differs;
- `BLOCKED`: missing/unsupported version, malformed envelope, invalid protected set, or unreadable package.

Producer and Consumer must import `scripts/platform/handoff-integrity.mjs`; independent reimplementations are non-conforming.
