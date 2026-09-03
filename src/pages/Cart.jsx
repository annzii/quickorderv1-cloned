import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/cartContext';
import { useLanguage } from '@/lib/languageContext';
import BottomNav from '@/components/BottomNav';
import { Image } from '@/components/ui/image';
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';

const pad = (n) => String(n).padStart(2, '0');
// Earliest selectable pick-up time = now + 1 hour, rounded up to next 15-min slot.
const minPickupTime = () => {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const m = Math.ceil(d.getMinutes() / 15) * 15;
  if (m >= 60) {d.setHours(d.getHours() + 1);d.setMinutes(0);} else
  d.setMinutes(m);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
// Generate 15-min slots from min to 23:45.
const pickupSlots = (min) => {
  const [mh, mm] = min.split(':').map(Number);
  const start = mh * 60 + mm;
  const slots = [];
  for (let t = start; t <= 23 * 60 + 45; t += 15) {
    slots.push(`${pad(Math.floor(t / 60))}:${pad(t % 60)}`);
  }
  return slots;
};

const DEFAULT_PAYMENT_MESSAGE = '💳 Payment: We will send you a confirmation with QR code for payment';

// Universal phone validation: optional leading +, then 7–15 digits,
// separators (spaces, dashes, parentheses) allowed between digits.
const isValidPhone = (raw) => {
  if (!raw) return false;
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.length < 7 || digits.length > 15) return false;
  return /^\+?[\d\s\-()]+$/.test(raw.trim());
};

