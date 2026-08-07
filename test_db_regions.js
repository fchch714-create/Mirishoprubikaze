const { Client } = require('pg');

const regions = [
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-southeast-1',
  'ap-northeast-1'
];

async function main() {
  const pwd = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!pwd) {
    console.log('No SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  for (const r of regions) {
    const host = `aws-0-${r}.pooler.supabase.com`;
    console.log(`Trying region ${r} on host ${host}...`);
    const client = new Client({
      host: host,
      port: 5432,
      database: 'postgres',
      user: 'postgres.npqecrxvllvuoxaybnoq',
      password: pwd,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log(`SUCCESS in region: ${r}!`);
      const res = await client.query('SELECT version()');
      console.log('Version:', res.rows[0]);
      await client.end();
      return;
    } catch (err) {
      console.log(`FAILED in region ${r}:`, err.message);
    }
  }
}

main();
