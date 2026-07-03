/**
 * SLA & Escalation Engine
 *
 * Every claim/quote has a configurable SLA clock.
 * Automatic escalation to a supervisor if a stage is overdue.
 */

export interface SLADefinition {
  id: string;
  processType: 'claim' | 'quote' | 'policy_issuance' | 'payment' | 'document_review';
  stage: string;
  maxDurationHours: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  escalationTarget: string; // Role or user ID to escalate to
  notificationTemplate: string;
}

export interface SLAInstance {
  id: string;
  slaDefinitionId: string;
  entityId: string;        // Claim ID, Quote ID, etc.
  entityType: string;
  stage: string;
  startedAt: string;
  deadline: string;
  status: 'in_progress' | 'breached' | 'completed' | 'escalated';
  escalatedTo?: string;
  escalatedAt?: string;
  completedAt?: string;
}

export interface SLAAlert {
  slaId: string;
  entityId: string;
  entityType: string;
  stage: string;
  urgency: 'warning' | 'breach' | 'escalated';
  message: string;
  timeRemaining: number; // Minutes
}

const DEFAULT_SLA_DEFINITIONS: SLADefinition[] = [
  // Claims
  { id: 'sla-claim-submit', processType: 'claim', stage: 'submitted', maxDurationHours: 2, priority: 'high', escalationTarget: 'claims_manager', notificationTemplate: 'claim_submitted' },
  { id: 'sla-claim-assign', processType: 'claim', stage: 'assign_assessor', maxDurationHours: 4, priority: 'high', escalationTarget: 'claims_manager', notificationTemplate: 'claim_assign' },
  { id: 'sla-claim-review', processType: 'claim', stage: 'under_review', maxDurationHours: 48, priority: 'medium', escalationTarget: 'claims_director', notificationTemplate: 'claim_review' },
  { id: 'sla-claim-docs', processType: 'claim', stage: 'awaiting_documents', maxDurationHours: 72, priority: 'medium', escalationTarget: 'claims_manager', notificationTemplate: 'claim_docs' },
  { id: 'sla-claim-payout', processType: 'claim', stage: 'payout_approved', maxDurationHours: 24, priority: 'high', escalationTarget: 'finance_director', notificationTemplate: 'claim_payout' },

  // Quotes
  { id: 'sla-quote-create', processType: 'quote', stage: 'draft', maxDurationHours: 8, priority: 'medium', escalationTarget: 'underwriting_manager', notificationTemplate: 'quote_draft' },
  { id: 'sla-quote-approve', processType: 'quote', stage: 'pending_approval', maxDurationHours: 24, priority: 'high', escalationTarget: 'underwriting_director', notificationTemplate: 'quote_approve' },
];

/**
 * Create an SLA instance for a process stage
 */
export async function createSLAInstance(
  slaDefinition: SLADefinition,
  entityId: string,
  entityType: string
): Promise<SLAInstance> {
  const now = new Date();
  const deadline = new Date(now.getTime() + slaDefinition.maxDurationHours * 60 * 60 * 1000);

  return {
    id: `SLA-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    slaDefinitionId: slaDefinition.id,
    entityId,
    entityType,
    stage: slaDefinition.stage,
    startedAt: now.toISOString(),
    deadline: deadline.toISOString(),
    status: 'in_progress',
  };
}

/**
 * Check SLA status for a set of instances
 */
export async function checkSLAStatus(
  instances: SLAInstance[]
): Promise<SLAAlert[]> {
  const alerts: SLAAlert[] = [];
  const now = new Date();

  for (const instance of instances) {
    if (instance.status !== 'in_progress') continue;

    const deadline = new Date(instance.deadline);
    const timeRemaining = Math.round((deadline.getTime() - now.getTime()) / 60000);

    // Warning: 25% time remaining
    const totalDuration = deadline.getTime() - new Date(instance.startedAt).getTime();
    const elapsed = now.getTime() - new Date(instance.startedAt).getTime();
    const elapsedPercent = elapsed / totalDuration;

    if (timeRemaining <= 0) {
      alerts.push({
        slaId: instance.id,
        entityId: instance.entityId,
        entityType: instance.entityType,
        stage: instance.stage,
        urgency: 'breach',
        message: `SLA breached for ${instance.entityType} ${instance.entityId} at stage "${instance.stage}"`,
        timeRemaining: 0,
      });
    } else if (elapsedPercent >= 0.75) {
      alerts.push({
        slaId: instance.id,
        entityId: instance.entityId,
        entityType: instance.entityType,
        stage: instance.stage,
        urgency: 'warning',
        message: `SLA at risk for ${instance.entityType} ${instance.entityId} at stage "${instance.stage}" - ${Math.round(timeRemaining / 60)}h remaining`,
        timeRemaining,
      });
    }
  }

  return alerts;
}

/**
 * Escalate an SLA instance to a supervisor
 */
export async function escalateSLA(
  instance: SLAInstance,
  escalatedTo: string
): Promise<SLAInstance> {
  return {
    ...instance,
    status: 'escalated',
    escalatedTo,
    escalatedAt: new Date().toISOString(),
  };
}

/**
 * Complete an SLA instance
 */
export async function completeSLAInstance(
  instance: SLAInstance
): Promise<SLAInstance> {
  return {
    ...instance,
    status: 'completed',
    completedAt: new Date().toISOString(),
  };
}

/**
 * Get default SLA definitions by process type
 */
export function getSLADefinitions(processType?: string): SLADefinition[] {
  if (processType) {
    return DEFAULT_SLA_DEFINITIONS.filter((d) => d.processType === processType);
  }
  return DEFAULT_SLA_DEFINITIONS;
}

/**
 * Generate a company-wide "at-risk SLA" dashboard summary
 */
export async function generateSLADashboard(
  instances: SLAInstance[]
): Promise<{
  total: number;
  inProgress: number;
  atRisk: number;
  breached: number;
  escalated: number;
  completed: number;
  atRiskInstances: SLAInstance[];
  breachedInstances: SLAInstance[];
}> {
  const alerts = await checkSLAStatus(instances);
  const breachedIds = new Set(alerts.filter((a) => a.urgency === 'breach').map((a) => a.slaId));
  const atRiskIds = new Set(alerts.filter((a) => a.urgency === 'warning').map((a) => a.slaId));

  return {
    total: instances.length,
    inProgress: instances.filter((i) => i.status === 'in_progress' && !breachedIds.has(i.id)).length,
    atRisk: atRiskIds.size,
    breached: breachedIds.size,
    escalated: instances.filter((i) => i.status === 'escalated').length,
    completed: instances.filter((i) => i.status === 'completed').length,
    atRiskInstances: instances.filter((i) => atRiskIds.has(i.id)),
    breachedInstances: instances.filter((i) => breachedIds.has(i.id)),
  };
}