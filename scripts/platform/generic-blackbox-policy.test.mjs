import assert from 'node:assert/strict';
import test from 'node:test';
import { EXPECTED_BASIS, PERMISSION_APPLICABILITY, applyGenericExpectedPolicy, auditAtomicity, runSyntheticAcceptance } from './generic-blackbox-policy.mjs';

test('generic design defaults cover query and delete without invented gaps', () => {
  const query = applyGenericExpectedPolicy({ Operation: 'QUERY', Title: '按名称查询', Preconditions: ['管理员具备该功能所需权限。'], TestData: [], Steps: ['执行目标操作并记录结果。'] }, { generic: true, entityName: '记录', subject: '名称查询条件' });
  assert.equal(query.ExpectedBasis, EXPECTED_BASIS.DESIGN_DEFAULT);
  assert.equal(query.ExpectedStatus, 'EXPECTED_CONFIRMED');
  assert.equal(query.PermissionApplicability, PERMISSION_APPLICABILITY.UNSPECIFIED);
  assert.equal(query.Preconditions.includes('管理员具备该功能所需权限。'), false);
  assert.equal(query.Steps.includes('执行目标操作并记录结果。'), false);
});

test('atomicity audit detects multiple primary rules', () => {
  assert.equal(auditAtomicity({ Title: '对象修改-正常修改/重复校验' }).Code, 'MULTIPLE_PRIMARY_RULES');
});

test('synthetic acceptance A-G passes', () => {
  assert.deepEqual(runSyntheticAcceptance(), { Pass: true, Issues: [] });
});
