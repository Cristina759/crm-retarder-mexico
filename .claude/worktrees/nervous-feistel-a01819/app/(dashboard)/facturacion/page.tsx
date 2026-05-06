'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2, AlertCircle, Receipt, Search, Check, ChevronRight,
  FileText, DollarSign, Clock, AlertTriangle, Pencil, X, Trash2,
} from 'lucide-react';
import {
  obtenerFacturas, actualizarFactura, marcarFacturaPagada, limpiarDatosFactura,
  type FacturaRow, type EstadoFacturacion,
} from '@/app/actions/facturacion';

// ── Helpers ───────────────────────────────────────────────────────────────────
const ESTADO_CFG: Record<EstadoFacturacion, { label: string; color: string }> = {
  pendiente_facturar: { label: 'Pendiente Facturar', color: 'bg-orange-100 text-orange-700' },
  facturada:          { label: 'Facturada',           color: 'bg-blue-100 text-blue-700'    },
  enviada_cliente:    { label: 'Enviada al Cliente',  color: 'bg-purple-100 text-purple-700'},
  pagada:             { label: 'Pagada',              color: 'bg-green-100 text-green-700'  },
  vencida:            { label: 'Vencida',             color: 'bg-red-100 text-red-700'      },
};

const FILTROS: { key: EstadoFacturacion | 'todas'; label: string }[] = [
  { key: 'todas',            label: 'Todas'             },
  { key: 'pendiente_facturar', label: 'Pendiente Facturar' },
  { key: 'facturada',        label: 'Facturada'         },
  { key: 'enviada_cliente',  label: 'Enviada al Cliente'},
  { key: 'pagada',           label: 'Pagada'            },
  { key: 'vencida',          label: 'Vencida'           },
];

function fmtMXN(n: number | null) {
  if (!n) return '—';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}
