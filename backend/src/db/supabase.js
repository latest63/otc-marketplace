import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

let supabase = null;

export function getSupabase() {
  if (supabase) return supabase;
  if (!supabaseUrl || !supabaseKey) return null;
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Supabase client ready');
  return supabase;
}
