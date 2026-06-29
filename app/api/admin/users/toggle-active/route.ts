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

    // 1. Update public.profiles
    await dbClient.query(
      `UPDATE public.profiles
       SET is_active = $1, updated_at = NOW()
       WHERE id = $2`,
      [isActive, userId]
    );

    // 2. Update auth.users raw_user_meta_data
    await dbClient.query(
      `UPDATE auth.users
       SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{is_active}', to_jsonb($1::boolean))
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
