import { createAgentAcceptanceProcedure } from './agent-acceptance-procedure.mjs';

const procedure = createAgentAcceptanceProcedure();
const failures = [];
if (procedure.status !== 'BLOCKED') failures.push('status must be BLOCKED without a stable Skill invocation interface');
if (procedure.reason !== 'MissingAgentInvocationCapability') failures.push('reason must identify missing invocation capability');
if (procedure.procedureStatus !== 'READY') failures.push('procedureStatus must be READY');
if (procedure.executionInstructions.length < 4) failures.push('execution instructions are incomplete');
if (!procedure.acceptanceChecklist.includes('实际调用 dev-test-handoff')) failures.push('checklist does not require actual dev-test-handoff invocation');
if (!procedure.expectedArtifacts.includes('As-Built')) failures.push('expected artifacts do not include As-Built');
if (failures.length > 0) {
  for (const failure of failures) console.error(`PROCEDURE_VALIDATION_FAIL ${failure}`);
  process.exit(1);
}
console.log('PROCEDURE_VALIDATION=PASS');
console.log('AGENT_ACCEPTANCE_STATUS=BLOCKED');
console.log('AGENT_ACCEPTANCE_PROCEDURE=READY');
