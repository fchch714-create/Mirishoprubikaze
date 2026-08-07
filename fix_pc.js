const fs = require('fs');
let content = fs.readFileSync('src/components/ProductCard.tsx', 'utf8');

content = content.replace("setIsWishlisted(res.wishlisted);", "setIsWishlisted(res.wishlisted || false);");

fs.writeFileSync('src/components/ProductCard.tsx', content);
