import { mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

export type ApiEvidenceInput = {
  testCaseId: string;
  method: string;
  path: string;
  expectedStatus: number;
  actualStatus: number;
  duration: number;
  executionResult: Record<string, unknown>;
  requestBodyPresent: boolean;
  responseBody: unknown;
  failureCategory?: string;
};

export type ApiEvidenceOutput = {
  evidenceIds: string[];
  evidenceDirectory: string;
};

const repoRoot = resolve(__dirname, '../../../..');

function safeRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function sanitizeResponseBody(value: unknown): unknown {
  const record = safeRecord(value);
  if (!record) return value === null ? null : { responseType: typeof value };

  const output: Record<string, unknown> = {};
  for (const key of ['status', 'runtime', 'pid', 'reset', 'seed', 'itemCount', 'newDashboard', 'enabled', 'knownBug', 'bugId', 'expectation', 'expected', 'actual', 'acceptanceExpectation', 'automationStatus', 'reason']) {
    if (key in record) output[key] = record[key];
  }
  if (safeRecord(record.error)) {
    const error = record.error as Record<string, unknown>;
    output.error = { code: error.code, message: error.message };
  }
  if (safeRecord(record.user)) {
    const user = record.user as Record<string, unknown>;
    output.user = { username: user.username, role: user.role };
  }
  if (safeRecord(record.item)) {
    const item = record.item as Record<string, unknown>;
    output.item = { id: item.id, name: item.name, status: item.status };
  }
  if (Array.isArray(record.items)) {
    output.items = record.items.map((item) => {
      const safeItem = safeRecord(item);
      return safeItem ? { id: safeItem.id, name: safeItem.name, status: safeItem.status } : { itemType: typeof item };
    });
  }
  return output;
}

function safePath(path: string): string {
  return path.split('?')[0] || '/';
}

export function writeApiEvidence(input: ApiEvidenceInput): ApiEvidenceOutput {
  const runId = `RUN-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const sanitizedPath = safePath(input.path);
  const evidenceDirectory = join(repoRoot, 'projects', 'test-workflow', 'artifacts', 'api', input.testCaseId, runId);
  mkdirSync(evidenceDirectory, { recursive: true });
  const timestamp = new Date().toISOString();
  const requestEvidenceId = `EVID-${input.testCaseId}-${runId}-REQUEST`;
  const responseEvidenceId = `EVID-${input.testCaseId}-${runId}-RESPONSE`;
  const executionEvidenceId = `EVID-${input.testCaseId}-${runId}-EXECUTION`;
  const evidenceIds = [requestEvidenceId, responseEvidenceId, executionEvidenceId];
  input.executionResult.EvidenceIds = evidenceIds;

  writeFileSync(join(evidenceDirectory, 'request-summary.json'), `${JSON.stringify({
    TestCaseId: input.testCaseId,
    Method: input.method,
    SanitizedPath: sanitizedPath,
    RequestBodyPresent: input.requestBodyPresent,
    CredentialFieldsOmitted: true,
    Timestamp: timestamp,
  }, null, 2)}\n`, 'utf8');

  writeFileSync(join(evidenceDirectory, 'response-summary.json'), `${JSON.stringify({
    TestCaseId: input.testCaseId,
    Method: input.method,
    SanitizedPath: sanitizedPath,
    ExpectedStatus: input.expectedStatus,
    ActualStatus: input.actualStatus,
    Duration: input.duration,
    FailureCategory: input.failureCategory ?? null,
    Response: sanitizeResponseBody(input.responseBody),
    Sanitized: true,
    Timestamp: timestamp,
  }, null, 2)}\n`, 'utf8');

  writeFileSync(join(evidenceDirectory, 'execution-result.json'), `${JSON.stringify(input.executionResult, null, 2)}\n`, 'utf8');

  const artifactPath = relative(repoRoot, evidenceDirectory).replaceAll('\\', '/');
  writeFileSync(join(evidenceDirectory, 'evidence-index.json'), `${JSON.stringify([
    { EvidenceId: requestEvidenceId, TestCaseId: input.testCaseId, Kind: 'ACTUAL', Path: `${artifactPath}/request-summary.json`, Sanitized: true, Source: 'Playwright APIRequestContext' },
    { EvidenceId: responseEvidenceId, TestCaseId: input.testCaseId, Kind: 'ACTUAL', Path: `${artifactPath}/response-summary.json`, Sanitized: true, Source: 'Playwright APIRequestContext' },
    { EvidenceId: executionEvidenceId, TestCaseId: input.testCaseId, Kind: 'REPORT', Path: `${artifactPath}/execution-result.json`, Sanitized: true, Source: 'Playwright APIRequestContext' },
  ], null, 2)}\n`, 'utf8');

  return { evidenceIds, evidenceDirectory };
}
