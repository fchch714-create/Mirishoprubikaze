const fs = require('fs');
let content = fs.readFileSync('src/components/layout/CategoryClientContent.tsx', 'utf8');

// The string to replace is quite large, let's just use regex to remove fallbackCatalog array definition
// and change baseProducts definition
content = content.replace(/\/\/ Fallback high-fidelity speedcubing catalog[\s\S]*?\];/g, '');

content = content.replace(/\/\/ Merge database items if any, otherwise map fallbackCatalog\s*const baseProducts = React.useMemo\(\(\) => \{[\s\S]*?\}, \[initialProducts, categoryItem\]\);/g, `
  // Merge database items if any
  const baseProducts = React.useMemo(() => {
    const dbMapped = initialProducts.map(p => {
      return {
        ...p,
        category_slug: p.category_slug || (categoryItem ? categoryItem.slug : '3x3'),
        brand: p.brand || (p.title.includes('GAN') ? 'GAN' : p.title.includes('MoYu') ? 'MoYu' : p.title.includes('QiYi') ? 'QiYi' : 'Other'),
        mechanics: p.mechanics || (p.title.toLowerCase().includes('maglev') ? 'maglev' : p.title.toLowerCase().includes('ball-core') ? 'ball-core' : p.title.toLowerCase().includes('magnetic') ? 'magnetic' : 'standard')
      };
    });

    if (dbMapped.length > 0) {
      if (categoryItem) {
        return dbMapped.filter(p => p.category_slug === categoryItem.slug);
      }
      return dbMapped;
    }
    return [];
  }, [initialProducts, categoryItem]);
`);

// empty state handling
const productGridSearchStr = `{sortedProducts.map((product) => {`;
const emptyStateJSX = `
              {sortedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-border rounded-2xl bg-muted/20 w-full col-span-full">
                  <Sparkles className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Məhsullar tapılmadı
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Seçilmiş meyarlara uyğun məhsul tapılmadı.
                  </p>
                </div>
              ) : (
                sortedProducts.map((product) => {
`;
content = content.replace(productGridSearchStr, emptyStateJSX);

content = content.replace(`              </div>\n\n              {/* Pagination (Static UI) */}`, `              )}\n              </div>\n\n              {/* Pagination (Static UI) */}`);

fs.writeFileSync('src/components/layout/CategoryClientContent.tsx', content);
console.log("Success Category");
