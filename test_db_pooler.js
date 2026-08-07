const { Client } = require('pg');

async function test() {
  const passwords = [
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ];

  const poolerHost = 'aws-0-eu-west-2.pooler.supabase.com';

  for (const pwd of passwords) {
    if (!pwd) continue;
    console.log('Testing pooler with password:', pwd.substring(0, 15) + '...');
    const client = new Client({
      host: poolerHost,
      port: 5432,
      database: 'postgres',
      user: 'postgres.npqecrxvllvuoxaybnoq',
      password: pwd,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log('SUCCESS with pooler!');
      
      // Let's run a test query
      const res = await client.query('SELECT current_database(), current_user');
      console.log('Query result:', res.rows);
      
      await client.end();
      return;
    } catch (err) {
      console.log('FAILED with pooler password:', pwd.substring(0, 15) + '...', err.message);
    }
  }
}

test();
