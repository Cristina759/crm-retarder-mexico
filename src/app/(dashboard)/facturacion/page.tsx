'use client';

import { useState, useMemo, useEffect, useCallback, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, FileText, DollarSign, CheckCircle2, Clock, AlertCircle, X, Building2, Calendar, Loader2, RefreshCcw, Trash2 } from 'lucide-react';
import { cn, formatMXN, formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { CLIENTES_REALES } from '@/lib/data/clientes-reales';

const supabase = createClient();

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

export default function FacturacionPage() {
    const [facturas, setFacturas] = useState<Factura[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterEstado, setFilterEstado] = useState<FactEstado | 'all'>('all');
    const [showForm, setShowForm] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [clientes, setClientes] = useState<any[]>([]);
    const [ordenesPendientes, setOrdenesPendientes] = useState<any[]>([]);
    const [newFactura, setNewFactura] = useState({
        orden_id: '',
        empresa: '',
        numero_factura: '',
        concepto: '',
        monto: '',
        metodo_pago: 'Transferencia',
        vigencia: '30'
    });
    const [clientSearchModal, setClientSearchModal] = useState('');

    const filteredClientesModal = useMemo(() => {
        if (!clientSearchModal.trim()) return clientes;
        const q = clientSearchModal.toLowerCase();
        return clientes.filter(c => c.nombre_comercial.toLowerCase().includes(q));
    }, [clientes, clientSearchModal]);

    const fetchFacturas = useCallback(async () => {
        setLoading(true);
        try {
            // Buscamos órdenes que estén en fase administrativa O tengan número de factura
            const { data: d1, error: e1 } = await supabase
                .from('ordenes_servicio')
                .select('*')
                .in('estado', ['encuesta_enviada', 'facturado', 'pagado'])
                .order('fecha_creado', { ascending: false });

            const { data: d2, error: e2 } = await supabase
                .from('ordenes_servicio')
                .select('*')
                .not('numero_factura', 'is', null)
                .order('fecha_creado', { ascending: false });

            if (e1) throw e1;
            if (e2) throw e2;

            const seenIds = new Set((d1 || []).map((o: any) => o.id));
            const data = [...(d1 || []), ...(d2 || []).filter((o: any) => !seenIds.has(o.id))];

            const mapped: Factura[] = (data || []).map(o => {
                let estado: FactEstado = 'pendiente_facturar';
                if (o.numero_factura || o.estado === 'facturado') estado = 'facturada';
                if (o.pagado || o.estado === 'pagado') estado = 'pagada';
                
                return {
                    id: o.id,
                    numero_orden: o.numero || 'OS-N/A',
                    numero_factura: o.numero_factura || 'PENDIENTE',
                    empresa: o.empresa,
                    concepto: o.descripcion || (o.monto_refacciones > 0 ? 'Refacciones y Mano de Obra' : 'Servicios y Mano de Obra'),
                    subtotal: o.subtotal || 0,
                    iva: o.iva || 0,
                    total: o.monto || 0,
                    estado: estado,
                    fecha_emision: o.fecha_creado,
                    fecha_vencimiento: o.fecha_creado, 
                    metodo_pago: o.metodo_pago || 'Transferencia',
                };
            });

            setFacturas(mapped);
        } catch (error) {
            console.error('Error fetching facturas:', error);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    const fetchDropdownData = useCallback(async () => {
        try {
            // Clientes — lista estática
            setClientes(CLIENTES_REALES.map(c => ({ id: c.id, nombre_comercial: c.nombre_comercial })));

            // Órdenes sin factura aún
            const { data: oData } = await supabase
                .from('ordenes_servicio')
                .select('id, numero, empresa, monto, descripcion')
                .is('numero_factura', null)
                .order('numero', { ascending: false });
            setOrdenesPendientes(oData || []);
        } catch (error) {
            console.error('Error fetching dropdown data:', error);
        }
    }, [supabase]);

    useEffect(() => {
        fetchFacturas();
        fetchDropdownData();
    }, [fetchFacturas, fetchDropdownData]);

    const filtered = useMemo(() => {
        let result = facturas;
        if (filterEstado !== 'all') result = result.filter(f => f.estado === filterEstado);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(f =>
                f.numero_orden.toLowerCase().includes(q) ||
                f.empresa.toLowerCase().includes(q) ||
                f.numero_factura.toLowerCase().includes(q)
            );
        }
        return result;
    }, [facturas, searchQuery, filterEstado]);

    const stats = useMemo(() => ({
        totalFacturado: facturas.filter(f => f.estado !== 'pendiente_facturar').reduce((s, f) => s + f.total, 0),
        totalPagado: facturas.filter(f => f.estado === 'pagada').reduce((s, f) => s + f.total, 0),
        pendientes: facturas.filter(f => f.estado === 'pendiente_facturar').length,
        vencidas: facturas.filter(f => f.estado === 'vencida').length,
    }), [facturas]);

    const handleCreateFactura = async () => {
        if (!newFactura.numero_factura || !newFactura.empresa) {
            alert('Por favor completa los campos obligatorios (Número de factura y Empresa)');
            return;
        }

        setLoading(true);
        try {
            if (newFactura.orden_id) {
                const { error } = await supabase
                    .from('ordenes_servicio')
                    .update({
                        numero_factura: newFactura.numero_factura,
                        estado: 'facturado',
                        monto: newFactura.monto ? Number(newFactura.monto) : undefined
                    })
                    .eq('id', newFactura.orden_id);
                
                if (error) throw error;
            } else {
                const nextNum = facturas.length + 1000;
                const { error } = await supabase
                    .from('ordenes_servicio')
                    .insert([{
                        numero: `OS-F${nextNum}`,
                        empresa: newFactura.empresa,
                        numero_factura: newFactura.numero_factura,
                        estado: 'facturado',
                        descripcion: newFactura.concepto || 'Facturación Manual',
                        monto: Number(newFactura.monto) || 0,
                        vendedor: 'Sistema'
                    }]);
                if (error) throw error;
            }

            setShowForm(false);
            setNewFactura({ orden_id: '', empresa: '', numero_factura: '', concepto: '', monto: '', metodo_pago: 'Transferencia', vigencia: '30' });
            await fetchFacturas();
            await fetchDropdownData();
            alert('Factura registrada correctamente');
        } catch (error: any) {
            console.error('Error creating factura:', error);
            alert(`Error al crear la factura: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFactura = async (factura: Factura) => {
        if (!confirm(`¿Eliminar la factura ${factura.numero_factura} de ${factura.empresa}?`)) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('ordenes_servicio')
                .update({
                    numero_factura: null,
                    estado: 'encuesta_enviada',
                })
                .eq('id', factura.id);
            if (error) throw error;
            await fetchFacturas();
            await fetchDropdownData();
        } catch (err: any) {
            console.error('Error eliminando factura:', err);
            alert(`Error al eliminar: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEstado = async (factura: Factura, nuevoEstado: 'facturada' | 'pagada') => {
        setLoading(true);
        try {
            const updates: Record<string, any> = nuevoEstado === 'pagada'
                ? { estado: 'pagado', pagado: true }
                : { estado: 'facturado' };

            const { error } = await supabase
                .from('ordenes_servicio')
                .update(updates)
                .eq('id', factura.id);

            if (error) throw error;
            await fetchFacturas();
        } catch (err: any) {
            console.error('Error actualizando estado:', err);
            alert(`Error al actualizar: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-retarder-black">Facturación</h2>
                    <p className="text-xs text-retarder-gray-500">{facturas.length} facturas registradas</p>
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
                    const count = isAll ? facturas.length : facturas.filter(f => f.estado === key).length;
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
                                <th className="text-left py-3 px-2 sm:px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Orden</th>
                                <th className="text-left py-3 px-2 sm:px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden md:table-cell">Factura</th>
                                <th className="text-left py-3 px-2 sm:px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Empresa</th>
                                <th className="text-left py-3 px-2 sm:px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden lg:table-cell">Concepto</th>
                                <th className="text-left py-3 px-2 sm:px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Estado</th>
                                <th className="text-right py-3 px-2 sm:px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Total</th>
                                <th className="text-left py-3 px-2 sm:px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden sm:table-cell">Vencimiento</th>
                                <th className="text-right py-3 px-2 sm:px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center">
                                        <Loader2 size={24} className="mx-auto text-retarder-red animate-spin mb-2" />
                                        <p className="text-xs text-retarder-gray-400">Cargando facturas...</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((f, i) => {
                                    const cfg = ESTADO_CONFIG[f.estado];
                                    return (
                                        <motion.tr key={f.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                                            className={cn('border-b border-retarder-gray-50 hover:bg-retarder-gray-50 cursor-pointer transition-colors', f.estado === 'vencida' && 'bg-red-50/30')}>
                                            <td className="py-3 px-2 sm:px-4 font-mono text-xs font-bold text-retarder-red">{f.numero_orden}</td>
                                            <td className="py-3 px-2 sm:px-4 font-mono text-xs text-retarder-gray-600 hidden md:table-cell">{f.numero_factura}</td>
                                            <td className="py-3 px-2 sm:px-4 font-medium text-retarder-gray-800 truncate max-w-[120px] sm:max-w-[200px]">{f.empresa}</td>
                                            <td className="py-3 px-2 sm:px-4 text-retarder-gray-500 text-xs truncate max-w-[150px] hidden lg:table-cell">{f.concepto}</td>
                                            <td className="py-3 px-2 sm:px-4">
                                                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', cfg.color)}>{cfg.label}</span>
                                            </td>
                                            <td className="py-3 px-2 sm:px-4 text-right font-bold text-retarder-gray-800 whitespace-nowrap">{formatMXN(f.total)}</td>
                                            <td className="py-3 px-2 sm:px-4 text-xs text-retarder-gray-500 hidden sm:table-cell">
                                                {f.fecha_vencimiento ? formatDate(f.fecha_vencimiento) : '—'}
                                            </td>
                                            <td className="py-3 px-2 sm:px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {f.estado === 'pendiente_facturar' && (
                                                        <button
                                                            onClick={e => { e.stopPropagation(); handleUpdateEstado(f, 'facturada'); }}
                                                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap"
                                                            title="Marcar como Facturada"
                                                        >
                                                            <FileText size={11} />
                                                            <span className="hidden sm:inline">Facturada</span>
                                                        </button>
                                                    )}
                                                    {f.estado === 'facturada' && (
                                                        <button
                                                            onClick={e => { e.stopPropagation(); handleUpdateEstado(f, 'pagada'); }}
                                                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap"
                                                            title="Marcar como Pagada"
                                                        >
                                                            <CheckCircle2 size={11} />
                                                            <span className="hidden sm:inline">Pagada</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={e => { e.stopPropagation(); handleDeleteFactura(f); }}
                                                        className="p-1.5 text-retarder-gray-400 hover:text-retarder-red hover:bg-retarder-red/5 rounded-lg transition-colors"
                                                        title="Eliminar factura"
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

            {/* New Invoice Modal */}
            <AnimatePresence>
                {showForm && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-retarder-gray-200 bg-gradient-to-r from-retarder-red to-retarder-red-700">
                                <h3 className="text-lg font-bold text-white">Registrar Factura</h3>
                                <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-white/10 text-white"><X size={18} /></button>
                            </div>
                            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Vincular a Orden de Servicio (Opcional)</label>
                                    <select 
                                        value={newFactura.orden_id}
                                        onChange={e => {
                                            const os = ordenesPendientes.find(o => o.id === e.target.value);
                                            setNewFactura({
                                                ...newFactura,
                                                orden_id: e.target.value,
                                                empresa: os ? os.empresa : newFactura.empresa,
                                                monto: os ? String(os.monto || '') : newFactura.monto,
                                                concepto: os ? (os.descripcion || '') : newFactura.concepto
                                            });
                                        }}
                                        className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none bg-white"
                                    >
                                        <option value="">-- Seleccionar Orden --</option>
                                        {ordenesPendientes.map(o => (
                                            <option key={o.id} value={o.id}>{o.numero} - {o.empresa}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Número de Factura</label>
                                    <div className="flex items-center gap-2 border border-retarder-gray-200 rounded-lg px-3 py-2.5 focus-within:border-retarder-red focus-within:ring-2 focus-within:ring-retarder-red/10">
                                        <FileText size={14} className="text-retarder-gray-400" />
                                        <input 
                                            type="text" 
                                            placeholder="F-0000" 
                                            value={newFactura.numero_factura}
                                            onChange={e => setNewFactura({...newFactura, numero_factura: e.target.value})}
                                            className="flex-1 outline-none text-sm" 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Empresa / Cliente</label>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 border border-retarder-gray-200 rounded-lg px-3 py-1 focus-within:border-retarder-red">
                                            <Search size={12} className="text-retarder-gray-400" />
                                            <input 
                                                type="text" 
                                                placeholder="Filtrar clientes..." 
                                                value={clientSearchModal}
                                                onChange={e => setClientSearchModal(e.target.value)}
                                                className="flex-1 outline-none text-xs py-1"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 border border-retarder-gray-200 rounded-lg px-3 py-2.5 focus-within:border-retarder-red focus-within:ring-2 focus-within:ring-retarder-red/10">
                                            <Building2 size={14} className="text-retarder-gray-400" />
                                            <select
                                                value={newFactura.empresa}
                                                onChange={(e) => setNewFactura({ ...newFactura, empresa: e.target.value })}
                                                className="w-full bg-transparent text-sm outline-none transition-all"
                                            >
                                                <option value="">Seleccionar empresa...</option>
                                                {filteredClientesModal.map((c) => (
                                                    <option key={c.id} value={c.nombre_comercial}>{c.nombre_comercial}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Concepto</label>
                                    <textarea 
                                        placeholder="Descripción de la factura..." 
                                        rows={2} 
                                        value={newFactura.concepto}
                                        onChange={e => setNewFactura({...newFactura, concepto: e.target.value})}
                                        className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none resize-none" 
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Monto Total (MXN)</label>
                                        <div className="flex items-center gap-2 border border-retarder-gray-200 rounded-lg px-3 py-2.5 focus-within:border-retarder-red focus-within:ring-2 focus-within:ring-retarder-red/10">
                                            <DollarSign size={14} className="text-retarder-gray-400" />
                                            <input 
                                                type="number" 
                                                placeholder="0.00" 
                                                value={newFactura.monto}
                                                onChange={e => setNewFactura({...newFactura, monto: e.target.value})}
                                                className="flex-1 outline-none text-sm" 
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-1 block">Método de Pago</label>
                                        <select 
                                            value={newFactura.metodo_pago}
                                            onChange={e => setNewFactura({...newFactura, metodo_pago: e.target.value})}
                                            className="w-full border border-retarder-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none bg-white"
                                        >
                                            <option>Transferencia</option>
                                            <option>Cheque</option>
                                            <option>Efectivo</option>
                                            <option>Tarjeta</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-retarder-gray-200 bg-retarder-gray-50 flex gap-2">
                                <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-retarder-gray-200 rounded-xl text-sm font-medium text-retarder-gray-600 hover:bg-white transition-colors">Cancelar</button>
                                <button 
                                    onClick={handleCreateFactura}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2.5 bg-retarder-red text-white rounded-xl text-sm font-semibold hover:bg-retarder-red-700 transition-colors shadow-md shadow-retarder-red/20 disabled:bg-gray-400"
                                >
                                    {loading ? 'Procesando...' : 'Crear Factura'}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
