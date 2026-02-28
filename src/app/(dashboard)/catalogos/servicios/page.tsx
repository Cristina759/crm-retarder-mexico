'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Wrench, Clock, DollarSign, Cpu, X } from 'lucide-react';
import { cn, formatMXN } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';

type ServTipo = 'preventivo' | 'correctivo' | 'instalacion' | 'diagnostico';

interface Servicio {
    id: string;
    tipo: ServTipo;
    nombre: string;
    descripcion: string;
    precio_base: number;
    duracion_hrs: number;
    requiere_equipo: string[];
    activo: boolean;
}

const TIPO_CONFIG: Record<ServTipo, { label: string; color: string; icon: string }> = {
    preventivo: { label: 'Preventivo', color: 'bg-emerald-100 text-emerald-700', icon: '🛡️' },
    correctivo: { label: 'Correctivo', color: 'bg-amber-100 text-amber-700', icon: '🔧' },
    instalacion: { label: 'Instalación', color: 'bg-blue-100 text-blue-700', icon: '⚙️' },
    diagnostico: { label: 'Diagnóstico', color: 'bg-purple-100 text-purple-700', icon: '🔍' },
};

const DEMO_SERVICIOS: Servicio[] = [
    { id: '1', tipo: 'preventivo', nombre: 'Mantenimiento Preventivo Básico', descripcion: 'Revisión general, ajuste de componentes y lubricación', precio_base: 8500, duracion_hrs: 4, requiere_equipo: ['Herramienta básica', 'Multímetro'], activo: true },
    { id: '2', tipo: 'preventivo', nombre: 'Mantenimiento Preventivo Completo', descripcion: 'Revisión completa con pruebas de funcionamiento y reporte', precio_base: 15000, duracion_hrs: 8, requiere_equipo: ['Herramienta completa', 'Diagnóstico electrónico'], activo: true },
    { id: '3', tipo: 'correctivo', nombre: 'Reparación Eléctrica', descripcion: 'Diagnóstico y reparación del sistema eléctrico del retarder', precio_base: 12000, duracion_hrs: 6, requiere_equipo: ['Multímetro', 'Arnés de prueba', 'Laptop diagnóstico'], activo: true },
    { id: '4', tipo: 'correctivo', nombre: 'Cambio de Cruceta y Cardán', descripcion: 'Desmontaje, cambio de cruceta y alineación de cardán', precio_base: 18000, duracion_hrs: 8, requiere_equipo: ['Grúa hidráulica', 'Herramienta especial'], activo: true },
    { id: '5', tipo: 'correctivo', nombre: 'Reparación Mecánica General', descripcion: 'Reparación de componentes mecánicos dañados', precio_base: 22000, duracion_hrs: 10, requiere_equipo: ['Herramienta completa', 'Refacciones'], activo: true },
    { id: '6', tipo: 'instalacion', nombre: 'Instalación Retarder Nuevo', descripcion: 'Instalación completa de retarder incluyendo soporte y conexiones', precio_base: 25000, duracion_hrs: 12, requiere_equipo: ['Grúa', 'Herramienta completa', 'Equipo soldadura'], activo: true },
    { id: '7', tipo: 'instalacion', nombre: 'Upgrade de Modelo', descripcion: 'Desmontaje del modelo anterior e instalación del nuevo', precio_base: 18000, duracion_hrs: 10, requiere_equipo: ['Grúa', 'Herramienta especial'], activo: true },
    { id: '8', tipo: 'diagnostico', nombre: 'Diagnóstico Electrónico', descripcion: 'Lectura de códigos, pruebas de sensores y actuadores', precio_base: 5000, duracion_hrs: 2, requiere_equipo: ['Laptop diagnóstico', 'Software OEM'], activo: true },
    { id: '9', tipo: 'diagnostico', nombre: 'Diagnóstico de Vibración', descripcion: 'Análisis de vibración y alineación del sistema', precio_base: 8000, duracion_hrs: 3, requiere_equipo: ['Acelerómetro', 'Software análisis'], activo: true },
    { id: '10', tipo: 'diagnostico', nombre: 'Inspección Pre-Compra', descripcion: 'Evaluación completa de retarder existente para compradores', precio_base: 6000, duracion_hrs: 3, requiere_equipo: ['Herramienta básica', 'Diagnóstico electrónico'], activo: true },
];

