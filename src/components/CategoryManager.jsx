import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
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
      const list = await base44.entities.Category.list();
      list.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      setCategories(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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
      await base44.entities.Category.bulkUpdate(
        categories.map((c, i) => ({ id: c.id, order: i }))
      );
      onSaved?.();
    } finally {
      setSavingOrder(false);
    }
  };

  const openNew = () => { setDraft({ name: '', name_th: '' }); setEditing('new'); };
  const openEdit = (cat) => { setDraft({ name: cat.name || '', name_th: cat.name_th || '' }); setEditing(cat.id); };

  const saveCategory = async () => {
    if (!draft.name.trim()) return;
    const payload = {
      name: draft.name.trim(),
      name_th: draft.name_th.trim(),
      order: editing === 'new' ? categories.length : (categories.find((c) => c.id === editing)?.order ?? categories.length),
    };
    if (editing === 'new') {
      await base44.entities.Category.create(payload);
    } else {
      await base44.entities.Category.update(editing, payload);
    }
    setEditing(null);
    load();
    onSaved?.();
  };

  const deleteCategory = async (id) => {
    if (!confirm('Delete this category? Menu items using it will keep their text but won\'t appear in the filter until reassigned.')) return;
    await base44.entities.Category.delete(id);
    load();
    onSaved?.();
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-stone-400 px-1">
        Create and reorder categories here. Menu items will pick from these via a dropdown.
      </p>

      {editing === 'new' && (
        <div className="bg-white rounded-2xl p-3 border border-amber-200 space-y-2">
          <input placeholder="Category name (EN)" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" autoFocus />
          <input placeholder="Category name (TH)" value={draft.name_th} onChange={(e) => setDraft({ ...draft, name_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
          <div className="flex gap-2">
            <button onClick={saveCategory} className="flex-1 bg-amber-600 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5"><Save className="w-4 h-4" /> Add</button>
            <button onClick={() => setEditing(null)} className="px-4 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-500"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {editing !== 'new' && (
        <button onClick={openNew} className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white font-semibold py-3 rounded-2xl">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-4 border-stone-200 border-t-amber-600 rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        editing !== 'new' && <p className="text-center text-stone-400 text-sm py-12">No categories yet. Create one above.</p>
      ) : (
        <>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="categories">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                  {categories.map((cat, i) => (
                    <Draggable key={cat.id} draggableId={cat.id} index={i}>
                      {(p) => (
                        <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps} className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-stone-100">
                          <GripVertical className="w-4 h-4 text-stone-300 shrink-0" />
                          {editing === cat.id ? (
                            <div className="flex-1 space-y-1.5">
                              <input placeholder="Name (EN)" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-amber-500" autoFocus />
                              <input placeholder="Name (TH)" value={draft.name_th} onChange={(e) => setDraft({ ...draft, name_th: e.target.value })} className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                              <div className="flex gap-1.5">
                                <button onClick={saveCategory} className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-medium flex items-center gap-1"><Check className="w-3 h-3" /> Save</button>
                                <button onClick={() => setEditing(null)} className="px-3 py-1 border border-stone-200 text-stone-500 rounded-lg text-xs">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-stone-900 block truncate">{cat.name}</span>
                                {cat.name_th && <span className="text-xs text-stone-400">{cat.name_th}</span>}
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0">
                                <button onClick={() => i > 0 && move(i, i - 1)} disabled={i === 0} className="p-1.5 text-stone-400 hover:text-stone-900 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                                <button onClick={() => i < categories.length - 1 && move(i, i + 1)} disabled={i === categories.length - 1} className="p-1.5 text-stone-400 hover:text-stone-900 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                                <button onClick={() => openEdit(cat)} className="p-1.5 text-stone-400 hover:text-stone-900"><Pencil className="w-4 h-4" /></button>
                                <button onClick={() => deleteCategory(cat.id)} className="p-1.5 text-stone-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
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
          <button onClick={saveOrder} disabled={savingOrder} className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> {savingOrder ? 'Saving…' : 'Save Order'}
          </button>
        </>
      )}
    </div>
  );
}