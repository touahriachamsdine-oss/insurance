import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const wilayas = await query('SELECT code, name_ar, name_en FROM public.wilayas ORDER BY code ASC');
    return NextResponse.json(wilayas);
  } catch (err: any) {
    console.error('Error in /api/wilayas:', err);
    return NextResponse.json({ message: 'Failed to fetch wilayas' }, { status: 500 });
  }
}
