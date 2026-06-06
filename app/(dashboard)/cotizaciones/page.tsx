'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

const CHECKLIST_PREVENTIVO_PDF = [
  { cat: 'SISTEMA MECÁNICO', items: ['Torque a tornillera','Limpieza de panel de conexiones','Placas laterales','Hules y tornillera en general','Revisión cardanes y crucetas'] },
  { cat: 'SISTEMA ELÉCTRICO', items: ['Palanca control','Foco piloto','Interruptor','Relay de corte','Arneses de control y terminales','Sensor de velocidad','Sistema neumático'] },
  { cat: 'SISTEMA DE BATERÍAS', items: ['Caja de contactores','Maza y positivo','Block de conexiones'] },
];

const PRECIO_PREVENTIVO_MXN = 4250;

function numeroALetras(nInput: number): string {
  const n = Math.round(nInput * 100) / 100;
  const unidades = ['','UNO','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE','DIEZ','ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISÉIS','DIECISIETE','DIECIOCHO','DIECINUEVE'];
  const decenas  = ['','DIEZ','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA'];
  const centenas = ['','CIENTO','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS','QUINIENTOS','SEISCIENTOS','SETECIENTOS','OCHOCIENTOS','NOVECIENTOS'];
  function menor1000(x: number): string {
    if (x === 0) return '';
    if (x === 100) return 'CIEN';
    if (x < 20) return unidades[x];
    if (x < 100) { const d = Math.floor(x/10), u = x%10; return u === 0 ? decenas[d] : `${decenas[d]} Y ${unidades[u]}`; }
    const c = Math.floor(x/100), r = x%100;
    return r === 0 ? centenas[c] : `${centenas[c]} ${menor1000(r)}`;
  }
  const entero = Math.floor(n), cents = Math.round((n-entero)*100);
  const miles = Math.floor(entero/1000), resto = entero%1000;
  let letras = '';
  if (miles === 1) letras = 'MIL'; else if (miles > 1) letras = `${menor1000(miles)} MIL`;
  if (resto > 0) letras += (letras ? ' ' : '') + menor1000(resto);
  if (!letras) letras = 'CERO';
  return `${letras} PESOS ${String(cents).padStart(2,'0')}/100 MXN`;
}

