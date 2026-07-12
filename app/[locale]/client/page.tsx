import { getCurrentUser } from '@/lib/auth-utils';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import ClientDashboardClient from './ClientDashboardClient';

export default async function ClientDashboardPage() {
  const user = await getCurrentUser();

  if (!user || !['client', 'broker', 'assessor'].includes(user.role)) {
    redirect('/login');
  }

  // Get active contracts for the client
  const contracts = await query(
    `SELECT
       c.id,
       c.contract_number,
       c.type,
       c.plan,
       c.status,
       c.coverage_amount::text AS coverage_amount,
       c.monthly_premium::text AS monthly_premium,
       c.start_date::text AS start_date,
       c.end_date::text AS end_date,
       comp.name_ar AS company_name_ar,
       comp.name_en AS company_name_en,
       jsonb_build_object(
         'vehicleMake', c.vehicle_make,
         'vehicleModel', c.vehicle_model,
         'vehicleYear', c.vehicle_year,
         'vehiclePlate', c.vehicle_plate,
         'vehicleVin', c.vehicle_vin,
         'propertyAddress', c.property_address,
         'propertyWilaya', c.property_wilaya,
         'propertyAreaSqm', c.property_area_sqm,
         'beneficiariesCount', c.beneficiaries_count
       ) AS data
     FROM public.contracts c
     JOIN public.companies comp ON c.company_id = comp.id
     WHERE c.client_id = $1
     ORDER BY c.created_at DESC`,
    [user.id]
  );

  // Get active claims for the client
  const claims = await query(
    `SELECT
       cl.id,
       cl.claim_number,
       cl.contract_id,
       cl.status,
       cl.incident_date::text AS incident_date,
       cl.claimed_amount::text AS claimed_amount,
       cl.submitted_at::text AS submitted_at,
       c.contract_number AS policy_number,
       comp.name_ar AS company_name_ar,
       comp.name_en AS company_name_en,
       cl.description,
       cl.documents
     FROM public.claims cl
     JOIN public.contracts c ON cl.contract_id = c.id
     JOIN public.companies comp ON cl.company_id = comp.id
     WHERE cl.client_id = $1
     ORDER BY cl.submitted_at DESC`,
    [user.id]
  );

  // Get list of all available insurance companies
  const companies = await query(
    `SELECT id, name_ar, name_en, code 
     FROM public.companies 
     ORDER BY name_en ASC`
  );

  return (
    <ClientDashboardClient
      user={{
        id: user.id,
        email: user.email,
        fullNameAr: user.full_name_ar,
        fullNameEn: user.full_name_en,
        role: user.role
      }}
      contracts={contracts}
      claims={claims}
      companies={companies}
    />
  );
}

