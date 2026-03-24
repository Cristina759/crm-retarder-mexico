'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Clock, DollarSign, X, Loader2, Pencil, Trash2, ClipboardCheck } from 'lucide-react';
import { cn, formatMXN } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// ── Types ────────────────────────────────────────────

type ServTipo = 'preventivo' | 'correctivo' | 'instalacion' | 'diagnostico' | 'venta';

interface Servicio {
    id: string;
    tipo: ServTipo;
    nombre: string;
    descripcion: string | null;
    precio_base_mxn: number;
    duracion_estimada_hrs: number | null;
    requiere_equipo: string[] | null;
    activo: boolean;
}

interface FormState {
    tipo: ServTipo;
    nombre: string;
    descripcion: string;
    precio_base_mxn: string;
    duracion_estimada_hrs: string;
    requiere_equipo: string; // comma-separated string → array al guardar
}

const FORM_INITIAL: FormState = {
    tipo: 'preventivo',
    nombre: '',
    descripcion: '',
    precio_base_mxn: '',
    duracion_estimada_hrs: '',
    requiere_equipo: '',
};

// ── Config ───────────────────────────────────────────

const TIPO_CONFIG: Record<ServTipo, { label: string; color: string; icon: string }> = {
    preventivo:  { label: 'Preventivo',  color: 'bg-emerald-100 text-emerald-700', icon: '🛡️' },
    correctivo:  { label: 'Correctivo',  color: 'bg-amber-100 text-amber-700',     icon: '🔧' },
    instalacion: { label: 'Instalación', color: 'bg-blue-100 text-blue-700',       icon: '⚙️' },
    diagnostico: { label: 'Diagnóstico', color: 'bg-purple-100 text-purple-700',   icon: '🔍' },
    venta:       { label: 'Venta',       color: 'bg-retarder-red/10 text-retarder-red',   icon: '💰' },
};

// ── Page ─────────────────────────────────────────────

