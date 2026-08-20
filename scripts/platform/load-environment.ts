import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020';

import environmentProfileSchema from '../../contracts/schemas/environment-profile.schema.json';

export const ENVIRONMENT_TYPES = ['SYNTHETIC', 'LOCAL_REAL', 'STAGING', 'CI_SYNTHETIC', 'DESKTOP_LOCAL'] as const;
export const CAPABILITIES = ['WEB', 'API', 'UNIT', 'INTEGRATION', 'DESKTOP_HEADLESS', 'DESKTOP_E2E', 'MANUAL'] as const;
export const DATA_POLICIES = ['TEST_OWNED_ONLY', 'EXTERNAL_APPROVED_ONLY', 'MANUAL_ONLY'] as const;
export const EVIDENCE_POLICIES = ['SANITIZED', 'RESTRICTED', 'MANUAL_ONLY'] as const;
export const ALIGNMENT_POLICIES = ['REQUIRE_ALIGNED', 'REPORT_ONLY', 'NOT_APPLICABLE'] as const;

export type EnvironmentType = (typeof ENVIRONMENT_TYPES)[number];
export type Capability = (typeof CAPABILITIES)[number];
export type DataPolicy = (typeof DATA_POLICIES)[number];
export type EvidencePolicy = (typeof EVIDENCE_POLICIES)[number];
export type SourceRuntimeAlignmentPolicy = (typeof ALIGNMENT_POLICIES)[number];

export interface EnvironmentProfile {
  EnvironmentId: string;
  EnvironmentType: EnvironmentType;
  Runtime: string;
  WebBaseUrl: string;
  ApiBaseUrl: string;
  DesktopRuntime: boolean;
  Capabilities: Capability[];
  DestructiveAllowed: boolean;
  DataPolicy: DataPolicy;
  EvidencePolicy: EvidencePolicy;
  IsCI?: boolean;
  Owner?: string;
  Description?: string;
  SourceRuntimeAlignmentPolicy?: SourceRuntimeAlignmentPolicy;
}

const defaultProfilePath = resolve(process.cwd(), 'config/environments.example.json');
const SECRET_LIKE = /(password|passwd|token|authorization|cookie|connectionstring|client_secret|api[_-]?key)\s*[:=]/i;
const REAL_REFERENCE = /(?:[A-Za-z]:[\\/]|\\\\|https?:\/\/|file:\/\/|localhost:\d+)/i;
const schemaValidator = new Ajv2020({ allErrors: true });
const validateSchema = schemaValidator.compile(environmentProfileSchema);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateEnvironmentProfile(input: unknown): string[] {
  if (!isRecord(input)) return ['profile must be an object'];
  const issues: string[] = [];
  if (!validateSchema(input)) {
    for (const error of validateSchema.errors ?? []) issues.push(`schema ${error.instancePath || '/'} ${error.message ?? 'is invalid'}`);
  }
  for (const field of ['EnvironmentId', 'Runtime', 'WebBaseUrl', 'ApiBaseUrl', 'DataPolicy', 'EvidencePolicy']) {
    if (typeof input[field] !== 'string' || input[field].trim() === '') issues.push(`${field} must be a non-empty string`);
  }
  if (!ENVIRONMENT_TYPES.includes(String(input.EnvironmentType) as EnvironmentType)) issues.push('EnvironmentType is invalid');
  if (typeof input.DesktopRuntime !== 'boolean') issues.push('DesktopRuntime must be boolean');
  if (typeof input.DestructiveAllowed !== 'boolean') issues.push('DestructiveAllowed must be boolean');
  if (!Array.isArray(input.Capabilities) || input.Capabilities.some((value) => !CAPABILITIES.includes(String(value) as Capability))) issues.push('Capabilities contains an invalid value');
  if (!DATA_POLICIES.includes(String(input.DataPolicy) as DataPolicy)) issues.push('DataPolicy is invalid');
  if (!EVIDENCE_POLICIES.includes(String(input.EvidencePolicy) as EvidencePolicy)) issues.push('EvidencePolicy is invalid');
  if (input.SourceRuntimeAlignmentPolicy !== undefined && !ALIGNMENT_POLICIES.includes(String(input.SourceRuntimeAlignmentPolicy) as SourceRuntimeAlignmentPolicy)) issues.push('SourceRuntimeAlignmentPolicy is invalid');

  const serialized = JSON.stringify(input);
  if (SECRET_LIKE.test(serialized)) issues.push('profile contains a secret-looking value');
  if (input.EnvironmentType === 'CI_SYNTHETIC') {
    if (input.Runtime !== 'synthetic') issues.push('CI Synthetic profile must use the synthetic runtime');
    if (input.WebBaseUrl !== 'dynamic' || input.ApiBaseUrl !== 'dynamic') issues.push('CI Synthetic profile must use dynamic WebBaseUrl and ApiBaseUrl');
    if (input.DesktopRuntime !== false) issues.push('CI Synthetic profile cannot enable DesktopRuntime');
    if (input.DataPolicy !== 'TEST_OWNED_ONLY') issues.push('CI Synthetic profile must use TEST_OWNED_ONLY');
    if (REAL_REFERENCE.test(`${input.Runtime} ${input.WebBaseUrl} ${input.ApiBaseUrl}`)) issues.push('CI Synthetic profile contains a real runtime reference');
  }
  return issues;
}

export function loadEnvironment(environmentId: string, profilePath = defaultProfilePath): EnvironmentProfile {
  const parsed: unknown = JSON.parse(readFileSync(profilePath, 'utf8'));
  const profiles = Array.isArray(parsed) ? parsed : isRecord(parsed) && Array.isArray(parsed.profiles) ? parsed.profiles : [];
  const profile = profiles.find((candidate) => isRecord(candidate) && candidate.EnvironmentId === environmentId);
  if (!profile) throw new Error(`Unknown environment: ${environmentId}`);
  const issues = validateEnvironmentProfile(profile);
  if (issues.length > 0) throw new Error(`Invalid environment ${environmentId}: ${issues.join('; ')}`);
  return profile as unknown as EnvironmentProfile;
}

export function environmentSupports(profile: EnvironmentProfile, capability: Capability): boolean {
  return profile.Capabilities.includes(capability);
}

export function capabilityGate(profile: EnvironmentProfile, required: Capability[]) {
  const MissingCapabilities = required.filter((capability) => !environmentSupports(profile, capability));
  return MissingCapabilities.length === 0
    ? { GateStatus: 'PASS' as const, ExecutionStatus: 'PASS' as const, ApplicabilityStatus: 'APPLICABLE' as const, MissingCapabilities }
    : { GateStatus: 'LIMITED' as const, ExecutionStatus: 'BLOCKED' as const, ApplicabilityStatus: 'CONDITIONAL' as const, MissingCapabilities };
}
