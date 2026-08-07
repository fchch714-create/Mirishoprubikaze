const fs = require('fs');

function fixHeader() {
  const path = 'src/components/layout/Header.tsx';
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(/return \(\n<React\.Fragment>\n/g, 'return (\n    <>\n');
  code = code.replace(/return \(<React\.Fragment>/g, 'return (\n    <>');
  code = code.replace(/<\/React\.Fragment>/g, '</>');
  fs.writeFileSync(path, code);
}

fixHeader();
