import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, X, Save, GripVertical, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { Image } from '@/components/ui/image';

const empty = { name: '', name_th: '', icon_url: '', order: 0, is_filterable: false };

export default function MenuTagManager({ onSaved }) {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(empty);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.MenuTag.list();
      setTags((list || []).sort((a, b) => (a.order ?? 999) - (b.order ?? 999)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setDraft({ ...empty, order: tags.length }); setEditing('new'); };
  const openEdit = (t) => {
    setDraft({ name: t.name || '', name_th: t.name_th || '', icon_url: t.icon_url || '', order: t.order ?? 0, is_filterable: t.is_filterable || false });
    setEditing(t.id);
  };

  const save = async () => {
    const payload = { name: draft.name, name_th: draft.name_th, icon_url: draft.icon_url, order: Number(draft.order) || 0, is_filterable: !!draft.is_filterable };
    if (editing === 'new') {
      await base44.entities.MenuTag.create(payload);
    } else {
      await base44.entities.MenuTag.update(editing, payload);
    }
    setEditing(null);
    load();
    onSaved?.();
  };

  const remove = async (id) => {
    if (!confirm('Delete this tag?')) return;
    await base44.entities.MenuTag.delete(id);
    load();
    onSaved?.();
  };

  const move = async (idx, dir) => {
    const next = [...tags];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    const reordered = next.map((t, i) => ({ ...t, order: i }));
    setTags(reordered);
    await base44.entities.MenuTag.bulkUpdate(reordered.map((t) => ({ id: t.id, order: t.order })));
    onSaved?.();
  };

  return (
    <div className="space-y-3">
      <button
        onClick={openNew}
        className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white font-semibold py-3 rounded-2xl"
      >
        <Plus className="w-4 h-4" /> Add Menu Tag
      </button>
      <p className="text-xs text-stone-400 px-1">
        Create tags (e.g. Spicy, Vegetarian, Vegan) with an icon image. Assign them to menu items in the Menu Items editor.
      </p>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 border-4 border-stone-200 border-t-amber-600 rounded-full animate-spin" />
        </div>
      ) : tags.length === 0 ? (
        <p className="text-center text-stone-400 text-sm py-16">No tags yet.</p>
      ) : (
        tags.map((t, idx) => (
          <div key={t.id} className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-stone-100">
            <div className="flex flex-col">
              <button onClick={() => move(idx, -1)} className="text-stone-300 hover:text-stone-700"><ArrowUp className="w-3.5 h-3.5" /></button>
              <button onClick={() => move(idx, 1)} className="text-stone-300 hover:text-stone-700"><ArrowDown className="w-3.5 h-3.5" /></button>
            </div>
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-stone-100 shrink-0 flex items-center justify-center">
              {t.icon_url ? (
                <img src={t.icon_url} alt={t.name} className="w-full h-full object-contain" />
              ) : (
                <span className="text-[10px] text-stone-400">no img</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-stone-700">{t.name}</span>
              {t.is_filterable && <span className="ml-2 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">Filter pill</span>}
            </div>
            <button onClick={() => openEdit(t)} className="p-2 text-stone-400 hover:text-stone-900">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => remove(t.id)} className="p-2 text-stone-400 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))
      )}

      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-stone-100 sticky top-0 bg-white">
              <h2 className="font-bold text-stone-900">{editing === 'new' ? 'New Menu Tag' : 'Edit Menu Tag'}</h2>
              <button onClick={() => setEditing(null)} className="p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              <input placeholder="Tag name (EN) — e.g. Spicy" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
              <input placeholder="Tag name (TH) — e.g. เผ็ด" value={draft.name_th} onChange={(e) => setDraft({ ...draft, name_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
              <input placeholder="Icon image URL (png/svg)" value={draft.icon_url} onChange={(e) => setDraft({ ...draft, icon_url: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
              {draft.icon_url && (
                <div className="flex items-center gap-2 p-2 rounded-xl border border-stone-200">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-stone-100 shrink-0 flex items-center justify-center">
                    <img src={draft.icon_url} alt="" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-xs text-stone-500">Icon preview</span>
                </div>
              )}
              <input placeholder="Display order (0 = first)" type="number" value={draft.order} onChange={(e) => setDraft({ ...draft, order: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
              <button
                onClick={() => setDraft({ ...draft, is_filterable: !draft.is_filterable })}
                className={`flex items-center gap-2 w-full p-3 rounded-xl border transition-colors ${draft.is_filterable ? 'border-amber-500 bg-amber-50' : 'border-stone-200 bg-white'}`}
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center ${draft.is_filterable ? 'bg-stone-900 border-stone-900' : 'border-stone-300 bg-white'}`}>
                  {draft.is_filterable && <Check className="w-3 h-3 text-white" />}
                </span>
                <span className="text-sm text-stone-700 text-left">Show as collection filter pill in storefront</span>
              </button>
              <button onClick={save} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 mt-2">
                <Save className="w-4 h-4" /> Save Tag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}