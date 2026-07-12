const { Pool } = require('pg');
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({ connectionString: DATABASE_URL });

async function run() {
  try {
    console.log("Running aggregation queries...");
    
    // Query 1: 6-month growth (users and policies)
    const growthRes = await pool.query(`
      WITH months AS (
        SELECT 
          date_trunc('month', g.month) as month_date,
          to_char(g.month, 'Mon YYYY') as month_label
        FROM generate_series(
          date_trunc('month', now() - interval '5 months'),
          date_trunc('month', now()),
          interval '1 month'
        ) g(month)
      ),
      user_counts AS (
        SELECT 
          date_trunc('month', created_at) as month_date,
          count(*) as new_users
        FROM public.users
        GROUP BY 1
      ),
      policy_counts AS (
        SELECT 
          date_trunc('month', created_at) as month_date,
          count(*) as new_policies,
          coalesce(sum(monthly_premium), 0) as premium_revenue
        FROM public.contracts
        GROUP BY 1
      )
      SELECT 
        m.month_label as name,
        coalesce(u.new_users, 0) as users,
        coalesce(p.new_policies, 0) as policies,
        coalesce(p.premium_revenue, 0) as revenue
      FROM months m
      LEFT JOIN user_counts u ON m.month_date = u.month_date
      LEFT JOIN policy_counts p ON m.month_date = p.month_date
      ORDER BY m.month_date ASC;
    `);
    console.log("Growth and Revenue data:", growthRes.rows);

    // Query 2: Claims payout per month
    const claimsRes = await pool.query(`
      WITH months AS (
        SELECT 
          date_trunc('month', g.month) as month_date,
          to_char(g.month, 'Mon YYYY') as month_label
        FROM generate_series(
          date_trunc('month', now() - interval '5 months'),
          date_trunc('month', now()),
          interval '1 month'
        ) g(month)
      ),
      claim_sums AS (
        SELECT 
          date_trunc('month', submitted_at) as month_date,
          coalesce(sum(claimed_amount), 0) as claimed,
          coalesce(sum(approved_amount), 0) as paid
        FROM public.claims
        GROUP BY 1
      )
      SELECT 
        m.month_label as name,
        coalesce(c.claimed, 0) as claimed,
        coalesce(c.paid, 0) as paid
      FROM months m
      LEFT JOIN claim_sums c ON m.month_date = c.month_date
      ORDER BY m.month_date ASC;
    `);
    console.log("Claims data:", claimsRes.rows);

    // Query 3: Role distribution
    const rolesRes = await pool.query(`
      SELECT 
        role,
        is_active,
        count(*) as count
      FROM public.users
      GROUP BY role, is_active;
    `);
    console.log("User Roles distribution:", rolesRes.rows);

  } catch (err) {
    console.error("Query failed:", err);
  } finally {
    await pool.end();
  }
}

run();
