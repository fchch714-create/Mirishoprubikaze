const dns = require('dns');

dns.resolve4('db.npqecrxvllvuoxaybnoq.supabase.co', (err, addresses) => {
  if (err) {
    console.error('IPv4 resolve error:', err);
  } else {
    console.log('IPv4 addresses:', addresses);
  }
});

dns.resolve6('db.npqecrxvllvuoxaybnoq.supabase.co', (err, addresses) => {
  if (err) {
    console.error('IPv6 resolve error:', err);
  } else {
    console.log('IPv6 addresses:', addresses);
  }
});
