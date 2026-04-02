'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Package, AlertTriangle, ArrowDown, ArrowUp, RefreshCw, TrendingDown, X, Loader2 } from 'lucide-react';
import { cn, formatMXN } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast, confirmModal, promptModal } from '@/lib/modals';

const supabase = createClient();

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type ProductoTipo = 'freno' | 'refaccion' | 'insumo';
type MovimientoTipo = 'entrada' | 'salida' | 'ajuste';
type MovimientoMotivo = 'compra' | 'venta' | 'servicio' | 'devolucion' | 'ajuste_manual';

interface InventarioItem {
    id: string;
    nombre: string;
    codigo_interno: string | null;
    producto_tipo: ProductoTipo;
    stock_actual: number;
    stock_minimo: number;
    ubicacion: string | null;
    costo_unitario: number;
    precio_venta: number;
    activo: boolean;
}

interface FormState {
    tipo: MovimientoTipo;
    inventario_id: string;
    cantidad: string;
    motivo: MovimientoMotivo;
    notas: string;
}

// â”€â”€ Stock status helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function getStockStatus(item: InventarioItem): { label: string; color: string; icon: typeof AlertTriangle } {
    if (item.stock_actual === 0)
        return { label: 'Agotado', color: 'bg-red-100 text-red-700', icon: AlertTriangle };
    if (item.stock_actual <= item.stock_minimo)
        return { label: 'Bajo mÃ­nimo', color: 'bg-amber-100 text-amber-700', icon: TrendingDown };
    return { label: 'Normal', color: 'bg-emerald-100 text-emerald-700', icon: Package };
}

const TIPO_LABELS: Record<ProductoTipo, string> = {
    freno: 'Freno',
    refaccion: 'RefacciÃ³n',
    insumo: 'Insumo',
};

