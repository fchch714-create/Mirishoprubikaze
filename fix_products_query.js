const fs = require('fs');
const path = 'src/lib/supabase/queries/products.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
`export async function getActiveProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true);
      
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
    
  return data as RawProduct[];
}`,
`export async function getActiveProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true);
        
    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }
      
    return data as RawProduct[];
  } catch (err) {
    console.error('Error fetching products (network/fetch):', err);
    return [];
  }
}`
);
fs.writeFileSync(path, code);
