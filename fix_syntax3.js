const fs = require('fs');

function fixCategory() {
  let code = fs.readFileSync('src/components/layout/CategoryClientContent.tsx', 'utf8');
  // Revert back to original valid structure using regex where we messed up.
  // We messed up AnimatePresence. Let's just fix it by replacing the bad ends.
  
  // replace <motion.div> } </AnimatePresence> with <motion.div>)}</AnimatePresence>
  code = code.replace(/<\/motion\.div>\n\s*\}\n\s*<\/AnimatePresence>/g, '</motion.div>\n        )}\n      </AnimatePresence>');
  code = code.replace(/<\/motion\.div>\n\s*\)\}\n\s*<\/AnimatePresence>/g, '</motion.div>\n        )}\n      </AnimatePresence>');

  // We also have `{isMobileFilterOpen && <motion.div` - let's make it `{isMobileFilterOpen && (<motion.div`
  code = code.replace(/\{isMobileFilterOpen && <motion\.div/g, '{isMobileFilterOpen && (<motion.div');
  code = code.replace(/\{isMobileSortOpen && <motion\.div/g, '{isMobileSortOpen && (<motion.div');

  // And the `return (\n<div` fix
  code = code.replace(/return <div className="w-full bg-background pb-20">/g, 'return (\n<div className="w-full bg-background pb-20">');

  fs.writeFileSync('src/components/layout/CategoryClientContent.tsx', code);
}

fixCategory();

function fixHeader() {
  let code = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');
  
  code = code.replace(/<\/motion\.div>\n\s*\}\n\s*<\/AnimatePresence>/g, '</motion.div>\n        )}\n        </AnimatePresence>');
  code = code.replace(/<\/motion\.div>\n\s*\)\}\n\s*<\/AnimatePresence>/g, '</motion.div>\n        )}\n        </AnimatePresence>');

  code = code.replace(/\{isMobileMenuOpen && <motion\.div/g, '{isMobileMenuOpen && (<motion.div');

  code = code.replace(/return <React\.Fragment>\n/g, 'return (\n<React.Fragment>\n');
  
  fs.writeFileSync('src/components/layout/Header.tsx', code);
}

fixHeader();
