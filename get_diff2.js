const fs = require('fs');
let content = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');
const regex = /\{\/\* Mobile Menu Links \*\/\}.*?<\/div>.*?(?:<\/div>)*\s*<\/div>/s;
const match = content.match(regex);
if (match) console.log(match[0].substring(0, 1000));
