const fs = require('fs');
let content = fs.readFileSync('src/app/[locale]/admin/layout.tsx', 'utf8');

content = content.replace(/const supabase = createServerSupabaseClient\(\);/g, "const supabase = await createServerSupabaseClient();");

fs.writeFileSync('src/app/[locale]/admin/layout.tsx', content);
