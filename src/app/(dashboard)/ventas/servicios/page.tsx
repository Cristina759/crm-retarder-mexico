'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wrench,
    Shield,
    Search as SearchIcon,
    ClipboardCheck,
    Plus,
    Minus,
    Trash2,
    Printer,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    Truck,
    DollarSign,
    Package,
    AlertTriangle,
    X,
    FileText,
    Settings2,
    CircleDot,
    Building2,
    Loader2,
    TrendingUp,
    RefreshCw,
} from 'lucide-react';
import { cn, formatMXN } from '@/lib/utils';
import {
    CATALOGO_REFACCIONES,
    REFACCION_CATEGORIAS,
    type Refaccion,
} from '@/lib/data/catalogo-refacciones';
import {
    CATALOGO_MANO_OBRA,
    CATEGORIAS_MANO_OBRA,
    type ConceptoManoObra,
} from '@/lib/data/catalogo-mano-obra';
import { DEFAULT_TIPO_CAMBIO } from '@/lib/utils/constants';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// ── Types ───────────────────────────────────────────

interface ClienteCompact {
    id: string;
    nombre_comercial: string;
    rfc?: string;
    direccion_fiscal?: string;
    email?: string;
    email_2?: string;
    telefono?: string;
    telefono_2?: string;
    telefono_3?: string;
    persona_contacto?: string;
    nombre_titular?: string;
    nombre_sucursal?: string;
}

// ── Service Type Definitions ────────────────────────

interface ChecklistGroup {
    title: string;
    items: string[];
}

interface ServiceType {
    id: string;
    label: string;
    icon: typeof Wrench;
    color: string;
    bgColor: string;
    description: string;
    checklist: ChecklistGroup[];
    allowRefacciones: boolean;
}

const SERVICE_TYPES: ServiceType[] = [
    {
        id: 'preventivo',
        label: 'Servicio Preventivo',
        icon: Shield,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
        description: 'Revisión completa del sistema con checklist detallado',
        allowRefacciones: false,
        checklist: [
            {
                title: 'Sistema Mecánico',
                items: [
                    'Torque a tornillería',
                    'Limpieza de panel de conexiones',
                    'Placas laterales',
                    'Hules y tornillería en general',
                    'Revisión cardanes y crucetas',
                ],
            },
            {
                title: 'Engrase',
                items: ['Engrase según marca (tubo incluido)'],
            },
            {
                title: 'Sistema Eléctrico',
                items: [
                    'Palanca control',
                    'Foco piloto',
                    'Interruptor',
                    'Relay de corte',
                    'Arneses de control y terminales',
                    'Sensor de velocidad',
                    'Sistema neumático',
                ],
            },
            {
                title: 'Sistema de Baterías',
                items: [
                    'Caja de contactores',
                    'Maza y positivo',
                    'Block de conexiones',
                ],
            },
        ],
    },
    {
        id: 'correctivo',
        label: 'Servicio Correctivo',
        icon: Wrench,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 border-orange-200 hover:border-orange-400',
        description: 'Diagnóstico de falla, reparación y refacciones',
        allowRefacciones: true,
        checklist: [
            {
                title: 'Servicio Correctivo',
                items: [
                    'Diagnóstico de falla',
                    'Reparación',
                    'Refacciones (se agregan del catálogo)',
                ],
            },
        ],
    },
];

// ── Precio Fijo Preventivo ──────────────────────────
const PRECIO_PREVENTIVO = 4250;

// ── Refaccion Cart Item ─────────────────────────────

interface RefaccionItem {
    refaccion: Refaccion;
    cantidad: number;
}

// ── Mano de Obra Item ───────────────────────────────

interface ManoObraItem {
    concepto: ConceptoManoObra;
    cantidad: number;
}

// ── Price Line Component (PDF Only) ─────────────────

function PriceLine({ label, mxn, accent = false }: { label: string; mxn: number; accent?: boolean }) {
    return (
        <div className={cn(
            'flex justify-between py-1.5 px-3 rounded-lg',
            accent ? 'bg-retarder-red text-white font-bold' : 'text-retarder-gray-700'
        )}>
            <span className="text-[10px]">{label}</span>
            <span className="text-[10px] font-mono">{formatMXN(mxn)}</span>
        </div>
    );
}

// ── Page Component ──────────────────────────────────

