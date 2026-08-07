import re

with open('src/components/layout/Header.tsx', 'r') as f:
    code = f.read()

# Fix 1: activeMegaMenu
code = re.sub(
    r'(</motion\.div>)\s*}\s*(</AnimatePresence>)',
    r'\1\n        )}\n        \2',
    code,
    count=2 # the first two are activeMegaMenu and isSearchOpen
)

with open('src/components/layout/Header.tsx', 'w') as f:
    f.write(code)

