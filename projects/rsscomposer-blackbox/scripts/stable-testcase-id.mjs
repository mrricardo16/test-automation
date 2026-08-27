import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, '..');
const repositoryDirectory = path.resolve(projectDirectory, '..', '..');
const catalogDirectory = path.join(projectDirectory, 'test-cases', 'catalog');

export const CURRENT_TESTCASE_ID_PATTERN = /^TC-[A-Z0-9]{2,10}-[A-Z0-9]{2,12}-\d{3}$/;
export const LEGACY_HISTORICAL_ID_PATTERN = /^TC-BB-REAL-\d{3}(?:-[A-Z])?$/;
export const FEATURE_CODE_REGISTRY_PATH = path.join(catalogDirectory, 'feature-code-registry.json');
export const TESTCASE_ID_REGISTRY_PATH = path.join(catalogDirectory, 'testcase-id-registry.json');
export const MIGRATION_MAP_PATH = path.join(catalogDirectory, 'TESTCASE_ID_MIGRATION_MAP.json');
export const MIGRATION_RECONCILIATION_PATH = path.join(catalogDirectory, 'TESTCASE_ID_MIGRATION_RECONCILIATION.json');
const FORBIDDEN_STABLE_ID_TOKENS = /(?:^|-)BB(?:-|$)|(?:^|-)(?:GEN|DETAIL|PENDING|REVIEW|AUTO|MANUAL|PASS|FAIL|ERROR|BLOCKED|READY|REAL|HISTORICAL|EXPECTED|GAP|STATE)(?:-|$)/;

const operationAliases = Object.freeze({
  查询: 'QUERY', 新增: 'CREATE', 修改: 'UPDATE', 删除: 'DELETE', 校验: 'VALIDATE',
  边界: 'VALIDATE', 状态: 'STATE', 权限: 'PERMISSION', 关联: 'BIND', 关系: 'BIND',
  组合: 'LIFECYCLE', PAGINATION: 'PAGE', VALIDATION: 'VALIDATE', STATE_TRANSITION: 'STATE',
  RELATIONSHIP: 'BIND', RELATION: 'BIND', COMPOSITE_LIFECYCLE: 'LIFECYCLE',
  QUERY: 'QUERY', CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE', RESET: 'RESET',
  PAGE: 'PAGE', SORT: 'SORT', VISUAL: 'VISUAL', DOWNLOAD: 'DOWNLOAD', UPLOAD: 'UPLOAD',
  IMPORT: 'IMPORT', EXPORT: 'EXPORT', PERMISSION: 'PERMISSION',
});

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function readFeatureCodeRegistry() { return readJson(FEATURE_CODE_REGISTRY_PATH); }
export function readTestCaseIdRegistry() { return readJson(TESTCASE_ID_REGISTRY_PATH); }

export function normalizeStableText(value) {
  return String(value ?? '').replace(/\s+/gu, ' ').trim();
}

export function featureCodeFor(testCase, featureRegistry = readFeatureCodeRegistry()) {
  const featureName = normalizeStableText(testCase.FeatureName);
  const entry = (featureRegistry.Features ?? []).find((item) => item.FeatureName === featureName);
  if (!entry) throw new Error(`FeatureCode is not registered for FeatureName: ${featureName}`);
  return entry.FeatureCode;
}

export function operationCodeFor(testCase) {
  const title = normalizeStableText(testCase.Title);
  const featureName = normalizeStableText(testCase.FeatureName);
  if (/重发/u.test(`${featureName}${title}`)) return 'RESEND';
  if (/取消/u.test(`${featureName}${title}`)) return 'CANCEL';
  if (/用户状态/u.test(title)) return 'UPDATE';
  if (/解除/u.test(title)) return 'UNBIND';
  if (/绑定|关联/u.test(title) && !/权限变化/u.test(title)) return 'BIND';
  if (/权限变化|权限访问/u.test(title)) return 'PERMISSION';
  const operation = normalizeStableText(testCase.Operation).toUpperCase();
  const code = operationAliases[operation] ?? operationAliases[normalizeStableText(testCase.Operation)];
  if (!code || !/^[A-Z0-9]{2,12}$/u.test(code)) throw new Error(`OperationCode is not registered for operation: ${testCase.Operation}`);
  return code;
}

