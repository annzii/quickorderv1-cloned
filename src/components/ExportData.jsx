import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Check } from 'lucide-react';

// Escape a value for CSV — wraps in quotes if it contains comma, quote, or newline.
const csvCell = (val) => {
  const s = String(val ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}`;
  return s;
};

const toCSV = (headers, rows) => {
  const lines = [headers.join(',')];
  rows.forEach((r) => lines.push(headers.map((h) => csvCell(r[h])).join(',')));
  return lines.join('\r\n');
};

// Build an HTML table string that Excel opens cleanly as a multi-sheet workbook.
const toXLS = (sheets) => {
  const sheetsXml = sheets.map((s) => `
  <Worksheet ss:Name="${s.name}">
   <Table>
    <Row>${s.headers.map((h) => `<Cell><Data ss:Type="String">${String(h).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>`).join('')}</Row>
    ${s.rows.map((r) => `<Row>${s.headers.map((h) => {
      const v = r[h];
      const isNum = typeof v === 'number' && isFinite(v);
      const safe = String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<Cell><Data ss:Type="${isNum ? 'Number' : 'String'}">${safe}</Data></Cell>`;
    }).join('')}</Row>`).join('')}
   </Table>
  </Worksheet>`).join('');
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${sheetsXml}
</Workbook>`;
};

const download = (filename, content, mime) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export default function ExportData({ items = [], categories = [], groups = [], tags = [], settings }) {
  const [done, setDone] = useState(null);

  const stamp = new Date().toISOString().slice(0, 10);

  const menuRows = items.map((it) => {
    const groupNames = (it.addon_group_ids || [])
      .map((id) => groups.find((g) => g.id === id)?.name)
      .filter(Boolean)
      .join('|');
    const tagNames = (it.menu_tag_ids || [])
      .map((id) => tags.find((tg) => tg.id === id)?.name)
      .filter(Boolean)
      .join('|');
    return {
      name: it.name || '',
      name_th: it.name_th || '',
      description: it.description || '',
      description_th: it.description_th || '',
      price: it.price ?? '',
      image_url: it.image_url || '',
      category: it.category || '',
      stock_status: it.stock_status || '',
      menu_tags: tagNames,
      addon_groups: groupNames,
    };
  });
  const menuHeaders = ['name', 'name_th', 'description', 'description_th', 'price', 'image_url', 'category', 'stock_status', 'menu_tags', 'addon_groups'];

  const catRows = categories.map((c) => ({
    name: c.name || '',
    name_th: c.name_th || '',
    order: c.order ?? '',
  }));
  const catHeaders = ['name', 'name_th', 'order'];

  // Flatten add-on groups: one row per add-on item, with its group repeated.
  const addonRows = [];
  groups.forEach((g) => {
    (g.items || []).forEach((it) => {
      addonRows.push({
        group_name: g.name || '',
        group_name_th: g.name_th || '',
        item_name: it.name || '',
        item_name_th: it.name_th || '',
        price: it.price ?? '',
      });
    });
    if (!(g.items || []).length) {
      addonRows.push({ group_name: g.name || '', group_name_th: g.name_th || '', item_name: '', item_name_th: '', price: '' });
    }
  });
  const addonHeaders = ['group_name', 'group_name_th', 'item_name', 'item_name_th', 'price'];

  const sheets = [
    { name: 'Menu Items', headers: menuHeaders, rows: menuRows },
    { name: 'Categories', headers: catHeaders, rows: catRows },
    { name: 'Add-on Groups', headers: addonHeaders, rows: addonRows },
  ];

  const exportCSV = () => {
    const parts = [
      '# Menu Items', toCSV(menuHeaders, menuRows), '',
      '# Categories', toCSV(catHeaders, catRows), '',
      '# Add-on Groups', toCSV(addonHeaders, addonRows), '',
    ];
    download(`menu-backup-${stamp}.csv`, parts.join('\r\n'), 'text/csv;charset=utf-8');
    setDone('csv');
  };

  const exportXLS = () => {
    download(`menu-backup-${stamp}.xls`, toXLS(sheets), 'application/vnd.ms-excel;charset=utf-8');
    setDone('xls');
  };

  const counts = [
    { label: 'Menu items', value: items.length },
    { label: 'Categories', value: categories.length },
    { label: 'Add-on groups', value: groups.length },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-stone-400 px-1">
        Download a full backup of your menu items, categories, and add-on groups (with their add-on items). Add-on groups and menu tags are resolved to names so the file is easy to read and re-importable.
      </p>

      <div className="grid grid-cols-3 gap-2">
        {counts.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-stone-100 p-3 text-center">
            <div className="text-lg font-bold text-stone-900">{c.value}</div>
            <div className="text-[11px] text-stone-400">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3">
        <button
          onClick={exportCSV}
          disabled={items.length === 0 && categories.length === 0 && groups.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-3 rounded-xl disabled:opacity-50"
        >
          <FileText className="w-4 h-4" /> Download CSV
          {done === 'csv' && <Check className="w-4 h-4 text-green-600" />}
        </button>
        <button
          onClick={exportXLS}
          disabled={items.length === 0 && categories.length === 0 && groups.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4" /> Download XLS (Excel)
          {done === 'xls' && <Check className="w-4 h-4 text-white" />}
        </button>
      </div>

      <p className="text-[11px] text-stone-400 px-1 leading-relaxed">
        CSV contains three sections (Menu Items, Categories, Add-on Groups) separated by blank lines. XLS opens as a single Excel workbook with one sheet per section. The menu-items format matches the Bulk Import columns, so you can re-import after editing.
      </p>
    </div>
  );
}