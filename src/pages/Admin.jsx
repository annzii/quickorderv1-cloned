import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Pencil, Trash2, X, Save, Check, UtensilsCrossed, Layers, Tag, Tags, Type, ChevronRight, ArrowLeft, MessageSquare, Upload, GripVertical, Download } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import CategoryManager from '@/components/CategoryManager';
import TypographyManager from '@/components/TypographyManager';
import WhatsAppMessagePreview from '@/components/WhatsAppMessagePreview';
import BulkImport from '@/components/BulkImport';
import MenuTagManager from '@/components/MenuTagManager';
import ExportData from '@/components/ExportData';

const STOCK_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'limited', label: 'Limited' },
  { value: 'sold_out_today', label: 'Sold out today' },
  { value: 'not_available', label: 'Not available' },
];

const STOCK_BADGES = {
  available: 'bg-green-100 text-green-700',
  limited: 'bg-amber-100 text-amber-700',
  sold_out_today: 'bg-orange-100 text-orange-700',
  not_available: 'bg-stone-200 text-stone-500',
};

const SECTIONS = [
  { key: 'items', label: 'Menu Items', icon: UtensilsCrossed },
  { key: 'addons', label: 'Add-on Groups', icon: Layers },
  { key: 'menu_tags', label: 'Menu Tags', icon: Tags },
  { key: 'categories', label: 'Categories', icon: Tag },
  { key: 'typography', label: 'Typography', icon: Type },
  { key: 'whatsapp_preview', label: 'WhatsApp Preview', icon: MessageSquare },
  { key: 'bulk_import', label: 'Bulk Import', icon: Upload },
  { key: 'export', label: 'Export Data', icon: Download },
];

const emptyItem = {
  name: '',
  name_th: '',
  description: '',
  description_th: '',
  price: '',
  image_url: '',
  category: '',
  category_th: '',
  stock_status: 'available',
  addon_group_ids: [],
  menu_tag_ids: [],
};

const emptyGroup = { name: '', name_th: '', items: [] };