function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Fila editable ─────────────────────────────────────────────────────────────
function FilaFactura({ row, onUpdate, onDelete }: { row: FacturaRow; onUpdate: (r: FacturaRow) => void; onDelete: (id: string) => void }) {
  const router = useRouter();
  const [editando,   setEditando]   = useState(false);
  const [numFact,    setNumFact]    = useState(row.numero_factura ?? '');
  const [monto,      setMonto]      = useState(String(row.monto_factura ?? ''));
  const [concepto,   setConcepto]   = useState(row.concepto_factura ?? '');
  const [vencimiento, setVencimiento] = useState(row.fecha_vencimiento ?? '');
  const [estado,     setEstado]     = useState<EstadoFacturacion>(row.estado_facturacion);
  const [guardando,  setGuardando]  = useState(false);

  const guardar = async () => {
    setGuardando(true);
    const datos = {
      numero_factura:    numFact || null,
      monto_factura:     monto ? parseFloat(monto) : null,
      concepto_factura:  concepto || null,
      fecha_vencimiento: vencimiento || null,
      estado_facturacion: estado,
    };
    await actualizarFactura(row.id, datos);
    onUpdate({ ...row, ...datos, monto_factura: datos.monto_factura ?? row.monto_factura });
    setEditando(false);
    setGuardando(false);
  };

  const handlePagada = async () => {
    await marcarFacturaPagada(row.id);
    onUpdate({ ...row, estado_facturacion: 'pagada' });
    setEstado('pagada');
  };

  const cfg = ESTADO_CFG[estado];

  return (
    <>
      <tr
        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => !editando && router.push(`/ordenes-servicio/${row.id}`)}
      >
        {/* Orden */}
        <td className="px-4 py-3">
          <span className="font-mono text-xs font-bold text-[#0f2d55]">{row.numero}</span>
        </td>

        {/* Factura */}
        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
          {editando ? (
            <input
              value={numFact}
              onChange={e => setNumFact(e.target.value)}
              placeholder="Ej. F0001"
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-24 outline-none focus:border-yellow-400"
              autoFocus
            />
          ) : (
            <span className={`text-xs font-bold ${numFact ? 'text-gray-700' : 'text-gray-400'}`}>
              {numFact || 'PENDIENTE'}
            </span>
          )}
        </td>

        {/* Empresa */}
        <td className="px-4 py-3">
          <span className="text-sm text-gray-800 font-medium">{row.empresas?.nombre_comercial ?? '—'}</span>
        </td>

        {/* Concepto */}
        <td className="px-4 py-3 max-w-[180px]" onClick={e => e.stopPropagation()}>
          {editando ? (
            <input
              value={concepto}
              onChange={e => setConcepto(e.target.value)}
              placeholder="Concepto..."
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-full outline-none focus:border-yellow-400"
            />
          ) : (
            <span className="text-xs text-gray-500 truncate block">{concepto || '—'}</span>
          )}
        </td>

        {/* Estado */}
        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
          {editando ? (
            <select
              value={estado}
              onChange={e => setEstado(e.target.value as EstadoFacturacion)}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-yellow-400"
            >
              {Object.entries(ESTADO_CFG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          ) : (
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.color}`}>
              {cfg.label}
            </span>
          )}
        </td>

        {/* Monto */}
        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
          {editando ? (
            <input
              type="number"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              placeholder="0.00"
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-28 text-right outline-none focus:border-yellow-400"
            />
          ) : (
            <span className="text-sm font-bold text-gray-800">{fmtMXN(row.monto_factura)}</span>
          )}
        </td>

        {/* Vencimiento */}
        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
          {editando ? (
            <input
              type="date"
              value={vencimiento}
              onChange={e => setVencimiento(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-yellow-400"
            />
          ) : (
            <span className="text-xs text-gray-500">
              {vencimiento ? fmtFecha(vencimiento) : '—'}
            </span>
          )}
        </td>

        {/* Acciones */}
        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-1.5 justify-end">
            {editando ? (
              <>
                <button
                  onClick={() => setEditando(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={13} className="text-gray-400" />
                </button>
                <button
                  onClick={guardar}
                  disabled={guardando}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-yellow-400 hover:bg-yellow-500 rounded-lg text-[11px] font-bold text-yellow-900 transition-colors disabled:opacity-50"
                >
                  {guardando ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                  Guardar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditando(true)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Editar factura"
                >
                  <Pencil size={13} className="text-gray-400" />
                </button>
                {estado !== 'pagada' && (
                  <button
                    onClick={handlePagada}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-green-100 hover:bg-green-200 rounded-lg text-[11px] font-bold text-green-700 transition-colors"
                  >
                    <Check size={11} /> Pagada
                  </button>
                )}
                <button
                  onClick={async () => {
                    if (!confirm('¿Borrar los datos de factura? La OS regresará a "Pendiente Facturar".')) return;
                    await limpiarDatosFactura(row.id);
                    onDelete(row.id);
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  title="Borrar datos de factura"
                >
                  <Trash2 size={13} className="text-red-400" />
                </button>
                <button
                  onClick={() => router.push(`/ordenes-servicio/${row.id}`)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Ver OS"
                >
                  <ChevronRight size={13} className="text-gray-400" />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function FacturacionPage() {
  const [facturas,  setFacturas]  = useState<FacturaRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [filtro,    setFiltro]    = useState<EstadoFacturacion | 'todas'>('todas');
  const [busqueda,  setBusqueda]  = useState('');

  useEffect(() => {
    obtenerFacturas()
      .then(({ data, error }) => {
        if (error) setError(error);
        else setFacturas(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = (updated: FacturaRow) => {
    setFacturas(prev => prev.map(f => f.id === updated.id ? updated : f));
  };

  const handleDelete = (id: string) => {
    setFacturas(prev => prev.filter(f => f.id !== id));
  };

  // KPIs
  const totalFacturado = facturas.reduce((s, f) => s + (f.monto_factura ?? 0), 0);
  const totalCobrado   = facturas.filter(f => f.estado_facturacion === 'pagada').reduce((s, f) => s + (f.monto_factura ?? 0), 0);
  const pendientes     = facturas.filter(f => ['pendiente_facturar', 'facturada', 'enviada_cliente'].includes(f.estado_facturacion)).length;
  const vencidas       = facturas.filter(f => f.estado_facturacion === 'vencida').length;

  // Filtrado
  const filtradas = facturas.filter(f => {
    const matchFiltro  = filtro === 'todas' || f.estado_facturacion === filtro;
    const q = busqueda.toLowerCase();
    const matchBusqueda = !q ||
      f.numero.toLowerCase().includes(q) ||
      (f.numero_factura ?? '').toLowerCase().includes(q) ||
      (f.empresas?.nombre_comercial ?? '').toLowerCase().includes(q) ||
      (f.concepto_factura ?? '').toLowerCase().includes(q);
    return matchFiltro && matchBusqueda;
  });

  const countByEstado = (k: EstadoFacturacion | 'todas') =>
    k === 'todas' ? facturas.length : facturas.filter(f => f.estado_facturacion === k).length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-[#0f2d55]" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <AlertCircle className="w-8 h-8 text-red-500" />
      <p className="text-red-600 font-semibold">{error}</p>
    </div>
  );

  return (
    <div className="space-y-5 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0f2d55] flex items-center justify-center">
            <Receipt size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[#0f2d55]">Facturación</h1>
            <p className="text-[11px] text-gray-400">{facturas.length} facturas registradas</p>
          </div>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar factura..."
            className="pl-9 pr-4 h-9 border border-gray-200 rounded-xl text-sm outline-none focus:border-yellow-400 w-56 bg-white"
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={14} className="text-blue-500" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Facturado</p>
          </div>
          <p className="text-xl font-black text-blue-600">{fmtMXN(totalFacturado)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} className="text-green-500" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Cobrado</p>
          </div>
          <p className="text-xl font-black text-green-600">{fmtMXN(totalCobrado)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-orange-500" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pendientes</p>
          </div>
          <p className="text-xl font-black text-orange-500">{pendientes}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-red-500" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Vencidas</p>
          </div>
          <p className="text-xl font-black text-red-500">{vencidas}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {FILTROS.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filtro === f.key
                ? 'bg-[#0f2d55] text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label} ({countByEstado(f.key)})
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Orden</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Factura</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Empresa</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Concepto</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Estado</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Total</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Vencimiento</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400 text-sm">
                    {busqueda ? 'Sin resultados para tu búsqueda' : 'Sin facturas en este estado'}
                  </td>
                </tr>
              ) : (
                filtradas.map(f => (
                  <FilaFactura key={f.id} row={f} onUpdate={handleUpdate} onDelete={handleDelete} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
