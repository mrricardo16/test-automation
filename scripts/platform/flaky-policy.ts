import type { ContractExecutionResult, ExecutionStatus, FlakyClassification, RetryAttempt } from './contract-types';

export interface FlakyAssessment {
  FlakyClassification: FlakyClassification;
  firstFailureEvidence: string[];
  retryResult?: ExecutionStatus;
  attempts: RetryAttempt[];
}

export function classifyFlakyResult(result: ContractExecutionResult): FlakyAssessment {
  const attempts = result.attempts ? result.attempts.map((attempt) => ({
    attempt: attempt.attempt,
    ExecutionStatus: attempt.ExecutionStatus,
    EvidenceIds: [...attempt.EvidenceIds],
  })) : [];

  if (attempts.length < 2) {
    return {
      FlakyClassification: 'NOT_FLAKY',
      firstFailureEvidence: [],
      attempts,
    };
  }

  const statuses = attempts.map((attempt) => attempt.ExecutionStatus);
  const hasFail = statuses.includes('FAIL');
  const hasPass = statuses.includes('PASS');
  const firstFailureEvidence = result.firstFailureEvidence?.length
    ? [...result.firstFailureEvidence]
    : attempts.find((attempt) => attempt.ExecutionStatus === 'FAIL')?.EvidenceIds.slice() ?? [];
  const FlakyClassification = hasFail && hasPass
    ? result.ExecutionStatus === 'PASS' ? 'FLAKY_PASS' : result.ExecutionStatus === 'FAIL' ? 'FLAKY_FAIL' : 'UNKNOWN'
    : 'NOT_FLAKY';

  return {
    FlakyClassification,
    firstFailureEvidence,
    retryResult: result.ExecutionStatus,
    attempts,
  };
}
