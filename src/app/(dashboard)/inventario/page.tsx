'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Package, AlertTriangle, ArrowDown, ArrowUp, RefreshCw, TrendingDown, X } from 'lucide-react';
import { cn, formatMXN } from '@/lib/utils';

interface InventarioItem {
    id: string;
    nombre: string;
    numero_parte: string;
    categoria: string;
    stock_actual: number;
    stock_minimo: number;
    stock_maximo: number;
    ubicacion: string;
    precio_unitario: number;
    ultimo_movimiento: string;
}

const DEMO_INVENTARIO: InventarioItem[] = [
    { id: '1', nombre: 'Retarder PK1 Completo', numero_parte: 'RTD-PK1-001', categoria: 'Frenos', stock_actual: 5, stock_minimo: 3, stock_maximo: 10, ubicacion: 'A1-01', precio_unitario: 85000, ultimo_movimiento: '2026-02-14' },
    { id: '2', nombre: 'Retarder P5-1 Completo', numero_parte: 'RTD-P51-001', categoria: 'Frenos', stock_actual: 2, stock_minimo: 3, stock_maximo: 8, ubicacion: 'A1-02', precio_unitario: 65000, ultimo_movimiento: '2026-02-12' },
    { id: '3', nombre: 'Retarder P7 Completo', numero_parte: 'RTD-P7-001', categoria: 'Frenos', stock_actual: 4, stock_minimo: 2, stock_maximo: 6, ubicacion: 'A1-03', precio_unitario: 88000, ultimo_movimiento: '2026-02-10' },
    { id: '4', nombre: 'Cardán completo Volvo FH', numero_parte: 'CDN-VFH-001', categoria: 'Refacciones', stock_actual: 8, stock_minimo: 3, stock_maximo: 15, ubicacion: 'B2-01', precio_unitario: 18500, ultimo_movimiento: '2026-02-13' },
    { id: '5', nombre: 'Cruceta universal pesada', numero_parte: 'CRC-UNI-001', categoria: 'Refacciones', stock_actual: 12, stock_minimo: 10, stock_maximo: 30, ubicacion: 'B2-02', precio_unitario: 3800, ultimo_movimiento: '2026-02-15' },
    { id: '6', nombre: 'Arnés eléctrico retarder PK', numero_parte: 'MEL-ARN-PK1', categoria: 'Eléctrico', stock_actual: 3, stock_minimo: 5, stock_maximo: 12, ubicacion: 'C3-01', precio_unitario: 4500, ultimo_movimiento: '2026-02-11' },
    { id: '7', nombre: 'Sensor velocidad retarder', numero_parte: 'MEL-SEN-001', categoria: 'Eléctrico', stock_actual: 1, stock_minimo: 6, stock_maximo: 15, ubicacion: 'C3-02', precio_unitario: 2800, ultimo_movimiento: '2026-02-08' },
    { id: '8', nombre: 'Kit hules montaje retarder', numero_parte: 'HUL-KIT-001', categoria: 'Hules', stock_actual: 18, stock_minimo: 15, stock_maximo: 40, ubicacion: 'D4-01', precio_unitario: 1800, ultimo_movimiento: '2026-02-14' },
    { id: '9', nombre: 'Soporte retarder universal', numero_parte: 'SOP-UNI-001', categoria: 'Soportería', stock_actual: 6, stock_minimo: 4, stock_maximo: 12, ubicacion: 'E5-01', precio_unitario: 6500, ultimo_movimiento: '2026-02-09' },
    { id: '10', nombre: 'Kit tornillería montaje completo', numero_parte: 'TOR-KIT-001', categoria: 'Tornillería', stock_actual: 0, stock_minimo: 12, stock_maximo: 30, ubicacion: 'F6-01', precio_unitario: 1200, ultimo_movimiento: '2026-01-28' },
    { id: '11', nombre: 'Placa identificación retarder', numero_parte: 'PLC-ID-001', categoria: 'Placas', stock_actual: 22, stock_minimo: 25, stock_maximo: 50, ubicacion: 'F6-02', precio_unitario: 450, ultimo_movimiento: '2026-02-06' },
    { id: '12', nombre: 'Cruceta reforzada HD', numero_parte: 'CRC-HD-002', categoria: 'Refacciones', stock_actual: 9, stock_minimo: 8, stock_maximo: 20, ubicacion: 'B2-03', precio_unitario: 5200, ultimo_movimiento: '2026-02-15' },
];

function getStockStatus(item: InventarioItem): { label: string; color: string; icon: typeof AlertTriangle } {
    if (item.stock_actual === 0) return { label: 'Agotado', color: 'bg-red-100 text-red-700', icon: AlertTriangle };
    if (item.stock_actual < item.stock_minimo) return { label: 'Bajo mínimo', color: 'bg-amber-100 text-amber-700', icon: TrendingDown };
    if (item.stock_actual >= item.stock_maximo) return { label: 'Lleno', color: 'bg-blue-100 text-blue-700', icon: Package };
    return { label: 'Normal', color: 'bg-emerald-100 text-emerald-700', icon: Package };
}

