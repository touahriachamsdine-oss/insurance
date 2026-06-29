import React from 'react';
import { getCurrentUser } from '@/lib/auth-utils';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  // Route security check
  if (!user || user.role !== 'superadmin') {
    redirect('/login');
  }

  // Fetch partner companies
  const companies = await query(
    `SELECT 
       id, 
       name_ar, 
       name_en, 
       code, 
       license_number, 
       headquarters_wilaya, 
       phone, 
       email, 
       website, 
       is_active, 
       created_at::text 
     FROM public.companies 
     ORDER BY created_at DESC`
  );

  // Fetch professional users (brokers, assessors, company agents)
  const users = await query(
    `SELECT 
       p.id,
       p.full_name_ar,
       p.full_name_en,
       p.role,
       p.is_active,
       p.phone,
       p.wilaya_code,
       u.email,
       u.raw_user_meta_data->>'broker_license' as broker_license,
       u.raw_user_meta_data->>'assessor_license' as assessor_license,
       u.raw_user_meta_data->>'assessor_specialty' as assessor_specialty,
       c.name_ar as company_name_ar,
       c.name_en as company_name_en,
       p.created_at::text
     FROM public.profiles p
     JOIN auth.users u ON p.id = u.id
     LEFT JOIN public.companies c ON p.company_id = c.id
     WHERE p.role IN ('broker', 'assessor', 'company_agent')
     ORDER BY p.created_at DESC`
  );

  return (
    <AdminDashboardClient 
      companies={companies} 
      users={users}
      user={{
        id: user.id,
        email: user.email,
        fullNameAr: user.full_name_ar,
        fullNameEn: user.full_name_en,
        role: user.role
      }}
    />
  );
}
