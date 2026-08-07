const fs = require('fs');
let hc = fs.readFileSync('src/components/layout/HomepageContent.tsx', 'utf8');

const stateMatch = "  const [activeFaq, setActiveFaq] = React.useState<number | null>(null);";
if (hc.includes(stateMatch) && !hc.includes("currentBannerIndex")) {
    hc = hc.replace(
        stateMatch,
        stateMatch + "\n  const [currentBannerIndex, setCurrentBannerIndex] = React.useState(0);\n  React.useEffect(() => {\n    if (banners && banners.length > 1) {\n      const interval = setInterval(() => setCurrentBannerIndex((prev) => (prev + 1) % banners.length), 5000);\n      return () => clearInterval(interval);\n    }\n  }, [banners]);"
    );
}

// Check if we can replace the HERO SECTION
const heroStart = "{/* 1. HERO SECTION */}";
const heroEnd = "{/* 2. FEATURED CATEGORIES SECTION */}";
if (hc.includes(heroStart) && hc.includes(heroEnd)) {
    const startIndex = hc.indexOf(heroStart);
    const endIndex = hc.indexOf(heroEnd);
    const beforeHero = hc.substring(0, startIndex);
    const afterHero = hc.substring(endIndex);
    
    const newHero = `{/* 1. HERO SECTION */}
      <section className="relative bg-gradient-to-br from-rubik-charcoal via-rubik-charcoal-dark to-black text-white py-16 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-border/5 overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3182ce_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {banners.length > 0 ? (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentBannerIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-7 space-y-6 md:space-y-8"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rubik-brand/20 border border-rubik-brand/40 text-rubik-brand text-xs font-bold uppercase tracking-wider animate-pulse">
                  <Sparkles className="h-4 w-4" />
                  <span>{banners[currentBannerIndex][\`subtitle_\${locale}\`] || banners[currentBannerIndex].subtitle_az || t({ az: 'Xüsusi Təklif', en: 'Special Offer', ru: 'Специальное предложение' })}</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-white font-sans">
                  {banners[currentBannerIndex][\`title_\${locale}\`] || banners[currentBannerIndex].title_az}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href={banners[currentBannerIndex].link_url || '#'}
                    className="px-8 py-4 bg-rubik-brand text-white font-bold rounded-xl shadow-lg hover:bg-rubik-brand-dark hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 group cursor-pointer"
                  >
                    <span>{banners[currentBannerIndex][\`button_text_\${locale}\`] || banners[currentBannerIndex].button_text_az || t({ az: 'Kəşf Et', en: 'Explore', ru: 'Исследовать' })}</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="lg:col-span-5 flex justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentBannerIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="w-full max-w-sm rounded-3xl overflow-hidden shadow-soft-2xl relative aspect-square"
                >
                  <Image
                    src={banners[currentBannerIndex].image_url || "https://picsum.photos/seed/flagship3x3/500/500"}
                    alt={banners[currentBannerIndex][\`title_\${locale}\`] || 'Banner Image'}
                    fill
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
            
            {banners.length > 1 && (
              <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 flex gap-2">
                {banners.map((_, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setCurrentBannerIndex(idx)}
                    className={\`h-2 rounded-full transition-all \${idx === currentBannerIndex ? 'w-8 bg-rubik-brand' : 'w-2 bg-gray-600 hover:bg-gray-400'}\`} 
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            <div className="lg:col-span-7 space-y-6 md:space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rubik-brand/20 border border-rubik-brand/40 text-rubik-brand text-xs font-bold uppercase tracking-wider animate-pulse">
                <Sparkles className="h-4 w-4" />
                <span>{t({ az: 'Azərbaycan Speedcubing Flaqmanı', en: 'Azerbaijan Speedcubing Flagship', ru: 'Флагман Спидкубинга в Азербайджане' })}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-white font-sans">
                {t({
                  az: 'Sürətli Həllin Yeni Sərhədləri!',
                  en: 'New Frontiers of Speedcubing!',
                  ru: 'Новые рубежи спидкубинга!'
                })}
                <br />
                <span className="bg-gradient-to-r from-rubik-brand via-rubik-yellow to-rubik-green bg-clip-text text-transparent">
                  RubikShop.az
                </span>
              </h1>
              <p className="text-base md:text-xl text-gray-300 font-sans leading-relaxed max-w-2xl">
                {t({
                  az: 'Azərbaycanın ilk və tək ixtisaslaşmış mağazasında 100% orijinal GAN, MoYu və QiYi flaqmanlarını kəşf edin. Premium tənzimləmə xidməti ilə rekordlarınızı alt-üst edin!',
                  en: 'Discover 100% genuine GAN, MoYu, and QiYi flagships in Azerbaijan’s premier puzzle boutique. Destroy your personal records with our fine-tuning service!',
                  ru: 'Откройте для себя 100% оригинальные флагманы GAN, MoYu и QiYi в первом специализированном магазине Азербайджана. Побейте рекорды!'
                })}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => {
                    const element = document.getElementById('catalog-grid');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-8 py-4 bg-rubik-brand text-white font-bold rounded-xl shadow-lg hover:bg-rubik-brand-dark hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 group cursor-pointer"
                >
                  <span>{t({ az: 'Kataloqu Kəşf Et', en: 'Explore Catalog', ru: 'Исследовать каталог' })}</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
                </button>
                <button
                  onClick={() => {
                    const element = document.getElementById('learning-section');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-8 py-4 bg-rubik-charcoal-light/60 border border-border/20 hover:border-rubik-brand/40 text-gray-200 font-bold rounded-xl hover:bg-rubik-charcoal transition-all duration-300 flex items-center gap-2 cursor-pointer"
                >
                  <span>{t({ az: 'Alqoritmlər & Öyrənmə', en: 'Learn Algorithms', ru: 'Изучить алгоритмы' })}</span>
                </button>
              </div>

              {/* Quick Stats Banner */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/10 max-w-lg">
                <div>
                  <span className="block text-2xl md:text-3xl font-black text-rubik-brand font-mono">24h</span>
                  <span className="text-xs text-gray-400 font-sans">{t({ az: 'Sürətli Çatdırılma', en: 'Fast Delivery', ru: 'Быстрая доставка' })}</span>
                </div>
                <div>
                  <span className="block text-2xl md:text-3xl font-black text-rubik-yellow font-mono">100%</span>
                  <span className="text-xs text-gray-400 font-sans">{t({ az: 'Orijinal Brendlər', en: 'Genuine Brand', ru: 'Оригинальные бренды' })}</span>
                </div>
                <div>
                  <span className="block text-2xl md:text-3xl font-black text-rubik-green font-mono">5k+</span>
                  <span className="text-xs text-gray-400 font-sans">{t({ az: 'Məmnun Müştəri', en: 'Happy Cubers', ru: 'Довольные клиенты' })}</span>
                </div>
              </div>
            </div>

            {/* Right-side high-tech preview card */}
            <div className="lg:col-span-5 flex justify-center">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, type: 'spring' }}
                className="w-full max-w-sm bg-gradient-to-b from-rubik-charcoal-light to-rubik-charcoal border border-border/20 rounded-3xl p-6 shadow-soft-2xl relative"
              >
                <div className="absolute top-4 right-4 bg-rubik-yellow/15 border border-rubik-yellow/40 text-rubik-yellow text-[10px] font-black uppercase px-2 py-1 rounded-md">
                  HOT FLAGSHIP
                </div>

                <div className="relative aspect-square w-full bg-black/30 rounded-2xl overflow-hidden p-4 mb-5 flex items-center justify-center">
                  <Image
                    src="https://picsum.photos/seed/flagship3x3/500/500"
                    alt="Flagship Speedcube"
                    fill
                    referrerPolicy="no-referrer"
                    className="object-contain p-6 transform hover:rotate-12 transition-transform duration-500"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-white leading-tight">GAN 14 MagLev Pro 3x3</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">360° Ball-Core | UV-Coated</p>
                    </div>
                    <span className="text-xl font-black text-rubik-brand">159.00 AZN</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    <span className="px-2 py-0.5 bg-black/40 text-gray-300 text-[10px] font-bold rounded">MagLev</span>
                    <span className="px-2 py-0.5 bg-black/40 text-gray-300 text-[10px] font-bold rounded">UV Coated</span>
                    <span className="px-2 py-0.5 bg-black/40 text-gray-300 text-[10px] font-bold rounded">Ball-Core</span>
                    <span className="px-2 py-0.5 bg-black/40 text-gray-300 text-[10px] font-bold rounded">Adjustable</span>
                  </div>

                  <button
                    onClick={() => handleAddToCart({
                      id: 'gan-14-pro-flagship',
                      title: 'GAN 14 MagLev Pro 3x3 Speedcube',
                      price_azn: 159.00,
                      image_url: 'https://picsum.photos/seed/flagship3x3/500/500',
                      stock_quantity: 4
                    })}
                    className="w-full mt-3 bg-rubik-brand hover:bg-rubik-brand-dark text-white font-bold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>{dict.product.add_to_cart}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </section>
      
      `;
    
    hc = beforeHero + newHero + afterHero;
    fs.writeFileSync('src/components/layout/HomepageContent.tsx', hc);
}
