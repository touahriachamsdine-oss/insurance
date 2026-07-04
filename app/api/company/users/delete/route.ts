import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { query, queryOne } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'company_admin' && currentUser.role !== 'company_agent')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ message: 'UserId is required' }, { status: 400 });
    }

    // Verify client belongs to the same company
    const targetUser = await queryOne(
      'SELECT company_id FROM public.users WHERE id = $1',
      [userId]
    );

    if (!targetUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (targetUser.company_id !== currentUser.company_id) {
      return NextResponse.json({ message: 'Unauthorized - user belongs to different company' }, { status: 403 });
    }

    // Check if user has associated contracts
    const targetContracts = await queryOne(
      'SELECT id FROM public.contracts WHERE client_id = $1 LIMIT 1',
      [userId]
    );

    if (targetContracts) {
      return NextResponse.json({
        message: 'Cannot delete client with existing insurance contracts. Delete or transfer policies first.'
      }, { status: 400 });
    }

    // Check if user has associated claims
    const targetClaims = await queryOne(
      'SELECT cl.id FROM public.claims cl JOIN public.contracts co ON cl.contract_id = co.id WHERE co.client_id = $1 LIMIT 1',
      [userId]
    );

    if (targetClaims) {
      return NextResponse.json({
        message: 'Cannot delete client with existing claims on record.'
      }, { status: 400 });
    }

    // Safe to delete
    await query('DELETE FROM public.users WHERE id = $1', [userId]);

    return NextResponse.json({
      success: true,
      message: 'User account deleted successfully'
    });

  } catch (err: any) {
    console.error('Error deleting user account:', err);
    return NextResponse.json(
      { message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
