import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '@/lib/supabase';
import { GripVertical, Plus, Pencil, Trash2, X, Save, ArrowUp, ArrowDown, Check } from 'lucide-react';

export default function CategoryManager({ onSaved }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({ name: '', name_th: '' });

  const load = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;

      const list = data || [];
      list.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      setCategories(list);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const move = (from, to) => {
    const next = [...categories];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setCategories(next);
  };

  const onDragEnd = (res) => {
    if (res.destination && res.destination.index !== res.source.index) {
      move(res.source.index, res.destination.index);
    }
  };

  const saveOrder = async () => {
    setSavingOrder(true);

    try {
      const updates = categories.map((c, i) =>
        supabase
          .from('categories')
          .update({ order: i })
          .eq('id', c.id)
      );

      const results = await Promise.all(updates);

      const error = results.find((result) => result.error)?.error;

      if (error) throw error;

      await load();
      onSaved?.();
    } catch (error) {
      console.error('Error saving category order:', error);
      alert('Could not save category order.');
    } finally {
      setSavingOrder(false);
    }
  };

  const openNew = () => {
    setDraft({ name: '', name_th: '' });
    setEditing('new');
  };

  const openEdit = (cat) => {
    setDraft({
      name: cat.name || '',
      name_th: cat.name_th || ''
    });
    setEditing(cat.id);
  };

  const saveCategory = async () => {
    if (!draft.name.trim()) return;

    const existingOrder =
      editing === 'new'
        ? categories.length
        : (categories.find((c) => c.id === editing)?.order ?? categories.length);

    const payload = {
      name: draft.name.trim(),
      name_th: draft.name_th.trim(),
      order: existingOrder
    };

    try {
      if (editing === 'new') {
        const { error } = await supabase
          .from('categories')
          .insert([payload]);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editing);

        if (error) throw error;
      }

      setEditing(null);
      await load();
      onSaved?.();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Could not save category.');
    }
  };

  const deleteCategory = async (id) => {
    if (
      !confirm(
        "Delete this category? Menu items using it will keep their text but won't appear in the filter until reassigned."
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await load();
      onSaved?.();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Could not delete category.');
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-stone-400 px-1">
        Create and reorder categories here. Menu items will pick from these via a dropdown.
      </p>

      {editing === 'new' && (
        <div className="bg-white rounded-2xl p-3 border border-amber-200 space-y-2">
          <input
            placeholder="Category name (EN)"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500"
            autoFocus
          />

          <input
            placeholder="Category name (TH)"
            value={draft.name_th}
            onChange={(e) => setDraft({ ...draft, name_th: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500"
          />

          <div className="flex gap-2">
            <button
              onClick={saveCategory}
              className="flex-1 bg-amber-600 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Add
            </button>

            <button
              onClick={() => setEditing(null)}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {editing !== 'new' && (
        <button
          onClick={openNew}
          className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white font-semibold py-3 rounded-2xl"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-4 border-stone-200 border-t-amber-600 rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        editing !== 'new' && (
          <p className="text-center text-stone-400 text-sm py-12">
            No categories yet. Create one above.
          </p>
        )
      ) : (
        <>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="categories">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-2"
                >
                  {categories.map((cat, i) => (
                    <Draggable
                      key={cat.id}
                      draggableId={String(cat.id)}
                      index={i}
                    >
                      {(p) => (
                        <div
                          ref={p.innerRef}
                          {...p.draggableProps}
                          {...p.dragHandleProps}
                          className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-stone-100"
                        >
                          <GripVertical className="w-4 h-4 text-stone-300 shrink-0" />

                          {editing === cat.id ? (
                            <div className="flex-1 space-y-1.5">
                              <input
                                placeholder="Name (EN)"
                                value={draft.name}
                                onChange={(e) =>
                                  setDraft({ ...draft, name: e.target.value })
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-amber-500"
                                autoFocus
                              />

                              <input
                                placeholder="Name (TH)"
                                value={draft.name_th}
                                onChange={(e) =>
                                  setDraft({ ...draft, name_th: e.target.value })
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-amber-500"
                              />

                              <div className="flex gap-1.5">
                                <button
                                  onClick={saveCategory}
                                  className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" /> Save
                                </button>

                                <button
                                  onClick={() => setEditing(null)}
                                  className="px-3 py-1 border border-stone-200 text-stone-500 rounded-lg text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-stone-900 block truncate">
                                  {cat.name}
                                </span>

                                {cat.name_th && (
                                  <span className="text-xs text-stone-400">
                                    {cat.name_th}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                  onClick={() => i > 0 && move(i, i - 1)}
                                  disabled={i === 0}
                                  className="p-1.5 text-stone-400 hover:text-stone-900 disabled:opacity-30"
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() =>
                                    i < categories.length - 1 && move(i, i + 1)
                                  }
                                  disabled={i === categories.length - 1}
                                  className="p-1.5 text-stone-400 hover:text-stone-900 disabled:opacity-30"
                                >
                                  <ArrowDown className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => openEdit(cat)}
                                  className="p-1.5 text-stone-400 hover:text-stone-900"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => deleteCategory(cat.id)}
                                  className="p-1.5 text-stone-400 hover:text-red-500"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <button
            onClick={saveOrder}
            disabled={savingOrder}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {savingOrder ? 'Saving…' : 'Save Order'}
          </button>
        </>
      )}
    </div>
  );
}