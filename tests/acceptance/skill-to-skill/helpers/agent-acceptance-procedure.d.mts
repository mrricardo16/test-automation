export interface AgentAcceptanceProcedure {
  status: 'BLOCKED';
  reason: string;
  procedureStatus: 'READY';
  executionInstructions: string[];
  acceptanceChecklist: string[];
  expectedArtifacts: string[];
  validationCommand: string;
}

export function createAgentAcceptanceProcedure(): AgentAcceptanceProcedure;
