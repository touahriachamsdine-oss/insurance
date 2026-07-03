/**
 * AI Risk Scoring Engine
 *
 * Underwrites new applications using historical claims data, geographic risk,
 * and client digital footprint to produce a risk score feeding the actuarial engine.
 */

export interface RiskScoreInput {
  applicantAge?: number;
  vehicleAge?: number;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleValue?: number;
  wilaya: string;
  propertyConstructionType?: string;
  propertyValue?: number;
  claimsHistory: ClaimRecord[];
  coverageType: string;
  coverageAmount: number;
  deductible: number;
  hasTelematics?: boolean;
  telematicsScore?: number;
  creditScore?: number;
  yearsInsured?: number;
  previousInsurer?: string;
  businessType?: string;
  employeesCount?: number;
}

export interface ClaimRecord {
  id: string;
  date: string;
  type: string;
  amount: number;
  status: string;
  fault?: 'at_fault' | 'not_at_fault' | 'unknown';
}

export interface RiskScoreResult {
  overallScore: number;        // 0-100 (higher = riskier)
  riskCategory: 'low' | 'medium' | 'high' | 'very_high';
  pricingMultiplier: number;   // Multiplier for base premium
  factors: RiskFactor[];
  recommendations: string[];
  confidence: number;
}

export interface RiskFactor {
  name: string;
  impact: number;              // -1 to 1 (negative = reduces risk, positive = increases)
  description: string;
  weight: number;
}

/**
 * Geographic risk data for Algerian wilayas
 */
const WILAYA_RISK_MAP: Record<string, { risk: number; flood: number; theft: number; label: string }> = {
  '16': { risk: 0.65, flood: 0.3, theft: 0.7, label: 'Alger' },
  '31': { risk: 0.55, flood: 0.2, theft: 0.5, label: 'Oran' },
  '23': { risk: 0.50, flood: 0.4, theft: 0.4, label: 'Annaba' },
  '13': { risk: 0.45, flood: 0.5, theft: 0.3, label: 'Tlemcen' },
  '6':  { risk: 0.40, flood: 0.6, theft: 0.2, label: 'Béjaïa' },
  '19': { risk: 0.35, flood: 0.7, theft: 0.2, label: 'Sétif' },
  '25': { risk: 0.30, flood: 0.1, theft: 0.3, label: 'Constantine' },
  '1':  { risk: 0.25, flood: 0.1, theft: 0.1, label: 'Adrar' },
  '58': { risk: 0.20, flood: 0.05, theft: 0.1, label: 'In Salah' },
};

const DEFAULT_WILAYA_RISK = { risk: 0.4, flood: 0.3, theft: 0.3, label: 'Unknown' };

/**
 * Calculate risk score for an insurance application
 */
