import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const TypographyContext = createContext(null);

const EN_DEFAULTS = {
  heading_font: 'Instrument Serif',
  body_font: 'Work Sans',
  h1_size: '1.875rem',
  h2_size: '1.5rem',
  h3_size: '1.25rem',
  body_size: '0.875rem',
  small_size: '0.75rem',
  h1_weight: '400',
  h2_weight: '400',
  h3_weight: '400',
  body_weight: '400',
  letter_spacing: 'normal',
  line_height: '1.5',
  shop_desc_size: '10px',
  shop_desc_letter_spacing: '1.792px',
  shop_desc_line_height: '1.1',
  shop_desc_weight: '400',
  cat_filter_size: '11.2px',
  cat_filter_letter_spacing: '1.792px',
  cat_filter_weight: '400',
};

const TH_DEFAULTS = {
  heading_font: 'IBM Plex Sans Thai',
  body_font: 'IBM Plex Sans Thai',
  h1_size: '1.875rem',
  h2_size: '1.5rem',
  h3_size: '1.25rem',
  body_size: '0.875rem',
  small_size: '0.75rem',
  h1_weight: '400',
  h2_weight: '400',
  h3_weight: '400',
  body_weight: '400',
  letter_spacing: 'normal',
  line_height: '1.6',
  shop_desc_size: '10px',
  shop_desc_letter_spacing: 'normal',
  shop_desc_line_height: '1.1',
  shop_desc_weight: '400',
  cat_filter_size: '11.2px',
  cat_filter_letter_spacing: 'normal',
  cat_filter_weight: '400',
};

const SERIF_FONTS = ['Instrument Serif', 'Playfair Display', 'Cormorant Garamond', 'Lora', 'EB Garamond'];

const fontStack = (font) => {
  if (!font) return '';
  const fallback = SERIF_FONTS.includes(font) ? 'ui-serif, serif' : 'ui-sans-serif, sans-serif';
  return `'${font}', ${fallback}`;
};

const applyTypo = (typo) => {
  const root = document.documentElement;
  const en = { ...EN_DEFAULTS, ...(typo?.en || {}) };
  const th = { ...TH_DEFAULTS, ...(typo?.th || {}) };

  root.style.setProperty('--en-heading-font', fontStack(en.heading_font));
  root.style.setProperty('--en-body-font', fontStack(en.body_font));
  root.style.setProperty('--en-display-font', fontStack(en.heading_font));
  root.style.setProperty('--en-text-3xl', en.h1_size);
  root.style.setProperty('--en-text-2xl', en.h2_size);
  root.style.setProperty('--en-text-xl', en.h3_size);
  root.style.setProperty('--en-text-sm', en.body_size);
  root.style.setProperty('--en-text-xs', en.small_size);
  root.style.setProperty('--en-h1-weight', en.h1_weight);
  root.style.setProperty('--en-h2-weight', en.h2_weight);
  root.style.setProperty('--en-h3-weight', en.h3_weight);
  root.style.setProperty('--en-body-weight', en.body_weight);
  root.style.setProperty('--en-letter-spacing', en.letter_spacing);
  root.style.setProperty('--en-line-height', en.line_height);
  root.style.setProperty('--en-shop-desc-size', en.shop_desc_size);
  root.style.setProperty('--en-shop-desc-letter-spacing', en.shop_desc_letter_spacing);
  root.style.setProperty('--en-shop-desc-line-height', en.shop_desc_line_height);
  root.style.setProperty('--en-shop-desc-weight', en.shop_desc_weight);
  root.style.setProperty('--en-cat-filter-size', en.cat_filter_size);
  root.style.setProperty('--en-cat-filter-letter-spacing', en.cat_filter_letter_spacing);
  root.style.setProperty('--en-cat-filter-weight', en.cat_filter_weight);

  root.style.setProperty('--th-heading-font', fontStack(th.heading_font));
  root.style.setProperty('--th-body-font', fontStack(th.body_font));
  root.style.setProperty('--th-text-3xl', th.h1_size);
  root.style.setProperty('--th-text-2xl', th.h2_size);
  root.style.setProperty('--th-text-xl', th.h3_size);
  root.style.setProperty('--th-text-sm', th.body_size);
  root.style.setProperty('--th-text-xs', th.small_size);
  root.style.setProperty('--th-h1-weight', th.h1_weight);
  root.style.setProperty('--th-h2-weight', th.h2_weight);
  root.style.setProperty('--th-h3-weight', th.h3_weight);
  root.style.setProperty('--th-body-weight', th.body_weight);
  root.style.setProperty('--th-letter-spacing', th.letter_spacing);
  root.style.setProperty('--th-line-height', th.line_height);
  root.style.setProperty('--th-shop-desc-size', th.shop_desc_size);
  root.style.setProperty('--th-shop-desc-letter-spacing', th.shop_desc_letter_spacing);
  root.style.setProperty('--th-shop-desc-line-height', th.shop_desc_line_height);
  root.style.setProperty('--th-shop-desc-weight', th.shop_desc_weight);
  root.style.setProperty('--th-cat-filter-size', th.cat_filter_size);
  root.style.setProperty('--th-cat-filter-letter-spacing', th.cat_filter_letter_spacing);
  root.style.setProperty('--th-cat-filter-weight', th.cat_filter_weight);
};

export function TypographyProvider({ children }) {
  const [settings, setSettings] = useState(null);

  const refresh = useCallback(async () => {
    const s = await base44.entities.StoreSettings.list();
    setSettings(s[0] || null);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => { applyTypo(settings?.typography); }, [settings]);

  const applyPreview = useCallback((typo) => applyTypo(typo), []);
  const resetToSaved = useCallback(() => applyTypo(settings?.typography), [settings]);

  return (
    <TypographyContext.Provider value={{ settings, refresh, applyPreview, resetToSaved }}>
      {children}
    </TypographyContext.Provider>
  );
}

export function useTypography() {
  const ctx = useContext(TypographyContext);
  if (!ctx) throw new Error('useTypography must be used within TypographyProvider');
  return ctx;
}