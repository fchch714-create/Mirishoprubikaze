import React from 'react';

interface ProductSchemaProps {
  productName: string;
  image: string;
  price: string | number;
  currency: string;
}

export default function ProductSchema({
  productName,
  image,
  price,
  currency,
}: ProductSchemaProps) {
  const schema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: productName,
    image: [image],
    offers: {
      '@type': 'Offer',
      priceCurrency: currency,
      price: price,
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
