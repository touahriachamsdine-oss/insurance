/**
 * Predictive Renewal Churn Model
 *
 * Flags clients statistically likely to not renew, prioritizing broker outreach.
 */

export interface ChurnPredictionInput {
  clientId: string;
  clientName: string;
  policies: PolicyRecord[];
  claimsHistory: ClaimRecord[];
  paymentHistory: PaymentRecord[];
  engagementMetrics: EngagementMetrics;
  clientTenureMonths: number;
  wilaya: string;
}

export interface PolicyRecord {
  id: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  premium: number;
  autoRenew: boolean;
}

export interface ClaimRecord {
  id: string;
  date: string;
  type: string;
  amount: number;
  status: string;
  satisfactionScore?: number;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  status: 'on_time' | 'late' | 'missed';
  method: string;
}

export interface EngagementMetrics {
  lastLoginDate: string | null;
  portalVisitsLast90Days: number;
  documentsUploaded: number;
  supportTicketsOpened: number;
  whatsAppInteractions: number;
  emailOpenRate: number;
}

export interface ChurnPrediction {
  clientId: string;
  churnProbability: number;     // 0-1
  riskCategory: 'low' | 'medium' | 'high' | 'critical';
  keyFactors: ChurnFactor[];
  recommendedActions: string[];
  optimalContactDate: string;
  suggestedDiscount?: number;
}

export interface ChurnFactor {
  name: string;
  impact: number;               // 0-1 (higher = more impact on churn)
  description: string;
  actionable: boolean;
}

/**
 * Predict churn probability for a client
 */
export async function predictChurn(
  input: ChurnPredictionInput
): Promise<ChurnPrediction> {
  const factors: ChurnFactor[] = [];
  let churnScore = 0;

  // Factor 1: Policy auto-renewal status
  const nonAutoRenewPolicies = input.policies.filter((p) => !p.autoRenew);
  if (nonAutoRenewPolicies.length > 0) {
    const impact = nonAutoRenewPolicies.length * 0.1;
    factors.push({
      name: 'auto_renewal_disabled',
      impact: Math.min(impact, 0.3),
      description: `${nonAutoRenewPolicies.length} policy(ies) without auto-renewal enabled`,
      actionable: true,
    });
    churnScore += impact;
  }

  // Factor 2: Claims satisfaction
  const lowSatisfactionClaims = input.claimsHistory.filter(
    (c) => c.satisfactionScore !== undefined && c.satisfactionScore < 3
  );
  if (lowSatisfactionClaims.length > 0) {
    const impact = lowSatisfactionClaims.length * 0.15;
    factors.push({
      name: 'low_claims_satisfaction',
      impact: Math.min(impact, 0.4),
      description: `${lowSatisfactionClaims.length} claim(s) with low satisfaction score`,
      actionable: true,
    });
    churnScore += impact;
  }

  // Factor 3: Payment issues
  const latePayments = input.paymentHistory.filter((p) => p.status === 'late');
  const missedPayments = input.paymentHistory.filter((p) => p.status === 'missed');
  if (missedPayments.length > 0 || latePayments.length > 0) {
    const impact = missedPayments.length * 0.2 + latePayments.length * 0.08;
    factors.push({
      name: 'payment_issues',
      impact: Math.min(impact, 0.35),
      description: `${missedPayments.length} missed, ${latePayments.length} late payment(s)`,
      actionable: true,
    });
    churnScore += impact;
  }

  // Factor 4: Low engagement
  if (input.engagementMetrics.portalVisitsLast90Days < 2) {
    factors.push({
      name: 'low_portal_engagement',
      impact: 0.15,
      description: 'Less than 2 portal visits in the last 90 days',
      actionable: true,
    });
    churnScore += 0.15;
  }

  if (input.engagementMetrics.lastLoginDate) {
    const daysSinceLogin = daysBetween(input.engagementMetrics.lastLoginDate, new Date().toISOString());
    if (daysSinceLogin > 90) {
      factors.push({
        name: 'inactive_user',
        impact: 0.1,
        description: `Last login was ${daysSinceLogin} days ago`,
        actionable: true,
      });
      churnScore += 0.1;
    }
  }

  // Factor 5: Client tenure (newer clients are more likely to churn)
  if (input.clientTenureMonths < 12) {
    const impact = (12 - input.clientTenureMonths) * 0.01;
    factors.push({
      name: 'short_tenure',
      impact: Math.min(impact, 0.1),
      description: `Client for only ${input.clientTenureMonths} months`,
      actionable: false,
    });
    churnScore += impact;
  }

  // Factor 6: Policy count (single-policy clients churn more)
  if (input.policies.length === 1) {
    factors.push({
      name: 'single_policy',
      impact: 0.08,
      description: 'Client has only one policy',
      actionable: true,
    });
    churnScore += 0.08;
  }

  // Factor 7: Support tickets
  if (input.engagementMetrics.supportTicketsOpened > 3) {
    const impact = Math.min(input.engagementMetrics.supportTicketsOpened * 0.05, 0.2);
    factors.push({
      name: 'high_support_tickets',
      impact,
      description: `${input.engagementMetrics.supportTicketsOpened} support tickets opened`,
      actionable: true,
    });
    churnScore += impact;
  }

  // Normalize churn score to 0-1
  churnScore = Math.min(churnScore, 1);

  // Determine risk category
  let riskCategory: ChurnPrediction['riskCategory'];
  if (churnScore < 0.2) {
    riskCategory = 'low';
  } else if (churnScore < 0.4) {
    riskCategory = 'medium';
  } else if (churnScore < 0.6) {
    riskCategory = 'high';
  } else {
    riskCategory = 'critical';
  }

  // Generate recommended actions
  const recommendedActions = generateChurnActions(factors, churnScore);

  // Calculate optimal contact date (within next 7 days for high-risk)
  const optimalContactDate = new Date();
  if (churnScore >= 0.4) {
    optimalContactDate.setDate(optimalContactDate.getDate() + 2);
  } else {
    optimalContactDate.setDate(optimalContactDate.getDate() + 7);
  }

  // Suggest discount for high-risk clients
  let suggestedDiscount: number | undefined;
  if (churnScore >= 0.5) {
    suggestedDiscount = churnScore >= 0.7 ? 15 : 10;
  }

  return {
    clientId: input.clientId,
    churnProbability: Math.round(churnScore * 100) / 100,
    riskCategory,
    keyFactors: factors.sort((a, b) => b.impact - a.impact),
    recommendedActions,
    optimalContactDate: optimalContactDate.toISOString().split('T')[0],
    suggestedDiscount,
  };
}

