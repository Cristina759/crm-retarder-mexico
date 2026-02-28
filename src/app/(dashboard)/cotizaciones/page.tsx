'use client';

import { useState, useMemo, useTransition, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, FileText, Building2, DollarSign, Calendar, Eye, X, User, ArrowRight, Ticket, Trash2, Edit2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn, formatMXN, formatDate, formatUserName } from '@/lib/utils';
import { DemoCotizacion, DEMO_ORDENES, type OrdenEstado } from '@/lib/utils/constants';
import { useUser } from '@clerk/nextjs';
import { useRole } from '@/hooks/useRole';
import { createClient } from '@/lib/supabase/client';
import { Loader2, RefreshCcw } from 'lucide-react';
import { useEffect } from 'react';

type CotEstado = 'borrador' | 'enviada' | 'negociacion' | 'aceptada' | 'rechazada' | 'vencida';

const ESTADO_CONFIG: Record<CotEstado, { label: string; color: string }> = {
    borrador: { label: 'Borrador', color: 'bg-gray-100 text-gray-600' },
    enviada: { label: 'Enviada', color: 'bg-blue-100 text-blue-700' },
    negociacion: { label: 'Negociación', color: 'bg-orange-100 text-orange-700' },
    aceptada: { label: 'Aceptada', color: 'bg-emerald-100 text-emerald-700' },
    rechazada: { label: 'Rechazada', color: 'bg-red-100 text-red-700' },
    vencida: { label: 'Vencida', color: 'bg-amber-100 text-amber-700' },
};

const INITIAL_COTIZACIONES: DemoCotizacion[] = [
    { id: '1', numero: 'COT-00089', empresa: 'Transportes del Norte', vendedor: 'Ana G.', subtotal: 159482.76, iva: 25517.24, total: 185000, estado: 'enviada', vigencia_dias: 15, fecha: '2026-02-14', items: 5 },
    { id: '2', numero: 'COT-00088', empresa: 'Logística Global', vendedor: 'Ana G.', subtotal: 81896.55, iva: 13103.45, total: 95000, estado: 'aceptada', vigencia_dias: 30, fecha: '2026-02-12', items: 3, orden_id: '5', orden_numero: 'OS-00047' },
    { id: '3', numero: 'COT-00087', empresa: 'Carga Express MX', vendedor: 'Pedro V.', subtotal: 67241.38, iva: 10758.62, total: 78000, estado: 'aceptada', vigencia_dias: 15, fecha: '2026-02-11', items: 4, orden_id: '6', orden_numero: 'OS-00046' },
    { id: '4', numero: 'COT-00086', empresa: 'MegaFletes SA', vendedor: 'Pedro V.', subtotal: 36206.90, iva: 5793.10, total: 42000, estado: 'enviada', vigencia_dias: 30, fecha: '2026-02-13', items: 2 },
    { id: '5', numero: 'COT-00085', empresa: 'FreightMaster', vendedor: 'Ana G.', subtotal: 27586.21, iva: 4413.79, total: 32000, estado: 'aceptada', vigencia_dias: 15, fecha: '2026-02-10', items: 2 },
    { id: '6', numero: 'COT-00084', empresa: 'Fletes del Pacífico', vendedor: 'Pedro V.', subtotal: 103448.28, iva: 16551.72, total: 120000, estado: 'borrador', vigencia_dias: 30, fecha: '2026-02-08', items: 6 },
    { id: '7', numero: 'COT-00083', empresa: 'Central de Carga Mty', vendedor: 'Ana G.', subtotal: 30172.41, iva: 4827.59, total: 35000, estado: 'aceptada', vigencia_dias: 15, fecha: '2026-02-04', items: 3, orden_id: '13', orden_numero: 'OS-00039' },
    { id: '8', numero: 'COT-00082', empresa: 'Express Guadalajara', vendedor: 'Pedro V.', subtotal: 50000, iva: 8000, total: 58000, estado: 'vencida', vigencia_dias: 15, fecha: '2026-01-15', items: 4 },
    { id: '9', numero: 'COT-00081', empresa: 'Transportes Oriente', vendedor: 'Ana G.', subtotal: 79310.34, iva: 12689.66, total: 92000, estado: 'rechazada', vigencia_dias: 30, fecha: '2026-01-20', items: 5 },
    { id: '10', numero: 'COT-00080', empresa: 'Mudanzas Elite', vendedor: 'Pedro V.', subtotal: 15517.24, iva: 2482.76, total: 18000, estado: 'aceptada', vigencia_dias: 15, fecha: '2026-01-30', items: 1, orden_id: '17', orden_numero: 'OS-00035' },
];

