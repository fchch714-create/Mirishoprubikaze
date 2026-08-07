const fs = require('fs');
let hc = fs.readFileSync('src/components/layout/HomepageContent.tsx', 'utf8');
if (!hc.includes('banners?: any[];')) {
    hc = hc.replace(
        "locale: string;\n}",
        "locale: string;\n  banners?: any[];\n}"
    );
    hc = hc.replace(
        "export function HomepageContent({ products, dict, locale }: HomepageContentProps) {",
        "export function HomepageContent({ products, dict, locale, banners = [] }: HomepageContentProps) {"
    );
    fs.writeFileSync('src/components/layout/HomepageContent.tsx', hc);
}
