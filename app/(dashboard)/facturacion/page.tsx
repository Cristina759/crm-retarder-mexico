'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, FileText, Pencil, Check, X, Trash2 } from 'lucide-react';
import { obtenerFacturas, actualizarFactura, eliminarFactura, obtenerResumenFacturacion, type FacturaRow } from '@/app/actions/facturacion';

function fmtMXN(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(n);
}
function fmtFecha(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ESTADOS = ['pendiente', 'facturada', 'enviada_cliente', 'pagada', 'vencida'];
const ESTADO_COLOR: Record<string, { color: string; label: string }> = {
  pendiente:          { color: 'bg-gray-100 text-gray-600',    label: 'Pendiente'        },
  pendiente_facturar: { color: 'bg-gray-100 text-gray-600',    label: 'Pendiente'        },
  facturada:          { color: 'bg-blue-100 text-blue-700',    label: 'Facturada'        },
  enviada_cliente:    { color: 'bg-indigo-100 text-indigo-700',label: 'Enviada a cliente'},
  pagada:             { color: 'bg-green-100 text-green-700',  label: 'Pagada'           },
  vencida:            { color: 'bg-red-100 text-red-700',      label: 'Vencida'          },
};

// ── Fila editable ─────────────────────────────────────────────────────────────
function FilaFactura({ row, onUpdated, onDeleted }: { row: FacturaRow; onUpdated: (updated: FacturaRow) => void; onDeleted: (id: string) => void }) {
  const [editing, setEditing]       = useState(false);
  const [numFact, setNumFact]       = useState(row.numero_factura ?? '');
  const [monto,   setMonto]         = useState(String(row.monto_factura ?? ''));
  const [concepto, setConcepto]     = useState(row.concepto_factura ?? '');
  const [vencimiento, setVenc]      = useState(row.fecha_vencimiento?.slice(0, 10) ?? '');
  const [estado, setEstado]         = useState(row.estado_facturacion ?? 'pendiente');
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await actualizarFactura(row.id, {
      numero_factura:    numFact  || null,
      monto_factura:     monto    ? parseFloat(monto) : null,
      concepto_factura:  concepto || null,
      fecha_vencimiento: vencimiento || null,
      estado_facturacion: estado,
    });
    onUpdated({
      ...row,
      numero_factura:    numFact  || null,
      monto_factura:     monto    ? parseFloat(monto) : null,
      concepto_factura:  concepto || null,
      fecha_vencimiento: vencimiento || null,
      estado_facturacion: estado as any,
    });
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar la factura ${row.numero}? Esto revertirá la OS al estado previo.`)) return;
    setDeleting(true);
    await eliminarFactura(row.id);
    onDeleted(row.id);
  };

  const handleCancel = () => {
    setNumFact(row.numero_factura ?? '');
    setMonto(String(row.monto_factura ?? ''));
    setConcepto(row.concepto_factura ?? '');
    setVenc(row.fecha_vencimiento?.slice(0, 10) ?? '');
    setEstado(row.estado_facturacion ?? 'pendiente');
    setEditing(false);
  };

  const est = ESTADO_COLOR[estado] ?? { color: 'bg-gray-100 text-gray-600', label: estado };

  if (editing) {
    return (
      <tr className="border-b border-yellow-100 bg-yellow-50/40">
        <td className="px-4 py-2 text-xs font-mono text-gray-700">{row.numero}</td>
        <td className="px-4 py-2">
          <input
            autoFocus
            value={numFact}
            onChange={e => setNumFact(e.target.value)}
            placeholder="Ej. B670"
            className="w-full border border-yellow-300 rounded-lg px-2 py-1 text-xs outline-none focus:border-yellow-500"
          />
        </td>
        <td className="px-4 py-2 text-xs text-gray-800 font-medium">{row.empresa_nombre ?? '—'}</td>
        <td className="px-4 py-2">
          <input
            value={concepto}
            onChange={e => setConcepto(e.target.value)}
            placeholder="Concepto..."
            className="w-full border border-yellow-300 rounded-lg px-2 py-1 text-xs outline-none focus:border-yellow-500"
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="number"
            value={monto}
            onChange={e => setMonto(e.target.value)}
            placeholder="0.00"
            className="w-28 border border-yellow-300 rounded-lg px-2 py-1 text-xs text-right outline-none focus:border-yellow-500"
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="date"
            value={vencimiento}
            onChange={e => setVenc(e.target.value)}
            className="border border-yellow-300 rounded-lg px-2 py-1 text-xs outline-none focus:border-yellow-500"
          />
        </td>
        <td className="px-4 py-2">
          <select
            value={estado}
            onChange={e => setEstado(e.target.value)}
            className="border border-yellow-300 rounded-lg px-2 py-1 text-xs outline-none focus:border-yellow-500 bg-white"
          >
            {ESTADOS.map(e => (
              <option key={e} value={e}>{ESTADO_COLOR[e]?.label ?? e}</option>
            ))}
          </select>
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} strokeWidth={3} />}
            </button>
            <button
              onClick={handleCancel}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
            >
              <X size={12} strokeWidth={3} />
            </button>
          </div>
        </td>
    );
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 group">
      <td className="px-4 py-3 text-xs font-mono text-gray-700 cursor-pointer" onClick={() => setEditing(true)}>{row.numero}</td>
      <td className="px-4 py-3 text-xs font-mono text-gray-700 cursor-pointer" onClick={() => setEditing(true)}>
        {row.numero_factura
          ? <span className="font-bold text-[#0f2d55]">{row.numero_factura}</span>
          : <span className="text-gray-300 italic text-[11px]">Sin capturar</span>}
      </td>
      <td className="px-4 py-3 text-xs text-gray-800 font-medium cursor-pointer" onClick={() => setEditing(true)}>{row.empresa_nombre ?? '—'}</td>
      <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate cursor-pointer" onClick={() => setEditing(true)}>{row.concepto_factura ?? '—'}</td>
      <td className="px-4 py-3 text-right text-sm font-bold text-gray-900 cursor-pointer" onClick={() => setEditing(true)}>{fmtMXN(row.monto_factura)}</td>
      <td className="px-4 py-3 text-xs text-gray-500 cursor-pointer" onClick={() => setEditing(true)}>{fmtFecha(row.fecha_vencimiento)}</td>
      <td className="px-4 py-3 cursor-pointer" onClick={() => setEditing(true)}>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${est.color}`}>{est.label}</span>
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditing(true)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#0f2d55]/10 hover:bg-[#0f2d55]/20 text-[#0f2d55] transition-colors"
            title="Editar"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors disabled:opacity-50"
            title="Eliminar factura"
          >
            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function FacturacionPage() {
  const [rows,    setRows]    = useState<FacturaRow[]>([]);
  const [resumen, setResumen] = useState({ totalFacturado: 0, totalCobrado: 0, totalNotasCredito: 0 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    Promise.all([obtenerFacturas(), obtenerResumenFacturacion()])
      .then(([f, r]) => {
        if (f.error) setError(f.error);
        else {
          setRows(f.data);
          setResumen({
            totalFacturado: r.totalFacturado,
            totalCobrado: r.totalCobrado,
            totalNotasCredito: r.totalNotasCredito,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

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

  const totalFacturado = resumen.totalFacturado - resumen.totalNotasCredito;
  const totalCobrado   = resumen.totalCobrado;

  const handleUpdated = (updated: FacturaRow) => {
    setRows(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const handleDeleted = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#0f2d55] flex items-center justify-center">
          <FileText size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-black text-[#0f2d55]">Facturación</h1>
          <p className="text-[11px] text-gray-400">{rows.length} factura{rows.length !== 1 ? 's' : ''} · Haz clic en una fila para editar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-blue-200 p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Total Facturado</p>
          <p className="text-2xl font-black text-blue-700">{fmtMXN(totalFacturado)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-green-200 p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Total Cobrado</p>
          <p className="text-2xl font-black text-green-700">{fmtMXN(totalCobrado)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">OS</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Factura #</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Cliente</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Concepto</th>
              <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Monto</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Vencimiento</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Estado</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-16 text-gray-400 text-sm">Sin facturas registradas</td></tr>
            ) : rows.map(r => (
              <FilaFactura key={r.id} row={r} onUpdated={handleUpdated} onDeleted={handleDeleted} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
