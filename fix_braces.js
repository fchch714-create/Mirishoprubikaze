const fs = require('fs');

let code = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');
code = code.replace(/181-                      <\/motion\.div>\n182-        }\n183:        <\/AnimatePresence>/g, ''); // wait, this is just terminal output.

code = code.replace(/<\/motion\.div>\n        }\n        <\/AnimatePresence>/g, '</motion.div>\n        )}\n        </AnimatePresence>');
// Wait, isMobileMenuOpen didn't have ( in my previous script? 
// Let's just make sure ALL of them use )}, and we ADD the ( back!
