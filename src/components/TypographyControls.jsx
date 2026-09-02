import React from 'react';

const FONT_OPTIONS = [
  { value: 'Instrument Serif', label: 'Instrument Serif' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond' },
  { value: 'Lora', label: 'Lora' },
  { value: 'EB Garamond', label: 'EB Garamond' },
  { value: 'Work Sans', label: 'Work Sans' },
  { value: 'Inter', label: 'Inter' },
  { value: 'DM Sans', label: 'DM Sans' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'IBM Plex Sans Thai', label: 'IBM Plex Sans Thai' },
  { value: 'Sarabun', label: 'Sarabun' },
  { value: 'Noto Sans Thai', label: 'Noto Sans Thai' },
  { value: 'Prompt', label: 'Prompt' },
];

const SERIF_FONTS = ['Instrument Serif', 'Playfair Display', 'Cormorant Garamond', 'Lora', 'EB Garamond'];
const fallback = (f) => (SERIF_FONTS.includes(f) ? 'serif' : 'sans-serif');
const fontStack = (f) => `'${f}', ${fallback(f)}`;

const SIZES = [
  { key: 'h1_size', label: 'H1' },
  { key: 'h2_size', label: 'H2' },
  { key: 'h3_size', label: 'H3' },
  { key: 'body_size', label: 'Body' },
  { key: 'small_size', label: 'Small' },
];

const WEIGHT_OPTIONS = [
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semibold' },
  { value: '700', label: 'Bold' },
];

const WEIGHTS = [
  { key: 'h1_weight', label: 'H1' },
  { key: 'h2_weight', label: 'H2' },
  { key: 'h3_weight', label: 'H3' },
  { key: 'body_weight', label: 'Body' },
];

export default function TypographyControls({ lang, values, onChange }) {
  const previewText = lang === 'th' ? 'ตัวอย่างข้อความสำหรับเนื้อหา' : 'Body text sample for preview.';
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-stone-500 block mb-1">Heading Font</label>
        <select value={values.heading_font} onChange={(e) => onChange('heading_font', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500">
          {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-stone-500 block mb-1">Body Font</label>
        <select value={values.body_font} onChange={(e) => onChange('body_font', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500">
          {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {SIZES.map(({ key, label }) => (
          <div key={key}>
            <label className="text-[10px] text-stone-500 block mb-0.5">{label} size</label>
            <input type="text" value={values[key]} onChange={(e) => onChange(key, e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:border-amber-500" placeholder="1.5rem" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {WEIGHTS.map(({ key, label }) => (
          <div key={key}>
            <label className="text-[10px] text-stone-500 block mb-0.5">{label} weight</label>
            <select value={values[key]} onChange={(e) => onChange(key, e.target.value)} className="w-full px-1 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:border-amber-500">
              {WEIGHT_OPTIONS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-stone-500 block mb-0.5">Letter spacing</label>
          <input type="text" value={values.letter_spacing} onChange={(e) => onChange('letter_spacing', e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:border-amber-500" placeholder="normal" />
        </div>
        <div>
          <label className="text-[10px] text-stone-500 block mb-0.5">Line height</label>
          <input type="text" value={values.line_height} onChange={(e) => onChange('line_height', e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:border-amber-500" placeholder="1.5" />
        </div>
      </div>

      {/* Shop Description — uppercase tagline under the logo */}
      <div className="pt-2 border-t border-stone-100">
        <p className="text-[11px] font-semibold text-stone-700 mb-2">Shop Description (uppercase)</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-stone-500 block mb-0.5">Size</label>
            <input type="text" value={values.shop_desc_size} onChange={(e) => onChange('shop_desc_size', e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:border-amber-500" placeholder="10px" />
          </div>
          <div>
            <label className="text-[10px] text-stone-500 block mb-0.5">Weight</label>
            <select value={values.shop_desc_weight} onChange={(e) => onChange('shop_desc_weight', e.target.value)} className="w-full px-1 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:border-amber-500">
              {WEIGHT_OPTIONS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-stone-500 block mb-0.5">Letter spacing</label>
            <input type="text" value={values.shop_desc_letter_spacing} onChange={(e) => onChange('shop_desc_letter_spacing', e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:border-amber-500" placeholder="1.792px" />
          </div>
          <div>
            <label className="text-[10px] text-stone-500 block mb-0.5">Line height</label>
            <input type="text" value={values.shop_desc_line_height} onChange={(e) => onChange('shop_desc_line_height', e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:border-amber-500" placeholder="1.1" />
          </div>
        </div>
        <p className="mt-2 text-center text-muted-foreground shop-description" style={{ fontFamily: fontStack(values.body_font) }}>
          {lang === 'th' ? 'คำอธิบายร้านค้า' : 'WOODFIRED NEAPOLITAN PIZZA'}
        </p>
      </div>

      {/* Category Filter — uppercase pill buttons */}
      <div className="pt-2 border-t border-stone-100">
        <p className="text-[11px] font-semibold text-stone-700 mb-2">Category Filter (uppercase)</p>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-stone-500 block mb-0.5">Size</label>
            <input type="text" value={values.cat_filter_size} onChange={(e) => onChange('cat_filter_size', e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:border-amber-500" placeholder="11.2px" />
          </div>
          <div>
            <label className="text-[10px] text-stone-500 block mb-0.5">Weight</label>
            <select value={values.cat_filter_weight} onChange={(e) => onChange('cat_filter_weight', e.target.value)} className="w-full px-1 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:border-amber-500">
              {WEIGHT_OPTIONS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-stone-500 block mb-0.5">Letter spacing</label>
            <input type="text" value={values.cat_filter_letter_spacing} onChange={(e) => onChange('cat_filter_letter_spacing', e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:border-amber-500" placeholder="1.792px" />
          </div>
        </div>
        <div className="mt-2 flex gap-2 justify-center flex-wrap">
          <span className="category-filter px-4 py-1.5 rounded-full bg-primary text-primary-foreground" style={{ fontFamily: fontStack(values.body_font) }}>
            {lang === 'th' ? 'ทั้งหมด' : 'ALL'}
          </span>
          <span className="category-filter px-4 py-1.5 rounded-full bg-[#fdfcf8] border border-border text-[#6b635c]" style={{ fontFamily: fontStack(values.body_font) }}>
            {lang === 'th' ? 'พิซซ่า' : 'PIZZA'}
          </span>
        </div>
      </div>
      <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 space-y-1">
        <p style={{ fontFamily: fontStack(values.heading_font), fontSize: values.h1_size, fontWeight: values.h1_weight, lineHeight: values.line_height, letterSpacing: values.letter_spacing }}>
          {lang === 'th' ? 'หัวข้อหนึ่ง' : 'Heading One'}
        </p>
        <p style={{ fontFamily: fontStack(values.heading_font), fontSize: values.h2_size, fontWeight: values.h2_weight }}>
          {lang === 'th' ? 'หัวข้อสอง' : 'Heading Two'}
        </p>
        <p style={{ fontFamily: fontStack(values.heading_font), fontSize: values.h3_size, fontWeight: values.h3_weight }}>
          {lang === 'th' ? 'หัวข้อสาม' : 'Heading Three'}
        </p>
        <p style={{ fontFamily: fontStack(values.body_font), fontSize: values.body_size, fontWeight: values.body_weight, letterSpacing: values.letter_spacing, lineHeight: values.line_height }}>
          {previewText}
        </p>
      </div>
    </div>
  );
}