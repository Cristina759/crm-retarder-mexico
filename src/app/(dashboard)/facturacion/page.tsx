'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, FileText, DollarSign, CheckCircle2, Clock, AlertCircle, X, Building2, Calendar } from 'lucide-react';
import { cn, formatMXN, formatDate } from '@/lib/utils';
import { VENTAS_REALES } from '@/lib/data/ventas-reales';

type FactEstado = 'pendiente_facturar' | 'facturada' | 'enviada' | 'pagada' | 'vencida';

interface Factura {
    id: string;
    numero_orden: string;
    numero_factura: string;
    empresa: string;
    concepto: string;
    subtotal: number;
    iva: number;
    total: number;
    estado: FactEstado;
    fecha_emision: string;
    fecha_vencimiento: string;
    metodo_pago: string;
}

const ESTADO_CONFIG: Record<FactEstado, { label: string; color: string; icon: typeof Clock }> = {
    pendiente_facturar: { label: 'Pendiente Facturar', color: 'bg-amber-100 text-amber-700', icon: Clock },
    facturada: { label: 'Facturada', color: 'bg-blue-100 text-blue-700', icon: FileText },
    enviada: { label: 'Enviada al Cliente', color: 'bg-purple-100 text-purple-700', icon: AlertCircle },
    pagada: { label: 'Pagada', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    vencida: { label: 'Vencida', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

const REAL_FACTURAS: Factura[] = VENTAS_REALES.map(v => ({
    id: v.id,
    numero_orden: v.orden_servicio || 'N/A',
    numero_factura: v.factura,
    empresa: v.cliente,
    concepto: v.refacciones > 0 ? 'Refacciones y Mano de Obra' : 'Servicios y Mano de Obra',
    subtotal: v.subtotal,
    iva: v.iva,
    total: v.total,
    estado: v.pagado ? 'pagada' : 'enviada',
    fecha_emision: '2026-02-19', // Default to current or recent
    fecha_vencimiento: '2026-03-19',
    metodo_pago: 'Transferencia',
}));

export default function FacturacionPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterEstado, setFilterEstado] = useState<FactEstado | 'all'>('all');
    const [showForm, setShowForm] = useState(false);

    const filtered = useMemo(() => {
        let result = REAL_FACTURAS;
        if (filterEstado !== 'all') result = result.filter(f => f.estado === filterEstado);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(f => f.numero_orden.toLowerCase().includes(q) || f.empresa.toLowerCase().includes(q) || f.numero_factura.toLowerCase().includes(q));
        }
        return result;
    }, [searchQuery, filterEstado]);

    const stats = {
        totalFacturado: REAL_FACTURAS.filter(f => f.estado !== 'pendiente_facturar').reduce((s, f) => s + f.total, 0),
        totalPagado: REAL_FACTURAS.filter(f => f.estado === 'pagada').reduce((s, f) => s + f.total, 0),
        pendientes: REAL_FACTURAS.filter(f => f.estado === 'pendiente_facturar').length,
        vencidas: REAL_FACTURAS.filter(f => f.estado === 'vencida').length,
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-retarder-black">Facturación</h2>
                    <p className="text-xs text-retarder-gray-500">{REAL_FACTURAS.length} facturas registradas</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-retarder-gray-100 rounded-lg px-3 py-2">
                        <Search size={14} className="text-retarder-gray-400" />
                        <input type="text" placeholder="Buscar factura..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-sm w-40" />
                    </div>
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-retarder-red text-white rounded-lg text-sm font-medium hover:bg-retarder-red-700 transition-colors shadow-md shadow-retarder-red/20">
                        <Plus size={16} /><span className="hidden sm:inline">Nueva Factura</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total Facturado', value: formatMXN(stats.totalFacturado), color: 'text-blue-600', icon: FileText },
                    { label: 'Total Cobrado', value: formatMXN(stats.totalPagado), color: 'text-emerald-600', icon: DollarSign },
                    { label: 'Pendientes', value: stats.pendientes.toString(), color: 'text-amber-600', icon: Clock },
                    { label: 'Vencidas', value: stats.vencidas.toString(), color: 'text-red-600', icon: AlertCircle },
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

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {(['all', ...Object.keys(ESTADO_CONFIG)] as const).map(key => {
                    const isAll = key === 'all';
                    const count = isAll ? REAL_FACTURAS.length : REAL_FACTURAS.filter(f => f.estado === key).length;
                    return (
                        <button key={key} onClick={() => setFilterEstado(key as FactEstado | 'all')} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border', filterEstado === key ? 'bg-retarder-black text-white border-retarder-black' : 'bg-white text-retarder-gray-600 border-retarder-gray-200 hover:bg-retarder-gray-50')}>
                            {isAll ? 'Todas' : ESTADO_CONFIG[key as FactEstado].label} ({count})
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
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Orden</th>
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden md:table-cell">Factura</th>
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Empresa</th>
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden lg:table-cell">Concepto</th>
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Estado</th>
                                <th className="text-right py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Total</th>
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden sm:table-cell">Vencimiento</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((f, i) => {
                                const cfg = ESTADO_CONFIG[f.estado];
                                return (
                                    <motion.tr key={f.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                                        className={cn('border-b border-retarder-gray-50 hover:bg-retarder-gray-50 cursor-pointer transition-colors', f.estado === 'vencida' && 'bg-red-50/30')}>
                                        <td className="py-3 px-4 font-mono text-xs font-bold text-retarder-red">{f.numero_orden}</td>
                                        <td className="py-3 px-4 font-mono text-xs text-retarder-gray-600 hidden md:table-cell">{f.numero_factura}</td>
                                        <td className="py-3 px-4 font-medium text-retarder-gray-800">{f.empresa}</td>
                                        <td className="py-3 px-4 text-retarder-gray-500 text-xs truncate max-w-[200px] hidden lg:table-cell">{f.concepto}</td>
                                        <td className="py-3 px-4">
                                            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', cfg.color)}>{cfg.label}</span>
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-retarder-gray-800">{formatMXN(f.total)}</td>
                                        <td className="py-3 px-4 text-xs text-retarder-gray-500 hidden sm:table-cell">
                                            {f.fecha_vencimiento ? formatDate(f.fecha_vencimiento) : '—'}
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* New Invoice Modal */}
            <AnimatePresence>
                {showForm && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-retarder-gray-200 bg-gradient-to-r from-retarder-red to-retarder-red-700">
                                <h3 className="text-lg font-bold text-white">Nueva Factura</h3>
                                <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-white/10 text-white"><X size={18} /></button>
                            </div>
                            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                                {[
                                    { label: 'Número de Orden', placeholder: 'OS-00000', icon: <FileText size={14} /> },
                                    { label: 'Empresa', placeholder: 'Nombre de la empresa', icon: <Building2 size={14} /> },
                                ].map(f => (
                                    <div key={f.label}>
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">{f.label}</label>
                                        <div className="flex items-center gap-2 border border-retarder-gray-200 rounded-lg px-3 py-2.5 focus-within:border-retarder-red focus-within:ring-2 focus-within:ring-retarder-red/10">
                                            <span className="text-retarder-gray-400">{f.icon}</span>
                                            <input type="text" placeholder={f.placeholder} className="flex-1 outline-none text-sm" />
                                        </div>
                                    </div>
                                ))}
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Concepto</label>
                                    <textarea placeholder="Descripción de la factura..." rows={2} className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none resize-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Monto Total (MXN)</label>
                                        <div className="flex items-center gap-2 border border-retarder-gray-200 rounded-lg px-3 py-2.5 focus-within:border-retarder-red focus-within:ring-2 focus-within:ring-retarder-red/10">
                                            <DollarSign size={14} className="text-retarder-gray-400" />
                                            <input type="number" placeholder="0.00" className="flex-1 outline-none text-sm" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Método de Pago</label>
                                        <select className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none">
                                            <option>Transferencia</option>
                                            <option>Cheque</option>
                                            <option>Efectivo</option>
                                            <option>Tarjeta</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Días de Vigencia</label>
                                    <div className="flex items-center gap-2 border border-retarder-gray-200 rounded-lg px-3 py-2.5 focus-within:border-retarder-red focus-within:ring-2 focus-within:ring-retarder-red/10">
                                        <Calendar size={14} className="text-retarder-gray-400" />
                                        <input type="number" placeholder="30" className="flex-1 outline-none text-sm" />
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-retarder-gray-200 bg-retarder-gray-50 flex gap-2">
                                <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-retarder-gray-200 rounded-xl text-sm font-medium text-retarder-gray-600 hover:bg-white transition-colors">Cancelar</button>
                                <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 bg-retarder-red text-white rounded-xl text-sm font-semibold hover:bg-retarder-red-700 transition-colors shadow-md shadow-retarder-red/20">Crear Factura</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
