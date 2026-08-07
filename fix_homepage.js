const fs = require('fs');
let content = fs.readFileSync('src/components/layout/HomepageContent.tsx', 'utf8');

const emptyState = `
          {getActiveProducts().length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-border rounded-2xl bg-muted/20">
              <Sparkles className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-foreground mb-2">
                {t({ az: 'Məhsullar tapılmadı', en: 'No products found', ru: 'Продукты не найдены' })}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {t({ az: 'Tezliklə yeni məhsullar əlavə ediləcək.', en: 'New products will be added soon.', ru: 'Скоро будут добавлены новые продукты.' })}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {getActiveProducts().map((product) => {
`;

content = content.replace(
  `          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">\n            {getActiveProducts().map((product) => {`,
  emptyState
);

content = content.replace(
  `              );\n            })}\n          </div>`,
  `              );\n            })}\n            </div>\n          )}`
);

fs.writeFileSync('src/components/layout/HomepageContent.tsx', content);
console.log("Success");
