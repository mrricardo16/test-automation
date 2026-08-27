import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, '..');
const defaultPackagePath = path.join(projectDirectory, 'runs', 'BB-REAL-20260824-174308', '04-v2-testcase-review-package.json');
const defaultClassificationPath = path.join(scriptDirectory, 'modular-testcase-classification.json');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

export function loadPackage(packagePath = defaultPackagePath) {
  return readJson(packagePath);
}

export function loadClassification(classificationPath = defaultClassificationPath) {
  return readJson(classificationPath);
}

export function getCandidates(packageData) {
  return [
    ...(Array.isArray(packageData.AtomicTestCases) ? packageData.AtomicTestCases : []),
    ...(Array.isArray(packageData.CompositeTestCases) ? packageData.CompositeTestCases : []),
  ];
}

export function presentationKey(testCase) {
  const order = testCase.PresentationOrder;
  return [order.ModuleOrder, order.FeatureOrder, order.OperationOrder, order.ScenarioOrder, order.CaseOrder, testCase.TestCaseId];
}

function compareKeys(left, right) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] < right[index]) return -1;
    if (left[index] > right[index]) return 1;
  }
  return 0;
}

export function classifyCandidates(packageData, classification = loadClassification()) {
  const modules = new Map(classification.modules.map((module) => [module.ModuleId, module]));
  const candidates = getCandidates(packageData);
  return candidates.map((candidate) => {
    const mapping = classification.cases[candidate.TestCaseId];
    if (!mapping) throw new Error(`Missing modular classification for ${candidate.TestCaseId}`);
    const module = modules.get(mapping.ModuleId);
    if (!module) throw new Error(`Missing module inventory entry for ${mapping.ModuleId}`);
    return {
      ...candidate,
      ModuleId: mapping.ModuleId,
      FeatureId: mapping.FeatureId,
      ModuleName: mapping.ModuleName,
      FeatureName: mapping.FeatureName,
      Operation: mapping.Operation,
      ScenarioGroup: mapping.ScenarioGroup,
      PresentationOrder: {
        ModuleOrder: module.ModuleOrder,
        FeatureOrder: mapping.FeatureOrder,
        OperationOrder: mapping.OperationOrder,
        ScenarioOrder: mapping.ScenarioOrder,
        CaseOrder: mapping.CaseOrder,
      },
    };
  });
}

function inventory(cases, field, orderField) {
  const values = new Map();
  for (const testCase of cases) {
    const key = testCase[field];
    if (!values.has(key)) values.set(key, { Id: key, Name: testCase[`${field.replace('Id', 'Name')}`] ?? key, Order: testCase.PresentationOrder[orderField], CaseIds: [] });
    values.get(key).CaseIds.push(testCase.TestCaseId);
  }
  return [...values.values()].sort((left, right) => left.Order - right.Order || String(left.Id).localeCompare(String(right.Id)));
}

export function buildModularCatalog({ packagePath = defaultPackagePath, classificationPath = defaultClassificationPath } = {}) {
  const packageData = loadPackage(packagePath);
  const classification = loadClassification(classificationPath);
  const cases = classifyCandidates(packageData, classification).sort((left, right) => compareKeys(presentationKey(left), presentationKey(right)));
  const expectedIds = Object.keys(classification.cases).sort();
  const actualIds = cases.map((testCase) => testCase.TestCaseId).sort();
  if (expectedIds.length !== actualIds.length || expectedIds.some((id, index) => id !== actualIds[index])) {
    throw new Error(`Classification/package candidate mismatch: expected ${expectedIds.length}, got ${actualIds.length}`);
  }

  return {
    PrimaryGrouping: 'MODULE',
    SecondaryGrouping: 'FEATURE',
    StatusUsedForGrouping: false,
    ModuleInventory: inventory(cases, 'ModuleId', 'ModuleOrder'),
    FeatureInventory: inventory(cases, 'FeatureId', 'FeatureOrder'),
    OperationInventory: [...new Map(cases.map((testCase) => [testCase.Operation, testCase.Operation])).values()].sort(),
    ScenarioInventory: [...new Map(cases.map((testCase) => [testCase.ScenarioGroup, testCase.ScenarioGroup])).values()].sort(),
    Cases: cases,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const catalog = buildModularCatalog();
  process.stdout.write(`${JSON.stringify(catalog, null, 2)}\n`);
}