export default function Cart() {
  const { items, updateQty, removeItem, clearCart } = useCart();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [menuTags, setMenuTags] = useState([]);
  const [orderType, setOrderType] = useState('delivery');
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', map_link: '' });
  const [sending, setSending] = useState(false);
  const [pickupPref, setPickupPref] = useState('asap');
  const [pickupTime, setPickupTime] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);

  useEffect(() => {
  const loadCartData = async () => {
    // Load store settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('store_settings')
      .select('*')
      .limit(1);

    if (settingsError) {
      console.error('Failed to load store settings:', settingsError);
    } else {
      setSettings(settingsData?.[0] || null);
    }

    // Load menu tags
    const { data: tagsData, error: tagsError } = await supabase
      .from('menu_tags')
      .select('*');

    if (tagsError) {
      console.error('Failed to load menu tags:', tagsError);
    } else {
      setMenuTags(tagsData || []);
    }
  };

  loadCartData();
}, []);

  // Auto-populate pick-up time to now + 1h when "Select Time" is chosen.
  useEffect(() => {
    if (orderType === 'pickup' && pickupPref === 'select' && !pickupTime) {
      setPickupTime(minPickupTime());
    }
  }, [orderType, pickupPref, pickupTime]);

  const currency = settings?.currency_symbol || '$';
  const foodTotal = items.reduce(
    (sum, i) => sum + (i.price + (i.addons?.reduce((a, b) => a + Number(b.price), 0) || 0)) * i.qty,
    0
  );

  const phoneValid = isValidPhone(customer.phone);
  const showPhoneError = phoneTouched && customer.phone.length > 0 && !phoneValid;

  const valid =
  items.length > 0 &&
  customer.name.trim() &&
  customer.phone.trim() && phoneValid && (
  orderType === 'pickup' || customer.address.trim());

  const buildMessage = () => {
    const L = lang === 'th';
    const now = new Date();
    const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}`;
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const lines = [`*${L ? 'คำสั่งซื้อใหม่' : 'New Order'}* — ${dateStr} ${timeStr}`, ''];
    lines.push(`${L ? 'ลูกค้า' : 'Customer'}: ${customer.name}`);
    lines.push(`${L ? 'เบอร์โทร' : 'Phone'}: ${customer.phone}`);
    lines.push(`${t(settings?.order_type_label, settings?.order_type_label_th) || (L ? 'ประเภท' : 'Type')}: ${orderType === 'delivery' ? t(settings?.delivery_opt_label, settings?.delivery_opt_label_th) || (L ? 'จัดส่ง' : 'Delivery') : t(settings?.pickup_opt_label, settings?.pickup_opt_label_th) || (L ? 'มารับเอง' : 'Pick-up')}`);
    if (orderType === 'delivery') {
      lines.push(`${L ? 'ที่อยู่' : 'Address'}: ${customer.address}`);
      if (customer.map_link?.trim()) lines.push(`${L ? 'แผนที่' : 'Map'}: ${customer.map_link.trim()}`);
    }
    if (orderType === 'pickup' && settings?.pickup_address)
    lines.push(`${t(settings?.pickup_at_label, settings?.pickup_at_label_th) || (L ? 'รับที่' : 'Pick-up at')}: ${t(settings.pickup_address, settings.pickup_address_th)}`);
    if (orderType === 'pickup') {
      const ptLabel = t(settings?.preferred_time_label, settings?.preferred_time_label_th) || (L ? 'เวลารับ' : 'Pick-up time');
      if (pickupPref === 'asap') {
        lines.push(`${ptLabel}: ${t(settings?.asap_label, settings?.asap_label_th) || (L ? 'ด่วน' : 'ASAP')}`);
      } else if (pickupTime) {
        lines.push(`${ptLabel}: ${pickupTime}`);
      }
    }
    lines.push('');
    const byCategory = {};
    items.forEach((i) => {
      const cat = i.category || 'Other';
      (byCategory[cat] = byCategory[cat] || []).push(i);
    });
    Object.entries(byCategory).forEach(([cat, list]) => {
      const sample = items.find((i) => i.category === cat);
      lines.push(`*${t(cat, sample?.category_th) || cat}*`);
      list.forEach((i) => {
        const addonText = i.addons?.length ?
        ` (+${i.addons.map((a) => t(a.name, a.name_th)).join(', +')})` :
        '';
        const noteText = i.note?.trim() ? ` (${i.note.trim()})` : '';
        const lineTotal =
        (i.price + (i.addons?.reduce((a, b) => a + Number(b.price), 0) || 0)) * i.qty;
        lines.push(`• ${i.qty}x ${t(i.name, i.name_th)}${addonText}${noteText} - ${currency}${lineTotal.toFixed(2)}`);
      });
      lines.push('');
    });
    lines.push(`${t(settings?.total_items_label, settings?.total_items_label_th) || (L ? 'จำนวนชิ้น' : 'Total Items')}: ${items.reduce((s, i) => s + i.qty, 0)}`);
    lines.push(`${t(settings?.food_total_label, settings?.food_total_label_th) || (L ? 'รวมอาหาร' : 'Food Total')}: *${currency}${foodTotal.toFixed(2)}*`);
    if (orderType === 'delivery') lines.push(`${t(settings?.delivery_label, settings?.delivery_label_th) || (L ? 'ค่าจัดส่ง' : 'Delivery')}: ${t(settings?.delivery_pending_label, settings?.delivery_pending_label_th) || (L ? 'แจ้งภายหลัง' : 'To be confirmed')}`);
    lines.push('');
    lines.push(t(settings?.payment_message, settings?.payment_message_th) || DEFAULT_PAYMENT_MESSAGE);
    return lines.join('\n');
  };

  const sendOrder = () => {
    if (!valid) return;
    setSending(true);
    const number = (settings?.whatsapp_number || '').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(buildMessage());
    const url = `https://wa.me/${number}?text=${text}`;
    window.open(url, '_blank');
    setTimeout(() => {
      clearCart();
      setSending(false);
      navigate('/thank-you');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-background border-b border-border">
        <div className="max-w-md mx-auto px-5 pt-7 pb-5 text-center">
          <p className="category-filter text-muted-foreground mb-2">{t(settings?.cart_review_label, settings?.cart_review_label_th) || (lang === 'th' ? 'ตรวจสอบคำสั่งซื้อ' : 'Review Order')}</p>
          <h1 className="font-display text-3xl text-foreground leading-tight tracking-tight">{t(settings?.cart_title_label, settings?.cart_title_label_th) || (lang === 'th' ? 'ตะกร้าของคุณ' : 'Your Cart')}</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 py-5 space-y-5">
        {items.length === 0 ?
        <div className="flex flex-col items-center justify-center py-24 text-[#7d7a76]">
            <ShoppingBag className="w-10 h-10 mb-3" />
            <p className="text-[12px]">{t(settings?.cart_empty_label, settings?.cart_empty_label_th) || (lang === 'th' ? 'ตะกร้าของคุณว่างเปล่า' : 'Your cart is empty')}</p>
          </div> :

        <>
            <div>
              {items.map((i, idx) => {
              const unit = i.price + (i.addons?.reduce((a, b) => a + Number(b.price), 0) || 0);
              return (
                <div key={idx} className="flex gap-4 py-4 border-b border-border">
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0">
                      {i.image_url && <Image src={i.image_url} fittingType="fill" className="w-full h-full" />}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <h3 className={`font-display leading-[1.25] ${lang === 'th' ? 'text-sm' : 'text-base'} text-[#22211f] flex items-center gap-1.5 flex-wrap`}>
                        {t(i.name, i.name_th)}
                        {(menuTags || []).filter((tg) => (i.menu_tag_ids || []).includes(tg.id)).map((tg) => tg.icon_url && (
                          <img key={tg.id} src={tg.icon_url} alt={tg.name} title={tg.name} className="w-3.5 h-3.5 object-contain inline-block" />
                        ))}
                      </h3>
                      {i.addons?.length > 0 &&
                    <p className="text-[12px] text-[#7d7a76] mt-1">
                           +{i.addons.map((a) => t(a.name, a.name_th)).join(', +')}
                         </p>
                    }
                      {i.note?.trim() &&
                    <p className="text-[11px] text-[#7d7a76] mt-0.5 italic">{t(settings?.note_label, settings?.note_label_th) || (lang === 'th' ? 'หมายเหตุ' : 'Note')}: {i.note.trim()}</p>
                    }
                      <span className="text-[#22211f] mt-1.5 font-body font-medium text-xs">
                        {currency}{(unit * i.qty).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button onClick={() => removeItem(idx)} className="text-[#7d7a76] hover:text-primary">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                        onClick={() => updateQty(idx, i.qty - 1)}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-[#22211f]">
                        
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-4 text-center text-[#22211f]">{i.qty}</span>
                        <button
                        onClick={() => updateQty(idx, i.qty + 1)}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-[#22211f]">
                        
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>);

            })}
            </div>

            <div>
              <h2 className="category-filter text-muted-foreground mb-3">{t(settings?.order_type_label, settings?.order_type_label_th) || (lang === 'th' ? 'ประเภทคำสั่งซื้อ' : 'Order Type')}</h2>
              <div className="grid grid-cols-2 gap-2">
                {['delivery', 'pickup'].map((opt) =>
              <button
                key={opt}
                onClick={() => setOrderType(opt)}
                className={`py-2.5 rounded-full text-sm font-medium transition-colors ${
                orderType === opt ?
                'bg-primary text-primary-foreground' :
                'bg-[#fdfcf8] text-[#6b635c] border border-border'}`
                }>
                    {opt === 'delivery' ? t(settings?.delivery_opt_label, settings?.delivery_opt_label_th) || (lang === 'th' ? 'จัดส่ง' : 'Delivery') : t(settings?.pickup_opt_label, settings?.pickup_opt_label_th) || (lang === 'th' ? 'มารับเอง' : 'Pick-up')}
                  </button>
              )}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="category-filter text-muted-foreground">{t(settings?.your_details_label, settings?.your_details_label_th) || (lang === 'th' ? 'รายละเอียดของคุณ' : 'Your Details')} <span className="text-primary normal-case tracking-normal">· {t(settings?.required_label, settings?.required_label_th) || (lang === 'th' ? 'จำเป็น' : 'required')}</span></h2>
              <input
              placeholder={t(settings?.name_placeholder, settings?.name_placeholder_th) || (lang === 'th' ? 'ชื่อ *' : 'Name *')}
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-border bg-[#fdfcf8] text-sm focus:outline-none focus:border-primary rounded-sm" />
            
              <input
              placeholder={t(settings?.phone_placeholder, settings?.phone_placeholder_th) || (lang === 'th' ? 'เบอร์โทร *' : 'Phone number *')}
              value={customer.phone}
              inputMode="tel"
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              onBlur={() => setPhoneTouched(true)}
              className={`w-full px-3 py-2.5 border bg-[#fdfcf8] text-sm focus:outline-none focus:border-primary rounded-sm ${showPhoneError ? 'border-destructive' : 'border-border'}`} />
              {showPhoneError &&
            <p className="text-[11px] text-destructive -mt-1">
                {lang === 'th' ? 'กรุณากรอกหมายเลขโทรศัพท์ให้ถูกต้อง (7–15 หลัก)' : 'Please enter a valid phone number (7–15 digits).'}
              </p>
            }
            
              {orderType === 'delivery' &&
            <>
              <textarea
                placeholder={t(settings?.address_placeholder, settings?.address_placeholder_th) || (lang === 'th' ? 'ที่อยู่จัดส่ง / สถานที่ *' : 'Delivery address / location *')}
                value={customer.address}
                onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                rows={2}
                className="w-full px-3 py-2.5 border border-border bg-[#fdfcf8] text-sm focus:outline-none focus:border-primary resize-none rounded-sm py-3" />

              <input
                placeholder={t(settings?.map_link_placeholder, settings?.map_link_placeholder_th) || (lang === 'th' ? 'ลิงก์ Google Maps (ไม่บังคับ)' : 'Google Maps location link (optional)')}
                value={customer.map_link}
                onChange={(e) => setCustomer({ ...customer, map_link: e.target.value })}
                className="w-full px-3 py-2.5 border border-border bg-[#fdfcf8] text-sm focus:outline-none focus:border-primary rounded-sm" />
            </>
            }
              {orderType === 'pickup' &&
            <div className="space-y-2">
                <h2 className="category-filter text-muted-foreground pt-2">{t(settings?.preferred_time_label, settings?.preferred_time_label_th) || (lang === 'th' ? 'เวลารับที่ต้องการ' : 'Preferred pick-up time')}</h2>
                <div className="grid grid-cols-2 gap-2">
                  {['asap', 'select'].map((opt) =>
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPickupPref(opt)}
                  className={`py-2.5 rounded-full text-sm font-medium transition-colors ${
                  pickupPref === opt ?
                  'bg-primary text-primary-foreground' :
                  'bg-[#fdfcf8] text-[#6b635c] border border-border'}`
                  }>
                    {opt === 'asap' ? t(settings?.asap_label, settings?.asap_label_th) || (lang === 'th' ? 'ด่วน' : 'ASAP') : t(settings?.select_time_label, settings?.select_time_label_th) || (lang === 'th' ? 'เลือกเวลา' : 'Select Time')}
                  </button>
                )}
                </div>
                {pickupPref === 'select' &&
              <select
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-full box-border border border-border bg-[#fdfcf8] text-sm focus:outline-none focus:border-primary min-w-0 rounded-sm px-3 py-3">
                {pickupSlots(minPickupTime()).map((slot) =>
                <option key={slot} value={slot}>{slot}</option>
                )}
              </select>
              }
              </div>
            }
            </div>

            <div className="pt-3 border-t border-border space-y-0.5">
              <div className="flex justify-between items-center font-display text-[#22211f] pb-2 border-b border-border">
                <span className="font-body font-normal text-[12px] text-[#7d7a76]">{t(settings?.total_items_label, settings?.total_items_label_th) || (lang === 'th' ? 'จำนวนชิ้น' : 'Total Items')}</span>
                <span className="font-body font-normal text-[12px] text-[#7d7a76]">{items.reduce((s, i) => s + i.qty, 0)}</span>
              </div>
              <div className="flex justify-between font-display text-[#22211f] pt-2">
                <span className="font-body font-normal text-sm">{t(settings?.food_total_label, settings?.food_total_label_th) || (lang === 'th' ? 'รวมอาหาร' : 'Food Total')}</span>
                <span className="font-body font-medium text-base">{currency}{foodTotal.toFixed(2)}</span>
              </div>
              {orderType === 'delivery' &&
            <div className="flex justify-between items-center font-display text-[#22211f] pb-2 border-b border-border">
              <span className="font-body font-normal text-sm">{t(settings?.delivery_label, settings?.delivery_label_th) || (lang === 'th' ? 'ค่าจัดส่ง' : 'Delivery')}</span>
              <span className="font-body font-normal text-[12px] text-[#7d7a76]">{t(settings?.delivery_pending_label, settings?.delivery_pending_label_th) || (lang === 'th' ? 'แจ้งภายหลัง' : 'to be confirmed')}</span>
            </div>
            }
              <p className="font-body text-sm text-foreground pt-2">
                {t(settings?.payment_message, settings?.payment_message_th) || DEFAULT_PAYMENT_MESSAGE}
              </p>
              <p className="font-body text-xs text-[#7d7a76] pt-1.5">
                ⚠️ {lang === 'th' ? 'ผู้แพ้อาหาร: หากคุณมีอาการแพ้อาหารอย่างรุนแรง กรุณาติดต่อเราก่อนสั่งอาหาร' : 'Food Allergies: If you have a serious allergy, please contact us before ordering.'}
              </p>
            </div>

            <div className="h-6" />
          </>
        }
      </main>

      {items.length > 0 &&
      <div className="fixed bottom-16 inset-x-0 z-30">
          <div className="max-w-md mx-auto px-5 pb-2">
            <button
            onClick={sendOrder}
            disabled={!valid || sending}
            className={`w-full py-3.5 rounded-full flex items-center justify-center gap-2 transition-colors text-xs font-body font-medium bg-[hsl(var(--sidebar-background))] ${
            valid ?
            'bg-primary text-primary-foreground hover:opacity-90' :
            "border border-primary/40 text-primary/50"}`
            }>

              <WhatsAppIcon className="w-4 h-4" />
              {sending ? t(settings?.opening_whatsapp_label, settings?.opening_whatsapp_label_th) || (lang === 'th' ? 'กำลังเปิด WhatsApp…' : 'Opening WhatsApp…') : t(settings?.place_order_label, settings?.place_order_label_th) || (lang === 'th' ? 'สั่งซื้อผ่าน WhatsApp' : 'Place Order via WhatsApp')}
            </button>
          </div>
        </div>
      }

      <BottomNav />
    </div>);

}