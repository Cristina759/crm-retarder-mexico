'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trash2, Loader2, X, FileText, Building2, User, Printer, ChevronRight } from 'lucide-react';
import {
  obtenerCotizaciones,
  crearCotizacion,
  eliminarCotizacion,
  buscarEmpresas,
  type EmpresaBusquedaResult,
} from '@/app/actions/cotizaciones';
import { obtenerUsuarios } from '@/app/actions/usuarios';
import type { CotizacionRow, UsuarioRow } from '@/app/actions/types';
import { crearOrdenServicio } from '@/app/actions/ordenes';

// ── Helpers ───────────────────────────────────────────────────────────────────
const TIPOS = ['frenos', 'refacciones', 'servicios'] as const;

const ESTADO_CONFIG: Record<string, { label: string; color: string }> = {
  borrador:           { label: 'Borrador',    color: 'bg-gray-100 text-gray-600' },
  enviada:            { label: 'Enviada',     color: 'bg-blue-100 text-blue-700' },
  aceptada:           { label: 'Aceptada',    color: 'bg-green-100 text-green-700' },
  rechazada:          { label: 'Rechazada',   color: 'bg-red-100 text-red-700' },
  vencida:            { label: 'Vencida',     color: 'bg-yellow-100 text-yellow-700' },
};

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', maximumFractionDigits: 0,
  }).format(n);
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Modal nueva cotización ────────────────────────────────────────────────────
interface FormState {
  folio: string;
  empresa_id: string;
  empresa_nombre: string;
  vendedor_id: string;
  tipo: string;
  subtotal: string;
  notas: string;
}

const FORM_INICIAL: FormState = {
  folio: '',
  empresa_id: '',
  empresa_nombre: '',
  vendedor_id: '',
  tipo: 'frenos',
  subtotal: '',
  notas: '',
};


