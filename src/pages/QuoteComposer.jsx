import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, FileText, LoaderCircle, ArrowRight } from 'lucide-react';
import { createQuote } from '../api/quotes';

function normalizedHeader(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function spreadsheetItems(file) {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
  return rows.map((row) => {
    const entries = Object.entries(row).map(([key, value]) => [normalizedHeader(key), value]);
    const product = entries.find(([key]) => ['producto', 'descripcion', 'nombre', 'item', 'material'].includes(key))?.[1];
    const quantity = entries.find(([key]) => ['cantidad', 'cant', 'qty', 'unidades'].includes(key))?.[1];
    if (!product) return null;
    return {
      texto_original: String(product).trim(),
      ...(quantity !== '' && quantity != null ? { cantidad: String(quantity).replace(',', '.') } : {}),
    };
  }).filter(Boolean);
}

export function QuoteComposer() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const mutation = useMutation({
    mutationFn: async () => {
      if (file) {
        const items = await spreadsheetItems(file);
        if (!items.length) throw new Error('No encontré columnas de producto y cantidad en el archivo.');
        if (items.length > 50) throw new Error('Una proforma admite como máximo 50 ítems.');
        return createQuote({ items });
      }
      return createQuote({ texto: text });
    },
    onSuccess: (quote) => navigate(`/proforma/${encodeURIComponent(quote.codigo)}`),
  });
  const error = mutation.error?.response?.data?.detail || mutation.error?.message;

  const handleSubmit = (event) => {
    event.preventDefault();
    if ((!text.trim() && !file) || mutation.isPending) return;
    mutation.mutate();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <header className="border-b border-slate-200 pb-4">
        <p className="text-[11px] font-bold uppercase text-kenpaku-blue">Comercial Kenpaku</p>
        <h1 className="mt-1 text-2xl font-extrabold text-kenpaku-navy">Cotizador de materiales</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Escribe o pega la lista de materiales que necesitas. La proforma mostrará productos disponibles, alternativas ambiguas y líneas sin precio.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <label htmlFor="quote-list" className="block text-sm font-bold text-slate-800">Lista de materiales</label>
        <textarea
          id="quote-list"
          value={text}
          onChange={(event) => { setText(event.target.value); setFile(null); }}
          rows={9}
          maxLength={5000}
          placeholder={'10 tubos cuadrados 2x2 de 1.5mm\n5 ángulos de 1 1/2\n3 planchas LAC 1/8'}
          className="w-full rounded-lg border border-slate-300 p-4 text-sm leading-6 text-slate-800 focus:border-kenpaku-blue focus:outline-none focus:ring-2 focus:ring-kenpaku-blue/15"
        />
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Máximo 50 ítems</span><span>{text.length}/5000</span>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
            <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
            {file ? file.name : 'Importar XLSX o CSV'}
            <input type="file" accept=".xlsx,.csv" className="sr-only" onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              if (event.target.files?.[0]) setText('');
            }} />
          </label>
          <button type="submit" disabled={mutation.isPending || (!text.trim() && !file)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-kenpaku-orange px-5 py-2.5 text-sm font-bold text-white hover:bg-kenpaku-orangeHover disabled:cursor-not-allowed disabled:opacity-50">
            {mutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Cotizar <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{Array.isArray(error) ? error.map((item) => item.msg).join('. ') : error}</p>}
      </form>
    </div>
  );
}