export default function ServiciosPage() {
    const { isAdmin } = useRole();
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterTipo, setFilterTipo] = useState<ServTipo | 'all'>('all');

    // Modal state: null = closed, 'create' = new, Servicio = editing
    const [modal, setModal] = useState<null | 'create' | Servicio>(null);
    const [form, setForm] = useState<FormState>(FORM_INITIAL);

    // Confirm delete
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    // ── Fetch ──────────────────────────────────────────

    const fetchServicios = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('catalogo_servicios')
                .select('*')
                .eq('activo', true)
                .order('nombre');

            if (error) throw error;
            setServicios((data || []).map(s => ({
                ...s,
                precio_base_mxn: Number(s.precio_base_mxn) || 0,
                duracion_estimada_hrs: s.duracion_estimada_hrs != null ? Number(s.duracion_estimada_hrs) : null,
            })));
        } catch (err) {
            console.error('Error cargando servicios:', err);
            setServicios([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchServicios();
    }, [fetchServicios]);

    // ── Derived ───────────────────────────────────────

    const filtered = useMemo(() => {
        let result = servicios;
        if (filterTipo !== 'all') result = result.filter(s => s.tipo === filterTipo);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.nombre.toLowerCase().includes(q) ||
                (s.descripcion?.toLowerCase() || '').includes(q)
            );
        }
        return result;
    }, [servicios, searchQuery, filterTipo]);

    // ── Modal helpers ──────────────────────────────────

    const openCreate = () => {
        setForm(FORM_INITIAL);
        setModal('create');
    };

    const openEdit = (s: Servicio) => {
        setForm({
            tipo: s.tipo,
            nombre: s.nombre,
            descripcion: s.descripcion || '',
            precio_base_mxn: s.precio_base_mxn.toString(),
            duracion_estimada_hrs: s.duracion_estimada_hrs?.toString() || '',
            requiere_equipo: (s.requiere_equipo ?? []).join(', '),
        });
        setModal(s);
    };

    const closeModal = () => {
        setModal(null);
        setForm(FORM_INITIAL);
    };

    // ── CRUD ───────────────────────────────────────────

    const handleSave = async () => {
        if (!form.nombre.trim()) {
            alert('El nombre del servicio es obligatorio.');
            return;
        }
        const precio = parseFloat(form.precio_base_mxn);
        if (isNaN(precio) || precio < 0) {
            alert('Ingresa un precio base válido.');
            return;
        }

        const payload = {
            tipo: form.tipo,
            nombre: form.nombre.trim(),
            descripcion: form.descripcion.trim() || null,
            precio_base_mxn: precio,
            duracion_estimada_hrs: form.duracion_estimada_hrs ? parseFloat(form.duracion_estimada_hrs) : null,
            requiere_equipo: form.requiere_equipo
                .split(',')
                .map(s => s.trim())
                .filter(Boolean),
            activo: true,
        };

        setSaving(true);
        try {
            if (modal === 'create') {
                const { error } = await supabase.from('catalogo_servicios').insert(payload);
                if (error) throw error;
            } else if (modal && typeof modal === 'object') {
                const { error } = await supabase
                    .from('catalogo_servicios')
                    .update(payload)
                    .eq('id', modal.id);
                if (error) throw error;
            }
            closeModal();
            await fetchServicios();
        } catch (err: any) {
            console.error('Error guardando servicio:', err);
            alert(`Error al guardar: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirmDeleteId !== id) {
            setConfirmDeleteId(id);
            setTimeout(() => setConfirmDeleteId(prev => prev === id ? null : prev), 4000);
            return;
        }
        setDeleting(id);
        try {
            // Soft delete — marca activo = false
            const { error } = await supabase
                .from('catalogo_servicios')
                .update({ activo: false })
                .eq('id', id);
            if (error) throw error;
            setConfirmDeleteId(null);
            await fetchServicios();
        } catch (err: any) {
            console.error('Error eliminando servicio:', err);
            alert(`Error al eliminar: ${err.message}`);
        } finally {
            setDeleting(null);
        }
    };

    // ── Render ────────────────────────────────────────

    const isEditing = modal !== null && modal !== 'create';

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-retarder-black">Catálogo de Servicios</h2>
                    <p className="text-xs text-retarder-gray-500">
                        {servicios.length} servicio{servicios.length !== 1 ? 's' : ''} en {Object.keys(TIPO_CONFIG).length} categorías
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-retarder-gray-100 rounded-lg px-3 py-2">
                        <Search size={14} className="text-retarder-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar servicio..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm w-40"
                        />
                    </div>
                    {isAdmin && (
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 px-4 py-2 bg-retarder-red text-white rounded-lg text-sm font-medium hover:bg-retarder-red-700 transition-colors shadow-md shadow-retarder-red/20"
                        >
                            <Plus size={16} /><span className="hidden sm:inline">Nuevo Servicio</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Type filters */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                    onClick={() => setFilterTipo('all')}
                    className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border',
                        filterTipo === 'all'
                            ? 'bg-retarder-black text-white border-retarder-black'
                            : 'bg-white text-retarder-gray-600 border-retarder-gray-200 hover:bg-retarder-gray-50'
                    )}
                >
                    Todos ({servicios.length})
                </button>
                {(Object.keys(TIPO_CONFIG) as ServTipo[]).map(tipo => {
                    const cfg = TIPO_CONFIG[tipo];
                    const count = servicios.filter(s => s.tipo === tipo).length;
                    return (
                        <button
                            key={tipo}
                            onClick={() => setFilterTipo(filterTipo === tipo ? 'all' : tipo)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border',
                                filterTipo === tipo
                                    ? 'bg-retarder-black text-white border-retarder-black'
                                    : 'bg-white text-retarder-gray-600 border-retarder-gray-200 hover:bg-retarder-gray-50'
                            )}
                        >
                            {cfg.icon} {cfg.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Cards grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 size={28} className="animate-spin text-retarder-red mb-3" />
                    <p className="text-sm text-retarder-gray-400">Cargando servicios...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-retarder-gray-200">
                    <ClipboardCheck size={36} className="text-retarder-gray-300 mb-3" />
                    <p className="text-sm font-semibold text-retarder-gray-400">
                        {servicios.length === 0 ? 'Sin servicios registrados' : 'Sin resultados'}
                    </p>
                    <p className="text-xs text-retarder-gray-300 mt-1">
                        {servicios.length === 0
                            ? 'Haz clic en "Nuevo Servicio" para agregar el primero.'
                            : 'Intenta con otro término de búsqueda.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((s, i) => {
                        const cfg = TIPO_CONFIG[s.tipo];
                        return (
                            <motion.div
                                key={s.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="bg-white rounded-xl border border-retarder-gray-200 p-4 hover:shadow-lg transition-all"
                            >
                                {/* Card header */}
                                <div className="flex items-center justify-between mb-3">
                                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase', cfg.color)}>
                                        {cfg.icon} {cfg.label}
                                    </span>
                                    {isAdmin && (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => openEdit(s)}
                                                className="p-1.5 rounded-lg text-retarder-gray-400 hover:text-retarder-red hover:bg-retarder-red/5 transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil size={13} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(s.id)}
                                                disabled={deleting === s.id}
                                                className={cn(
                                                    'p-1.5 rounded-lg transition-colors text-xs font-bold',
                                                    confirmDeleteId === s.id
                                                        ? 'bg-red-500 text-white animate-pulse px-2'
                                                        : 'text-retarder-gray-400 hover:text-red-500 hover:bg-red-50'
                                                )}
                                                title="Eliminar"
                                            >
                                                {deleting === s.id
                                                    ? <Loader2 size={13} className="animate-spin" />
                                                    : confirmDeleteId === s.id
                                                    ? '¿Confirmar?'
                                                    : <Trash2 size={13} />}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Name + description */}
                                <h3 className="text-sm font-bold text-retarder-gray-800 mb-1">{s.nombre}</h3>
                                <p className="text-[11px] text-retarder-gray-500 leading-relaxed mb-3">
                                    {s.descripcion || '—'}
                                </p>

                                {/* Precio + Duración */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="bg-retarder-gray-50 rounded-lg p-2 flex items-center gap-2">
                                        <DollarSign size={12} className="text-retarder-gray-400" />
                                        <div>
                                            <p className="text-[9px] text-retarder-gray-400 font-semibold">PRECIO BASE</p>
                                            <p className="text-xs font-bold text-retarder-gray-800">{formatMXN(s.precio_base_mxn)}</p>
                                        </div>
                                    </div>
                                    <div className="bg-retarder-gray-50 rounded-lg p-2 flex items-center gap-2">
                                        <Clock size={12} className="text-retarder-gray-400" />
                                        <div>
                                            <p className="text-[9px] text-retarder-gray-400 font-semibold">DURACIÓN</p>
                                            <p className="text-xs font-bold text-retarder-gray-800">
                                                {s.duracion_estimada_hrs ? `${s.duracion_estimada_hrs} hrs` : '—'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Equipo requerido */}
                                {(s.requiere_equipo ?? []).length > 0 && (
                                    <div>
                                        <p className="text-[9px] font-semibold uppercase text-retarder-gray-400 mb-1">Equipo Requerido</p>
                                        <div className="flex flex-wrap gap-1">
                                            {(s.requiere_equipo ?? []).map(eq => (
                                                <span key={eq} className="text-[9px] px-1.5 py-0.5 bg-retarder-gray-100 rounded text-retarder-gray-600">
                                                    {eq}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Modal — Crear / Editar */}
            <AnimatePresence>
                {modal !== null && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={closeModal}
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-retarder-gray-200 bg-gradient-to-r from-retarder-red to-retarder-red-700">
                                <h3 className="text-lg font-bold text-white">
                                    {isEditing ? 'Editar Servicio' : 'Nuevo Servicio'}
                                </h3>
                                <button onClick={closeModal} className="p-2 rounded-lg hover:bg-white/10 text-white">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
                                {/* Tipo */}
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">
                                        Tipo de Servicio
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(Object.keys(TIPO_CONFIG) as ServTipo[]).map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setForm(f => ({ ...f, tipo: t }))}
                                                className={cn(
                                                    'flex items-center gap-2 border rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left',
                                                    form.tipo === t
                                                        ? 'border-retarder-red bg-retarder-red/5 text-retarder-red'
                                                        : 'border-retarder-gray-200 hover:bg-retarder-gray-50 text-retarder-gray-700'
                                                )}
                                            >
                                                <span>{TIPO_CONFIG[t].icon}</span>
                                                {TIPO_CONFIG[t].label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Nombre */}
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">
                                        Nombre del Servicio *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nombre descriptivo"
                                        value={form.nombre}
                                        onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                                        className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none"
                                    />
                                </div>

                                {/* Descripción */}
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">
                                        Descripción
                                    </label>
                                    <textarea
                                        placeholder="Describe el servicio..."
                                        rows={2}
                                        value={form.descripcion}
                                        onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                                        className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none resize-none"
                                    />
                                </div>

                                {/* Precio + Duración */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">
                                            Precio Base (MXN) *
                                        </label>
                                        <div className="flex items-center gap-2 border border-retarder-gray-200 rounded-lg px-3 py-2.5 focus-within:border-retarder-red focus-within:ring-2 focus-within:ring-retarder-red/10">
                                            <DollarSign size={14} className="text-retarder-gray-400 shrink-0" />
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                min="0"
                                                value={form.precio_base_mxn}
                                                onChange={e => setForm(f => ({ ...f, precio_base_mxn: e.target.value }))}
                                                className="flex-1 outline-none text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">
                                            Duración (hrs)
                                        </label>
                                        <div className="flex items-center gap-2 border border-retarder-gray-200 rounded-lg px-3 py-2.5 focus-within:border-retarder-red focus-within:ring-2 focus-within:ring-retarder-red/10">
                                            <Clock size={14} className="text-retarder-gray-400 shrink-0" />
                                            <input
                                                type="number"
                                                placeholder="4"
                                                min="0"
                                                step="0.5"
                                                value={form.duracion_estimada_hrs}
                                                onChange={e => setForm(f => ({ ...f, duracion_estimada_hrs: e.target.value }))}
                                                className="flex-1 outline-none text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Equipo requerido */}
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">
                                        Equipo Requerido
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Herramienta básica, Multímetro, ..."
                                        value={form.requiere_equipo}
                                        onChange={e => setForm(f => ({ ...f, requiere_equipo: e.target.value }))}
                                        className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none"
                                    />
                                    <p className="text-[10px] text-retarder-gray-400 mt-1">Separa cada elemento con una coma</p>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-retarder-gray-200 bg-retarder-gray-50 flex gap-2">
                                <button
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2.5 border border-retarder-gray-200 rounded-xl text-sm font-medium text-retarder-gray-600 hover:bg-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-retarder-red text-white rounded-xl text-sm font-semibold hover:bg-retarder-red-700 transition-colors shadow-md shadow-retarder-red/20 disabled:opacity-60"
                                >
                                    {saving
                                        ? <><Loader2 size={14} className="animate-spin" />Guardando...</>
                                        : isEditing ? 'Guardar Cambios' : 'Crear Servicio'
                                    }
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
