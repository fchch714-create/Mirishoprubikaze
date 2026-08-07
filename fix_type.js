const fs = require('fs');

function fix(path) {
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(/obj\[locale as 'az' \| 'en' \| 'ru'\]/g, 'obj[locale as keyof typeof obj]');
  fs.writeFileSync(path, code);
}

fix('src/components/layout/Header.tsx');
fix('src/components/layout/CategoryClientContent.tsx');
