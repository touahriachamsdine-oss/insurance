import { getCurrentUser } from '@/lib/auth-utils';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import AssessorDashboardClient from './AssessorDashboardClient';

export default async function AssessorDashboardPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'assessor') {
    redirect('/login');
  }

  const claims = await query(
    `SELECT cl.id, cl.claim_number, cl.status, cl.incident_date::text AS incident_date, cl.claimed_amount::text AS claimed_amount,
            cl.description, cl.estimated_amount::text AS estimated_amount, cl.submitted_at::text AS submitted_at,
            c.contract_number, comp.name_ar AS company_name_ar, comp.name_en AS company_name_en,
            p.full_name_ar AS client_name_ar, p.full_name_en AS client_name_en, u.email AS client_email
     FROM public.claims cl
     JOIN public.contracts c ON cl.contract_id = c.id
     JOIN public.companies comp ON cl.company_id = comp.id
     JOIN public.profiles p ON cl.client_id = p.id
     JOIN auth.users u ON p.id = u.id
     WHERE cl.assessor_id = $1
     ORDER BY cl.submitted_at DESC`,
    [user.id]
  );

  return (
    <AssessorDashboardClient
      user={{
        id: user.id,
        email: user.email,
        fullNameAr: user.full_name_ar,
        fullNameEn: user.full_name_en,
        role: user.role,
      }}
      claims={claims}
    />
  );
}
