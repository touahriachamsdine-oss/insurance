import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = await request.json();
    if (!companyId) {
      return NextResponse.json({ message: 'Company ID is required' }, { status: 400 });
    }

    // Update the company
    await query(
      `UPDATE public.companies
       SET is_active = true, approved_by = $1, approved_at = NOW()
       WHERE id = $2`,
      [user.id, companyId]
    );

    return NextResponse.json({
      success: true,
      message: 'Company approved successfully'
    });
  } catch (err: any) {
    console.error('Error approving company:', err);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