/**
 * Generate recommended actions based on churn factors
 */
function generateChurnActions(
  factors: ChurnFactor[],
  churnScore: number
): string[] {
  const actions: string[] = [];

  if (churnScore >= 0.4) {
    actions.push('Priority broker outreach - contact client within 48 hours');
  }

  for (const factor of factors) {
    switch (factor.name) {
      case 'auto_renewal_disabled':
        actions.push('Offer incentive to enable auto-renewal (e.g., 5% discount)');
        break;
      case 'low_claims_satisfaction':
        actions.push('Follow up on claim experience and offer personalized support');
        break;
      case 'payment_issues':
        actions.push('Review payment method and offer flexible payment plan');
        break;
      case 'low_portal_engagement':
      case 'inactive_user':
        actions.push('Send re-engagement campaign via WhatsApp/SMS with personalized offer');
        break;
      case 'single_policy':
        actions.push('Cross-sell opportunity: present bundled policy options');
        break;
      case 'high_support_tickets':
        actions.push('Schedule account review call to address underlying issues');
        break;
    }
  }

  if (actions.length === 0) {
    actions.push('Client appears stable - standard renewal process');
  }

  return actions;
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Batch predict churn for multiple clients
 */
export async function batchPredictChurn(
  clients: ChurnPredictionInput[]
): Promise<ChurnPrediction[]> {
  const predictions = await Promise.all(
    clients.map((client) => predictChurn(client))
  );

  return predictions.sort(
    (a, b) => b.churnProbability - a.churnProbability
  );
}

/**
 * Get churn risk distribution across a portfolio
 */
export async function getChurnDistribution(
  predictions: ChurnPrediction[]
): Promise<{
  low: number;
  medium: number;
  high: number;
  critical: number;
  atRiskTotal: number;
  atRiskPercent: number;
}> {
  const low = predictions.filter((p) => p.riskCategory === 'low').length;
  const medium = predictions.filter((p) => p.riskCategory === 'medium').length;
  const high = predictions.filter((p) => p.riskCategory === 'high').length;
  const critical = predictions.filter((p) => p.riskCategory === 'critical').length;
  const atRiskTotal = high + critical;

  return {
    low,
    medium,
    high,
    critical,
    atRiskTotal,
    atRiskPercent: predictions.length > 0
      ? Math.round((atRiskTotal / predictions.length) * 100)
      : 0,
  };
}