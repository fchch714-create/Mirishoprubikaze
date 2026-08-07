const fs = require('fs');

function fixFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  if (filePath.includes('CategoryClientContent.tsx')) {
     code = code.replace(/return <div className="w-full bg-background pb-20">/g, 'return (\n<div className="w-full bg-background pb-20">');
     // add closing parenthesis if needed
     // actually the closing parenthesis was already there, but wait...
     // I replaced "return (\n    <div" with "return <div", meaning I removed the `(`. Did I remove the `)`? No, it was left dangling at the end!
     // So I should put the `(` back.
  }
  if (filePath.includes('Header.tsx')) {
     code = code.replace(/return <React\.Fragment>\n/g, 'return (\n<React.Fragment>\n');
  }
  fs.writeFileSync(filePath, code);
}

fixFile('src/components/layout/CategoryClientContent.tsx');
fixFile('src/components/layout/Header.tsx');
