import { getCurrentUser } from '@/lib/auth-utils';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import BrokerDashboardClient from './BrokerDashboardClient';

export default async function BrokerDashboardPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'broker') {
    redirect('/login');
  }

  const companies = await query(
    'SELECT id, name_ar, name_en, code FROM public.companies WHERE id = $1',
    [user.company_id]
  );

  if (companies.length === 0) {
    redirect('/login');
  }

  const company = companies[0];

  const contractSummaryResult = await query(
    `SELECT
       COUNT(*) AS total_contracts,
       COUNT(DISTINCT client_id) AS unique_clients,
       SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_contracts,
       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_quotes,
       SUM(COALESCE(monthly_premium::numeric, 0)) AS total_premium
     FROM public.contracts
     WHERE agent_id = $1 AND company_id = $2`,
    [user.id, user.company_id]
  );

  const summary = contractSummaryResult[0] || {
    total_contracts: '0',
    unique_clients: '0',
    active_contracts: '0',
    pending_quotes: '0',
    total_premium: '0'
  };

  const contracts = await query(
    `SELECT
       c.id,
       c.contract_number,
       c.type,
       c.plan,
       c.status,
       c.coverage_amount::text AS coverage_amount,
       c.monthly_premium::text AS monthly_premium,
       c.created_at::text AS created_at,
       p.id AS client_id,
       p.full_name_ar AS client_name_ar,
       p.full_name_en AS client_name_en,
       u.email AS client_email,
       p.phone AS client_phone
     FROM public.contracts c
     JOIN public.profiles p ON c.client_id = p.id
     JOIN auth.users u ON p.id = u.id
     WHERE c.agent_id = $1 AND c.company_id = $2
     ORDER BY c.created_at DESC
     LIMIT 12`,
    [user.id, user.company_id]
  );

  const clients = await query(
    `SELECT DISTINCT
       p.id,
       p.full_name_ar,
       p.full_name_en,
       u.email,
       p.phone
     FROM public.profiles p
     JOIN auth.users u ON p.id = u.id
     JOIN public.contracts c ON c.client_id = p.id
     WHERE c.agent_id = $1 AND c.company_id = $2
     ORDER BY p.full_name_en ASC`,
    [user.id, user.company_id]
  );

  return (
    <BrokerDashboardClient
      user={{
        id: user.id,
        email: user.email,
        fullNameAr: user.full_name_ar,
        fullNameEn: user.full_name_en,
        role: user.role,
      }}
      company={{
        id: company.id,
        nameAr: company.name_ar,
        nameEn: company.name_en,
        code: company.code,
      }}
      summary={{
        totalContracts: Number(summary.total_contracts),
        uniqueClients: Number(summary.unique_clients),
        activeContracts: Number(summary.active_contracts),
        pendingQuotes: Number(summary.pending_quotes),
        totalPremium: Number(summary.total_premium)
      }}
      contracts={contracts}
      clients={clients}
    />
  );
}
