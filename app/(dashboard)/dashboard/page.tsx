'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  FunnelChart, Funnel, LabelList,
} from 'recharts';
import {
  Loader2, TrendingUp, ClipboardCheck, Building2, DollarSign,
  Receipt, Target, Megaphone, BarChart3, Users, CheckCircle2,
  XCircle, Percent, ArrowUpRight,
} from 'lucide-react';
import {
  obtenerResumenGeneral, obtenerOSporEstado,
  obtenerResumenVentas, obtenerResumenMarketing,
} from '@/app/actions/dashboard';

// ── Paleta institucional ──────────────────────────────────────────────────────
const NAVY   = '#0f2d55';
const YELLOW = '#fbbf24';
const COLORS  = ['#0f2d55', '#1d4ed8', '#fbbf24', '#f97316', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4'];

const ESTADO_LABELS: Record<string, string> = {
  tecnico_asignado:        'Asig. Técnico',
  servicio_programado:     'Programado',
  documentacion_enviada:   'Doc. Enviada',
  tecnico_en_contacto:     'En Contacto',
  servicio_en_proceso:     'En Proceso',
  autorizacion_adicional:  'Autorización',
  servicio_concluido:      'Concluido',
  evidencia_cargada:       'Evidencia',
  documentacion_entregada: 'Doc. Entregada',
  encuesta_enviada:        'Encuesta',
  facturado:               'Facturado',
  pagado:                  'Pagado',
};

function fmtMXN(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);
}

