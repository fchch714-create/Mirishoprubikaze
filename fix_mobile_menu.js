const fs = require('fs');

let headerContent = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

// Add isCatalogOpen state
if (!headerContent.includes('isCatalogOpen')) {
  headerContent = headerContent.replace(
    "const [searchQuery, setSearchQuery] = React.useState('');",
    "const [searchQuery, setSearchQuery] = React.useState('');\n  const [isCatalogOpen, setIsCatalogOpen] = React.useState(false);"
  );
}

// Add overlay backdrop
const drawerStartRegex = /<AnimatePresence>\s*\{\s*isMobileMenuOpen\s*&&\s*\(\s*<motion\.div\s*initial=\{\{ x: '100%' \}\}/;
if (headerContent.match(drawerStartRegex)) {
  headerContent = headerContent.replace(
    drawerStartRegex,
    `<AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: '100%' }}`
  );
  // Also need to fix the closing fragment
  // Search for the end of the motion.div for the drawer.
  headerContent = headerContent.replace(
    /<\/motion\.div>\s*\)\}\s*<\/AnimatePresence>/,
    `</motion.div>
            </>
          )}
        </AnimatePresence>`
  );
}

const accordionSection = `<div className="border-t border-border pt-4 space-y-4">
                    <button 
                      onClick={() => setIsCatalogOpen(!isCatalogOpen)}
                      className="flex items-center justify-between w-full text-base font-bold text-foreground hover:text-rubik-brand transition-colors"
                    >
                      <span>{t({ az: 'Kataloq', en: 'Catalog', ru: 'Каталог' })}</span>
                      <ChevronDown className={\`w-5 h-5 transition-transform \${isCatalogOpen ? 'rotate-180' : ''}\`} />
                    </button>
                    
                    <AnimatePresence>
                      {isCatalogOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-4"
                        >
                          {rubikTaxonomyGroups.map((group) => (
                            <div key={group.id} className="space-y-2 mt-4 pl-4 border-l-2 border-border/50">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                {t(group.title)}
                              </h4>
                              <div className="grid grid-cols-2 gap-2">
                                {group.items.slice(0, 6).map((item) => (
                                  <Link
                                    key={item.id}
                                    href={\`/\${locale}?category=\${item.slug}\`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-sm font-medium text-foreground/80 hover:text-rubik-brand transition-colors py-1"
                                  >
                                    {t(item.title)}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>`;

const regex = /<div className="border-t border-border pt-4 space-y-4">[\s\S]*?\{rubikTaxonomyGroups\.map\(\(group\) => \([\s\S]*?<\/div>\s*<\/div>\s*\)\)\}\s*<\/div>/;
if (headerContent.match(regex)) {
   headerContent = headerContent.replace(regex, accordionSection);
} else {
   console.log("Could not find the links section exactly with regex.");
}

fs.writeFileSync('src/components/layout/Header.tsx', headerContent);
