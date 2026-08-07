const fs = require('fs');
const path = 'src/components/layout/Header.tsx';
let code = fs.readFileSync(path, 'utf8');
code = code.replace("import { motion, AnimatePresence } from 'motion/react';", "import { motion, AnimatePresence } from 'motion/react';\nimport { supabase } from '@/lib/supabase/client';");
code = code.replace("  const supabase = null as any;\n", "");
fs.writeFileSync(path, code);
