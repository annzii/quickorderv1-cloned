import React, { useMemo, useState } from 'react';
import { MessageSquare } from 'lucide-react';

const DEFAULT_PAYMENT_MESSAGE = '💳 Payment: We will send you a confirmation with QR code for payment';

// Sample order used to illustrate the message format.
const SAMPLE = {
  customer: { name: 'Jamie Smith', phone: '+66 81 234 5678', address: '12 Sukhumvit Rd, Bangkok', map_link: 'https://maps.app.goo.gl/abc' },
  orderType: 'delivery',
  pickupPref: 'asap',
  pickupTime: '',
  items: [
    { qty: 2, name: 'Margherita Pizza', name_th: 'พิซซ่ามาร์การิต้า', price: 280, category: 'Pizza', category_th: 'พิซซ่า', addons: [{ name: 'Extra Cheese', name_th: 'เพิ่มชีส', price: 40 }], note: 'less spicy' },
    { qty: 1, name: 'Garlic Bread', name_th: 'ขนมกระเทียม', price: 90, category: 'Sides', category_th: 'อาหารเสริม', addons: [], note: '' },
  ],
};

const buildMessage = (settings, lang, sample = SAMPLE) => {
  const L = lang === 'th';
  const t = (en, th) => (L ? (th || en) : (en || th));
  const currency = settings?.currency_symbol || '$';
  const foodTotal = sample.items.reduce(
    (sum, i) => sum + (i.price + (i.addons?.reduce((a, b) => a + Number(b.price), 0) || 0)) * i.qty,
    0
  );

  const lines = [`*${L ? 'คำสั่งซื้อใหม่' : 'New Order'}* — 31/08 19:29`, ''];
  lines.push(`${L ? 'ลูกค้า' : 'Customer'}: ${sample.customer.name}`);
  lines.push(`${L ? 'เบอร์โทร' : 'Phone'}: ${sample.customer.phone}`);
  lines.push(`${t(settings?.order_type_label, settings?.order_type_label_th) || (L ? 'ประเภท' : 'Type')}: ${sample.orderType === 'delivery' ? (t(settings?.delivery_opt_label, settings?.delivery_opt_label_th) || (L ? 'จัดส่ง' : 'Delivery')) : (t(settings?.pickup_opt_label, settings?.pickup_opt_label_th) || (L ? 'มารับเอง' : 'Pick-up'))}`);
  if (sample.orderType === 'delivery') {
    lines.push(`${L ? 'ที่อยู่' : 'Address'}: ${sample.customer.address}`);
    if (sample.customer.map_link?.trim()) lines.push(`${L ? 'แผนที่' : 'Map'}: ${sample.customer.map_link.trim()}`);
  }
  if (sample.orderType === 'pickup' && settings?.pickup_address)
    lines.push(`${t(settings?.pickup_at_label, settings?.pickup_at_label_th) || (L ? 'รับที่' : 'Pick-up at')}: ${t(settings.pickup_address, settings.pickup_address_th)}`);
  if (sample.orderType === 'pickup') {
    const ptLabel = t(settings?.preferred_time_label, settings?.preferred_time_label_th) || (L ? 'เวลารับ' : 'Pick-up time');
    if (sample.pickupPref === 'asap') {
      lines.push(`${ptLabel}: ${t(settings?.asap_label, settings?.asap_label_th) || (L ? 'ด่วน' : 'ASAP')}`);
    } else if (sample.pickupTime) {
      lines.push(`${ptLabel}: ${sample.pickupTime}`);
    }
  }
  lines.push('');
  const byCategory = {};
  sample.items.forEach((i) => {
    const cat = i.category || 'Other';
    (byCategory[cat] = byCategory[cat] || []).push(i);
  });
  Object.entries(byCategory).forEach(([cat, list]) => {
    const sampleItem = sample.items.find((i) => i.category === cat);
    lines.push(`*${t(cat, sampleItem?.category_th) || cat}*`);
    list.forEach((i) => {
      const addonText = i.addons?.length ? ` (+${i.addons.map((a) => t(a.name, a.name_th)).join(', +')})` : '';
      const noteText = i.note?.trim() ? ` (${i.note.trim()})` : '';
      const lineTotal = (i.price + (i.addons?.reduce((a, b) => a + Number(b.price), 0) || 0)) * i.qty;
      lines.push(`• ${i.qty}x ${t(i.name, i.name_th)}${addonText}${noteText} - ${currency}${lineTotal.toFixed(2)}`);
    });
    lines.push('');
  });
  lines.push(`${t(settings?.total_items_label, settings?.total_items_label_th) || (L ? 'จำนวนชิ้น' : 'Total Items')}: ${sample.items.reduce((s, i) => s + i.qty, 0)}`);
  lines.push(`${t(settings?.food_total_label, settings?.food_total_label_th) || (L ? 'รวมอาหาร' : 'Food Total')}: *${currency}${foodTotal.toFixed(2)}*`);
  if (sample.orderType === 'delivery')
    lines.push(`${t(settings?.delivery_label, settings?.delivery_label_th) || (L ? 'ค่าจัดส่ง' : 'Delivery')}: ${t(settings?.delivery_pending_label, settings?.delivery_pending_label_th) || (L ? 'แจ้งภายหลัง' : 'To be confirmed')}`);
  lines.push('');
  lines.push(t(settings?.payment_message, settings?.payment_message_th) || DEFAULT_PAYMENT_MESSAGE);
  return lines.join('\n');
};

export default function WhatsAppMessagePreview({ settings }) {
  const [orderType, setOrderType] = useState('delivery');
  const sample = { ...SAMPLE, orderType };

  const enMessage = useMemo(() => buildMessage(settings, 'en', sample), [settings, orderType]);
  const thMessage = useMemo(() => buildMessage(settings, 'th', sample), [settings, orderType]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-stone-400 px-1">
        Preview the WhatsApp order message your customers send, using your current labels. Sample data is shown — toggle the order type to see how delivery vs. pick-up changes the format.
      </p>

      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-2">Sample Order Type</h3>
        <div className="grid grid-cols-2 gap-2">
          {['delivery', 'pickup'].map((opt) => (
            <button
              key={opt}
              onClick={() => setOrderType(opt)}
              className={`py-2.5 rounded-full text-sm font-medium transition-colors ${
                orderType === opt ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'
              }`}
            >
              {opt === 'delivery' ? 'Delivery' : 'Pick-up'}
            </button>
          ))}
        </div>
      </div>

      {[
        { label: 'English', msg: enMessage },
        { label: 'ภาษาไทย', msg: thMessage },
      ].map(({ label, msg }) => (
        <div key={label} className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-stone-100 bg-stone-50">
            <MessageSquare className="w-4 h-4 text-stone-400" />
            <span className="text-xs font-semibold text-stone-600">{label}</span>
          </div>
          <pre className="p-4 text-xs text-stone-700 whitespace-pre-wrap font-mono leading-relaxed">{msg}</pre>
        </div>
      ))}
    </div>
  );
}