export default function CotizacionesPage() {
    const supabase = createClient();
    const [cotizaciones, setCotizaciones] = useState<DemoCotizacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterEstado, setFilterEstado] = useState<CotEstado | 'all'>('all');
    const [showForm, setShowForm] = useState(false);
    const [selectedCot, setSelectedCot] = useState<any | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchCotizaciones = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('cotizaciones')
                .select('*, ordenes_servicio(id, numero)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map the joined data to match the expected UI structure
            const formattedData = (data || []).map((c: any) => ({
                ...c,
                orden_id: c.ordenes_servicio?.id || c.orden_id,
                orden_numero: c.ordenes_servicio?.numero
            }));

            setCotizaciones(formattedData);
        } catch (error) {
            console.error('Error fetching cotizaciones:', error);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    const handleDelete = useCallback((id: string) => {
        // Envolvemos el confirm en un pequeño delay para que la interacción del click se registre primero
        // y no bloquee el "Interaction to Next Paint" (INP)
        setTimeout(async () => {
            if (!confirm('¿Estás seguro de que deseas eliminar esta cotización? Esto también eliminará cualquier Orden de Servicio vinculada. Esta acción no se puede deshacer.')) return;

            setDeletingId(id);
            setIsProcessing(true);

            startTransition(async () => {
                try {
                    // 1. Primero eliminamos las órdenes de servicio vinculadas para evitar error de FK
                    const { error: osError } = await supabase
                        .from('ordenes_servicio')
                        .delete()
                        .eq('cotizacion_id', id);

                    if (osError) {
                        console.warn('Error al eliminar órdenes vinculadas:', osError);
                    }

                    // 2. Ahora eliminamos la cotización
                    const { error } = await supabase
                        .from('cotizaciones')
                        .delete()
                        .eq('id', id);

                    if (error) throw error;

                    await fetchCotizaciones();
                    setSelectedCot(null);
                } catch (error: any) {
                    console.error('Error deleting cotización:', error);
                    alert(`Error al eliminar la cotización: ${error.message || 'Error desconocido'}`);
                } finally {
                    setIsProcessing(false);
                    setDeletingId(null);
                }
            });
        }, 10);
    }, [supabase, fetchCotizaciones]);

    const handleUpdateStatus = async (id: string, nuevoEstado: CotEstado) => {
        setIsProcessing(true);
        try {
            const { error } = await supabase
                .from('cotizaciones')
                .update({ estado: nuevoEstado })
                .eq('id', id);

            if (error) throw error;
            fetchCotizaciones();
            if (selectedCot?.id === id) {
                setSelectedCot({ ...selectedCot, estado: nuevoEstado });
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error al actualizar el estado');
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        fetchCotizaciones();
    }, []);

    const { user } = useUser();
    const { role, isAdmin, isVendedor, isCliente } = useRole();

    const filtered = useMemo(() => {
        let result = cotizaciones;

        // Role-based filtering
        if (isVendedor) {
            // Filter by current user's name or fallback to demo name if not set
            const userName = formatUserName(user?.fullName) || 'ING. CRISTINA VELASCO';
            result = result.filter(c => c.vendedor === userName);
        } else if (isCliente) {
            const clientCompany = (user?.publicMetadata as { company?: string })?.company;
            if (clientCompany) {
                result = result.filter(c => c.empresa === clientCompany);
            } else {
                result = [];
            }
        }

        if (filterEstado !== 'all') result = result.filter(c => c.estado === filterEstado);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(c => c.numero.toLowerCase().includes(q) || c.empresa.toLowerCase().includes(q));
        }
        return result;
    }, [cotizaciones, searchQuery, filterEstado, isAdmin, isVendedor, isCliente]);

    const handleCreateOrden = async (cot: any) => {
        setIsProcessing(true);
        try {
            // 1. Generar número de orden profesional (Intenta obtener el siguiente folio real)
            let osNum = `OS-${Math.floor(Math.random() * 9000) + 1000}`; // Fallback random

            try {
                const { count } = await supabase
                    .from('ordenes_servicio')
                    .select('*', { count: 'exact', head: true });

                if (count !== null) {
                    osNum = `OS-${String(count + 1).padStart(4, '0')}`;
                }
            } catch (err) {
                console.warn("Fallback to random OS number");
            }

            // 2. Crear el registro en ordenes_servicio
            const newRecord = {
                numero: osNum,
                empresa: cot.empresa || 'Sin empresa',
                tipo: 'instalacion', // Default
                estado: 'solicitud_recibida' as OrdenEstado,
                prioridad: 'media',
                tecnico: '',
                vendedor: cot.vendedor || '',
                descripcion: `Creado desde Cotización ${cot.numero || cot.numero_cotizacion}`,
                fecha_creado: new Date().toISOString().split('T')[0],
                monto: cot.total,
                cotizacion_id: cot.id
            };

            const { data: insertedData, error: insertError } = await supabase
                .from('ordenes_servicio')
                .insert([newRecord])
                .select();

            if (insertError) throw insertError;

            // 3. Actualizar la cotización con la referencia a la orden
            const { error: updateError } = await supabase
                .from('cotizaciones')
                .update({
                    orden_id: insertedData[0].id,
                    // Si el esquema tiene orden_numero en la tabla cotizaciones, lo actualizamos también
                    // Por si acaso, lo manejamos dinámicamente o confiamos en el join futuro
                })
                .eq('id', cot.id);

            // Nota: Si el esquema de cotizaciones NO tiene orden_id, esto fallará silenciosamente o dará error.
            // He verificado que SÍ tiene orden_id en pasos anteriores.

            await fetchCotizaciones();
            alert(`¡Orden de Servicio ${osNum} creada exitosamente para ${cot.empresa}!`);
        } catch (error: any) {
            console.error('Error creating orden:', error);
            alert(`Error al crear la orden: ${error.message || 'Error desconocido'}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const totalMonto = filtered.reduce((s, c) => s + c.total, 0);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-retarder-black">Cotizaciones</h2>
                    <p className="text-xs text-retarder-gray-500">{cotizaciones.length} cotizaciones · Monto total: {formatMXN(totalMonto)}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-retarder-gray-100 rounded-lg px-3 py-2">
                        <Search size={14} className="text-retarder-gray-400" />
                        <input type="text" placeholder="Buscar..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-sm w-40" />
                    </div>
                    <Link href="/ventas/nueva" className="flex items-center gap-2 px-4 py-2 bg-[#FACC15] text-black rounded-lg text-sm font-medium hover:bg-[#EAB308] transition-colors shadow-md shadow-yellow-500/20">
                        <Plus size={16} /><span className="hidden sm:inline">Nueva Cotización</span>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {(['all', ...Object.keys(ESTADO_CONFIG)] as const).map(key => {
                    const isAll = key === 'all';
                    const count = isAll ? cotizaciones.length : cotizaciones.filter(c => c.estado === key).length;
                    return (
                        <button key={key} onClick={() => setFilterEstado(key as CotEstado | 'all')} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border', filterEstado === key ? 'bg-retarder-black text-white border-retarder-black' : 'bg-white text-retarder-gray-600 border-retarder-gray-200 hover:bg-retarder-gray-50')}>
                            {isAll ? 'Todas' : ESTADO_CONFIG[key as CotEstado].label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Table */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl border border-retarder-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-retarder-gray-50">
                            <tr className="border-b border-retarder-gray-200">
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Cotización</th>
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Empresa</th>
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Estado</th>
                                <th className="text-right py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Total</th>
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden md:table-cell">Vínculo</th>
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden sm:table-cell">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center">
                                        <Loader2 size={24} className="mx-auto text-retarder-red animate-spin mb-2" />
                                        <p className="text-xs text-retarder-gray-400">Cargando cotizaciones...</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((c, i) => (
                                    <motion.tr
                                        key={c.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.01 }}
                                        onClick={() => setSelectedCot(c)}
                                        className="border-b border-retarder-gray-50 hover:bg-retarder-gray-50 cursor-pointer transition-colors group"
                                    >
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <FileText size={14} className="text-retarder-gray-400" />
                                                <span className="font-mono text-xs font-bold text-retarder-red">{c.numero || c.numero_cotizacion}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 font-medium text-retarder-gray-800">{c.empresa}</td>
                                        <td className="py-3 px-4">
                                            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', ESTADO_CONFIG[c.estado].color)}>
                                                {ESTADO_CONFIG[c.estado].label}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right font-semibold text-retarder-gray-800">{formatMXN(c.total)}</td>
                                        <td className="py-3 px-4 hidden md:table-cell">
                                            {c.orden_numero ? (
                                                <Link href="/ordenes" className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium">
                                                    <Ticket size={12} />
                                                    {c.orden_numero}
                                                </Link>
                                            ) : (
                                                <span className="text-[10px] text-retarder-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 hidden sm:table-cell">
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {c.estado === 'aceptada' && !c.orden_id && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCreateOrden(c);
                                                        }}
                                                        className="p-1.5 bg-retarder-red text-white rounded-lg hover:bg-retarder-red-700 transition-all shadow-sm"
                                                        title="Crear Orden de Servicio"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(c.id);
                                                    }}
                                                    disabled={isProcessing || deletingId === c.id}
                                                    className={cn(
                                                        "p-1.5 bg-white border border-retarder-gray-200 rounded-lg transition-all",
                                                        deletingId === c.id
                                                            ? "text-retarder-red animate-pulse"
                                                            : "text-retarder-gray-400 hover:text-retarder-red hover:border-retarder-red/20"
                                                    )}
                                                    title="Eliminar Cotización"
                                                >
                                                    {deletingId === c.id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={14} />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedCot && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCot(null)} className="fixed inset-0 bg-retarder-black/60 backdrop-blur-md z-40" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-[2rem] shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-retarder-red/10 flex items-center justify-center text-retarder-red">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-retarder-black">{selectedCot.numero || selectedCot.numero_cotizacion}</h3>
                                            <p className="text-xs text-retarder-gray-400 font-bold uppercase tracking-widest">{selectedCot.empresa}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedCot(null)} className="p-2 rounded-xl bg-retarder-gray-50 text-retarder-gray-400 hover:bg-retarder-red/10 hover:text-retarder-red transition-all"><X size={20} /></button>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-retarder-gray-50 border border-retarder-gray-100">
                                            <label className="text-[10px] font-black uppercase text-retarder-gray-400 block mb-1">Total Cotizado</label>
                                            <p className="text-xl font-black text-retarder-black">{formatMXN(selectedCot.total)}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-retarder-gray-50 border border-retarder-gray-100">
                                            <label className="text-[10px] font-black uppercase text-retarder-gray-400 block mb-1">Estado Actual</label>
                                            <span className={cn('inline-block px-3 py-1 rounded-full text-xs font-bold mt-1', ESTADO_CONFIG[selectedCot.estado as CotEstado].color)}>
                                                {ESTADO_CONFIG[selectedCot.estado as CotEstado].label}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-retarder-gray-400 block px-1">Actualizar Estado</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(['enviada', 'negociacion', 'aceptada', 'rechazada', 'vencida'] as CotEstado[]).map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => handleUpdateStatus(selectedCot.id, status)}
                                                    disabled={isProcessing || selectedCot.estado === status}
                                                    className={cn(
                                                        'py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all',
                                                        selectedCot.estado === status
                                                            ? 'bg-retarder-black text-white border-retarder-black'
                                                            : 'bg-white text-retarder-gray-600 border-retarder-gray-200 hover:border-retarder-red/30 hover:text-retarder-red'
                                                    )}
                                                >
                                                    {ESTADO_CONFIG[status].label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-retarder-gray-100 flex gap-3">
                                        <button
                                            onClick={() => handleDelete(selectedCot.id)}
                                            disabled={isProcessing}
                                            className="flex items-center justify-center gap-2 px-6 py-3 border border-retarder-gray-200 text-retarder-gray-400 hover:text-retarder-red hover:bg-retarder-red/5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                                        >
                                            {isProcessing && deletingId === selectedCot.id ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Trash2 size={16} />
                                            )}
                                            {isProcessing && deletingId === selectedCot.id ? 'Eliminando...' : 'Eliminar'}
                                        </button>
                                        <button
                                            onClick={() => setSelectedCot(null)}
                                            className="flex-1 py-3 bg-retarder-black text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-retarder-black/20 hover:scale-[1.02] active:scale-95 transition-all"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
