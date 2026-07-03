import React from 'react';
import { getCurrentUser } from '@/lib/auth-utils';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import CompanyDashboardClient from './CompanyDashboardClient';

export default async function CompanyDashboardPage() {
  const user = await getCurrentUser();

  // Route security check: only company_admin or company_agent can access
  if (!user || (user.role !== 'company_admin' && user.role !== 'company_agent')) {
    redirect('/login');
  }

  // Get company info
  const companies = await query(
    'SELECT id, name_ar, name_en, code FROM public.companies WHERE id = $1',
    [user.company_id]
  );
  
  if (companies.length === 0) {
    redirect('/login');
  }

  const company = companies[0];

  // Fetch contracts
  const contracts = await query(
    `SELECT 
       c.id, 
       c.contract_number, 
       c.client_id, 
       c.type, 
       c.plan, 
       c.status,
       c.coverage_amount::text as coverage_amount, 
       c.monthly_premium::text as monthly_premium, 
       c.deductible::text as deductible,
       c.start_date::text as start_date, 
       c.end_date::text as end_date,
       c.vehicle_make, 
       c.vehicle_model, 
       c.vehicle_year, 
       c.vehicle_plate, 
       c.vehicle_vin,
       c.property_address, 
       c.property_wilaya, 
       c.property_area_sqm::text as property_area_sqm, 
       c.beneficiaries_count, 
       c.notes,
       c.created_at::text as created_at,
       p.full_name_ar as client_name_ar,
       p.full_name_en as client_name_en,
       p.email as client_email,
       p.phone as client_phone
     FROM public.contracts c
     JOIN public.users p ON c.client_id = p.id
     WHERE c.company_id = $1
     ORDER BY c.created_at DESC`,
    [user.company_id]
  );

  // Fetch claims
  const claims = await query(
    `SELECT 
       cl.id, 
       cl.claim_number, 
       cl.contract_id, 
       cl.client_id, 
       cl.company_id, 
       cl.status,
       cl.incident_date::text as incident_date, 
       cl.description, 
       cl.claimed_amount::text as estimated_amount, 
       cl.approved_amount::text as approved_amount, 
       cl.rejection_reason,
       cl.submitted_at::text as created_at,
       p.full_name_ar as client_name_ar,
       p.full_name_en as client_name_en,
       p.email as client_email,
       con.contract_number,
       cl.documents
     FROM public.claims cl
     JOIN public.users p ON cl.client_id = p.id
     JOIN public.contracts con ON cl.contract_id = con.id
     WHERE cl.company_id = $1
     ORDER BY cl.submitted_at DESC`,
    [user.company_id]
  );

  // Fetch B2B transfer requests where this company is either source (from) or target (to)
  const transfers = await query(
    `SELECT 
       t.id, 
       t.contract_id, 
       t.client_id, 
       t.from_company_id, 
       t.to_company_id, 
       t.reason, 
       t.status,
       t.rejection_reason,
       t.requested_at::text as requested_at,
       p.full_name_ar as client_name_ar,
       p.full_name_en as client_name_en,
       c_from.name_ar as from_name_ar,
       c_from.name_en as from_name_en,
       c_to.name_ar as to_name_ar,
       c_to.name_en as to_name_en,
       con.contract_number
     FROM public.transfer_requests t
     JOIN public.users p ON t.client_id = p.id
     JOIN public.companies c_from ON t.from_company_id = c_from.id
     JOIN public.companies c_to ON t.to_company_id = c_to.id
     JOIN public.contracts con ON t.contract_id = con.id
     WHERE t.from_company_id = $1 OR t.to_company_id = $1
     ORDER BY t.requested_at DESC`,
    [user.company_id]
  );

  const clients = await query(
    `SELECT DISTINCT p.id, p.full_name_ar, p.full_name_en, p.email, p.phone
     FROM public.users p
     JOIN public.contracts c ON c.client_id = p.id
     WHERE p.role = 'client'
       AND c.company_id = $1
     ORDER BY p.full_name_en ASC`,
    [user.company_id]
  );

  return (
    <CompanyDashboardClient 
      company={{
        id: company.id,
        nameAr: company.name_ar,
        nameEn: company.name_en,
        code: company.code
      }}
      contracts={contracts}
      claims={claims}
      transfers={transfers}
      clients={clients}
      user={{
        id: user.id,
        email: user.email,
        fullNameAr: user.full_name_ar,
        fullNameEn: user.full_name_en,
        role: user.role,
        companyId: user.company_id
      }}
    />
  );
}
