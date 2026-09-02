import React from 'react';
import { Plus } from 'lucide-react';
import { Image } from '@/components/ui/image';

const STOCK_BADGES = {
  limited: { label: 'Limited', className: 'bg-amber-100 text-amber-700' },
  sold_out_today: { label: 'Sold out today', className: 'bg-orange-100 text-orange-700' },
  not_available: { label: 'Not available', className: 'bg-stone-200 text-stone-500' }
};

export default function MenuItemCard({ item, currency, onAdd, lang, t, tags, activeTagId }) {
  const allItemTags = (tags || []).filter((tg) => (item.menu_tag_ids || []).includes(tg.id));
  const beforeTags = allItemTags.filter((tg) => tg.is_filterable);
  const afterTags = allItemTags.filter((tg) => !tg.is_filterable);
  const status = item.stock_status || (item.available === false ? 'not_available' : 'available');
  const canOrder = status === 'available' || status === 'limited';
  const badge = STOCK_BADGES[status];
  const labels = lang === 'th' ?
  { limited: 'จำกัด', sold_out_today: 'ขายหมดวันนี้', not_available: 'ไม่มี' } :
  { limited: 'Limited', sold_out_today: 'Sold out today', not_available: 'Not available' };

  return (
    <div className={`flex gap-4 w-full text-left py-5 border-b border-border ${canOrder ? '' : 'opacity-60'}`}>
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
        {item.image_url ?
        <Image src={item.image_url} fittingType="cover" className="w-full h-full" /> :

        <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
            <Plus className="w-5 h-5" />
          </div>
        }
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[#22211f] normal-case leading-[1.25] font-heading text-xl flex items-center gap-1.5 flex-wrap">
            {beforeTags.map((tg) => tg.icon_url && (
              <img key={tg.id} src={tg.icon_url} alt={t(tg.name, tg.name_th)} title={t(tg.name, tg.name_th)} className="w-3 h-3 object-contain inline-block" />
            ))}
            {t(item.name, item.name_th)}
            {afterTags.map((tg) => tg.icon_url && (
              <img key={tg.id} src={tg.icon_url} alt={t(tg.name, tg.name_th)} title={t(tg.name, tg.name_th)} className="w-3.5 h-3.5 object-contain inline-block" />
            ))}
          </h3>
          {badge &&
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${badge.className}`}>
              {labels[status] || badge.label}
            </span>
          }
        </div>
        <p className="text-[#7d7a76] line-clamp-2 mt-1 font-body font-normal text-xs">
          {t(item.description, item.description_th) || '—'}
        </p>
        <span className="mt-1.5 font-body text-[#241f1c] font-medium text-xs">
          {currency}{Number(item.price).toFixed(2)}
        </span>
      </div>
      <button
        onClick={() => canOrder && onAdd()}
        disabled={!canOrder}
        aria-label={`Add ${t(item.name, item.name_th)}`}
        className="shrink-0 w-8 h-8 rounded-full border border-border flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors mt-1">
        
        <Plus className="w-4 h-4" />
      </button>
    </div>);

}