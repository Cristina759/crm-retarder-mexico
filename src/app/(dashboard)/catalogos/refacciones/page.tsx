'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Wrench, Package, Filter, X, Loader2, Edit2, Trash2, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn, formatMXN } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useRole } from '@/hooks/useRole';

interface Refaccion {
    id?: string;
    codigo: string;
    nombre: string;
    categoria: string;
    modelo_freno: string;
    precio_compra: number;
    precio_venta: number;
    activo?: boolean;
}

const CAT_COLORS: Record<string, string> = {
    'CARDANES': 'bg-blue-100 text-blue-700',
    'CRUCETA': 'bg-purple-100 text-purple-700',
    'ELECTRICO': 'bg-amber-100 text-amber-700',
    'DESGLOSE DE FRENO': 'bg-slate-100 text-slate-700',
    'ENGRASE': 'bg-lime-100 text-lime-700',
    'FRENO COMPLETO': 'bg-retarder-red/10 text-retarder-red',
    'MATERIAL ADICIONAL': 'bg-gray-100 text-gray-700',
    'NEHUMATICO': 'bg-cyan-100 text-cyan-700',
    'SOPORTERIA': 'bg-emerald-100 text-emerald-700',
    'GRASERA': 'bg-green-100 text-green-700',
    'TORNILLO': 'bg-indigo-100 text-indigo-700',
};

const REAL_CATEGORIAS = [
    'CARDANES',
    'DESGLOSE DE FRENO',
    'ELECTRICO',
    'ENGRASE',
    'FRENO COMPLETO',
    'GRASERA',
    'MATERIAL ADICIONAL',
    'NEHUMATICO',
    'SOPORTERIA',
    'TORNILLO'
];

