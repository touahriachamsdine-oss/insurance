/**
 * Fraud Graph Engine
 *
 * Builds a relationship graph across claimants, repair shops, adjusters, and witnesses
 * to surface fraud rings.
 */

export interface FraudGraphNode {
  id: string;
  type: 'claimant' | 'repair_shop' | 'adjuster' | 'witness' | 'policy' | 'vehicle' | 'phone' | 'address';
  label: string;
  properties: Record<string, any>;
  riskScore: number;
}

export interface FraudGraphEdge {
  sourceId: string;
  targetId: string;
  relationship: string;
  weight: number;
  metadata: Record<string, any>;
}

export interface FraudGraph {
  nodes: FraudGraphNode[];
  edges: FraudGraphEdge[];
}

export interface FraudSignal {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  entities: string[];
  confidence: number;
  timestamp: string;
}

export interface FraudDetectionResult {
  signals: FraudSignal[];
  overallFraudScore: number;
  graph: FraudGraph;
  recommendations: string[];
}

/**
 * Detect fraud signals by cross-referencing claim details against known fraud patterns
 */
export async function detectFraudSignals(
  claimDetails: Record<string, any>,
  historicalClaims: Record<string, any>[]
): Promise<FraudDetectionResult> {
  const signals: FraudSignal[] = [];
  const graph = buildClaimGraph(claimDetails, historicalClaims);

  // Signal 1: Claim filed immediately after policy inception
  if (claimDetails.policyStartDate && claimDetails.incidentDate) {
    const daysSinceInception = daysBetween(claimDetails.policyStartDate, claimDetails.incidentDate);
    if (daysSinceInception <= 7 && daysSinceInception >= 0) {
      signals.push({
        id: `FS-${Date.now()}-001`,
        type: 'early_claim',
        severity: 'high',
        description: `Claim filed ${daysSinceInception} day(s) after policy inception`,
        entities: [claimDetails.claimantId, claimDetails.policyId],
        confidence: 0.85,
        timestamp: new Date().toISOString(),
      });
    } else if (daysSinceInception <= 30) {
      signals.push({
        id: `FS-${Date.now()}-002`,
        type: 'early_claim',
        severity: 'medium',
        description: `Claim filed ${daysSinceInception} day(s) after policy inception`,
        entities: [claimDetails.claimantId, claimDetails.policyId],
        confidence: 0.6,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Signal 2: Repeated claimant across multiple policies
  const claimantClaims = historicalClaims.filter(
    (c) => c.claimantId === claimDetails.claimantId || c.clientId === claimDetails.clientId
  );
  if (claimantClaims.length >= 3) {
    signals.push({
      id: `FS-${Date.now()}-003`,
      type: 'repeat_claimant',
      severity: claimantClaims.length >= 5 ? 'critical' : 'high',
      description: `Claimant has ${claimantClaims.length} previous claims on file`,
      entities: [claimDetails.claimantId],
      confidence: Math.min(0.5 + claimantClaims.length * 0.08, 0.95),
      timestamp: new Date().toISOString(),
    });
  }

  // Signal 3: Same repair shop appears across unrelated claims
  if (claimDetails.repairShopId) {
    const shopClaims = historicalClaims.filter(
      (c) => c.repairShopId === claimDetails.repairShopId && c.clientId !== claimDetails.clientId
    );
    if (shopClaims.length >= 3) {
      signals.push({
        id: `FS-${Date.now()}-004`,
        type: 'repair_shop_cluster',
        severity: shopClaims.length >= 5 ? 'critical' : 'high',
        description: `Repair shop used in ${shopClaims.length} other claims by different claimants`,
        entities: [claimDetails.repairShopId, ...shopClaims.map((c) => c.clientId)],
        confidence: 0.75,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Signal 4: Duplicate photos reused across different claim IDs
  if (claimDetails.photoHashes && claimDetails.photoHashes.length > 0) {
    for (const hash of claimDetails.photoHashes) {
      const matchingClaims = historicalClaims.filter(
        (c) => c.photoHashes?.includes(hash) && c.id !== claimDetails.id
      );
      if (matchingClaims.length > 0) {
        signals.push({
          id: `FS-${Date.now()}-005`,
          type: 'duplicate_photos',
          severity: 'high',
          description: `Photo reused across ${matchingClaims.length + 1} claim(s)`,
          entities: [claimDetails.id, ...matchingClaims.map((c) => c.id)],
          confidence: 0.9,
          timestamp: new Date().toISOString(),
        });
        break;
      }
    }
  }

  // Signal 5: EXIF geolocation inconsistent with claimed incident location
  if (claimDetails.exifLocation && claimDetails.claimedLocation) {
    const distance = calculateDistance(
      claimDetails.exifLocation.lat,
      claimDetails.exifLocation.lng,
      claimDetails.claimedLocation.lat,
      claimDetails.claimedLocation.lng
    );
    if (distance > 50) {
      signals.push({
        id: `FS-${Date.now()}-006`,
        type: 'location_mismatch',
        severity: distance > 100 ? 'critical' : 'high',
        description: `Photo EXIF location is ${Math.round(distance)}km from claimed incident location`,
        entities: [claimDetails.claimantId],
        confidence: 0.88,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Signal 6: Claimant connected to known fraud entities through graph
  const fraudConnections = findFraudConnections(claimDetails, graph);
  if (fraudConnections.length > 0) {
    signals.push({
      id: `FS-${Date.now()}-007`,
      type: 'graph_connection',
      severity: 'critical',
      description: `Claimant connected to ${fraudConnections.length} known fraud-related entities`,
      entities: [claimDetails.claimantId, ...fraudConnections],
      confidence: 0.7,
      timestamp: new Date().toISOString(),
    });
  }

  // Calculate overall fraud score
  const overallFraudScore = calculateOverallFraudScore(signals);

  // Generate recommendations
  const recommendations = generateFraudRecommendations(signals, overallFraudScore);

  return {
    signals,
    overallFraudScore,
    graph,
    recommendations,
  };
}

/**
 * Build a relationship graph from claim data
 */
function buildClaimGraph(
  claimDetails: Record<string, any>,
  historicalClaims: Record<string, any>[]
): FraudGraph {
  const nodes: FraudGraphNode[] = [];
  const edges: FraudGraphEdge[] = [];
  const nodeIds = new Set<string>();

  // Add claimant node
  if (claimDetails.claimantId && !nodeIds.has(claimDetails.claimantId)) {
    nodes.push({
      id: claimDetails.claimantId,
      type: 'claimant',
      label: claimDetails.claimantName || 'Unknown Claimant',
      properties: {},
      riskScore: 0,
    });
    nodeIds.add(claimDetails.claimantId);
  }

  // Add repair shop node
  if (claimDetails.repairShopId && !nodeIds.has(claimDetails.repairShopId)) {
    nodes.push({
      id: claimDetails.repairShopId,
      type: 'repair_shop',
      label: claimDetails.repairShopName || 'Unknown Shop',
      properties: {},
      riskScore: 0,
    });
    nodeIds.add(claimDetails.repairShopId);
  }

  // Add adjuster node
  if (claimDetails.adjusterId && !nodeIds.has(claimDetails.adjusterId)) {
    nodes.push({
      id: claimDetails.adjusterId,
      type: 'adjuster',
      label: claimDetails.adjusterName || 'Unknown Adjuster',
      properties: {},
      riskScore: 0,
    });
    nodeIds.add(claimDetails.adjusterId);
  }

  // Build edges from historical claims
  for (const claim of historicalClaims) {
    if (claim.claimantId && claim.repairShopId) {
      if (!nodeIds.has(claim.repairShopId)) {
        nodes.push({
          id: claim.repairShopId,
          type: 'repair_shop',
          label: claim.repairShopName || 'Unknown Shop',
          properties: {},
          riskScore: 0,
        });
        nodeIds.add(claim.repairShopId);
      }
      edges.push({
        sourceId: claim.claimantId,
        targetId: claim.repairShopId,
        relationship: 'used_repair_shop',
        weight: 1,
        metadata: { claimId: claim.id },
      });
    }
  }

  // Connect current claimant to their repair shop
  if (claimDetails.claimantId && claimDetails.repairShopId) {
    edges.push({
      sourceId: claimDetails.claimantId,
      targetId: claimDetails.repairShopId,
      relationship: 'used_repair_shop',
      weight: 1,
      metadata: { claimId: claimDetails.id },
    });
  }

  return { nodes, edges };
}

/**
 * Find entities connected to known fraud
 */
function findFraudConnections(
  claimDetails: Record<string, any>,
  graph: FraudGraph
): string[] {
  const connections: string[] = [];
  // In production, this would traverse the graph and check against a known fraud entity list
  return connections;
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
 * Calculate approximate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate overall fraud score from signals
 */
function calculateOverallFraudScore(signals: FraudSignal[]): number {
  if (signals.length === 0) return 0;

  const severityWeights = { low: 0.1, medium: 0.3, high: 0.6, critical: 0.9 };
  let totalWeight = 0;
  let weightedSum = 0;

  for (const signal of signals) {
    const weight = severityWeights[signal.severity];
    weightedSum += weight * signal.confidence * 100;
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

/**
 * Generate recommendations based on fraud signals
 */
function generateFraudRecommendations(
  signals: FraudSignal[],
  overallScore: number
): string[] {
  const recommendations: string[] = [];

  if (overallScore > 70) {
    recommendations.push('Flag claim for immediate fraud investigation');
    recommendations.push('Do not approve payment until investigation is complete');
  } else if (overallScore > 40) {
    recommendations.push('Assign to senior adjuster for enhanced review');
    recommendations.push('Request additional documentation (police report, photos, invoices)');
  }

  const criticalSignals = signals.filter((s) => s.severity === 'critical');
  if (criticalSignals.length > 0) {
    recommendations.push('Cross-reference with national fraud database');
    recommendations.push('Notify compliance department for regulatory reporting');
  }

  if (signals.some((s) => s.type === 'duplicate_photos')) {
    recommendations.push('Photo forensics required - check metadata and timestamps');
  }

  if (signals.some((s) => s.type === 'repair_shop_cluster')) {
    recommendations.push('Audit the repair shop for pattern fraud');
  }

  return recommendations;
}