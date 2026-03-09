'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    FileText,
    DollarSign,
    CheckCircle2,
    Clock,
    AlertCircle,
    X,
    Building2,
    Calendar,
    ArrowDownLeft,
    Receipt,
    Minus,
    Eye,
    Trash2,
} from 'lucide-react';
import { cn, formatMXN, formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
// ── Types ──

type NCEstado = 'emitida' | 'aplicada' | 'cancelada';

interface NotaCredito {
    id: string;
    numero_nc: string;
    factura_relacionada: string;
    empresa: string;
    motivo: string;
    subtotal: number;
    iva: number;
    total: number;
    estado: NCEstado;
    fecha_emision: string;
    created_at: string;
}

// ── Constants ──

const NC_ESTADO_CONFIG: Record<NCEstado, { label: string; color: string; icon: typeof Clock }> = {
    emitida: { label: 'Emitida', color: 'bg-blue-100 text-blue-700', icon: FileText },
    aplicada: { label: 'Aplicada', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

const MOTIVO_OPTIONS = [
    'Devolución de producto',
    'Descuento post-venta',
    'Error en facturación',
    'Bonificación comercial',
    'Ajuste de precio',
    'Otro',
] as const;

// ── LocalStorage key ──
const LS_KEY = 'notasCredito';

function loadNotasFromStorage(): NotaCredito[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveNotasToStorage(notas: NotaCredito[]) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(notas));
    } catch { /* ignore */ }
}


export default function NotasCreditoPage() {
    const [notas, setNotas] = useState<NotaCredito[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterEstado, setFilterEstado] = useState<NCEstado | 'all'>('all');
    const [showForm, setShowForm] = useState(false);
    const [selectedNota, setSelectedNota] = useState<NotaCredito | null>(null);

    // Form state
    const [formFactura, setFormFactura] = useState('');
    const [formMotivo, setFormMotivo] = useState(MOTIVO_OPTIONS[0] as string);
    const [formMotivoCustom, setFormMotivoCustom] = useState('');
    const [formSubtotal, setFormSubtotal] = useState('');
    const [formEstado, setFormEstado] = useState<NCEstado>('emitida');

    const [facturasDisponibles, setFacturasDisponibles] = useState<{ factura: string, empresa: string, total: number }[]>([]);

    // Fetch facturas from Supabase
    const fetchFacturas = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('ordenes_servicio')
                .select('numero_factura, empresa, monto')
                .not('numero_factura', 'is', null)
                .order('fecha_creado', { ascending: false });

            if (!error && data) {
                const uniqueFacturas = new Map<string, { factura: string, empresa: string, total: number }>();
                data.forEach(o => {
                    if (o.numero_factura && !uniqueFacturas.has(o.numero_factura)) {
                        uniqueFacturas.set(o.numero_factura, {
                            factura: o.numero_factura,
                            empresa: o.empresa || 'N/A',
                            total: o.monto || 0
                        });
                    }
                });
                setFacturasDisponibles(Array.from(uniqueFacturas.values()));
            }
        } catch (error) {
            console.error('Error fetching facturas:', error);
        }
    }, [supabase]);

    // Load from localStorage on mount and fetch facturas
    useEffect(() => {
        setNotas(loadNotasFromStorage());
        fetchFacturas();
    }, [fetchFacturas]);

    // Get empresa from selected factura
    const selectedFacturaInfo = useMemo(() => {
        return facturasDisponibles.find(f => f.factura === formFactura);
    }, [formFactura, facturasDisponibles]);

    // Generate next NC number
    const nextNCNumber = useMemo(() => {
        const count = notas.length;
        return `NC-${String(count + 1).padStart(4, '0')}`;
    }, [notas]);

    // Create nota de crédito
    const handleCreate = () => {
        if (!formFactura || !formSubtotal) return;

        const subtotal = parseFloat(formSubtotal);
        if (isNaN(subtotal) || subtotal <= 0) return;

        const iva = subtotal * 0.16;
        const total = subtotal + iva;

        const nuevaNota: NotaCredito = {
            id: crypto.randomUUID(),
            numero_nc: nextNCNumber,
            factura_relacionada: formFactura,
            empresa: selectedFacturaInfo?.empresa || 'N/A',
            motivo: formMotivo === 'Otro' ? formMotivoCustom : formMotivo,
            subtotal,
            iva: Math.round(iva * 100) / 100,
            total: Math.round(total * 100) / 100,
            estado: formEstado,
            fecha_emision: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString(),
        };

        const updated = [nuevaNota, ...notas];
        setNotas(updated);
        saveNotasToStorage(updated);

        // Reset form
        setFormFactura('');
        setFormMotivo(MOTIVO_OPTIONS[0]);
        setFormMotivoCustom('');
        setFormSubtotal('');
        setFormEstado('emitida');
        setShowForm(false);
    };

    // Delete nota
    const handleDelete = (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta nota de crédito?')) return;
        const updated = notas.filter(n => n.id !== id);
        setNotas(updated);
        saveNotasToStorage(updated);
        if (selectedNota?.id === id) setSelectedNota(null);
    };

    // Change estado
    const handleChangeEstado = (id: string, estado: NCEstado) => {
        const updated = notas.map(n => n.id === id ? { ...n, estado } : n);
        setNotas(updated);
        saveNotasToStorage(updated);
        if (selectedNota?.id === id) {
            setSelectedNota({ ...selectedNota, estado });
        }
    };

    // Filter
    const filtered = useMemo(() => {
        let result = notas;
        if (filterEstado !== 'all') result = result.filter(n => n.estado === filterEstado);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(n =>
                n.numero_nc.toLowerCase().includes(q) ||
                n.empresa.toLowerCase().includes(q) ||
                n.factura_relacionada.toLowerCase().includes(q) ||
                n.motivo.toLowerCase().includes(q)
            );
        }
        return result;
    }, [notas, searchQuery, filterEstado]);

    // Stats — only count non-cancelled
    const stats = useMemo(() => ({
        totalEmitido: notas.filter(n => n.estado !== 'cancelada').reduce((s, n) => s + n.total, 0),
        totalAplicado: notas.filter(n => n.estado === 'aplicada').reduce((s, n) => s + n.total, 0),
        emitidas: notas.filter(n => n.estado === 'emitida').length,
        aplicadas: notas.filter(n => n.estado === 'aplicada').length,
        canceladas: notas.filter(n => n.estado === 'cancelada').length,
    }), [notas]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                            <ArrowDownLeft size={16} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-retarder-black">Notas de Crédito</h2>
                            <p className="text-xs text-retarder-gray-500">
                                {notas.length} notas registradas · No suman al total facturado
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-retarder-gray-100 rounded-lg px-3 py-2">
                        <Search size={14} className="text-retarder-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar nota..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm w-40"
                        />
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-red-700 transition-all shadow-md shadow-orange-500/20"
                    >
                        <Plus size={16} />
                        <span className="hidden sm:inline">Nueva Nota</span>
                    </button>
                </div>
            </div>

            {/* Info Banner */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl"
            >
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={14} className="text-amber-600" />
                </div>
                <p className="text-xs text-amber-800">
                    <strong>Las notas de crédito no se suman al total facturado de ventas.</strong>{' '}
                    Son documentos fiscales independientes que se emiten para ajustar o cancelar parcial/totalmente una factura.
                </p>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total Emitido', value: formatMXN(stats.totalEmitido), color: 'text-orange-600', icon: ArrowDownLeft, gradient: 'from-orange-50 to-red-50', border: 'border-orange-100' },
                    { label: 'Total Aplicado', value: formatMXN(stats.totalAplicado), color: 'text-emerald-600', icon: CheckCircle2, gradient: 'from-emerald-50 to-teal-50', border: 'border-emerald-100' },
                    { label: 'Pendientes', value: stats.emitidas.toString(), color: 'text-blue-600', icon: Clock, gradient: 'from-blue-50 to-indigo-50', border: 'border-blue-100' },
                    { label: 'Canceladas', value: stats.canceladas.toString(), color: 'text-red-600', icon: AlertCircle, gradient: 'from-red-50 to-pink-50', border: 'border-red-100' },
                ].map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn('bg-gradient-to-br rounded-xl border p-4', s.gradient, s.border)}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <s.icon size={14} className="text-retarder-gray-400" />
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400">{s.label}</p>
                        </div>
                        <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {(['all', ...Object.keys(NC_ESTADO_CONFIG)] as const).map(key => {
                    const isAll = key === 'all';
                    const count = isAll ? notas.length : notas.filter(n => n.estado === key).length;
                    return (
                        <button
                            key={key}
                            onClick={() => setFilterEstado(key as NCEstado | 'all')}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border',
                                filterEstado === key
                                    ? 'bg-retarder-black text-white border-retarder-black'
                                    : 'bg-white text-retarder-gray-600 border-retarder-gray-200 hover:bg-retarder-gray-50'
                            )}
                        >
                            {isAll ? 'Todas' : NC_ESTADO_CONFIG[key as NCEstado].label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl border border-retarder-gray-200 overflow-hidden shadow-sm"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-retarder-gray-50">
                            <tr className="border-b border-retarder-gray-200">
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Nota</th>
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden md:table-cell">Factura Rel.</th>
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Empresa</th>
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden lg:table-cell">Motivo</th>
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Estado</th>
                                <th className="text-right py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Total</th>
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden sm:table-cell">Fecha</th>
                                <th className="text-right py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                                                <ArrowDownLeft size={28} className="text-orange-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-retarder-gray-600">No hay notas de crédito</p>
                                                <p className="text-xs text-retarder-gray-400 mt-0.5">Crea tu primera nota de crédito para comenzar</p>
                                            </div>
                                            <button
                                                onClick={() => setShowForm(true)}
                                                className="mt-2 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-red-700 transition-all shadow-md"
                                            >
                                                <Plus size={14} />
                                                Crear Nota de Crédito
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((n, i) => {
                                    const cfg = NC_ESTADO_CONFIG[n.estado];
                                    return (
                                        <motion.tr
                                            key={n.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.02 }}
                                            className={cn(
                                                'border-b border-retarder-gray-50 hover:bg-retarder-gray-50 cursor-pointer transition-colors',
                                                n.estado === 'cancelada' && 'opacity-50'
                                            )}
                                            onClick={() => setSelectedNota(n)}
                                        >
                                            <td className="py-3 px-4 font-mono text-xs font-bold text-orange-600">{n.numero_nc}</td>
                                            <td className="py-3 px-4 font-mono text-xs text-retarder-gray-600 hidden md:table-cell">{n.factura_relacionada}</td>
                                            <td className="py-3 px-4 font-medium text-retarder-gray-800">{n.empresa}</td>
                                            <td className="py-3 px-4 text-retarder-gray-500 text-xs truncate max-w-[200px] hidden lg:table-cell">{n.motivo}</td>
                                            <td className="py-3 px-4">
                                                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', cfg.color)}>
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-retarder-gray-800">
                                                <span className="text-orange-600">-</span>{formatMXN(n.total)}
                                            </td>
                                            <td className="py-3 px-4 text-xs text-retarder-gray-500 hidden sm:table-cell">
                                                {formatDate(n.fecha_emision)}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedNota(n); }}
                                                        className="p-1.5 text-retarder-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Ver detalle"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                                                        className="p-1.5 text-retarder-gray-400 hover:text-retarder-red hover:bg-retarder-red/5 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
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

            {/* Detail Side Panel */}
            <AnimatePresence>
                {selectedNota && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedNota(null)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ opacity: 0, x: 300 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 300 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
                        >
                            {/* Panel Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-retarder-gray-200 bg-gradient-to-r from-orange-500 to-red-600">
                                <div>
                                    <h3 className="text-lg font-bold text-white">{selectedNota.numero_nc}</h3>
                                    <p className="text-xs text-white/70">Nota de Crédito</p>
                                </div>
                                <button onClick={() => setSelectedNota(null)} className="p-2 rounded-lg hover:bg-white/10 text-white">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Estado */}
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-2">Estado</p>
                                    <div className="flex gap-2">
                                        {(Object.keys(NC_ESTADO_CONFIG) as NCEstado[]).map(e => (
                                            <button
                                                key={e}
                                                onClick={() => handleChangeEstado(selectedNota.id, e)}
                                                className={cn(
                                                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                                                    selectedNota.estado === e
                                                        ? cn(NC_ESTADO_CONFIG[e].color, 'border-current ring-2 ring-current/20')
                                                        : 'bg-white border-retarder-gray-200 text-retarder-gray-500 hover:bg-retarder-gray-50'
                                                )}
                                            >
                                                {NC_ESTADO_CONFIG[e].label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Info Cards */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-retarder-gray-50 rounded-xl p-3">
                                        <p className="text-[10px] font-semibold uppercase text-retarder-gray-400">Factura Rel.</p>
                                        <p className="text-sm font-bold text-retarder-black mt-0.5">{selectedNota.factura_relacionada}</p>
                                    </div>
                                    <div className="bg-retarder-gray-50 rounded-xl p-3">
                                        <p className="text-[10px] font-semibold uppercase text-retarder-gray-400">Fecha Emisión</p>
                                        <p className="text-sm font-bold text-retarder-black mt-0.5">{formatDate(selectedNota.fecha_emision)}</p>
                                    </div>
                                </div>

                                <div className="bg-retarder-gray-50 rounded-xl p-3">
                                    <p className="text-[10px] font-semibold uppercase text-retarder-gray-400">Empresa</p>
                                    <p className="text-sm font-bold text-retarder-black mt-0.5">{selectedNota.empresa}</p>
                                </div>

                                <div className="bg-retarder-gray-50 rounded-xl p-3">
                                    <p className="text-[10px] font-semibold uppercase text-retarder-gray-400">Motivo</p>
                                    <p className="text-sm text-retarder-gray-700 mt-0.5">{selectedNota.motivo}</p>
                                </div>

                                {/* Montos */}
                                <div className="border border-retarder-gray-200 rounded-xl overflow-hidden">
                                    <div className="bg-retarder-gray-50 px-4 py-2 border-b border-retarder-gray-200">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400">Desglose</p>
                                    </div>
                                    <div className="divide-y divide-retarder-gray-100">
                                        <div className="flex justify-between px-4 py-2.5">
                                            <span className="text-sm text-retarder-gray-600">Subtotal</span>
                                            <span className="text-sm font-medium text-retarder-gray-800">{formatMXN(selectedNota.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between px-4 py-2.5">
                                            <span className="text-sm text-retarder-gray-600">IVA (16%)</span>
                                            <span className="text-sm font-medium text-retarder-gray-800">{formatMXN(selectedNota.iva)}</span>
                                        </div>
                                        <div className="flex justify-between px-4 py-3 bg-gradient-to-r from-orange-50 to-red-50">
                                            <span className="text-sm font-bold text-retarder-gray-800">Total NC</span>
                                            <span className="text-lg font-bold text-orange-600">-{formatMXN(selectedNota.total)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-2 flex gap-2">
                                    <button
                                        onClick={() => { handleDelete(selectedNota.id); }}
                                        className="flex-1 px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
                                    >
                                        Eliminar Nota
                                    </button>
                                    <button
                                        onClick={() => setSelectedNota(null)}
                                        className="flex-1 px-4 py-2.5 bg-retarder-black text-white rounded-xl text-sm font-semibold hover:bg-retarder-gray-800 transition-colors"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* New Nota Modal */}
            <AnimatePresence>
                {showForm && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
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
                            <div className="flex items-center justify-between px-6 py-4 border-b border-retarder-gray-200 bg-gradient-to-r from-orange-500 to-red-600">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                        <ArrowDownLeft size={16} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Nueva Nota de Crédito</h3>
                                        <p className="text-[10px] text-white/70">{nextNCNumber}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-white/10 text-white">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Form */}
                            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                                {/* Factura Relacionada */}
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">
                                        Factura Relacionada *
                                    </label>
                                    <select
                                        value={formFactura}
                                        onChange={e => setFormFactura(e.target.value)}
                                        className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none bg-white"
                                    >
                                        <option value="">Seleccionar factura...</option>
                                        {facturasDisponibles.map(f => (
                                            <option key={f.factura} value={f.factura}>
                                                {f.factura} — {f.empresa} ({formatMXN(f.total)})
                                            </option>
                                        ))}
                                    </select>
                                    {selectedFacturaInfo && (
                                        <div className="mt-2 p-2 bg-retarder-gray-50 rounded-lg">
                                            <p className="text-[10px] text-retarder-gray-500">
                                                <strong>{selectedFacturaInfo.empresa}</strong> · Total factura: {formatMXN(selectedFacturaInfo.total)}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Motivo */}
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">
                                        Motivo *
                                    </label>
                                    <select
                                        value={formMotivo}
                                        onChange={e => setFormMotivo(e.target.value)}
                                        className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none bg-white"
                                    >
                                        {MOTIVO_OPTIONS.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                    {formMotivo === 'Otro' && (
                                        <input
                                            type="text"
                                            placeholder="Describe el motivo..."
                                            value={formMotivoCustom}
                                            onChange={e => setFormMotivoCustom(e.target.value)}
                                            className="w-full mt-2 border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none"
                                        />
                                    )}
                                </div>

                                {/* Monto */}
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">
                                        Subtotal (antes de IVA) *
                                    </label>
                                    <div className="flex items-center gap-2 border border-retarder-gray-200 rounded-lg px-3 py-2.5 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10">
                                        <DollarSign size={14} className="text-retarder-gray-400" />
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={formSubtotal}
                                            onChange={e => setFormSubtotal(e.target.value)}
                                            className="flex-1 outline-none text-sm"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                    {formSubtotal && parseFloat(formSubtotal) > 0 && (
                                        <div className="mt-2 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-100">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-retarder-gray-500">Subtotal:</span>
                                                <span className="font-medium">{formatMXN(parseFloat(formSubtotal))}</span>
                                            </div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-retarder-gray-500">IVA (16%):</span>
                                                <span className="font-medium">{formatMXN(parseFloat(formSubtotal) * 0.16)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm font-bold pt-1 border-t border-orange-200">
                                                <span className="text-retarder-gray-700">Total NC:</span>
                                                <span className="text-orange-600">-{formatMXN(parseFloat(formSubtotal) * 1.16)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Estado Inicial */}
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">
                                        Estado Inicial
                                    </label>
                                    <div className="flex gap-2">
                                        {(Object.keys(NC_ESTADO_CONFIG) as NCEstado[]).map(e => (
                                            <button
                                                key={e}
                                                type="button"
                                                onClick={() => setFormEstado(e)}
                                                className={cn(
                                                    'flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all border text-center',
                                                    formEstado === e
                                                        ? cn(NC_ESTADO_CONFIG[e].color, 'border-current ring-2 ring-current/20')
                                                        : 'bg-white border-retarder-gray-200 text-retarder-gray-500 hover:bg-retarder-gray-50'
                                                )}
                                            >
                                                {NC_ESTADO_CONFIG[e].label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-6 py-4 border-t border-retarder-gray-200 bg-retarder-gray-50 flex gap-2">
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-2.5 border border-retarder-gray-200 rounded-xl text-sm font-medium text-retarder-gray-600 hover:bg-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!formFactura || !formSubtotal || parseFloat(formSubtotal) <= 0}
                                    className={cn(
                                        'flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md',
                                        formFactura && formSubtotal && parseFloat(formSubtotal) > 0
                                            ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 shadow-orange-500/20'
                                            : 'bg-retarder-gray-200 text-retarder-gray-400 cursor-not-allowed shadow-none'
                                    )}
                                >
                                    Crear Nota de Crédito
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
