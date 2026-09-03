import { supabase } from './supabase';

export async function getMenuItems() {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*');

  if (error) {
    console.error('Error loading menu items:', error);
    throw error;
  }

  return data || [];
}

export async function createMenuItem(payload) {
  const { data, error } = await supabase
    .from('menu_items')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateMenuItem(id, payload) {
  const { data, error } = await supabase
    .from('menu_items')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteMenuItem(id) {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function bulkCreateMenuItems(records) {
  const { data, error } = await supabase
    .from('menu_items')
    .insert(records)
    .select();

  if (error) throw error;

  return data || [];
}

export async function bulkUpdateMenuItems(records) {
  const { data, error } = await supabase
    .from('menu_items')
    .upsert(records)
    .select();

  if (error) throw error;

  return data || [];
}