const fs = require('fs');
const path = 'src/app/[locale]/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
`  const { data: activeBanners } = await supabase.from('banners').select('*').eq('is_active', true).order('created_at', { ascending: false });`,
`  let activeBanners = [];
  try {
    const { data } = await supabase.from('banners').select('*').eq('is_active', true).order('created_at', { ascending: false });
    activeBanners = data || [];
  } catch (err) {
    console.error('Failed to load banners:', err);
  }`
);
fs.writeFileSync(path, code);
