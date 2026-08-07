const fs = require('fs');
let content = fs.readFileSync('src/lib/actions/admin.ts', 'utf8');

content = content.replace(/const supabase = createAdminSupabaseClient\(\);/g, "const supabase = await createAdminSupabaseClient();");

fs.writeFileSync('src/lib/actions/admin.ts', content);
