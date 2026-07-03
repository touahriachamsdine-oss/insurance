/**
 * Regulatory Integration Layer
 *
 * CNAS/CASNOS integration, UAR reporting export, regulatory solvency monitoring.
 */

export interface UARReport {
  id: string;
  companyId: string;
  period: string;
  reportType: 'quarterly' | 'annual' | 'ad_hoc';
  generatedAt: string;
  metrics: UARMetrics;
  status: 'draft' | 'submitted' | 'acknowledged';
}

export interface UARMetrics {
  grossWrittenPremium: number;
  netWrittenPremium: number;
  earnedPremium: number;
  incurredClaims: number;
  lossRatio: number;
  expenseRatio: number;
  combinedRatio: number;
  technicalReserves: number;
  solvencyMargin: number;
  minimumCapitalRequirement: number;
}

export interface SolvencyMonitor {
  currentRatio: number;
  minimumRequired: number;
  status: 'compliant' | 'warning' | 'breach';
  capitalAvailable: number;
  capitalRequired: number;
  lastCalculated: string;
}

/**
 * Generate UAR regulatory filing report
 */
export async function generateUARReport(
  companyId: string,
  period: string,
  reportType: UARReport['reportType']
): Promise<UARReport> {
  console.log(`[Regulator] Generating UAR ${reportType} report for company ${companyId}, period ${period}`);

  // In production, aggregate from underwriting and claims data
  const metrics: UARMetrics = {
    grossWrittenPremium: 0,
    netWrittenPremium: 0,
    earnedPremium: 0,
    incurredClaims: 0,
    lossRatio: 0,
    expenseRatio: 0,
    combinedRatio: 0,
    technicalReserves: 0,
    solvencyMargin: 0,
    minimumCapitalRequirement: 150000000, // 150M DZD minimum per Algerian regulation
  };

  return {
    id: `UAR-${companyId}-${period}-${Date.now()}`,
    companyId,
    period,
    reportType,
    generatedAt: new Date().toISOString(),
    metrics,
    status: 'draft',
  };
}

/**
 * Export UAR report in the standardized XML format required by Algerian regulator
 */
export async function exportUARXML(report: UARReport): Promise<string> {
  // In production, generate compliant XML per UAR schema
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<UARReport>
  <CompanyID>${report.companyId}</CompanyID>
  <Period>${report.period}</Period>
  <Type>${report.reportType}</Type>
  <GeneratedAt>${report.generatedAt}</GeneratedAt>
  <Metrics>
    <GrossWrittenPremium>${report.metrics.grossWrittenPremium}</GrossWrittenPremium>
    <NetWrittenPremium>${report.metrics.netWrittenPremium}</NetWrittenPremium>
    <LossRatio>${report.metrics.lossRatio}</LossRatio>
    <SolvencyMargin>${report.metrics.solvencyMargin}</SolvencyMargin>
  </Metrics>
</UARReport>`;

  return xml;
}

/**
 * Calculate solvency ratio per Ordonnance 95-07 framework
 */
export async function calculateSolvencyRatio(
  companyId: string
): Promise<SolvencyMonitor> {
  // In production, query actual financial data
  const capitalAvailable = 200000000; // 200M DZD
  const capitalRequired = 150000000;   // 150M DZD (minimum)
  const currentRatio = capitalAvailable / capitalRequired;

  let status: SolvencyMonitor['status'];
  if (currentRatio >= 1.2) {
    status = 'compliant';
  } else if (currentRatio >= 1.0) {
    status = 'warning';
  } else {
    status = 'breach';
  }

  return {
    currentRatio: Math.round(currentRatio * 100) / 100,
    minimumRequired: 1.0,
    status,
    capitalAvailable,
    capitalRequired,
    lastCalculated: new Date().toISOString(),
  };
}

/**
 * CNAS/CASNOS cross-verification for health insurance claims
 */
export async function verifySocialInsurance(
  nin: string,
  fullName: string
): Promise<{
  verified: boolean;
  affiliationNumber?: string;
  coverageType?: string;
  message: string;
}> {
  console.log(`[Regulator] Verifying social insurance for NIN: ${nin}`);
  // In production, call CNAS/CASNOS API
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    verified: true,
    affiliationNumber: `CNAS-${nin.slice(0, 8)}`,
    coverageType: 'social_security',
    message: 'Affiliation verified successfully',
  };
}

/**
 * Get regulatory compliance status summary
 */
export async function getComplianceSummary(
  companyId: string
): Promise<{
  solvency: SolvencyMonitor;
  lastUARSubmission: string | null;
  pendingFilings: string[];
  warnings: string[];
}> {
  const solvency = await calculateSolvencyRatio(companyId);

  return {
    solvency,
    lastUARSubmission: null,
    pendingFilings: ['Q1 2026 Quarterly Report'],
    warnings: solvency.status === 'warning' ? ['Solvency ratio approaching minimum threshold'] : [],
  };
}