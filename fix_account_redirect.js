const fs = require('fs');
const filePath = 'src/app/[locale]/account/page.tsx';
let code = fs.readFileSync(filePath, 'utf8');
code = code.replace("redirect(`/${locale}/login`);", "redirect(`/${locale}`);");
fs.writeFileSync(filePath, code);
