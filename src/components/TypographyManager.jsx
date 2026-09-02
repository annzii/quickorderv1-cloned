import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useTypography } from '@/lib/typographyContext';
import TypographyControls from '@/components/TypographyControls';
import { Save } from 'lucide-react';

const EN_DEFAULTS = { heading_font: 'Instrument Serif', body_font: 'Work Sans', h1_size: '1.875rem', h2_size: '1.5rem', h3_size: '1.25rem', body_size: '0.875rem', small_size: '0.75rem', letter_spacing: 'normal', line_height: '1.5', shop_desc_size: '10px', shop_desc_letter_spacing: '1.792px', shop_desc_line_height: '1.1', shop_desc_weight: '400', cat_filter_size: '11.2px', cat_filter_letter_spacing: '1.792px', cat_filter_weight: '400' };
const TH_DEFAULTS = { heading_font: 'IBM Plex Sans Thai', body_font: 'IBM Plex Sans Thai', h1_size: '1.875rem', h2_size: '1.5rem', h3_size: '1.25rem', body_size: '0.875rem', small_size: '0.75rem', letter_spacing: 'normal', line_height: '1.6', shop_desc_size: '10px', shop_desc_letter_spacing: 'normal', shop_desc_line_height: '1.1', shop_desc_weight: '400', cat_filter_size: '11.2px', cat_filter_letter_spacing: 'normal', cat_filter_weight: '400' };

export default function TypographyManager({ settings, onSaved }) {
  const { applyPreview, resetToSaved, refresh } = useTypography();
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const typo = settings?.typography || {};
    setDraft({ en: { ...EN_DEFAULTS, ...(typo.en || {}) }, th: { ...TH_DEFAULTS, ...(typo.th || {}) } });
  }, [settings]);

  useEffect(() => { if (draft) applyPreview(draft); }, [draft, applyPreview]);
  useEffect(() => () => resetToSaved(), [resetToSaved]);

  const update = (lang, field, value) => setDraft((d) => ({ ...d, [lang]: { ...d[lang], [field]: value } }));

  const save = async () => {
    if (!settings?.id) return;
    setSaving(true);
    try {
      await base44.entities.StoreSettings.update(settings.id, { typography: draft });
      await refresh();
      onSaved();
    } finally { setSaving(false); }
  };

  if (!settings) return <p className="text-center text-stone-400 text-sm py-16">Save store settings first to manage typography.</p>;
  if (!draft) return null;

  return (
    <div className="space-y-4">
      <p className="text-xs text-stone-400 px-1">Changes preview live across the app. Save to persist.</p>
      {['en', 'th'].map((lang) => (
        <div key={lang} className="bg-white rounded-2xl p-4 border border-stone-100">
          <h3 className="text-sm font-bold text-stone-900 mb-3">{lang === 'en' ? 'English' : 'Thai'} Typography</h3>
          <TypographyControls lang={lang} values={draft[lang]} onChange={(field, val) => update(lang, field, val)} />
        </div>
      ))}
      <button onClick={save} disabled={saving} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
        <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Typography'}
      </button>
    </div>
  );
}