'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trash2, Loader2, X, FileText, Building2, User, Printer, ChevronRight } from 'lucide-react';
import QRCode from 'qrcode';
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

// ── Helpers de impresión ──────────────────────────────────────────────────────
function _numALetras(nInput: number): string {
  const n = Math.round(nInput * 100) / 100;
  const unidades = ['','UNO','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE',
    'DIEZ','ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISÉIS','DIECISIETE','DIECIOCHO','DIECINUEVE'];
  const decenas = ['','DIEZ','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA'];
  const centenas = ['','CIENTO','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS','QUINIENTOS',
    'SEISCIENTOS','SETECIENTOS','OCHOCIENTOS','NOVECIENTOS'];
  function m1000(x: number): string {
    if (x === 0) return '';
    if (x === 100) return 'CIEN';
    if (x < 20) return unidades[x];
    if (x < 100) { const d=Math.floor(x/10),u=x%10; return u===0?decenas[d]:`${decenas[d]} Y ${unidades[u]}`; }
    const c=Math.floor(x/100),r=x%100; return r===0?centenas[c]:`${centenas[c]} ${m1000(r)}`;
  }
  const entero=Math.floor(n), cents=Math.round((n-entero)*100);
  const miles=Math.floor(entero/1000), resto=entero%1000;
  let letras='';
  if (miles===1) letras='MIL'; else if (miles>1) letras=`${m1000(miles)} MIL`;
  if (resto>0) letras+=(letras?' ':'')+m1000(resto);
  if (!letras) letras='CERO';
  return `${letras} PESOS ${String(cents).padStart(2,'0')}/100 MXN`;
}

// ── Checklist preventivo (igual que cotizador-servicios) ──────────────────────
const CHECKLIST_PREV = [
  { categoria: 'SISTEMA MECÁNICO', items: ['Torque a tornillera', 'Limpieza de panel de conexiones', 'Placas laterales', 'Hules y tornillera en general', 'Revisión cardanes y crucetas'] },
  { categoria: 'SISTEMA ELÉCTRICO', items: ['Palanca control', 'Foco piloto', 'Interruptor', 'Relay de corte', 'Arneses de control y terminales', 'Sensor de velocidad', 'Sistema neumático'] },
  { categoria: 'SISTEMA DE BATERÍAS', items: ['Caja de contactores', 'Maza y positivo', 'Block de conexiones'] },
];
const PRECIO_PREVENTIVO_MXN = 4250;