export default function Admin() {
  const { user, isLoadingAuth } = useAuth();
  const [tab, setTab] = useState(null);
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(emptyItem);
  const [groupEditing, setGroupEditing] = useState(null);
  const [groupDraft, setGroupDraft] = useState(emptyGroup);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuTags, setMenuTags] = useState([]);
  const [itemOrder, setItemOrder] = useState([]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [groupOrder, setGroupOrder] = useState([]);
  const [savingGroupOrder, setSavingGroupOrder] = useState(false);
  const [itemFilter, setItemFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [menu, s, ag, cats, tags] = await Promise.all([
        base44.entities.MenuItem.list(),
        base44.entities.StoreSettings.list(),
        base44.entities.AddonGroup.list(),
        base44.entities.Category.list(),
        base44.entities.MenuTag.list(),
      ]);
      setItems(menu);
      setSettings(s[0] || null);
      setGroups((ag || []).sort((a, b) => (a.order ?? 999) - (b.order ?? 999)));
      setMenuTags((tags || []).sort((a, b) => (a.order ?? 999) - (b.order ?? 999)));
      let catList = (cats || []).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      if (catList.length === 0 && menu.length > 0) {
        const uniqueCats = Array.from(new Set(menu.map((i) => i.category).filter(Boolean)));
        if (uniqueCats.length > 0) {
          await base44.entities.Category.bulkCreate(
            uniqueCats.map((name, i) => ({ name, name_th: menu.find((it) => it.category === name)?.category_th || '', order: i }))
          );
          catList = (await base44.entities.Category.list()).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        }
      }
      setCategories(catList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const saved = settings?.menu_item_order || [];
    const savedItems = saved.map((id) => items.find((it) => it.id === id)).filter(Boolean);
    const known = items.filter((it) => !saved.includes(it.id));
    setItemOrder([...savedItems, ...known]);
  }, [items, settings]);

  useEffect(() => {
    setGroupOrder(groups.slice());
  }, [groups]);

  if (!isLoadingAuth && user?.role !== 'admin') return <Navigate to="/" replace />;
  if (isLoadingAuth) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-7 h-7 border-4 border-stone-200 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }

  const currency = settings?.currency_symbol || '$';
  const filteredOrder = itemFilter === 'all' ? itemOrder : itemOrder.filter((it) => it.category === itemFilter);
  const allSelected = filteredOrder.length > 0 && filteredOrder.every((it) => selectedIds.includes(it.id));
  const toggleSelect = (id) => setSelectedIds((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const toggleSelectAll = () => setSelectedIds(allSelected ? [] : filteredOrder.map((it) => it.id));
  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected item${selectedIds.length > 1 ? 's' : ''}?`)) return;
    await Promise.all(selectedIds.map((id) => base44.entities.MenuItem.delete(id)));
    setSelectedIds([]);
    load();
  };

  // ---- Menu item helpers ----
  const openNew = () => { setDraft(emptyItem); setEditing('new'); };
  const openEdit = (item) => {
    setDraft({
      name: item.name || '',
      name_th: item.name_th || '',
      description: item.description || '',
      description_th: item.description_th || '',
      price: String(item.price ?? ''),
      image_url: item.image_url || '',
      category: item.category || '',
      category_th: item.category_th || '',
      stock_status: item.stock_status || (item.available === false ? 'not_available' : 'available'),
      addon_group_ids: item.addon_group_ids || [],
      menu_tag_ids: item.menu_tag_ids || [],
    });
    setEditing(item.id);
  };

  const saveItem = async () => {
    const payload = {
      name: draft.name,
      name_th: draft.name_th,
      description: draft.description,
      description_th: draft.description_th,
      price: Number(draft.price) || 0,
      image_url: draft.image_url,
      category: draft.category,
      category_th: draft.category_th,
      stock_status: draft.stock_status,
      addon_group_ids: draft.addon_group_ids || [],
      menu_tag_ids: draft.menu_tag_ids || [],
    };
    if (editing === 'new') {
      await base44.entities.MenuItem.create(payload);
    } else {
      await base44.entities.MenuItem.update(editing, payload);
    }
    setEditing(null);
    load();
  };

  const deleteItem = async (id) => {
    if (!confirm('Delete this menu item?')) return;
    await base44.entities.MenuItem.delete(id);
    load();
  };

  const toggleGroupOnItem = (gid) => {
    setDraft((d) => ({
      ...d,
      addon_group_ids: d.addon_group_ids.includes(gid)
        ? d.addon_group_ids.filter((x) => x !== gid)
        : [...d.addon_group_ids, gid],
    }));
  };

  const toggleTagOnItem = (tid) => {
    setDraft((d) => ({
      ...d,
      menu_tag_ids: d.menu_tag_ids.includes(tid)
        ? d.menu_tag_ids.filter((x) => x !== tid)
        : [...d.menu_tag_ids, tid],
    }));
  };

  // ---- Item order helpers ----
  const onItemDragEnd = (res) => {
    if (!res.destination || res.destination.index === res.source.index) return;
    const displayed = itemFilter === 'all' ? itemOrder : itemOrder.filter((it) => it.category === itemFilter);
    const movedItem = displayed[res.source.index];
    const targetItem = displayed[res.destination.index];
    const withoutMoved = itemOrder.filter((it) => it.id !== movedItem.id);
    const targetIdx = withoutMoved.findIndex((it) => it.id === targetItem.id);
    const insertAt = res.destination.index > res.source.index ? targetIdx + 1 : targetIdx;
    withoutMoved.splice(insertAt, 0, movedItem);
    setItemOrder(withoutMoved);
  };
  const saveItemOrder = async () => {
    setSavingOrder(true);
    try {
      const ids = itemOrder.map((it) => it.id);
      if (settings?.id) {
        await base44.entities.StoreSettings.update(settings.id, { menu_item_order: ids });
      } else {
        await base44.entities.StoreSettings.create({ store_name: '', whatsapp_number: '', menu_item_order: ids });
      }
      load();
    } finally {
      setSavingOrder(false);
    }
  };

  // ---- Add-on group order helpers ----
  const onGroupDragEnd = (res) => {
    if (!res.destination || res.destination.index === res.source.index) return;
    const next = [...groupOrder];
    const [moved] = next.splice(res.source.index, 1);
    next.splice(res.destination.index, 0, moved);
    setGroupOrder(next);
  };
  const saveGroupOrder = async () => {
    setSavingGroupOrder(true);
    try {
      await base44.entities.AddonGroup.bulkUpdate(
        groupOrder.map((g, i) => ({ id: g.id, order: i }))
      );
      load();
    } finally {
      setSavingGroupOrder(false);
    }
  };

  // ---- Add-on group helpers ----
  const openGroupNew = () => { setGroupDraft(emptyGroup); setGroupEditing('new'); };
  const openGroupEdit = (g) => {
    setGroupDraft({ name: g.name || '', name_th: g.name_th || '', items: (g.items || []).map((it) => ({ name: it.name, name_th: it.name_th || '', price: String(it.price) })) });
    setGroupEditing(g.id);
  };
  const saveGroup = async () => {
    const payload = {
      name: groupDraft.name,
      name_th: groupDraft.name_th,
      items: (groupDraft.items || []).map((it) => ({ name: it.name, name_th: it.name_th, price: Number(it.price) || 0 })),
    };
    if (groupEditing === 'new') {
      await base44.entities.AddonGroup.create(payload);
    } else {
      await base44.entities.AddonGroup.update(groupEditing, payload);
    }
    setGroupEditing(null);
    load();
  };
  const deleteGroup = async (id) => {
    if (!confirm('Delete this add-on group?')) return;
    await base44.entities.AddonGroup.delete(id);
    load();
  };
  const agAddItem = () => setGroupDraft({ ...groupDraft, items: [...(groupDraft.items || []), { name: '', name_th: '', price: '' }] });
  const agUpdateItem = (i, field, val) => {
    const next = [...(groupDraft.items || [])];
    next[i] = { ...next[i], [field]: val };
    setGroupDraft({ ...groupDraft, items: next });
  };
  const agRemoveItem = (i) => setGroupDraft({ ...groupDraft, items: (groupDraft.items || []).filter((_, idx) => idx !== i) });

  // ---- Settings helpers ----
  const addHour = () => setSettingsDraft({ ...settingsDraft, operating_hours: [...(settingsDraft.operating_hours || []), { days: '', days_th: '', open: '', close: '', closed: false }] });
  const updateHour = (i, field, val) => {
    const next = [...(settingsDraft.operating_hours || [])];
    next[i] = { ...next[i], [field]: val };
    setSettingsDraft({ ...settingsDraft, operating_hours: next });
  };
  const removeHour = (i) => setSettingsDraft({ ...settingsDraft, operating_hours: (settingsDraft.operating_hours || []).filter((_, idx) => idx !== i) });

  const saveSettings = async () => {
    if (settings?.id) {
      await base44.entities.StoreSettings.update(settings.id, settingsDraft);
    } else {
      await base44.entities.StoreSettings.create(settingsDraft);
    }
    setSettingsOpen(false);
    load();
  };

  const openSettings = () => {
    setSettingsDraft({
      store_name: settings?.store_name || '',
      store_name_th: settings?.store_name_th || '',
      logo_url: settings?.logo_url || '',
      description: settings?.description || '',
      description_th: settings?.description_th || '',
      whatsapp_number: settings?.whatsapp_number || '',
      phone_number: settings?.phone_number || '',
      address: settings?.address || '',
      address_th: settings?.address_th || '',
      operating_hours: settings?.operating_hours?.length ? settings.operating_hours.map((h) => ({ days: '', days_th: '', ...h })) : [{ days: '', days_th: '', open: '', close: '', closed: false }],
      instagram_url: settings?.instagram_url || '',
      facebook_url: settings?.facebook_url || '',
      website_url: settings?.website_url || '',
      google_review_url: settings?.google_review_url || '',
      pickup_address: settings?.pickup_address || '',
      pickup_address_th: settings?.pickup_address_th || '',
      currency_symbol: settings?.currency_symbol || '$',
      payment_message: settings?.payment_message || '',
      payment_message_th: settings?.payment_message_th || '',
      special_request_label: settings?.special_request_label || '',
      special_request_label_th: settings?.special_request_label_th || '',
      special_request_placeholder: settings?.special_request_placeholder || '',
      special_request_placeholder_th: settings?.special_request_placeholder_th || '',
      total_items_label: settings?.total_items_label || 'Total Items',
      total_items_label_th: settings?.total_items_label_th || 'จำนวนชิ้น',
      food_total_label: settings?.food_total_label || 'Food Total',
      food_total_label_th: settings?.food_total_label_th || 'รวมอาหาร',
      delivery_label: settings?.delivery_label || 'Delivery',
      delivery_label_th: settings?.delivery_label_th || 'ค่าจัดส่ง',
      delivery_pending_label: settings?.delivery_pending_label || 'To be confirmed',
      delivery_pending_label_th: settings?.delivery_pending_label_th || 'แจ้งภายหลัง',
      cart_review_label: settings?.cart_review_label || 'Review Order',
      cart_review_label_th: settings?.cart_review_label_th || 'ตรวจสอบคำสั่งซื้อ',
      cart_title_label: settings?.cart_title_label || 'Your Cart',
      cart_title_label_th: settings?.cart_title_label_th || 'ตะกร้าของคุณ',
      cart_empty_label: settings?.cart_empty_label || 'Your cart is empty',
      cart_empty_label_th: settings?.cart_empty_label_th || 'ตะกร้าของคุณว่างเปล่า',
      order_type_label: settings?.order_type_label || 'Order Type',
      order_type_label_th: settings?.order_type_label_th || 'ประเภทคำสั่งซื้อ',
      delivery_opt_label: settings?.delivery_opt_label || 'Delivery',
      delivery_opt_label_th: settings?.delivery_opt_label_th || 'จัดส่ง',
      pickup_opt_label: settings?.pickup_opt_label || 'Pick-up',
      pickup_opt_label_th: settings?.pickup_opt_label_th || 'มารับเอง',
      your_details_label: settings?.your_details_label || 'Your Details',
      your_details_label_th: settings?.your_details_label_th || 'รายละเอียดของคุณ',
      required_label: settings?.required_label || 'required',
      required_label_th: settings?.required_label_th || 'จำเป็น',
      name_placeholder: settings?.name_placeholder || 'Name *',
      name_placeholder_th: settings?.name_placeholder_th || 'ชื่อ *',
      phone_placeholder: settings?.phone_placeholder || 'Phone number *',
      phone_placeholder_th: settings?.phone_placeholder_th || 'เบอร์โทร *',
      address_placeholder: settings?.address_placeholder || 'Delivery address / location *',
      address_placeholder_th: settings?.address_placeholder_th || 'ที่อยู่จัดส่ง / สถานที่ *',
      map_link_placeholder: settings?.map_link_placeholder || 'Google Maps location link (optional)',
      map_link_placeholder_th: settings?.map_link_placeholder_th || 'ลิงก์ Google Maps (ไม่บังคับ)',
      pickup_at_label: settings?.pickup_at_label || 'Pick-up at',
      pickup_at_label_th: settings?.pickup_at_label_th || 'รับที่',
      preferred_time_label: settings?.preferred_time_label || 'Preferred pick-up time',
      preferred_time_label_th: settings?.preferred_time_label_th || 'เวลารับที่ต้องการ',
      asap_label: settings?.asap_label || 'ASAP',
      asap_label_th: settings?.asap_label_th || 'ด่วน',
      select_time_label: settings?.select_time_label || 'Select Time',
      select_time_label_th: settings?.select_time_label_th || 'เลือกเวลา',
      note_label: settings?.note_label || 'Note',
      note_label_th: settings?.note_label_th || 'หมายเหตุ',
      opening_whatsapp_label: settings?.opening_whatsapp_label || 'Opening WhatsApp…',
      opening_whatsapp_label_th: settings?.opening_whatsapp_label_th || 'กำลังเปิด WhatsApp…',
      place_order_label: settings?.place_order_label || 'Place Order via WhatsApp',
      place_order_label_th: settings?.place_order_label_th || 'สั่งซื้อผ่าน WhatsApp',
      add_to_cart_label: settings?.add_to_cart_label || 'Add to cart',
      add_to_cart_label_th: settings?.add_to_cart_label_th || 'เพิ่มลงตะกร้า',
      thankyou_header_label: settings?.thankyou_header_label || 'Order Sent',
      thankyou_header_label_th: settings?.thankyou_header_label_th || 'ส่งคำสั่งซื้อแล้ว',
      thankyou_title_label: settings?.thankyou_title_label || 'Thank you for your order!',
      thankyou_title_label_th: settings?.thankyou_title_label_th || 'ขอบคุณสำหรับคำสั่งซื้อ!',
      thankyou_subtitle_label: settings?.thankyou_subtitle_label || 'Our staff will get back to you with a confirmation in a few minutes. Please keep an eye on your WhatsApp.',
      thankyou_subtitle_label_th: settings?.thankyou_subtitle_label_th || 'พนักงานของเราจะติดต่อกลับเพื่อยืนยันภายในไม่กี่นาที กรุณาเฝ้าดู WhatsApp ของคุณ',
      thankyou_connect_label: settings?.thankyou_connect_label || 'Stay Connected',
      thankyou_connect_label_th: settings?.thankyou_connect_label_th || 'ติดตามเรา',
      thankyou_review_label: settings?.thankyou_review_label || 'Review us on Google',
      thankyou_review_label_th: settings?.thankyou_review_label_th || 'รีวิวเราบน Google',
      thankyou_review_note: settings?.thankyou_review_note || 'Every rating helps more pizza lovers find us.\nThank you for supporting our little local pizzeria. ❤️',
      thankyou_review_note_th: settings?.thankyou_review_note_th || 'ทุกคะแนนช่วยให้ลูกค้ามากขึ้นเจอเรา\nขอบคุณที่สนับสนุนร้านเล็กๆ ของเรา ❤️',
      thankyou_suggestion: settings?.thankyou_suggestion || "Have a suggestion? We'd love to hear how we can do better. Drop us a message on WhatsApp.",
      thankyou_suggestion_th: settings?.thankyou_suggestion_th || 'มีข้อเสนอแนะ? เราอยากฟังว่าเราจะทำให้ดีขึ้นได้อย่างไร ส่งข้อความถึงเราได้ทาง WhatsApp',
      thankyou_back_label: settings?.thankyou_back_label || 'Back to Menu',
      thankyou_back_label_th: settings?.thankyou_back_label_th || 'กลับเมนู',
    });
    setSettingsOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-30">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-stone-900">Manage</h1>
          <button
            onClick={openSettings}
            className="text-xs font-medium text-white px-3 py-1.5 rounded-full bg-stone-900"
          >
            Store Settings
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-3">
        {tab === null ? (
          <div className="space-y-2">
            {SECTIONS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 border border-stone-100 hover:border-stone-300 transition-colors"
              >
                <Icon className="w-5 h-5 text-stone-400" />
                <span className="text-sm font-medium text-stone-700">{label}</span>
                <ChevronRight className="w-4 h-4 text-stone-300 ml-auto" />
              </button>
            ))}
          </div>
        ) : (
          <>
            <button onClick={() => setTab(null)} className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-900 transition-colors py-1">
              <ArrowLeft className="w-4 h-4" />
              All sections
            </button>
            {tab === 'items' ? (
          <>
            <select
              value={itemFilter}
              onChange={(e) => setItemFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500 bg-white mb-2"
            >
              <option value="all">All categories ({items.length})</option>
              {categories.map((c) => {
                const count = items.filter((it) => it.category === c.name).length;
                return (
                  <option key={c.id} value={c.name}>{c.name} ({count})</option>
                );
              })}
              {(() => {
                const usedCats = new Set(categories.map((c) => c.name));
                const orphanCats = Array.from(new Set(items.map((it) => it.category).filter((c) => c && !usedCats.has(c))));
                return orphanCats.map((name) => {
                  const count = items.filter((it) => it.category === name).length;
                  return <option key={name} value={name}>{name} ({count})</option>;
                });
              })()}
            </select>
            <button
              onClick={openNew}
              className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white font-semibold py-3 rounded-2xl"
            >
              <Plus className="w-4 h-4" /> Add Menu Item
            </button>

            {filteredOrder.length > 0 && (
              <div className="flex items-center justify-between gap-2 bg-stone-100 rounded-xl px-3 py-2 mt-2">
                <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs font-medium text-stone-600">
                  <span className={`w-4 h-4 rounded border flex items-center justify-center ${allSelected ? 'bg-stone-900 border-stone-900' : 'border-stone-300 bg-white'}`}>
                    {allSelected && <Check className="w-3 h-3 text-white" />}
                  </span>
                  {allSelected ? 'Deselect all' : 'Select all'}
                </button>
                {selectedIds.length > 0 && (
                  <button onClick={deleteSelected} className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700">
                    <Trash2 className="w-3.5 h-3.5" /> Delete selected ({selectedIds.length})
                  </button>
                )}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-7 h-7 border-4 border-stone-200 border-t-amber-600 rounded-full animate-spin" />
              </div>
            ) : filteredOrder.length === 0 ? (
              <p className="text-center text-stone-400 text-sm py-16">{items.length === 0 ? 'No items yet.' : 'No items in this category.'}</p>
            ) : (
              <DragDropContext onDragEnd={onItemDragEnd}>
                <Droppable droppableId="admin-items">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                      {filteredOrder.map((item, i) => {
                        const status = item.stock_status || (item.available === false ? 'not_available' : 'available');
                        const groupCount = (item.addon_group_ids || item.addon_options || []).length;
                        return (
                          <Draggable key={item.id} draggableId={item.id} index={i}>
                            {(p) => (
                              <div ref={p.innerRef} {...p.draggableProps} className={`flex items-center justify-between bg-white rounded-2xl p-3 border ${selectedIds.includes(item.id) ? 'border-amber-400 bg-amber-50/40' : 'border-stone-100'}`}>
                                <button onClick={() => toggleSelect(item.id)} className="pl-1 pr-1.5" aria-label="Select item">
                                  <span className={`w-4 h-4 rounded border flex items-center justify-center ${selectedIds.includes(item.id) ? 'bg-stone-900 border-stone-900' : 'border-stone-300 bg-white'}`}>
                                    {selectedIds.includes(item.id) && <Check className="w-3 h-3 text-white" />}
                                  </span>
                                </button>
                                <div {...p.dragHandleProps} className="pl-1 pr-1.5 text-stone-300 hover:text-stone-500 cursor-grab touch-none">
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-sm text-stone-900 truncate">{item.name}</h3>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STOCK_BADGES[status]}`}>
                                      {STOCK_OPTIONS.find((o) => o.value === status)?.label || 'Available'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-stone-400">
                                    {currency}{Number(item.price).toFixed(2)}
                                    {item.category ? ` · ${item.category}` : ''}
                                    {groupCount ? ` · ${groupCount} add-on group${groupCount > 1 ? 's' : ''}` : ''}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => openEdit(item)} className="p-2 text-stone-400 hover:text-stone-900">
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => deleteItem(item.id)} className="p-2 text-stone-400 hover:text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
            <button onClick={saveItemOrder} disabled={savingOrder || itemOrder.length === 0} className="w-full bg-stone-100 hover:bg-stone-200 disabled:opacity-60 text-stone-700 font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 mt-2">
              <Save className="w-4 h-4" /> {savingOrder ? 'Saving…' : 'Save Item Order'}
            </button>
          </>
        ) : tab === 'addons' ? (
          <>
            <button
              onClick={openGroupNew}
              className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white font-semibold py-3 rounded-2xl"
            >
              <Plus className="w-4 h-4" /> Add Add-on Group
            </button>
            <p className="text-xs text-stone-400 px-1">
              Create reusable add-on groups (e.g. Toppings, Extras) and attach them to menu items.
            </p>
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-7 h-7 border-4 border-stone-200 border-t-amber-600 rounded-full animate-spin" />
              </div>
            ) : groupOrder.length === 0 ? (
              <p className="text-center text-stone-400 text-sm py-16">No add-on groups yet.</p>
            ) : (
              <DragDropContext onDragEnd={onGroupDragEnd}>
                <Droppable droppableId="admin-groups">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                      {groupOrder.map((g, i) => (
                        <Draggable key={g.id} draggableId={g.id} index={i}>
                          {(p) => (
                            <div ref={p.innerRef} {...p.draggableProps} className="flex items-center bg-white rounded-2xl p-3 border border-stone-100">
                              <div {...p.dragHandleProps} className="pl-1 pr-1.5 text-stone-300 hover:text-stone-500 cursor-grab touch-none">
                                <GripVertical className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm text-stone-900">{g.name}</h3>
                                {g.items?.length > 0 && (
                                  <p className="text-xs text-stone-400 mt-0.5">
                                    {g.items.map((it) => `${it.name} (${currency}${Number(it.price).toFixed(0)})`).join(', ')}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => openGroupEdit(g)} className="p-2 text-stone-400 hover:text-stone-900">
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => deleteGroup(g.id)} className="p-2 text-stone-400 hover:text-red-500">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
            <button onClick={saveGroupOrder} disabled={savingGroupOrder || groupOrder.length === 0} className="w-full bg-stone-100 hover:bg-stone-200 disabled:opacity-60 text-stone-700 font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 mt-2">
              <Save className="w-4 h-4" /> {savingGroupOrder ? 'Saving…' : 'Save Group Order'}
            </button>
          </>
        ) : tab === 'menu_tags' ? (
          <MenuTagManager onSaved={load} />
        ) : tab === 'categories' ? (
          <CategoryManager onSaved={load} />
        ) : tab === 'typography' ? (
          <TypographyManager settings={settings} onSaved={load} />
        ) : tab === 'whatsapp_preview' ? (
          <WhatsAppMessagePreview settings={settings} />
        ) : tab === 'bulk_import' ? (
          <BulkImport categories={categories} groups={groups} tags={menuTags} onSaved={load} />
        ) : tab === 'export' ? (
          <ExportData items={items} categories={categories} groups={groups} tags={menuTags} settings={settings} />
        ) : null}
          </>
        )}
      </main>

      {/* Item editor modal */}
      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-stone-100 sticky top-0 bg-white">
              <h2 className="font-bold text-stone-900">{editing === 'new' ? 'New Item' : 'Edit Item'}</h2>
              <button onClick={() => setEditing(null)} className="p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              <input placeholder="Name (EN)" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
              <input placeholder="Name (TH)" value={draft.name_th} onChange={(e) => setDraft({ ...draft, name_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
              <textarea placeholder="Description (EN)" value={draft.description} rows={2} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500 resize-none" />
              <textarea placeholder="Description (TH)" value={draft.description_th} rows={2} onChange={(e) => setDraft({ ...draft, description_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500 resize-none" />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Price" type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} className="px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <select
                  value={draft.category}
                  onChange={(e) => {
                    const cat = categories.find((c) => c.name === e.target.value);
                    setDraft({ ...draft, category: e.target.value, category_th: cat?.name_th || '' });
                  }}
                  className="px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500 bg-white"
                >
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <input placeholder="Image URL — prefer square (1:1), ~800px, max 1500px" value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />

              <div>
                <h3 className="text-sm font-semibold text-stone-700 mb-2">Menu Tags</h3>
                {menuTags.length === 0 ? (
                  <p className="text-xs text-stone-400">No tags yet. Create some in the Menu Tags tab.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {menuTags.map((tg) => {
                      const selected = draft.menu_tag_ids.includes(tg.id);
                      return (
                        <button
                          key={tg.id}
                          onClick={() => toggleTagOnItem(tg.id)}
                          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full border text-xs font-medium transition-colors ${
                            selected ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-stone-200 bg-white text-stone-500'
                          }`}
                        >
                          {tg.icon_url && <img src={tg.icon_url} alt="" className="w-3.5 h-3.5 object-contain" />}
                          {tg.name_th ? `${tg.name} / ${tg.name_th}` : tg.name}
                          {selected && <Check className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-stone-700 mb-2">Stock Status</h3>
                <div className="grid grid-cols-2 gap-2">
                  {STOCK_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setDraft({ ...draft, stock_status: o.value })}
                      className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                        draft.stock_status === o.value
                          ? 'bg-stone-900 text-white'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-stone-700 mb-2">Add-on Groups</h3>
                {groups.length === 0 ? (
                  <p className="text-xs text-stone-400">No groups yet. Create some in the Add-on Groups tab.</p>
                ) : (
                  <div className="space-y-2">
                    {groups.map((g) => {
                      const selected = draft.addon_group_ids.includes(g.id);
                      return (
                        <button
                          key={g.id}
                          onClick={() => toggleGroupOnItem(g.id)}
                          className={`flex items-center justify-between w-full p-3 rounded-xl border transition-colors ${
                            selected ? 'border-amber-500 bg-amber-50' : 'border-stone-200 bg-white'
                          }`}
                        >
                          <div className="text-left">
                            <span className="text-sm text-stone-700 font-medium">{g.name}</span>
                            <span className="text-xs text-stone-400 block">{g.items?.length || 0} items</span>
                          </div>
                          {selected && <Check className="w-4 h-4 text-amber-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button onClick={saveItem} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 mt-2">
                <Save className="w-4 h-4" /> Save Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add-on group editor modal */}
      {groupEditing !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setGroupEditing(null)} />
          <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-stone-100 sticky top-0 bg-white">
              <h2 className="font-bold text-stone-900">{groupEditing === 'new' ? 'New Add-on Group' : 'Edit Add-on Group'}</h2>
              <button onClick={() => setGroupEditing(null)} className="p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              <input placeholder="Group name (EN)" value={groupDraft.name} onChange={(e) => setGroupDraft({ ...groupDraft, name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
              <input placeholder="Group name (TH)" value={groupDraft.name_th} onChange={(e) => setGroupDraft({ ...groupDraft, name_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
              <div className="space-y-2">
                {(groupDraft.items || []).map((it, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex gap-2">
                      <input placeholder="Add-on name (EN)" value={it.name} onChange={(e) => agUpdateItem(i, 'name', e.target.value)} className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                      <input placeholder="Price" type="number" value={it.price} onChange={(e) => agUpdateItem(i, 'price', e.target.value)} className="w-20 px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                      <button onClick={() => agRemoveItem(i)} className="p-2 text-stone-300 hover:text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                    <input placeholder="Add-on name (TH)" value={it.name_th || ''} onChange={(e) => agUpdateItem(i, 'name_th', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                  </div>
                ))}
                <button onClick={agAddItem} className="text-xs font-medium text-amber-700 flex items-center gap-1 py-1">
                  <Plus className="w-3 h-3" /> Add item
                </button>
              </div>
              <button onClick={saveGroup} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 mt-2">
                <Save className="w-4 h-4" /> Save Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-stone-100 sticky top-0 bg-white">
              <h2 className="font-bold text-stone-900">Store Settings</h2>
              <button onClick={() => setSettingsOpen(false)} className="p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              <input placeholder="Store name (EN)" value={settingsDraft.store_name} onChange={(e) => setSettingsDraft({ ...settingsDraft, store_name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
              <input placeholder="Store name (TH)" value={settingsDraft.store_name_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, store_name_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
              <input placeholder="Logo image URL" value={settingsDraft.logo_url} onChange={(e) => setSettingsDraft({ ...settingsDraft, logo_url: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
              <textarea placeholder="Shop description (EN)" rows={2} value={settingsDraft.description} onChange={(e) => setSettingsDraft({ ...settingsDraft, description: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500 resize-none" />
              <textarea placeholder="Shop description (TH)" rows={2} value={settingsDraft.description_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, description_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500 resize-none" />
              <input placeholder="Address (EN)" value={settingsDraft.address} onChange={(e) => setSettingsDraft({ ...settingsDraft, address: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
              <input placeholder="Address (TH)" value={settingsDraft.address_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, address_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-stone-700">Operating Hours</h3>
                  <button onClick={addHour} className="text-xs font-medium text-amber-700 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
                </div>
                <div className="space-y-2">
                  {(settingsDraft.operating_hours || []).map((h, i) => (
                    <div key={i} className="flex flex-col gap-2 p-2 rounded-xl border border-stone-200">
                      <div className="flex items-center gap-2">
                        <input placeholder="Days (EN)" value={h.days} onChange={(e) => updateHour(i, 'days', e.target.value)} className="flex-1 px-2.5 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                        <label className="flex items-center gap-1 text-xs text-stone-500 whitespace-nowrap">
                          <input type="checkbox" checked={!!h.closed} onChange={(e) => updateHour(i, 'closed', e.target.checked)} className="w-3.5 h-3.5" /> Closed
                        </label>
                        <button onClick={() => removeHour(i)} className="p-1 text-stone-300 hover:text-red-500"><X className="w-4 h-4" /></button>
                      </div>
                      <input placeholder="Days (TH)" value={h.days_th || ''} onChange={(e) => updateHour(i, 'days_th', e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                      {!h.closed && (
                        <div className="flex items-center gap-2">
                          <input type="time" value={h.open} onChange={(e) => updateHour(i, 'open', e.target.value)} className="flex-1 px-2.5 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                          <span className="text-stone-400 text-xs">to</span>
                          <input type="time" value={h.close} onChange={(e) => updateHour(i, 'close', e.target.value)} className="flex-1 px-2.5 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <input placeholder="Phone number" value={settingsDraft.phone_number} onChange={(e) => setSettingsDraft({ ...settingsDraft, phone_number: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
              <input placeholder="WhatsApp number (e.g. 66812345678)" value={settingsDraft.whatsapp_number} onChange={(e) => setSettingsDraft({ ...settingsDraft, whatsapp_number: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
              <input placeholder="Instagram URL" value={settingsDraft.instagram_url} onChange={(e) => setSettingsDraft({ ...settingsDraft, instagram_url: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
              <input placeholder="Facebook URL" value={settingsDraft.facebook_url} onChange={(e) => setSettingsDraft({ ...settingsDraft, facebook_url: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
              <input placeholder="Website URL" value={settingsDraft.website_url} onChange={(e) => setSettingsDraft({ ...settingsDraft, website_url: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
              <input placeholder="Google Business Profile review URL" value={settingsDraft.google_review_url} onChange={(e) => setSettingsDraft({ ...settingsDraft, google_review_url: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
              <input placeholder="Currency symbol" value={settingsDraft.currency_symbol} onChange={(e) => setSettingsDraft({ ...settingsDraft, currency_symbol: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
              <textarea placeholder="Pickup address (EN)" rows={2} value={settingsDraft.pickup_address} onChange={(e) => setSettingsDraft({ ...settingsDraft, pickup_address: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500 resize-none" />
              <textarea placeholder="Pickup address (TH)" rows={2} value={settingsDraft.pickup_address_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, pickup_address_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500 resize-none" />
              <div>
                <h3 className="text-sm font-semibold text-stone-700 mb-2">Special Request Field</h3>
                <input placeholder="Label (EN) — e.g. Special request (optional)" value={settingsDraft.special_request_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, special_request_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Label (TH) — e.g. หมายเหตุพิเศษ (ไม่บังคับ)" value={settingsDraft.special_request_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, special_request_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Placeholder (EN) — e.g. less spicy, no onion" value={settingsDraft.special_request_placeholder} onChange={(e) => setSettingsDraft({ ...settingsDraft, special_request_placeholder: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Placeholder (TH) — e.g. เผ็ดน้อย ไม่ใส่หัวหอม" value={settingsDraft.special_request_placeholder_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, special_request_placeholder_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-stone-700 mb-2">Cart Page Labels</h3>
                <input placeholder="Review order label (EN) — e.g. Review Order" value={settingsDraft.cart_review_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, cart_review_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Review order label (TH) — e.g. ตรวจสอบคำสั่งซื้อ" value={settingsDraft.cart_review_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, cart_review_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Cart title label (EN) — e.g. Your Cart" value={settingsDraft.cart_title_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, cart_title_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Cart title label (TH) — e.g. ตะกร้าของคุณ" value={settingsDraft.cart_title_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, cart_title_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Cart empty label (EN) — e.g. Your cart is empty" value={settingsDraft.cart_empty_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, cart_empty_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Cart empty label (TH) — e.g. ตะกร้าของคุณว่างเปล่า" value={settingsDraft.cart_empty_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, cart_empty_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Order type label (EN) — e.g. Order Type" value={settingsDraft.order_type_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, order_type_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Order type label (TH) — e.g. ประเภทคำสั่งซื้อ" value={settingsDraft.order_type_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, order_type_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Delivery option label (EN) — e.g. Delivery" value={settingsDraft.delivery_opt_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, delivery_opt_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Delivery option label (TH) — e.g. จัดส่ง" value={settingsDraft.delivery_opt_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, delivery_opt_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Pick-up option label (EN) — e.g. Pick-up" value={settingsDraft.pickup_opt_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, pickup_opt_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Pick-up option label (TH) — e.g. มารับเอง" value={settingsDraft.pickup_opt_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, pickup_opt_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Your details label (EN) — e.g. Your Details" value={settingsDraft.your_details_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, your_details_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Your details label (TH) — e.g. รายละเอียดของคุณ" value={settingsDraft.your_details_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, your_details_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Required label (EN) — e.g. required" value={settingsDraft.required_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, required_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Required label (TH) — e.g. จำเป็น" value={settingsDraft.required_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, required_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Name placeholder (EN) — e.g. Name *" value={settingsDraft.name_placeholder} onChange={(e) => setSettingsDraft({ ...settingsDraft, name_placeholder: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Name placeholder (TH) — e.g. ชื่อ *" value={settingsDraft.name_placeholder_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, name_placeholder_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Phone placeholder (EN) — e.g. Phone number *" value={settingsDraft.phone_placeholder} onChange={(e) => setSettingsDraft({ ...settingsDraft, phone_placeholder: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Phone placeholder (TH) — e.g. เบอร์โทร *" value={settingsDraft.phone_placeholder_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, phone_placeholder_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Address placeholder (EN) — e.g. Delivery address / location *" value={settingsDraft.address_placeholder} onChange={(e) => setSettingsDraft({ ...settingsDraft, address_placeholder: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Address placeholder (TH) — e.g. ที่อยู่จัดส่ง / สถานที่ *" value={settingsDraft.address_placeholder_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, address_placeholder_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Map link placeholder (EN) — e.g. Google Maps location link (optional)" value={settingsDraft.map_link_placeholder} onChange={(e) => setSettingsDraft({ ...settingsDraft, map_link_placeholder: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Map link placeholder (TH) — e.g. ลิงก์ Google Maps (ไม่บังคับ)" value={settingsDraft.map_link_placeholder_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, map_link_placeholder_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Pick-up at label (EN) — e.g. Pick-up at" value={settingsDraft.pickup_at_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, pickup_at_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Pick-up at label (TH) — e.g. รับที่" value={settingsDraft.pickup_at_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, pickup_at_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Preferred time label (EN) — e.g. Preferred pick-up time" value={settingsDraft.preferred_time_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, preferred_time_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Preferred time label (TH) — e.g. เวลารับที่ต้องการ" value={settingsDraft.preferred_time_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, preferred_time_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="ASAP label (EN) — e.g. ASAP" value={settingsDraft.asap_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, asap_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="ASAP label (TH) — e.g. ด่วน" value={settingsDraft.asap_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, asap_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Select time label (EN) — e.g. Select Time" value={settingsDraft.select_time_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, select_time_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Select time label (TH) — e.g. เลือกเวลา" value={settingsDraft.select_time_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, select_time_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Note label (EN) — e.g. Note" value={settingsDraft.note_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, note_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Note label (TH) — e.g. หมายเหตุ" value={settingsDraft.note_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, note_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Opening WhatsApp label (EN) — e.g. Opening WhatsApp…" value={settingsDraft.opening_whatsapp_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, opening_whatsapp_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Opening WhatsApp label (TH) — e.g. กำลังเปิด WhatsApp…" value={settingsDraft.opening_whatsapp_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, opening_whatsapp_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Place order label (EN) — e.g. Place Order via WhatsApp" value={settingsDraft.place_order_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, place_order_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Place order label (TH) — e.g. สั่งซื้อผ่าน WhatsApp" value={settingsDraft.place_order_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, place_order_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Add to cart label (EN) — e.g. Add to cart" value={settingsDraft.add_to_cart_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, add_to_cart_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Add to cart label (TH) — e.g. เพิ่มลงตะกร้า" value={settingsDraft.add_to_cart_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, add_to_cart_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-stone-700 mb-2">Order Summary Labels</h3>
                <input placeholder="Total Items label (EN) — e.g. Total Items" value={settingsDraft.total_items_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, total_items_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Total Items label (TH) — e.g. จำนวนชิ้น" value={settingsDraft.total_items_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, total_items_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Food Total label (EN) — e.g. Food Total" value={settingsDraft.food_total_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, food_total_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Food Total label (TH) — e.g. รวมอาหาร" value={settingsDraft.food_total_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, food_total_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Delivery label (EN) — e.g. Delivery" value={settingsDraft.delivery_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, delivery_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Delivery label (TH) — e.g. ค่าจัดส่ง" value={settingsDraft.delivery_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, delivery_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Delivery pending label (EN) — e.g. To be confirmed" value={settingsDraft.delivery_pending_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, delivery_pending_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Delivery pending label (TH) — e.g. แจ้งภายหลัง" value={settingsDraft.delivery_pending_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, delivery_pending_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-stone-700 mb-2">Payment Message</h3>
                <textarea placeholder="Payment message (EN)" rows={2} value={settingsDraft.payment_message} onChange={(e) => setSettingsDraft({ ...settingsDraft, payment_message: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500 resize-none" />
                <textarea placeholder="Payment message (TH)" rows={2} value={settingsDraft.payment_message_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, payment_message_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500 resize-none" />
                <p className="text-xs text-stone-400 pt-1.5">⚠️ Food Allergies: If you have a serious allergy, please contact us before ordering.</p>
                <p className="text-xs text-stone-400 pt-0.5">⚠️ ผู้แพ้อาหาร: หากคุณมีอาการแพ้อาหารอย่างรุนแรง กรุณาติดต่อเราก่อนสั่งอาหาร</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-stone-700 mb-2">Thank You Page Labels</h3>
                <input placeholder="Header label (EN) — e.g. Order Sent" value={settingsDraft.thankyou_header_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, thankyou_header_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Header label (TH) — e.g. ส่งคำสั่งซื้อแล้ว" value={settingsDraft.thankyou_header_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, thankyou_header_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Title label (EN) — e.g. Thank you for your order!" value={settingsDraft.thankyou_title_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, thankyou_title_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Title label (TH) — e.g. ขอบคุณสำหรับคำสั่งซื้อ!" value={settingsDraft.thankyou_title_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, thankyou_title_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <textarea placeholder="Subtitle (EN) — e.g. Our staff will get back to you…" rows={2} value={settingsDraft.thankyou_subtitle_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, thankyou_subtitle_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500 resize-none" />
                <textarea placeholder="Subtitle (TH) — e.g. พนักงานของเราจะติดต่อกลับ…" rows={2} value={settingsDraft.thankyou_subtitle_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, thankyou_subtitle_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500 resize-none" />
                <input placeholder="Stay connected label (EN) — e.g. Stay Connected" value={settingsDraft.thankyou_connect_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, thankyou_connect_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Stay connected label (TH) — e.g. ติดตามเรา" value={settingsDraft.thankyou_connect_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, thankyou_connect_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Review button label (EN) — e.g. Review us on Google" value={settingsDraft.thankyou_review_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, thankyou_review_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Review button label (TH) — e.g. รีวิวเราบน Google" value={settingsDraft.thankyou_review_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, thankyou_review_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <textarea placeholder="Review note (EN) — e.g. Every rating helps…" rows={2} value={settingsDraft.thankyou_review_note} onChange={(e) => setSettingsDraft({ ...settingsDraft, thankyou_review_note: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500 resize-none" />
                <textarea placeholder="Review note (TH) — e.g. ทุกคะแนนช่วยให้ลูกค้ามากขึ้นเจอเรา…" rows={2} value={settingsDraft.thankyou_review_note_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, thankyou_review_note_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500 resize-none" />
                <textarea placeholder="Suggestion message (EN) — e.g. Have a suggestion?…" rows={2} value={settingsDraft.thankyou_suggestion} onChange={(e) => setSettingsDraft({ ...settingsDraft, thankyou_suggestion: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500 resize-none" />
                <textarea placeholder="Suggestion message (TH) — e.g. มีข้อเสนอแนะ?…" rows={2} value={settingsDraft.thankyou_suggestion_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, thankyou_suggestion_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500 resize-none" />
                <input placeholder="Back to menu label (EN) — e.g. Back to Menu" value={settingsDraft.thankyou_back_label} onChange={(e) => setSettingsDraft({ ...settingsDraft, thankyou_back_label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
                <input placeholder="Back to menu label (TH) — e.g. กลับเมนู" value={settingsDraft.thankyou_back_label_th} onChange={(e) => setSettingsDraft({ ...settingsDraft, thankyou_back_label_th: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <button onClick={saveSettings} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}