export default function ServiciosPage() {
    const { isAdmin } = useRole();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTipo, setFilterTipo] = useState<ServTipo | 'all'>('all');
    const [showForm, setShowForm] = useState(false);

    const filtered = useMemo(() => {
        let result = DEMO_SERVICIOS;
        if (filterTipo !== 'all') result = result.filter(s => s.tipo === filterTipo);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(s => s.nombre.toLowerCase().includes(q) || s.descripcion.toLowerCase().includes(q));
        }
        return result;
    }, [searchQuery, filterTipo]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-retarder-black">Catálogo de Servicios</h2>
                    <p className="text-xs text-retarder-gray-500">{DEMO_SERVICIOS.length} servicios en {Object.keys(TIPO_CONFIG).length} categorías</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-retarder-gray-100 rounded-lg px-3 py-2">
                        <Search size={14} className="text-retarder-gray-400" />
                        <input type="text" placeholder="Buscar servicio..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-sm w-40" />
                    </div>
                    {isAdmin && (
                        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-retarder-red text-white rounded-lg text-sm font-medium hover:bg-retarder-red-700 transition-colors shadow-md shadow-retarder-red/20">
                            <Plus size={16} /><span className="hidden sm:inline">Nuevo Servicio</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Type filters */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                <button onClick={() => setFilterTipo('all')} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border', filterTipo === 'all' ? 'bg-retarder-black text-white border-retarder-black' : 'bg-white text-retarder-gray-600 border-retarder-gray-200 hover:bg-retarder-gray-50')}>
                    Todos ({DEMO_SERVICIOS.length})
                </button>
                {(Object.keys(TIPO_CONFIG) as ServTipo[]).map(tipo => {
                    const cfg = TIPO_CONFIG[tipo];
                    const count = DEMO_SERVICIOS.filter(s => s.tipo === tipo).length;
                    return (
                        <button key={tipo} onClick={() => setFilterTipo(filterTipo === tipo ? 'all' : tipo)} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border', filterTipo === tipo ? 'bg-retarder-black text-white border-retarder-black' : 'bg-white text-retarder-gray-600 border-retarder-gray-200 hover:bg-retarder-gray-50')}>
                            {cfg.icon} {cfg.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Service cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((s, i) => {
                    const cfg = TIPO_CONFIG[s.tipo];
                    return (
                        <motion.div key={s.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                            className="bg-white rounded-xl border border-retarder-gray-200 p-4 hover:shadow-lg transition-all cursor-pointer">
                            <div className="flex items-center justify-between mb-3">
                                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase', cfg.color)}>{cfg.icon} {cfg.label}</span>
                                <span className={cn('w-2 h-2 rounded-full', s.activo ? 'bg-emerald-500' : 'bg-retarder-gray-300')} />
                            </div>
                            <h3 className="text-sm font-bold text-retarder-gray-800 mb-1">{s.nombre}</h3>
                            <p className="text-[11px] text-retarder-gray-500 leading-relaxed mb-3">{s.descripcion}</p>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="bg-retarder-gray-50 rounded-lg p-2 flex items-center gap-2">
                                    <DollarSign size={12} className="text-retarder-gray-400" />
                                    <div>
                                        <p className="text-[9px] text-retarder-gray-400 font-semibold">PRECIO BASE</p>
                                        <p className="text-xs font-bold text-retarder-gray-800">{formatMXN(s.precio_base)}</p>
                                    </div>
                                </div>
                                <div className="bg-retarder-gray-50 rounded-lg p-2 flex items-center gap-2">
                                    <Clock size={12} className="text-retarder-gray-400" />
                                    <div>
                                        <p className="text-[9px] text-retarder-gray-400 font-semibold">DURACIÓN</p>
                                        <p className="text-xs font-bold text-retarder-gray-800">{s.duracion_hrs} hrs</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p className="text-[9px] font-semibold uppercase text-retarder-gray-400 mb-1">Equipo Requerido</p>
                                <div className="flex flex-wrap gap-1">
                                    {s.requiere_equipo.map(eq => (
                                        <span key={eq} className="text-[9px] px-1.5 py-0.5 bg-retarder-gray-100 rounded text-retarder-gray-600">{eq}</span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <AnimatePresence>
                {showForm && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-retarder-gray-200 bg-gradient-to-r from-retarder-red to-retarder-red-700">
                                <h3 className="text-lg font-bold text-white">Nuevo Servicio</h3>
                                <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-white/10 text-white"><X size={18} /></button>
                            </div>
                            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Tipo de Servicio</label>
                                    <select className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none">
                                        {(Object.keys(TIPO_CONFIG) as ServTipo[]).map(t => (<option key={t} value={t}>{TIPO_CONFIG[t].icon} {TIPO_CONFIG[t].label}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Nombre del Servicio</label>
                                    <input type="text" placeholder="Nombre descriptivo" className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Descripción</label>
                                    <textarea placeholder="Describe el servicio..." rows={2} className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none resize-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Precio Base (MXN)</label>
                                        <div className="flex items-center gap-2 border border-retarder-gray-200 rounded-lg px-3 py-2.5 focus-within:border-retarder-red focus-within:ring-2 focus-within:ring-retarder-red/10">
                                            <DollarSign size={14} className="text-retarder-gray-400" />
                                            <input type="number" placeholder="0.00" className="flex-1 outline-none text-sm" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Duración (hrs)</label>
                                        <div className="flex items-center gap-2 border border-retarder-gray-200 rounded-lg px-3 py-2.5 focus-within:border-retarder-red focus-within:ring-2 focus-within:ring-retarder-red/10">
                                            <Clock size={14} className="text-retarder-gray-400" />
                                            <input type="number" placeholder="4" className="flex-1 outline-none text-sm" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Equipo Requerido</label>
                                    <input type="text" placeholder="Herramienta básica, Multímetro..." className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none" />
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-retarder-gray-200 bg-retarder-gray-50 flex gap-2">
                                <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-retarder-gray-200 rounded-xl text-sm font-medium text-retarder-gray-600 hover:bg-white transition-colors">Cancelar</button>
                                <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 bg-retarder-red text-white rounded-xl text-sm font-semibold hover:bg-retarder-red-700 transition-colors shadow-md shadow-retarder-red/20">Guardar Servicio</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
