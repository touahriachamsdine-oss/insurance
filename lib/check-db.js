const { Pool } = require('pg');
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_Qat9SxdPXgu7@ep-dawn-feather-adw83aaz-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({ connectionString: DATABASE_URL });

async function check() {
  try {
    console.log("Connecting to:", DATABASE_URL.replace(/:[^:@]+@/, ':***@'));
    const res = await pool.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';");
    console.log("Tables in public schema:", res.rows.map(r => r.tablename));

    if (res.rows.some(r => r.tablename === 'users')) {
      const usersRes = await pool.query("SELECT id, email, role, is_active FROM public.users;");
      console.log("Users in database:", usersRes.rows);
    } else {
      console.log("public.users table does not exist!");
    }
  } catch (err) {
    console.error("Database check failed:", err);
  } finally {
    await pool.end();
  }
}

check();
