const fs = require('fs');

const files = [
  'src/components/CartDrawer.tsx',
  'src/components/auth/AuthModal.tsx',
  'src/components/layout/CartClientContent.tsx',
  'src/components/layout/Header.tsx',
  'src/components/layout/MobileBottomNav.tsx'
];

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace auth-helpers import with ssr
  code = code.replace(
    "import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';",
    "import { createClient } from '@/lib/supabase/client';"
  );
  
  // Replace instantiation
  code = code.replace(
    "const supabase = createClientComponentClient();",
    "const supabase = createClient();"
  );
  
  // Fix implicit any on session
  code = code.replace(
    "const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {",
    "const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {"
  );
  
  fs.writeFileSync(file, code);
});
