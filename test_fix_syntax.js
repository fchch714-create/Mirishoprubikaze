const fs = require('fs');

function fixCategory() {
  let code = fs.readFileSync('src/components/layout/CategoryClientContent.tsx', 'utf8');

  // Let's replace the last AnimatePresence things cleanly.
  // Wait, the error is at 526, 639, 640...
  // Let's just find `</motion.div>\n        )}\n      </AnimatePresence>` and make sure it's valid.

  // It says AnimatePresence has no corresponding closing tag.
  // This means I missed a `{isMobileFilterOpen && (<motion.div` -> needs `)}` to close the JSX expression!
  code = code.replace(/\{isMobileFilterOpen && \(<motion\.div/g, '{isMobileFilterOpen && (<motion.div');
  code = code.replace(/\{isMobileSortOpen && \(<motion\.div/g, '{isMobileSortOpen && (<motion.div');
  
  // To keep it simple, let's just make it NOT use `(`
  code = code.replace(/\{isMobileFilterOpen && \(<motion\.div/g, '{isMobileFilterOpen && <motion.div');
  code = code.replace(/\{isMobileSortOpen && \(<motion\.div/g, '{isMobileSortOpen && <motion.div');

  // If it's `{isMobileFilterOpen && <motion.div` then the closing is `</motion.div>}` NOT `</motion.div>)}`
  code = code.replace(/<\/motion\.div>\n\s*\)\}\n\s*<\/AnimatePresence>/g, '</motion.div>\n        }\n      </AnimatePresence>');
  code = code.replace(/<\/motion\.div>\n\s*\}\n\s*<\/AnimatePresence>/g, '</motion.div>\n        }\n      </AnimatePresence>');

  fs.writeFileSync('src/components/layout/CategoryClientContent.tsx', code);
}

fixCategory();

function fixHeader() {
  let code = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

  code = code.replace(/\{isMobileMenuOpen && \(<motion\.div/g, '{isMobileMenuOpen && <motion.div');
  
  code = code.replace(/<\/motion\.div>\n\s*\)\}\n\s*<\/AnimatePresence>/g, '</motion.div>\n        }\n        </AnimatePresence>');
  code = code.replace(/<\/motion\.div>\n\s*\}\n\s*<\/AnimatePresence>/g, '</motion.div>\n        }\n        </AnimatePresence>');

  fs.writeFileSync('src/components/layout/Header.tsx', code);
}

fixHeader();
