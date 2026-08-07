const fs = require('fs');

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  // Fix CategoryClientContent.tsx
  if (filePath.includes('CategoryClientContent')) {
    // 1. Mobile Filter
    code = code.replace(
      /\{isMobileFilterOpen && \(\s*<>\s*<motion\.div/g,
      "{isMobileFilterOpen && (\n          <React.Fragment>\n            <motion.div key=\"backdrop-filter\""
    );
    // wait, React.Fragment inside AnimatePresence has the same issue. We must remove the Fragment!
    
    // Better: Replace <> and </> with nothing, and add keys to the motion divs.
    const filterOld = `{isMobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 bg-black z-50 lg:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}`;
    const filterNew = `{isMobileFilterOpen && <motion.div
              key="filter-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 bg-black z-50 lg:hidden"
            />}
            {isMobileFilterOpen && <motion.div
              key="filter-drawer"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}`;
    code = code.replace(filterOld, filterNew);
    
    // Cleanup the remaining </> for filter
    code = code.replace(/<\/button>\n              <\/div>\n            <\/motion\.div>\n          <\/>\n        \)\}\n      <\/AnimatePresence>/g,
                        `</button>\n              </div>\n            </motion.div>\n        )}\n      </AnimatePresence>`);

    // 2. Mobile Sort
    const sortOld = `{isMobileSortOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSortOpen(false)}
              className="fixed inset-0 bg-black z-50 lg:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}`;
    const sortNew = `{isMobileSortOpen && <motion.div
              key="sort-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSortOpen(false)}
              className="fixed inset-0 bg-black z-50 lg:hidden"
            />}
            {isMobileSortOpen && <motion.div
              key="sort-drawer"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}`;
    code = code.replace(sortOld, sortNew);
    
    // Cleanup the remaining </> for sort
    code = code.replace(/<\/Check className="h-5 w-5" \/>\}\n                  <\/button>\n                \)\)}\n              <\/div>\n            <\/motion\.div>\n          <\/>\n        \)\}\n      <\/AnimatePresence>/g,
                        `</button>\n                ))}\n              </div>\n            </motion.div>\n        )}\n      </AnimatePresence>`);
    
    code = code.replace(/<\/motion\.div>\n          <\/>\n        \)\}\n      <\/AnimatePresence>/g, `</motion.div>\n        )}\n      </AnimatePresence>`);
  }

  // Fix Header.tsx
  if (filePath.includes('Header')) {
    const mobileMenuOld = `{isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: '100%' }}`;
                
    const mobileMenuNew = `{isMobileMenuOpen && <motion.div
                key="menu-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />}
              {isMobileMenuOpen && <motion.div
                key="menu-drawer"
                initial={{ x: '100%' }}`;
    code = code.replace(mobileMenuOld, mobileMenuNew);
    
    code = code.replace(/<\/button>\n              <\/div>\n            <\/motion\.div>\n            <\/>\n          \)\}\n        <\/AnimatePresence>/g,
                        `</button>\n              </div>\n            </motion.div>\n          )}\n        </AnimatePresence>`);
  }

  fs.writeFileSync(filePath, code);
}

fixFile('src/components/layout/CategoryClientContent.tsx');
fixFile('src/components/layout/Header.tsx');
