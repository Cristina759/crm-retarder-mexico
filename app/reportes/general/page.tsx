'use client';

import { useEffect, useState } from 'react';
import { Loader2, Building2, BarChart3 } from 'lucide-react';
import { obtenerResumenGeneral } from '@/app/actions/dashboard';

interface ResumenData {
  totalNetoFacturado: number;
  totalNetoPagado: number;
  totalPendiente: number;
  pendientesPorCliente: { cliente: string; total: number }[];
  empresas: number;
}

function fmtMXN(n: number | null | undefined) {
  if (n === null || n === undefined) return '$0.00';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

export default function ReporteGeneralPage() {
  const [data, setData] = useState<ResumenData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    obtenerResumenGeneral()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 text-[#0f2d55]">
      <Loader2 className="w-10 h-10 animate-spin" />
      <p className="text-sm font-black uppercase tracking-widest animate-pulse text-gray-500">Consolidando Reporte Ejecutivo...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-10 max-w-5xl mx-auto print:p-0">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#0f2d55] rounded-xl flex items-center justify-center">
              <BarChart3 className="text-white" size={24} />
            </div>
            <h1 className="text-4xl font-black text-[#0f2d55] uppercase tracking-tighter leading-none">Reporte Ejecutivo</h1>
          </div>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em] ml-1">Resumen Integral de Operaciones</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-black text-gray-800 uppercase italic">Confidencial</p>
          <p className="text-[10px] text-gray-400 font-medium">Corte: {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* KPIs Financieros */}
      <div className="mb-12">
        <h2 className="text-xs font-black text-[#0f2d55] uppercase tracking-[0.3em] mb-6 border-l-4 border-blue-600 pl-3">Resumen Financiero</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="p-6 border border-gray-100 rounded-3xl">
            <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Ventas Netas</p>
            <p className="text-xl font-black text-blue-900">{fmtMXN(data.totalNetoFacturado)}</p>
          </div>
          <div className="p-6 border border-gray-100 rounded-3xl">
            <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Cobranza Realizada</p>
            <p className="text-xl font-black text-green-600">{fmtMXN(data.totalNetoPagado)}</p>
          </div>
          <div className="p-6 border border-gray-100 rounded-3xl bg-red-50/20 border-red-100">
            <p className="text-[9px] font-black text-red-400 uppercase mb-1">Cuentas por Cobrar</p>
            <p className="text-xl font-black text-red-600">{fmtMXN(data.totalPendiente)}</p>
          </div>
        </div>
      </div>

      {/* Detalle de Saldos por Cliente */}
      <div className="mb-12">
        <h2 className="text-xs font-black text-[#0f2d55] uppercase tracking-[0.3em] mb-6 border-l-4 border-yellow-500 pl-3">Principales Deudores</h2>
        <div className="overflow-hidden border border-gray-100 rounded-2xl">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase">Cliente</th>
                <th className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase text-right">Saldo Pendiente</th>
              </tr>
            </thead>
            <tbody>
              {data.pendientesPorCliente.slice(0, 8).map((c: { cliente: string; total: number }) => (
                <tr key={c.cliente} className="border-t border-gray-50">
                  <td className="px-4 py-3 text-xs font-bold text-gray-700">{c.cliente}</td>
                  <td className="px-4 py-3 text-right text-xs font-black text-red-500">{fmtMXN(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operaciones & Mercado */}
      <div className="grid grid-cols-2 gap-12">
        <div>
          <h2 className="text-xs font-black text-[#0f2d55] uppercase tracking-[0.3em] mb-6 border-l-4 border-purple-500 pl-3">Base Instalada</h2>
          <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-3xl">
            <Building2 size={40} className="text-purple-600 opacity-40" />
            <div>
              <p className="text-3xl font-black text-[#0f2d55]">{data.empresas}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Empresas en Cartera</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase tracking-widest italic">
            "Este reporte consolida el estatus actual de Retarder México, integrando datos de ventas, facturación y operaciones técnicas para la toma de decisiones ejecutivas."
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-20 pt-8 border-t border-gray-100 text-center">
        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.5em]">Retarder México Intelligence System</p>
      </div>

      <button 
        onClick={() => window.print()}
        className="fixed bottom-10 right-10 bg-[#0f2d55] text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-110 transition-transform print:hidden"
      >
        Imprimir Reporte
      </button>
    </div>
  );
}
