import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { getClient, queryOne } from '@/lib/db';
import { hashPassword } from '@/lib/auth-utils';
import crypto from 'crypto';

export async function POST(request: Request) {
  const dbClient = await getClient();
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'company_admin' && user.role !== 'company_agent')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      email,
      password,
      fullNameAr,
      fullNameEn,
      nationalId,
      phone,
      wilayaCode,
    } = body;

    if (!email || !password || !fullNameAr || !nationalId) {
      return NextResponse.json(
        { message: 'Email, password, Arabic name, and National ID are required' },
        { status: 400 }
      );
    }

    // Check duplicate email
    const existingEmail = await queryOne(
      'SELECT id FROM public.users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    if (existingEmail) {
      return NextResponse.json(
        { message: 'Email is already registered' },
        { status: 400 }
      );
    }

    // Check duplicate national id
    const existingNationalId = await queryOne(
      'SELECT id FROM public.users WHERE national_id = $1',
      [nationalId]
    );
    if (existingNationalId) {
      return NextResponse.json(
        { message: 'National ID is already registered' },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);
    const userId = crypto.randomUUID();

    await dbClient.query('BEGIN');

    await dbClient.query(
      `INSERT INTO public.users (
        id, email, password_hash, role, is_active, full_name_ar, full_name_en, phone, wilaya_code, national_id, company_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        userId,
        email,
        passwordHash,
        'client',
        true,
        fullNameAr,
        fullNameEn || null,
        phone || null,
        wilayaCode || null,
        nationalId,
        user.company_id,
      ]
    );

    await dbClient.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'User account created successfully',
      user: {
        id: userId,
        email,
        fullNameAr,
        fullNameEn,
        phone,
        wilayaCode,
        nationalId,
      },
    });
  } catch (err: any) {
    await dbClient.query('ROLLBACK');
    console.error('Error in company user creation:', err);
    return NextResponse.json(
      { message: err.message || 'Internal server error' },
      { status: 500 }
    );
  } finally {
    dbClient.release();
  }
}
