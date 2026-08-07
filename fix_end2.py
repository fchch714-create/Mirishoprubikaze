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
                {[
                  { id: 'newest', label: 'Ən Yenilər' },
                  { id: 'price_asc', label: 'Qiymət: Ucuzdan bahaya' },
                  { id: 'price_desc', label: 'Qiymət: Bahadan ucuza' },
                  { id: 'stock_high', label: 'Çox satılanlar' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSortOption(opt.id);
                      setIsMobileSortOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border ${sortOption === opt.id ? 'border-rubik-brand bg-rubik-brand/5 text-rubik-brand font-bold' : 'border-border bg-card hover:bg-muted/50 text-foreground'} transition-colors`}
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

