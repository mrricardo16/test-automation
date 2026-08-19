import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function createAgentAcceptanceProcedure() {
  return {
    status: 'BLOCKED',
    reason: 'MissingAgentInvocationCapability',
    procedureStatus: 'READY',
    executionInstructions: [
      '准备 Synthetic Source Contract 和独立受控输出目录。',
      '实际调用 dev-test-handoff，保存 As-Built 和 Test Handoff artifacts。',
      '实际调用 test-execution，使用 Handoff 只读 Expected 生成 Coverage/TestCase/Execution/Feedback。',
      '实际调用 whitebox-test-execution，保存 White-box Baseline、Coverage、Execution 和 Regression artifacts。',
    ],
    acceptanceChecklist: [
      '实际调用 dev-test-handoff',
      '实际调用 test-execution',
      '实际调用 whitebox-test-execution',
      '验证 Artifact provenance、TestCaseId、ExpectedBasis、GateStatus 和 EvidenceIds',
      '验证只关闭本轮拥有的 Runtime PID',
    ],
    expectedArtifacts: ['As-Built', 'Test Handoff', 'Coverage Matrix', 'TestCase', 'Execution Evidence', 'Feedback', 'White-box Baseline', 'Regression Report'],
    validationCommand: 'node scripts/platform/validate-agent-acceptance-procedure.mjs && python skills/<skill>/scripts/validate_contract.py <controlled-artifact-root>',
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(createAgentAcceptanceProcedure(), null, 2)}\n`);
}
