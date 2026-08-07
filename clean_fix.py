import re

def fix_file(path):
    with open(path, 'r') as f:
        code = f.read()

    # First, let's normalize all </motion.div> \n } \n </AnimatePresence> and </motion.div> \n )} \n </AnimatePresence> to just }
    # Then we will carefully match the opening tags.
    
    # Actually, simpler:
    code = code.replace("        }\n        </AnimatePresence>", "        )}\n        </AnimatePresence>")
    code = code.replace("        }\n      </AnimatePresence>", "        )}\n      </AnimatePresence>")

    # If it was already )}, it became )))}, so let's clean that
    code = code.replace(")))}\n", ")}\n")
    code = code.replace("))}\n", ")}\n")

    # For the ones that start with `<motion.div` instead of `(<motion.div`, we should make sure they start with `(`
    code = code.replace("{isMobileMenuOpen && <motion.div", "{isMobileMenuOpen && (<motion.div")
    code = code.replace("{isMobileFilterOpen && <motion.div", "{isMobileFilterOpen && (<motion.div")
    code = code.replace("{isMobileSortOpen && <motion.div", "{isMobileSortOpen && (<motion.div")

    with open(path, 'w') as f:
        f.write(code)

fix_file('src/components/layout/Header.tsx')
fix_file('src/components/layout/CategoryClientContent.tsx')