// ── Helper: imprimir cotización igual que los cotizadores ─────────────────────
async function imprimirCotizacion(cot: CotizacionRow) {
  const fecha = cot.created_at
    ? new Date(cot.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  const tipoLabel: Record<string, string> = {
    frenos: 'Cotización de Frenos',
    servicios: 'Cotización de Servicios',
    refacciones: 'Cotización de Refacciones',
  };
  const docTitulo = tipoLabel[cot.tipo ?? ''] ?? 'Cotización';

  // Parsear datos del campo notas
  let moItems: any[] = [], refItems: any[] = [], observaciones = '', politicas = '';
  let unidades = 1;
  let esPreventivo = false;
  let trasladoLinea = '';
  if (cot.notas) {
    const n = cot.notas;
    const itemsMatch  = n.match(/ITEMS: (.+)/);
    const tipoMatch   = n.match(/Tipo:\s*(.+)/);
    const unidsMatch  = n.match(/Unidades:\s*(\d+)/);
    const traslMatch  = n.match(/Traslado × \d+: \$[\d,.]+\s*MXN/);
    if (tipoMatch)   esPreventivo  = tipoMatch[1].trim().toLowerCase() === 'preventivo';
    if (unidsMatch)  unidades      = parseInt(unidsMatch[1]) || 1;
    if (traslMatch)  trasladoLinea = traslMatch[0];
    if (itemsMatch) {
      try {
        const parsed = JSON.parse(itemsMatch[1]);
        moItems  = parsed.mano_obra   || [];
        refItems = parsed.refacciones || [];
      } catch { /* ignore */ }
    }
    // Extraer OBSERVACIONES y POLITICAS con indexOf (más robusto que regex con $)
    const OBS_KEY = 'OBSERVACIONES:\n';
    const POL_KEY = 'POLITICAS:\n';
    const obsIdx = n.indexOf(OBS_KEY);
    const polIdx = n.indexOf(POL_KEY);
    if (obsIdx !== -1) {
      const start = obsIdx + OBS_KEY.length;
      const end   = polIdx !== -1 ? polIdx : n.length;
      // trim the separator newline between sections
      observaciones = n.slice(start, end).replace(/\n$/, '').trim();
    }
    if (polIdx !== -1) {
      politicas = n.slice(polIdx + POL_KEY.length).trim();
    }
  }

  // Limpiar prefijo "Mano de obra — " si quedó guardado en la descripción
  function cleanDesc(d: string) { return (d || '').replace(/^mano\s+de\s+obra\s*[—\-–]\s*/i, '').trim() || '—'; }

  // Agrupar ítems con misma descripción y precio (para cotizaciones viejas sin campo cantidad)
  function groupItems(arr: any[]) {
    const map = new Map<string, { descripcion: string; precio: number; cantidad: number }>();
    arr.forEach(l => {
      const key = `${l.descripcion}||${l.precio}`;
      const ex  = map.get(key);
      if (ex) ex.cantidad += (l.cantidad || 1);
      else    map.set(key, { descripcion: l.descripcion, precio: l.precio, cantidad: l.cantidad || 1 });
    });
    return Array.from(map.values());
  }

  // Columna izquierda: trabajos
  let worksHTML = '';
  if (esPreventivo) {
    worksHTML += `<div class="p-work-item"><span class="p-work-bullet">▸</span><span>Servicio Preventivo (${unidades} u.)</span></div>`;
    CHECKLIST_PREV.forEach(cat => {
      worksHTML += `<div class="p-checklist-cat">${cat.categoria}</div>`;
      cat.items.forEach(item => {
        worksHTML += `<div class="p-work-item" style="padding-left:8px"><span class="p-work-bullet">•</span><span>${item}</span></div>`;
      });
    });
  }
  groupItems(moItems).forEach(l => {
    const d = cleanDesc(l.descripcion);
    worksHTML += `<div class="p-work-item"><span class="p-work-bullet">·</span><span>${d}${l.cantidad > 1 ? ` × ${l.cantidad}` : ''}</span></div>`;
  });
  groupItems(refItems).forEach(l => {
    const d = cleanDesc(l.descripcion);
    worksHTML += `<div class="p-work-item"><span class="p-work-bullet">·</span><span>${d}${l.cantidad > 1 ? ` × ${l.cantidad}` : ''}</span></div>`;
  });
  if (trasladoLinea) {
    worksHTML += `<div class="p-work-item"><span class="p-work-bullet">·</span><span>Gastos de traslado</span></div>`;
  }
  if (!worksHTML) {
    worksHTML = `<div class="p-work-item"><span class="p-work-bullet">·</span><span>${docTitulo}</span></div>`;
  }

  // Columna derecha: precios
  let pricesHTML = '';
  if (esPreventivo) {
    pricesHTML += `<div class="p-price-item"><span class="p-price-desc">Preventivo × ${unidades}</span><span class="p-price-val">${formatMXN(PRECIO_PREVENTIVO_MXN * unidades)} MXN</span></div>`;
  }
  groupItems(moItems).forEach(l => {
    const imp = (l.precio || 0) * l.cantidad;
    pricesHTML += `<div class="p-price-item"><span class="p-price-desc">${cleanDesc(l.descripcion)}${l.cantidad > 1 ? ` × ${l.cantidad}` : ''}</span><span class="p-price-val">${formatMXN(imp)}</span></div>`;
  });
  groupItems(refItems).forEach(l => {
    const imp = (l.precio || 0) * l.cantidad;
    pricesHTML += `<div class="p-price-item"><span class="p-price-desc">${cleanDesc(l.descripcion)}${l.cantidad > 1 ? ` × ${l.cantidad}` : ''}</span><span class="p-price-val">${formatMXN(imp)}</span></div>`;
  });
  if (trasladoLinea) {
    // Extraer monto de traslado de la línea guardada en notas
    const montoMatch = trasladoLinea.match(/\$([\d,]+(?:\.\d+)?)\s*MXN/);
    const montoTraslado = montoMatch ? parseFloat(montoMatch[1].replace(/,/g, '')) : 0;
    const nMatch = trasladoLinea.match(/× (\d+)/);
    const nUnids = nMatch ? nMatch[1] : unidades;
    if (montoTraslado > 0) {
      pricesHTML += `<div class="p-price-item"><span class="p-price-desc">Traslado × ${nUnids}</span><span class="p-price-val">${formatMXN(montoTraslado)}</span></div>`;
    }
  }

  const subtotal   = cot.subtotal   || 0;
  const iva        = cot.iva        || 0;
  const totalMXN   = cot.total_mxn  || 0;
  const empresa    = cot.empresas?.nombre_comercial ?? '—';
  const vendedor   = cot.vendedor?.nombre ?? 'Sin asignar';

  // QR
  let qrDataUrl = '';
  try { qrDataUrl = await QRCode.toDataURL('https://tgrpentarmexico.com/', { width: 100, margin: 1 }); } catch { }

  const win = window.open('', '_blank', 'width=820,height=1000');
  if (!win) return;

  win.document.write(`<!DOCTYPE html><html><head>
    <title>${cot.folio}</title><meta charset="utf-8"/>
    <style>
      @page { size: A4 portrait; margin: 12mm 14mm; }
      @media print {
        html,body { margin:0!important;padding:0!important; }
        body * { visibility:hidden!important; }
        #pdoc,#pdoc * { visibility:visible!important; }
        #pdoc { position:fixed!important;top:0!important;left:0!important;width:100%!important;margin:0!important; }
      }
      * { box-sizing:border-box; }
      body { font-family:Arial,sans-serif; font-size:14px; color:#111; margin:0; padding:8px; background:#fff; }
      #pdoc { background:#fff; }
      .p-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
      .p-logo { height:120px; width:120px; object-fit:contain; }
      .p-header-right { text-align:right; }
      .p-company { font-size:22px; font-weight:900; color:#0d2244; letter-spacing:0.5px; }
      .p-doc-title { font-size:14px; font-weight:700; color:#0d2244; margin-top:2px; }
      .p-fecha-line { font-size:12px; color:#555; margin-top:2px; }
      .p-redline { border:none; border-top:2.5px solid #c0392b; margin:5px 0; }
      .p-hr { border:none; border-top:1px solid #ddd; margin:5px 0; }
      .p-client-block { margin:4px 0; }
      .p-client-name { font-size:17px; font-weight:900; color:#c0392b; text-transform:uppercase; margin-bottom:3px; }
      .p-client-row { font-size:13px; color:#444; margin-bottom:2px; line-height:1.4; }
      .p-client-lbl { font-weight:700; color:#222; }
      .p-two-col { display:flex; gap:24px; margin:8px 0; }
      .p-col-works { flex:2; }
      .p-col-pricing { flex:1; min-width:180px; }
      .p-section-title { font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:0.8px; color:#0d2244; border-bottom:1.5px solid #0d2244; padding-bottom:2px; margin-bottom:5px; }
      .p-checklist-cat { font-size:10px; font-weight:700; color:#0d2244; text-transform:uppercase; margin-bottom:2px; margin-top:4px; }
      .p-work-item { display:flex; gap:4px; font-size:13px; margin-bottom:2px; line-height:1.4; }
      .p-work-bullet { color:#c0392b; font-weight:900; flex-shrink:0; }
      .p-price-item { display:flex; justify-content:space-between; font-size:13px; margin-bottom:3px; gap:8px; }
      .p-price-desc { flex:1; }
      .p-price-val { font-weight:600; white-space:nowrap; }
      .p-totals { border-top:1.5px solid #ddd; padding-top:5px; margin-top:5px; }
      .p-total-line { display:flex; justify-content:space-between; font-size:14px; margin-bottom:3px; }
      .p-total-line.iva { color:#555; }
      .p-total-final { display:flex; justify-content:space-between; font-size:16px; font-weight:900; color:#0d2244; border-top:2px solid #0d2244; padding-top:4px; margin-top:3px; }
      .p-letras { font-size:13px; font-style:italic; color:#444; margin:6px 0; }
      .p-obs-full { margin:8px 0; }
      .p-obs-pre { font-family:Arial,sans-serif; font-size:14px; white-space:pre-wrap; color:#333; margin:4px 0; line-height:1.6; }
      .p-policies { margin:4px 0; }
      .p-footer { border-top:1px solid #ddd; padding-top:6px; margin-top:10px; display:flex; flex-direction:row; align-items:center; justify-content:space-between; gap:8px; }
      .p-footer-info { flex:1; font-size:12px; }
      .p-footer-name { font-weight:900; color:#0d2244; font-size:13px; }
      .p-footer-detail { color:#555; margin-top:1px; }
      .p-footer-web { font-size:11px; color:#c0392b; font-weight:700; margin-top:2px; }
      .p-footer-logo { flex:1; display:flex; justify-content:center; align-items:center; }
      .p-footer-qr { flex:1; display:flex; flex-direction:column; align-items:flex-end; }
    </style>
  </head><body><div id="pdoc">

    <div class="p-header">
      <img src="/logo-retarder.png" alt="Retarder México" class="p-logo"
        onerror="this.style.display='none';this.nextElementSibling.style.display='block'"/>
      <div style="display:none;font-size:13px;font-weight:900;color:#0d2244">RETARDER<br/>MÉXICO</div>
      <div class="p-header-right">
        <div class="p-company">RETARDER MÉXICO</div>
        <div class="p-doc-title">${docTitulo}</div>
        <div class="p-fecha-line">Folio: ${cot.folio ?? '—'} &nbsp;|&nbsp; ${fecha}</div>
      </div>
    </div>

    <hr class="p-redline"/>

    <div class="p-client-block">
      <div class="p-client-name">${empresa}</div>
      <div class="p-client-row"><span class="p-client-lbl">Vendedor:</span> ${vendedor}</div>
      <div class="p-client-row"><span class="p-client-lbl">Tipo:</span> ${docTitulo}</div>
    </div>

    <hr class="p-hr"/>

    <div class="p-two-col">
      <div class="p-col-works">
        <div class="p-section-title">Incluye los siguientes trabajos</div>
        ${worksHTML}
      </div>
      <div class="p-col-pricing">
        <div class="p-section-title">Desglose económico</div>
        ${pricesHTML}
        <div class="p-totals">
          <div class="p-total-line"><span>Subtotal</span><span>${formatMXN(subtotal)}</span></div>
          <div class="p-total-line iva"><span>IVA 16%</span><span>${formatMXN(iva)}</span></div>
          <div class="p-total-final"><span>TOTAL MXN</span><span>${formatMXN(totalMXN)}</span></div>
        </div>
      </div>
    </div>

    <div class="p-letras"><strong>SON: ${_numALetras(totalMXN)}</strong></div>

    ${observaciones ? `<hr class="p-hr"/>
    <div class="p-obs-full">
      <div class="p-section-title">Observaciones técnicas</div>
      <pre class="p-obs-pre">${observaciones}</pre>
    </div>` : ''}

    ${politicas ? `<hr class="p-hr"/>
    <div class="p-policies">
      <div class="p-section-title" style="color:#c0392b;border-color:#c0392b">Políticas y Garantías</div>
      <pre class="p-obs-pre" style="color:#c0392b;font-weight:700">${politicas}</pre>
    </div>` : ''}

    <hr class="p-hr"/>

    <div class="p-footer">
      <div class="p-footer-info">
        <div class="p-footer-name">Ing. Cristina Velasco</div>
        <div class="p-footer-detail">Área de Ventas &nbsp;|&nbsp; ventasyservicio@tgrpentarmexico.com</div>
        <div class="p-footer-detail">Tel: +52 55 7372 1633</div>
        <div class="p-footer-web">www.tgrpentarmexico.com</div>
      </div>
      <div class="p-footer-logo">
        <img src="/logo-pentar.png" alt="Pentar Kloft" style="height:50px;width:auto;display:block"
          onerror="this.style.display='none'"/>
      </div>
      <div class="p-footer-qr">
        ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR" style="width:60px;height:60px;display:block"/>
        <div style="font-size:6px;color:#888;text-align:center;margin-top:2px">Escanea para más info</div>` : ''}
      </div>
    </div>

  </div></body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
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
  const estadoConf = ESTADO_CONFIG[cot.estado] ?? { label: cot.estado, color: 'bg-gray-100 text-gray-600' };

  const fechaCreacion = new Date(cot.created_at).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

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
              onClick={() => { imprimirCotizacion(cot); }}
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

          {/* Datos generales */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</span>
              <span className="text-sm font-bold text-gray-800">{cot.empresas?.nombre_comercial ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tipo</span>
              <span className="text-sm text-gray-700 capitalize">{cot.tipo}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vendedor</span>
              <span className="text-sm text-gray-700">{cot.vendedor?.nombre ?? 'Sin asignar'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</span>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${estadoConf.color}`}>{estadoConf.label}</span>
            </div>
          </div>

          {/* Totales */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-bold text-gray-900">{formatMXN(cot.subtotal)}</span>
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

          {/* Info extra solo en pantalla */}
          <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">
            Creado el {fechaCreacion}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<CotizacionRow[]>([]);
  const [usuarios,     setUsuarios]     = useState<UsuarioRow[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState<string | null>(null);

  const [cotDetalle,   setCotDetalle]   = useState<CotizacionRow | null>(null);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [creandoOSId,  setCreandoOSId]  = useState<string | null>(null);

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

  const handleCrearOS = async (cot: CotizacionRow) => {
    setCreandoOSId(cot.id);
    const { error } = await crearOrdenServicio({
      empresa_id:    cot.empresa_id,
      cotizacion_id: cot.id,
      oportunidad_id: cot.oportunidad_id ?? undefined,
    });

    setCreandoOSId(null);
    if (error) { alert('Error al crear OS: ' + error); return; }
    alert('Orden de Servicio creada exitosamente.');
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
              <th className="px-4 py-3 w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {cotizaciones.map(cot => {
              const estadoConf = ESTADO_CONFIG[cot.estado] ?? { label: cot.estado, color: 'bg-gray-100 text-gray-600' };
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
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{formatMXN(cot.total_mxn)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${estadoConf.color}`}>
                      {estadoConf.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{cot.vendedor?.nombre ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatFecha(cot.created_at)}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1 justify-end">
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
