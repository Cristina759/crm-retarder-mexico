'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, FileText } from 'lucide-react';
import { obtenerFacturas, obtenerResumenFacturacion, type FacturaRow } from '@/app/actions/facturacion';

function fmtMXN(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}
function fmtFecha(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ESTADO_COLOR: Record<string, { color: string; label: string }> = {
  pendiente:          { color: 'bg-gray-100 text-gray-600',    label: 'Pendiente'        },
  pendiente_facturar: { color: 'bg-gray-100 text-gray-600',    label: 'Pendiente'        },
  facturada:          { color: 'bg-blue-100 text-blue-700',    label: 'Facturada'        },
  enviada_cliente:    { color: 'bg-indigo-100 text-indigo-700',label: 'Enviada a cliente'},
  pagada:             { color: 'bg-green-100 text-green-700',  label: 'Pagada'           },
  vencida:            { color: 'bg-red-100 text-red-700',      label: 'Vencida'          },
};

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
            totalNotasCredito: r.totalNotasCredito
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

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#0f2d55] flex items-center justify-center">
          <FileText size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-black text-[#0f2d55]">Facturación</h1>
          <p className="text-[11px] text-gray-400">{rows.length} factura{rows.length !== 1 ? 's' : ''}</p>
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
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Factura</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Cliente</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Concepto</th>
              <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Monto</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Vencimiento</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-16 text-gray-400 text-sm">Sin facturas registradas</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-xs font-mono text-gray-700">{r.numero}</td>
                <td className="px-4 py-3 text-xs font-mono text-gray-700">{r.numero_factura ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-800 font-medium">{r.empresa_nombre ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{r.concepto_factura ?? '—'}</td>
                <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">{fmtMXN(r.monto_factura)}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{fmtFecha(r.fecha_vencimiento)}</td>
                <td className="px-4 py-3">
                  {(() => {
                    const est = ESTADO_COLOR[r.estado_facturacion ?? ''] ?? { color: 'bg-gray-100 text-gray-600', label: r.estado_facturacion ?? '—' };
                    return <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${est.color}`}>{est.label}</span>;
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