const ESTADO_CONFIG: Record<string, { label: string; color: string }> = {
  borrador:           { label: 'Borrador',    color: 'bg-gray-100 text-gray-600' },
  enviada:            { label: 'Enviada',     color: 'bg-blue-100 text-blue-700' },
  aceptada:           { label: 'Aceptada',    color: 'bg-green-100 text-green-700' },
  rechazada:          { label: 'Rechazada',   color: 'bg-red-100 text-red-700' },
  vencida:            { label: 'Vencida',     color: 'bg-yellow-100 text-yellow-700' },
};

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2,
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
  const printRef = useRef<HTMLDivElement>(null);
  const estadoConf = ESTADO_CONFIG[cot.estado ?? ''] ?? { label: cot.estado ?? '—', color: 'bg-gray-100 text-gray-600' };

  const handlePrint = async () => {
    const origin = window.location.origin;

    // Generate QR
    let qrDataUrl = '';
    try {
      const { default: QRCode } = await import('qrcode');
      qrDataUrl = await QRCode.toDataURL('https://tgrpentarmexico.com/', { width: 100, margin: 1 });
    } catch { /* skip QR */ }

    // Parse notas
    const notas = cot.notas ?? '';
    type ItemsData = { preventivo?: boolean; correctivo?: boolean; unidades?: number; traslado_usd?: number; mano_obra?: { descripcion: string; precio: number }[]; refacciones?: { descripcion: string; precio: number }[] };
    let itemsData: ItemsData | null = null;
    let observaciones = '';
    let politicas = '';
    let tipoServicioLabel = '';
    let unidadesN = 1;

    // Extraer OBSERVACIONES y POLITICAS para cualquier tipo de cotización
    const OBS_KEY = 'OBSERVACIONES:\n';
    const POL_KEY = 'POLITICAS:\n';
    const obsIdx = notas.indexOf(OBS_KEY);
    const polIdx = notas.indexOf(POL_KEY);
    if (obsIdx >= 0) {
      const obsEnd = polIdx >= 0 ? polIdx : notas.length;
      observaciones = notas.slice(obsIdx + OBS_KEY.length, obsEnd).trim();
    }
    if (polIdx >= 0) {
      politicas = notas.slice(polIdx + POL_KEY.length).trim();
    }

    const esFreno = (cot.tipo ?? '').startsWith('frenos');

    if (cot.tipo === 'servicios') {
      // Extraer ITEMS JSON: buscar "ITEMS: " y leer hasta el primer salto de línea
      const itemsIdx = notas.indexOf('ITEMS: ');
      if (itemsIdx >= 0) {
        const afterItems = notas.slice(itemsIdx + 7);
        const nlPos = afterItems.indexOf('\n');
        const jsonStr = nlPos >= 0 ? afterItems.slice(0, nlPos) : afterItems;
        try { itemsData = JSON.parse(jsonStr); } catch { /* */ }
      }
      tipoServicioLabel = notas.match(/^Tipo: (.+)$/m)?.[1] ?? '';
      unidadesN = parseInt(notas.match(/^Unidades: (\d+)$/m)?.[1] ?? '1') || 1;
    } else if (esFreno) {
      // Frenos: extraer obs y politicas (ya extraídas arriba)
      // Si no hay obs separada, limpiar el notas de las líneas de datos técnicos
      if (!observaciones) {
        const lineas = notas.split('\n').filter(l =>
          !l.startsWith('Modelo:') && !l.startsWith('Marca:') &&
          !l.startsWith('Unidades:') && !l.startsWith('TC:') && !l.trim().startsWith('-')
        );
        observaciones = lineas.join('\n').trim();
      }
    } else if (!observaciones) {
      observaciones = notas;
    }

    // ── Frenos: generar PDF en USD ───────────────────────────────────────────
    if (esFreno) {
      const fmtUSD = (n: number) => `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`;
      const tcMatch = notas.match(/TC:\s*\$?([\d,]+\.?\d*)\s*MXN\/USD/);
      const tc = tcMatch ? parseFloat(tcMatch[1].replace(/,/g,'')) : 1;
      const totalMXN   = cot.total_mxn ?? 0;
      // Sumar componentes desde notas para evitar errores de redondeo al reconvertir MXN→USD
      const compSumLines = notas.split('\n').filter(l => /^\s*-\s+.+:\s*\$[\d,.]+\s*USD/.test(l));
      const compSumTotal = compSumLines.reduce((acc, l) => {
        const m = l.match(/\$([\d,.]+)\s*USD/); return acc + (m ? parseFloat(m[1].replace(/,/g,'')) : 0);
      }, 0);
      const subtotalUSD = compSumTotal > 0 ? Math.round(compSumTotal * 100) / 100 : Math.round(totalMXN / tc / 1.16 * 100) / 100;
      const ivaUSD      = Math.round(subtotalUSD * 0.16 * 100) / 100;
      const totalUSD    = Math.round((subtotalUSD + ivaUSD) * 100) / 100;

      // Parsear componentes desde notas: líneas "  - NOMBRE: $X USD"
      const compLines = notas.split('\n').filter(l => /^\s*-\s+.+:\s*\$[\d,.]+\s*USD/.test(l));
      let desgloseFrenos = '';
      for (const line of compLines) {
        const m = line.match(/^\s*-\s+(.+):\s*\$([\d,.]+)\s*USD/);
        if (m) {
          const nombre = m[1].trim();
          const precio = parseFloat(m[2].replace(/,/g,''));
          desgloseFrenos += `<div class="p-price-item"><span class="p-price-desc">${nombre}</span><span class="p-price-val">${fmtUSD(precio)} USD</span></div>`;
        }
      }
      // Trabajos: mismos componentes como lista
      let trabajosFrenos = '';
      const frenoHeader = notas.match(/^FRENO_HEADER:\s*(.+)$/m)?.[1]?.trim() ?? '';
      const modeloLine  = notas.match(/^Modelo: (.+)$/m)?.[1]?.trim() ?? '';
      const marcaLine   = notas.match(/^Marca: (.+)$/m)?.[1]?.trim()  ?? '';
      const unidLine    = notas.match(/^Unidades: (\d+)$/m)?.[1] ?? '1';
      // Usar FRENO_HEADER si existe; si no, combinar Modelo + Marca en una sola línea
      const frenoHeaderLine = frenoHeader || (modeloLine ? `Freno Retarder ${modeloLine}${marcaLine ? ` — ${marcaLine}` : ''}` : '');
      if (frenoHeaderLine) trabajosFrenos += `<div class="p-work-item"><span class="p-work-bullet">▸</span><span>${frenoHeaderLine}</span></div>`;
      for (const line of compLines) {
        const m = line.match(/^\s*-\s+(.+):\s*\$[\d,.]+\s*USD/);
        if (m) trabajosFrenos += `<div class="p-work-item"><span class="p-work-bullet">•</span><span>${m[1].trim()}</span></div>`;
      }
      if (unidLine !== '1') trabajosFrenos += `<div class="p-work-item"><span class="p-work-bullet">·</span><span>Unidades: ${unidLine}</span></div>`;

      const letrasUSD = (() => {
        const unidades = ['','UNO','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE','DIEZ','ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISÉIS','DIECISIETE','DIECIOCHO','DIECINUEVE'];
        const decenas  = ['','DIEZ','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA'];
        const centenas = ['','CIENTO','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS','QUINIENTOS','SEISCIENTOS','SETECIENTOS','OCHOCIENTOS','NOVECIENTOS'];
        function menor1000(x:number):string{if(x===0)return '';if(x===100)return 'CIEN';if(x<20)return unidades[x];if(x<100){const d=Math.floor(x/10),u=x%10;return u===0?decenas[d]:`${decenas[d]} Y ${unidades[u]}`;}const c=Math.floor(x/100),r=x%100;return r===0?centenas[c]:`${centenas[c]} ${menor1000(r)}`;}
        const n=Math.round(totalUSD*100)/100;const entero=Math.floor(n);const cents=Math.round((n-entero)*100);
        const miles=Math.floor(entero/1000);const resto=entero%1000;
        let letras='';if(miles===1)letras='MIL';else if(miles>1)letras=`${menor1000(miles)} MIL`;
        if(resto>0)letras+=(letras?' ':'')+menor1000(resto);if(!letras)letras='CERO';
        return `${letras} DÓLARES ${String(cents).padStart(2,'0')}/100 USD`;
      })();

      const clienteNF   = cot.empresas?.nombre_comercial ?? '—';
      const fechaCF     = new Date(cot.created_at ?? '').toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'});
      const notasFreno  = cot.notas ?? '';
      const atencionAF  = notasFreno.match(/^ATENCION_A:\s*(.+)$/m)?.[1]?.trim() ?? '';
      const emailCotF   = notasFreno.match(/^EMAIL:\s*(.+)$/m)?.[1]?.trim() ?? '';
      const sucursalF   = notasFreno.match(/^SUCURSAL:\s*(.+)$/m)?.[1]?.trim() ?? '';
      const descripcionF = notasFreno.match(/^DESCRIPCION:\s*(.+)$/m)?.[1]?.trim() ?? '';
      const obsTec = notasFreno.match(/OBS_TEC:\n([\s\S]*?)(?=\nOBS_LOG:|\nPOLITICAS:|$)/)?.[1]?.trim()
                  ?? (observaciones || '');
      const obsLog = notasFreno.match(/OBS_LOG:\n([\s\S]*?)(?=\nPOLITICAS:|$)/)?.[1]?.trim()
                  ?? notasFreno.match(/OBSERVACIONES:\n([\s\S]*?)(?=\nPOLITICAS:|$)/)?.[1]?.trim() ?? '';
      const obsF = (obsTec || obsLog) ? `<hr class="p-hr"/>
        <div style="display:flex;gap:20px;margin:8px 0;">
          ${obsTec ? `<div style="flex:1"><div class="p-section-title">Observaciones técnicas</div><pre class="p-obs-pre">${obsTec.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></div>` : ''}
          ${obsLog ? `<div style="flex:1"><div class="p-section-title">Observaciones logísticas</div><pre class="p-obs-pre">${obsLog.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></div>` : ''}
        </div>` : '';
      const polF = politicas ? `<div class="p-obs-full" style="margin-top:6px"><div class="p-section-title" style="color:#c0392b;border-color:#c0392b">Políticas y condiciones</div><pre class="p-obs-pre" style="color:#c0392b;font-weight:700">${politicas.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></div>` : '';

      const htmlFreno = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Cotización ${cot.folio??''}</title>
<style>
  @page{size:A4 portrait;margin:12mm 14mm;}
  html,body{height:100%;margin:0;padding:0;display:flex;flex-direction:column;}
  .p-doc{font-family:Arial,sans-serif;font-size:13px;color:#111;padding:6px 8px;box-sizing:border-box;background:#fff;min-height:calc(297mm - 24mm);display:flex;flex-direction:column;flex:1;}
  .p-spacer{flex:1;}
  .p-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
  .p-logo{height:250px;width:250px;object-fit:contain;}
  .p-header-right{text-align:right;}
  .p-company{font-size:32px;font-weight:900;color:#0d2244;}
  .p-doc-title{font-size:18px;font-weight:700;color:#0d2244;margin-top:4px;}
  .p-fecha-line{font-size:14px;color:#555;margin-top:4px;}
  .p-redline{border:none;border-top:2.5px solid #c0392b;margin:5px 0;}
  .p-hr{border:none;border-top:1px solid #ddd;margin:6px 0;}
  .p-client-name{font-size:18px;font-weight:900;color:#c0392b;text-transform:uppercase;margin-bottom:3px;}
  .p-client-row{font-size:13px;color:#444;margin-bottom:2px;}
  .p-client-lbl{font-weight:700;color:#222;}
  .p-two-col{display:flex;gap:24px;margin:8px 0;}
  .p-col-works{flex:2;}
  .p-col-pricing{flex:1;min-width:200px;}
  .p-section-title{font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.8px;color:#0d2244;border-bottom:1.5px solid #0d2244;padding-bottom:2px;margin-bottom:5px;}
  .p-work-item{display:flex;gap:4px;font-size:13px;margin-bottom:2px;line-height:1.4;}
  .p-work-bullet{color:#c0392b;font-weight:900;flex-shrink:0;}
  .p-price-item{display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px;gap:8px;}
  .p-price-desc{flex:1;}
  .p-price-val{font-weight:600;white-space:nowrap;}
  .p-totals{border-top:1.5px solid #ddd;padding-top:5px;margin-top:5px;}
  .p-total-line{display:flex;justify-content:space-between;font-size:14px;margin-bottom:3px;}
  .p-total-line.iva{color:#555;}
  .p-total-final{display:flex;justify-content:space-between;font-size:17px;font-weight:900;color:#0d2244;border-top:2px solid #0d2244;padding-top:4px;margin-top:3px;}
  .p-letras{font-size:13px;font-style:italic;font-weight:700;color:#444;margin:6px 0;}
  .p-obs-full{margin:6px 0;}
  .p-obs-pre{font-family:Arial,sans-serif;font-size:11px;white-space:pre-wrap;color:#333;margin:3px 0;line-height:1.4;}
  .p-spacer{flex:1;}
  .p-footer{border-top:1px solid #ddd;padding-top:6px;margin-top:10px;display:flex;flex-direction:row;align-items:center;justify-content:space-between;gap:8px;}
  .p-footer-info{flex:1;font-size:12px;}
  .p-footer-name{font-weight:900;color:#0d2244;font-size:13px;}
  .p-footer-detail{color:#555;margin-top:1px;}
  .p-footer-web{font-size:11px;color:#c0392b;font-weight:700;margin-top:2px;}
  .p-footer-logo{flex:1;display:flex;justify-content:center;align-items:center;}
  .p-footer-qr{flex:1;display:flex;flex-direction:column;align-items:flex-end;}
</style></head><body>
<div class="p-doc">
  <div class="p-header">
    <img src="${origin}/logo-retarder.png" alt="Retarder México" class="p-logo" onerror="this.style.display='none'"/>
    <div class="p-header-right">
      <div class="p-company">RETARDER MÉXICO</div>
      <div class="p-doc-title">Cotización de Frenos</div>
      <div class="p-fecha-line">Folio: ${cot.folio??'—'} &nbsp;|&nbsp; ${fechaCF}</div>
      ${sucursalF ? `<div class="p-fecha-line">Sucursal: <strong>${sucursalF}</strong></div>` : ''}
    </div>
  </div>
  <hr class="p-redline"/>
  <div class="p-client-block">
    <div class="p-client-name">${clienteNF}</div>
    ${atencionAF  ? `<div class="p-client-row"><span class="p-client-lbl">Atención a:</span> ${atencionAF}</div>` : ''}
    ${emailCotF   ? `<div class="p-client-row"><span class="p-client-lbl">Email:</span> ${emailCotF}</div>` : (cot.empresas?.email ? `<div class="p-client-row"><span class="p-client-lbl">Email:</span> ${cot.empresas.email}</div>` : '')}
    ${descripcionF ? `<div class="p-client-row"><span class="p-client-lbl">Descripción:</span> ${descripcionF}</div>` : ''}
  </div>
  <hr class="p-hr"/>
  <div class="p-two-col">
    <div class="p-col-works">
      <div class="p-section-title">Incluye los siguientes trabajos</div>
      ${trabajosFrenos}
    </div>
    <div class="p-col-pricing">
      <div class="p-section-title">Desglose económico</div>
      ${desgloseFrenos}
      <div class="p-totals">
        <div class="p-total-line"><span>Subtotal</span><span>${fmtUSD(subtotalUSD)} USD</span></div>
        <div class="p-total-line iva"><span>IVA 16%</span><span>${fmtUSD(ivaUSD)} USD</span></div>
        <div class="p-total-final"><span>TOTAL</span><span>${fmtUSD(totalUSD)} USD</span></div>
      </div>
    </div>
  </div>
  <div class="p-letras"><strong>SON: ${letrasUSD}</strong></div>
  ${obsF}${polF}
  <div class="p-spacer"></div>
  <hr class="p-hr"/>
  <div class="p-footer">
    <div class="p-footer-info">
      <div class="p-footer-name">Ing. Cristina Velasco</div>
      <div class="p-footer-detail">Área de Ventas &nbsp;|&nbsp; ventas@retardermexico.com &nbsp;|&nbsp; Tel: +52 55 7372 1633</div>
      <div class="p-footer-web">www.tgrpentarmexico.com</div>
    </div>
    <div class="p-footer-logo">
      <img src="${origin}/logo-pentar.png" alt="Pentar" style="height:50px;width:auto;display:block" onerror="this.style.display='none'"/>
    </div>
    <div class="p-footer-qr">
      ${qrDataUrl?`<img src="${qrDataUrl}" alt="QR" style="width:60px;height:60px;display:block"/>`:''}
      <div style="font-size:6px;color:#888;text-align:center;margin-top:2px">Escanea para más info</div>
    </div>
  </div>
</div></body></html>`;

      const winF = window.open('','_blank','width=820,height=1060');
      if(!winF)return;
      winF.document.write(htmlFreno);
      winF.document.close();
      winF.focus();
      setTimeout(()=>{winF.print();winF.close();},500);
      return;
    }

    const fmtMXN = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
    const subtotal = cot.subtotal ?? 0;
    const iva      = cot.iva ?? 0;
    const total    = cot.total_mxn ?? 0;

    // Build works column
    let worksHTML = '';
    if (itemsData) {
      if (itemsData.preventivo) {
        worksHTML += `<div class="p-work-item"><span class="p-work-bullet">▸</span><span>Servicio Preventivo (${unidadesN} u.)</span></div>`;
        for (const c of CHECKLIST_PREVENTIVO_PDF) {
          worksHTML += `<div class="p-checklist-cat">${c.cat}</div>`;
          for (const item of c.items) worksHTML += `<div class="p-work-item" style="padding-left:8px"><span class="p-work-bullet">•</span><span>${item}</span></div>`;
        }
      }
      const trasladoMXN = (itemsData.traslado_usd ?? 0) * unidadesN;
      if (trasladoMXN > 0) worksHTML += `<div class="p-work-item"><span class="p-work-bullet">·</span><span>Gastos de traslado</span></div>`;
    } else {
      const tipoDisplay = cot.tipo ? cot.tipo.charAt(0).toUpperCase() + cot.tipo.slice(1) : 'Servicio';
      worksHTML = `<div class="p-work-item"><span class="p-work-bullet">▸</span><span>${tipoDisplay}</span></div>`;
    }

    // Build pricing column
    let pricingHTML = '';
    if (itemsData) {
      if (itemsData.preventivo) pricingHTML += `<div class="p-price-item"><span class="p-price-desc">Preventivo × ${unidadesN}</span><span class="p-price-val">${fmtMXN(PRECIO_PREVENTIVO_MXN * unidadesN)}</span></div>`;
      for (const l of (itemsData.mano_obra ?? [])) {
        if (l.descripcion || l.precio) pricingHTML += `<div class="p-price-item"><span class="p-price-desc">${l.descripcion || 'Mano de obra'}</span><span class="p-price-val">${fmtMXN(l.precio)}</span></div>`;
      }
      for (const l of (itemsData.refacciones ?? [])) {
        if (l.descripcion || l.precio) pricingHTML += `<div class="p-price-item"><span class="p-price-desc">${l.descripcion || 'Refacción'}</span><span class="p-price-val">${fmtMXN(l.precio)}</span></div>`;
      }
      const trasladoMXN = (itemsData.traslado_usd ?? 0) * unidadesN;
      if (trasladoMXN > 0) pricingHTML += `<div class="p-price-item"><span class="p-price-desc">Traslado × ${unidadesN}</span><span class="p-price-val">${fmtMXN(trasladoMXN)}</span></div>`;
    }
    pricingHTML += `<div class="p-totals"><div class="p-total-line"><span>Subtotal</span><span>${fmtMXN(subtotal)}</span></div><div class="p-total-line iva"><span>IVA 16%</span><span>${fmtMXN(iva)}</span></div><div class="p-total-final"><span>TOTAL MXN</span><span>${fmtMXN(total)}</span></div></div>`;

    const clienteNombre = cot.empresas?.nombre_comercial ?? '—';
    const notasCot = cot.notas ?? '';
    const atencionA   = notasCot.match(/^ATENCION_A:\s*(.+)$/m)?.[1]?.trim() ?? '';
    const emailCot    = notasCot.match(/^EMAIL:\s*(.+)$/m)?.[1]?.trim() ?? '';
    const sucursalCot = notasCot.match(/^SUCURSAL:\s*(.+)$/m)?.[1]?.trim() ?? '';
    const descripcionCot = notasCot.match(/^DESCRIPCION:\s*(.+)$/m)?.[1]?.trim() ?? '';
    const tipoDisplay = cot.tipo ? cot.tipo.charAt(0).toUpperCase() + cot.tipo.slice(1) : '';
    const letras = numeroALetras(total);

    const clientBlockRows = [
      atencionA  ? `<div class="p-client-row"><span class="p-client-lbl">Atención a:</span> ${atencionA}</div>` : '',
      emailCot   ? `<div class="p-client-row"><span class="p-client-lbl">Email:</span> ${emailCot}</div>` : '',
      descripcionCot ? `<div class="p-client-row"><span class="p-client-lbl">Descripción:</span> ${descripcionCot}</div>` : '',
      tipoServicioLabel ? `<div class="p-client-row"><span class="p-client-lbl">Tipo de servicio:</span> ${tipoServicioLabel} &nbsp;|&nbsp; Unidades: ${unidadesN}</div>` : tipoDisplay ? `<div class="p-client-row"><span class="p-client-lbl">Tipo:</span> ${tipoDisplay}</div>` : '',
    ].filter(Boolean).join('');

    const obsSection = observaciones ? `
      <hr class="p-hr"/>
      <div class="p-obs-full">
        <div class="p-section-title">Observaciones técnicas</div>
        <pre class="p-obs-pre">${observaciones.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>
      </div>` : '';

    const polSection = politicas ? `
      <div class="p-obs-full" style="margin-top:6px">
        <div class="p-section-title" style="color:#c0392b;border-color:#c0392b">Políticas y condiciones</div>
        <pre class="p-obs-pre" style="color:#c0392b;font-weight:700">${politicas.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>
      </div>` : '';

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Cotización ${cot.folio ?? ''}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 14mm; }
    html, body { height: 100%; margin: 0; padding: 0; display: flex; flex-direction: column; }
    .p-doc { font-family: Arial, sans-serif; font-size: 14px; color: #111; padding: 6px 8px; box-sizing: border-box; background: #fff; min-height: calc(297mm - 24mm); display: flex; flex-direction: column; flex: 1; }
    .p-spacer { flex: 1; }
    .p-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .p-logo { height: 150px; width: 150px; object-fit: contain; }
    .p-header-right { text-align: right; }
    .p-company { font-size: 22px; font-weight: 900; color: #0d2244; letter-spacing: 0.5px; }
    .p-doc-title { font-size: 14px; font-weight: 700; color: #0d2244; margin-top: 2px; }
    .p-fecha-line { font-size: 12px; color: #555; margin-top: 2px; }
    .p-redline { border: none; border-top: 2.5px solid #c0392b; margin: 5px 0; }
    .p-hr { border: none; border-top: 1px solid #ddd; margin: 5px 0; }
    .p-client-block { margin: 4px 0; }
    .p-client-name { font-size: 17px; font-weight: 900; color: #c0392b; text-transform: uppercase; margin-bottom: 3px; }
    .p-client-row { font-size: 13px; color: #444; margin-bottom: 2px; line-height: 1.4; }
    .p-client-lbl { font-weight: 700; color: #222; }
    .p-two-col { display: flex; gap: 24px; margin: 8px 0; }
    .p-col-works { flex: 2; }
    .p-col-pricing { flex: 1; min-width: 180px; }
    .p-section-title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; color: #0d2244; border-bottom: 1.5px solid #0d2244; padding-bottom: 2px; margin-bottom: 5px; }
    .p-checklist-cat { font-size: 10px; font-weight: 700; color: #0d2244; text-transform: uppercase; margin-bottom: 2px; }
    .p-work-item { display: flex; gap: 4px; font-size: 13px; margin-bottom: 2px; line-height: 1.4; }
    .p-work-bullet { color: #c0392b; font-weight: 900; flex-shrink: 0; }
    .p-price-item { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 3px; gap: 8px; }
    .p-price-desc { flex: 1; }
    .p-price-val { font-weight: 600; white-space: nowrap; }
    .p-totals { border-top: 1.5px solid #ddd; padding-top: 5px; margin-top: 5px; }
    .p-total-line { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 3px; }
    .p-total-line.iva { color: #555; }
    .p-total-final { display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; color: #0d2244; border-top: 2px solid #0d2244; padding-top: 4px; margin-top: 3px; }
    .p-letras { font-size: 13px; font-style: italic; font-weight: 700; color: #444; margin: 6px 0; }
    .p-obs-full { margin: 8px 0; }
    .p-obs-pre { font-family: Arial, sans-serif; font-size: 13px; white-space: pre-wrap; color: #333; margin: 4px 0; line-height: 1.6; }
    .p-footer { border-top: 1px solid #ddd; padding-top: 6px; margin-top: 10px; display: flex; flex-direction: row; align-items: center; justify-content: space-between; gap: 8px; }
    .p-footer-info { flex: 1; font-size: 12px; }
    .p-footer-name { font-weight: 900; color: #0d2244; font-size: 13px; }
    .p-footer-detail { color: #555; margin-top: 1px; }
    .p-footer-web { font-size: 11px; color: #c0392b; font-weight: 700; margin-top: 2px; }
    .p-footer-logo { flex: 1; display: flex; justify-content: center; align-items: center; }
    .p-footer-qr { flex: 1; display: flex; flex-direction: column; align-items: flex-end; }
  </style>
</head>
<body>
<div class="p-doc">
  <div class="p-header">
    <img src="${origin}/logo-retarder.png" alt="Retarder México" class="p-logo" onerror="this.style.display='none'" />
    <div class="p-header-right">
      <div class="p-company">RETARDER MÉXICO</div>
      <div class="p-doc-title">Cotización de Servicios</div>
      <div class="p-fecha-line">Folio: ${cot.folio ?? '—'} &nbsp;|&nbsp; ${fechaCreacion}</div>
      ${sucursalCot ? `<div class="p-fecha-line">Sucursal: <strong>${sucursalCot}</strong></div>` : ''}
    </div>
  </div>
  <hr class="p-redline"/>
  <div class="p-client-block">
    <div class="p-client-name">${clienteNombre}</div>
    ${clientBlockRows}
  </div>
  <hr class="p-hr"/>
  <div class="p-two-col">
    <div class="p-col-works">
      <div class="p-section-title">Incluye los siguientes trabajos</div>
      ${worksHTML}
    </div>
    <div class="p-col-pricing">
      <div class="p-section-title">Desglose económico</div>
      ${pricingHTML}
    </div>
  </div>
  <div class="p-letras"><strong>SON: ${letras}</strong></div>
  ${obsSection}
  ${polSection}
  <div class="p-spacer"></div>
  <hr class="p-hr"/>
  <div class="p-footer">
    <div class="p-footer-info">
      <div class="p-footer-name">Ing. Cristina Velasco</div>
      <div class="p-footer-detail">Área de Ventas &nbsp;|&nbsp; ventas@retardermexico.com &nbsp;|&nbsp; Tel: +52 55 7372 1633</div>
      <div class="p-footer-web">www.tgrpentarmexico.com</div>
    </div>
    <div class="p-footer-logo">
      <img src="${origin}/logo-pentar.png" alt="Pentar" style="height:50px;width:auto;display:block" onerror="this.style.display='none'" />
    </div>
    <div class="p-footer-qr">
      ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR" style="width:60px;height:60px;display:block"/>` : ''}
      <div style="font-size:6px;color:#888;text-align:center;margin-top:2px">Escanea para más info</div>
    </div>
  </div>
</div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=820,height=1060');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const fechaCreacion = new Date(cot.created_at ?? '').toLocaleDateString('es-MX', {
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
              onClick={handlePrint}
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

          {/* Contenido imprimible */}
          <div ref={printRef}>
            {/* Header de impresión */}
            <div className="header">
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0f2d55' }}>RETARDER MÉXICO</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="title">COTIZACIÓN</div>
                <div className="folio">Folio: {cot.folio}</div>
                <div className="fecha">Fecha: {fechaCreacion}</div>
              </div>
            </div>
            <hr />

            {/* Datos generales */}
            <div className="section">
              <p><span className="label">Empresa:</span> {cot.empresas?.nombre_comercial ?? '—'}</p>
              <p><span className="label">Vendedor:</span> {cot.vendedor?.nombre ?? 'Sin asignar'}</p>
              <p><span className="label">Tipo:</span> {cot.tipo}</p>
              <p>
                <span className="label">Estado:</span>
                <span className="badge">{estadoConf.label}</span>
              </p>
            </div>
            <hr />

            {/* Tabla de montos */}
            <table>
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th style={{ textAlign: 'right' }}>Importe MXN</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Subtotal</td>
                  <td style={{ textAlign: 'right' }}>{formatMXN(cot.subtotal ?? 0)}</td>
                </tr>
                <tr>
                  <td>IVA 16%</td>
                  <td style={{ textAlign: 'right' }}>{formatMXN(cot.iva ?? 0)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td><strong>TOTAL MXN</strong></td>
                  <td style={{ textAlign: 'right' }}><strong>{formatMXN(cot.total_mxn ?? 0)}</strong></td>
                </tr>
              </tfoot>
            </table>

            {/* Importe con letras (si existiera o se calculara) */}
            <div style={{ marginTop: 8, fontSize: 10 }}>
              <span style={{ fontWeight: 900 }}>IMPORTE CON LETRA:</span> — (Favor de verificar en el formato impreso)
            </div>
            {(() => {
              const n = cot.notas ?? '';
              const OBS = 'OBSERVACIONES:\n', POL = 'POLITICAS:\n';
              const oi = n.indexOf(OBS), pi = n.indexOf(POL);
              const obs = oi >= 0 ? n.slice(oi + OBS.length, pi >= 0 ? pi : n.length).trim() : '';
              const pol = pi >= 0 ? n.slice(pi + POL.length).trim() : '';
              if (!obs && !pol) return null;
              return (
                <div>
                  <hr />
                  {obs && (
                    <>
                      <div style={{ fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: '#0f2d55', marginBottom: 4 }}>Observaciones</div>
                      <p className="notas" style={{ whiteSpace: 'pre-line' }}>{obs}</p>
                    </>
                  )}
                  {pol && (
                    <>
                      <div style={{ fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: '#c00', marginBottom: 4, marginTop: 6 }}>Políticas y Garantías</div>
                      <p className="notas" style={{ whiteSpace: 'pre-line', color: '#c00' }}>{pol}</p>
                    </>
                  )}
                </div>
              );
            })()}
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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<CotizacionRow[]>([]);
  const [usuarios,     setUsuarios]     = useState<UsuarioRow[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState<string | null>(null);

  const [cotDetalle,   setCotDetalle]   = useState<CotizacionRow | null>(null);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [creandoOSId,  setCreandoOSId]  = useState<string | null>(null);
  const [modalNueva,   setModalNueva]   = useState(false);

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
              const estadoConf = ESTADO_CONFIG[cot.estado ?? ''] ?? { label: cot.estado ?? '—', color: 'bg-gray-100 text-gray-600' };
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
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{formatMXN(cot.total_mxn ?? 0)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${estadoConf.color}`}>
                      {estadoConf.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{cot.vendedor?.nombre ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatFecha(cot.created_at ?? '')}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1 justify-end">
                      {oppGanada && (
                        <button
                          onClick={() => handleCrearOS(cot)}
                          disabled={creandoOSId === cot.id}
                          title="Crear Orden de Servicio"
                          className="px-2.5 py-1.5 rounded-xl bg-green-600 text-white text-[11px] font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          {creandoOSId === cot.id
                            ? <Loader2 size={11} className="animate-spin" />
                            : null
                          }
                          Crear OS
                        </button>
                      )}
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


      {/* ── Modal nueva cotización ── */}
      {modalNueva && (
        <ModalNuevaCotizacion
          usuarios={usuarios}
          onClose={() => setModalNueva(false)}
          onCreada={() => { setModalNueva(false); cargar(); }}
        />
      )}

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
