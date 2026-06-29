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
    // Enable RLS for all tables
    console.log('Enabling Row Level Security...');
    const tables = ['profiles', 'companies', 'branches', 'contracts', 'transfer_requests', 'claims', 'notifications', 'audit_logs'];
    for (const table of tables) {
      await sql.query(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    }

    // Clean existing mock data
    console.log('Cleaning existing user and profile data...');
    await sql.query(`DELETE FROM public.profiles;`);
    await sql.query(`DELETE FROM auth.users;`);

    for (const u of users) {
      const hashedPassword = hashPassword(u.password);
      
      console.log(`Inserting user: ${u.email}`);
      await sql.query(
        `INSERT INTO auth.users (id, email, password_hash, raw_user_meta_data)
         VALUES ($1, $2, $3, $4)`,
        [u.id, u.email, hashedPassword, JSON.stringify(u.meta)]
      );
    }

    console.log('Seed users insert complete. Verifying profiles created via trigger...');
    const result = await sql.query(`SELECT id, full_name_ar, role FROM public.profiles;`);
    console.log('Created profiles:', result);
  } catch (err) {
    console.error('Error during seeding:', err);
  }
}

seed();