function ModalNuevaCotizacion({
  usuarios,
  onClose,
  onCreada,
}: {
  usuarios: UsuarioRow[];
  onClose: () => void;
  onCreada: () => void;
}) {
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sugerencias, setSugerencias] = useState<EmpresaBusquedaResult[]>([]);
  const [buscando, setBuscando] = useState(false);

  const subtotal = parseFloat(form.subtotal) || 0;
  const iva      = Math.round(subtotal * 0.16 * 100) / 100;
  const total    = Math.round((subtotal + iva) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_nombre.trim()) { setError('La empresa es requerida.'); return; }
    if (subtotal <= 0) { setError('El subtotal debe ser mayor a 0.'); return; }

    setGuardando(true);
    setError(null);

    const { error: err } = await crearCotizacion({
      folio:           form.folio.trim() || undefined,
      empresa_id:     form.empresa_id   || undefined,
      empresa_nombre: form.empresa_nombre.trim(),
      vendedor_id:    form.vendedor_id || null,
      tipo:           form.tipo,
      subtotal,
      iva,
      total_mxn:      total,
      notas:          form.notas || undefined,
    });

    setGuardando(false);
    if (err) { setError(err); return; }
    onCreada();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Nueva Cotización</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Folio Manual */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
              Folio de Cotización (Opcional)
            </label>
            <input
              type="text"
              value={form.folio}
              onChange={e => setForm(f => ({ ...f, folio: e.target.value }))}
              placeholder="Ej. COT-925 o número del cliente"
              className="w-full border border-gray-200 rounded-2xl px-4 h-11 text-sm outline-none focus:border-red-400 transition-colors"
            />
          </div>
          {/* Empresa */}
          <div className="relative">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
              Cliente *
            </label>
            <div className={`flex items-center gap-2 border rounded-2xl px-3 h-11 transition-colors ${form.empresa_id ? 'border-green-400 bg-green-50' : 'border-gray-200 focus-within:border-red-400'}`}>
              <Building2 size={15} className={form.empresa_id ? 'text-green-500' : 'text-gray-400'} />
              <input
                type="text"
                value={form.empresa_nombre}
                onChange={async e => {
                  const q = e.target.value;
                  setForm(f => ({ ...f, empresa_nombre: q, empresa_id: '' }));
                  if (q.length >= 2) {
                    setBuscando(true);
                    const res = await buscarEmpresas(q);
                    setSugerencias(res);
                    setBuscando(false);
                  } else {
                    setSugerencias([]);
                  }
                }}
                placeholder="Buscar cliente registrado..."
                className="flex-1 outline-none text-sm bg-transparent"
                required
              />
              {buscando && <Loader2 size={13} className="animate-spin text-gray-400" />}
              {form.empresa_id && <span className="text-[10px] font-bold text-green-600">✓</span>}
            </div>
            {sugerencias.length > 0 && !form.empresa_id && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
                {sugerencias.map(e => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => {
                      setForm(f => ({ ...f, empresa_id: e.id, empresa_nombre: e.nombre_comercial }));
                      setSugerencias([]);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-red-50 transition-colors"
                  >
                    <p className="text-sm font-semibold text-gray-800">{e.nombre_comercial}</p>
                    {e.rfc && <p className="text-[11px] text-gray-400">{e.rfc}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tipo + Vendedor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                Tipo *
              </label>
              <select
                value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                className="w-full border border-gray-200 rounded-2xl px-3 h-11 text-sm outline-none focus:border-red-400 bg-white capitalize"
              >
                {TIPOS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                Vendedor
              </label>
              <div className="flex items-center gap-2 border border-gray-200 rounded-2xl px-3 h-11 focus-within:border-red-400 transition-colors">
                <User size={14} className="text-gray-400 flex-shrink-0" />
                <select
                  value={form.vendedor_id}
                  onChange={e => setForm(f => ({ ...f, vendedor_id: e.target.value }))}
                  className="flex-1 outline-none text-sm bg-transparent"
                >
                  <option value="">Sin asignar</option>
                  {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Subtotal */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
              Subtotal (MXN) *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.subtotal}
              onChange={e => setForm(f => ({ ...f, subtotal: e.target.value }))}
              placeholder="0.00"
              className="w-full border border-gray-200 rounded-2xl px-4 h-11 text-sm outline-none focus:border-red-400 transition-colors"
              required
            />
          </div>

          {/* IVA / Total (readonly) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-2xl px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">IVA 16%</p>
              <p className="text-sm font-bold text-gray-700 mt-0.5">{formatMXN(iva)}</p>
            </div>
            <div className="bg-red-50 rounded-2xl px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400">Total MXN</p>
              <p className="text-sm font-bold text-red-700 mt-0.5">{formatMXN(total)}</p>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
              Notas
            </label>
            <textarea
              value={form.notas}
              onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
              rows={2}
              placeholder="Observaciones, condiciones..."
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none resize-none focus:border-red-400 transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={guardando}
            className="w-full h-12 bg-red-600 text-white rounded-2xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
          >
            {guardando ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            {guardando ? 'Guardando...' : 'Crear Cotización'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Modal detalle de cotización ───────────────────────────────────────────────
function ModalDetalleCotizacion({
  cot,
  onClose,
}: {
  cot: CotizacionRow;
  onClose: () => void;
}) {
  const estadoStr = cot.estado || '';
  const estadoConf = ESTADO_CONFIG[estadoStr] ?? { label: cot.estado || 'Desconocido', color: 'bg-gray-100 text-gray-600' };

  const fechaCreacion = cot.created_at 
    ? new Date(cot.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header del modal */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 font-mono">{cot.folio}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{cot.empresas?.nombre_comercial ?? '—'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => imprimirCotizacion(cot)}
              className="flex items-center gap-1.5 px-3 h-9 bg-[#0f2d55] text-white rounded-xl text-xs font-bold hover:bg-[#1a4a7a] transition-colors"
            >
              <Printer size={13} /> Imprimir PDF
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto px-6 py-4 space-y-4 flex-1">

          {/* Datos generales en pantalla */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Folio</p>
                <p className="text-sm font-bold text-gray-900 font-mono mt-0.5">{cot.folio ?? '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Tipo</p>
                <p className="text-sm font-bold text-gray-900 capitalize mt-0.5">{cot.tipo ?? '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Estado</p>
                <p className="mt-0.5">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${estadoConf.color}`}>
                    {estadoConf.label}
                  </span>
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Vendedor</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{cot.vendedor?.nombre ?? 'Sin asignar'}</p>
              </div>
            </div>

            {/* Montos */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-bold text-gray-900">{formatMXN(cot.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">IVA 16%</span>
                <span className="font-bold text-gray-900">{formatMXN(cot.iva || 0)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="text-sm font-black text-[#0f2d55]">Total MXN</span>
                <span className="text-lg font-black text-[#0f2d55]">{formatMXN(cot.total_mxn || 0)}</span>
              </div>
            </div>

            {/* Notas */}
            {cot.notas && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Notas</p>
                <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{cot.notas}</p>
              </div>
            )}
          </div>

          {/* Info extra solo en pantalla */}
          <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">
            Creado el {fechaCreacion}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helper: imprimir cotización desde cualquier lugar ─────────────────────────
function imprimirCotizacion(cot: CotizacionRow) {
  const fechaCreacion = cot.created_at
    ? new Date(cot.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';
  const estadoStr = cot.estado || '';
  const estadoConf = ESTADO_CONFIG[estadoStr] ?? { label: cot.estado || 'Desconocido', color: '' };

  // Parsear items de las notas si existen (formato de cotizador de servicios)
  let itemsHTML = '';
  let observacionesText = '';
  if (cot.notas) {
    const itemsMatch = cot.notas.match(/ITEMS: (.+)/);
    const obsMatch = cot.notas.match(/OBSERVACIONES:\n([\s\S]*?)$/);
    if (obsMatch) observacionesText = obsMatch[1];

    if (itemsMatch) {
      try {
        const items = JSON.parse(itemsMatch[1]);
        const mo = items.mano_obra || [];
        const ref = items.refacciones || [];

        if (mo.length > 0 || ref.length > 0) {
          itemsHTML += '<table><thead><tr><th>Concepto</th><th style="text-align:center">Cant.</th><th style="text-align:right">P. Unitario</th><th style="text-align:right">Importe</th></tr></thead><tbody>';

          if (mo.length > 0) {
            itemsHTML += '<tr><td colspan="4" style="background:#e8f5e9;font-weight:900;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#2e7d32;padding:6px 8px">Mano de Obra</td></tr>';
            mo.forEach((l: any) => {
              const imp = (l.precio || 0) * (l.cantidad || 1);
              itemsHTML += `<tr><td>${l.descripcion}</td><td style="text-align:center">${l.cantidad || 1}</td><td style="text-align:right">$${(l.precio || 0).toLocaleString('es-MX', {minimumFractionDigits:2})}</td><td style="text-align:right">$${imp.toLocaleString('es-MX', {minimumFractionDigits:2})}</td></tr>`;
            });
          }

          if (ref.length > 0) {
            itemsHTML += '<tr><td colspan="4" style="background:#fff3e0;font-weight:900;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#e65100;padding:6px 8px">Refacciones</td></tr>';
            ref.forEach((l: any) => {
              const imp = (l.precio || 0) * (l.cantidad || 1);
              itemsHTML += `<tr><td>${l.descripcion}</td><td style="text-align:center">${l.cantidad || 1}</td><td style="text-align:right">$${(l.precio || 0).toLocaleString('es-MX', {minimumFractionDigits:2})}</td><td style="text-align:right">$${imp.toLocaleString('es-MX', {minimumFractionDigits:2})}</td></tr>`;
            });
          }

          itemsHTML += '</tbody></table>';
        }
      } catch { /* parse error, ignore */ }
    }
  }

  const notasLimpias = cot.notas
    ? cot.notas
        .replace(/ITEMS: .+/g, '')
        .replace(/OBSERVACIONES:[\s\S]*$/g, '')
        .split('\n')
        .filter(l => l.trim() && !l.startsWith('Folio:'))
        .join('<br/>')
    : '';

  const win = window.open('', '_blank', 'width=800,height=900');
  if (!win) return;

  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Cotización ${cot.folio}</title>
        <meta charset="utf-8" />
        <style>
          @page { size: A4; margin: 12mm 14mm; }
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10px; color: #111; margin: 0; padding: 20px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 3px solid #0f2d55; }
          .brand { font-size: 16px; font-weight: 900; color: #0f2d55; letter-spacing: 2px; }
          .brand-sub { font-size: 8px; color: #888; margin-top: 2px; }
          .title { font-size: 22px; font-weight: 900; color: #0f2d55; letter-spacing: 1px; text-align: right; }
          .folio { font-size: 12px; font-weight: 700; margin-top: 2px; color: #333; }
          .fecha { font-size: 9px; color: #888; margin-top: 2px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 14px 0; }
          .info-box { background: #f8f9fa; border-radius: 8px; padding: 10px 12px; border-left: 3px solid #0f2d55; }
          .info-label { font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 3px; }
          .info-value { font-size: 11px; font-weight: 600; color: #222; }
          .badge { display: inline-block; font-size: 9px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; background: #dbeafe; color: #1d4ed8; }
          table { width: 100%; border-collapse: collapse; margin: 14px 0; }
          th { background: #0f2d55; color: white; padding: 6px 10px; font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
          td { padding: 5px 10px; border-bottom: 1px solid #eee; font-size: 10px; }
          tr:nth-child(even) td { background: #fafafa; }
          .total-section { background: #fef9e7; border: 2px solid #0f2d55; border-radius: 8px; padding: 12px; margin: 14px 0; }
          .total-grid { display: grid; grid-template-columns: 1fr auto; gap: 4px 20px; }
          .total-label { font-size: 10px; color: #555; }
          .total-value { font-size: 10px; font-weight: 700; text-align: right; color: #222; }
          .total-final { font-size: 14px; font-weight: 900; color: #0f2d55; }
          .notas-section { margin-top: 14px; padding: 10px; background: #f5f5f5; border-radius: 6px; }
          .notas-title { font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0f2d55; margin-bottom: 6px; }
          .notas-content { font-size: 9px; color: #444; line-height: 1.7; white-space: pre-wrap; }
          .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; text-align: center; font-size: 8px; color: #aaa; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">RETARDER MÉXICO</div>
            <div class="brand-sub">Servicios Especializados en Retardadores</div>
          </div>
          <div style="text-align:right">
            <div class="title">COTIZACIÓN</div>
            <div class="folio">Folio: ${cot.folio ?? '—'}</div>
            <div class="fecha">Fecha: ${fechaCreacion}</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <div class="info-label">Cliente / Empresa</div>
            <div class="info-value">${cot.empresas?.nombre_comercial ?? '—'}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Tipo de cotización</div>
            <div class="info-value" style="text-transform:capitalize">${cot.tipo ?? '—'}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Vendedor</div>
            <div class="info-value">${cot.vendedor?.nombre ?? 'Sin asignar'}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Estado</div>
            <div class="info-value"><span class="badge">${estadoConf.label}</span></div>
          </div>
        </div>

        ${itemsHTML}

        ${!itemsHTML ? `
        <table>
          <thead>
            <tr>
              <th>Concepto</th>
              <th style="text-align:right">Importe MXN</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Subtotal</td>
              <td style="text-align:right">${formatMXN(cot.subtotal || 0)}</td>
            </tr>
            <tr>
              <td>IVA 16%</td>
              <td style="text-align:right">${formatMXN(cot.iva || 0)}</td>
            </tr>
          </tbody>
        </table>` : ''}

        <div class="total-section">
          <div class="total-grid">
            <span class="total-label">Subtotal</span>
            <span class="total-value">${formatMXN(cot.subtotal || 0)}</span>
            <span class="total-label">IVA 16%</span>
            <span class="total-value">${formatMXN(cot.iva || 0)}</span>
            <span class="total-label total-final">TOTAL MXN</span>
            <span class="total-value total-final">${formatMXN(cot.total_mxn || 0)}</span>
          </div>
        </div>

        ${notasLimpias ? `
        <div class="notas-section">
          <div class="notas-title">Información adicional</div>
          <div class="notas-content">${notasLimpias}</div>
        </div>` : ''}

        ${observacionesText ? `
        <div class="notas-section">
          <div class="notas-title">Observaciones</div>
          <div class="notas-content">${observacionesText}</div>
        </div>` : ''}

        <div class="footer">
          Retarder México · ventas@retardermexico.com · Tel: +52 55 7372 1633<br/>
          Documento generado el ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 400);
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<CotizacionRow[]>([]);
  const [usuarios,     setUsuarios]     = useState<UsuarioRow[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState<string | null>(null);

  const [cotDetalle,   setCotDetalle]   = useState<CotizacionRow | null>(null);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [{ data: cots, error }, { data: users }] = await Promise.all([
        obtenerCotizaciones(),
        obtenerUsuarios(),
      ]);
      if (error) setFetchError(error);
      setCotizaciones(cots);
      setUsuarios(users);
    } catch (e) {
      setFetchError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta cotización?')) return;
    setDeletingId(id);
    const { error } = await eliminarCotizacion(id);
    setDeletingId(null);
    if (error) { alert('Error: ' + error); return; }
    setCotizaciones(prev => prev.filter(c => c.id !== id));
  };


  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-red-500" />
    </div>
  );

  if (fetchError) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <p className="text-red-600 font-semibold">Error al cargar cotizaciones</p>
      <p className="text-sm text-gray-500 font-mono bg-gray-100 px-4 py-2 rounded-xl">{fetchError}</p>
      <button onClick={cargar} className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold">
        Reintentar
      </button>
    </div>
  );

  const totalPipeline = cotizaciones
    .filter(c => c.estado !== 'rechazada' && c.estado !== 'vencida')
    .reduce((s, c) => s + (c.total_mxn ?? 0), 0);

  return (
    <div className="space-y-5 pb-8">
      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {cotizaciones.length} cotizaciones · {formatMXN(totalPipeline)} en pipeline
          </p>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Folio</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Cliente</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Tipo</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400">Total MXN</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Vendedor</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Fecha</th>
              <th className="px-4 py-3 w-28" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {cotizaciones.map(cot => {
              const estadoStr = cot.estado || '';
              const estadoConf = ESTADO_CONFIG[estadoStr] ?? { label: cot.estado || 'Desconocido', color: 'bg-gray-100 text-gray-600' };
              const oppGanada  = cot.oportunidad?.estado === 'ganado';

              return (
                <tr
                  key={cot.id}
                  onClick={() => setCotDetalle(cot)}
                  className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 font-mono font-bold text-gray-900 flex items-center gap-1">
                    {cot.folio}
                    <ChevronRight size={12} className="text-gray-300" />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-[160px] truncate">
                    {cot.empresas?.nombre_comercial ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{cot.tipo}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{formatMXN(cot.total_mxn || 0)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${estadoConf.color}`}>
                      {estadoConf.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{cot.vendedor?.nombre ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{cot.created_at ? formatFecha(cot.created_at) : '—'}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => imprimirCotizacion(cot)}
                        className="p-1.5 rounded-xl hover:bg-blue-50 text-gray-300 hover:text-blue-600 transition-colors"
                        title="Reimprimir cotización"
                      >
                        <Printer size={14} />
                      </button>
                      <button
                        onClick={() => handleEliminar(cot.id)}
                        disabled={deletingId === cot.id}
                        className="p-1.5 rounded-xl hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        {deletingId === cot.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {cotizaciones.length === 0 && (
          <div className="py-16 text-center">
            <FileText size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 font-medium">Sin cotizaciones</p>
            <p className="text-gray-300 text-sm mt-1">Crea la primera usando el botón Nueva</p>
          </div>
        )}
      </div>


      {/* ── Modal detalle ── */}
      {cotDetalle && (
        <ModalDetalleCotizacion
          cot={cotDetalle}
          onClose={() => setCotDetalle(null)}
        />
      )}
    </div>
  );
}
