const fs = require('fs');

function fixCategory() {
  let code = fs.readFileSync('src/components/layout/CategoryClientContent.tsx', 'utf8');
  // We need to fix the stray `</>`, `)}` etc.
  
  // Find all AnimatePresence blocks and carefully replace them.
  // Actually, simpler: let's use a regex to match the whole block for mobile filter and sort!
  
  // First, let's fix the broken stuff:
  // We have `<\/>\n        \)\}` hanging around.
  code = code.replace(/<\/>\s*\)\}\s*<\/AnimatePresence>/g, ')}\n      </AnimatePresence>');
  code = code.replace(/<\/>\n        \)\}\n      <\/AnimatePresence>/g, ')}\n      </AnimatePresence>');

  // Wait, if the opening has no `(`, then `)}` is invalid.
  // The opening was: `{isMobileFilterOpen && <motion.div ... />} {isMobileFilterOpen && <motion.div ...`
  // The closing should just be `</motion.div> } </AnimatePresence>`!
  code = code.replace(/<\/motion\.div>\s*\)\}\s*<\/AnimatePresence>/g, '</motion.div>\n        }\n      </AnimatePresence>');
  
  // Let's replace `{isMobileFilterOpen && <motion.div` with `{isMobileFilterOpen && (<motion.div`
  // But wait, the first one is self-closing, so it's `{isMobileFilterOpen && <motion.div ... />}`
  // Let's just fix it by matching the whole block!

  fs.writeFileSync('src/components/layout/CategoryClientContent.tsx', code);
}

fixCategory();

function fixHeader() {
  let code = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');
  // It has a hanging `</>\n          )}\n        </AnimatePresence>` ?
  code = code.replace(/<\/>\s*\)\}\s*<\/AnimatePresence>/g, ')}\n        </AnimatePresence>');
  code = code.replace(/<\/motion\.div>\s*<\/>\s*\)\}\s*<\/AnimatePresence>/g, '</motion.div>\n        }\n        </AnimatePresence>');
  code = code.replace(/<\/motion\.div>\s*\)\}\s*<\/AnimatePresence>/g, '</motion.div>\n        }\n        </AnimatePresence>');
  fs.writeFileSync('src/components/layout/Header.tsx', code);
}

fixHeader();
