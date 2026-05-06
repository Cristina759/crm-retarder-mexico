'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle, ArrowLeft, Building2 } from 'lucide-react';
import { obtenerClienteDetalle, type ClienteDetalle } from '@/app/actions/clientes';

function fmtMXN(n: number | null) {
  if (!n) return '—';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}
function fmtFecha(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ClienteDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [cliente, setCliente] = useState<ClienteDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    obtenerClienteDetalle(id)
      .then(({ data, error }) => { if (error) setError(error); else setCliente(data); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#0f2d55]" /></div>;
  if (error)   return <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3"><AlertCircle className="w-8 h-8 text-red-500" /><p className="text-red-600 font-semibold">{error}</p></div>;
  if (!cliente) return null;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft size={18} className="text-gray-500" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-[#0f2d55] flex items-center justify-center">
          <Building2 size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-black text-[#0f2d55]">{cliente.nombre_comercial ?? '—'}</h1>
          <p className="text-[11px] text-gray-400">{cliente.rfc ?? 'Sin RFC'}</p>
        </div>
      </div>

      {/* Info basica */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Telefono</p><p className="text-sm text-gray-800">{cliente.telefono ?? '—'}</p></div>
        <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Email</p><p className="text-sm text-gray-800">{cliente.email ?? '—'}</p></div>
        <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Alta</p><p className="text-sm text-gray-800">{fmtFecha(cliente.created_at)}</p></div>
        <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Ordenes</p><p className="text-sm font-bold text-[#0f2d55]">{cliente.total_os}</p></div>
      </div>

      {/* Ordenes */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-bold text-[#0f2d55]">Ordenes de Servicio</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Numero</th>
              <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Estado</th>
              <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Facturado</th>
              <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {cliente.ordenes.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-sm">Sin ordenes</td></tr>
            ) : cliente.ordenes.map(o => (
              <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2 text-xs font-mono text-gray-700">{o.numero}</td>
                <td className="px-4 py-2 text-xs text-gray-600">{o.estado}</td>
                <td className="px-4 py-2 text-right text-xs font-bold text-gray-800">{fmtMXN(o.monto_factura)}</td>
                <td className="px-4 py-2 text-xs text-gray-500">{fmtFecha(o.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cotizaciones */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-bold text-[#0f2d55]">Cotizaciones</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Folio</th>
              <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Tipo</th>
              <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Estado</th>
              <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Total</th>
            </tr>
          </thead>
          <tbody>
            {cliente.cotizaciones.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-sm">Sin cotizaciones</td></tr>
            ) : cliente.cotizaciones.map(c => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2 text-xs font-mono text-gray-700">{c.folio ?? '—'}</td>
                <td className="px-4 py-2 text-xs text-gray-600">{c.tipo ?? '—'}</td>
                <td className="px-4 py-2 text-xs text-gray-600">{c.estado ?? '—'}</td>
                <td className="px-4 py-2 text-right text-xs font-bold text-gray-800">{fmtMXN(c.total_mxn)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
