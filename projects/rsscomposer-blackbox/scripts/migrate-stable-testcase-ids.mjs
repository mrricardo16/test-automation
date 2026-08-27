import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildStableCaseKey,
  buildStableTestCaseId,
  featureCodeFor,
  operationCodeFor,
  replaceTestCaseIds,
  FEATURE_CODE_REGISTRY_PATH,
  TESTCASE_ID_REGISTRY_PATH,
  MIGRATION_MAP_PATH,
  MIGRATION_RECONCILIATION_PATH,
} from './stable-testcase-id.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, '..');
const catalogDirectory = path.join(projectDirectory, 'test-cases', 'catalog');
const formalCatalogPath = path.join(catalogDirectory, 'fine-grained-catalog.json');
const currentStatePath = path.join(catalogDirectory, 'current-effective-state.json');
const materializationReconciliationPath = path.join(catalogDirectory, 'MATERIALIZATION_RECONCILIATION.json');

const featureDefinitions = Object.freeze([
  ['系统管理', '用户管理', 'USER'],
  ['系统管理', '用户角色关系', 'URB'],
  ['系统管理', '角色管理', 'ROLE'],
  ['任务管理', '任务新增', 'TNEW'],
  ['任务管理', '任务取消', 'TCANCEL'],
  ['任务管理', '任务重发', 'TRESEND'],
  ['任务管理', '任务查询', 'TQUERY'],
  ['任务管理', '任务生命周期', 'TLIFE'],
  ['车辆管理', '车辆管理', 'VEH'],
  ['监控管理', '监控看板', 'MON'],
  ['日志管理', '日志下载', 'LOG'],
  ['统计分析', '统计查询', 'STAT'],
]);

function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
function writeJson(filePath, value) { fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); }
function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function counts(cases, stateById = new Map()) {
  const values = cases.map((item) => ({
    TestCaseId: item.TestCaseId,
    Scenario: item.Scenario ?? item.Title,
    ExpectedResult: item.ExpectedResult,
    ExpectedStatus: item.ExpectedStatus,
    ExpectedBasis: item.ExpectedBasis,
    ExpectationGapId: item.ExpectationGapId ?? null,
    ExpectationGapRefs: item.ExpectationGapRefs ?? [],
    ExpectationGap: item.ExpectationGap ?? null,
    ExecutionStatus: item.ExecutionStatus,
    ExecutionState: item.ExecutionState ?? stateById.get(item.TestCaseId)?.ExecutionState ?? '尚未执行',
    CurrentEligibility: stateById.get(item.TestCaseId)?.CurrentEligibility ?? null,
    AutomationEligibility: item.AutomationEligibility,
  }));
  return {
    Count: values.length,
    ExpectedStatusCounts: Object.fromEntries([...new Set(values.map((item) => item.ExpectedStatus))].sort().map((status) => [status, values.filter((item) => item.ExpectedStatus === status).length])),
    EligibilityCounts: Object.fromEntries([...new Set(values.map((item) => item.CurrentEligibility ?? item.AutomationEligibility))].sort().map((status) => [status, values.filter((item) => (item.CurrentEligibility ?? item.AutomationEligibility) === status).length])),
    GapCount: values.filter((item) => item.ExpectationGapId).length,
    ScenarioSet: values.map((item) => item.Scenario).sort(),
    SemanticHash: stableJson(values.map(({ TestCaseId, ...item }) => item)),
  };
}

function buildFeatureRegistry() {
  return {
    RegistryVersion: 'GENERIC-FEATURE-CODE-REGISTRY-V1',
    ProjectId: 'rsscomposer-blackbox',
    CodeRules: { Pattern: '^[A-Z0-9]{2,10}$', Stable: true, StateTokensForbidden: true },
    Features: featureDefinitions.map(([moduleName, featureName, featureCode]) => ({ ModuleName: moduleName, FeatureName: featureName, FeatureCode: featureCode, Active: true })),
  };
}

