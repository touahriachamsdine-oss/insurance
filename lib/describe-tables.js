const { Pool } = require('pg');
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({ connectionString: DATABASE_URL });

async function run() {
  try {
    for (const table of ['contracts', 'claims', 'users', 'companies', 'audit_logs']) {
      const res = await pool.query(
        `SELECT column_name, data_type 
         FROM information_schema.columns 
         WHERE table_name = $1 AND table_schema = 'public';`,
        [table]
      );
      console.log(`\nTable: ${table}`);
      res.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type}`);
      });
    }
  } catch (err) {
    console.error("Failed to describe tables:", err);
  } finally {
    await pool.end();
  }
}

run();
