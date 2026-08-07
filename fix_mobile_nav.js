const fs = require('fs');
let content = fs.readFileSync('src/components/layout/MobileBottomNav.tsx', 'utf8');

content = content.replace(
  `    ...(isAdmin ? [{
      name: dict.admin?.dashboard || 'Admin',
      href: \`/\${locale}/admin\`,
      icon: User,
    }] : []),`,
  `    {
      name: 'Kabinet',
      href: \`/\${locale}/account\`,
      icon: User,
    }`
);

fs.writeFileSync('src/components/layout/MobileBottomNav.tsx', content);
