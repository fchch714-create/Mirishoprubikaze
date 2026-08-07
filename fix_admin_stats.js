const fs = require('fs');
let content = fs.readFileSync('src/lib/actions/admin.ts', 'utf8');

content = content.replace("supabase.from('orders').select('total, created_at')", "supabase.from('orders').select('total_amount_azn, created_at')");
content = content.replace("sum + Number(order.total)", "sum + Number(order.total_amount_azn || 0)");

fs.writeFileSync('src/lib/actions/admin.ts', content);
