const fs = require('fs');
let content = fs.readFileSync('src/lib/actions/admin.ts', 'utf8');

content = content.replace(/const supabase = createServerSupabaseClient\(\);/g, "const supabase = await createServerSupabaseClient();");

fs.writeFileSync('src/lib/actions/admin.ts', content);
