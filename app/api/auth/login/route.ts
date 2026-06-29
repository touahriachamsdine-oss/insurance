import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { queryOne } from '@/lib/db';
import { verifyPassword, signSession } from '@/lib/auth-utils';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Fetch user, profile and company status in a single query
    const user = await queryOne(
      `SELECT u.id, u.email, u.password_hash, p.role, p.company_id, p.is_active, c.is_active as company_active
       FROM auth.users u
       JOIN public.profiles p ON u.id = p.id
       LEFT JOIN public.companies c ON p.company_id = c.id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email]
    );

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user account is active
    if (user.is_active === false) {
      return NextResponse.json(
        { message: 'Your account is inactive. Please contact support.' },
        { status: 403 }
      );
    }

    // For company users, check if their company is active
    if ((user.role === 'company_admin' || user.role === 'company_agent') && user.company_id) {
      if (user.company_active === false) {
        return NextResponse.json(
          { message: 'Your company account is pending approval or inactive.' },
          { status: 403 }
        );
      }
    }

    // Sign session token
    const token = signSession({
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.company_id
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('daman-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.company_id
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { message: 'Internal server error during login' },
      { status: 500 }
    );
  }
}
