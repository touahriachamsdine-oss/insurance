import { getCurrentUser } from '@/lib/auth-utils';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import RegulatorExportDashboardClient from './RegulatorExportDashboardClient';

export default async function RegulatorExportDashboardPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'company_admin') {
    redirect('/login');
  }

  const companyId = user.company_id;

  // Get company info
  const companies = await query(
    'SELECT id, name_ar, name_en, code, license_number FROM public.companies WHERE id = $1',
    [companyId]
  );

  if (companies.length === 0) {
    redirect('/login');
  }

  const company = companies[0];

  // Get aggregate data for reports
  const aggregateData = await query(
    `SELECT 
       COUNT(DISTINCT con.id) as total_policies,
       SUM(COALESCE(con.monthly_premium::numeric, 0)) as total_premium,
       COUNT(DISTINCT cl.id) as total_claims,
       SUM(COALESCE(cl.approved_amount::numeric, 0)) as total_payouts,
       COUNT(DISTINCT p.id) as total_clients
     FROM public.companies comp
     LEFT JOIN public.contracts con ON con.company_id = comp.id
     LEFT JOIN public.claims cl ON cl.company_id = comp.id
     LEFT JOIN public.profiles p ON p.company_id = comp.id AND p.role = 'client'
     WHERE comp.id = $1`,
    [companyId]
  );

  // Get previous filing dates
  const previousFilings = await query(
    `SELECT id, period, report_type, generated_at::text as generated_at, status
     FROM regulatory_filings
     WHERE company_id = $1
     ORDER BY generated_at DESC
     LIMIT 10`,
    [companyId]
  );

  return (
    <RegulatorExportDashboardClient
      company={{
        id: company.id,
        nameAr: company.name_ar,
        nameEn: company.name_en,
        code: company.code,
        licenseNumber: company.license_number,
      }}
      aggregateData={aggregateData[0] || {
        total_policies: 0,
        total_premium: 0,
        total_claims: 0,
        total_payouts: 0,
        total_clients: 0,
      }}
      previousFilings={previousFilings}
      user={{
        id: user.id,
        email: user.email,
        fullNameAr: user.full_name_ar,
        fullNameEn: user.full_name_en,
        role: user.role,
      }}
    />
  );
}