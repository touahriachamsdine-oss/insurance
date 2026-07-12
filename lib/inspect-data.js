const { Pool } = require('pg');
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({ connectionString: DATABASE_URL });

async function run() {
  try {
    const tables = ['contracts', 'claims', 'users', 'companies', 'audit_logs'];
    for (const t of tables) {
      const countRes = await pool.query(`SELECT COUNT(*) FROM public.${t}`);
      console.log(`Table ${t} has ${countRes.rows[0].count} rows.`);
      if (parseInt(countRes.rows[0].count) > 0) {
        const sampleRes = await pool.query(`SELECT * FROM public.${t} LIMIT 2`);
        console.log(`Sample from ${t}:`, sampleRes.rows);
      }
    }
  } catch (err) {
    console.error("Failed to inspect data:", err);
  } finally {
    await pool.end();
  }
}

run();
