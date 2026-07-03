const crypto = require('crypto');
const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = "postgresql://neondb_owner:npg_Qat9SxdPXgu7@ep-dawn-feather-adw83aaz-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

const users = [
  {
    id: 'a1f83c06-1212-4c91-a67b-1cb8d9e79430',
    email: 'superadmin@daman.dz',
    password: 'SuperAdmin123!',
    meta: {
      full_name_ar: 'مدير النظام',
      full_name_en: 'System Super Admin',
      role: 'superadmin',
      is_active: true
    }
  },
  {
    id: 'a2f83c06-1212-4c91-a67b-1cb8d9e79431',
    email: 'admin.saa@daman.dz',
    password: 'Company123!',
    meta: {
      full_name_ar: 'مدير الشركة SAA',
      full_name_en: 'SAA Admin Manager',
      role: 'company_admin',
      company_id: 'e1f83c06-1212-4c91-a67b-1cb8d9e79430',
      is_active: true
    }
  },
  {
    id: 'a3f83c06-1212-4c91-a67b-1cb8d9e79432',
    email: 'admin.caat@daman.dz',
    password: 'Company123!',
    meta: {
      full_name_ar: 'مدير الشركة CAAT',
      full_name_en: 'CAAT Admin Manager',
      role: 'company_admin',
      company_id: 'e2f83c06-1212-4c91-a67b-1cb8d9e79431',
      is_active: true
    }
  },
  {
    id: 'a4f83c06-1212-4c91-a67b-1cb8d9e79433',
    email: 'agent.saa@daman.dz',
    password: 'Agent123!',
    meta: {
      full_name_ar: 'وكيل الشركة SAA',
      full_name_en: 'SAA Agent User',
      role: 'company_agent',
      company_id: 'e1f83c06-1212-4c91-a67b-1cb8d9e79430',
      is_active: true
    }
  },
  {
    id: 'a5f83c06-1212-4c91-a67b-1cb8d9e79434',
    email: 'client1@daman.dz',
    password: 'Client123!',
    meta: {
      full_name_ar: 'ياسين براهيمي',
      full_name_en: 'Yacine Brahimi',
      role: 'client',
      national_id: '123456789012345',
      phone: '0550123456',
      wilaya_code: '16',
      is_active: true
    }
  },
  {
    id: 'a6f83c06-1212-4c91-a67b-1cb8d9e79435',
    email: 'client2@daman.dz',
    password: 'Client123!',
    meta: {
      full_name_ar: 'أمين غويري',
      full_name_en: 'Amine Gouiri',
      role: 'client',
      national_id: '987654321098765',
      phone: '0660987654',
      wilaya_code: '31',
      is_active: true
    }
  }
];

async function seed() {
  const sql = neon(DATABASE_URL);
  console.log('Seeding using serverless Neon connection...');

  try {
    console.log('Seeding Neon user accounts...');

    for (const u of users) {
      const hashedPassword = hashPassword(u.password);
      const meta = u.meta || {};
      
      console.log(`Inserting user: ${u.email}`);
      await sql.query(
        `INSERT INTO public.users (
          id, email, password_hash, role, is_active,
          full_name_ar, full_name_en, phone, wilaya_code, national_id,
          company_id, broker_license, assessor_license, assessor_specialty,
          agent_wilaya
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          is_active = EXCLUDED.is_active,
          full_name_ar = EXCLUDED.full_name_ar,
          full_name_en = EXCLUDED.full_name_en,
          phone = EXCLUDED.phone,
          wilaya_code = EXCLUDED.wilaya_code,
          national_id = EXCLUDED.national_id,
          company_id = EXCLUDED.company_id,
          broker_license = EXCLUDED.broker_license,
          assessor_license = EXCLUDED.assessor_license,
          assessor_specialty = EXCLUDED.assessor_specialty,
          agent_wilaya = EXCLUDED.agent_wilaya`,
        [
          u.id,
          u.email,
          hashedPassword,
          meta.role || 'client',
          meta.is_active ?? false,
          meta.full_name_ar || null,
          meta.full_name_en || null,
          meta.phone || null,
          meta.wilaya_code || null,
          meta.national_id || null,
          meta.company_id || null,
          meta.broker_license || null,
          meta.assessor_license || null,
          meta.assessor_specialty || null,
          meta.agent_wilaya || null,
        ]
      );
    }

    const result = await sql.query(`SELECT id, full_name_ar, role FROM public.users ORDER BY created_at ASC;`);
    console.log('Seed complete. Users created/updated:', result.length);
  } catch (err) {
    console.error('Error during seeding:', err);
  }
}

seed();