// â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function InventarioPage() {
    const [inventario, setInventario] = useState<InventarioItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<FormState>({
        tipo: 'entrada',
        inventario_id: '',
        cantidad: '',
        motivo: 'compra',
        notas: '',
    });

    // â”€â”€ Fetch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const fetchInventario = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('inventario')
                .select('*')
                .eq('activo', true)
                .order('nombre');

            if (error) throw error;
            setInventario(data || []);
        } catch (err) {
            setInventario([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInventario();
    }, [fetchInventario]);

    // â”€â”€ Derived â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const filtered = useMemo(() => {
        let result = inventario;
        if (showOnlyAlerts) result = result.filter(i => i.stock_actual <= i.stock_minimo);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(i =>
                i.nombre.toLowerCase().includes(q) ||
                (i.codigo_interno?.toLowerCase() || '').includes(q)
            );
        }
        return result;
    }, [inventario, searchQuery, showOnlyAlerts]);

    const alertCount = inventario.filter(i => i.stock_actual <= i.stock_minimo).length;
    const totalValue = inventario.reduce((s, i) => s + i.stock_actual * i.costo_unitario, 0);

    // â”€â”€ Registrar Movimiento â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const handleRegistrarMovimiento = async () => {
        if (!form.inventario_id || !form.cantidad) {
            toast.error('Por favor selecciona un producto e ingresa la cantidad.');
            return;
        }
        const cantidad = parseInt(form.cantidad, 10);
        if (isNaN(cantidad) || cantidad <= 0) {
            toast.info('La cantidad debe ser un nÃºmero mayor a 0.');
            return;
        }

        const item = inventario.find(i => i.id === form.inventario_id);
        if (!item) return;

        // Calcular nuevo stock
        let nuevoStock: number;
        if (form.tipo === 'entrada') {
            nuevoStock = item.stock_actual + cantidad;
        } else if (form.tipo === 'salida') {
            nuevoStock = item.stock_actual - cantidad;
            if (nuevoStock < 0) {
                toast.error(`Stock insuficiente. Stock actual: ${item.stock_actual}`);
                return;
            }
        } else {
            // ajuste: reemplaza directamente
            nuevoStock = cantidad;
        }

        setSaving(true);
        try {
            // 1. Insertar movimiento
            const { error: movError } = await supabase
                .from('movimientos_inventario')
                .insert({
                    inventario_id: form.inventario_id,
                    tipo: form.tipo,
                    cantidad,
                    motivo: form.motivo,
                    notas: form.notas || null,
                });

            if (movError) throw movError;

            // 2. Actualizar stock_actual
            const { error: stockError } = await supabase
                .from('inventario')
                .update({ stock_actual: nuevoStock })
                .eq('id', form.inventario_id);

            if (stockError) throw stockError;

            // 3. Resetear y recargar
            setForm({ tipo: 'entrada', inventario_id: '', cantidad: '', motivo: 'compra', notas: '' });
            setShowForm(false);
            await fetchInventario();
            toast.success('Movimiento registrado correctamente.');
        } catch (err: any) {
            toast.error(`Error al registrar el movimiento: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-retarder-black">Inventario</h2>
                    <p className="text-xs text-retarder-gray-500">
                        Valor total: {formatMXN(totalValue)} Â· {alertCount} alerta{alertCount !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-retarder-gray-100 rounded-lg px-3 py-2">
                        <Search size={14} className="text-retarder-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm w-40"
                        />
                    </div>
                    {alertCount > 0 && (
                        <button
                            onClick={() => setShowOnlyAlerts(!showOnlyAlerts)}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border',
                                showOnlyAlerts
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-white text-retarder-gray-600 border-retarder-gray-200 hover:bg-retarder-gray-50'
                            )}
                        >
                            <AlertTriangle size={14} />
                            Alertas ({alertCount})
                        </button>
                    )}
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#FACC15] text-black rounded-lg text-sm font-medium hover:bg-[#EAB308] transition-colors shadow-md shadow-yellow-500/20"
                    >
                        <Plus size={16} /><span className="hidden sm:inline">Nuevo Movimiento</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total Productos', value: inventario.length.toString(), color: 'text-blue-600', icon: Package },
                    { label: 'Bajo MÃ­nimo', value: alertCount.toString(), color: 'text-red-600', icon: AlertTriangle },
                    { label: 'Agotados', value: inventario.filter(i => i.stock_actual === 0).length.toString(), color: 'text-red-700', icon: TrendingDown },
                    { label: 'Valor Total', value: formatMXN(totalValue), color: 'text-emerald-600', icon: Package },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-xl border border-retarder-gray-200 p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <s.icon size={14} className="text-retarder-gray-400" />
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400">{s.label}</p>
                        </div>
                        <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Table */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl border border-retarder-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-retarder-gray-50">
                            <tr className="border-b border-retarder-gray-200">
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Producto</th>
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden md:table-cell">CÃ³digo</th>
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden lg:table-cell">UbicaciÃ³n</th>
                                <th className="text-center py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Stock</th>
                                <th className="text-center py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden sm:table-cell">MÃ­n.</th>
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Estado</th>
                                <th className="text-right py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden lg:table-cell">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center">
                                        <Loader2 size={24} className="mx-auto text-retarder-red animate-spin mb-2" />
                                        <p className="text-xs text-retarder-gray-400">Cargando inventario...</p>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center">
                                        <Package size={32} className="mx-auto text-retarder-gray-300 mb-2" />
                                        <p className="text-sm font-semibold text-retarder-gray-400">
                                            {inventario.length === 0 ? 'Sin productos registrados' : 'Sin resultados'}
                                        </p>
                                        <p className="text-xs text-retarder-gray-300 mt-1">
                                            {inventario.length === 0
                                                ? 'Agrega productos desde Supabase para verlos aquÃ­.'
                                                : 'Intenta con otro tÃ©rmino de bÃºsqueda.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((item, i) => {
                                    const status = getStockStatus(item);
                                    const isBajo = item.stock_actual <= item.stock_minimo;
                                    return (
                                        <motion.tr
                                            key={item.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.02 }}
                                            className={cn(
                                                'border-b border-retarder-gray-50 hover:bg-retarder-gray-50 transition-colors',
                                                isBajo && 'bg-red-50/30'
                                            )}
                                        >
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-retarder-gray-100 flex items-center justify-center">
                                                        <Package size={14} className="text-retarder-gray-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-retarder-gray-800">{item.nombre}</p>
                                                        <p className="text-[10px] text-retarder-gray-500">{TIPO_LABELS[item.producto_tipo]}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 font-mono text-xs text-retarder-gray-600 hidden md:table-cell">
                                                {item.codigo_interno || 'â€”'}
                                            </td>
                                            <td className="py-3 px-4 text-xs text-retarder-gray-600 hidden lg:table-cell">
                                                {item.ubicacion || 'â€”'}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={cn(
                                                    'text-base font-bold',
                                                    item.stock_actual === 0
                                                        ? 'text-red-600'
                                                        : isBajo
                                                        ? 'text-amber-600'
                                                        : 'text-retarder-gray-800'
                                                )}>
                                                    {item.stock_actual}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center text-xs text-retarder-gray-500 hidden sm:table-cell">
                                                {item.stock_minimo}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', status.color)}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right font-semibold text-retarder-gray-800 hidden lg:table-cell">
                                                {formatMXN(item.stock_actual * item.costo_unitario)}
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Modal â€” Registrar Movimiento */}
            <AnimatePresence>
                {showForm && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowForm(false)}
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
                                <h3 className="text-lg font-bold text-white">Registrar Movimiento</h3>
                                <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-white/10 text-white">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
                                {/* Tipo de movimiento */}
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">
                                        Tipo de Movimiento
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {([
                                            { value: 'entrada' as MovimientoTipo, label: 'Entrada', icon: <ArrowDown size={14} />, color: 'text-emerald-600' },
                                            { value: 'salida' as MovimientoTipo, label: 'Salida', icon: <ArrowUp size={14} />, color: 'text-red-600' },
                                            { value: 'ajuste' as MovimientoTipo, label: 'Ajuste', icon: <RefreshCw size={14} />, color: 'text-blue-600' },
                                        ]).map(t => (
                                            <button
                                                key={t.value}
                                                onClick={() => setForm(f => ({ ...f, tipo: t.value }))}
                                                className={cn(
                                                    'flex items-center gap-2 border rounded-lg px-3 py-2.5 transition-colors text-sm font-medium',
                                                    form.tipo === t.value
                                                        ? 'border-retarder-red bg-retarder-red/5 text-retarder-red'
                                                        : 'border-retarder-gray-200 hover:bg-retarder-gray-50'
                                                )}
                                            >
                                                <span className={form.tipo === t.value ? 'text-retarder-red' : t.color}>{t.icon}</span>
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                    {form.tipo === 'ajuste' && (
                                        <p className="text-[10px] text-blue-600 mt-1">
                                            â„¹ï¸ El ajuste reemplaza el stock actual con la cantidad ingresada.
                                        </p>
                                    )}
                                </div>

                                {/* Producto */}
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">
                                        Producto
                                    </label>
                                    <select
                                        value={form.inventario_id}
                                        onChange={e => setForm(f => ({ ...f, inventario_id: e.target.value }))}
                                        className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none"
                                    >
                                        <option value="">-- Seleccionar producto --</option>
                                        {inventario.map(item => (
                                            <option key={item.id} value={item.id}>
                                                {item.nombre} (Stock: {item.stock_actual})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Cantidad + Motivo */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">
                                            Cantidad
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="1"
                                            min="1"
                                            value={form.cantidad}
                                            onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))}
                                            className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">
                                            Motivo
                                        </label>
                                        <select
                                            value={form.motivo}
                                            onChange={e => setForm(f => ({ ...f, motivo: e.target.value as MovimientoMotivo }))}
                                            className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none"
                                        >
                                            <option value="compra">Compra</option>
                                            <option value="venta">Venta</option>
                                            <option value="servicio">Servicio</option>
                                            <option value="devolucion">DevoluciÃ³n</option>
                                            <option value="ajuste_manual">Ajuste Manual</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Notas */}
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">
                                        Notas (opcional)
                                    </label>
                                    <textarea
                                        placeholder="Notas adicionales..."
                                        rows={2}
                                        value={form.notas}
                                        onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                                        className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none resize-none"
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-retarder-gray-200 bg-retarder-gray-50 flex gap-2">
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-2.5 border border-retarder-gray-200 rounded-xl text-sm font-medium text-retarder-gray-600 hover:bg-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleRegistrarMovimiento}
                                    disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-retarder-red text-white rounded-xl text-sm font-semibold hover:bg-retarder-red-700 transition-colors shadow-md shadow-retarder-red/20 disabled:opacity-60"
                                >
                                    {saving ? (
                                        <><Loader2 size={14} className="animate-spin" />Guardando...</>
                                    ) : (
                                        'Registrar Movimiento'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
