import fs from "fs";

function fix(path) {
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(/<React\.Fragment>/g, '<>');
  code = code.replace(/<\/React\.Fragment>/g, '</>');
  fs.writeFileSync(path, code);
}

fix('src/components/layout/Header.tsx');
fix('src/components/layout/CategoryClientContent.tsx');