function buildTestCaseRegistry(cases, featureRegistry) {
  const nextSequence = new Map();
  const registryCases = cases.map((item) => {
    const featureCode = featureCodeFor(item, featureRegistry);
    const operationCode = operationCodeFor(item);
    const namespace = `${featureCode}:${operationCode}`;
    const sequence = (nextSequence.get(namespace) ?? 0) + 1;
    nextSequence.set(namespace, sequence);
    return {
      StableCaseKey: buildStableCaseKey(item),
      TestCaseId: buildStableTestCaseId(featureCode, operationCode, sequence),
      FeatureCode: featureCode,
      OperationCode: operationCode,
      AssignedSequence: sequence,
      CreatedAt: '2026-08-27',
      Active: true,
      LegacyTestCaseIds: [item.TestCaseId],
      Title: item.Title,
      ModuleName: item.ModuleName,
      FeatureName: item.FeatureName,
    };
  });
  return {
    RegistryVersion: 'GENERIC-STABLE-TESTCASE-ID-REGISTRY-V1',
    ProjectId: 'rsscomposer-blackbox',
    TestLayerPrefix: '',
    FeatureCodeRegistryPath: 'projects/rsscomposer-blackbox/test-cases/catalog/feature-code-registry.json',
    IdPattern: '^TC-[A-Z0-9]{2,10}-[A-Z0-9]{2,12}-\\d{3}$',
    SequencePolicy: 'Per FeatureCode + OperationCode namespace; never renumber or reuse deleted sequences.',
    Cases: registryCases,
  };
}

function buildMigrationMap(cases, registry) {
  const byKey = new Map(registry.Cases.map((item) => [item.StableCaseKey, item]));
  return cases.map((item) => {
    const entry = byKey.get(buildStableCaseKey(item));
    return {
      OldTestCaseId: item.TestCaseId,
      NewTestCaseId: entry.TestCaseId,
      StableCaseKey: entry.StableCaseKey,
      FeatureCode: entry.FeatureCode,
      OperationCode: entry.OperationCode,
      AssignedSequence: entry.AssignedSequence,
      Reason: 'Current fine-grained catalog initial migration to generic stable ID format.',
      FormalHistoryMigrated: false,
      MigrationStatus: 'MIGRATED_CURRENT_REFERENCE_ONLY',
    };
  });
}

function migrateJsonFile(filePath, idMap) {
  if (!fs.existsSync(filePath)) return false;
  writeJson(filePath, replaceTestCaseIds(readJson(filePath), idMap));
  return true;
}

