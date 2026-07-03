/**
 * Duplicate Detection Engine
 *
 * Matches newly scanned records against existing digital records via fuzzy name/CIN/policy-number
 * matching to prevent double-entry when a client's file was partially migrated before.
 */

export interface DuplicateMatch {
  existingRecordId: string;
  matchType: 'exact' | 'fuzzy_name' | 'fuzzy_cin' | 'fuzzy_policy' | 'partial';
  confidence: number;
  matchedFields: string[];
  existingRecord: Record<string, any>;
  newRecord: Record<string, any>;
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  matches: DuplicateMatch[];
  bestMatch: DuplicateMatch | null;
  requiresManualReview: boolean;
}

/**
 * Normalize Arabic/French text for fuzzy comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\-_]+/g, ' ')
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[ؤ]/g, 'و')
    .replace(/[ئ]/g, 'ي')
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, '')
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity ratio between two strings (0-1)
 */
function similarityRatio(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

/**
 * Check for duplicate records against existing database records
 */
export async function detectDuplicates(
  newRecord: Record<string, any>,
  existingRecords: Record<string, any>[]
): Promise<DuplicateDetectionResult> {
  const matches: DuplicateMatch[] = [];
  const normalizedNewName = normalizeText(newRecord.policyholder_name || newRecord.name || '');
  const normalizedNewCin = normalizeText(newRecord.nin || newRecord.cin || '');
  const normalizedNewPolicy = normalizeText(newRecord.policy_number || '');

  for (const existing of existingRecords) {
    const normalizedExistingName = normalizeText(existing.policyholder_name || existing.name || '');
    const normalizedExistingCin = normalizeText(existing.nin || existing.cin || '');
    const normalizedExistingPolicy = normalizeText(existing.policy_number || '');

    const matchedFields: string[] = [];
    let matchConfidence = 0;
    let matchType: string = 'partial';

    // Exact CIN/NIN match (strongest signal)
    if (normalizedNewCin && normalizedExistingCin && normalizedNewCin === normalizedExistingCin) {
      matchedFields.push('cin');
      matchConfidence += 0.5;
      matchType = 'fuzzy_cin';
    }

    // Fuzzy CIN match
    if (normalizedNewCin && normalizedExistingCin) {
      const cinSimilarity = similarityRatio(normalizedNewCin, normalizedExistingCin);
      if (cinSimilarity > 0.9 && normalizedNewCin !== normalizedExistingCin) {
        matchedFields.push('cin_fuzzy');
        matchConfidence += 0.3;
      }
    }

    // Exact policy number match
    if (normalizedNewPolicy && normalizedExistingPolicy && normalizedNewPolicy === normalizedExistingPolicy) {
      matchedFields.push('policy_number');
      matchConfidence += 0.4;
      matchType = 'fuzzy_policy';
    }

    // Fuzzy name match
    if (normalizedNewName && normalizedExistingName) {
      const nameSimilarity = similarityRatio(normalizedNewName, normalizedExistingName);
      if (nameSimilarity > 0.95) {
        matchedFields.push('name_exact');
        matchConfidence += 0.3;
        if (matchType === 'partial') matchType = 'fuzzy_name';
      } else if (nameSimilarity > 0.8) {
        matchedFields.push('name_fuzzy');
        matchConfidence += 0.15;
      }
    }

    // Vehicle registration match
    const newPlate = normalizeText(newRecord.vehicle_registration || '');
    const existingPlate = normalizeText(existing.vehicle_registration || '');
    if (newPlate && existingPlate && newPlate === existingPlate) {
      matchedFields.push('vehicle_registration');
      matchConfidence += 0.25;
    }

    // Property address match
    const newAddress = normalizeText(newRecord.property_address || '');
    const existingAddress = normalizeText(existing.property_address || '');
    if (newAddress && existingAddress) {
      const addressSimilarity = similarityRatio(newAddress, existingAddress);
      if (addressSimilarity > 0.9) {
        matchedFields.push('address');
        matchConfidence += 0.2;
      }
    }

    // Date range overlap check
    if (newRecord.start_date && existing.start_date && newRecord.end_date && existing.end_date) {
      const newStart = new Date(newRecord.start_date).getTime();
      const newEnd = new Date(newRecord.end_date).getTime();
      const existingStart = new Date(existing.start_date).getTime();
      const existingEnd = new Date(existing.end_date).getTime();

      if (newStart <= existingEnd && newEnd >= existingStart) {
        matchedFields.push('date_overlap');
        matchConfidence += 0.15;
      }
    }

    if (matchedFields.length > 0) {
      matches.push({
        existingRecordId: existing.id,
        matchType: matchType as DuplicateMatch['matchType'],
        confidence: Math.min(matchConfidence, 1),
        matchedFields,
        existingRecord: existing,
        newRecord,
      });
    }
  }

  // Sort by confidence descending
  matches.sort((a, b) => b.confidence - a.confidence);

  const bestMatch = matches[0] || null;
  const isDuplicate = bestMatch !== null && bestMatch.confidence >= 0.4;
  const requiresManualReview = bestMatch !== null && 
    bestMatch.confidence >= 0.3 && bestMatch.confidence < 0.7;

  return {
    isDuplicate,
    matches,
    bestMatch,
    requiresManualReview,
  };
}

/**
 * Check if a scanned document matches an existing digital record
 */
export async function checkForDuplicateScan(
  scannedFields: Record<string, any>,
  existingRecords: Record<string, any>[]
): Promise<DuplicateDetectionResult> {
  return detectDuplicates(scannedFields, existingRecords);
}