export function buildStableCaseKey(testCase) {
  const moduleName = normalizeStableText(testCase.ModuleName);
  const featureName = normalizeStableText(testCase.FeatureName);
  const title = normalizeStableText(testCase.Title ?? testCase.Scenario);
  if (!moduleName || !featureName || !title) throw new Error(`Cannot build StableCaseKey for incomplete TestCase: ${JSON.stringify(testCase)}`);
  return `FEATURE:${moduleName}::${featureName}::TITLE:${title}`;
}

export function buildStableTestCaseId(featureCode, operationCode, sequence) {
  const id = `TC-${featureCode}-${operationCode}-${String(sequence).padStart(3, '0')}`;
  if (!CURRENT_TESTCASE_ID_PATTERN.test(id)) throw new Error(`Generated TestCaseId does not match the stable pattern: ${id}`);
  if (FORBIDDEN_STABLE_ID_TOKENS.test(id)) throw new Error(`Generated TestCaseId contains a forbidden state or generation token: ${id}`);
  return id;
}

function replaceIds(value, idMap) {
  if (typeof value === 'string') {
    return [...idMap.entries()].sort((a, b) => b[0].length - a[0].length).reduce((text, [oldId, newId]) => text.split(oldId).join(newId), value);
  }
  if (Array.isArray(value)) return value.map((item) => replaceIds(item, idMap));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceIds(item, idMap)]));
  return value;
}

export function replaceTestCaseIds(value, idMap) { return replaceIds(value, new Map(Object.entries(idMap))); }

export function applyStableIds(testCases, { registry = readTestCaseIdRegistry(), requireRegistered = true } = {}) {
  const entriesByKey = new Map((registry.Cases ?? []).map((item) => [item.StableCaseKey, item]));
  const entriesByLegacyId = new Map((registry.Cases ?? []).flatMap((item) => (item.LegacyTestCaseIds ?? []).map((id) => [id, item])));
  const idMap = {};
  const assigned = [];
  const seen = new Set();
  for (const testCase of testCases) {
    const stableCaseKey = buildStableCaseKey(testCase);
    const entry = entriesByKey.get(stableCaseKey) ?? entriesByLegacyId.get(testCase.TestCaseId);
    if (!entry) {
      if (requireRegistered) throw new Error(`StableCaseKey is not registered: ${stableCaseKey}`);
      throw new Error(`Cannot allocate an unregistered stable ID during normal generation: ${stableCaseKey}`);
    }
    if (!CURRENT_TESTCASE_ID_PATTERN.test(entry.TestCaseId) || FORBIDDEN_STABLE_ID_TOKENS.test(entry.TestCaseId)) throw new Error(`Registry contains an invalid current TestCaseId: ${entry.TestCaseId}`);
    if (seen.has(entry.TestCaseId)) throw new Error(`Duplicate stable TestCaseId assignment: ${entry.TestCaseId}`);
    seen.add(entry.TestCaseId);
    idMap[testCase.TestCaseId] = entry.TestCaseId;
    assigned.push({ ...testCase, TestCaseId: entry.TestCaseId, StableCaseKey: stableCaseKey, FeatureCode: entry.FeatureCode, OperationCode: entry.OperationCode });
  }
  return { TestCases: assigned.map((item) => replaceIds(item, new Map(Object.entries(idMap)))), IdMap: idMap, Registry: registry };
}

export function currentId(value) { return typeof value === 'string' && CURRENT_TESTCASE_ID_PATTERN.test(value); }
export function legacyHistoricalId(value) { return typeof value === 'string' && LEGACY_HISTORICAL_ID_PATTERN.test(value); }

export { repositoryDirectory, projectDirectory, catalogDirectory };
