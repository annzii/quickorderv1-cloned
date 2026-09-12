import React, { useState } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { Image } from '@/components/ui/image';

export default function ItemModal({ item, currency, lang, t, settings, tags, onClose, onConfirm }) {
  const itemTags = (tags || []).filter((tg) => (item.menu_tag_ids || []).includes(tg.id));
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState([]);
  const [note, setNote] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
const handleTouchStart = (e) => {
  setTouchStartX(e.touches[0].clientX);
};

const handleTouchEnd = (e) => {
  if (touchStartX === null || !item.image_url_2) {
    setTouchStartX(null);
    return;
  }

  const touchEndX = e.changedTouches[0].clientX;
  const distance = touchStartX - touchEndX;

  // Ignore very small movements
  if (Math.abs(distance) < 50) {
    setTouchStartX(null);
    return;
  }

  if (distance > 0) {
    // Swipe left → next image
    setActiveImageIndex(1);
  } else {
    // Swipe right → previous image
    setActiveImageIndex(0);
  }

  setTouchStartX(null);
};

  const toggleAddon = (addon, group) => {
    setSelected((prev) => {
      const exists = prev.find((a) => a.name === addon.name);

      if (exists) {
        return prev.filter((a) => a.name !== addon.name);
      }

      const groupAddons = group.items || [];
      const selectedInGroup = prev.filter((a) =>
        groupAddons.some((g) => g.name === a.name)
      );

      const maxSelections = Number(group.max_selections ?? 99);

      if (selectedInGroup.length >= maxSelections) {
        return prev;
      }

      return [...prev, addon];
    });
  };

  const addonTotal = selected.reduce((s, a) => s + Number(a.price), 0);
  const unitPrice = Number(item.price) + addonTotal;
  const total = unitPrice * qty;

const confirm = () => {
  for (const group of item.addon_options || []) {
    const groupAddons = group.items || [];

    const selectedInGroup = selected.filter((a) =>
      groupAddons.some((g) => g.name === a.name)
    );

    const minSelections = Number(group.min_selections ?? 0);

    if (selectedInGroup.length < minSelections) {
      const groupName =
        t(group.category_name, group.category_name_th) ||
        (lang === 'th' ? 'เพิ่มเติม' : 'Add-ons');

      alert(
        lang === 'th'
          ? `กรุณาเลือก ${groupName} อย่างน้อย ${minSelections} รายการ`
          : `Please select at least ${minSelections} item${minSelections > 1 ? 's' : ''} from ${groupName}`
      );

      return;
    }
  }

  onConfirm({
    ...item,
    qty,
    addons: selected,
    note: note.trim(),
  });

  onClose();
};

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background w-full max-w-md sm:rounded-3xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom rounded-[4px_4px_0px_0px]">
        <div
  className="relative w-full aspect-square bg-muted overflow-hidden touch-pan-y"
  onTouchStart={handleTouchStart}
  onTouchEnd={handleTouchEnd}
>
  {item.image_url && (
    <>
      {/* Image 1 */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
          activeImageIndex === 0
            ? 'opacity-100'
            : 'opacity-0'
        }`}
      >
        <Image
          src={item.image_url}
          fittingType="fill"
          className="w-full h-full"
        />
      </div>

      {/* Image 2 */}
      {item.image_url_2 && (
        <div
          className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
            activeImageIndex === 1
              ? 'opacity-100'
              : 'opacity-0'
          }`}
        >
          <Image
            src={item.image_url_2}
            fittingType="fill"
            className="w-full h-full"
          />
        </div>
      )}

      {/* Image indicators */}
      {item.image_url_2 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
          <button
            onClick={() => setActiveImageIndex(0)}
            aria-label="Show first image"
            className={`h-1.5 rounded-full transition-all duration-300 ${
              activeImageIndex === 0
                ? 'w-5 bg-white'
                : 'w-1.5 bg-white/60'
            }`}
          />

          <button
            onClick={() => setActiveImageIndex(1)}
            aria-label="Show second image"
            className={`h-1.5 rounded-full transition-all duration-300 ${
              activeImageIndex === 1
                ? 'w-5 bg-white'
                : 'w-1.5 bg-white/60'
            }`}
          />
        </div>
      )}
    </>
  )}

  <button
    onClick={onClose}
    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow z-10"
  >
    <X className="w-4 h-4" />
  </button>
