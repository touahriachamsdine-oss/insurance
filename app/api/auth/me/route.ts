import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.company_id,
        fullNameAr: user.full_name_ar,
        fullNameEn: user.full_name_en,
        isActive: user.is_active
      }
    });
  } catch (err: any) {
    console.error('Me endpoint error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
