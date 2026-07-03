import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { detectFraudSignals } from '@/lib/ai/fraud-graph';
import { query } from '@/lib/db';

/**
 * POST /api/fraud/detect
 *
 * Run fraud detection on a claim
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { claimDetails } = body;

    if (!claimDetails) {
      return NextResponse.json({ error: 'Claim details are required' }, { status: 400 });
    }

    // Fetch historical claims for comparison
    const historicalClaims = await query(
      `SELECT cl.*, c.client_id, c.contract_number
       FROM public.claims cl
       JOIN public.contracts c ON cl.contract_id = c.id
       WHERE cl.company_id = $1
         AND cl.id != $2
       LIMIT 100`,
      [user.company_id || claimDetails.companyId, claimDetails.id || '']
    );

    const fraudResult = await detectFraudSignals(claimDetails, historicalClaims);

    return NextResponse.json({
      success: true,
      ...fraudResult,
    });
  } catch (error: any) {
    console.error('[Fraud API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}