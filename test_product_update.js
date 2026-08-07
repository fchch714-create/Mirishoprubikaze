const { createClient } = require('@supabase/supabase-js');

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://npqecrxvllvuoxaybnoq.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    console.log('No SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  const supabase = createClient(url, key);

  const { data: products, error } = await supabase.from('products').select('*').limit(1);
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  if (products.length === 0) {
    console.log('No products in DB to test edit.');
    return;
  }

  const prod = products[0];
  console.log('Found product:', prod.id, prod.title_az);

  // Now try to update the product with the fields from ProductFormClient
  const payload = {
    title_az: prod.title_az + ' (Edited)',
    title_en: prod.title_en || 'English Title',
    title_ru: prod.title_ru || 'Russian Title',
    description_az: prod.description_az || 'Aze Desc',
    description_en: prod.description_en || 'Eng Desc',
    description_ru: prod.description_ru || 'Rus Desc',
    slug: prod.slug,
    price_azn: Number(prod.price_azn),
    compare_at_price_azn: prod.compare_at_price_azn ? Number(prod.compare_at_price_azn) : null,
    is_active: prod.is_active,
    is_featured: prod.is_featured || false,
    product_type: prod.product_type || 'speedcube',
    tags: prod.tags || [],
    seo_title: prod.seo_title || null,
    seo_description: prod.seo_description || null,
    weight_g: prod.weight_g !== null ? Number(prod.weight_g) : null,
    is_magnetic: prod.is_magnetic || false,
    size_mm: prod.size_mm !== null ? Number(prod.size_mm) : null,
    difficulty_level: prod.difficulty_level || 'başlanğıc',
  };

  const { data: updated, error: updateError } = await supabase
    .from('products')
    .update(payload)
    .eq('id', prod.id)
    .select();

  if (updateError) {
    console.error('Update error:', updateError.message, updateError.code, updateError.details);
  } else {
    console.log('Update successful! Result:', updated);
  }
}

main();
