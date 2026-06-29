import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getClient, queryOne } from '@/lib/db';
import { hashPassword, signSession } from '@/lib/auth-utils';
import crypto from 'crypto';

const ALLOWED_REGISTER_ROLES = ['client', 'company_admin', 'broker', 'assessor'] as const;
type RegisterRole = typeof ALLOWED_REGISTER_ROLES[number];

export async function POST(request: Request) {
  const dbClient = await getClient();
  try {
    const body = await request.json();
    const {
      email,
      password,
      fullNameAr,
      fullNameEn,
      role = 'client',
      // Client-specific
      nationalId,
      phone,
      wilayaCode,
      // Company-specific
      companyNameAr,
      companyNameEn,
      companyCode,
      licenseNumber,
      headquartersWilaya,
      // Broker-specific
      brokerLicense,
      // Assessor-specific
      assessorLicense,
      assessorSpecialty,
    } = body;

    // ── Common validations ────────────────────────────────────────────────────
    if (!email || !password || !fullNameAr) {
      return NextResponse.json(
        { message: 'Email, password, and Arabic full name are required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_REGISTER_ROLES.includes(role as RegisterRole)) {
      return NextResponse.json(
        { message: 'Invalid registration role. Allowed: client, company_admin, broker, assessor' },
        { status: 400 }
      );
    }

    // Check duplicate email
    const existingUser = await queryOne(
      'SELECT id FROM auth.users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    if (existingUser) {
      return NextResponse.json(
        { message: 'Email is already registered' },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);
    const userId = crypto.randomUUID();

    await dbClient.query('BEGIN');

    // ── CLIENT ────────────────────────────────────────────────────────────────
    if (role === 'client') {
      if (!nationalId) throw new Error('National ID is required for clients');

      const existingProfile = await dbClient.query(
        'SELECT id FROM public.profiles WHERE national_id = $1',
        [nationalId]
      );
      if (existingProfile.rows.length > 0) {
        return NextResponse.json(
          { message: 'National ID is already registered' },
          { status: 400 }
        );
      }

      const metaData = {
        full_name_ar: fullNameAr,
        full_name_en: fullNameEn || null,
        role: 'client',
        national_id: nationalId,
        phone: phone || null,
        wilaya_code: wilayaCode || null,
        is_active: true,
      };

      await dbClient.query(
        `INSERT INTO auth.users (id, email, password_hash, raw_user_meta_data)
         VALUES ($1, $2, $3, $4)`,
        [userId, email, passwordHash, JSON.stringify(metaData)]
      );

      await dbClient.query('COMMIT');

      // Auto-login clients
      const token = signSession({ id: userId, email, role: 'client', companyId: null });
      const cookieStore = await cookies();
      cookieStore.set('daman-session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      return NextResponse.json({
        message: 'Client registered successfully',
        user: { id: userId, email, role: 'client', companyId: null },
      });
    }

    // ── COMPANY ADMIN ─────────────────────────────────────────────────────────
    if (role === 'company_admin') {
      if (!companyNameAr || !companyNameEn || !companyCode || !licenseNumber) {
        throw new Error('All company details are required for company admin registration');
      }

      const duplicateCode = await dbClient.query(
        'SELECT id FROM public.companies WHERE LOWER(code) = LOWER($1)',
        [companyCode]
      );
      if (duplicateCode.rows.length > 0) {
        return NextResponse.json({ message: 'Company code is already registered' }, { status: 400 });
      }

      const duplicateLicense = await dbClient.query(
        'SELECT id FROM public.companies WHERE license_number = $1',
        [licenseNumber]
      );
      if (duplicateLicense.rows.length > 0) {
        return NextResponse.json({ message: 'Company license number is already registered' }, { status: 400 });
      }

      const companyId = crypto.randomUUID();
      await dbClient.query(
        `INSERT INTO public.companies (id, name_ar, name_en, code, license_number, headquarters_wilaya, email, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [companyId, companyNameAr, companyNameEn, companyCode.toUpperCase(), licenseNumber, headquartersWilaya || null, email, false]
      );

      const metaData = {
        full_name_ar: fullNameAr,
        full_name_en: fullNameEn || null,
        role: 'company_admin',
        company_id: companyId,
        is_active: true,
      };

      await dbClient.query(
        `INSERT INTO auth.users (id, email, password_hash, raw_user_meta_data)
         VALUES ($1, $2, $3, $4)`,
        [userId, email, passwordHash, JSON.stringify(metaData)]
      );

      await dbClient.query('COMMIT');

      return NextResponse.json({
        message: 'Company registered successfully. Account is pending superadmin approval.',
        pendingApproval: true,
        user: { id: userId, email, role: 'company_admin', companyId },
      });
    }

    // ── BROKER ────────────────────────────────────────────────────────────────
    if (role === 'broker') {
      if (!brokerLicense) throw new Error('Broker license number is required');

      const metaData = {
        full_name_ar: fullNameAr,
        full_name_en: fullNameEn || null,
        role: 'broker',
        broker_license: brokerLicense,
        phone: phone || null,
        wilaya_code: wilayaCode || null,
        is_active: false,
      };

      await dbClient.query(
        `INSERT INTO auth.users (id, email, password_hash, raw_user_meta_data)
         VALUES ($1, $2, $3, $4)`,
        [userId, email, passwordHash, JSON.stringify(metaData)]
      );

      await dbClient.query('COMMIT');

      return NextResponse.json({
        message: 'Broker account registered. Pending superadmin approval.',
        pendingApproval: true,
        user: { id: userId, email, role: 'broker' },
      });
    }

    // ── ASSESSOR ──────────────────────────────────────────────────────────────
    if (role === 'assessor') {
      if (!assessorLicense) throw new Error('Assessor certification number is required');

      const metaData = {
        full_name_ar: fullNameAr,
        full_name_en: fullNameEn || null,
        role: 'assessor',
        assessor_license: assessorLicense,
        assessor_specialty: assessorSpecialty || null,
        phone: phone || null,
        wilaya_code: wilayaCode || null,
        is_active: false,
      };

      await dbClient.query(
        `INSERT INTO auth.users (id, email, password_hash, raw_user_meta_data)
         VALUES ($1, $2, $3, $4)`,
        [userId, email, passwordHash, JSON.stringify(metaData)]
      );

      await dbClient.query('COMMIT');

      return NextResponse.json({
        message: 'Assessor account registered. Pending superadmin approval.',
        pendingApproval: true,
        user: { id: userId, email, role: 'assessor' },
      });
    }

    return NextResponse.json({ message: 'Unhandled role' }, { status: 400 });

  } catch (err: any) {
    await dbClient.query('ROLLBACK');
    console.error('Registration error:', err);
    return NextResponse.json(
      { message: err.message || 'Internal server error during registration' },
      { status: 500 }
    );
  } finally {
    dbClient.release();
  }
}