export async function calculateRiskScore(input: RiskScoreInput): Promise<RiskScoreResult> {
  const factors: RiskFactor[] = [];
  let totalScore = 50; // Base score

  // 1. Geographic risk
  const geoRisk = WILAYA_RISK_MAP[input.wilaya] || DEFAULT_WILAYA_RISK;
  factors.push({
    name: 'geographic_risk',
    impact: (geoRisk.risk - 0.4) * 2,
    description: `Wilaya ${input.wilaya} (${geoRisk.label}): ${geoRisk.risk > 0.4 ? 'above' : 'below'} average risk`,
    weight: 0.15,
  });
  totalScore += (geoRisk.risk - 0.4) * 30;

  // 2. Vehicle age risk (for auto insurance)
  if (input.vehicleAge !== undefined) {
    const vehicleAgeImpact = Math.min(input.vehicleAge / 20, 1) * 0.3;
    factors.push({
      name: 'vehicle_age',
      impact: vehicleAgeImpact,
      description: `Vehicle age: ${input.vehicleAge} years`,
      weight: 0.10,
    });
    totalScore += vehicleAgeImpact * 20;
  }

  // 3. Claims history
  if (input.claimsHistory.length > 0) {
    const recentClaims = input.claimsHistory.filter((c) => {
      const claimDate = new Date(c.date);
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      return claimDate >= threeYearsAgo;
    });

    const atFaultClaims = recentClaims.filter((c) => c.fault === 'at_fault');
    const claimsImpact = Math.min(atFaultClaims.length * 0.15, 0.6);

    factors.push({
      name: 'claims_history',
      impact: claimsImpact,
      description: `${atFaultClaims.length} at-fault claims in last 3 years`,
      weight: 0.20,
    });
    totalScore += claimsImpact * 25;
  }

  // 4. Coverage amount vs property/vehicle value
  if (input.coverageAmount > 0 && (input.vehicleValue || input.propertyValue)) {
    const assetValue = input.vehicleValue || input.propertyValue || 0;
    const coverageRatio = input.coverageAmount / assetValue;
    if (coverageRatio > 1.2) {
      factors.push({
        name: 'over_insurance',
        impact: 0.15,
        description: `Coverage (${input.coverageAmount}) exceeds asset value (${assetValue}) by ${Math.round((coverageRatio - 1) * 100)}%`,
        weight: 0.08,
      });
      totalScore += 10;
    }
  }

  // 5. Deductible impact (higher deductible = lower risk)
  if (input.deductible > 0 && input.coverageAmount > 0) {
    const deductibleRatio = input.deductible / input.coverageAmount;
    if (deductibleRatio > 0.1) {
      factors.push({
        name: 'high_deductible',
        impact: -0.1,
        description: `High deductible (${Math.round(deductibleRatio * 100)}% of coverage)`,
        weight: 0.05,
      });
      totalScore -= 8;
    }
  }

  // 6. Telematics data (if available)
  if (input.hasTelematics && input.telematicsScore !== undefined) {
    const telematicsImpact = (50 - input.telematicsScore) / 100;
    factors.push({
      name: 'telematics',
      impact: telematicsImpact,
      description: `Telematics score: ${input.telematicsScore}/100`,
      weight: 0.12,
    });
    totalScore += telematicsImpact * 15;
  }

  // 7. Years insured (loyalty)
  if (input.yearsInsured !== undefined) {
    const loyaltyImpact = Math.min(input.yearsInsured * -0.02, -0.1);
    factors.push({
      name: 'insurance_tenure',
      impact: loyaltyImpact,
      description: `${input.yearsInsured} years insured`,
      weight: 0.08,
    });
    totalScore += loyaltyImpact * 15;
  }

  // 8. Property construction type
  if (input.propertyConstructionType) {
    const constructionRisk: Record<string, number> = {
      concrete: -0.05,
      brick: 0,
      wood: 0.15,
      mixed: 0.05,
      other: 0.1,
    };
    const constructionImpact = constructionRisk[input.propertyConstructionType] || 0.05;
    factors.push({
      name: 'construction_type',
      impact: constructionImpact,
      description: `Construction type: ${input.propertyConstructionType}`,
      weight: 0.07,
    });
    totalScore += constructionImpact * 10;
  }

  // Normalize score to 0-100
  totalScore = Math.max(0, Math.min(100, totalScore));

  // Determine risk category
  let riskCategory: RiskScoreResult['riskCategory'];
  let pricingMultiplier: number;

  if (totalScore < 30) {
    riskCategory = 'low';
    pricingMultiplier = 0.85;
  } else if (totalScore < 50) {
    riskCategory = 'medium';
    pricingMultiplier = 1.0;
  } else if (totalScore < 70) {
    riskCategory = 'high';
    pricingMultiplier = 1.25;
  } else {
    riskCategory = 'very_high';
    pricingMultiplier = 1.5;
  }

  // Generate recommendations
  const recommendations: string[] = [];
  if (totalScore > 50) {
    recommendations.push('Consider requiring a higher deductible to reduce risk exposure');
  }
  if (input.vehicleAge && input.vehicleAge > 10) {
    recommendations.push('Vehicle age exceeds 10 years - consider limited coverage options');
  }
  if (geoRisk.theft > 0.5) {
    recommendations.push('High theft risk wilaya - consider anti-theft device requirement');
  }
  if (geoRisk.flood > 0.5) {
    recommendations.push('High flood risk area - consider flood exclusion or separate flood policy');
  }
  if (input.claimsHistory.filter((c) => c.fault === 'at_fault').length > 2) {
    recommendations.push('Multiple at-fault claims - consider premium surcharge or non-renewal clause');
  }

  return {
    overallScore: Math.round(totalScore),
    riskCategory,
    pricingMultiplier,
    factors,
    recommendations,
    confidence: 0.85,
  };
}

/**
 * Get risk data for a specific wilaya
 */
export function getWilayaRiskData(wilayaCode: string) {
  return WILAYA_RISK_MAP[wilayaCode] || DEFAULT_WILAYA_RISK;
}

/**
 * Get all wilaya risk data
 */
export function getAllWilayaRiskData() {
  return WILAYA_RISK_MAP;
}