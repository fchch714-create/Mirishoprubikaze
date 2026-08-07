import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
  const { data, error } = await supabase.from('products').select('*').ilike('slug', '%moyu-rs3m-v5-3x3%');
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
run();