function fmtMXNFull(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(n);
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({
  label, value, sub, icon: Icon, color = 'navy', trend,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color?: 'navy' | 'yellow' | 'green' | 'orange' | 'red' | 'purple';
  trend?: string;
}) {
  const bg: Record<string, string> = {
    navy:   'bg-[#0f2d55]',
    yellow: 'bg-yellow-400',
    green:  'bg-emerald-500',
    orange: 'bg-orange-500',
    red:    'bg-red-500',
    purple: 'bg-purple-500',
  };
  const textPrimary: Record<string, string> = {
    navy: 'text-white', yellow: 'text-yellow-900', green: 'text-white',
    orange: 'text-white', red: 'text-white', purple: 'text-white',
  };
  const textSub: Record<string, string> = {
    navy: 'text-blue-200', yellow: 'text-yellow-800', green: 'text-emerald-100',
    orange: 'text-orange-100', red: 'text-red-100', purple: 'text-purple-100',
  };

  return (
    <div className={`${bg[color]} rounded-2xl p-5 flex flex-col gap-3 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center`}>
          <Icon size={18} className={textPrimary[color]} />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-[11px] font-bold ${textSub[color]}`}>
            <ArrowUpRight size={11} />{trend}
          </span>
        )}
      </div>
      <div>
        <p className={`text-2xl font-black ${textPrimary[color]}`}>{value}</p>
        <p className={`text-[11px] font-medium mt-0.5 ${textSub[color]}`}>{label}</p>
        {sub && <p className={`text-[10px] mt-0.5 ${textSub[color]} opacity-75`}>{sub}</p>}
      </div>
    </div>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-bold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === 'number' && p.value > 999 ? fmtMXN(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

// ── Tab: General ──────────────────────────────────────────────────────────────
function TabGeneral() {
  const [data,   setData]   = useState<any>(null);
  const [osData, setOsData] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([obtenerResumenGeneral(), obtenerOSporEstado()])
      .then(([g, os]) => { setData(g); setOsData(os); });
  }, []);

  if (!data) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#0f2d55]" size={28} /></div>;

  const pieData = osData.map(d => ({ name: ESTADO_LABELS[d.estado] ?? d.estado, value: d.count }));

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Órdenes Activas"     value={data.osActivas}                  icon={ClipboardCheck} color="navy"   />
        <KPICard label="Total Neto Facturado" value={fmtMXNFull(data.totalNetoFacturado)} icon={Receipt}    color="yellow" sub="Bruto menos notas de crédito" />
        <KPICard label="Total Cobrado"       value={fmtMXNFull(data.totalCobrado)}       icon={DollarSign} color="green"  />
        <KPICard label="Empresas Activas"    value={data.empresas}                   icon={Building2}      color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pipeline OS donut */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-sm font-black text-[#0f2d55] mb-4">Distribución del Pipeline OS</p>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-300 text-sm">Sin órdenes activas</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Resumen financiero */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
          <p className="text-sm font-black text-[#0f2d55]">Resumen Financiero</p>
          {[
            { label: 'Total Neto Facturado', val: data.totalNetoFacturado, color: 'bg-blue-500' },
            { label: 'Total Cobrado',        val: data.totalCobrado,       color: 'bg-emerald-500' },
            { label: 'Pendiente de cobro',   val: data.totalFacturado - data.totalCobrado, color: 'bg-yellow-400' },
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500 font-medium">{item.label}</span>
                <span className="font-bold text-gray-800">{fmtMXN(item.val)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color}`}
                  style={{ width: data.totalFacturado > 0 ? `${Math.min((item.val / (data.totalFacturado || 1)) * 100, 100)}%` : '0%' }}
                />
              </div>
            </div>
          ))}
          <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between text-xs">
            <span className="text-gray-400">Notas de crédito aplicadas</span>
            <span className="font-bold text-red-500">- {fmtMXN(data.totalCobrado - data.totalNetoCobrado)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Ventas ───────────────────────────────────────────────────────────────
function TabVentas() {
  const [data, setData] = useState<any>(null);

  useEffect(() => { obtenerResumenVentas().then(setData); }, []);

  if (!data) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#0f2d55]" size={28} /></div>;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total en Ventas"    value={fmtMXN(data.total)}         icon={DollarSign}  color="navy"   />
        <KPICard label="Tasa de Cierre"     value={`${data.tasaCierre}%`}       icon={Percent}     color="green"  />
        <KPICard label="Ticket Promedio"    value={fmtMXN(data.ticketPromedio)} icon={TrendingUp}  color="yellow" />
        <KPICard label="Ops. Ganadas"       value={data.ganadas}                icon={CheckCircle2} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Ventas por mes — area chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-sm font-black text-[#0f2d55] mb-4">Ventas por Mes (últimos 6 meses)</p>
          {data.meses.every((m: any) => m.monto === 0) ? (
            <div className="flex items-center justify-center h-48 text-gray-300 text-sm">Sin datos de ventas aún</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.meses} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMonto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={NAVY}   stopOpacity={0.15} />
                    <stop offset="95%" stopColor={NAVY}   stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => fmtMXN(v)} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={55} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="monto" name="Monto" stroke={NAVY} strokeWidth={2.5} fill="url(#colorMonto)" dot={{ fill: NAVY, r: 4 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Ganadas vs Perdidas */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-sm font-black text-[#0f2d55] mb-4">Resultado de Oportunidades</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Ganadas',  value: data.ganadas  || 0 },
                  { name: 'Perdidas', value: data.perdidas || 0 },
                  { name: 'Activas',  value: data.porEstado.reduce((s: number, e: any) => s + e.count, 0) },
                ]}
                cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value"
              >
                <Cell fill="#10b981" />
                <Cell fill="#ef4444" />
                <Cell fill={NAVY}    />
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Funnel oportunidades */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <p className="text-sm font-black text-[#0f2d55] mb-4">Funnel de Oportunidades</p>
        {data.porEstado.every((e: any) => e.count === 0) ? (
          <div className="flex items-center justify-center h-36 text-gray-300 text-sm">Sin oportunidades registradas</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.porEstado} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="estado" tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Oportunidades" radius={[0, 6, 6, 0]}>
                {data.porEstado.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ── Tab: Marketing ────────────────────────────────────────────────────────────
function TabMarketing() {
  const [data, setData] = useState<any>(null);

  useEffect(() => { obtenerResumenMarketing().then(setData); }, []);

  if (!data) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#0f2d55]" size={28} /></div>;

  const canalesPlaceholder = [
    { canal: 'Google Ads',   leads: 0, costo: 0 },
    { canal: 'Meta Ads',     leads: 0, costo: 0 },
    { canal: 'LinkedIn',     leads: 0, costo: 0 },
    { canal: 'Referidos',    leads: 0, costo: 0 },
    { canal: 'Orgánico',     leads: 0, costo: 0 },
  ];

  const tendenciaPlaceholder = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { mes: d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }), leads: 0, conversiones: 0 };
  });

  const canales   = data.porCanal.length    > 0 ? data.porCanal   : canalesPlaceholder;
  const tendencia = data.tendencia.length   > 0 ? data.tendencia  : tendenciaPlaceholder;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Campañas Activas"  value={data.campanasActivas} icon={Megaphone}   color="navy"   />
        <KPICard label="Leads Generados"   value={data.leadsGenerados}  icon={Users}       color="yellow" />
        <KPICard label="Costo por Lead"    value={data.costoPorLead > 0 ? fmtMXN(data.costoPorLead) : '—'} icon={Target} color="orange" />
        <KPICard label="Tasa Conversión"   value={`${data.conversionRate}%`} icon={Percent} color="green" />
      </div>

      {/* Estado vacío prominente */}
      {data.campanasActivas === 0 && (
        <div className="bg-gradient-to-br from-[#0f2d55] to-[#1d4ed8] rounded-2xl p-8 text-center text-white">
          <Megaphone size={40} className="mx-auto mb-3 opacity-60" />
          <p className="text-lg font-black mb-1">Módulo de Marketing Digital</p>
          <p className="text-sm text-blue-200 max-w-md mx-auto">
            Aquí verás el rendimiento de tus campañas de Google Ads, Meta Ads, LinkedIn y más.
            Los datos aparecerán una vez que registres tus primeras campañas.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Leads por canal */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-sm font-black text-[#0f2d55] mb-4">Leads por Canal</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={canales} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="canal" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="leads" name="Leads" radius={[6, 6, 0, 0]}>
                {canales.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tendencia leads */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-sm font-black text-[#0f2d55] mb-4">Tendencia de Leads (6 meses)</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={tendencia} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={YELLOW} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={YELLOW} stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="leads"        name="Leads"       stroke={YELLOW}    strokeWidth={2} fill="url(#colorLeads)" />
              <Area type="monotone" dataKey="conversiones" name="Conversiones" stroke="#10b981" strokeWidth={2} fill="url(#colorConv)"  />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'general',   label: 'General',           icon: BarChart3   },
  { key: 'ventas',    label: 'Ventas',             icon: TrendingUp  },
  { key: 'marketing', label: 'Marketing Digital',  icon: Megaphone   },
] as const;

type Tab = typeof TABS[number]['key'];

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>('general');
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-5 pb-10">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-[#0f2d55]">Dashboard</h1>
          <p className="text-xs text-gray-400 capitalize mt-0.5">{today}</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-2xl p-1 gap-0.5">
          {TABS.map(t => {
            const Icon    = t.icon;
            const active  = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-[#0f2d55] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {tab === 'general'   && <TabGeneral   />}
      {tab === 'ventas'    && <TabVentas    />}
      {tab === 'marketing' && <TabMarketing />}
    </div>
  );
}
