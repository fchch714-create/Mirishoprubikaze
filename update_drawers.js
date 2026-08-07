const fs = require('fs');
let code = fs.readFileSync('src/components/layout/CategoryClientContent.tsx', 'utf8');

// Replace sort dropdown
const sortOld = `{/* Sort dropdown */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-rubik-brand font-semibold cursor-pointer"
                  >
                    <option value="newest">Ən Yenilər</option>
                    <option value="price_asc">Qiymət: Ucuzdan bahaya</option>
                    <option value="price_desc">Qiymət: Bahadan ucuza</option>
                    <option value="stock_high">Anbarda olanlar</option>
                  </select>
                </div>`;

const sortNew = `{/* Sort Logic */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="hidden lg:block h-4 w-4 text-muted-foreground" />
                  {/* Desktop Select */}
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="hidden lg:block bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-rubik-brand font-semibold cursor-pointer"
                  >
                    <option value="newest">Ən Yenilər</option>
                    <option value="price_asc">Qiymət: Ucuzdan bahaya</option>
                    <option value="price_desc">Qiymət: Bahadan ucuza</option>
                    <option value="stock_high">Anbarda olanlar</option>
                  </select>

                  {/* Mobile Sort Trigger */}
                  <button
                    onClick={() => setIsMobileSortOpen(true)}
                    className="lg:hidden flex items-center gap-1.5 px-4 py-2.5 bg-muted hover:bg-muted-dark border border-border rounded-xl text-sm font-semibold text-foreground cursor-pointer"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    <span>Sıralama</span>
                  </button>
                </div>`;

code = code.replace(sortOld, sortNew);

const filterDrawerRegex = /\{\/\* Slide-out Mobile Filter Drawer \*\/\}[\s\S]*?<\/AnimatePresence>/;
const filterDrawerNew = `{/* Slide-up Mobile Filter Bottom Sheet */}
      <AnimatePresence>
        {isMobileFilterOpen && (
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
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 w-full max-h-[85vh] bg-card rounded-t-3xl border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col p-6 lg:hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted-foreground/20 rounded-full mt-3" />
              
              <div className="flex items-center justify-between border-b border-border pb-4 mt-2">
                <h3 className="font-bold text-foreground">Filtrlər</h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1.5 bg-muted hover:bg-muted-dark rounded-full text-foreground transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 space-y-6">
                {/* Brand Filter (Mobile) */}
                {availableBrands.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Brend</h4>
                    <div className="space-y-2.5">
                      {availableBrands.map(brand => (
                        <label key={brand} className="flex items-center gap-2.5 text-sm font-medium text-foreground cursor-pointer group">
                          <div className={\`h-4.5 w-4.5 rounded border flex items-center justify-center transition-all \${
                            selectedBrands.includes(brand)
                              ? 'bg-rubik-brand border-rubik-brand text-white'
                              : 'border-border group-hover:border-foreground/30 bg-muted/40'
                          }\`}>
                            {selectedBrands.includes(brand) && <Check className="h-3.5 w-3.5" />}
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedBrands.includes(brand)}
                            onChange={() => handleBrandChange(brand)}
                            className="sr-only"
                          />
                          <span>{brand}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mechanics Filter (Mobile) */}
                {availableMechanics.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-border">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mexanika</h4>
                    <div className="space-y-2.5">
                      {availableMechanics.map(mech => (
                        <label key={mech} className="flex items-center gap-2.5 text-sm font-medium text-foreground cursor-pointer group">
                          <div className={\`h-4.5 w-4.5 rounded border flex items-center justify-center transition-all \${
                            selectedMechanics.includes(mech)
                              ? 'bg-rubik-brand border-rubik-brand text-white'
                              : 'border-border group-hover:border-foreground/30 bg-muted/40'
                          }\`}>
                            {selectedMechanics.includes(mech) && <Check className="h-3.5 w-3.5" />}
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedMechanics.includes(mech)}
                            onChange={() => handleMechanicsChange(mech)}
                            className="sr-only"
                          />
                          <span className="capitalize">{mech === 'maglev' ? 'MagLev' : mech === 'ball-core' ? 'Ball-Core' : mech === 'magnetic' ? 'Magnetic' : 'Standard'}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Filter (Mobile) */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Qiymət</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{minPrice} AZN</span>
                      <span>{maxPrice} AZN</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="250"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full accent-rubik-brand cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full py-3 bg-rubik-brand text-white font-bold rounded-xl text-sm hover:bg-rubik-brand-dark transition-colors cursor-pointer"
                >
                  Təsdiqlə
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Slide-up Mobile Sort Bottom Sheet */}
      <AnimatePresence>
        {isMobileSortOpen && (
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
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 w-full bg-card rounded-t-3xl border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col p-6 lg:hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted-foreground/20 rounded-full mt-3" />
              
              <div className="flex items-center justify-between border-b border-border pb-4 mt-2">
                <h3 className="font-bold text-foreground">Sıralama</h3>
                <button
                  onClick={() => setIsMobileSortOpen(false)}
                  className="p-1.5 bg-muted hover:bg-muted-dark rounded-full text-foreground transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-col py-4 gap-2">
                {[
                  { value: 'newest', label: 'Ən Yenilər' },
                  { value: 'price_asc', label: 'Qiymət: Ucuzdan bahaya' },
                  { value: 'price_desc', label: 'Qiymət: Bahadan ucuza' },
                  { value: 'stock_high', label: 'Anbarda olanlar' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortOption(opt.value);
                      setIsMobileSortOpen(false);
                    }}
                    className={\`flex items-center justify-between p-4 rounded-xl text-left font-bold transition-all cursor-pointer \${
                      sortOption === opt.value
                        ? 'bg-rubik-brand/10 text-rubik-brand border border-rubik-brand/20'
                        : 'bg-muted hover:bg-muted-dark text-foreground border border-transparent'
                    }\`}
                  >
                    <span>{opt.label}</span>
                    {sortOption === opt.value && <Check className="h-5 w-5" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>`;

code = code.replace(filterDrawerRegex, filterDrawerNew);

fs.writeFileSync('src/components/layout/CategoryClientContent.tsx', code);
