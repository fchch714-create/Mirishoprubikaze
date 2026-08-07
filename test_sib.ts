import * as dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
  const fallback = await supabase
    .from('products')
    .select('*, group_slug, variant_name, brands(*), categories(*)')
    .eq('group_slug', 'moyu-rs3m-v5')
    .eq('is_active', true);
  console.log('fallback length:', fallback.data?.length);
}
run();
