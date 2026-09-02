import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, FileText, Check, AlertCircle, ClipboardPaste } from 'lucide-react';

const MENU_SAMPLE = `name,name_th,description,description_th,price,image_url,category,stock_status,menu_tags,addon_groups
Margherita Pizza,พิซซ่ามาร์การิต้า,Classic cheese tomato base,พิซซ่าชีสคลาสสิก,280,,Pizza,available,Spicy|Vegetarian,Toppings|Extras
Pepperoni Pizza,พิซซ่าเปปเปอโรนี,,,320,,Pizza,available,,Toppings
Garlic Bread,ขนมกระเทียม,Fresh baked with butter,ปั้นสดเนยสด,90,,Sides,available,Vegetarian,`;

const ADDON_SAMPLE = `group_name,group_name_th,item_name,item_name_th,price
Toppings,ท็อปปิ้ง,Extra Cheese,เพิ่มชีส,40
Toppings,ท็อปปิ้ง,Mushrooms,เห็ด,30
Toppings,ท็อปปิ้ง,Olives,มะกอก,30
Extras,เพิ่มเติม,Extra Sauce,ซอสเพิ่ม,20
Extras,เพิ่มเติม,Double Meat,เนื้อเพิ่ม,60`;

const STOCK_OPTIONS = ['available', 'limited', 'sold_out_today', 'not_available'];

// Parse a single CSV line, handling quoted fields.
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
};

const parseCSV = (text) => {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  // Drop leading rows where every cell is empty (e.g. a stray ",,,,,," row
  // pasted from a spreadsheet) so the real header row is detected.
  while (lines.length > 0 && parseCSVLine(lines[0]).every((c) => !c)) {
    lines.shift();
  }
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map((l) => {
    const cells = parseCSVLine(l);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cells[i] || ''; });
    return obj;
  });
  return { headers, rows };
};

