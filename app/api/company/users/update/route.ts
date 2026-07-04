import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { query, queryOne } from '@/lib/db';
import { hashPassword } from '@/lib/auth-utils';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'company_admin' && currentUser.role !== 'company_agent')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      userId,
      email,
      fullNameAr,
      fullNameEn,
      phone,
      wilayaCode,
      password
    } = body;

    if (!userId || !email || !fullNameAr) {
      return NextResponse.json(
        { message: 'UserId, email, and Arabic name are required' },
        { status: 400 }
      );
    }

    // Verify client belongs to the same company
    const targetUser = await queryOne(
      'SELECT company_id, email FROM public.users WHERE id = $1',
      [userId]
    );

    if (!targetUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (targetUser.company_id !== currentUser.company_id) {
      return NextResponse.json({ message: 'Unauthorized - user belongs to different company' }, { status: 403 });
    }

    // Check duplicate email (if email is changing)
    if (email.toLowerCase() !== targetUser.email.toLowerCase()) {
      const existingEmail = await queryOne(
        'SELECT id FROM public.users WHERE LOWER(email) = LOWER($1)',
        [email]
      );
      if (existingEmail) {
        return NextResponse.json(
          { message: 'Email is already registered by another user' },
          { status: 400 }
        );
      }
    }

    let updateQuery = `
      UPDATE public.users 
      SET email = $1, full_name_ar = $2, full_name_en = $3, phone = $4, wilaya_code = $5
    `;
    const params = [email, fullNameAr, fullNameEn || null, phone || null, wilayaCode || null, userId];

    if (password) {
      const passwordHash = hashPassword(password);
      updateQuery += `, password_hash = $6 WHERE id = $7`;
      params.push(passwordHash);
    } else {
      updateQuery += ` WHERE id = $6`;
    }

    await query(updateQuery, params);

    return NextResponse.json({
      success: true,
      message: 'User account updated successfully'
    });

  } catch (err: any) {
    console.error('Error updating user account:', err);
    return NextResponse.json(
      { message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
