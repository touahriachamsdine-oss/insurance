import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { getClient } from '@/lib/db';
import { hashPassword } from '@/lib/auth-utils';
import crypto from 'crypto';

export async function POST(request: Request) {
  const dbClient = await getClient();
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'company_admin' && user.role !== 'company_agent')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get company details for contract generation
    const company = await dbClient.query(
      'SELECT code FROM public.companies WHERE id = $1',
      [user.company_id]
    );
    const companyCode = company.rows[0]?.code || 'COMP';

    const body = await request.json();
    const { rows } = body; // Array of user/policy records

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ message: 'No data rows provided' }, { status: 400 });
    }

    await dbClient.query('BEGIN');

    const importedUsers = [];
    const importedContracts = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const {
        email,
        fullNameAr,
        fullNameEn,
        phone,
        nationalId,
        wilayaCode,
        password,
        // Optional policy fields
        policyType,
        policyPlan,
        coverageAmount,
        monthlyPremium,
        deductible,
        startDate,
        endDate,
        policyStatus = 'active',
        vehicleMake,
        vehicleModel,
        vehicleYear,
        vehiclePlate,
        vehicleVin,
        propertyAddress,
        propertyWilaya,
        propertyAreaSqm,
        beneficiariesCount,
        notes
      } = row;

      const rowNum = i + 1;

      // Basic validations
      if (!email || !fullNameAr || !nationalId) {
        errors.push(`Row ${rowNum}: Email, Arabic name, and National ID are required`);
        continue;
      }

      // Check duplicate email in db
      const duplicateEmail = await dbClient.query(
        'SELECT id FROM public.users WHERE LOWER(email) = LOWER($1)',
        [email]
      );
      if (duplicateEmail.rows.length > 0) {
        errors.push(`Row ${rowNum}: Email "${email}" is already registered`);
        continue;
      }

      // Check duplicate national ID in db
      const duplicateNationalId = await dbClient.query(
        'SELECT id FROM public.users WHERE national_id = $1',
        [nationalId]
      );
      if (duplicateNationalId.rows.length > 0) {
        errors.push(`Row ${rowNum}: National ID "${nationalId}" is already registered`);
        continue;
      }

      // Determine password
      const plainPassword = password || nationalId.toString();
      const passwordHash = hashPassword(plainPassword);
      const clientId = crypto.randomUUID();

      // Insert User
      await dbClient.query(
        `INSERT INTO public.users (
          id, email, password_hash, role, is_active, full_name_ar, full_name_en, phone, wilaya_code, national_id, company_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          clientId,
          email,
          passwordHash,
          'client',
          true,
          fullNameAr,
          fullNameEn || null,
          phone || null,
          wilayaCode || null,
          nationalId,
          user.company_id
        ]
      );

      importedUsers.push({ id: clientId, email, fullNameAr });

      // If optional policy info is provided, create a contract
      if (policyType && policyPlan && coverageAmount && monthlyPremium) {
        // Generate contract number
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
        const contractNumber = `DM-${companyCode}-${dateStr}-${rand}`;

        const sDate = startDate || new Date().toISOString().slice(0, 10);
        const eDate = endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        await dbClient.query(
          `INSERT INTO public.contracts (
            contract_number, client_id, company_id, agent_id, type, plan, status,
            coverage_amount, monthly_premium, deductible, start_date, end_date,
            vehicle_make, vehicle_model, vehicle_year, vehicle_plate, vehicle_vin,
            property_address, property_wilaya, property_area_sqm, beneficiaries_count,
            notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
          [
            contractNumber,
            clientId,
            user.company_id,
            user.id,
            policyType,
            policyPlan,
            policyStatus,
            coverageAmount,
            monthlyPremium,
            deductible || null,
            sDate,
            eDate,
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

        importedContracts.push(contractNumber);
      }
    }

    if (errors.length > 0 && importedUsers.length === 0) {
      await dbClient.query('ROLLBACK');
      return NextResponse.json({
        success: false,
        message: 'No accounts were imported due to validation errors.',
        errors
      }, { status: 400 });
    }

    await dbClient.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedUsers.length} user accounts and ${importedContracts.length} insurance contracts.`,
      usersCount: importedUsers.length,
      contractsCount: importedContracts.length,
      errors: errors.length > 0 ? errors : null
    });

  } catch (err: any) {
    await dbClient.query('ROLLBACK');
    console.error('Bulk import error:', err);
    return NextResponse.json(
      { message: err.message || 'Internal server error during bulk import' },
      { status: 500 }
    );
  } finally {
    dbClient.release();
  }
}
