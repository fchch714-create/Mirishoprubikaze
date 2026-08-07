const fs = require('fs');
let content = fs.readFileSync('src/app/[locale]/layout.tsx', 'utf8');

if (!content.includes('AuthModal')) {
  content = content.replace(
    "import { MobileBottomNav } from '@/components/layout/MobileBottomNav';",
    "import { MobileBottomNav } from '@/components/layout/MobileBottomNav';\nimport { AuthModal } from '@/components/auth/AuthModal';"
  );
  
  content = content.replace(
    "<MobileBottomNav dict={dict} locale={locale} />",
    "<MobileBottomNav dict={dict} locale={locale} />\n      <AuthModal />"
  );
  
  fs.writeFileSync('src/app/[locale]/layout.tsx', content);
}
