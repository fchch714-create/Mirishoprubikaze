const fs = require('fs');
let code = fs.readFileSync('src/components/layout/CategoryClientContent.tsx', 'utf8');

// 1. URL state replacing
const urlSyncRegex = /const updateUrlParams = React\.useCallback\(\(\) => \{[\s\S]*?\}, \[.*?\]\);/;
const newUrlSync = `const updateUrlParams = React.useCallback(() => {
    const params = new URLSearchParams();
    if (minPrice > 0) params.set('min_price', minPrice.toString());
    if (maxPrice < 250) params.set('max_price', maxPrice.toString());
    if (selectedBrands.length > 0) params.set('brands', selectedBrands.join(','));
    if (selectedMechanics.length > 0) params.set('mechanics', selectedMechanics.join(','));
    if (sortOption !== 'newest') params.set('sort', sortOption);

    window.history.replaceState(null, '', \`\${pathname}?\${params.toString()}\`);
  }, [minPrice, maxPrice, selectedBrands, selectedMechanics, sortOption, pathname]);`;

code = code.replace(urlSyncRegex, newUrlSync);

// 2. Add isMobileSortOpen
code = code.replace(
  "const [isMobileFilterOpen, setIsMobileFilterOpen] = React.useState(false);",
  "const [isMobileFilterOpen, setIsMobileFilterOpen] = React.useState(false);\n  const [isMobileSortOpen, setIsMobileSortOpen] = React.useState(false);"
);

fs.writeFileSync('src/components/layout/CategoryClientContent.tsx', code);
