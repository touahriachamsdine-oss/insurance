#!/usr/bin/env node
/**
 * seed-test-accounts.js
 * Creates one test account per role for local testing.
 * Run: node lib/seed-test-accounts.js
 */

const { Pool } = require('pg');
const crypto   = require('crypto');

const DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Qat9SxdPXgu7@ep-dawn-feather-adw83aaz-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString: DATABASE_URL });

// ── Same hashing as auth-utils.ts ──────────────────────────────────────────
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// ── Test accounts ──────────────────────────────────────────────────────────
const ACCOUNTS = [
  {
    email:    'superadmin@daman.dz',
    password: 'Test1234!',
    meta: {
      full_name_ar: 'مدير النظام',
      full_name_en: 'Super Admin',
      role: 'superadmin',
      is_active: true,
    },
  },
  {
    email:    'client@daman.dz',
    password: 'Test1234!',
    meta: {
      full_name_ar: 'أحمد بلعيد',
      full_name_en: 'Ahmed Belaid',
      role: 'client',
      national_id: '199001011234567',
      phone: '0550000001',
      wilaya_code: '16',
      is_active: true,
    },
  },
  {
    email:    'company@daman.dz',
    password: 'Test1234!',
    meta: {
      full_name_ar: 'مدير الشركة الوطنية',
      full_name_en: 'Company Director',
      role: 'company_admin',
      is_active: true,
      // company_id injected below after company insert
    },
    company: {
      name_ar: 'الشركة الوطنية للتأمين',
      name_en: 'National Insurance Company',
      code: 'TESTCO',
      license_number: 'LIC-TEST-2026-001',
      headquarters_wilaya: '16',
      is_active: true, // already approved for testing
    },
  },
  {
    email:    'broker@daman.dz',
    password: 'Test1234!',
    meta: {
      full_name_ar: 'يوسف مزيان',
      full_name_en: 'Youcef Meziane',
      role: 'broker',
      broker_license: 'BROKER-DZ-TEST-001',
      phone: '0550000003',
      wilaya_code: '31',
      is_active: false,
    },
  },
  {
    email:    'assessor@daman.dz',
    password: 'Test1234!',
    meta: {
      full_name_ar: 'نور الدين بوعلام',
      full_name_en: 'Noureddine Boualam',
      role: 'assessor',
      assessor_license: 'ASSESS-DZ-TEST-001',
      assessor_specialty: 'auto',
      phone: '0550000004',
      wilaya_code: '09',
      is_active: false,
    },
  },
  {
    email:    'agent@daman.dz',
    password: 'Test1234!',
    meta: {
      full_name_ar: 'عبد القادر بن سعيد',
      full_name_en: 'Abdelkader Bensaid',
      role: 'company_agent',
      cin: '123456789012345678',
      phone: '0550000005',
      agent_wilaya: '16',
      is_active: false,
    },
  },
];

// ── Main ───────────────────────────────────────────────────────────────────
async function seed() {
  const client = await pool.connect();
  try {
    for (const acc of ACCOUNTS) {
      console.log(`\n→ Processing: ${acc.email}`);

      // Check if already exists
      const existing = await client.query(
        'SELECT id FROM public.users WHERE LOWER(email) = LOWER($1)',
        [acc.email]
      );
      if (existing.rows.length > 0) {
        console.log(`  ⚠  Already exists — skipping`);
        continue;
      }

      const userId       = crypto.randomUUID();
      const passwordHash = hashPassword(acc.password);
      let   meta         = { ...acc.meta };

      // Insert company first if needed
      if (acc.company) {
        const companyId = crypto.randomUUID();
        await client.query(
          `INSERT INTO public.companies
             (id, name_ar, name_en, code, license_number, headquarters_wilaya, email, is_active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (code) DO NOTHING`,
          [
            companyId,
            acc.company.name_ar,
            acc.company.name_en,
            acc.company.code,
            acc.company.license_number,
            acc.company.headquarters_wilaya,
            acc.email,
            acc.company.is_active,
          ]
        );

        // Fetch actual id in case ON CONFLICT skipped insert
        const row = await client.query(
          'SELECT id FROM public.companies WHERE LOWER(code) = LOWER($1)',
          [acc.company.code]
        );
        meta.company_id = row.rows[0]?.id ?? companyId;
        console.log(`  ✔  Company inserted/fetched: ${meta.company_id}`);
      }

      // Insert user
      await client.query(
        `INSERT INTO public.users (
          id, email, password_hash, role, is_active, 
          full_name_ar, full_name_en, phone, wilaya_code, 
          national_id, cin, agent_wilaya, company_id, 
          broker_license, assessor_license, assessor_specialty
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          userId,
          acc.email,
          passwordHash,
          meta.role,
          meta.is_active ?? false,
          meta.full_name_ar || null,
          meta.full_name_en || null,
          meta.phone || null,
          meta.wilaya_code || null,
          meta.national_id || null,
          meta.cin || null,
          meta.agent_wilaya || null,
          meta.company_id || null,
          meta.broker_license || null,
          meta.assessor_license || null,
          meta.assessor_specialty || null
        ]
      );

      console.log(`  ✔  Created user: ${userId}`);
    }

    console.log('\n✅  Seed complete.\n');
    console.log('━'.repeat(52));
    console.log(' ROLE          EMAIL                PASSWORD');
    console.log('━'.repeat(52));
    for (const acc of ACCOUNTS) {
      const role = acc.meta.role.padEnd(14);
      const email = acc.email.padEnd(24);
      console.log(` ${role} ${email} ${acc.password}`);
    }
    console.log('━'.repeat(52));
  } catch (err) {
    console.error('\n❌  Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
