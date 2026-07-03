import { getCurrentUser } from '@/lib/auth-utils';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import AgentNetworkDashboardClient from './AgentNetworkDashboardClient';

export default async function AgentNetworkDashboardPage() {
  const user = await getCurrentUser();

  if (!user || (user.role !== 'company_agent' && user.role !== 'broker' && user.role !== 'company_admin')) {
    redirect('/login');
  }

  const companyId = user.company_id;

  // Get agents under this company
  const agents = await query(
    `SELECT p.id, p.full_name_ar, p.full_name_en, u.email, p.phone, p.wilaya,
            COUNT(DISTINCT c.id) as client_count,
            COUNT(DISTINCT con.id) as policy_count,
            SUM(COALESCE(con.monthly_premium::numeric, 0)) as total_premium
     FROM public.profiles p
     JOIN auth.users u ON p.id = u.id
     LEFT JOIN public.contracts con ON con.agent_id = p.id
     LEFT JOIN public.profiles c ON c.id = con.client_id
     WHERE p.company_id = $1 AND p.role IN ('company_agent', 'broker')
     GROUP BY p.id, p.full_name_ar, p.full_name_en, u.email, p.phone, p.wilaya
     ORDER BY total_premium DESC`,
    [companyId]
  );

  // Get pending lead hand-offs
  const pendingHandoffs = await query(
    `SELECT lh.id, lh.client_name, lh.client_phone, lh.wilaya, lh.product_type,
            lh.notes, lh.created_at::text as created_at,
            p.full_name_ar as agent_name_ar, p.full_name_en as agent_name_en
     FROM lead_handoffs lh
     JOIN public.profiles p ON lh.agent_id = p.id
     WHERE lh.company_id = $1 AND lh.status = 'pending'
     ORDER BY lh.created_at DESC`,
    [companyId]
  );

  // Get field digitization stats
  const digitizationStats = await query(
    `SELECT 
       COUNT(*) as total_scanned,
       SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified,
       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
     FROM migration_documents
     WHERE company_id = $1 AND scanned_by_role IN ('company_agent', 'broker')`,
    [companyId]
  );

  return (
    <AgentNetworkDashboardClient
      user={{
        id: user.id,
        email: user.email,
        fullNameAr: user.full_name_ar,
        fullNameEn: user.full_name_en,
        role: user.role,
      }}
      agents={agents}
      pendingHandoffs={pendingHandoffs}
      digitizationStats={digitizationStats[0] || { total_scanned: 0, verified: 0, pending: 0 }}
    />
  );
}