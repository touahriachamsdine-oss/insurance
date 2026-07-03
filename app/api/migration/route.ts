import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { processDocument, classifyDocument, OCRDocument } from '@/lib/migration/ocr';
import { detectDuplicates } from '@/lib/migration/duplicate-detection';
import { detectConflicts, createReconciliationTicket } from '@/lib/migration/reconciliation';
import { recordCustodyEvent } from '@/lib/migration/chain-of-custody';
import { query } from '@/lib/db';

/**
 * POST /api/migration/process
 *
 * Process a scanned document through the migration pipeline:
 * 1. OCR + classification
 * 2. Duplicate detection
 * 3. Conflict reconciliation
 * 4. Chain-of-custody logging
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { document, batchId, existingRecords } = body;

    if (!document) {
      return NextResponse.json({ error: 'Document data is required' }, { status: 400 });
    }

    // Step 1: OCR Processing
    const ocrResult = await processDocument(document as OCRDocument);
    const classification = await classifyDocument(document as OCRDocument, ocrResult);

    // Step 2: Duplicate Detection
    let duplicateResult = null;
    if (existingRecords && existingRecords.length > 0) {
      duplicateResult = await detectDuplicates(
        ocrResult.fields.reduce((acc, f) => ({ ...acc, [f.name]: f.value }), {}),
        existingRecords
      );
    }

    // Step 3: Check for conflicts if duplicate found
    let reconciliationTicket = null;
    if (duplicateResult?.bestMatch) {
      const conflicts = await detectConflicts(
        ocrResult.fields.reduce((acc, f) => ({ ...acc, [f.name]: f.value }), {}),
        duplicateResult.bestMatch.existingRecord
      );
      if (conflicts.length > 0) {
        reconciliationTicket = await createReconciliationTicket(
          ocrResult.fields.reduce((acc, f) => ({ ...acc, [f.name]: f.value }), {}),
          duplicateResult.bestMatch.existingRecord,
          conflicts
        );
      }
    }

    // Step 4: Record custody event
    const custodyEvent = await recordCustodyEvent({
      documentId: document.id,
      documentType: classification.category,
      actorId: user.id,
      actorName: user.full_name_en || user.full_name_ar || user.email,
      branchId: user.branch_id || 'unknown',
      branchName: user.branch_name || 'Unknown Branch',
      action: 'scanned',
      metadata: {
        batchId,
        classification: classification.category,
        confidence: ocrResult.overallConfidence,
        needsHumanReview: ocrResult.needsHumanReview,
      },
    });

    return NextResponse.json({
      success: true,
      ocrResult,
      classification,
      duplicateResult,
      reconciliationTicket,
      custodyEvent,
    });
  } catch (error: any) {
    console.error('[Migration API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/migration/progress?companyId=xxx
 *
 * Get migration progress metrics per branch
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || user.company_id;

    // In production, query from database
    const progress = await query(
      `SELECT 
         COUNT(*) as total_documents,
         SUM(CASE WHEN status = 'digitized' THEN 1 ELSE 0 END) as digitized,
         SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified,
         SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
       FROM migration_documents
       WHERE company_id = $1`,
      [companyId]
    );

    return NextResponse.json({
      success: true,
      progress: progress[0] || { total_documents: 0, digitized: 0, verified: 0, rejected: 0 },
    });
  } catch (error: any) {
    console.error('[Migration API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}