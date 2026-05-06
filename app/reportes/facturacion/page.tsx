'use client';

import { useEffect, useState } from 'react';
import { Loader2, FileText, TrendingUp, Wallet, AlertCircle } from 'lucide-react';
import { obtenerFacturas, obtenerResumenFacturacion, type FacturaRow } from '@/app/actions/facturacion';

function fmtMXN(n: number | null | undefined) {
  if (n === null || n === undefined) return '$0.00';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

function fmtFecha(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ReporteFacturacionPage() {
  const [rows, setRows] = useState<FacturaRow[]>([]);
  const [resumen, setResumen] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([obtenerFacturas(), obtenerResumenFacturacion()])
      .then(([f, r]) => {
        setRows(f.data);
        setResumen(r);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3">
      <Loader2 className="w-10 h-10 animate-spin text-[#0f2d55]" />
      <p className="text-sm font-bold text-gray-500 animate-pulse uppercase tracking-widest">Generando Reporte...</p>
    </div>
  );

  const totalFacturado = (resumen?.totalFacturado || 0) - (resumen?.totalNotasCredito || 0);
  const totalCobrado = resumen?.totalCobrado || 0;
  const totalPendiente = totalFacturado - totalCobrado;

  return (
    <div className="min-h-screen bg-white p-8 max-w-6xl mx-auto print:p-0">
      {/* Header Reporte */}
      <div className="flex justify-between items-start border-b-4 border-[#0f2d55] pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#0f2d55] uppercase tracking-tighter">Reporte de Cobranza</h1>
          <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Retarder México — Control Financiero</p>
          <p className="text-gray-400 text-[10px] mt-1 italic">Fecha de generación: {new Date().toLocaleString('es-MX')}</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-black text-[#0f2d55]">RETARDER</div>
          <div className="text-[10px] font-bold text-gray-400 tracking-[0.2em]">MÉXICO</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="bg-gray-50 border-l-4 border-blue-500 p-5 rounded-r-2xl">
          <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Total Facturado (Neto)</p>
          <p className="text-2xl font-black text-blue-800">{fmtMXN(totalFacturado)}</p>
        </div>
        <div className="bg-gray-50 border-l-4 border-green-500 p-5 rounded-r-2xl">
          <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Total Cobrado (Ingresos)</p>
          <p className="text-2xl font-black text-green-800">{fmtMXN(totalCobrado)}</p>
        </div>
        <div className="bg-gray-50 border-l-4 border-red-500 p-5 rounded-r-2xl shadow-sm">
          <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Saldo Pendiente</p>
          <p className="text-2xl font-black text-red-600">{fmtMXN(totalPendiente)}</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden border border-gray-200 rounded-2xl mb-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0f2d55] text-white">
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider">Factura / OS</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider">Cliente</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider">Concepto</th>
              <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-wider">Importe</th>
              <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-wider">Cobrado</th>
              <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-wider">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                <td className="px-4 py-3">
                  <div className="font-bold text-xs text-[#0f2d55]">{row.numero_factura || 'S/F'}</div>
                  <div className="text-[9px] text-gray-400 font-mono">{row.numero}</div>
                </td>
                <td className="px-4 py-3 text-xs font-bold text-gray-700">{row.empresa_nombre || '—'}</td>
                <td className="px-4 py-3 text-[10px] text-gray-500 max-w-[200px] truncate">{row.concepto_factura || '—'}</td>
                <td className="px-4 py-3 text-right text-xs font-bold">{fmtMXN(row.monto_factura)}</td>
                <td className="px-4 py-3 text-right text-xs font-bold text-green-600">{fmtMXN(row.total_pagado || 0)}</td>
                <td className="px-4 py-3 text-right text-xs font-black text-red-600 bg-red-50/30">
                  {fmtMXN(row.saldo_pendiente || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Print */}
      <div className="mt-12 pt-8 border-t border-gray-200 grid grid-cols-2 gap-8 text-[10px] text-gray-400 font-bold uppercase tracking-widest print:fixed print:bottom-8 print:left-8 print:right-8">
        <div>Retarder México — Reporte de Operaciones Financieras</div>
        <div className="text-right">Confidencial — Uso Interno</div>
      </div>

      {/* Botón de impresión (oculto en print) */}
      <button 
        onClick={() => window.print()}
        className="fixed bottom-8 right-8 bg-[#0f2d55] text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 transition-transform print:hidden"
      >
        Imprimir / Guardar PDF
      </button>
    </div>
  );
}
