const fs = require('fs');
let content = fs.readFileSync('src/app/[locale]/product/[slug]/page.tsx', 'utf8');

const jsonLdCode = `  // JSON-LD Product Schema for outstanding SEO compliance
  const jsonLdSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: activeProduct.title,
    image: activeProduct.image_url,
    description: activeProduct.description,
    sku: activeProduct.sku,
    brand: {
      '@type': 'Brand',
      name: activeProduct.brand
    },
    offers: {
      '@type': 'Offer',
      url: \`https://rubikshop.az/\${locale}/product/\${activeProduct.id}\`,
      priceCurrency: 'AZN',
      price: activeProduct.price_azn.toString(),
      priceValidUntil: '2028-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: activeProduct.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Rubikshop.az'
      }
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '48'
    }
  };`;

// Remove the old jsonLdCode
content = content.replace(jsonLdCode, '');

// Put it after if (!activeProduct) return ...
const target = `  if (!activeProduct) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">Məhsul Tapılmadı</h1>
        <p className="text-muted-foreground">Axtardığınız məhsul mövcud deyil və ya artıq silinib.</p>
      </div>
    );
  }

  return (`;

const replace = `  if (!activeProduct) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">Məhsul Tapılmadı</h1>
        <p className="text-muted-foreground">Axtardığınız məhsul mövcud deyil və ya artıq silinib.</p>
      </div>
    );
  }

${jsonLdCode}

  return (`;

content = content.replace(target, replace);
fs.writeFileSync('src/app/[locale]/product/[slug]/page.tsx', content);
