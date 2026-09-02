import React, { createContext, useContext, useEffect, useState } from 'react';

const LanguageContext = createContext(null);
const STORAGE_KEY = 'mobile_menu_lang_v1';

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  // Pick the right value based on language, falling back to whichever is filled.
  const t = (en, th) => {
    if (lang === 'th') return th && String(th).trim() ? th : (en || '');
    return en && String(en).trim() ? en : (th || '');
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}