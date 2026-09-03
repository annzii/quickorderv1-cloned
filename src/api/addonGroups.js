import { supabase } from './supabase';

export async function getAddonGroups() {
  const { data, error } = await supabase
    .from('addon_groups')
    .select('*')
    .order('order', { ascending: true });

  if (error) {
    console.error('Error loading addon groups:', error);
    throw error;
  }

  return data || [];
}

export async function createAddonGroup(payload) {
  const { data, error } = await supabase
    .from('addon_groups')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateAddonGroup(id, payload) {
  const { data, error } = await supabase
    .from('addon_groups')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteAddonGroup(id) {
  const { error } = await supabase
    .from('addon_groups')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function bulkUpdateAddonGroups(records) {
  const { data, error } = await supabase
    .from('addon_groups')
    .upsert(records)
    .select();

  if (error) throw error;

  return data;
}

export async function bulkCreateAddonGroups(records) {
  const { data, error } = await supabase
    .from('addon_groups')
    .insert(records)
    .select();

  if (error) throw error;

  return data || [];
}