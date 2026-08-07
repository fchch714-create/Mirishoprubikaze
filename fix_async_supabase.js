const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/const supabase = createServerSupabaseClient\(\);/g, "const supabase = await createServerSupabaseClient();");
  content = content.replace(/const supabase = createAdminSupabaseClient\(\);/g, "const supabase = await createAdminSupabaseClient();");
  fs.writeFileSync(filePath, content);
}

fixFile('src/lib/actions/catalog.ts');
fixFile('src/lib/actions/commerce.ts');
fixFile('src/lib/actions/user.ts');
fixFile('src/lib/supabase/queries/products.ts');

