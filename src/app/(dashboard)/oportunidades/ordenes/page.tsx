'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Filter,
    LayoutGrid,
    List,
    Search,
    Wrench,
    Building2,
    ArrowUpDown,
    Eye,
    X,
    FileText,
    DollarSign,
    User,
    Ticket as OrdenIcon,
    Trash2,
} from 'lucide-react';
import { cn, formatMXN, formatUserName } from '@/lib/utils';
import {
    ORDEN_ESTADOS,
    ORDEN_ESTADO_LABELS,
    ORDEN_ESTADO_COLORS,
    ORDEN_PHASES,
    PRIORIDAD_COLORS,
    TIPO_SERVICIO_LABELS,
    type OrdenEstado,
    type OrdenPhase,
    getPhaseForEstado,
} from '@/lib/utils/constants';
import { KanbanBoard } from '@/components/ordenes/kanban-board';
import { OrdenDetailPanel } from '@/components/ordenes/orden-detail-panel';
import { useUser } from '@clerk/nextjs';
import { useRole } from '@/hooks/useRole';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { CLIENTES_REALES } from '@/lib/data/clientes-reales';

interface CustomMetadata {
    company?: string;
}

// Fase Cierre + Fase Administrativa: siempre visibles para todos los roles
const ESTADOS_SIEMPRE_VISIBLES = [
    'servicio_concluido', 'evidencia_cargada', 'documentacion_entregada', // Cierre
    'encuesta_enviada', 'facturado', 'pagado',                            // Administrativa
];

