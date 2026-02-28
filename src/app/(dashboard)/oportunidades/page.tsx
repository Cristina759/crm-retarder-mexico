'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, TrendingUp, Building2, DollarSign, User, Target, X } from 'lucide-react';
import { cn, formatMXN } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';

type OppEstado = 'prospecto' | 'contactado' | 'cotizado' | 'negociacion' | 'ganada' | 'perdida';
type OppTipo = 'frenos' | 'refacciones' | 'servicios';

interface DemoOportunidad {
    id: string;
    empresa: string;
    vendedor: string;
    tipo: OppTipo;
    descripcion: string;
    estado: OppEstado;
    monto_estimado: number;
    probabilidad: number;
    fecha: string;
}

const ESTADO_PIPELINE: { id: OppEstado; label: string; color: string; bgLight: string; textColor: string }[] = [
    { id: 'prospecto', label: 'Prospecto', color: 'bg-gray-400', bgLight: 'bg-gray-50', textColor: 'text-gray-600' },
    { id: 'contactado', label: 'Contactado', color: 'bg-blue-500', bgLight: 'bg-blue-50', textColor: 'text-blue-700' },
    { id: 'cotizado', label: 'Cotizado', color: 'bg-purple-500', bgLight: 'bg-purple-50', textColor: 'text-purple-700' },
    { id: 'negociacion', label: 'Negociación', color: 'bg-amber-500', bgLight: 'bg-amber-50', textColor: 'text-amber-700' },
    { id: 'ganada', label: 'Ganada', color: 'bg-emerald-500', bgLight: 'bg-emerald-50', textColor: 'text-emerald-700' },
    { id: 'perdida', label: 'Perdida', color: 'bg-red-500', bgLight: 'bg-red-50', textColor: 'text-red-700' },
];

const TIPO_COLORS: Record<OppTipo, string> = {
    frenos: 'bg-retarder-red-light text-retarder-red',
    refacciones: 'bg-blue-100 text-blue-700',
    servicios: 'bg-emerald-100 text-emerald-700',
};

const DEMO_OPORTUNIDADES: DemoOportunidad[] = [
    { id: '1', empresa: 'Transportes del Norte', vendedor: 'Ana G.', tipo: 'frenos', descripcion: 'Retarders PK1 para 12 unidades nuevas', estado: 'negociacion', monto_estimado: 960000, probabilidad: 70, fecha: '2026-02-10' },
    { id: '2', empresa: 'Fletes Azteca', vendedor: 'Pedro V.', tipo: 'servicios', descripcion: 'Contrato mantenimiento anual', estado: 'cotizado', monto_estimado: 340000, probabilidad: 50, fecha: '2026-02-08' },
    { id: '3', empresa: 'Carga Express MX', vendedor: 'Ana G.', tipo: 'refacciones', descripcion: 'Paquete refacciones crucetas y hules', estado: 'contactado', monto_estimado: 85000, probabilidad: 30, fecha: '2026-02-12' },
    { id: '4', empresa: 'LogiTrax', vendedor: 'Pedro V.', tipo: 'frenos', descripcion: 'Retarder P7 para camión nuevo', estado: 'prospecto', monto_estimado: 120000, probabilidad: 15, fecha: '2026-02-14' },
    { id: '5', empresa: 'MegaFletes SA', vendedor: 'Ana G.', tipo: 'servicios', descripcion: 'Diagnóstico flota completa 20 unidades', estado: 'ganada', monto_estimado: 180000, probabilidad: 100, fecha: '2026-01-28' },
    { id: '6', empresa: 'FreightMaster', vendedor: 'Pedro V.', tipo: 'frenos', descripcion: 'Upgrade retarder PK a PK1', estado: 'negociacion', monto_estimado: 450000, probabilidad: 60, fecha: '2026-02-05' },
    { id: '7', empresa: 'Rápidos del Bajío', vendedor: 'Ana G.', tipo: 'refacciones', descripcion: 'Stock anual placas y tornillería', estado: 'cotizado', monto_estimado: 65000, probabilidad: 40, fecha: '2026-02-07' },
    { id: '8', empresa: 'Transportes Sierra', vendedor: 'Pedro V.', tipo: 'servicios', descripcion: 'Instalación 5 unidades', estado: 'perdida', monto_estimado: 275000, probabilidad: 0, fecha: '2026-01-15' },
    { id: '9', empresa: 'Logística Global', vendedor: 'Ana G.', tipo: 'frenos', descripcion: 'Retarder P5-1 para 8 tractocamiones', estado: 'ganada', monto_estimado: 720000, probabilidad: 100, fecha: '2026-01-20' },
    { id: '10', empresa: 'Auto Transportes LP', vendedor: 'Pedro V.', tipo: 'refacciones', descripcion: 'Cardán + material eléctrico', estado: 'prospecto', monto_estimado: 42000, probabilidad: 10, fecha: '2026-02-15' },
];

