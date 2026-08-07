import fs from 'fs';
const file = 'src/app/[locale]/checkout/success/page.tsx';
let content = fs.readFileSync(file, 'utf8');
if (!content.includes("'use client'")) {
  fs.writeFileSync(file, "'use client';\n" + content);
}
