import { supabase } from './supabase';

export async function testSupabase() {
  const { data, error } = await supabase
    .from('categories')
    .select('*');

  console.log('SUPABASE DATA:', data);
  console.log('SUPABASE ERROR:', error);
}