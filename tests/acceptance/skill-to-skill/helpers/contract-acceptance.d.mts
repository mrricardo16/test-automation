export interface SyntheticSourceContract {
  stableIds: Record<string, string[]>;
  expected: { featureFlag: string; itemLifecycle: string[] };
}

export interface EvidenceRecord {
  EvidenceId: string;
  Kind: string;
  [key: string]: any;
}

export interface AcceptanceArtifacts {
  handoff: Record<string, any>;
  coverage: { TestCaseId: string; [key: string]: any };
  testCase: { TestCaseId: string; [key: string]: any };
  execution: Record<string, any>;
  evidence: EvidenceRecord[];
  feedback: Record<string, any>;
  validationIssues: unknown[];
  baseline: Record<string, any>;
  rootCause: Record<string, any>;
}

export function loadSyntheticSourceContract(): Promise<SyntheticSourceContract>;
export function buildDevToTestArtifacts(source: SyntheticSourceContract, options?: Record<string, any>): AcceptanceArtifacts;
export function buildSourceWhiteboxArtifacts(source: SyntheticSourceContract, baselineStatus: string, alignment: string): AcceptanceArtifacts;
export function buildKnownBugExecution(source: SyntheticSourceContract): Record<string, any>;
export function evaluateAcceptanceExpectation(result: Record<string, any>): Record<string, any>;
export function evaluateApplicability(result: Record<string, any>): Record<string, any>;
export function evaluateBaselineAndAlignment(baselineStatus: string, alignment: string): Record<string, any>;
export function stableIdsForSource(source: SyntheticSourceContract): string[];
