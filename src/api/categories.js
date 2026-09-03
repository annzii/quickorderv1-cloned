import { supabase } from './supabase';

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('order', { ascending: true });

  if (error) {
    console.error('Error loading categories:', error);
    throw error;
  }

  return data || [];
}

export async function createCategory(payload) {
  const { data, error } = await supabase
    .from('categories')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateCategory(id, payload) {
  const { data, error } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function bulkUpdateCategories(records) {
  const { data, error } = await supabase
    .from('categories')
    .upsert(records)
    .select();

  if (error) throw error;

  return data;
}

export async function bulkCreateCategories(records) {
  const { data, error } = await supabase
    .from('categories')
    .insert(records)
    .select();

  if (error) throw error;

  return data || [];
}