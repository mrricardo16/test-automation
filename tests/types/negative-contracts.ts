import type { ExecutionStatus, ExpectedBasis, GateStatus } from '../../scripts/platform/contract-types';

// @ts-expect-error NOT_APPLICABLE is not an ExecutionStatus.
export const invalidExecutionStatus: ExecutionStatus = 'NOT_APPLICABLE';

// @ts-expect-error RUNTIME_OBSERVED was intentionally removed from ExpectedBasis.
export const invalidExpectedBasis: ExpectedBasis = 'RUNTIME_OBSERVED';

// @ts-expect-error SUCCESS is not a canonical GateStatus.
export const invalidGateStatus: GateStatus = 'SUCCESS';
