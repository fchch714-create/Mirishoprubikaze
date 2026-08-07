const fs = require('fs');

const files = [
  'src/components/layout/Header.tsx',
  'src/components/layout/MobileBottomNav.tsx',
  'src/components/layout/CartClientContent.tsx',
  'src/components/CartDrawer.tsx'
];

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/const supabase = createClient\(\);/g, "const supabase = null as any;");
  fs.writeFileSync(file, code);
});
