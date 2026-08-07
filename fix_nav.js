const fs = require('fs');
const path = 'src/components/layout/MobileBottomNav.tsx';
let code = fs.readFileSync(path, 'utf8');
code = code.replace("import { createClient } from '@/lib/supabase/client';", "import { supabase } from '@/lib/supabase/client';");
fs.writeFileSync(path, code);
