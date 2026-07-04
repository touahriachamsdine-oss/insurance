import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { queryOne, query } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'client') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      contractId,
      incidentDate,
      description,
      claimedAmount,
      documents // Array of files { name, size, type, url, uploadedAt }
    } = body;

    if (!contractId || !incidentDate || !description || !claimedAmount) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Fetch the contract to get company_id and type
    const contract = await queryOne(
      'SELECT company_id, type FROM public.contracts WHERE id = $1 AND client_id = $2',
      [contractId, user.id]
    );

    if (!contract) {
      return NextResponse.json({ message: 'Active contract not found' }, { status: 404 });
    }

    // Generate unique claim number: CLM-[DATE]-[RANDOM_HEX]
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
    const claimNumber = `CLM-${dateStr}-${rand}`;

    const newClaim = await queryOne(
      `INSERT INTO public.claims (
         claim_number, contract_id, client_id, company_id, type,
         incident_date, description, claimed_amount, status, documents,
         submitted_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING *`,
      [
        claimNumber,
        contractId,
        user.id,
        contract.company_id,
        contract.type,
        incidentDate,
        description,
        claimedAmount,
        'pending',
        JSON.stringify(documents || [])
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Claim reported successfully',
      claim: newClaim
    });
  } catch (err: any) {
    console.error('Error submitting claim:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
