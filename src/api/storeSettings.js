import { supabase } from './supabase';

export async function getStoreSettings() {
  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error loading store settings:', error);
    throw error;
  }

  return data?.[0] || null;
}

export async function createStoreSettings(payload) {
  const { data, error } = await supabase
    .from('store_settings')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateStoreSettings(id, payload) {
  const { data, error } = await supabase
    .from('store_settings')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return data;
}