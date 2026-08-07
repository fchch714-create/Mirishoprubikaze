const fs = require('fs');
let content = fs.readFileSync('src/lib/actions/admin.ts', 'utf8');

content = content.replace("reduce((sum, order) => sum + (order.total_amount_azn || 0), 0)", "reduce((sum: number, order: any) => sum + (order.total_amount_azn || 0), 0)");
content = content.replace("users.map((user) =>", "users.map((user: any) =>");

fs.writeFileSync('src/lib/actions/admin.ts', content);
