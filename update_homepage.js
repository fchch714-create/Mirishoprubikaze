const fs = require('fs');

let pageContent = fs.readFileSync('src/app/[locale]/page.tsx', 'utf8');

if (!pageContent.includes('const { data: activeBanners }')) {
    pageContent = pageContent.replace(
        "import { getActiveProducts, mapProductToLocale, Product } from '@/lib/supabase/queries/products';",
        "import { getActiveProducts, mapProductToLocale, Product } from '@/lib/supabase/queries/products';\nimport { createServerSupabaseClient } from '@/lib/supabase/server';"
    );
    
    pageContent = pageContent.replace(
        "const { locale } = await params;",
        `const { locale } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: activeBanners } = await supabase.from('banners').select('*').eq('is_active', true).order('created_at', { ascending: false });`
    );
    
    pageContent = pageContent.replace(
        "locale={locale}",
        "locale={locale}\n        banners={activeBanners || []}"
    );
    
    fs.writeFileSync('src/app/[locale]/page.tsx', pageContent);
}
