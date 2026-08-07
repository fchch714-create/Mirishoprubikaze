import sys

def replace_from(path, search_str, replacement):
    with open(path, 'r') as f:
        code = f.read()
    
    idx = code.find(search_str)
    if idx != -1:
        code = code[:idx] + replacement
    
    with open(path, 'w') as f:
        f.write(code)

replace_from('src/components/layout/CategoryClientContent.tsx', '{isMobileSortOpen &&', 
"""{isMobileSortOpen && (
          <React.Fragment>
            <motion.div
              key="sort-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSortOpen(false)}
              className="fixed inset-0 bg-black z-50 lg:hidden"
            />
            <motion.div
              key="sort-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-3xl overflow-hidden lg:hidden flex flex-col max-h-[85vh] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-border"
            >
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-lg text-foreground">Sıralama</h3>
                <button onClick={() => setIsMobileSortOpen(false)} className="p-2 -mr-2 bg-background border border-border rounded-full text-muted-foreground hover:text-foreground">
                  X
                </button>
              </div>
              <div className="p-4 overflow-y-auto space-y-2 pb-[100px]">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSortBy(opt.id);
                      setIsMobileSortOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border ${sortBy === opt.id ? 'border-rubik-brand bg-rubik-brand/5 text-rubik-brand font-bold' : 'border-border bg-card hover:bg-muted/50 text-foreground'} transition-colors`}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>
    </div>
  );
}
""")

replace_from('src/components/layout/Header.tsx', '{isMobileMenuOpen &&', 
"""{isMobileMenuOpen && (
          <React.Fragment>
            <motion.div
              key="menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              key="menu-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-card z-50 shadow-2xl flex flex-col lg:hidden border-r border-border"
            >
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <span className="font-bold text-xl text-foreground">Menu</span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 bg-muted rounded-full text-foreground hover:bg-muted/80 transition-colors cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="p-4 space-y-6">
                  <div className="space-y-1">
                    <button 
                      onClick={() => setIsCatalogOpen(!isCatalogOpen)}
                      className="flex items-center justify-between w-full text-base font-bold text-foreground hover:text-rubik-brand transition-colors cursor-pointer py-2"
                    >
                      <span>Kataloq</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-border bg-muted/10 space-y-4 pb-[80px]">
                <button
                  onClick={() => {
                    if (user) router.push(`/${locale}/account`);
                    else openModal('login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full inline-flex items-center justify-center px-4 py-3 bg-foreground text-card text-sm font-semibold rounded-lg hover:bg-foreground/90 transition-colors cursor-pointer"
                >
                  Şəxsi Kabinet
                </button>
              </div>
            </motion.div>
          </React.Fragment>
        )}
        </AnimatePresence>
      </header>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        dict={dict}
        locale={locale}
      />
    </React.Fragment>
  );
}
""")
