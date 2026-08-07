import fs from "fs";
let code = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');
code = code.replace(/<>/g, '<React.Fragment>');
code = code.replace(/<\/>/g, '</React.Fragment>');
fs.writeFileSync('src/components/layout/Header.tsx', code);
