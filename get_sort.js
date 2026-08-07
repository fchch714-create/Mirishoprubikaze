const fs = require('fs');
let code = fs.readFileSync('src/components/layout/CategoryClientContent.tsx', 'utf8');

const sortRegex = /\{\/\* Sort dropdown \*\/\}[\s\S]*?<\/div>/;
const match = code.match(sortRegex);
if(match) console.log(match[0]);