export default function BulkImport({ categories = [], groups = [], tags = [], onSaved }) {
  const [mode, setMode] = useState('menu');
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const sample = mode === 'menu' ? MENU_SAMPLE : ADDON_SAMPLE;

  const handleParse = () => {
    setError('');
    setResult(null);
    if (!text.trim()) {
      setError('Please paste some data first.');
      setParsed(null);
      return;
    }
    const { headers, rows } = parseCSV(text);
    if (headers.length === 0 || rows.length === 0) {
      setError('Could not parse data. Make sure the first row is a header and there is at least one data row.');
      setParsed(null);
      return;
    }
    if (mode === 'menu') {
      const required = ['name', 'price'];
      const missing = required.filter((h) => !headers.includes(h));
      if (missing.length) {
        setError(`Missing required column(s): ${missing.join(', ')}. Required: name, price`);
        setParsed(null);
        return;
      }
    } else {
      const required = ['group_name', 'item_name', 'price'];
      const missing = required.filter((h) => !headers.includes(h));
      if (missing.length) {
        setError(`Missing required column(s): ${missing.join(', ')}. Required: group_name, item_name, price`);
        setParsed(null);
        return;
      }
    }
    setParsed({ headers, rows });
  };

  const handleImport = async () => {
    if (!parsed) return;
    setImporting(true);
    setError('');
    try {
      if (mode === 'menu') {
        const records = parsed.rows
          .filter((r) => r.name)
          .map((r) => {
            const status = STOCK_OPTIONS.includes(r.stock_status) ? r.stock_status : 'available';
            const cat = categories.find((c) => c.name === r.category);
            const tagNames = (r.menu_tags || '').split(/[|,]/).map((s) => s.trim()).filter(Boolean);
            const menu_tag_ids = tagNames
              .map((n) => tags.find((tg) => tg.name.toLowerCase() === n.toLowerCase())?.id)
              .filter(Boolean);
            const groupNames = (r.addon_groups || '').split(/[|,]/).map((s) => s.trim()).filter(Boolean);
            const addon_group_ids = groupNames
              .map((n) => groups.find((g) => g.name.toLowerCase() === n.toLowerCase())?.id)
              .filter(Boolean);
            return {
              name: r.name,
              name_th: r.name_th || '',
              description: r.description || '',
              description_th: r.description_th || '',
              price: Number(r.price) || 0,
              image_url: r.image_url || '',
              category: r.category || '',
              category_th: r.category_th || (cat?.name_th || ''),
              stock_status: status,
              addon_group_ids,
              menu_tag_ids,
            };
          });
        if (records.length === 0) {
          setError('No valid rows with a name found.');
          setImporting(false);
          return;
        }
        // Auto-create Category entities for any category names that don't exist yet,
        // so imported items show up under their category filter on the menu.
        const existingCatNames = new Set(categories.map((c) => c.name));
        const newCatNames = Array.from(new Set(records.map((r) => r.category).filter(Boolean)))
          .filter((n) => !existingCatNames.has(n));
        if (newCatNames.length > 0) {
          const baseOrder = categories.length;
          await base44.entities.Category.bulkCreate(
            newCatNames.map((n, i) => ({ name: n, name_th: '', order: baseOrder + i }))
          );
        }
        await base44.entities.MenuItem.bulkCreate(records);
        setResult(`${records.length} menu item${records.length > 1 ? 's' : ''} imported${newCatNames.length ? ` · ${newCatNames.length} new categor${newCatNames.length > 1 ? 'ies' : 'y'}` : ''}.`);
      } else {
        const groupMap = {};
        parsed.rows.forEach((r) => {
          const key = r.group_name;
          if (!groupMap[key]) {
            groupMap[key] = { name: r.group_name, name_th: r.group_name_th || '', items: [] };
          }
          if (r.item_name) {
            groupMap[key].items.push({
              name: r.item_name,
              name_th: r.item_name_th || '',
              price: Number(r.price) || 0,
            });
          }
        });
        const records = Object.values(groupMap).filter((g) => g.name);
        if (records.length === 0) {
          setError('No valid groups found.');
          setImporting(false);
          return;
        }
        await base44.entities.AddonGroup.bulkCreate(records);
        const itemCount = records.reduce((s, g) => s + g.items.length, 0);
        setResult(`${records.length} group${records.length > 1 ? 's' : ''} (${itemCount} items) imported.`);
      }
      setText('');
      setParsed(null);
      onSaved?.();
    } catch (e) {
      setError(e?.message || 'Import failed. Please check your data and try again.');
    } finally {
      setImporting(false);
    }
  };

  const loadSample = () => {
    setText(sample);
    setParsed(null);
    setError('');
    setResult(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-stone-400 px-1">
        Paste CSV data with a header row to create many items or add-on groups at once. Use the sample to see the expected format.
      </p>

      <div className="grid grid-cols-2 gap-2">
        {[
          { key: 'menu', label: 'Menu Items' },
          { key: 'addons', label: 'Add-on Groups' },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => { setMode(opt.key); setText(''); setParsed(null); setError(''); setResult(null); }}
            className={`py-2.5 rounded-full text-sm font-medium transition-colors ${
              mode === opt.key ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stone-700">CSV Data</h3>
          <button
            onClick={loadSample}
            className="text-xs font-medium text-amber-700 flex items-center gap-1"
          >
            <ClipboardPaste className="w-3.5 h-3.5" /> Load sample
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={sample}
          className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-xs font-mono focus:outline-none focus:border-amber-500 resize-y"
        />

        <div className="text-[11px] text-stone-400 leading-relaxed">
          {mode === 'menu' ? (
            <p>Required columns: <code className="text-stone-600">name, price</code>. Optional: <code className="text-stone-600">name_th, description, description_th, image_url</code> (prefer square 1:1, ~800px, max 1500px)<code className="text-stone-600">, category, stock_status</code> (available | limited | sold_out_today | not_available), <code className="text-stone-600">menu_tags</code> (pipe- or comma-separated tag names, e.g. <code className="text-stone-600">Spicy|Vegetarian</code>), <code className="text-stone-600">addon_groups</code> (pipe- or comma-separated group names, e.g. <code className="text-stone-600">Toppings|Extras</code>). Category Thai name is pulled from the existing category.</p>
          ) : (
            <p>Required columns: <code className="text-stone-600">group_name, item_name, price</code>. Optional: <code className="text-stone-600">group_name_th, item_name_th</code>. Multiple rows with the same <code className="text-stone-600">group_name</code> become items in that group.</p>
          )}
        </div>

        <button
          onClick={handleParse}
          disabled={!text.trim()}
          className="w-full flex items-center justify-center gap-2 bg-stone-100 text-stone-700 font-semibold py-2.5 rounded-xl disabled:opacity-50"
        >
          <FileText className="w-4 h-4" /> Preview data
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-600 text-xs p-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="flex items-start gap-2 bg-green-50 text-green-700 text-xs p-3 rounded-xl">
          <Check className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{result}</span>
        </div>
      )}

      {parsed && (
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
            <h3 className="text-sm font-semibold text-stone-700">
              Preview ({parsed.rows.length} row{parsed.rows.length > 1 ? 's' : ''})
            </h3>
          </div>
          <div className="max-h-64 overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-stone-50 sticky top-0">
                <tr>
                  {parsed.headers.map((h) => (
                    <th key={h} className="text-left font-semibold text-stone-500 px-3 py-2 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.rows.map((row, i) => (
                  <tr key={i} className="border-t border-stone-50">
                    {parsed.headers.map((h) => (
                      <td key={h} className="px-3 py-2 text-stone-700 whitespace-nowrap">{row[h] || '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3">
            <button
              onClick={handleImport}
              disabled={importing}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {importing ? 'Importing…' : `Import ${parsed.rows.length} row${parsed.rows.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}