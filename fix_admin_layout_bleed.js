const fs = require('fs');

function fixFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // Find the component function start
  const compRegex = /export\s+function\s+([A-Za-z0-9_]+)\s*\([^)]*\)\s*\{/;
  
  // First, remove our previous broken injection
  code = code.replace(/  if \(pathname\?\.includes\('\/admin'\)\) return null;\n/g, '');
  
  // Also remove the existing `const pathname = usePathname();` if it exists, so we can move it to the top
  code = code.replace(/  const pathname = usePathname\(\);\n/g, '');

  const match = code.match(compRegex);
  
  if (match) {
    const adminCheck = `\n  const pathname = usePathname();\n  if (pathname?.includes('/admin')) return null;\n`;
    
    code = code.replace(compRegex, (matchStr) => {
      return matchStr + adminCheck;
    });
    
    fs.writeFileSync(filePath, code);
  }
}

fixFile('src/components/layout/Header.tsx');
fixFile('src/components/layout/Footer.tsx');
fixFile('src/components/layout/MobileBottomNav.tsx');