export default function OportunidadesPage() {
    const { isAdmin, isVendedor } = useRole();
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'pipeline' | 'table'>('pipeline');
    const [showForm, setShowForm] = useState(false);

    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return DEMO_OPORTUNIDADES;
        const q = searchQuery.toLowerCase();
        return DEMO_OPORTUNIDADES.filter(o => o.empresa.toLowerCase().includes(q) || o.descripcion.toLowerCase().includes(q));
    }, [searchQuery]);

    const pipelineTotal = filtered.reduce((s, o) => s + o.monto_estimado * (o.probabilidad / 100), 0);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-retarder-black">Oportunidades de Venta</h2>
                    <p className="text-xs text-retarder-gray-500">Pipeline ponderado: {formatMXN(pipelineTotal)}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-retarder-gray-100 rounded-lg px-3 py-2">
                        <Search size={14} className="text-retarder-gray-400" />
                        <input type="text" placeholder="Buscar oportunidad..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-sm w-40" />
                    </div>
                    <div className="flex border border-retarder-gray-200 rounded-lg overflow-hidden">
                        <button onClick={() => setViewMode('pipeline')} className={cn('p-2 transition-colors text-xs font-medium px-3', viewMode === 'pipeline' ? 'bg-retarder-red text-white' : 'hover:bg-retarder-gray-100')}>Pipeline</button>
                        <button onClick={() => setViewMode('table')} className={cn('p-2 transition-colors text-xs font-medium px-3', viewMode === 'table' ? 'bg-retarder-red text-white' : 'hover:bg-retarder-gray-100')}>Tabla</button>
                    </div>
                    {(isAdmin || isVendedor) && (
                        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-retarder-red text-white rounded-lg text-sm font-medium hover:bg-retarder-red-700 transition-colors shadow-md shadow-retarder-red/20">
                            <Plus size={16} /><span className="hidden sm:inline">Nueva Oportunidad</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Pipeline View */}
            {viewMode === 'pipeline' && (
                <div className="overflow-x-auto pb-4">
                    <div className="flex gap-3 min-w-max">
                        {ESTADO_PIPELINE.map((stage, idx) => {
                            const opps = filtered.filter(o => o.estado === stage.id);
                            const stageTotal = opps.reduce((s, o) => s + o.monto_estimado, 0);
                            return (
                                <motion.div key={stage.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="w-[240px] flex-shrink-0">
                                    <div className={cn('rounded-t-xl px-3 py-2.5 border-t-[3px]', `border-${stage.color.replace('bg-', '')}`)}>
                                        <div className="flex items-center gap-2">
                                            <div className={cn('w-2.5 h-2.5 rounded-full', stage.color)} />
                                            <h4 className="text-[11px] font-bold text-retarder-gray-700 uppercase tracking-wide">{stage.label}</h4>
                                            <span className={cn('ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full', stage.color, 'text-white')}>{opps.length}</span>
                                        </div>
                                        <p className="text-[10px] text-retarder-gray-500 mt-0.5">{formatMXN(stageTotal)}</p>
                                    </div>
                                    <div className={cn('rounded-b-xl px-2 py-2 space-y-2 min-h-[100px] border border-t-0 border-retarder-gray-100', stage.bgLight)}>
                                        {opps.map(o => (
                                            <div key={o.id} className="bg-white rounded-xl border border-retarder-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase', TIPO_COLORS[o.tipo])}>{o.tipo}</span>
                                                    <span className="text-[10px] font-semibold text-retarder-gray-600">{o.probabilidad}%</span>
                                                </div>
                                                <p className="text-sm font-semibold text-retarder-gray-800 truncate">{o.empresa}</p>
                                                <p className="text-[11px] text-retarder-gray-500 truncate mt-0.5">{o.descripcion}</p>
                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-retarder-gray-100">
                                                    <span className="text-xs font-bold text-retarder-gray-700">{formatMXN(o.monto_estimado)}</span>
                                                    <span className="text-[10px] text-retarder-gray-400">{o.vendedor}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {opps.length === 0 && (
                                            <div className="flex items-center justify-center h-20 rounded-lg border-2 border-dashed border-retarder-gray-200">
                                                <p className="text-[10px] text-retarder-gray-400">Sin oportunidades</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl border border-retarder-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-retarder-gray-50">
                            <tr className="border-b border-retarder-gray-200">
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Empresa</th>
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden md:table-cell">Tipo</th>
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Estado</th>
                                <th className="text-right py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Monto</th>
                                <th className="text-center py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden sm:table-cell">Prob.</th>
                                <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden lg:table-cell">Vendedor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((o, i) => {
                                const stage = ESTADO_PIPELINE.find(s => s.id === o.estado)!;
                                return (
                                    <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-retarder-gray-50 hover:bg-retarder-gray-50 cursor-pointer transition-colors">
                                        <td className="py-3 px-4">
                                            <p className="font-medium text-retarder-gray-800">{o.empresa}</p>
                                            <p className="text-[10px] text-retarder-gray-500 truncate max-w-[200px]">{o.descripcion}</p>
                                        </td>
                                        <td className="py-3 px-4 hidden md:table-cell"><span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase', TIPO_COLORS[o.tipo])}>{o.tipo}</span></td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-1.5">
                                                <div className={cn('w-2 h-2 rounded-full', stage.color)} />
                                                <span className="text-xs font-medium">{stage.label}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right font-semibold text-retarder-gray-800">{formatMXN(o.monto_estimado)}</td>
                                        <td className="py-3 px-4 text-center hidden sm:table-cell">
                                            <div className="flex items-center gap-1 justify-center">
                                                <div className="w-12 h-1.5 bg-retarder-gray-200 rounded-full overflow-hidden">
                                                    <div className={cn('h-full rounded-full', stage.color)} style={{ width: `${o.probabilidad}%` }} />
                                                </div>
                                                <span className="text-[10px] font-semibold text-retarder-gray-600">{o.probabilidad}%</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-retarder-gray-600 hidden lg:table-cell">{o.vendedor}</td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </motion.div>
            )}

            {/* New Oportunidad Modal */}
            <AnimatePresence>
                {showForm && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-retarder-gray-200 bg-gradient-to-r from-retarder-red to-retarder-red-700">
                                <h3 className="text-lg font-bold text-white">Nueva Oportunidad</h3>
                                <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-white/10 text-white"><X size={18} /></button>
                            </div>
                            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Empresa</label>
                                    <div className="flex items-center gap-2 border border-retarder-gray-200 rounded-lg px-3 py-2.5 focus-within:border-retarder-red focus-within:ring-2 focus-within:ring-retarder-red/10">
                                        <Building2 size={14} className="text-retarder-gray-400" />
                                        <input type="text" placeholder="Nombre de la empresa" className="flex-1 outline-none text-sm" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Tipo</label>
                                        <select className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none">
                                            <option value="frenos">🔴 Frenos</option>
                                            <option value="refacciones">🔧 Refacciones</option>
                                            <option value="servicios">⚙️ Servicios</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Vendedor</label>
                                        <div className="flex items-center gap-2 border border-retarder-gray-200 rounded-lg px-3 py-2.5 focus-within:border-retarder-red focus-within:ring-2 focus-within:ring-retarder-red/10">
                                            <User size={14} className="text-retarder-gray-400" />
                                            <input type="text" placeholder="Vendedor" className="flex-1 outline-none text-sm" />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Monto Estimado (MXN)</label>
                                        <div className="flex items-center gap-2 border border-retarder-gray-200 rounded-lg px-3 py-2.5 focus-within:border-retarder-red focus-within:ring-2 focus-within:ring-retarder-red/10">
                                            <DollarSign size={14} className="text-retarder-gray-400" />
                                            <input type="number" placeholder="0.00" className="flex-1 outline-none text-sm" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Probabilidad (%)</label>
                                        <div className="flex items-center gap-2 border border-retarder-gray-200 rounded-lg px-3 py-2.5 focus-within:border-retarder-red focus-within:ring-2 focus-within:ring-retarder-red/10">
                                            <Target size={14} className="text-retarder-gray-400" />
                                            <input type="number" placeholder="50" min="0" max="100" className="flex-1 outline-none text-sm" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Descripción</label>
                                    <textarea placeholder="Describe la oportunidad de venta..." rows={3} className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none resize-none" />
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-retarder-gray-200 bg-retarder-gray-50 flex gap-2">
                                <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-retarder-gray-200 rounded-xl text-sm font-medium text-retarder-gray-600 hover:bg-white transition-colors">Cancelar</button>
                                <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 bg-retarder-red text-white rounded-xl text-sm font-semibold hover:bg-retarder-red-700 transition-colors shadow-md shadow-retarder-red/20">Crear Oportunidad</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
