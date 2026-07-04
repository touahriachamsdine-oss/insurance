import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { query, queryOne } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'client') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contractId } = body;

    if (!contractId) {
      return NextResponse.json({ message: 'ContractId is required' }, { status: 400 });
    }

    // Verify contract belongs to client and is pending
    const contract = await queryOne(
      'SELECT client_id, status FROM public.contracts WHERE id = $1',
      [contractId]
    );

    if (!contract) {
      return NextResponse.json({ message: 'Contract not found' }, { status: 404 });
    }

    if (contract.client_id !== currentUser.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    if (contract.status !== 'pending') {
      return NextResponse.json({ message: 'Only pending contracts can be cancelled' }, { status: 400 });
    }

    // Delete the contract
    await query('DELETE FROM public.contracts WHERE id = $1', [contractId]);

    return NextResponse.json({
      success: true,
      message: 'Pending contract application cancelled successfully'
    });

  } catch (err: any) {
    console.error('Error cancelling contract:', err);
    return NextResponse.json(
      { message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
