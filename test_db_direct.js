const { Client } = require('pg');

async function test() {
  const pwd = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!pwd) {
    console.log('No SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  console.log('Testing direct connection on port 5432...');
  const client = new Client({
    host: 'db.npqecrxvllvuoxaybnoq.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: pwd,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('SUCCESS connecting on port 5432!');
    const res = await client.query('SELECT version()');
    console.log('Result:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.log('FAILED on port 5432:', err.message);
  }
}

test();
