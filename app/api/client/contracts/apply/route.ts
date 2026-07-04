import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { queryOne, query } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'client') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      companyId,
      type,
      plan,
      coverageAmount,
      monthlyPremium,
      deductible,
      startDate,
      endDate,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      vehiclePlate,
      vehicleVin,
      propertyAddress,
      propertyWilaya,
      propertyAreaSqm,
      beneficiariesCount,
      notes // Will contain JSON metadata for uploaded documents
    } = body;

    if (!companyId || !type || !plan || !coverageAmount || !monthlyPremium || !startDate || !endDate) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Get company details to construct the contract number
    const company = await queryOne(
      'SELECT code FROM public.companies WHERE id = $1',
      [companyId]
    );
    if (!company) {
      return NextResponse.json({ message: 'Insurance Company not found' }, { status: 400 });
    }

    // Generate unique contract number: DM-[COMP_CODE]-[DATE]-[RANDOM_HEX]
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
    const contractNumber = `DM-${company.code}-${dateStr}-${rand}`;

    const newContract = await queryOne(
      `INSERT INTO public.contracts (
         contract_number, client_id, company_id, type, plan, status,
         coverage_amount, monthly_premium, deductible, start_date, end_date,
         vehicle_make, vehicle_model, vehicle_year, vehicle_plate, vehicle_vin,
         property_address, property_wilaya, property_area_sqm, beneficiaries_count,
         notes
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
       RETURNING *`,
      [
        contractNumber,
        user.id,
        companyId,
        type,
        plan,
        'pending',
        coverageAmount,
        monthlyPremium,
        deductible || null,
        startDate,
        endDate,
        vehicleMake || null,
        vehicleModel || null,
        vehicleYear ? parseInt(vehicleYear) : null,
        vehiclePlate || null,
        vehicleVin || null,
        propertyAddress || null,
        propertyWilaya || null,
        propertyAreaSqm ? parseFloat(propertyAreaSqm) : null,
        beneficiariesCount ? parseInt(beneficiariesCount) : null,
        notes || null
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      contract: newContract
    });
  } catch (err: any) {
    console.error('Error applying for contract:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
