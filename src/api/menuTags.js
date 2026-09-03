import { supabase } from './supabase';

export async function getMenuTags() {
  const { data, error } = await supabase
    .from('menu_tags')
    .select('*')
    .order('order', { ascending: true });

  if (error) {
    console.error('Error loading menu tags:', error);
    throw error;
  }

  return data || [];
}

export async function createMenuTag(payload) {
  const { data, error } = await supabase
    .from('menu_tags')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateMenuTag(id, payload) {
  const { data, error } = await supabase
    .from('menu_tags')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteMenuTag(id) {
  const { error } = await supabase
    .from('menu_tags')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function bulkUpdateMenuTags(records) {
  const { data, error } = await supabase
    .from('menu_tags')
    .upsert(records)
    .select();

  if (error) throw error;

  return data;
}