const fs = require('fs');
let code = fs.readFileSync('src/app/[locale]/layout.tsx', 'utf8');
code = code.replace("import { AuthModal } from '@/components/auth/AuthModal';", "");
code = code.replace("<AuthModal />", "");
fs.writeFileSync('src/app/[locale]/layout.tsx', code);