export default function RefaccionesPage() {
    const { isAdmin, isVendedor } = useRole();
    const supabase = createClient();

    const [refacciones, setRefacciones] = useState<Refaccion[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCat, setFilterCat] = useState<string>('all');
    const [showForm, setShowForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Refaccion | null>(null);

    // Form state
    const [formData, setFormData] = useState<Refaccion>({
        codigo: '',
        nombre: '',
        categoria: 'CARDANES',
        modelo_freno: '',
        precio_compra: 0,
        precio_venta: 0
    });

    const fetchRefacciones = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('catalogo_refacciones')
                .select('*')
                .order('nombre');

            if (error) throw error;
            if (data) setRefacciones(data);
        } catch (err) {
            console.error('Error fetching refacciones:', err);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchRefacciones();
    }, [fetchRefacciones]);

    const filtered = useMemo(() => {
        let result = refacciones;
        if (filterCat !== 'all') result = result.filter(r => r.categoria === filterCat);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(r =>
                (r.nombre || '').toLowerCase().includes(q) ||
                (r.codigo || '').toLowerCase().includes(q) ||
                (r.modelo_freno || '').toLowerCase().includes(q)
            );
        }
        return result;
    }, [refacciones, searchQuery, filterCat]);

    const handleOpenEdit = (item: Refaccion) => {
        setSelectedItem(item);
        setFormData({ ...item });
        setIsEditMode(true);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setIsEditMode(false);
        setSelectedItem(null);
        setFormData({
            codigo: '',
            nombre: '',
            categoria: 'CARDANES',
            modelo_freno: '',
            precio_compra: 0,
            precio_venta: 0
        });
    };

    const handleSave = async () => {
        if (!formData.nombre || !formData.codigo) {
            alert('Nombre y Código son obligatorios');
            return;
        }

        setIsSaving(true);
        try {
            if (isEditMode && selectedItem?.id) {
                const { error } = await supabase
                    .from('catalogo_refacciones')
                    .update({
                        codigo: formData.codigo,
                        nombre: formData.nombre,
                        categoria: formData.categoria,
                        modelo_freno: formData.modelo_freno,
                        precio_compra: formData.precio_compra,
                        precio_venta: formData.precio_venta
                    })
                    .eq('id', selectedItem.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('catalogo_refacciones')
                    .insert([formData]);
                if (error) throw error;
            }

            await fetchRefacciones();
            handleCloseForm();
        } catch (err: any) {
            console.error('Error saving refaccion:', err);
            alert(`Error al guardar: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este artículo?')) return;
        try {
            const { error } = await supabase
                .from('catalogo_refacciones')
                .delete()
                .eq('id', id);
            if (error) throw error;
            fetchRefacciones();
        } catch (err: any) {
            alert(`Error al eliminar: ${err.message}`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-retarder-black tracking-tight uppercase italic">
                        Catálogo de <span className="text-retarder-red">Herramientas</span>
                    </h1>
                    <p className="text-sm text-retarder-gray-500 mt-1">
                        Gestión de precios y existencias técnico-comerciales ({refacciones.length} piezas en sistema)
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchRefacciones}
                        className="p-2.5 bg-white border border-retarder-gray-200 rounded-xl text-retarder-gray-400 hover:text-retarder-red transition-all shadow-sm"
                        title="Sincronizar con base de datos"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                    {isAdmin && (
                        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-2.5 bg-retarder-red text-white rounded-xl text-sm font-bold hover:bg-retarder-red-700 transition-all shadow-lg shadow-retarder-red/25 active:scale-95">
                            <Plus size={18} /><span>Nueva Herramienta</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Stats & Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-retarder-gray-400 group-focus-within:text-retarder-red transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, código o modelo de freno..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-retarder-gray-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:ring-4 focus:ring-retarder-red/5 focus:border-retarder-red/20 outline-none transition-all"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar md:max-w-md">
                    <button
                        onClick={() => setFilterCat('all')}
                        className={cn(
                            'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border-2',
                            filterCat === 'all'
                                ? 'bg-retarder-black text-white border-retarder-black shadow-lg'
                                : 'bg-white text-retarder-gray-400 border-retarder-gray-100 hover:border-retarder-gray-200'
                        )}
                    >
                        Todas
                    </button>
                    {REAL_CATEGORIAS.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCat(filterCat === cat ? 'all' : cat)}
                            className={cn(
                                'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border-2',
                                filterCat === cat
                                    ? 'bg-retarder-black text-white border-retarder-black shadow-lg'
                                    : 'bg-white text-retarder-gray-400 border-retarder-gray-100 hover:border-retarder-gray-200'
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-3xl border border-retarder-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-retarder-gray-50/50 border-b border-retarder-gray-100">
                                <th className="text-left py-5 px-6 text-[10px] font-black text-retarder-gray-400 uppercase tracking-widest">Herramienta / Refacción</th>
                                <th className="text-left py-5 px-6 text-[10px] font-black text-retarder-gray-400 uppercase tracking-widest hidden md:table-cell">Código</th>
                                <th className="text-left py-5 px-6 text-[10px] font-black text-retarder-gray-400 uppercase tracking-widest">Categoría</th>
                                <th className="text-right py-5 px-6 text-[10px] font-black text-retarder-gray-400 uppercase tracking-widest">P. Venta (MXN)</th>
                                {isAdmin && <th className="text-center py-5 px-6 text-[10px] font-black text-retarder-gray-400 uppercase tracking-widest">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <Loader2 size={40} className="text-retarder-red animate-spin mx-auto mb-4" />
                                        <p className="text-retarder-gray-400 font-bold uppercase tracking-widest text-xs">Cargando catálogo...</p>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <Package size={48} className="text-retarder-gray-200 mx-auto mb-4" />
                                        <p className="text-retarder-gray-400 font-bold uppercase tracking-widest text-xs">No se encontraron artículos</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((r, i) => (
                                    <tr key={r.id || r.codigo} className="border-b border-retarder-gray-50 hover:bg-retarder-gray-50/50 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-retarder-gray-100 flex items-center justify-center group-hover:bg-retarder-red group-hover:text-white transition-all duration-300">
                                                    <Wrench size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-retarder-black group-hover:text-retarder-red transition-colors">{r.nombre}</p>
                                                    <p className="text-[10px] text-retarder-gray-400 font-medium uppercase tracking-tighter mt-0.5 line-clamp-1">
                                                        {r.modelo_freno || 'Compatibilidad universal'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-[11px] font-bold text-retarder-gray-500 hidden md:table-cell">
                                            {r.codigo}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={cn('text-[9px] font-black px-2.5 py-1 rounded-lg tracking-widest uppercase', CAT_COLORS[r.categoria] || 'bg-gray-100')}>
                                                {r.categoria}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <p className="font-black text-lg text-retarder-black tracking-tighter">
                                                {formatMXN(r.precio_venta)}
                                            </p>
                                            <p className="text-[9px] text-retarder-gray-400 font-bold uppercase tracking-widest">Precio Lista</p>
                                        </td>
                                        {isAdmin && (
                                            <td className="py-4 px-6">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleOpenEdit(r)}
                                                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                                                        title="Editar Precio/Datos"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => r.id && handleDelete(r.id)}
                                                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form */}
            <AnimatePresence>
                {showForm && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleCloseForm} className="fixed inset-0 bg-retarder-black/60 backdrop-blur-md z-40" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] z-50 overflow-hidden"
                        >
                            <div className="relative px-8 py-8 border-b border-retarder-gray-100 bg-gradient-to-r from-retarder-red to-retarder-red-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-black text-white tracking-tight italic uppercase">
                                            {isEditMode ? 'EDITAR' : 'NUEVA'} <span className="text-white/70">HERRAMIENTA</span>
                                        </h3>
                                        <p className="text-white/60 text-xs font-medium mt-1">Actualiza precios y especificaciones técnicas.</p>
                                    </div>
                                    <button onClick={handleCloseForm} className="p-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all"><X size={20} /></button>
                                </div>
                            </div>

                            <div className="px-10 py-8 space-y-6 max-h-[65vh] overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-retarder-gray-400 px-1">Nombre Descriptivo</label>
                                        <input
                                            type="text"
                                            value={formData.nombre}
                                            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                            className="w-full bg-retarder-gray-50 border-2 border-transparent focus:border-retarder-red/20 focus:bg-white rounded-2xl px-4 py-4 text-sm font-bold text-retarder-black transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-retarder-gray-400 px-1">Código / No. Parte</label>
                                        <input
                                            type="text"
                                            value={formData.codigo}
                                            onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                                            className="w-full bg-retarder-gray-50 border-2 border-transparent focus:border-retarder-red/20 focus:bg-white rounded-2xl px-4 py-4 text-sm font-mono font-bold text-retarder-black uppercase transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-retarder-gray-400 px-1">Categoría</label>
                                        <select
                                            value={formData.categoria}
                                            onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                                            className="w-full bg-retarder-gray-50 border-2 border-transparent focus:border-retarder-red/20 focus:bg-white rounded-2xl px-4 py-4 text-sm font-bold text-retarder-black transition-all outline-none appearance-none"
                                        >
                                            {REAL_CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-retarder-gray-400 px-1">Modelo de Freno / Compatibilidad</label>
                                        <input
                                            type="text"
                                            value={formData.modelo_freno}
                                            onChange={e => setFormData({ ...formData, modelo_freno: e.target.value })}
                                            placeholder="Ej: F16-80, Kenworth, Universal..."
                                            className="w-full bg-retarder-gray-50 border-2 border-transparent focus:border-retarder-red/20 focus:bg-white rounded-2xl px-4 py-4 text-sm font-bold text-retarder-black transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-retarder-gray-400 px-1">Precio Compra (USD/MXN)</label>
                                        <input
                                            type="number"
                                            value={formData.precio_compra}
                                            onChange={e => setFormData({ ...formData, precio_compra: Number(e.target.value) })}
                                            className="w-full bg-retarder-gray-50 border-2 border-transparent focus:border-retarder-red/20 focus:bg-white rounded-2xl px-4 py-4 text-sm font-bold text-retarder-black transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-retarder-red px-1">Precio Venta Público (MXN)</label>
                                        <input
                                            type="number"
                                            value={formData.precio_venta}
                                            onChange={e => setFormData({ ...formData, precio_venta: Number(e.target.value) })}
                                            className="w-full bg-retarder-red/5 border-2 border-retarder-red/10 focus:border-retarder-red/40 focus:bg-white rounded-2xl px-4 py-4 text-sm font-black text-retarder-red transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="px-10 py-8 bg-retarder-gray-50 border-t border-retarder-gray-100 flex gap-4">
                                <button onClick={handleCloseForm} className="px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-retarder-gray-400 hover:text-retarder-red hover:bg-retarder-red/5 transition-all">Cancelar</button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-retarder-red text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-retarder-red-700 shadow-xl shadow-retarder-red/25 transition-all disabled:opacity-50 active:scale-95"
                                >
                                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                    <span>{isSaving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
