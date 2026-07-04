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
    const { userId, isActive } = body;

    if (!userId || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { message: 'UserId and isActive boolean are required' },
        { status: 400 }
      );
    }

    // Verify client belongs to the same company
    const targetUser = await queryOne(
      'SELECT company_id, role FROM public.users WHERE id = $1',
      [userId]
    );

    if (!targetUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (targetUser.company_id !== currentUser.company_id) {
      return NextResponse.json({ message: 'Unauthorized - user belongs to different company' }, { status: 403 });
    }

    if (targetUser.role !== 'client') {
      return NextResponse.json({ message: 'Only client status can be modified' }, { status: 400 });
    }

    // Update active status
    await query(
      'UPDATE public.users SET is_active = $1 WHERE id = $2',
      [isActive, userId]
    );

    return NextResponse.json({
      success: true,
      message: `User status updated to ${isActive ? 'active' : 'inactive'} successfully`
    });

  } catch (err: any) {
    console.error('Error toggling user active status:', err);
    return NextResponse.json(
      { message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