export default function OrdenesPage() {
    const supabase = createClient();
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [searchQuery, setSearchQuery] = useState('');
    const [activePhaseFilter, setActivePhaseFilter] = useState<OrdenPhase | 'all'>('all');
    const [ordenes, setOrdenes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrden, setSelectedOrden] = useState<any | null>(null);
    const [showNewOrden, setShowNewOrden] = useState(false);
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [newOrden, setNewOrden] = useState<{ empresa: string; tipo: 'preventivo' | 'correctivo' | 'instalacion' | 'diagnostico'; prioridad: 'baja' | 'media' | 'alta' | 'urgente'; tecnico: string; vendedor: string; descripcion: string; monto: string }>({ empresa: '', tipo: 'preventivo', prioridad: 'media', tecnico: '', vendedor: '', descripcion: '', monto: '' });
    const [empresaSearch, setEmpresaSearch] = useState('');

    const { user } = useUser();
    const { role, isAdmin, isVendedor, isTecnico, isCliente } = useRole();

    // Helper to get normalized name from Clerk
    const currentUserName = useMemo(() => {
        const name = user?.fullName ||
            (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : null) ||
            user?.firstName ||
            null;
        return formatUserName(name).toLowerCase();
    }, [user]);

    const fetchOrdenes = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('ordenes_servicio')
                .select('*')
                .order('fecha_creado', { ascending: false });

            if (error) throw error;
            setOrdenes(data || []);
        } catch (error) {
            console.error('Error fetching ordenes:', error);
            setOrdenes([]);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    const handleDragEstadoChange = useCallback((nuevoEstado?: string) => {
        if (nuevoEstado) {
            const fase = ORDEN_PHASES.find(p => p.estados.includes(nuevoEstado as OrdenEstado));
            setActivePhaseFilter(fase ? fase.id : 'all');
        }
        // setTimeout garantiza que React procese el cambio de filtro
        // antes de que lleguen los datos del fetch
        setTimeout(() => fetchOrdenes(), 300);
    }, [fetchOrdenes]);

    useEffect(() => {
        fetchOrdenes();
    }, [fetchOrdenes]);

    const handleCreateOrden = async () => {
        setIsSaving(true);
        try {
            const nextNum = ordenes.length + 52;
            const newRecord = {
                numero: `OS-${String(nextNum).padStart(5, '0')}`,
                empresa: newOrden.empresa || 'Sin empresa',
                tipo: newOrden.tipo,
                estado: 'solicitud_recibida' as OrdenEstado,
                prioridad: newOrden.prioridad,
                tecnico: newOrden.tecnico,
                vendedor: newOrden.vendedor || 'Sin asignar',
                descripcion: newOrden.descripcion || 'Nueva orden de servicio',
                fecha_creado: new Date().toISOString().split('T')[0],
                monto: newOrden.monto ? Number(newOrden.monto) : null,
            };

            const { error } = await supabase
                .from('ordenes_servicio')
                .insert([newRecord]);

            if (error) throw error;

            fetchOrdenes();
            setShowNewOrden(false);
            setStep(1);
            setEmpresaSearch('');
            setNewOrden({ empresa: '', tipo: 'preventivo', prioridad: 'media', tecnico: '', vendedor: '', descripcion: '', monto: '' });
        } catch (error) {
            console.error('Error creating orden:', error);
            alert('Error al crear la orden');
        } finally {
            setIsSaving(false);
        }
    };

    const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    // Paso 1: primer clic en el bote de basura → pone el ID en confirmDeleteId
    // Paso 2: segundo clic (botón rojo "Confirmar") → ejecuta el borrado real
    const handleDeleteOrden = async (id: string) => {
        console.log('🗑️ handleDeleteOrden llamado con id:', id);
        console.log('🔍 confirmDeleteId actual:', confirmDeleteId);

        // Si ya está en modo confirmar para este ID, ejecutar el borrado
        if (confirmDeleteId === id) {
            console.log('✅ Ejecutando DELETE en Supabase...');
            setIsDeleting(true);
            try {
                // Borrar de Supabase si es UUID válido
                if (isValidUUID(id)) {
                    console.log('🔗 Limpiando dependencias para la orden:', id);
                    
                    // 1. Desvincular de cotizaciones (si existe el campo orden_id)
                    try {
                        await supabase.from('cotizaciones').update({ orden_id: null }).eq('orden_id', id);
                    } catch (e) { console.log('Campo orden_id no presente en cotizaciones o ya nulo'); }

                    // 2. Borrar evidencias 
                    await supabase.from('evidencias').delete().eq('orden_id', id);
                    
                    // 3. Borrar encuestas
                    await supabase.from('encuestas').delete().eq('orden_id', id);

                    // 4. Borrar historial (si existe la tabla)
                    try {
                        await supabase.from('ticket_historial').delete().eq('ticket_id', id);
                    } catch (e) {}

                    // 5. SEGUNDO: Borrar la orden
                    const { error } = await supabase.from('ordenes_servicio').delete().eq('id', id);
                    
                    if (error) {
                        console.error('Error Supabase al borrar:', error);
                        alert(`No se pudo eliminar la orden: ${error.message}`);
                        return;
                    }
                }

                // Quitar de la lista local inmediatamente (optimistic update)
                setOrdenes(prev => prev.filter(o => o.id !== id));
                setConfirmDeleteId(null);
            } catch (error) {
                console.error('Error deleting orden:', error);
            } finally {
                setIsDeleting(false);
            }
        } else {
            // Primer clic: poner en modo confirmación
            setConfirmDeleteId(id);
            // Auto-cancelar después de 4 segundos si no confirma
            setTimeout(() => setConfirmDeleteId(prev => prev === id ? null : prev), 4000);
        }
    };

    // Filter ordenes
    const filteredOrdenes = useMemo(() => {
        let result = ordenes;

        // Role-based filtering — Fase Cierre orders are always visible for all roles
        if (isVendedor && !isAdmin) {
            if (currentUserName) {
                result = result.filter(o => {
                    if (!o.vendedor) return true;
                    if (ESTADOS_SIEMPRE_VISIBLES.includes(o.estado)) return true;
                    const vendedorName = o.vendedor?.trim().toLocaleLowerCase() || '';
                    return vendedorName.includes('cristina') || vendedorName === currentUserName;
                });
            }
        } else if (isTecnico && !isAdmin) {
            if (currentUserName) {
                result = result.filter(o =>
                    ESTADOS_SIEMPRE_VISIBLES.includes(o.estado) ||
                    o.tecnico?.trim().toLocaleLowerCase() === currentUserName
                );
            } else {
                const fallback = 'Israel Garcia'.toLocaleLowerCase();
                result = result.filter(o =>
                    ESTADOS_SIEMPRE_VISIBLES.includes(o.estado) ||
                    o.tecnico?.trim().toLocaleLowerCase() === fallback
                );
            }
        } else if (isCliente && !isAdmin) {
            const clientCompany = (user?.publicMetadata as CustomMetadata)?.company;
            if (clientCompany) {
                result = result.filter(o => o.empresa === clientCompany);
            } else {
                result = []; // Show nothing if no company is assigned
            }
        }

        // Phase filter
        if (activePhaseFilter !== 'all') {
            const phase = ORDEN_PHASES.find(p => p.id === activePhaseFilter);
            if (phase) {
                result = result.filter(o => phase.estados.includes(o.estado));
            }
        }
        // ... rest of search logic

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(o =>
                (o.numero?.toLowerCase() || '').includes(q) ||
                (o.empresa?.toLowerCase() || '').includes(q) ||
                (o.tecnico?.toLowerCase() || '').includes(q) ||
                (o.descripcion?.toLowerCase() || '').includes(q)
            );
        }

        return result;
    }, [ordenes, activePhaseFilter, searchQuery]);

    // Filter phases: Technical role doesn't see 'comercial' nor 'administrativa' phases
    const visiblePhases = useMemo(() => {
        if (isTecnico && !isAdmin) {
            return ORDEN_PHASES.filter(p => p.id !== 'comercial' && p.id !== 'administrativa');
        }
        return ORDEN_PHASES;
    }, [isTecnico, isAdmin]);

    // Stats
    const stats = useMemo(() => ({
        total: ordenes.length,
        byPhase: visiblePhases.map(p => ({
            ...p,
            count: ordenes.filter(o => p.estados.includes(o.estado)).length,
        })),
    }), [ordenes, visiblePhases]);

    return (
        <div className="space-y-4">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-retarder-black">Pipeline de Órdenes de Servicio</h2>
                    <p className="text-xs text-retarder-gray-500">
                        {stats.total} órdenes en el pipeline · 14 estados · {visiblePhases.length} fases
                        {process.env.NODE_ENV === 'development' && currentUserName && (
                            <span className="ml-2 text-[10px] text-retarder-red/50">
                                (Filtrando por: {currentUserName})
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="flex items-center gap-1 bg-retarder-gray-100 rounded-lg px-3 py-2">
                        <Search size={14} className="text-retarder-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar orden..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm w-40"
                        />
                    </div>

                    {/* View toggle */}
                    <div className="flex border border-retarder-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={cn(
                                'p-2 transition-colors',
                                viewMode === 'kanban' ? 'bg-retarder-red text-white' : 'hover:bg-retarder-gray-100'
                            )}
                            title="Vista Kanban"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                'p-2 transition-colors',
                                viewMode === 'list' ? 'bg-retarder-red text-white' : 'hover:bg-retarder-gray-100'
                            )}
                            title="Vista Lista"
                        >
                            <List size={16} />
                        </button>
                    </div>

                    {/* New orden button (Admin/Vendedor only) - REMOVED AS PER USER REQUEST to enforce quote-first flow */}
                    {/* {(isAdmin || isVendedor) && (
                        <button onClick={() => setShowNewOrden(true)} className="flex items-center gap-2 px-4 py-2 bg-retarder-red text-white rounded-lg text-sm font-medium hover:bg-retarder-red-700 transition-colors shadow-md shadow-retarder-red/20">
                            <Plus size={16} />
                            <span className="hidden sm:inline">Nueva Orden</span>
                        </button>
                    )} */}
                </div>
            </div>

            {/* Phase Stats Bar */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {/* All filter */}
                <button
                    onClick={() => setActivePhaseFilter('all')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border',
                        activePhaseFilter === 'all'
                            ? 'bg-retarder-black text-white border-retarder-black shadow-md'
                            : 'bg-white text-retarder-gray-600 border-retarder-gray-200 hover:bg-retarder-gray-50',
                    )}
                >
                    <LayoutGrid size={12} />
                    Todo
                    <span className={cn(
                        'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                        activePhaseFilter === 'all'
                            ? 'bg-white/20 text-white'
                            : 'bg-retarder-gray-100 text-retarder-gray-500',
                    )}>
                        {stats.total}
                    </span>
                </button>

                {/* Phase filters */}
                {stats.byPhase.map((phase) => (
                    <button
                        key={phase.id}
                        onClick={() => setActivePhaseFilter(activePhaseFilter === phase.id ? 'all' : phase.id)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border',
                            activePhaseFilter === phase.id
                                ? `${phase.bgColor} text-white border-transparent shadow-md`
                                : `bg-white border-retarder-gray-200 hover:${phase.bgLight} ${phase.textColor}`,
                        )}
                    >
                        <span>{phase.emoji}</span>
                        <span className="hidden md:inline">{phase.label}</span>
                        <span className={cn(
                            'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                            activePhaseFilter === phase.id
                                ? 'bg-white/20 text-white'
                                : `${phase.bgLight} ${phase.textColor}`,
                        )}>
                            {phase.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Kanban Board */}
            <AnimatePresence mode="wait">
                {viewMode === 'kanban' && (
                    <motion.div
                        key="kanban"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <KanbanBoard
                            ordenes={filteredOrdenes}
                            onOrdenesChange={setOrdenes}
                            onOrdenClick={setSelectedOrden}
                            onDelete={handleDeleteOrden}
                            confirmDeleteId={confirmDeleteId}
                            isDeleting={isDeleting}
                            onRefresh={handleDragEstadoChange}
                        />
                    </motion.div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-xl border border-retarder-gray-200 overflow-hidden shadow-sm"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-retarder-gray-50">
                                    <tr className="border-b border-retarder-gray-200">
                                        <th className="text-left py-3 px-2 sm:px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Orden</th>
                                        <th className="text-left py-3 px-2 sm:px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Empresa</th>
                                        <th className="text-left py-3 px-2 sm:px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden md:table-cell">Tipo</th>
                                        <th className="text-left py-3 px-2 sm:px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Estado</th>
                                        <th className="text-left py-3 px-2 sm:px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden lg:table-cell">Técnico</th>
                                        <th className="text-left py-3 px-2 sm:px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden sm:table-cell">Prioridad</th>
                                        <th className="text-right py-3 px-2 sm:px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden xl:table-cell">Monto</th>
                                        <th className="text-right py-3 px-2 sm:px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center">
                                                <Loader2 size={24} className="mx-auto text-retarder-red animate-spin mb-2" />
                                                <p className="text-xs text-retarder-gray-400">Cargando órdenes...</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrdenes.map((o, i) => {
                                            const phase = getPhaseForEstado(o.estado);
                                            return (
                                                <motion.tr
                                                    key={o.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.02 }}
                                                    className="border-b border-retarder-gray-50 hover:bg-retarder-gray-50 cursor-pointer transition-colors"
                                                    onClick={() => setSelectedOrden(o)}
                                                >
                                                    <td className="py-3 px-2 sm:px-4 font-mono text-xs font-bold text-retarder-red">{o.numero}</td>
                                                    <td className="py-3 px-2 sm:px-4">
                                                        <div className="flex items-center gap-2">
                                                            <Building2 size={14} className="text-retarder-gray-400 hidden sm:block" />
                                                            <span className="font-medium text-retarder-gray-800 truncate max-w-[100px] sm:max-w-[160px]">{o.empresa}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2 sm:px-4 hidden md:table-cell">
                                                        <div className="flex items-center gap-1.5">
                                                            <Wrench size={12} className="text-retarder-gray-400" />
                                                            <span className="text-retarder-gray-600 truncate max-w-[100px]">{TIPO_SERVICIO_LABELS[o.tipo as keyof typeof TIPO_SERVICIO_LABELS]}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2 sm:px-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={cn('w-2 h-2 rounded-full shrink-0', ORDEN_ESTADO_COLORS[o.estado as keyof typeof ORDEN_ESTADO_COLORS])} />
                                                            <span className="text-[10px] sm:text-xs font-medium text-retarder-gray-700 truncate max-w-[80px] sm:max-w-none">
                                                                {ORDEN_ESTADO_LABELS[o.estado as keyof typeof ORDEN_ESTADO_LABELS]}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2 sm:px-4 text-retarder-gray-600 hidden lg:table-cell truncate max-w-[120px]">{o.tecnico || '—'}</td>
                                                    <td className="py-3 px-2 sm:px-4 hidden sm:table-cell">
                                                        <span className={cn(
                                                            'px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap',
                                                            PRIORIDAD_COLORS[o.prioridad as keyof typeof PRIORIDAD_COLORS],
                                                        )}>
                                                            {o.prioridad}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-2 sm:px-4 text-right text-retarder-gray-600 font-medium hidden xl:table-cell whitespace-nowrap">
                                                        {o.monto ? formatMXN(o.monto) : '—'}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {isAdmin && (
                                                                confirmDeleteId === o.id ? (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteOrden(o.id);
                                                                        }}
                                                                        disabled={isDeleting}
                                                                        className="flex items-center gap-1 px-2 py-1 bg-retarder-red text-white text-[10px] font-bold rounded-lg animate-pulse hover:bg-red-700 transition-colors"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                        {isDeleting ? 'Borrando...' : '¿Confirmar?'}
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteOrden(o.id);
                                                                        }}
                                                                        className="p-1.5 text-retarder-gray-400 hover:text-retarder-red hover:bg-retarder-red/5 rounded-lg transition-colors"
                                                                        title="Eliminar"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                )
                                                            )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Orden Detail Panel */}
            <OrdenDetailPanel
                orden={selectedOrden}
                onClose={() => setSelectedOrden(null)}
                onUpdate={fetchOrdenes}
            />

            {/* New Orden Modal */}
            <AnimatePresence>
                {showNewOrden && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowNewOrden(false); setStep(1); }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-retarder-gray-200 bg-gradient-to-r from-retarder-red to-retarder-red-700">
                                <h3 className="text-lg font-bold text-white">Nueva Orden de Servicio</h3>
                                <button onClick={() => { setShowNewOrden(false); setStep(1); }} className="p-2 rounded-lg hover:bg-white/10 text-white"><X size={18} /></button>
                            </div>

                            {step === 1 ? (
                                <div className="p-6 space-y-4">
                                    <p className="text-sm font-semibold text-retarder-gray-700 mb-4">Selecciona el tipo de servicio:</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'preventivo', label: '🛡️ Preventivo', desc: 'Mantenimiento regular' },
                                            { id: 'correctivo', label: '🔧 Correctivo', desc: 'Reparación de falla' },
                                            { id: 'instalacion', label: '⚙️ Instalación', desc: 'Equipo nuevo' },
                                            { id: 'diagnostico', label: '🔍 Diagnóstico', desc: 'Revisión técnica' }
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => {
                                                    setNewOrden({ ...newOrden, tipo: t.id as 'preventivo' | 'correctivo' | 'instalacion' | 'diagnostico' });
                                                    setStep(2);
                                                }}
                                                className="flex flex-col p-4 rounded-xl border-2 border-retarder-gray-100 bg-retarder-gray-50 hover:border-retarder-red hover:bg-retarder-red/5 transition-all text-left group"
                                            >
                                                <span className="text-lg mb-1">{t.label.split(' ')[0]}</span>
                                                <span className="text-sm font-bold text-retarder-gray-800 group-hover:text-retarder-red">{t.label.split(' ')[1]}</span>
                                                <span className="text-[10px] text-retarder-gray-400">{t.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="pt-4 border-t border-retarder-gray-100">
                                        <button onClick={() => setShowNewOrden(false)} className="w-full py-2.5 text-sm font-medium text-retarder-gray-500 hover:text-retarder-gray-700">Cancelar</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                                        <div className="flex items-center gap-2 p-3 bg-retarder-red/5 border border-retarder-red/10 rounded-xl mb-2">
                                            <div className="w-10 h-10 rounded-lg bg-retarder-red/10 flex items-center justify-center text-retarder-red text-xl">
                                                {newOrden.tipo === 'preventivo' ? '🛡️' : newOrden.tipo === 'correctivo' ? '🔧' : newOrden.tipo === 'instalacion' ? '⚙️' : '🔍'}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-retarder-red uppercase tracking-wider">{TIPO_SERVICIO_LABELS[newOrden.tipo]}</p>
                                                <button onClick={() => setStep(1)} className="text-[10px] text-retarder-gray-500 hover:text-retarder-red font-medium underline">Cambiar tipo</button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Empresa / Cliente</label>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 border border-retarder-gray-200 rounded-lg px-3 py-2 focus-within:border-retarder-red focus-within:ring-2 focus-within:ring-retarder-red/10">
                                                    <Search size={13} className="text-retarder-gray-400 shrink-0" />
                                                    <input
                                                        type="text"
                                                        placeholder="🔍 Buscar cliente..."
                                                        value={empresaSearch}
                                                        onChange={e => setEmpresaSearch(e.target.value)}
                                                        className="flex-1 outline-none text-sm"
                                                    />
                                                </div>
                                                <select
                                                    value={newOrden.empresa}
                                                    onChange={e => setNewOrden({ ...newOrden, empresa: e.target.value })}
                                                    className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm font-semibold outline-none focus:border-retarder-red bg-white"
                                                >
                                                    <option value="">-- Seleccionar empresa --</option>
                                                    {CLIENTES_REALES
                                                        .filter(c => !empresaSearch.trim() || (c.nombre_comercial?.toLowerCase() || '').includes(empresaSearch.toLowerCase()))
                                                        .map(c => (
                                                            <option key={c.id} value={c.nombre_comercial}>{c.nombre_comercial}</option>
                                                        ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Prioridad</label>
                                            <select
                                                value={newOrden.prioridad}
                                                onChange={e => setNewOrden({ ...newOrden, prioridad: e.target.value as 'baja' | 'media' | 'alta' | 'urgente' })}
                                                className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none bg-white"
                                            >
                                                <option value="baja">🟢 Baja</option>
                                                <option value="media">🟡 Media</option>
                                                <option value="alta">🟠 Alta</option>
                                                <option value="urgente">🔴 Urgente</option>
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Técnico</label>
                                                <div className="flex items-center gap-2 border border-retarder-gray-200 rounded-lg px-3 py-2.5 focus-within:border-retarder-red focus-within:ring-2 focus-within:ring-retarder-red/10">
                                                    <User size={14} className="text-retarder-gray-400" />
                                                    <input type="text" placeholder="Asignar técnico" value={newOrden.tecnico} onChange={e => setNewOrden({ ...newOrden, tecnico: e.target.value })} className="flex-1 outline-none text-sm" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Vendedor</label>
                                                <div className="flex items-center gap-2 border border-retarder-gray-200 rounded-lg px-3 py-2.5 focus-within:border-retarder-red focus-within:ring-2 focus-within:ring-retarder-red/10">
                                                    <User size={14} className="text-retarder-gray-400" />
                                                    <input type="text" placeholder="Vendedor asignado" value={newOrden.vendedor} onChange={e => setNewOrden({ ...newOrden, vendedor: e.target.value })} className="flex-1 outline-none text-sm" />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Descripción</label>
                                            <textarea placeholder="Describe el servicio requerido..." value={newOrden.descripcion} onChange={e => setNewOrden({ ...newOrden, descripcion: e.target.value })} rows={3} className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none resize-none" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Monto Estimado (MXN)</label>
                                            <div className="flex items-center gap-2 border border-retarder-gray-200 rounded-lg px-3 py-2.5 focus-within:border-retarder-red focus-within:ring-2 focus-within:ring-retarder-red/10">
                                                <DollarSign size={14} className="text-retarder-gray-400" />
                                                <input type="number" placeholder="0.00" value={newOrden.monto} onChange={e => setNewOrden({ ...newOrden, monto: e.target.value })} className="flex-1 outline-none text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-6 py-4 border-t border-retarder-gray-200 bg-retarder-gray-50 flex gap-2">
                                        <button onClick={() => setStep(1)} className="flex-1 px-4 py-2.5 border border-retarder-gray-200 rounded-xl text-sm font-medium text-retarder-gray-600 hover:bg-white transition-colors">Atrás</button>
                                        <button onClick={handleCreateOrden} className="flex-1 px-4 py-2.5 bg-retarder-red text-white rounded-xl text-sm font-semibold hover:bg-retarder-red-700 transition-colors shadow-md shadow-retarder-red/20">Crear Orden</button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
