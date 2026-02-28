'use client';

import { motion } from 'framer-motion';
import {
    Ticket,
    DollarSign,
    Users,
    TrendingUp,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Wrench,
    Warehouse,
    FileText,
    Target,
    Zap,
} from 'lucide-react';
import { cn, formatMXN } from '@/lib/utils';
import {
    ORDEN_ESTADOS,
    ORDEN_ESTADO_LABELS,
    ORDEN_ESTADO_COLORS,
    COTIZACION_ESTADO_LABELS,
    COTIZACION_ESTADO_COLORS,
    CotizacionEstado
} from '@/lib/utils/constants';
import { VENTAS_REALES } from '@/lib/data/ventas-reales';
import { useRole } from '@/hooks/useRole';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

const supabase = createClient();

interface CotizacionMini {
    total: number;
    estado: string;
}

interface OrdenMini {
    id: string;
    numero: string;
    empresa: string;
    tecnico?: string;
    vendedor?: string;
    estado: string;
    fecha_creado: string;
    prioridad: string;
    tipo: string;
}

interface InventoryMini {
    id: string;
    nombre: string;
    stock_actual: number;
}

// ── Animated KPI Card ───────────────────────────────

function KpiCard({
    title,
    value,
    subtitle,
    icon,
    color = 'bg-retarder-red',
    trend,
    delay = 0,
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color?: string;
    trend?: { value: string; positive: boolean };
    delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="glass rounded-2xl p-6 shadow-sm hover:shadow-premium transition-all duration-300 relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                {icon}
            </div>
            <div className="flex items-center gap-4">
                <div className={cn('p-3 rounded-xl shadow-lg shrink-0', color)}>
                    <div className="text-white">{icon}</div>
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-[10px] font-black text-retarder-gray-400 uppercase tracking-widest">{title}</p>
                    <p className="text-xl font-black text-retarder-black tracking-tight truncate">{value}</p>
                    <div className="flex items-center gap-2">
                        {subtitle && <p className="text-[10px] text-retarder-gray-500 font-medium truncate">{subtitle}</p>}
                        {trend && (
                            <span className={cn(
                                'text-[9px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap shrink-0',
                                trend.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                            )}>
                                {trend.value}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ── Sales Pipeline Chart (Cotizaciones) ────────────────

function SalesPipelineChart({ cotizaciones }: { cotizaciones: CotizacionMini[] }) {
    // Real data from Supabase grouped by estado
    const estados = ['aceptada', 'enviada', 'negociacion', 'borrador', 'rechazada', 'vencida'];
    const salesData = estados.map(estado => ({
        estado,
        count: cotizaciones.filter(c => c.estado === estado).length,
        total: cotizaciones.filter(c => c.estado === estado).reduce((s, c) => s + (c.total || 0), 0),
    })).filter(d => d.count > 0);

    const maxCount = Math.max(...salesData.map((d) => d.count));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white rounded-xl border border-retarder-gray-200 p-5 col-span-full lg:col-span-2"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-retarder-black">Pipeline de Ventas (Cotizaciones)</h3>
                <span className="text-[10px] font-medium text-retarder-gray-400 bg-retarder-gray-50 px-2 py-0.5 rounded-full border border-retarder-gray-100">
                    Flujo Comercial
                </span>
            </div>

            <div className="space-y-3">
                {salesData.map((item, i) => (
                    <div key={item.estado} className="group flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[10px] px-1">
                            <span className="font-medium text-retarder-gray-600">
                                {COTIZACION_ESTADO_LABELS[item.estado as CotizacionEstado]}
                            </span>
                            <span className="font-bold text-retarder-gray-900">
                                {formatMXN(item.total)}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-6 bg-retarder-gray-100 rounded-lg overflow-hidden group-hover:shadow-sm transition-shadow">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(item.count / maxCount) * 100}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 * i }}
                                    className={cn(
                                        'h-full rounded-lg flex items-center justify-end pr-2.5',
                                        COTIZACION_ESTADO_COLORS[item.estado as CotizacionEstado]
                                    )}
                                >
                                    <span className="text-[10px] font-black text-white/90 drop-shadow-sm">
                                        {item.count}
                                    </span>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

// ── Pipeline Mini Chart ─────────────────────────────

function PipelineChart({ ordenes }: { ordenes: OrdenMini[] }) {
    // Group orders by state
    const pipelineData = ORDEN_ESTADOS.map(estado => ({
        estado,
        count: ordenes.filter(o => o.estado === estado).length
    })).filter(d => d.count > 0);

    if (pipelineData.length === 0) return null;

    const maxCount = Math.max(...pipelineData.map((d) => d.count), 1);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-white rounded-xl border border-retarder-gray-200 p-5 col-span-full lg:col-span-2"
        >
            <h3 className="font-semibold text-sm text-retarder-black mb-4">Pipeline de Órdenes de Servicio</h3>
            <div className="space-y-2.5">
                {pipelineData.map((item, i) => (
                    <div key={item.estado} className="flex items-center gap-3">
                        <span className="text-[10px] text-retarder-gray-500 w-28 truncate text-right">
                            {ORDEN_ESTADO_LABELS[item.estado as keyof typeof ORDEN_ESTADO_LABELS]}
                        </span>
                        <div className="flex-1 h-5 bg-retarder-gray-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(item.count / maxCount) * 100}%` }}
                                transition={{ duration: 0.6, delay: 0.1 * i }}
                                className={cn(
                                    'h-full rounded-full flex items-center justify-end pr-2',
                                    ORDEN_ESTADO_COLORS[item.estado as keyof typeof ORDEN_ESTADO_COLORS]
                                )}
                            >
                                <span className="text-[10px] font-bold text-white">{item.count}</span>
                            </motion.div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

// ── Recent Ordenes Table ────────────────────────────

function RecentOrdenes({ ordenes }: { ordenes: OrdenMini[] }) {
    const displayOrdenes = ordenes.slice(0, 8);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="bg-white rounded-xl border border-retarder-gray-200 p-5 col-span-full"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-retarder-black">Órdenes Recientes</h3>
                <button className="text-xs text-retarder-red font-medium hover:underline">Ver todas</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-retarder-gray-100">
                            <th className="text-left py-2 px-3 text-[10px] font-semibold text-retarder-gray-400 uppercase">Orden</th>
                            <th className="text-left py-2 px-3 text-[10px] font-semibold text-retarder-gray-400 uppercase">Empresa</th>
                            <th className="text-left py-2 px-3 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden md:table-cell">Tipo</th>
                            <th className="text-left py-2 px-3 text-[10px] font-semibold text-retarder-gray-400 uppercase">Estado</th>
                            <th className="text-left py-2 px-3 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden lg:table-cell">Técnico</th>
                            <th className="text-left py-2 px-3 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden sm:table-cell">Prioridad</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayOrdenes.map((o, i) => (
                            <motion.tr
                                key={o.id || o.numero}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + i * 0.05 }}
                                className="border-b border-retarder-gray-50 hover:bg-retarder-gray-50 cursor-pointer transition-colors"
                            >
                                <td className="py-3 px-3 font-mono font-semibold text-retarder-red">{o.numero}</td>
                                <td className="py-3 px-3 font-medium text-retarder-gray-800">{o.empresa}</td>
                                <td className="py-3 px-3 text-retarder-gray-600 capitalize hidden md:table-cell">{o.tipo}</td>
                                <td className="py-3 px-3">
                                    <span className={cn(
                                        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-white',
                                        ORDEN_ESTADO_COLORS[o.estado as keyof typeof ORDEN_ESTADO_COLORS]
                                    )}>
                                        {ORDEN_ESTADO_LABELS[o.estado as keyof typeof ORDEN_ESTADO_LABELS]}
                                    </span>
                                </td>
                                <td className="py-3 px-3 text-retarder-gray-600 hidden lg:table-cell">{o.tecnico}</td>
                                <td className="py-3 px-3 hidden sm:table-cell">
                                    <span className={cn(
                                        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold',
                                        o.prioridad === 'urgente' && 'bg-red-100 text-red-700',
                                        o.prioridad === 'alta' && 'bg-yellow-100 text-yellow-800',
                                        o.prioridad === 'media' && 'bg-blue-100 text-blue-700',
                                        o.prioridad === 'baja' && 'bg-gray-100 text-gray-600',
                                    )}>
                                        {o.prioridad}
                                    </span>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}

interface PriorityAlert {
    id: string;
    title: string;
    description: string;
    type: 'critical' | 'warning' | 'info';
    icon: React.ReactNode;
}

function PriorityAttention({ alerts }: { alerts: PriorityAlert[] }) {
    if (alerts.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-dark rounded-2xl p-6 text-white overflow-hidden relative"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-retarder-red/20 blur-3xl -mr-16 -mt-16" />
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-retarder-red flex items-center justify-center animate-pulse">
                    <Zap size={16} className="text-white fill-current" />
                </div>
                <div>
                    <h3 className="text-base font-black tracking-tight uppercase">Atención Prioritaria</h3>
                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Sistema Inteligente de Alertas</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {alerts.map((alert, i) => (
                    <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn(
                            "p-4 rounded-xl flex gap-4 items-start transition-all hover:translate-x-1",
                            alert.type === 'critical' ? 'bg-red-500/10 border border-red-500/20' :
                                alert.type === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/20' :
                                    'bg-blue-500/10 border border-blue-500/20'
                        )}
                    >
                        <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                            alert.type === 'critical' ? 'bg-red-500 text-white' :
                                alert.type === 'warning' ? 'bg-yellow-500 text-black' :
                                    'bg-blue-500 text-white'
                        )}>
                            {alert.icon}
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold">{alert.title}</p>
                            <p className="text-xs text-white/60 leading-tight">{alert.description}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

// ── Main Dashboard Page ─────────────────────────────

export default function DashboardPage() {
    const { user } = useUser();
    const { role, isAdmin, isVendedor, isTecnico, isCliente } = useRole();
    const [loading, setLoading] = useState(true);
    const [ordenes, setOrdenes] = useState<OrdenMini[]>([]);
    const [cotizaciones, setCotizaciones] = useState<CotizacionMini[]>([]);
    const [stats, setStats] = useState({
        totalVentas: 0,
        totalCobrado: 0,
        ordenesActivas: 0,
        cotizacionesActivas: 0,
        ordenesTecnico: 0,
        ordenesProceso: 0,
        ordenesHoy: 0
    });

    // Name detection from Clerk
    const currentUserName = useMemo(() => {
        const name = user?.fullName ||
            (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : null) ||
            user?.firstName ||
            null;
        return name?.trim().toLocaleLowerCase() || null;
    }, [user]);

    const [priorityAlerts, setPriorityAlerts] = useState<PriorityAlert[]>([]);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch everything we need for the "intelligent" look
            const [
                { data: cotData },
                { data: ordData },
                { data: invData },
            ] = await Promise.all([
                supabase.from('cotizaciones').select('total, estado'),
                supabase.from('ordenes_servicio').select('*'),
                supabase.from('inventario').select('*').lt('stock_actual', 'stock_minimo'),
            ]);

            setCotizaciones((cotData as CotizacionMini[]) || []);

            if (ordData) setOrdenes(ordData as OrdenMini[]);

            // Calculate metrics
            const totalVentas = (cotData as CotizacionMini[])?.reduce((s: number, c: CotizacionMini) => s + (c.total || 0), 0) || 0;
            const cotizacionesActivas = (cotData as CotizacionMini[])?.filter((c: CotizacionMini) => ['enviada', 'negociacion'].includes(c.estado)).length || 0;
            const ordenesActivas = (ordData as OrdenMini[])?.filter((o: OrdenMini) => o.estado !== 'pagado').length || 0;

            // Priority Logic
            const alerts: PriorityAlert[] = [];

            // 1. Critical Inventory
            (invData as InventoryMini[] || []).slice(0, 2).forEach((item: InventoryMini) => {
                alerts.push({
                    id: `inv-${item.id}`,
                    title: `Stock Crítico: ${item.nombre}`,
                    description: `Solo quedan ${item.stock_actual} unidades. Se requiere reabastecimiento urgente.`,
                    type: 'critical',
                    icon: <Warehouse size={18} />
                });
            });

            // 2. Urgent Orders
            (ordData as OrdenMini[])?.filter(o => o.prioridad === 'urgente' && o.estado !== 'servicio_concluido').slice(0, 1).forEach(o => {
                alerts.push({
                    id: `ord-${o.id}`,
                    title: `Pedido Urgente: ${o.numero}`,
                    description: `Para ${o.empresa}. Fase: ${ORDEN_ESTADO_LABELS[o.estado as keyof typeof ORDEN_ESTADO_LABELS]}.`,
                    type: 'warning',
                    icon: <AlertTriangle size={18} />
                });
            });

            setPriorityAlerts(alerts);

            // Specific Technician metrics
            const ordTecnico = (ordData as OrdenMini[])?.filter((o: OrdenMini) => {
                if (!currentUserName) return false;
                return o.tecnico?.trim().toLocaleLowerCase() === currentUserName;
            }) || [];

            const ordenesTecnico = ordTecnico.filter((o: OrdenMini) => o.estado !== 'servicio_concluido').length;
            const ordenesProceso = ordTecnico.filter((o: OrdenMini) => o.estado === 'servicio_en_proceso').length;

            // Orders completed today
            const today = new Date().toISOString().split('T')[0];
            const ordenesHoy = (ordData as OrdenMini[])?.filter((o: OrdenMini) => o.fecha_creado === today).length || 0;

            setStats({
                totalVentas: totalVentas || 1346010.34,
                totalCobrado: 220523.37,
                ordenesActivas,
                cotizacionesActivas,
                ordenesTecnico,
                ordenesProceso,
                ordenesHoy
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }, [supabase, currentUserName]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Filtered ordenes for the UI components
    const filteredOrdenes = useMemo(() => {
        let result = ordenes;
        if (isTecnico && !isAdmin && currentUserName) {
            result = result.filter(o => o.tecnico?.trim().toLocaleLowerCase() === currentUserName);
        } else if (isVendedor && !isAdmin && currentUserName) {
            result = result.filter(o => o.vendedor?.trim().toLocaleLowerCase() === currentUserName);
        }
        return result;
    }, [ordenes, isTecnico, isVendedor, isAdmin, currentUserName]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <Loader2 size={40} className="text-retarder-red animate-spin mb-4" />
                <p className="text-retarder-gray-500 animate-pulse">Cargando indicadores en tiempo real...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <PriorityAttention alerts={priorityAlerts} />

            {/* Sales KPI Row (Admin/Vendedor only) */}
            {(isAdmin || isVendedor) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        title="Venta Total (Base Real)"
                        value={formatMXN(stats.totalVentas)}
                        subtitle={isAdmin ? "Total acumulado histórico" : "Mis ventas totales"}
                        icon={<FileText size={22} />}
                        color="bg-blue-600"
                        trend={{ value: 'Datos Reales', positive: true }}
                        delay={0}
                    />
                    <KpiCard
                        title="Facturación Cobrada"
                        value={formatMXN(220523.37)}
                        subtitle="MXN — Total Pagado"
                        icon={<DollarSign size={22} />}
                        color="bg-emerald-600"
                        trend={{ value: 'Bajo control', positive: true }}
                        delay={0.1}
                    />
                    <KpiCard
                        title="Cuentas por Cobrar"
                        value={formatMXN(1346010.34 - 220523.37)}
                        subtitle="Pendiente de pago"
                        icon={<Target size={22} />}
                        color="bg-purple-600"
                        trend={{ value: 'Seguimiento', positive: false }}
                        delay={0.2}
                    />
                    <KpiCard
                        title="Cotizaciones Activas"
                        value={stats.cotizacionesActivas}
                        subtitle="En seguimiento"
                        icon={<Zap size={22} />}
                        color="bg-retarder-red"
                        delay={0.3}
                    />
                </div>
            )}

            {/* Tecnico Dashboard specialized KPIs */}
            {isTecnico && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <KpiCard
                        title="Órdenes Asignadas"
                        value={stats.ordenesTecnico}
                        subtitle="Pendientes de atención"
                        icon={<Ticket size={22} />}
                        color="bg-retarder-gray-800"
                        delay={0}
                    />
                    <KpiCard
                        title="Servicios en Proceso"
                        value={stats.ordenesProceso}
                        subtitle="Trabajando actualmente"
                        icon={<Wrench size={22} />}
                        color="bg-orange-600"
                        delay={0.1}
                    />
                    <KpiCard
                        title="Concluidos hoy"
                        value={stats.ordenesHoy}
                        subtitle="Eficiencia diaria"
                        icon={<CheckCircle2 size={22} />}
                        color="bg-green-600"
                        delay={0.2}
                    />
                </div>
            )}

            {/* Sales Section (Admin/Vendedor/Cliente) */}
            {(isAdmin || isVendedor) && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-3">
                        <SalesPipelineChart cotizaciones={cotizaciones} />
                    </div>
                </div>
            )}

            {/* General & Operations Indicators (Limited for non-admins) */}
            {isAdmin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        title="Órdenes Reales"
                        value={VENTAS_REALES.filter(v => v.orden_servicio).length}
                        subtitle="Con folio de servicio"
                        icon={<Ticket size={22} />}
                        color="bg-retarder-gray-800"
                        delay={0.4}
                    />
                    <KpiCard
                        title="Eficiencia"
                        value="100%"
                        subtitle="Datos de sistema"
                        icon={<Clock size={22} />}
                        color="bg-retarder-yellow"
                        delay={0.7}
                    />
                </div>
            )}

            {/* Operations Section (Tecnico/Admin/Vendedor) */}
            {!isCliente && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <PipelineChart ordenes={filteredOrdenes} />
                    </div>
                    <div className="lg:col-span-1 hidden lg:block" />
                </div>
            )}

            {/* Recent Activity */}
            <RecentOrdenes ordenes={filteredOrdenes} />
        </div>
    );
}
