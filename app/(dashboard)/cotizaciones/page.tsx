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
  const printRef = useRef<HTMLDivElement>(null);
  const estadoStr = cot.estado || '';
  const estadoConf = ESTADO_CONFIG[estadoStr] ?? { label: cot.estado || 'Desconocido', color: 'bg-gray-100 text-gray-600' };

  const handlePrint = () => {
    const contenido = printRef.current?.innerHTML;
    if (!contenido) return;
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
            body { font-family: Arial, sans-serif; font-size: 10px; color: #111; margin: 0; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
            .title { font-size: 20px; font-weight: 900; color: #0f2d55; letter-spacing: 1px; }
            .folio { font-size: 11px; font-weight: 700; margin-top: 2px; }
            .fecha { font-size: 9px; color: #555; }
            hr { border: none; border-top: 1px solid #ccc; margin: 6px 0; }
            .section { margin: 6px 0; }
            .label { font-weight: 700; display: inline-block; min-width: 100px; color: #333; }
            .badge { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; background: #dbeafe; color: #1d4ed8; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th { background: #0f2d55; color: white; padding: 4px 8px; font-size: 9px; text-transform: uppercase; text-align: left; }
            td { padding: 4px 8px; border-bottom: 1px solid #eee; }
            tr:nth-child(even) td { background: #f7f7f7; }
            .total-row td { background: #fef9e7 !important; font-weight: 900; font-size: 12px; border-top: 2px solid #0f2d55; }
            .notas { font-size: 8.5px; white-space: pre-wrap; color: #444; line-height: 1.6; margin-top: 6px; }
          </style>
        </head>
        <body>${contenido}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

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
                  <td style={{ textAlign: 'right' }}>{formatMXN(cot.subtotal || 0)}</td>
                </tr>
                <tr>
                  <td>IVA 16%</td>
                  <td style={{ textAlign: 'right' }}>{formatMXN(cot.iva || 0)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td><strong>TOTAL MXN</strong></td>
                  <td style={{ textAlign: 'right' }}><strong>{formatMXN(cot.total_mxn || 0)}</strong></td>
                </tr>
              </tfoot>
            </table>

            {/* Importe con letras (si existiera o se calculara) */}
            <div style={{ marginTop: 8, fontSize: 10 }}>
              <span style={{ fontWeight: 900 }}>IMPORTE CON LETRA:</span> — (Favor de verificar en el formato impreso)
            </div>
            {cot.notas && (
              <div>
                <hr />
                <div style={{ fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: '#0f2d55', marginBottom: 4 }}>
                  Notas
                </div>
                <p className="notas">{cot.notas}</p>
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
