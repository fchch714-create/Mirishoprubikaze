const fs = require('fs');

function fix(path) {
  let code = fs.readFileSync(path, 'utf8');
  if (code.includes('const supabase = null as any;')) {
    if (!code.includes("import { supabase } from '@/lib/supabase/client'")) {
        code = code.replace(/import \* as React from 'react';/, "import * as React from 'react';\nimport { supabase } from '@/lib/supabase/client';");
    }
    code = code.replace(/  const supabase = null as any;\n/g, "");
    fs.writeFileSync(path, code);
  }
}

fix('src/components/layout/CartClientContent.tsx');
fix('src/components/layout/MobileBottomNav.tsx');
fix('src/components/CartDrawer.tsx');
