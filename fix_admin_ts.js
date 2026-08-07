const fs = require('fs');
let content = fs.readFileSync('src/lib/actions/admin.ts', 'utf8');
content = content.replace("shipping_status: status", "status: status");
fs.writeFileSync('src/lib/actions/admin.ts', content);
