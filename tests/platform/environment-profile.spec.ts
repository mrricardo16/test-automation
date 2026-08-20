import { test, expect } from '@playwright/test';

import {
  capabilityGate,
  environmentSupports,
  loadEnvironment,
  validateEnvironmentProfile,
} from '../../scripts/platform/load-environment';

test('TC-PLATFORM-07-ENV-001 loads the explicit synthetic-ci profile', () => {
  const profile = loadEnvironment('synthetic-ci');

  expect(profile.EnvironmentType).toBe('CI_SYNTHETIC');
  expect(profile.Runtime).toBe('synthetic');
  expect(profile.WebBaseUrl).toBe('dynamic');
  expect(profile.ApiBaseUrl).toBe('dynamic');
  expect(profile.Capabilities).toEqual(['WEB', 'API']);
  expect(profile.DestructiveAllowed).toBe(true);
  expect(profile.DataPolicy).toBe('TEST_OWNED_ONLY');
  expect(profile.EvidencePolicy).toBe('SANITIZED');
});

test('TC-PLATFORM-07-ENV-001 rejects CI real paths and secret-looking values', () => {
  const issues = validateEnvironmentProfile({
    EnvironmentId: 'unsafe-ci',
    EnvironmentType: 'CI_SYNTHETIC',
    Runtime: 'real-runtime',
    WebBaseUrl: 'http://10.0.0.4:8080',
    ApiBaseUrl: '<api_base_url>',
    DesktopRuntime: false,
    Capabilities: ['WEB'],
    DestructiveAllowed: true,
    DataPolicy: 'TEST_OWNED_ONLY',
    EvidencePolicy: 'SANITIZED',
    Description: 'token=secret-value',
  });

  expect(issues.some((issue) => issue.includes('real'))).toBe(true);
  expect(issues.some((issue) => issue.includes('secret'))).toBe(true);
});

test('TC-PLATFORM-07-ENV-001 represents missing desktop capability as blocked', () => {
  const profile = loadEnvironment('synthetic-ci');

  expect(environmentSupports(profile, 'DESKTOP_E2E')).toBe(false);
  expect(capabilityGate(profile, ['DESKTOP_E2E'])).toEqual({
    GateStatus: 'LIMITED',
    ExecutionStatus: 'BLOCKED',
    ApplicabilityStatus: 'CONDITIONAL',
    MissingCapabilities: ['DESKTOP_E2E'],
  });
});

test('TC-PLATFORM-07-ENV-001 rejects an unknown environment without local fallback', () => {
  expect(() => loadEnvironment('missing-environment')).toThrow(/Unknown environment/);
});