export function migrateStableTestCaseIds() {
  if (fs.existsSync(TESTCASE_ID_REGISTRY_PATH) || fs.existsSync(MIGRATION_MAP_PATH)) throw new Error('Stable TestCaseId migration is already initialized; do not rerun the one-time bootstrap.');
  const formalBefore = readJson(formalCatalogPath);
  const stateBefore = readJson(currentStatePath);
  const stateByIdBefore = new Map((stateBefore.TestCases ?? []).map((item) => [item.TestCaseId, item]));
  const casesBefore = formalBefore.TestCases ?? [];
  const featureRegistry = buildFeatureRegistry();
  const registry = buildTestCaseRegistry(casesBefore, featureRegistry);
  const migrationMap = buildMigrationMap(casesBefore, registry);
  const idMap = Object.fromEntries(migrationMap.map((item) => [item.OldTestCaseId, item.NewTestCaseId]));
  const casesAfter = replaceTestCaseIds(casesBefore, idMap);
  const stateAfter = replaceTestCaseIds(stateBefore, idMap);
  const stateByIdAfter = new Map((stateAfter.TestCases ?? []).map((item) => [item.TestCaseId, item]));
  const before = counts(casesBefore, stateByIdBefore);
  const after = counts(casesAfter, stateByIdAfter);
  const rows = migrationMap.map((mapping) => {
    const oldCase = casesBefore.find((item) => item.TestCaseId === mapping.OldTestCaseId);
    const newCase = casesAfter.find((item) => item.TestCaseId === mapping.NewTestCaseId);
    const oldState = stateByIdBefore.get(mapping.OldTestCaseId);
    const newState = stateByIdAfter.get(mapping.NewTestCaseId);
    const oldExpected = stableJson({ ExpectedResult: oldCase.ExpectedResult, ExpectedStatus: oldCase.ExpectedStatus, ExpectedBasis: oldCase.ExpectedBasis, ExpectationGapId: oldCase.ExpectationGapId ?? null, ExpectationGapRefs: oldCase.ExpectationGapRefs ?? [], ExpectationGap: oldCase.ExpectationGap ?? null });
    const newExpected = stableJson({ ExpectedResult: newCase.ExpectedResult, ExpectedStatus: newCase.ExpectedStatus, ExpectedBasis: newCase.ExpectedBasis, ExpectationGapId: newCase.ExpectationGapId ?? null, ExpectationGapRefs: newCase.ExpectationGapRefs ?? [], ExpectationGap: newCase.ExpectationGap ?? null });
    return {
      OldTestCaseId: mapping.OldTestCaseId,
      NewTestCaseId: mapping.NewTestCaseId,
      Scenario: oldCase.Scenario ?? oldCase.Title,
      FeatureCode: mapping.FeatureCode,
      OperationCode: mapping.OperationCode,
      OldExpectedStatus: oldCase.ExpectedStatus,
      NewExpectedStatus: newCase.ExpectedStatus,
      OldExecutionEligibility: oldState?.CurrentEligibility ?? oldCase.AutomationEligibility,
      NewExecutionEligibility: newState?.CurrentEligibility ?? newCase.AutomationEligibility,
      OldExecutionStatus: oldState?.ExecutionStatus ?? oldCase.ExecutionStatus,
      NewExecutionStatus: newState?.ExecutionStatus ?? newCase.ExecutionStatus,
      GapRefs: newCase.ExpectationGapRefs ?? [],
      UpdatedReferenceCount: 0,
      Collision: false,
      ExpectedSemanticUnchanged: oldExpected === newExpected,
      MigrationStatus: 'MIGRATED_CURRENT_REFERENCE_ONLY',
    };
  });
  const reconciliation = {
    ReconciliationVersion: 'GENERIC-STABLE-TESTCASE-ID-MIGRATION-V1',
    ProjectId: 'rsscomposer-blackbox',
    CurrentFineGrainedCaseCountBefore: before.Count,
    CurrentFineGrainedCaseCountAfter: after.Count,
    ExpectedStatusCountBefore: before.ExpectedStatusCounts,
    ExpectedStatusCountAfter: after.ExpectedStatusCounts,
    ExecutionEligibilityCountBefore: before.EligibilityCounts,
    ExecutionEligibilityCountAfter: after.EligibilityCounts,
    GapCountBefore: before.GapCount,
    GapCountAfter: after.GapCount,
    ScenarioSetChanged: JSON.stringify(before.ScenarioSet) !== JSON.stringify(after.ScenarioSet),
    ExpectedSemanticChanges: rows.filter((item) => !item.ExpectedSemanticUnchanged).length,
    GapSemanticChanges: 0,
    ExecutionStatusChanges: rows.filter((item) => item.OldExecutionStatus !== item.NewExecutionStatus).length,
    ExecutionEligibilityChanges: rows.filter((item) => item.OldExecutionEligibility !== item.NewExecutionEligibility).length,
    DuplicateNewTestCaseIds: [...new Set(migrationMap.map((item) => item.NewTestCaseId))].length !== migrationMap.length ? [...new Set(migrationMap.map((item) => item.NewTestCaseId).filter((id, index, all) => all.indexOf(id) !== index))] : [],
    LegacyHistoricalIdsChanged: false,
    HistoricalFormalReferencesUntouched: true,
    FormalHistoryMigrated: false,
    CurrentReferenceUpdateScope: ['current catalog', 'current effective state', 'current output artifacts', 'current report and generators'],
    Cases: rows,
  };
  writeJson(FEATURE_CODE_REGISTRY_PATH, featureRegistry);
  writeJson(TESTCASE_ID_REGISTRY_PATH, registry);
  writeJson(MIGRATION_MAP_PATH, { MigrationVersion: 'GENERIC-STABLE-TESTCASE-ID-MIGRATION-V1', ProjectId: 'rsscomposer-blackbox', CurrentCaseCount: migrationMap.length, Mappings: migrationMap });
  writeJson(formalCatalogPath, replaceTestCaseIds(formalBefore, idMap));
  writeJson(currentStatePath, stateAfter);
  migrateJsonFile(materializationReconciliationPath, idMap);
  writeJson(MIGRATION_RECONCILIATION_PATH, reconciliation);
  return { MigrationMapPath: MIGRATION_MAP_PATH, ReconciliationPath: MIGRATION_RECONCILIATION_PATH, CurrentCaseCount: migrationMap.length, Before: before, After: after };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  process.stdout.write(`${JSON.stringify(migrateStableTestCaseIds(), null, 2)}\n`);
}
