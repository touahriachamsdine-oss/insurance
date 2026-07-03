import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { getClient } from '@/lib/db';

export async function POST(request: Request) {
  const dbClient = await getClient();
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { userId, isActive } = await request.json();
    if (!userId || typeof isActive !== 'boolean') {
      return NextResponse.json({ message: 'User ID and isActive status are required' }, { status: 400 });
    }

    await dbClient.query('BEGIN');

    // Update public.users
    await dbClient.query(
      `UPDATE public.users
       SET is_active = $1, updated_at = NOW()
       WHERE id = $2`,
      [isActive, userId]
    );

    await dbClient.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'User status updated successfully'
    });
  } catch (err: any) {
    await dbClient.query('ROLLBACK');
    console.error('Error toggling user status:', err);
    return NextResponse.json(
      { message: err.message || 'Internal server error' },
      { status: 500 }
    );
  } finally {
    dbClient.release();
  }
}