export default function CotizadorServiciosPage() {
    const router = useRouter();
    const { user } = useUser();
    const cotizacionRef = useRef<HTMLDivElement>(null);

    const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
    const [cantidad, setCantidad] = useState(1);
    const [traslado, setTraslado] = useState(0);
    const [refacciones, setRefacciones] = useState<RefaccionItem[]>([]);
    const [manoObraItems, setManoObraItems] = useState<ManoObraItem[]>([]);

    const [clientes, setClientes] = useState<ClienteCompact[]>([]);
    const [selectedClienteId, setSelectedClienteId] = useState<string>('');
    const [isCreating, setIsCreating] = useState(false);
    const [tipoCambio, setTipoCambio] = useState(DEFAULT_TIPO_CAMBIO);
    const [refaccionesCatalog, setRefaccionesCatalog] = useState<Refaccion[]>([]);
    const [loadingRefs, setLoadingRefs] = useState(true);

    const [showRefSearch, setShowRefSearch] = useState(false);
    const [refSearch, setRefSearch] = useState('');
    const [refCategory, setRefCategory] = useState<string>('all');

    const [showManoSearch, setShowManoSearch] = useState(false);
    const [manoSearch, setManoSearch] = useState('');
    const [manoCategory, setManoCategory] = useState<string>('all');

    const [expandChecklist, setExpandChecklist] = useState(true);

    // Editable Observations and Notes
    const [observaciones, setObservaciones] = useState(
        '*ESTE SERVICIO INCLUYE LOS PUNTOS DESCRITOS EN EL CHECKLIST\n*TIEMPO ESTIMADO DE REALIZACIÓN: 4 A 6 HORAS POR UNIDAD\n*EL CLIENTE DEBE PROPORCIONAR EL ESPACIO ADECUADO SI EL SERVICIO ES EN SITIO\n*SE REQUIERE CONFIRMACIÓN DE CITA CON 48 HORAS DE ANTICIPACIÓN'
    );
    const [notas, setNotas] = useState(
        '*COTIZACIÓN VÁLIDA POR 15 DÍAS\n*GARANTÍA DE 30 DÍAS EN MANO DE OBRA'
    );

    // Filtered refacciones for search modal
    const filteredRefs = useMemo(() => {
        let result = refaccionesCatalog;
        if (refCategory !== 'all') result = result.filter(r => (r as any).categoria === refCategory);
        if (refSearch.trim()) {
            const q = refSearch.toLowerCase();
            result = result.filter(r =>
                r.codigo.toLowerCase().includes(q) ||
                (r as any).nombre?.toLowerCase().includes(q)
            );
        }
        return result.slice(0, 50);
    }, [refSearch, refCategory, refaccionesCatalog]);

    // Filtered mano de obra for search modal
    const filteredMano = useMemo(() => {
        let result = CATALOGO_MANO_OBRA;
        if (manoCategory !== 'all') result = result.filter(m => m.categoria === manoCategory);
        if (manoSearch.trim()) {
            const q = manoSearch.toLowerCase();
            result = result.filter(m =>
                m.concepto.toLowerCase().includes(q) ||
                m.categoria.toLowerCase().includes(q)
            );
        }
        return result;
    }, [manoSearch, manoCategory]);

    // Cart actions
    const addRefaccion = useCallback((ref: Refaccion) => {
        setRefacciones(prev => {
            const existing = prev.find(item => item.refaccion.codigo === ref.codigo);
            if (existing) {
                return prev.map(item =>
                    item.refaccion.codigo === ref.codigo
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                );
            }
            return [...prev, { refaccion: ref, cantidad: 1 }];
        });
    }, []);

    const updateRefQty = useCallback((codigo: string, delta: number) => {
        setRefacciones(prev =>
            prev
                .map(item => item.refaccion.codigo === codigo ? { ...item, cantidad: Math.max(0, item.cantidad + delta) } : item)
                .filter(item => item.cantidad > 0)
        );
    }, []);

    const removeRef = useCallback((codigo: string) => {
        setRefacciones(prev => prev.filter(item => item.refaccion.codigo !== codigo));
    }, []);

    const addManoObra = useCallback((concepto: ConceptoManoObra) => {
        setManoObraItems(prev => {
            const existing = prev.find(item => item.concepto.concepto === concepto.concepto);
            if (existing) {
                return prev.map(item =>
                    item.concepto.concepto === concepto.concepto
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                );
            }
            return [...prev, { concepto, cantidad: 1 }];
        });
    }, []);

    const updateManoQty = useCallback((conceptoName: string, delta: number) => {
        setManoObraItems(prev =>
            prev
                .map(item => item.concepto.concepto === conceptoName ? { ...item, cantidad: Math.max(0, item.cantidad + delta) } : item)
                .filter(item => item.cantidad > 0)
        );
    }, []);

    const removeMano = useCallback((conceptoName: string) => {
        setManoObraItems(prev => prev.filter(item => item.concepto.concepto !== conceptoName));
    }, []);

    // Fetch de Clientes
    const fetchClientes = useCallback(async () => {
        const { data } = await supabase.from('empresas').select('id, nombre_comercial, rfc, direccion_fiscal, email, telefono, persona_contacto, nombre_titular, nombre_sucursal, telefono_2, telefono_3, email_2').order('nombre_comercial');
        if (data && data.length > 0) {
            setClientes(data as ClienteCompact[]);
        } else {
            setClientes([{
                id: 'default-local',
                nombre_comercial: 'Cliente Genérico (Local)',
                rfc: 'XAXX010101000',
                direccion_fiscal: 'Dirección Generica, México',
                email: 'contacto@ejemplo.com',
                telefono: '55 1234 5678',
                persona_contacto: 'Juan Pérez'
            }]);
        }
    }, []);

    const fetchRefacciones = useCallback(async () => {
        setLoadingRefs(true);
        try {
            const { data, error } = await supabase.from('catalogo_refacciones').select('*').order('nombre');
            if (error) throw error;
            if (data) {
                const mapped = data.map(r => ({
                    ...r,
                    descripcion: r.nombre,
                    area: r.categoria
                }));
                setRefaccionesCatalog(mapped);
            }
        } catch (err) {
            console.error('Error fetching refs:', err);
        } finally {
            setLoadingRefs(false);
        }
    }, []);

    // Fetch del Tipo de Cambio (Propuesta Usuario)
    const fetchTipoCambio = useCallback(async () => {
        try {
            const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
                cache: 'no-store'
            });
            const data = await res.json();
            if (data?.rates?.MXN) {
                setTipoCambio(data.rates.MXN);
            }
        } catch (error) {
            try {
                const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=MXN', {
                    cache: 'no-store'
                });
                const data = await res.json();
                if (data?.rates?.MXN) setTipoCambio(data.rates.MXN);
            } catch {
                console.error('Todas las fuentes fallaron');
            }
        }
    }, []);

    useEffect(() => {
        fetchClientes();
        fetchRefacciones();
        fetchTipoCambio();
    }, [fetchClientes, fetchRefacciones, fetchTipoCambio]);

    // Calculations
    const totalRefacciones = useMemo(() => {
        return refacciones.reduce((sum, item) => sum + item.refaccion.precio_venta * item.cantidad, 0);
    }, [refacciones]);

    const totalManoObra = useMemo(() => {
        return manoObraItems.reduce((sum, item) => sum + item.concepto.precio_mxn * item.cantidad, 0);
    }, [manoObraItems]);

    const subtotal = useMemo(() => {
        if (!selectedService) return 0;
        if (selectedService.id === 'preventivo') return cantidad * PRECIO_PREVENTIVO;
        if (selectedService.id === 'correctivo') return totalManoObra + totalRefacciones + traslado;
        return 0;
    }, [selectedService, cantidad, totalManoObra, traslado, totalRefacciones]);

    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    const resetForm = () => {
        setSelectedService(null);
        setCantidad(1);
        setTraslado(0);
        setManoObraItems([]);
        setRefacciones([]);
        setExpandChecklist(true);
    };

    const handleFinalize = async () => {
        if (!selectedService || !selectedClienteId) {
            alert('Por favor selecciona un servicio y un cliente.');
            return;
        }

        setIsCreating(true);
        try {
            const cliente = clientes.find(c => c.id === selectedClienteId);
            const sellerName = user?.fullName || 'Sistema';
            const fechaActual = new Date().toISOString().split('T')[0];

            let cotNumero = `COT-LOCAL-${Math.floor(Math.random() * 1000)}`;
            let osNumero = `OS-LOCAL-${Math.floor(Math.random() * 1000)}`;
            let cotId = "local-cot-" + Math.random();

            try {
                const { count: cotCount } = await supabase.from('cotizaciones').select('*', { count: 'exact', head: true });
                const { count: osCount } = await supabase.from('ordenes_servicio').select('*', { count: 'exact', head: true });

                const nextCotIdx = (cotCount || 0) + 1;
                const nextOsIdx = (osCount || 0) + 1;

                cotNumero = `COT-${String(nextCotIdx).padStart(4, '0')}`;
                osNumero = `OS-${String(nextOsIdx).padStart(4, '0')}`;

                const { data: cotData, error: cotError } = await supabase
                    .from('cotizaciones')
                    .insert({
                        numero: cotNumero,
                        empresa: cliente?.nombre_comercial || 'Sin empresa',
                        vendedor: sellerName,
                        subtotal: subtotal,
                        iva: iva,
                        total: total,
                        estado: 'enviada',
                        fecha: fechaActual,
                        vigencia_dias: 15
                    })
                    .select()
                    .single();

                if (!cotError && cotData) {
                    cotId = cotData.id;
                }

                await supabase
                    .from('ordenes_servicio')
                    .insert({
                        numero: osNumero,
                        empresa: cliente?.nombre_comercial || 'Sin empresa',
                        tipo: selectedService.id,
                        estado: 'solicitud_recibida',
                        prioridad: 'media',
                        vendedor: sellerName,
                        tecnico: '',
                        descripcion: `Servicio ${selectedService.label}. Cotización: ${cotNumero}.`,
                        monto: total,
                        fecha_creado: fechaActual,
                        cotizacion_id: cotId
                    });
            } catch (dbErr) {
                console.warn("Hubo un problema con la base de datos, procediendo a impresión únicamente.", dbErr);
            }

            window.print();

            setTimeout(() => {
                router.push('/ordenes');
            }, 1500);
        } catch (error: any) {
            console.error('Error generating quotation:', error);
            alert(`Error al generar la cotización: ${error.message || 'Error desconocido'}`);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* ── Header ───────────────────────── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
                <div>
                    <h2 className="text-xl font-bold text-retarder-black flex items-center gap-2">
                        <ClipboardCheck size={22} className="text-retarder-red" />
                        Cotizador de Servicios
                    </h2>
                    <p className="text-xs text-retarder-gray-500">
                        Selecciona el tipo de servicio y genera la cotización automáticamente
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 bg-white rounded-2xl border border-retarder-gray-200 px-5 py-3 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-retarder-yellow-50 rounded-lg">
                                <DollarSign size={16} className="text-retarder-yellow" />
                            </div>
                            <div>
                                <p className="text-[9px] font-semibold uppercase tracking-wider text-retarder-gray-400">T.C. USD</p>
                                <p className="text-[10px] text-retarder-gray-400">{tipoCambio.toFixed(2)}</p>
                            </div>
                            <button
                                onClick={() => fetchTipoCambio()}
                                className="p-2 rounded-lg hover:bg-retarder-gray-100 transition-colors ml-1"
                                title="Actualizar tipo de cambio desde red"
                            >
                                <RefreshCw size={14} className="text-retarder-gray-400" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white rounded-2xl border border-retarder-gray-200 px-5 py-3 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Building2 size={16} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[9px] font-semibold uppercase tracking-wider text-retarder-gray-400">Cliente / Empresa</p>
                                <p className="text-[10px] text-retarder-gray-400">Seleccionar para O.S.</p>
                            </div>
                        </div>
                        <select
                            value={selectedClienteId}
                            onChange={(e) => setSelectedClienteId(e.target.value)}
                            className="bg-transparent border border-retarder-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-retarder-red min-w-[200px]"
                        >
                            <option value="">-- Seleccionar Cliente --</option>
                            {clientes.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre_comercial}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* ── Service Type Cards ─────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 print:hidden">
                {SERVICE_TYPES.map((service, i) => {
                    const Icon = service.icon;
                    const isSelected = selectedService?.id === service.id;
                    return (
                        <motion.button
                            key={service.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            onClick={() => {
                                if (isSelected) resetForm();
                                else {
                                    setSelectedService(service);
                                    setRefacciones([]);
                                    setManoObraItems([]);
                                    setExpandChecklist(true);
                                }
                            }}
                            className={cn(
                                'relative p-5 rounded-2xl border-2 text-left transition-all duration-300 group',
                                isSelected
                                    ? 'border-retarder-red bg-retarder-red/5 shadow-xl shadow-retarder-red/10 overflow-hidden'
                                    : service.bgColor + ' hover:shadow-md'
                            )}
                        >
                            {isSelected && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-4 right-4 bg-retarder-red rounded-full p-1"><CheckCircle2 size={20} className="text-white" /></motion.div>
                            )}
                            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors', isSelected ? 'bg-retarder-red text-white' : 'bg-white text-gray-400 group-hover:bg-white/80')}>
                                <Icon size={24} />
                            </div>
                            <p className={cn('font-bold text-lg leading-tight', isSelected ? 'text-retarder-red' : 'text-retarder-gray-800')}>{service.label}</p>
                            <p className="text-sm text-retarder-gray-500 mt-2 leading-relaxed">{service.description}</p>
                        </motion.button>
                    );
                })}
            </div>

            {/* ── Main Section (UI and Print Hidden) ─ */}
            <AnimatePresence mode="wait">
                {selectedService && (
                    <motion.div key={selectedService.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="print:hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Checklist & Items */}
                            <div className="lg:col-span-1 space-y-5">
                                {/* Checklist */}
                                <div className="bg-white rounded-2xl border border-retarder-gray-200 overflow-hidden shadow-sm">
                                    <button onClick={() => setExpandChecklist(!expandChecklist)} className="w-full flex items-center justify-between px-5 py-4 bg-retarder-gray-50 hover:bg-retarder-gray-100 transition-all font-bold text-sm text-retarder-black">
                                        <div className="flex items-center gap-2">
                                            <ClipboardCheck size={18} className="text-retarder-red" />
                                            Checklist Incluido
                                        </div>
                                        {expandChecklist ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>
                                    {expandChecklist && (
                                        <div className="px-5 py-4 space-y-4">
                                            {selectedService.checklist.map(group => (
                                                <div key={group.title}>
                                                    <p className="text-[10px] font-black uppercase text-retarder-gray-400 mb-2 tracking-widest">{group.title}</p>
                                                    <ul className="space-y-1.5">{group.items.map(item => (<li key={item} className="text-xs text-retarder-gray-700 flex items-start gap-2"><CircleDot size={8} className="mt-1 text-retarder-red" />{item}</li>))}</ul>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Mano de Obra (Concepts) */}
                                {selectedService.id === 'correctivo' && (
                                    <div className="bg-white rounded-2xl border border-retarder-gray-200 overflow-hidden shadow-sm">
                                        <div className="px-5 py-4 bg-red-50/50 border-b border-retarder-gray-200 flex justify-between items-center">
                                            <div className="flex items-center gap-2 font-bold text-sm text-retarder-black"><Wrench size={18} className="text-retarder-red" />Mano de Obra</div>
                                            <button onClick={() => setShowManoSearch(true)} className="bg-retarder-black text-white p-1.5 rounded-lg hover:bg-black/80 transition-colors"><Plus size={16} /></button>
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto divide-y divide-retarder-gray-50">
                                            {manoObraItems.length > 0 ? manoObraItems.map(item => (
                                                <div key={item.concepto.concepto} className="px-5 py-3 flex items-center justify-between gap-3 bg-white hover:bg-retarder-gray-50 transition-colors">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-retarder-black truncate">{item.concepto.concepto}</p>
                                                        <p className="text-[10px] text-retarder-gray-400 uppercase tracking-tighter">{item.concepto.categoria}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <button onClick={() => updateManoQty(item.concepto.concepto, -1)} className="w-6 h-6 rounded bg-retarder-gray-100 flex items-center justify-center"><Minus size={10} /></button>
                                                        <span className="text-xs font-bold w-4 text-center">{item.cantidad}</span>
                                                        <button onClick={() => updateManoQty(item.concepto.concepto, 1)} className="w-6 h-6 rounded bg-retarder-gray-100 flex items-center justify-center"><Plus size={10} /></button>
                                                    </div>
                                                    <p className="text-xs font-black text-right min-w-[70px] text-retarder-red">{formatMXN(item.concepto.precio_mxn * item.cantidad)}</p>
                                                </div>
                                            )) : <div className="py-10 text-center"><p className="text-xs text-retarder-gray-400 italic">No hay conceptos de mano de obra</p></div>}
                                        </div>
                                    </div>
                                )}

                                {/* Refacciones */}
                                {selectedService.allowRefacciones && (
                                    <div className="bg-white rounded-2xl border border-retarder-gray-200 overflow-hidden shadow-sm">
                                        <div className="px-5 py-4 bg-orange-50/50 border-b border-retarder-gray-200 flex justify-between items-center">
                                            <div className="flex items-center gap-2 font-bold text-sm text-retarder-black"><Package size={18} className="text-orange-500" />Refacciones</div>
                                            <button onClick={() => setShowRefSearch(true)} className="bg-orange-500 text-white p-1.5 rounded-lg hover:bg-orange-600 transition-colors"><Plus size={16} /></button>
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto divide-y divide-retarder-gray-50">
                                            {refacciones.length > 0 ? refacciones.map(item => (
                                                <div key={item.refaccion.codigo} className="px-5 py-3 flex items-center justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-retarder-gray-800 truncate">{item.refaccion.descripcion}</p>
                                                        <p className="text-[10px] text-retarder-gray-400">{item.refaccion.codigo}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <button onClick={() => updateRefQty(item.refaccion.codigo, -1)} className="w-6 h-6 rounded bg-retarder-gray-100 flex items-center justify-center"><Minus size={10} /></button>
                                                        <span className="text-xs font-bold w-4 text-center">{item.cantidad}</span>
                                                        <button onClick={() => updateRefQty(item.refaccion.codigo, 1)} className="w-6 h-6 rounded bg-retarder-gray-100 flex items-center justify-center"><Plus size={10} /></button>
                                                    </div>
                                                    <p className="text-xs font-bold text-right min-w-[70px]">{formatMXN(item.refaccion.precio_venta * item.cantidad)}</p>
                                                </div>
                                            )) : <div className="py-10 text-center"><p className="text-xs text-retarder-gray-400 italic">No hay refacciones</p></div>}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Configuration & Totals */}
                            <div className="lg:col-span-2 space-y-5">
                                <div className="bg-white rounded-2xl border border-retarder-gray-200 overflow-hidden shadow-sm p-6 space-y-6">
                                    <div className="flex items-center gap-3 border-b border-retarder-gray-100 pb-4">
                                        <div className="w-10 h-10 rounded-xl bg-retarder-red/10 text-retarder-red flex items-center justify-center"><Settings2 size={20} /></div>
                                        <div><h3 className="font-bold text-retarder-black">Personalizar Servicio</h3><p className="text-xs text-retarder-gray-500">Ajusta los valores para este cliente</p></div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {selectedService.id === 'preventivo' ? (
                                            <div className="space-y-1.5 flex flex-col justify-end">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-retarder-gray-400">Cantidad de Unidades</label>
                                                <div className="flex items-center gap-3 border border-retarder-gray-200 rounded-xl px-4 py-3 focus-within:border-retarder-red transition-all"><Truck size={18} className="text-retarder-gray-400" /><input type="number" min={1} value={cantidad} onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 1))} className="flex-1 outline-none font-bold text-lg" /></div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-retarder-gray-400">Gastos Traslado (MXN)</label>
                                                    <div className="flex items-center gap-3 border border-retarder-gray-200 rounded-xl px-4 py-3 focus-within:border-retarder-red transition-all"><Truck size={18} className="text-retarder-gray-400" /><input type="number" value={traslado || ''} onChange={e => setTraslado(parseFloat(e.target.value) || 0)} placeholder="0.00" className="flex-1 outline-none font-bold text-lg" /></div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-retarder-black to-retarder-gray-800 rounded-3xl p-8 text-white shadow-xl shadow-retarder-black/20">
                                    <div className="flex justify-between items-end border-b border-white/10 pb-6 mb-6">
                                        <div><p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Total a Pagar</p><h4 className="text-4xl font-black">{formatMXN(total)}</h4></div>
                                        <div className="text-right text-xs text-white/40"><p>Subtotal: {formatMXN(subtotal)}</p><p>IVA 16%: {formatMXN(iva)}</p></div>
                                    </div>
                                    <button onClick={handleFinalize} disabled={!selectedClienteId || subtotal <= 0 || isCreating} className={cn('w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all', !selectedClienteId || subtotal <= 0 || isCreating ? 'bg-white/10 text-white/30 cursor-not-allowed' : 'bg-retarder-red text-white hover:bg-retarder-red-700 shadow-lg shadow-retarder-red/30')}>{isCreating ? <Loader2 className="animate-spin" size={20} /> : <Printer size={20} />}Oficializar y Imprimir Cotización</button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── PROFESSIONAL PRINT AREA (PDF ONLY) ── */}
            <AnimatePresence>
                {selectedService && (
                    <div className="print-area hidden print:block bg-white p-0">
                        <div className="max-w-[800px] mx-auto bg-white overflow-hidden">
                            {/* PDF Header */}
                            <div className="flex items-center justify-between px-8 py-6 border-b-4 border-retarder-red">
                                <div><img src="/logo-retarder.png" alt="Retarder México Logo" className="h-16 object-contain" /></div>
                                <div className="text-right">
                                    <h2 className="text-xl font-black text-retarder-black tracking-tight uppercase">RETARDER MÉXICO</h2>
                                    <p className="text-xs text-retarder-gray-500 font-medium">Cotización de Servicios</p>
                                    <p className="text-[10px] text-retarder-gray-400 mt-1">Fecha: {new Date().toLocaleDateString('es-MX')}</p>
                                </div>
                            </div>

                            {/* Client Info */}
                            {(() => {
                                const cli = clientes.find(c => c.id === selectedClienteId);
                                if (!cli) return null;
                                return (
                                    <div className="px-8 py-6 mb-4 text-[10px] text-retarder-black leading-tight border-b border-retarder-gray-100">
                                        <div className="flex justify-between">
                                            <div className="space-y-1">
                                                <p className="text-sm font-black uppercase text-retarder-red mb-1">{cli.nombre_comercial}</p>
                                                <p className="font-bold text-[11px] uppercase tracking-wide">{cli.persona_contacto || cli.nombre_comercial}</p>
                                                {cli.rfc && <p><span className="font-bold">RFC:</span> {cli.rfc}</p>}
                                                {cli.direccion_fiscal && <p className="whitespace-pre-line max-w-[300px]"><span className="font-bold">DIR:</span> {cli.direccion_fiscal}</p>}
                                                {cli.telefono && <p><span className="font-bold">TEL:</span> {cli.telefono}</p>}
                                                {cli.email && <p className="text-blue-600 underline">{cli.email}</p>}
                                            </div>
                                            <div className="text-right space-y-1">
                                                <div className="grid grid-cols-[auto_1fr] gap-x-3 text-left">
                                                    <span className="font-bold">FOLIO:</span> <span className="text-retarder-red font-bold">POR ASIGNAR</span>
                                                    <span className="font-bold">SERVICIO:</span> <span className="uppercase">{selectedService.label}</span>
                                                    <span className="font-bold">VENDEDOR:</span> <span>{user?.fullName || 'VENTAS'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Service Content */}
                            <div className="px-8 py-4 grid grid-cols-2 gap-10">
                                <div>
                                    <h5 className="text-[9px] font-black uppercase border-b-2 border-retarder-gray-800 pb-1 mb-3 tracking-widest">Incluye los siguientes trabajos:</h5>
                                    <div className="space-y-2">
                                        {selectedService.checklist.map(group => (
                                            <div key={group.title}>
                                                <p className="text-[8px] font-bold uppercase text-retarder-gray-400 mb-1">{group.title}</p>
                                                <ul className="grid grid-cols-1 gap-0.5">{group.items.map(i => (<li key={i} className="text-[8px] flex items-start gap-1"><span className="text-retarder-red mt-0.5">•</span>{i}</li>))}</ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h5 className="text-[9px] font-black uppercase border-b-2 border-retarder-gray-800 pb-1 mb-3 tracking-widest">Desglose Económico:</h5>
                                    <div className="space-y-1">
                                        {selectedService.id === 'preventivo' ? (
                                            <PriceLine label={`Mano de Obra (${cantidad} unidad/es)`} mxn={cantidad * PRECIO_PREVENTIVO} />
                                        ) : (
                                            <>
                                                {manoObraItems.map(item => (
                                                    <PriceLine key={item.concepto.concepto} label={`${item.concepto.concepto} (x${item.cantidad})`} mxn={item.concepto.precio_mxn * item.cantidad} />
                                                ))}
                                                {refacciones.length > 0 && <PriceLine label={`Refacciones (${refacciones.length} items)`} mxn={totalRefacciones} />}
                                                {traslado > 0 && <PriceLine label="Desplazamiento / Traslado" mxn={traslado} />}
                                            </>
                                        )}
                                        <div className="py-2" />
                                        <PriceLine label="Subtotal" mxn={subtotal} />
                                        <PriceLine label="IVA 16%" mxn={iva} />
                                        <div className="py-1" />
                                        <PriceLine label="TOTAL" mxn={total} accent />
                                    </div>
                                </div>
                            </div>

                            {/* Observations & Notes */}
                            <div className="px-8 py-4 mt-8">
                                <div className="mb-4">
                                    <p className="text-[9px] font-black text-retarder-black uppercase mb-1 tracking-wider border-b border-retarder-gray-100 pb-1">Observaciones Técnicas / Logísticas:</p>
                                    <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={4} className="w-full text-[9px] text-retarder-gray-700 bg-transparent resize-none leading-relaxed border-none p-0 outline-none" />
                                </div>
                                <div className="mb-4">
                                    <p className="text-[9px] font-black text-retarder-red uppercase mb-1 tracking-wider">Políticas y Garantías:</p>
                                    <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} className="w-full text-[9px] text-retarder-red font-bold bg-transparent resize-none leading-relaxed border-none p-0 outline-none" />
                                </div>
                            </div>

                            {/* PDF Footer / Signature */}
                            <div className="px-8 py-10 border-t border-retarder-gray-100 flex justify-between items-end mt-12 mb-8">
                                <div><p className="text-[10px] font-black text-retarder-black leading-none">{user?.fullName || 'CRISTINA VELASCO'}</p><p className="text-[8px] text-retarder-gray-500 uppercase mt-1 tracking-widest">Área Técnica y Comercial</p><p className="text-[8px] text-retarder-red font-black mt-1">TEL. 55-7372-1633</p></div>
                                <div className="text-right space-y-0.5"><p className="text-[8px] text-retarder-gray-500">ventasyservicio@tgrpentarmexico.com</p><p className="text-[8px] font-black text-retarder-red tracking-wider">www.tgrpentarmexico.com</p></div>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Refacciones Modal ────────────────── */}
            <AnimatePresence>
                {showRefSearch && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRefSearch(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] print:hidden" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-3xl shadow-2xl z-[70] overflow-hidden max-h-[85vh] flex flex-col print:hidden">
                            <div className="px-6 py-5 bg-gradient-to-r from-orange-500 to-orange-700 flex justify-between items-center"><div className="flex items-center gap-3 text-white"><Package size={20} /><h3 className="font-bold">Seleccionar Refacciones</h3></div><button onClick={() => setShowRefSearch(false)} className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-xl transition-all"><X size={20} /></button></div>
                            <div className="p-6 border-b border-retarder-gray-100 space-y-4"><div className="flex items-center gap-3 bg-retarder-gray-50 rounded-2xl px-5 py-3 border border-retarder-gray-200 focus-within:border-retarder-red transition-all"><SearchIcon size={18} className="text-retarder-gray-400" /><input type="text" placeholder="Buscar por código, descripción..." value={refSearch} onChange={e => setRefSearch(e.target.value)} className="bg-transparent outline-none text-sm w-full font-medium" autoFocus /></div><div className="flex gap-2 overflow-x-auto pb-1"><button onClick={() => setRefCategory('all')} className={cn('px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap', refCategory === 'all' ? 'bg-retarder-black text-white' : 'bg-white text-retarder-gray-500 hover:bg-retarder-gray-50')}>Todas</button>{REFACCION_CATEGORIAS.map(cat => (<button key={cat} onClick={() => setRefCategory(cat)} className={cn('px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap', refCategory === cat ? 'bg-retarder-black text-white' : 'bg-white text-retarder-gray-500 hover:bg-retarder-gray-50')}>{cat}</button>))}</div></div>
                            <div className="overflow-y-auto flex-1 p-2 space-y-1">{filteredRefs.map(ref => (<div key={ref.codigo} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-retarder-gray-50 transition-all border border-transparent hover:border-retarder-gray-100"><div className="flex-1 min-w-0"><p className="text-xs font-black text-retarder-black group-hover:text-retarder-red transition-colors">{ref.descripcion}</p><p className="text-[10px] text-retarder-gray-400 font-bold uppercase tracking-widest mt-0.5">{ref.codigo} • {ref.area}</p></div><div className="flex items-center gap-6"><p className="text-sm font-black text-retarder-black">{formatMXN(ref.precio_venta)}</p><button onClick={() => { addRefaccion(ref); setShowRefSearch(false); }} className="bg-orange-500 text-white p-2.5 rounded-xl hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-all"><Plus size={18} /></button></div></div>))}</div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Mano de Obra Modal ───────────────── */}
            <AnimatePresence>
                {showManoSearch && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowManoSearch(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] print:hidden" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-3xl shadow-2xl z-[70] overflow-hidden max-h-[85vh] flex flex-col print:hidden">
                            <div className="px-6 py-5 bg-gradient-to-r from-retarder-black to-retarder-gray-800 flex justify-between items-center"><div className="flex items-center gap-3 text-white"><Wrench size={20} /><h3 className="font-bold">Seleccionar Mano de Obra</h3></div><button onClick={() => setShowManoSearch(false)} className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-xl transition-all"><X size={20} /></button></div>
                            <div className="p-6 border-b border-retarder-gray-100 space-y-4"><div className="flex items-center gap-3 bg-retarder-gray-50 rounded-2xl px-5 py-3 border border-retarder-gray-200 focus-within:border-retarder-red transition-all"><SearchIcon size={18} className="text-retarder-gray-400" /><input type="text" placeholder="Buscar concepto o categoría..." value={manoSearch} onChange={e => setManoSearch(e.target.value)} className="bg-transparent outline-none text-sm w-full font-medium" autoFocus /></div><div className="flex gap-2 overflow-x-auto pb-1"><button onClick={() => setManoCategory('all')} className={cn('px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap', manoCategory === 'all' ? 'bg-retarder-black text-white' : 'bg-white text-retarder-gray-500 hover:bg-retarder-gray-50')}>Todas</button>{CATEGORIAS_MANO_OBRA.map(cat => (<button key={cat} onClick={() => setManoCategory(cat)} className={cn('px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap', manoCategory === cat ? 'bg-retarder-black text-white' : 'bg-white text-retarder-gray-500 hover:bg-retarder-gray-50')}>Todas</button>))}</div></div>
                            <div className="overflow-y-auto flex-1 p-2 space-y-1">{filteredMano.map(item => (<div key={item.concepto} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-retarder-gray-50 transition-all border border-transparent hover:border-retarder-gray-100"><div className="flex-1 min-w-0"><p className="text-xs font-black text-retarder-black group-hover:text-retarder-red transition-colors">{item.concepto}</p><p className="text-[10px] text-retarder-gray-400 font-bold uppercase tracking-widest mt-0.5">{item.categoria}</p></div><div className="flex items-center gap-6"><p className="text-sm font-black text-retarder-black">{formatMXN(item.precio_mxn)}</p><button onClick={() => { addManoObra(item); setShowManoSearch(false); }} className="bg-retarder-red text-white p-2.5 rounded-xl hover:bg-retarder-red-700 shadow-md shadow-retarder-red/20 transition-all"><Plus size={18} /></button></div></div>))}</div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area { position: absolute; left: 0; top: 0; width: 100%; height: auto; background: white !important; }
                    @page { margin: 10mm; size: A4 portrait; }
                    .print\\:hidden { display: none !important; }
                    textarea { overflow: hidden !important; resize: none !important; border: none !important; }
                }
            `}</style>
        </div>
    );
}
