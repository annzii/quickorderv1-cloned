import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import MenuItemCard from '@/components/MenuItemCard';
import ItemModal from '@/components/ItemModal';
import BottomNav from '@/components/BottomNav';
import { useCart } from '@/lib/cartContext';
import { useLanguage } from '@/lib/languageContext';
import { Image } from '@/components/ui/image';
import {
  MapPin,
  Clock,
  Phone,
  Instagram,
  Facebook,
  Star,
  Globe
} from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';

export default function Menu() {
  const [items, setItems] = useState([]);
  const [groupsMap, setGroupsMap] = useState({});
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [categoryRecords, setCategoryRecords] = useState([]);
  const [menuTags, setMenuTags] = useState([]);

  const { addItem } = useCart();
  const { lang, setLang, t } = useLanguage();

  const load = async () => {
    setLoading(true);

    try {
      const [
        { data: menu, error: menuError },
        { data: settingsList, error: settingsError },
        { data: groups, error: groupsError },
        { data: cats, error: catsError },
        { data: tags, error: tagsError }
      ] = await Promise.all([
        supabase.from('menu_items').select('*'),
        supabase.from('store_settings').select('*'),
        supabase.from('addon_groups').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('menu_tags').select('*')
      ]);

      const error =
        menuError ||
        settingsError ||
        groupsError ||
        catsError ||
        tagsError;

      if (error) {
        console.error('Supabase menu load error:', error);
        return;
      }

      setItems(menu || []);
      setSettings(settingsList?.[0] || null);

      setGroupsMap(
        Object.fromEntries(
          (groups || []).map((g) => [g.id, g])
        )
      );

      setCategoryRecords(
        (cats || []).sort(
          (a, b) =>
            (a.display_order ?? a.order ?? 999) -
            (b.display_order ?? b.order ?? 999)
        )
      );

      setMenuTags(
        (tags || []).sort(
          (a, b) =>
            (a.display_order ?? a.order ?? 999) -
            (b.display_order ?? b.order ?? 999)
        )
      );

    } catch (error) {
      console.error('Unexpected menu loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const currency = settings?.currency_symbol || '$';

  const rawCategories = Array.from(
    new Set(
      items
        .map((i) => i.category)
        .filter(Boolean)
    )
  );

  const order = settings?.category_order || [];

  const categoryNames =
    categoryRecords.length > 0
      ? categoryRecords.map((c) => c.name)
      : rawCategories.slice().sort((a, b) => {
          const ia = order.indexOf(a);
          const ib = order.indexOf(b);

          if (ia === -1 && ib === -1) return 0;
          if (ia === -1) return 1;
          if (ib === -1) return -1;

          return ia - ib;
        });

  const filterableTags = menuTags.filter(
    (tg) => tg.is_filterable
  );

  const categories = [
    'All',
    ...filterableTags.map((tg) => `tag:${tg.id}`),
    ...categoryNames
  ];

  const itemOrder = settings?.menu_item_order || [];

  const sortedItems = items.slice().sort((a, b) => {
    const ia = itemOrder.indexOf(a.id);
    const ib = itemOrder.indexOf(b.id);

    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;

    return ia - ib;
  });

  const filtered =
    activeCategory === 'All'
      ? sortedItems
      : activeCategory.startsWith('tag:')
        ? sortedItems.filter((i) =>
            (i.menu_tag_ids || []).includes(
              activeCategory.slice(4)
            )
          )
        : sortedItems.filter(
            (i) => i.category === activeCategory
          );

  const resolveAddons = (item) =>
    item.addon_group_ids?.length
      ? item.addon_group_ids
          .map((id) => groupsMap[id])
          .filter(Boolean)
          .sort(
            (a, b) =>
              (a.order ?? a.display_order ?? 999) -
              (b.order ?? b.display_order ?? 999)
          )
          .map((g) => ({
            category_name: g.name,
            items: g.items || []
          }))
      : item.addon_options || [];

  const handleConfirm = (item) => {
    addItem({
      id: item.id,
      name: item.name,
      name_th: item.name_th,
      price: Number(item.price),
      qty: item.qty,
      addons: item.addons,
      image_url: item.image_url,
      category: item.category,
      category_th: item.category_th,
      note: item.note,
      menu_tag_ids: item.menu_tag_ids || []
    });
  };

  const openHours =
    settings?.operating_hours?.filter(
      (h) => !h.closed
    ) || [];

  const closedHours =
    settings?.operating_hours?.filter(
      (h) => h.closed
    ) || [];

  const catLabel = (c) => {
    if (c === 'All') {
      return lang === 'th' ? 'ทั้งหมด' : 'All';
    }

    if (c.startsWith('tag:')) {
      const tag = menuTags.find(
        (tg) => tg.id === c.slice(4)
      );

      return t(tag?.name, tag?.name_th) || '';
    }

    const record = categoryRecords.find(
      (cr) => cr.name === c
    );

    if (record) {
      return t(record.name, record.name_th);
    }

    const sample = items.find(
      (i) => i.category === c
    );

    return t(c, sample?.category_th);
  };

  return (
    <div className="min-h-screen bg-background pb-20">

      {/* HEADER */}
      <header className="bg-background border-b border-border relative">

        {/* LANGUAGE SWITCHER */}
        <div className="absolute top-3 right-4 z-10">
          <div className="lang-switcher flex items-center rounded-full border border-border bg-[#fdfcf8] p-0.5">

            <button
              onClick={() => setLang('en')}
              className={`lang-switcher px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide transition-colors ${
                lang === 'en'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              EN
            </button>

            <button
              onClick={() => setLang('th')}
              className={`lang-switcher px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide transition-colors ${
                lang === 'th'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              TH
            </button>

          </div>
        </div>

        <div className="max-w-md mx-auto px-5 pt-7 pb-6 text-center">

          {/* LOGO */}
          {settings?.logo_url && (
            <div className="mx-auto mb-3 flex justify-center">
              <Image
                src={settings.logo_url}
                fittingType="fit"
                className="w-1/2 h-auto object-contain"
              />
            </div>
          )}

          {/* DESCRIPTION */}
          {settings?.description && (
            <p className="shop-description text-muted-foreground mb-2 max-w-xs mx-auto">
              {t(
                settings.description,
                settings.description_th
              )}
            </p>
          )}

          {/* STORE DETAILS */}
          {settings &&
            (
              settings.address ||
              settings.operating_hours?.length ||
              settings.phone_number ||
              settings.instagram_url ||
              settings.facebook_url ||
              settings.website_url ||
              settings.google_review_url
            ) && (
              <div className="text-center mt-5">

                {(settings.address ||
                  settings.operating_hours?.length ||
                  settings.phone_number) && (
                  <div className="space-y-1 text-[11px] text-muted-foreground">

                    {settings.address && (
                      <div className="flex items-center justify-center gap-1.5">
                        <MapPin className="w-3 h-3 shrink-0 text-primary" />
                        <span>
                          {t(
                            settings.address,
                            settings.address_th
                          )}
                        </span>
                      </div>
                    )}

                    {openHours.length > 0 && (
                      <div className="flex items-center justify-center gap-1.5">
                        <Clock className="w-3 h-3 shrink-0 text-primary" />

                        <span>
                          {openHours
                            .map(
                              (h) =>
                                `${t(
                                  h.days,
                                  h.days_th
                                )} ${h.open}–${h.close}`
                            )
                            .join(' · ')}
                        </span>
                      </div>
                    )}

                    {closedHours.length > 0 && (
                      <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">

                        {lang === 'th'
                          ? 'ปิด'
                          : 'Closed'}

                        {' · '}

                        {closedHours
                          .map((h) =>
                            t(h.days, h.days_th)
                          )
                          .join(', ')}

                      </div>
                    )}

                    {settings.phone_number && (
                      <div className="flex items-center justify-center gap-1.5">
                        <Phone className="w-3 h-3 shrink-0 text-primary" />

                        <span>
                          {settings.phone_number}
                        </span>
                      </div>
                    )}

                  </div>
                )}

                {/* SOCIAL LINKS */}
                {(settings.whatsapp_number ||
                  settings.instagram_url ||
                  settings.facebook_url ||
                  settings.website_url ||
                  settings.google_review_url) && (

                  <div
                    className={`flex items-center justify-center gap-3 ${
                      settings.address ||
                      settings.operating_hours?.length ||
                      settings.phone_number
                        ? 'mt-4'
                        : ''
                    }`}
                  >

                    {settings.whatsapp_number && (
                      <a
                        href={`https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <WhatsAppIcon className="w-4 h-4" />
                      </a>
                    )}

                    {settings.instagram_url && (
                      <a
                        href={settings.instagram_url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Instagram className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {settings.facebook_url && (
                      <a
                        href={settings.facebook_url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Facebook className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {settings.website_url && (
                      <a
                        href={settings.website_url}
                        target="_blank"
                        rel="noreferrer"
                        title="Visit our website"
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {settings.google_review_url && (
                      <a
                        href={settings.google_review_url}
                        target="_blank"
                        rel="noreferrer"
                        title="Review us on Google"
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </a>
                    )}

                  </div>
                )}

              </div>
            )}

          {/* MENU TITLE */}
          <h1 className="font-display text-foreground leading-tight tracking-tight text-2xl mt-5">
            {t(
              settings?.store_name,
              settings?.store_name_th
            ) || 'Our Menu'}
          </h1>

        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-md mx-auto px-5 pb-5">

        {/* CATEGORY FILTER */}
        {categories.length > 1 && (
          <div className="sticky top-0 z-30 bg-background -mx-5 px-5 py-3 border-b border-border flex gap-2 overflow-x-auto no-scrollbar">

            {categories.map((cat) => {
              const tag = cat.startsWith('tag:')
                ? menuTags.find(
                    (tg) =>
                      tg.id === cat.slice(4)
                  )
                : null;

              return (
                <button
                  key={cat}
                  onClick={() =>
                    setActiveCategory(cat)
                  }
                  className={`category-filter shrink-0 px-4 py-1.5 whitespace-nowrap transition-colors rounded-full text-[#6b635c] flex items-center gap-1.5 ${
                    activeCategory === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-[#fdfcf8] border border-border'
                  }`}
                >

                  {tag?.icon_url && (
                    <img
                      src={tag.icon_url}
                      alt=""
                      className="w-3 h-3 object-contain"
                    />
                  )}

                  {catLabel(cat)}

                </button>
              );
            })}

          </div>
        )}

        {/* MENU ITEMS */}
        <div>

          {loading ? (

            <div className="flex justify-center py-20">
              <div className="w-7 h-7 border-4 border-border border-t-primary rounded-full animate-spin" />
            </div>

          ) : filtered.length === 0 ? (

            <div className="text-center py-20 text-muted-foreground text-sm">
              {lang === 'th'
                ? 'ยังไม่มีรายการในเมนู'
                : 'No menu items yet.'}
            </div>

          ) : (

            filtered.map((item) => (
              <MenuItemCard
                key={item.id}
                item={{
                  ...item,
                  addon_options:
                    resolveAddons(item)
                }}
                currency={currency}
                lang={lang}
                t={t}
                tags={menuTags}
                activeTagId={
                  activeCategory.startsWith('tag:')
                    ? activeCategory.slice(4)
                    : null
                }
                onAdd={() =>
                  setActive({
                    ...item,
                    addon_options:
                      resolveAddons(item)
                  })
                }
              />
            ))

          )}

        </div>

      </main>

      {/* ITEM MODAL */}
      {active && (
        <ItemModal
          item={active}
          currency={currency}
          lang={lang}
          t={t}
          settings={settings}
          tags={menuTags}
          onClose={() => setActive(null)}
          onConfirm={handleConfirm}
        />
      )}

      <BottomNav />

    </div>
  );
}