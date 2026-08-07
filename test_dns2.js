const dns = require('dns');

const hosts = [
  'aws-0-eu-west-2.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com',
  'db.npqecrxvllvuoxaybnoq.supabase.co'
];

for (const h of hosts) {
  dns.resolve4(h, (err, addresses) => {
    if (err) {
      console.log(`IPv4 for ${h}: ERROR`, err.message);
    } else {
      console.log(`IPv4 for ${h}:`, addresses);
    }
  });
}
