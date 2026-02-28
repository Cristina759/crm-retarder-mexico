'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Package, DollarSign, Eye, Settings2, X, Check, RefreshCw, Building2, Filter } from 'lucide-react';
import { cn, formatMXN, formatUSD } from '@/lib/utils';
import { CATALOGO_FRENOS, DEMO_ORDENES, type CatalogoFreno } from '@/lib/utils/constants';
import { useRole } from '@/hooks/useRole';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export default function FrenosPage() {
    const { isAdmin } = useRole();
    const { tipoCambio, source: tcSource, isLoading: isLoadingTC, refresh: fetchTipoCambio } = useExchangeRate();
    const [searchQuery, setSearchQuery] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedBrandFilter, setSelectedBrandFilter] = useState<'todas' | 'pentar' | 'frenelsa' | 'cofremex'>('todas');
    const [clientes, setClientes] = useState<{ id: string; nombre_comercial: string }[]>([]);
    const [selectedClienteId, setSelectedClienteId] = useState<string>('');

    const activeFremos = CATALOGO_FRENOS.filter(f => f.activo);

    // Fetch clientes
    const fetchClientes = useCallback(async () => {
        const { data } = await supabase.from('empresas').select('id, nombre_comercial').order('nombre_comercial');
        if (data && data.length > 0) {
            setClientes(data);
        } else {
            // Fallback: extract unique client names from DEMO_ORDENES
            const names = [...new Set(DEMO_ORDENES.map(o => o.empresa))];
            setClientes(names.map((n, i) => ({ id: `demo-${i}`, nombre_comercial: n })));
        }
    }, []);

    useEffect(() => { fetchClientes(); }, [fetchClientes]);

    // Get orders for selected client
    const clientOrders = useMemo(() => {
        if (!selectedClienteId) return [];
        const clientName = clientes.find(c => c.id === selectedClienteId)?.nombre_comercial || '';
        return DEMO_ORDENES.filter(o => o.empresa.toLowerCase().includes(clientName.toLowerCase()));
    }, [selectedClienteId, clientes]);

    const filtered = useMemo(() => {
        let result = CATALOGO_FRENOS;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(f =>
                f.modelo.toLowerCase().includes(q) ||
                f.descripcion.toLowerCase().includes(q) ||
                f.aplicacion.toLowerCase().includes(q) ||
                f.pentar_serie.toLowerCase().includes(q) ||
                f.frenelsa_serie.toLowerCase().includes(q) ||
                f.cofremex_serie.toLowerCase().includes(q)
            );
        }
        return result;
    }, [searchQuery]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-retarder-black">Catálogo de Frenos</h2>
                    <p className="text-xs text-retarder-gray-500">
                        {CATALOGO_FRENOS.length} modelos · {activeFremos.length} activos · 3 marcas:
                        <span className="font-semibold text-red-600 ml-1">Pentar</span> ·
                        <span className="font-semibold text-blue-600 ml-1">Frenelsa</span> ·
                        <span className="font-semibold text-amber-600 ml-1">Cofremex</span>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* TC Badge */}
                    <div className="flex items-center gap-1.5 bg-retarder-gray-50 rounded-lg px-3 py-2 border border-retarder-gray-200">
                        <DollarSign size={12} className="text-emerald-500" />
                        <span className="text-xs font-bold text-retarder-gray-700">${tipoCambio.toFixed(2)}</span>
                        <button onClick={() => fetchTipoCambio()} disabled={isLoadingTC} className={cn("p-0.5 rounded hover:bg-retarder-gray-100", isLoadingTC && "animate-spin")}>
                            <RefreshCw size={10} className="text-retarder-gray-400" />
                        </button>
                    </div>
                    <div className="flex items-center gap-1 bg-retarder-gray-100 rounded-lg px-3 py-2">
                        <Search size={14} className="text-retarder-gray-400" />
                        <input type="text" placeholder="Buscar modelo o marca..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-sm w-48" />
                    </div>
                    {isAdmin && (
                        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-retarder-red text-white rounded-lg text-sm font-medium hover:bg-retarder-red-700 transition-colors shadow-md shadow-retarder-red/20">
                            <Plus size={16} /><span className="hidden sm:inline">Nuevo Modelo</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Brand Filters */}
            <div className="flex items-center gap-2">
                {([
                    { id: 'todas' as const, label: 'Todas las marcas', color: 'bg-retarder-gray-800 text-white' },
                    { id: 'pentar' as const, label: 'Pentar', color: 'bg-red-100 text-red-700 border-red-300' },
                    { id: 'frenelsa' as const, label: 'Frenelsa', color: 'bg-blue-100 text-blue-700 border-blue-300' },
                    { id: 'cofremex' as const, label: 'Cofremex', color: 'bg-amber-100 text-amber-700 border-amber-300' },
                ]).map(brand => (
                    <button
                        key={brand.id}
                        onClick={() => setSelectedBrandFilter(brand.id)}
                        className={cn(
                            'px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all',
                            selectedBrandFilter === brand.id
                                ? `${brand.color} shadow-sm scale-105`
                                : 'bg-white text-retarder-gray-500 border-retarder-gray-200 hover:border-retarder-gray-300'
                        )}
                    >
                        {brand.label}
                    </button>
                ))}

                {/* Client filter */}
                <div className="ml-auto flex items-center gap-2 bg-white rounded-full border border-retarder-gray-200 pl-3 pr-1 py-1">
                    <Building2 size={12} className="text-retarder-gray-400 flex-shrink-0" />
                    <select
                        value={selectedClienteId}
                        onChange={e => setSelectedClienteId(e.target.value)}
                        className="bg-transparent border-none outline-none text-[10px] font-semibold text-retarder-gray-600 min-w-[140px] cursor-pointer"
                    >
                        <option value="">Todos los clientes</option>
                        {clientes.map(c => (
                            <option key={c.id} value={c.id}>{c.nombre_comercial}</option>
                        ))}
                    </select>
                    {selectedClienteId && (
                        <button onClick={() => setSelectedClienteId('')} className="p-1 hover:bg-retarder-gray-100 rounded-full">
                            <X size={10} className="text-retarder-gray-400" />
                        </button>
                    )}
                </div>
            </div>

            {/* Client orders summary */}
            {selectedClienteId && clientOrders.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 px-5 py-3 flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Building2 size={16} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-blue-800">{clientes.find(c => c.id === selectedClienteId)?.nombre_comercial}</p>
                            <p className="text-[10px] text-blue-500">{clientOrders.length} órdenes registradas · Total: {formatMXN(clientOrders.reduce((s, o) => s + (o.monto || 0), 0))}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {clientOrders.slice(0, 5).map(o => (
                            <span key={o.id} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded-full">{o.numero}</span>
                        ))}
                        {clientOrders.length > 5 && <span className="text-[9px] text-blue-500">+{clientOrders.length - 5} más</span>}
                    </div>
                </motion.div>
            )}

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {filtered.map((freno, i) => {
                    // Determine total installed for each brand
                    const installCosts = freno.cardanes_usd + freno.soporteria_usd + freno.material_electrico_usd;

                    const brands = [
                        { key: 'pentar', name: 'PENTAR', serie: freno.pentar_serie, nm: freno.pentar_nm, precio: freno.pentar_precio_usd, bgBadge: 'bg-red-100 text-red-700', bgSelected: 'bg-red-50' },
                        { key: 'frenelsa', name: 'FRENELSA', serie: freno.frenelsa_serie, nm: freno.frenelsa_nm, precio: freno.frenelsa_precio_usd, bgBadge: 'bg-blue-100 text-blue-700', bgSelected: 'bg-blue-50' },
                        { key: 'cofremex', name: 'COFREMEX', serie: freno.cofremex_serie, nm: freno.cofremex_nm, precio: freno.cofremex_precio_usd, bgBadge: 'bg-amber-100 text-amber-700', bgSelected: 'bg-amber-50' },
                    ].filter(b => {
                        if (selectedBrandFilter === 'todas') return b.serie || b.precio > 0;
                        return b.key === selectedBrandFilter && (b.serie || b.precio > 0);
                    });

                    // If filtered by brand and this model has nothing for that brand, skip
                    if (selectedBrandFilter !== 'todas' && brands.length === 0) return null;

                    return (
                        <motion.div key={freno.modelo} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                            className={cn('bg-white rounded-xl border border-retarder-gray-200 overflow-hidden hover:shadow-lg transition-all group', !freno.activo && 'opacity-60')}>
                            {/* Model header */}
                            <div className="bg-gradient-to-r from-retarder-gray-800 to-retarder-gray-700 px-4 py-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-white font-bold text-lg tracking-wider">{freno.modelo}</span>
                                        <p className="text-white/50 text-[10px]">{freno.aplicacion}</p>
                                    </div>
                                    <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full', freno.activo ? 'bg-white/20 text-white' : 'bg-red-300 text-red-900')}>
                                        {freno.activo ? 'ACTIVO' : 'DISCONTINUADO'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 space-y-3">
                                {/* All brands for this model */}
                                <div className="space-y-2">
                                    {brands.map(brand => {
                                        const totalInstalledUSD = brand.precio + installCosts;
                                        const totalInstalledMXN = totalInstalledUSD * tipoCambio;
                                        return (
                                            <div key={brand.key} className={cn('rounded-lg p-3 border', brand.precio > 0 ? 'border-retarder-gray-100' : 'border-dashed border-retarder-gray-200')}>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={cn('px-1.5 py-0.5 text-[8px] font-bold rounded', brand.bgBadge)}>{brand.name}</span>
                                                        <span className="text-xs font-bold text-retarder-gray-800">{brand.serie}</span>
                                                    </div>
                                                    <span className="text-[10px] font-semibold text-retarder-gray-500">{brand.nm} NM</span>
                                                </div>
                                                {brand.precio > 0 ? (
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-[9px] text-retarder-gray-400 uppercase">Freno</p>
                                                            <p className="text-sm font-bold text-retarder-gray-800">{formatUSD(brand.precio)}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[9px] text-retarder-gray-400 uppercase">Total instalado</p>
                                                            <p className="text-sm font-bold text-retarder-red">{formatMXN(totalInstalledMXN)}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-[10px] text-retarder-gray-400 italic">Precio por cotizar</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Shared install costs */}
                                <div className="pt-2 border-t border-retarder-gray-100">
                                    <p className="text-[9px] font-semibold uppercase text-retarder-gray-400 mb-1.5">Costos de Instalación (USD)</p>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        <div className="bg-retarder-gray-50 rounded p-1.5 text-center">
                                            <p className="text-[8px] text-retarder-gray-400">Cardanes</p>
                                            <p className="text-[10px] font-bold text-retarder-gray-700">{formatUSD(freno.cardanes_usd)}</p>
                                        </div>
                                        <div className="bg-retarder-gray-50 rounded p-1.5 text-center">
                                            <p className="text-[8px] text-retarder-gray-400">Soportería</p>
                                            <p className="text-[10px] font-bold text-retarder-gray-700">{formatUSD(freno.soporteria_usd)}</p>
                                        </div>
                                        <div className="bg-retarder-gray-50 rounded p-1.5 text-center">
                                            <p className="text-[8px] text-retarder-gray-400">Mat. Eléctrico</p>
                                            <p className="text-[10px] font-bold text-retarder-gray-700">{formatUSD(freno.material_electrico_usd)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Add model modal */}
            <AnimatePresence>
                {showForm && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-retarder-gray-200 bg-gradient-to-r from-retarder-red to-retarder-red-700">
                                <h3 className="text-lg font-bold text-white">Nuevo Modelo de Freno</h3>
                                <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-white/10 text-white"><X size={18} /></button>
                            </div>
                            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                                {[
                                    { label: 'Modelo', placeholder: 'Ej: PK2' },
                                    { label: 'Descripción', placeholder: 'Descripción del retarder' },
                                    { label: 'Pentar Serie', placeholder: 'Ej: PK2' },
                                    { label: 'Frenelsa Serie', placeholder: 'Ej: F12-60' },
                                    { label: 'Cofremex Serie', placeholder: 'Ej: CFK-60' },
                                    { label: 'Aplicación', placeholder: 'Tipo de vehículo y tonelaje' },
                                    { label: 'Precio Pentar (USD)', placeholder: '0.00' },
                                    { label: 'Precio Frenelsa (USD)', placeholder: '0.00' },
                                    { label: 'Precio Cofremex (USD)', placeholder: '0.00' },
                                ].map(f => (
                                    <div key={f.label}>
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">{f.label}</label>
                                        <input type="text" placeholder={f.placeholder} className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none" />
                                    </div>
                                ))}
                            </div>
                            <div className="px-6 py-4 border-t border-retarder-gray-200 bg-retarder-gray-50 flex gap-2">
                                <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-retarder-gray-200 rounded-xl text-sm font-medium text-retarder-gray-600 hover:bg-white transition-colors">Cancelar</button>
                                <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 bg-retarder-red text-white rounded-xl text-sm font-semibold hover:bg-retarder-red-700 transition-colors shadow-md shadow-retarder-red/20">Guardar Modelo</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
