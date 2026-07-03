/**
 * Legacy Policy Reconciliation Engine
 *
 * Handles version conflict resolution when scanned paper records conflict with existing digital data.
 * Flags reconciliation tickets for admin review rather than silently overwriting.
 * Reconstructs historical claims timelines from scattered paper files.
 */

export interface ReconciliationTicket {
  id: string;
  type: 'field_conflict' | 'duplicate_record' | 'missing_data' | 'claims_timeline_gap';
  status: 'open' | 'in_review' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  conflictingFields: ConflictingField[];
  digitalRecord: Record<string, any>;
  paperRecord: Record<string, any>;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  notes?: string;
}

export interface ConflictingField {
  fieldName: string;
  digitalValue: string;
  paperValue: string;
  selectedValue?: string;
  confidence: number;
}

export interface ClaimsTimelineEntry {
  claimId: string;
  claimNumber: string;
  incidentDate: string;
  status: string;
  amount: number;
  description: string;
  source: 'digital' | 'paper_scanned' | 'reconstructed';
  sourceDocument?: string;
}

/**
 * Detect conflicts between scanned paper data and existing digital records
 */
export async function detectConflicts(
  paperRecord: Record<string, any>,
  digitalRecord: Record<string, any>
): Promise<ConflictingField[]> {
  const conflicts: ConflictingField[] = [];
  const fieldsToCompare = [
    'policyholder_name',
    'nin',
    'policy_number',
    'premium_amount',
    'coverage_amount',
    'start_date',
    'end_date',
    'vehicle_registration',
    'property_address',
    'deductible',
  ];

  for (const field of fieldsToCompare) {
    const paperValue = paperRecord[field];
    const digitalValue = digitalRecord[field];

    if (paperValue && digitalValue && String(paperValue) !== String(digitalValue)) {
      conflicts.push({
        fieldName: field,
        digitalValue: String(digitalValue),
        paperValue: String(paperValue),
        confidence: 0.5, // Default - would be set by OCR confidence in production
      });
    }
  }

  return conflicts;
}

/**
 * Create a reconciliation ticket when conflicts are found
 */
export async function createReconciliationTicket(
  paperRecord: Record<string, any>,
  digitalRecord: Record<string, any>,
  conflicts: ConflictingField[]
): Promise<ReconciliationTicket> {
  const priority = determinePriority(conflicts);
  const description = generateConflictDescription(conflicts);

  const ticket: ReconciliationTicket = {
    id: `RECON-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    type: 'field_conflict',
    status: 'open',
    priority,
    description,
    conflictingFields: conflicts,
    digitalRecord,
    paperRecord,
    createdAt: new Date().toISOString(),
  };

  console.log(`[Reconciliation] Created ticket ${ticket.id} (${priority} priority)`);
  return ticket;
}

/**
 * Determine priority based on the fields that conflict
 */
function determinePriority(conflicts: ConflictingField[]): ReconciliationTicket['priority'] {
  const criticalFields = ['nin', 'policy_number'];
  const highFields = ['premium_amount', 'coverage_amount', 'start_date', 'end_date'];

  const hasCritical = conflicts.some((c) => criticalFields.includes(c.fieldName));
  const hasHigh = conflicts.some((c) => highFields.includes(c.fieldName));

  if (hasCritical) return 'critical';
  if (hasHigh) return 'high';
  if (conflicts.length > 3) return 'medium';
  return 'low';
}

/**
 * Generate a human-readable description of the conflicts
 */
function generateConflictDescription(conflicts: ConflictingField[]): string {
  const fieldLabels: Record<string, string> = {
    policyholder_name: 'Policyholder Name',
    nin: 'National ID Number (NIN)',
    policy_number: 'Policy Number',
    premium_amount: 'Premium Amount',
    coverage_amount: 'Coverage Amount',
    start_date: 'Start Date',
    end_date: 'End Date',
    vehicle_registration: 'Vehicle Registration',
    property_address: 'Property Address',
    deductible: 'Deductible',
  };

  const conflictDescriptions = conflicts
    .map((c) => `${fieldLabels[c.fieldName] || c.fieldName}: "${c.digitalValue}" (digital) vs "${c.paperValue}" (paper)`)
    .join('; ');

  return `${conflicts.length} field conflict(s) detected: ${conflictDescriptions}`;
}

/**
 * Resolve a reconciliation ticket by selecting which value to keep
 */
export async function resolveReconciliationTicket(
  ticket: ReconciliationTicket,
  resolvedFields: { fieldName: string; selectedValue: string }[],
  resolvedBy: string,
  notes?: string
): Promise<ReconciliationTicket> {
  const updatedConflicts = ticket.conflictingFields.map((cf) => {
    const resolved = resolvedFields.find((rf) => rf.fieldName === cf.fieldName);
    if (resolved) {
      return {
        ...cf,
        selectedValue: resolved.selectedValue,
      };
    }
    return cf;
  });

  return {
    ...ticket,
    status: 'resolved',
    conflictingFields: updatedConflicts,
    resolvedAt: new Date().toISOString(),
    resolvedBy,
    notes,
  };
}

/**
 * Reconstruct a client's claims history from scattered paper files across years/branches
 */
export async function reconstructClaimsTimeline(
  paperClaims: ClaimsTimelineEntry[],
  digitalClaims: ClaimsTimelineEntry[]
): Promise<ClaimsTimelineEntry[]> {
  const allClaims = [...digitalClaims, ...paperClaims];

  // Deduplicate by claim number
  const claimMap = new Map<string, ClaimsTimelineEntry>();
  for (const claim of allClaims) {
    const key = claim.claimNumber;
    if (!claimMap.has(key)) {
      claimMap.set(key, claim);
    } else {
      // Prefer digital record if available, otherwise keep the one with more data
      const existing = claimMap.get(key)!;
      if (claim.source === 'digital' && existing.source !== 'digital') {
        claimMap.set(key, claim);
      }
    }
  }

  // Sort by incident date
  return Array.from(claimMap.values()).sort(
    (a, b) => new Date(a.incidentDate).getTime() - new Date(b.incidentDate).getTime()
  );
}

/**
 * Backfill historical claims from scanned paper documents into a continuous timeline
 */
export async function backfillHistoricalClaims(
  clientId: string,
  paperClaims: ClaimsTimelineEntry[]
): Promise<{
  backfilled: number;
  duplicates: number;
  timeline: ClaimsTimelineEntry[];
}> {
  // In production, this would query the database for existing digital claims
  const digitalClaims: ClaimsTimelineEntry[] = [];

  const timeline = await reconstructClaimsTimeline(paperClaims, digitalClaims);

  const existingClaimNumbers = new Set(digitalClaims.map((c) => c.claimNumber));
  const backfilled = paperClaims.filter((c) => !existingClaimNumbers.has(c.claimNumber)).length;
  const duplicates = paperClaims.length - backfilled;

  return {
    backfilled,
    duplicates,
    timeline,
  };
}