</div>
        <div className="p-5">
          <h2 className="font-display leading-[1.25] text-[#22211f] text-2xl normal-case flex items-center gap-1.5 flex-wrap">{t(item.name, item.name_th)}
            {itemTags.map((tg) => tg.icon_url && (
              <img key={tg.id} src={tg.icon_url} alt={t(tg.name, tg.name_th)} title={t(tg.name, tg.name_th)} className="w-3.5 h-3.5 object-contain inline-block" />
            ))}
          </h2>
          <p className="text-[12px] text-[#7d7a76] mt-1 font-body font-normal">{t(item.description, item.description_th)}</p>
          <p className="text-[#22211f] mt-2 font-body text-sm font-medium">
            {currency}{Number(item.price).toFixed(2)}
          </p>

          {item.addon_options?.length > 0 &&
          <div className="mt-5 space-y-4">
              {item.addon_options.map((cat, ci) =>
            <div key={ci}>
<div className="mb-2">
  <div className="category-filter text-muted-foreground">
    {t(cat.category_name, cat.category_name_th) || (lang === 'th' ? 'เพิ่มเติม' : 'Add-ons')}
  </div>

 {Number(cat.max_selections ?? 99) < 99 && (
  <div className="text-[11px] text-stone-400 mt-0.5">
    {Number(cat.min_selections ?? 0) > 0
      ? `${lang === 'th' ? 'เลือก' : 'Choose'} ${Number(cat.min_selections)}${Number(cat.max_selections ?? 99) !== Number(cat.min_selections) ? `–${Number(cat.max_selections ?? 99)}` : ''}`
      : `${lang === 'th' ? 'เลือกได้สูงสุด' : 'Choose up to'} ${Number(cat.max_selections ?? 99)}`}
  </div>
)}
</div>
                  <div className="space-y-2">
                    {cat.items?.map((addon, i) => {
                  const checked = selected.some((a) => a.name === addon.name);
                  return (
                    <button
                      key={i}
                      onClick={() => toggleAddon(addon, cat)}
                      className={`flex items-center justify-between w-full border transition-colors rounded-sm px-3 py-3 ${
                      checked ?
                      'border-primary bg-primary/5' :
                      'border-border bg-[#fdfcf8]'}`
                      }>
                      
                          <span className="text-[#22211f] text-[13px]">{t(addon.name, addon.name_th)}</span>
                          <span className="font-body font-normal text-[#22211f] text-[13px]">
                            +{currency}{Number(addon.price).toFixed(2)}
                          </span>
                        </button>);

                })}
                  </div>
                </div>
            )}
            </div>
          }

          <div className="mt-5">
            <h3 className="category-filter text-muted-foreground mb-2">{t(settings?.special_request_label, settings?.special_request_label_th) || (lang === 'th' ? 'หมายเหตุพิเศษ (ไม่บังคับ)' : 'Special request (optional)')}</h3>
            <textarea
              placeholder={t(settings?.special_request_placeholder, settings?.special_request_placeholder_th) || (lang === 'th' ? 'เช่น เผ็ดน้อย ไม่ใส่หัวหอม' : 'e.g. less spicy, no onion')}
              value={note}
              rows={2}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2.5 border border-border bg-[#fdfcf8] text-sm focus:outline-none focus:border-primary resize-none rounded-sm py-3" />
            
          </div>

          <div className="mt-6 pt-5 border-t border-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 border border-border rounded-full px-3 py-1.5">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="text-[#22211f]">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-medium min-w-[12px] text-center text-[#22211f] text-sm">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="text-[#22211f]">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-[#22211f] font-body text-sm font-medium">{currency}{total.toFixed(2)}</span>
            </div>
            <button
              onClick={confirm}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3.5 rounded-full transition-colors text-[10px]">
              <span className="category-filter font-body font-medium text-[11px]">{t(settings?.add_to_cart_label, settings?.add_to_cart_label_th) || (lang === 'th' ? 'เพิ่มลงตะกร้า' : 'Add to cart')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>);

}