export default function InventarioPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const filtered = useMemo(() => {
        let result = DEMO_INVENTARIO;
        if (showOnlyAlerts) result = result.filter(item => item.stock_actual < item.stock_minimo);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(item => item.nombre.toLowerCase().includes(q) || item.numero_parte.toLowerCase().includes(q));
        }
        return result;
    }, [searchQuery, showOnlyAlerts]);

    const alertCount = DEMO_INVENTARIO.filter(item => item.stock_actual < item.stock_minimo).length;
    const totalValue = DEMO_INVENTARIO.reduce((s, item) => s + item.stock_actual * item.precio_unitario, 0);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-retarder-black">Inventario</h2>
                    <p className="text-xs text-retarder-gray-500">Valor total: {formatMXN(totalValue)} · {alertCount} alertas</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-retarder-gray-100 rounded-lg px-3 py-2">
                        <Search size={14} className="text-retarder-gray-400" />
                        <input type="text" placeholder="Buscar producto..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-sm w-40" />
                    </div>
                    {alertCount > 0 && (
                        <button onClick={() => setShowOnlyAlerts(!showOnlyAlerts)} className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border', showOnlyAlerts ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-retarder-gray-600 border-retarder-gray-200 hover:bg-retarder-gray-50')}>
                            <AlertTriangle size={14} />
                            Alertas ({alertCount})
                        </button>
                    )}
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-[#FACC15] text-black rounded-lg text-sm font-medium hover:bg-[#EAB308] transition-colors shadow-md shadow-yellow-500/20">
                        <Plus size={16} /><span className="hidden sm:inline">Nuevo Movimiento</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total Productos', value: DEMO_INVENTARIO.length.toString(), color: 'text-blue-600', icon: Package },
                    { label: 'Bajo Mínimo', value: alertCount.toString(), color: 'text-red-600', icon: AlertTriangle },
                    { label: 'Agotados', value: DEMO_INVENTARIO.filter(i => i.stock_actual === 0).length.toString(), color: 'text-red-700', icon: TrendingDown },
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
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden md:table-cell">No. Parte</th>
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden lg:table-cell">Ubicación</th>
                                <th className="text-center py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Stock</th>
                                <th className="text-center py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden sm:table-cell">Mín / Máx</th>
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Estado</th>
                                <th className="text-right py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden lg:table-cell">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((item, i) => {
                                const status = getStockStatus(item);
                                const stockPct = Math.min((item.stock_actual / item.stock_maximo) * 100, 100);
                                return (
                                    <motion.tr key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                                        className={cn('border-b border-retarder-gray-50 hover:bg-retarder-gray-50 cursor-pointer transition-colors', item.stock_actual < item.stock_minimo && 'bg-red-50/30')}>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-retarder-gray-100 flex items-center justify-center"><Package size={14} className="text-retarder-gray-500" /></div>
                                                <div>
                                                    <p className="font-medium text-retarder-gray-800">{item.nombre}</p>
                                                    <p className="text-[10px] text-retarder-gray-500">{item.categoria}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 font-mono text-xs text-retarder-gray-600 hidden md:table-cell">{item.numero_parte}</td>
                                        <td className="py-3 px-4 text-xs text-retarder-gray-600 hidden lg:table-cell">{item.ubicacion}</td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={cn('text-base font-bold', item.stock_actual === 0 ? 'text-red-600' : item.stock_actual < item.stock_minimo ? 'text-amber-600' : 'text-retarder-gray-800')}>
                                                    {item.stock_actual}
                                                </span>
                                                <div className="w-16 h-1.5 bg-retarder-gray-200 rounded-full overflow-hidden">
                                                    <div className={cn('h-full rounded-full transition-all', item.stock_actual === 0 ? 'bg-red-500' : item.stock_actual < item.stock_minimo ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${stockPct}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center text-xs text-retarder-gray-500 hidden sm:table-cell">
                                            {item.stock_minimo} / {item.stock_maximo}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', status.color)}>{status.label}</span>
                                        </td>
                                        <td className="py-3 px-4 text-right font-semibold text-retarder-gray-800 hidden lg:table-cell">
                                            {formatMXN(item.stock_actual * item.precio_unitario)}
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            <AnimatePresence>
                {showForm && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-retarder-gray-200 bg-gradient-to-r from-retarder-red to-retarder-red-700">
                                <h3 className="text-lg font-bold text-white">Nuevo Movimiento de Inventario</h3>
                                <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-white/10 text-white"><X size={18} /></button>
                            </div>
                            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Tipo de Movimiento</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { value: 'entrada', label: 'Entrada', icon: <ArrowDown size={14} />, color: 'text-emerald-600' },
                                            { value: 'salida', label: 'Salida', icon: <ArrowUp size={14} />, color: 'text-red-600' },
                                            { value: 'ajuste', label: 'Ajuste', icon: <RefreshCw size={14} />, color: 'text-blue-600' },
                                        ].map(t => (
                                            <label key={t.value} className="flex items-center gap-2 border border-retarder-gray-200 rounded-lg px-3 py-2.5 cursor-pointer hover:bg-retarder-gray-50 transition-colors">
                                                <input type="radio" name="tipo_mov" value={t.value} className="accent-retarder-red" defaultChecked={t.value === 'entrada'} />
                                                <span className={t.color}>{t.icon}</span>
                                                <span className="text-sm font-medium">{t.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Producto</label>
                                    <select className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none">
                                        {DEMO_INVENTARIO.map(item => (<option key={item.id} value={item.id}>{item.nombre} ({item.numero_parte})</option>))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Cantidad</label>
                                        <input type="number" placeholder="1" min="1" className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Motivo</label>
                                        <select className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none">
                                            <option value="compra">Compra</option>
                                            <option value="venta">Venta</option>
                                            <option value="servicio">Servicio</option>
                                            <option value="devolucion">Devolución</option>
                                            <option value="ajuste_manual">Ajuste Manual</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Notas</label>
                                    <textarea placeholder="Notas adicionales..." rows={2} className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none resize-none" />
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-retarder-gray-200 bg-retarder-gray-50 flex gap-2">
                                <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-retarder-gray-200 rounded-xl text-sm font-medium text-retarder-gray-600 hover:bg-white transition-colors">Cancelar</button>
                                <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 bg-retarder-red text-white rounded-xl text-sm font-semibold hover:bg-retarder-red-700 transition-colors shadow-md shadow-retarder-red/20">Registrar Movimiento</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
