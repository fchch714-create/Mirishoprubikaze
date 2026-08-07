const fs = require('fs');
// check what's currently there in the menu
let content = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');
const regex = /\{dict\.navigation\.home\}[\s\S]*?<\/AnimatePresence>/;
const match = content.match(regex);
if (match) console.log(match[0]);
