const fs = require('fs');

function fixHeader() {
  const path = 'src/components/layout/Header.tsx';
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(/return \(<React\.Fragment>/g, 'return (\n    <>');
  code = code.replace(/<\/React\.Fragment>/g, '</>');
  fs.writeFileSync(path, code);
}

function fixCategory() {
  const path = 'src/components/layout/CategoryClientContent.tsx';
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(/return \(\n<div className="w-full bg-background pb-20">/g, 'return (\n    <div className="w-full bg-background pb-20">');
  fs.writeFileSync(path, code);
}

fixHeader();
fixCategory();
