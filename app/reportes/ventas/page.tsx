'use client';

import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, DollarSign, Target, CheckCircle2, Percent } from 'lucide-react';
import { obtenerResumenVentas } from '@/app/actions/dashboard';

interface VentasData {
  total: number;
  tasaCierre: number;
  ticketPromedio: number;
  ganadas: number;
  perdidas: number;
  meses: { mes: string; monto: number }[];
  porEstado: { estado: string; count: number }[];
}

function fmtMXN(n: number | null | undefined) {
  if (n === null || n === undefined) return '$0.00';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

export default function ReporteVentasPage() {
  const [data, setData] = useState<VentasData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    obtenerResumenVentas()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 text-[#0f2d55]">
      <Loader2 className="w-10 h-10 animate-spin" />
      <p className="text-sm font-black uppercase tracking-widest animate-pulse">Analizando Datos Comerciales...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-10 max-w-5xl mx-auto print:p-0">
      {/* Header */}
      <div className="flex justify-between items-end border-b-8 border-yellow-400 pb-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-[#0f2d55] uppercase tracking-tighter">Reporte de Ventas</h1>
          <p className="text-gray-500 font-bold uppercase text-xs tracking-[0.3em]">Resultados Comerciales Anuales</p>
          <p className="text-gray-400 text-[10px] mt-2 italic font-serif">Retarder México — {new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).toUpperCase()}</p>
        </div>
        <div className="text-right pb-1">
          <div className="text-2xl font-black text-[#0f2d55] leading-none">RETARDER</div>
          <div className="text-[10px] font-black text-yellow-500 tracking-[0.4em] leading-none mt-1">MÉXICO</div>
        </div>
      </div>

      {/* Grid KPIs */}
      <div className="grid grid-cols-4 gap-6 mb-12">
        <div className="bg-gray-50 p-6 rounded-3xl text-center border-b-4 border-blue-900">
          <DollarSign size={24} className="mx-auto mb-2 text-blue-900" />
          <p className="text-2xl font-black text-[#0f2d55]">{fmtMXN(data.total)}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Ventas Totales</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-3xl text-center border-b-4 border-green-500">
          <Percent size={24} className="mx-auto mb-2 text-green-500" />
          <p className="text-2xl font-black text-green-600">{data.tasaCierre}%</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Efectividad</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-3xl text-center border-b-4 border-yellow-500">
          <TrendingUp size={24} className="mx-auto mb-2 text-yellow-500" />
          <p className="text-2xl font-black text-yellow-600">{fmtMXN(data.ticketPromedio)}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Ticket Promedio</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-3xl text-center border-b-4 border-purple-500">
          <CheckCircle2 size={24} className="mx-auto mb-2 text-purple-500" />
          <p className="text-2xl font-black text-purple-600">{data.ganadas}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Cierres Exitosos</p>
        </div>
      </div>

      {/* Histórico */}
      <div className="mb-12">
        <h3 className="text-sm font-black text-[#0f2d55] uppercase tracking-widest mb-6 flex items-center gap-2">
          <div className="w-2 h-4 bg-yellow-400" /> Desempeño Mensual (Último Semestre)
        </h3>
        <div className="grid grid-cols-6 gap-4">
          {data.meses.map((m: { mes: string; monto: number }) => (
            <div key={m.mes} className="flex flex-col items-center">
              <div className="w-full bg-gray-100 rounded-lg relative overflow-hidden mb-2" style={{ height: '100px' }}>
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-[#0f2d55] transition-all duration-1000"
                  style={{ height: `${(m.monto / (data.total || 1)) * 300}%` }}
                />
              </div>
              <p className="text-[10px] font-black text-[#0f2d55] uppercase">{m.mes}</p>
              <p className="text-[9px] text-gray-400 font-bold">{fmtMXN(m.monto)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Funnel Table */}
      <div>
        <h3 className="text-sm font-black text-[#0f2d55] uppercase tracking-widest mb-6 flex items-center gap-2">
          <div className="w-2 h-4 bg-blue-900" /> Estatus del Pipeline Comercial
        </h3>
        <div className="grid grid-cols-2 gap-10">
          <div className="space-y-3">
            {data.porEstado.map((e: { estado: string; count: number }) => (
              <div key={e.estado} className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase">{e.estado}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-900" style={{ width: `${(e.count / (data.ganadas + data.perdidas || 1)) * 100}%` }} />
                  </div>
                  <span className="text-xs font-black text-[#0f2d55]">{e.count}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 p-6 rounded-3xl flex flex-col justify-center text-center">
            <Target size={32} className="mx-auto mb-2 text-red-500 opacity-50" />
            <p className="text-xs text-gray-500 font-bold leading-relaxed">
              El análisis actual muestra una tendencia de <span className="text-blue-900 font-black">CRECIMIENTO</span>. 
              Se recomienda priorizar las oportunidades en fase de negociación para maximizar el flujo del mes.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Print */}
      <div className="mt-16 pt-8 border-t border-gray-100 flex justify-between text-[9px] text-gray-300 font-bold uppercase tracking-widest print:fixed print:bottom-10 print:left-10 print:right-10">
        <div>Retarder México Intelligence — CRM Comercial v2.0</div>
        <div className="text-right">Página 1 de 1 — Documento de Carácter Ejecutivo</div>
      </div>

      {/* Print Button */}
      <button 
        onClick={() => window.print()}
        className="fixed bottom-10 right-10 bg-yellow-400 text-[#0f2d55] px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 transition-transform print:hidden"
      >
        Imprimir Reporte
      </button>
    </div>
  );
}
