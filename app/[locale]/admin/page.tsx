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
       p.email,
       p.broker_license,
       p.assessor_license,
       p.assessor_specialty,
       c.name_ar as company_name_ar,
       c.name_en as company_name_en,
       p.created_at::text
     FROM public.users p
     LEFT JOIN public.companies c ON p.company_id = c.id
     WHERE p.role IN ('broker', 'assessor', 'company_agent')
     ORDER BY p.created_at DESC`
  );

  // Fetch analytics data
  const growthData = await query(
    `WITH months AS (
       SELECT 
         date_trunc('month', g.month) as month_date,
         to_char(g.month, 'YYYY-MM-DD') as month_label
       FROM generate_series(
         date_trunc('month', now() - interval '5 months'),
         date_trunc('month', now()),
         interval '1 month'
       ) g(month)
     ),
     user_counts AS (
       SELECT 
         date_trunc('month', created_at) as month_date,
         count(*) as new_users
       FROM public.users
       GROUP BY 1
     ),
     policy_counts AS (
       SELECT 
         date_trunc('month', created_at) as month_date,
         count(*) as new_policies,
         coalesce(sum(monthly_premium), 0) as premium_revenue
       FROM public.contracts
       GROUP BY 1
     )
     SELECT 
       m.month_label as month_date,
       coalesce(u.new_users, 0)::int as users,
       coalesce(p.new_policies, 0)::int as policies,
       coalesce(p.premium_revenue, 0)::float as revenue
     FROM months m
     LEFT JOIN user_counts u ON m.month_date = u.month_date
     LEFT JOIN policy_counts p ON m.month_date = p.month_date
     ORDER BY m.month_date ASC`
  );

  const claimsData = await query(
    `WITH months AS (
       SELECT 
         date_trunc('month', g.month) as month_date,
         to_char(g.month, 'YYYY-MM-DD') as month_label
       FROM generate_series(
         date_trunc('month', now() - interval '5 months'),
         date_trunc('month', now()),
         interval '1 month'
       ) g(month)
     ),
     claim_sums AS (
       SELECT 
         date_trunc('month', submitted_at) as month_date,
         coalesce(sum(claimed_amount), 0) as claimed,
         coalesce(sum(approved_amount), 0) as paid
       FROM public.claims
       GROUP BY 1
     )
     SELECT 
       m.month_label as month_date,
       coalesce(c.claimed, 0)::float as claimed,
       coalesce(c.paid, 0)::float as paid
     FROM months m
     LEFT JOIN claim_sums c ON m.month_date = c.month_date
     ORDER BY m.month_date ASC`
  );

  const roleDistribution = await query(
    `SELECT 
       role,
       is_active,
       count(*)::int as count
     FROM public.users
     GROUP BY role, is_active`
  );

  return (
    <AdminDashboardClient 
      companies={companies} 
      users={users}
      growthData={growthData}
      claimsData={claimsData}
      roleDistribution={roleDistribution}
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
