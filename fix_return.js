const fs = require('fs');
let code = fs.readFileSync('src/components/layout/CategoryClientContent.tsx', 'utf8');
code = code.replace("return (\n    <div", "return <div");
fs.writeFileSync('src/components/layout/CategoryClientContent.tsx', code);

let codeHeader = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');
codeHeader = codeHeader.replace("return (\n    <>\n", "return <React.Fragment>\n");
fs.writeFileSync('src/components/layout/Header.tsx', codeHeader);
