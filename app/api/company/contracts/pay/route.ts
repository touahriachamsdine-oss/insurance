import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { queryOne } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'company_admin' && user.role !== 'company_agent')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { contractId } = await request.json();
    if (!contractId) {
      return NextResponse.json({ message: 'Missing contractId' }, { status: 400 });
    }

    const contract = await queryOne(
      'SELECT id, company_id, status FROM public.contracts WHERE id = $1',
      [contractId]
    );

    if (!contract) {
      return NextResponse.json({ message: 'Contract not found' }, { status: 404 });
    }

    if (contract.company_id !== user.company_id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (contract.status !== 'pending') {
      return NextResponse.json({ message: 'Contract is not pending payment' }, { status: 400 });
    }

    const updatedContract = await queryOne(
      `UPDATE public.contracts 
       SET status = 'active', updated_at = NOW() 
       WHERE id = $1 
       RETURNING *`,
      [contractId]
    );

    return NextResponse.json({
      success: true,
      message: 'Payment completed and contract activated',
      contract: updatedContract
    });
  } catch (err: any) {
    console.error('Error activating contract:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
