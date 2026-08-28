import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCoverageGate,
  buildExpandedCatalog,
  buildExpansionCases,
  FROZEN_IN_SCOPE_MENUS,
  OUT_OF_SCOPE_MENUS,
} from './menu-coverage-expansion.mjs';

const legacyCatalog = {
  TestCaseCount: 2,
  TestCases: [
    { TestCaseId: 'TC-VEH-CREATE-001', ModuleName: '场景管理', FeatureName: '车辆管理', Operation: 'CREATE', Title: 'legacy vehicle' },
    { TestCaseId: 'TC-MON-VISUAL-001', ModuleName: '监控管理', FeatureName: '监控看板', Operation: 'VISUAL', Title: 'excluded dashboard' },
  ],
};

const discovery = [
  { Module: '场景管理', MenuName: '车辆管理', Route: '/Sys/VehicleManage', SupportedOperations: ['PAGE_SMOKE', 'QUERY', 'CREATE', 'STATE'], CapabilityEvidenceScreenshot: 'vehicle.png' },
  { Module: '系统管理', MenuName: '菜单管理', Route: '/Employee/Menu', SupportedOperations: ['PAGE_SMOKE', 'CREATE', 'UPDATE', 'DELETE'], CapabilityEvidenceScreenshot: 'menu.png' },
];

test('frozen scope contains exactly 19 menus and excludes the dashboard', () => {
  assert.equal(FROZEN_IN_SCOPE_MENUS.length, 19);
  assert.equal(new Set(FROZEN_IN_SCOPE_MENUS.map((menu) => menu.MenuName)).size, 19);
  assert.deepEqual(OUT_OF_SCOPE_MENUS.map((menu) => menu.MenuName), ['综合看板']);
  assert.equal(FROZEN_IN_SCOPE_MENUS.some((menu) => menu.MenuName === '综合看板'), false);
});

test('expanded catalog preserves legacy cases and adds only designed cases', () => {
  const added = buildExpansionCases(discovery);
  const catalog = buildExpandedCatalog(legacyCatalog, added);
  assert.equal(catalog.LegacyTestCaseCount, 2);
  assert.equal(catalog.AddedTestCaseCount, added.length);
  assert.equal(catalog.TestCaseCount, 2 + added.length);
  assert.deepEqual(catalog.TestCases.slice(0, 2), legacyCatalog.TestCases);
  assert.equal(new Set(catalog.TestCases.map((item) => item.TestCaseId)).size, catalog.TestCaseCount);
  assert.equal(catalog.TestCases.some((item) => item.TestCaseId === 'TC-MON-VISUAL-001'), true);
});

test('Menu Coverage Gate requires every in-scope menu to have a case and excludes dashboard', () => {
  const added = buildExpansionCases(discovery);
  const catalog = buildExpandedCatalog(legacyCatalog, added);
  const gate = buildCoverageGate({ catalog, discovery, legacyMapping: [
    { TestCaseId: 'TC-VEH-CREATE-001', MenuName: '车辆管理', Operation: 'CREATE' },
    { TestCaseId: 'TC-MON-VISUAL-001', MenuName: '综合看板', Operation: 'VISUAL' },
  ] });
  assert.equal(gate.Status, 'FAIL');
  assert.equal(gate.MissingMenuCount > 0, true);
  assert.equal(gate.InScopeLeafMenuCount, 19);
  assert.equal(gate.OutOfScopeCaseCount, 1);
  assert.equal(gate.MissingMenus.includes('策略管理'), true);
  assert.equal(gate.MissingMenus.includes('综合看板'), false);
});
