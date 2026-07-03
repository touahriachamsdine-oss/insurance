#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Qat9SxdPXgu7@ep-dawn-feather-adw83aaz-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString: DATABASE_URL });

async function run() {
  const sqlPath = path.join(__dirname, 'setup-users-table.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  console.log('Connecting to database...');
  const client = await pool.connect();
  try {
    console.log('Running migration: setup-users-table.sql');
    await client.query(sql);
    console.log('✅ Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();