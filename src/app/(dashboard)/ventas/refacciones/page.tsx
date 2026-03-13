'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    Printer,
    Package,
    X,
    Building2,
    Loader2,
    Wrench,
    TrendingUp,
    Settings2,
    Check,
    DollarSign,
    RefreshCw,
    CheckCircle2
} from 'lucide-react';
import { cn, formatMXN } from '@/lib/utils';
import {
    CATALOGO_REFACCIONES,
    REFACCION_CATEGORIAS,
    type Refaccion,
} from '@/lib/data/catalogo-refacciones';
import { numeroALetras } from '@/lib/utils/numeroALetras';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@/lib/supabase/client';
import { useExchangeRate } from '@/hooks/useExchangeRate';

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

// ── Cart Item ───────────────────────────────────────

interface CartItem {
    refaccion: Refaccion;
    cantidad: number;
}

// ── Category Colors ─────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
    'CARDANES': 'bg-blue-100 text-blue-700',
    'DESGLOSE DE FRENO': 'bg-red-100 text-red-700',
    'ELECTRICO': 'bg-yellow-100 text-yellow-700',
    'ENGRASE': 'bg-emerald-100 text-emerald-700',
    'FRENO COMPLETO': 'bg-purple-100 text-purple-700',
    'MATERIAL ADICIONAL': 'bg-orange-100 text-orange-700',
    'NEHUMATICO': 'bg-cyan-100 text-cyan-700',
    'SOPORTERIA': 'bg-pink-100 text-pink-700',
    'TORNILLO': 'bg-gray-100 text-gray-700',
};

// ── Price Line Component ────────────────────────────

function PriceLine({
    label,
    icon,
    mxn,
    delay = 0,
    accent = false,
}: {
    label: string;
    icon: React.ReactNode;
    mxn: number;
    delay?: number;
    accent?: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: 0.3 }}
            className={cn(
                'flex items-center justify-between py-2 px-4 rounded-xl transition-colors',
                accent
                    ? 'bg-gradient-to-r from-retarder-red to-retarder-red-700 text-white shadow-lg shadow-retarder-red/20'
                    : 'bg-retarder-gray-50 hover:bg-retarder-gray-100'
            )}
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    'p-1.5 rounded-lg',
                    accent ? 'bg-white/20' : 'bg-white shadow-sm'
                )}>
                    {icon}
                </div>
                <span className={cn(
                    'font-semibold text-xs',
                    accent ? 'text-white' : 'text-retarder-gray-700'
                )}>{label}</span>
            </div>
            <div className="text-right min-w-[120px]">
                <p className={cn(
                    'font-bold font-mono',
                    accent ? 'text-lg text-white' : 'text-sm text-retarder-gray-800'
                )}>{formatMXN(mxn)}</p>
            </div>
        </motion.div>
    );
}

// ── Page Component ──────────────────────────────────

export default function CotizadorRefaccionesPage() {
    const router = useRouter();
    const { user } = useUser();
    const cotizacionRef = useRef<HTMLDivElement>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const { tipoCambio, setTipoCambio, refresh: fetchTipoCambio, isLoading: isLoadingTC, source: tcSource, fecha: tcFecha } = useExchangeRate();

    const [clientes, setClientes] = useState<ClienteCompact[]>([]);
    const [selectedClienteId, setSelectedClienteId] = useState<string>('');
    const [clientSearch, setClientSearch] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [savedFolio, setSavedFolio] = useState<string>('');
    const [traslado, setTraslado] = useState<number>(0);
    const [autoPrint, setAutoPrint] = useState(false); // Changed default to false
    const [redirectTimer, setRedirectTimer] = useState<number | null>(null);

    // Editable Observations and Notes
    const [observaciones, setObservaciones] = useState(
        '*ESTOS PRECIOS NO INCLUYEN INSTALACIÓN\n*TIEMPO DE ENTREGA: DE 3 A 5 DÍAS HÁBILES SEGÚN EXISTENCIA\n*ENVÍO POR CUENTA DEL CLIENTE\n*UNA VEZ REALIZADO EL PAGO SE GENERA LA GUÍA DE ENVÍO'
    );
    const [notas, setNotas] = useState(
        '*COTIZACIÓN VÁLIDA POR 15 DÍAS\n*EQUIPO NUEVO CON GARANTÍA CONTRA DEFECTOS DE FÁBRICA'
    );

    const [refacciones, setRefacciones] = useState<any[]>([]);
    const [loadingRefacciones, setLoadingRefacciones] = useState(true);

    const ITEMS_PER_PAGE = 50;

    // Fetch de Clientes
    const fetchClientes = useCallback(async () => {
        const { data } = await supabase.from('empresas').select('id, nombre_comercial, razon_social, rfc, direccion_fiscal, email, telefono, persona_contacto').order('nombre_comercial');
        if (data && data.length > 0) {
            setClientes(data as any[]);
        }
    }, []);


    const fetchRefacciones = useCallback(async () => {
        setLoadingRefacciones(true);
        try {
            const { data, error } = await supabase.from('cat_refacciones').select('*').order('nombre');
            if (error) throw error;
            if (data) {
                // Mapear a formato esperado por el resto del componente
                const mapped = data.map(r => ({
                    ...r,
                    descripcion: r.nombre, // Compatibilidad
                    area: r.categoria,      // Compatibilidad
                }));
                setRefacciones(mapped);
            }
        } catch (error) {
            console.error('Error fetching refacciones:', error);
        } finally {
            setLoadingRefacciones(false);
        }
    }, []);

    useEffect(() => {
        fetchClientes();
        fetchRefacciones();
    }, [fetchClientes, fetchRefacciones]);

    useEffect(() => {
        if (savedFolio) {
            const timer = window.setTimeout(() => {
                router.push('/oportunidades/ordenes');
            }, 5000);
            setRedirectTimer(timer as any);
            return () => clearTimeout(timer);
        }
    }, [savedFolio, router]);

    // Filtered + paginated results
    const filtered = useMemo(() => {
        let result = refacciones;
        if (selectedCategory !== 'all') {
            result = result.filter(r => r.categoria === selectedCategory);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(r =>
                (r.codigo || '').toLowerCase().includes(q) ||
                (r.nombre || '').toLowerCase().includes(q) ||
                (r.categoria || '').toLowerCase().includes(q) ||
                (r.modelo_freno || '').toLowerCase().includes(q)
            );
        }
        return result;
    }, [refacciones, selectedCategory, searchQuery]);

    const filteredClientes = useMemo(() => {
        if (!clientSearch.trim()) return clientes;
        const q = clientSearch.toLowerCase();
        return clientes.filter(c => c.nombre_comercial.toLowerCase().includes(q) || (c.razon_social || '').toLowerCase().includes(q));
    }, [clientes, clientSearch]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Cart actions
    const addToCart = useCallback((refaccion: Refaccion) => {
        setCart(prev => {
            const existing = prev.find(item => item.refaccion.codigo === refaccion.codigo);
            if (existing) {
                return prev.map(item =>
                    item.refaccion.codigo === refaccion.codigo
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                );
            }
            return [...prev, { refaccion, cantidad: 1 }];
        });
        setShowCart(true);
    }, []);

    const updateQuantity = useCallback((codigo: string, delta: number) => {
        setCart(prev => prev
            .map(item => item.refaccion.codigo === codigo ? { ...item, cantidad: Math.max(0, item.cantidad + delta) } : item)
            .filter(item => item.cantidad > 0)
        );
    }, []);

    const removeFromCart = useCallback((codigo: string) => {
        setCart(prev => prev.filter(item => item.refaccion.codigo !== codigo));
    }, []);

    const clearCart = useCallback(() => setCart([]), []);

    // Cart totals
    const cartTotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.refaccion.precio_venta * item.cantidad, 0);
    }, [cart]);

    const cartCount = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.cantidad, 0);
    }, [cart]);

    // Category counts
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        refacciones.forEach(r => {
            counts[r.categoria] = (counts[r.categoria] || 0) + 1;
        });
        return counts;
    }, [refacciones]);

    const handleFinalize = async () => {
        if (cart.length === 0 || !selectedClienteId) {
            alert('Por favor agrega refacciones y selecciona un cliente.');
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

            const subtotal = cartTotal + traslado;
            const iva = subtotal * 0.16;
            const total = subtotal + iva;

            try {
                const { count: cotCount, error: countErr1 } = await supabase.from('cotizaciones').select('*', { count: 'exact', head: true });
                const { count: osCount, error: countErr2 } = await supabase.from('ordenes_servicio').select('*', { count: 'exact', head: true });

                if (!countErr1 && !countErr2) {
                    const nextCotIdx = (cotCount || 0) + 1;
                    const nextOsIdx = (osCount || 0) + 1;
                    cotNumero = `COT-${String(nextCotIdx).padStart(4, '0')}`;
                    osNumero = `OS-${String(nextOsIdx).padStart(4, '0')}`;
                }

                // 1. Crear Cotización
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
                        vigencia_dias: 15,
                        notas: `TC: ${tipoCambio} MXN (${tcFecha || 'N/A'})`
                    })
                    .select()
                    .single();

                if (!cotError && cotData) {
                    cotId = cotData.id;
                }

                // 2. Crear Orden de Servicio
                await supabase
                    .from('ordenes_servicio')
                    .insert({
                        numero: osNumero,
                        empresa: cliente?.nombre_comercial || 'Sin empresa',
                        tipo: 'correctivo',
                        estado: 'solicitud_recibida',
                        prioridad: 'media',
                        vendedor: sellerName,
                        tecnico: '',
                        descripcion: `Venta de refacciones. Cotización: ${cotNumero}. Items: ${cart.map(i => `${i.refaccion.codigo} (${i.cantidad})`).join(', ')}`,
                        monto: total,
                        fecha_creado: fechaActual,
                        cotizacion_id: cotId
                    });
            } catch (dbError: any) {
                console.warn("No se pudo guardar en Supabase. Generando solo PDF.", dbError);
            }

            setSavedFolio(cotNumero);

            // Auto-trigger print
            if (autoPrint) {
                setTimeout(() => {
                    const oldTitle = document.title;
                    document.title = cotNumero;
                    window.print();
                    setTimeout(() => { document.title = oldTitle; }, 100);
                }, 500);
            }
        } catch (error: any) {
            console.error('Error generating quotation:', error);
            alert(`Error al generar la cotización: ${error.message || 'Error desconocido'}`);
        } finally {
            setIsCreating(false);
        }
    };

    const isInCart = (codigo: string) => cart.some(item => item.refaccion.codigo === codigo);

    return (
        <div className="space-y-4">
            {/* ── Header ───────────────────────────── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 print:hidden">
                <div>
                    <h2 className="text-xl font-bold text-retarder-black flex items-center gap-2">
                        <Wrench size={22} className="text-retarder-red" />
                        Cotizador de Refacciones
                    </h2>
                    <p className="text-xs text-retarder-gray-500">
                        {refacciones.length} productos · {REFACCION_CATEGORIAS.length} categorías
                    </p>
                </div>

                <div className="flex flex-col items-start gap-1 bg-white rounded-2xl border border-retarder-gray-200 px-5 py-3 shadow-sm">
                    <div className="flex items-center gap-2 w-full justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-retarder-yellow-50 rounded-lg">
                                <DollarSign size={16} className="text-retarder-yellow" />
                            </div>
                            <div>
                                <p className="text-[9px] font-semibold uppercase tracking-wider text-retarder-gray-400">T.C. USD</p>
                                <p className="text-[10px] font-bold text-retarder-gray-700">${tipoCambio.toFixed(4)}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => fetchTipoCambio()}
                            disabled={isLoadingTC}
                            className="p-2 rounded-lg hover:bg-retarder-gray-100 transition-colors ml-1"
                            title="Actualizar tipo de cambio"
                        >
                            {isLoadingTC ? <RefreshCw size={14} className="animate-spin text-retarder-gray-400" /> : <RefreshCw size={14} className="text-retarder-gray-400 hover:text-retarder-red" />}
                        </button>
                    </div>
                    {tcSource && (
                        <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold tracking-wider mt-1 inline-flex items-center gap-1",
                            tcSource?.includes('DOF') ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                tcSource?.includes('Mercado') ? "bg-blue-50 text-blue-700 border border-blue-200" :
                                    "bg-amber-50 text-amber-700 border border-amber-200"
                        )}>
                            {tcSource?.includes('DOF') ? (
                                <><Check size={10} className="text-emerald-600" /> DOF Oficial ({tcFecha})</>
                            ) : tcSource?.includes('Mercado') ? (
                                <><TrendingUp size={10} className="text-blue-600" /> Mercado ({tcFecha})</>
                            ) : (
                                <><Settings2 size={10} className="text-amber-600" /> Por defecto ({tcFecha})</>
                            )}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="flex items-center gap-1 bg-retarder-gray-100 rounded-lg px-3 py-2 flex-1 lg:flex-initial">
                        <Search size={14} className="text-retarder-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar código, descripción, modelo..."
                            value={searchQuery}
                            onChange={e => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-transparent border-none outline-none text-sm w-full lg:w-64"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setCurrentPage(1);
                                }}
                                className="p-0.5 hover:bg-retarder-gray-200 rounded"
                            >
                                <X size={12} className="text-retarder-gray-400" />
                            </button>
                        )}
                    </div>

                    {/* Cart button */}
                    <button
                        onClick={() => setShowCart(!showCart)}
                        className={cn(
                            'relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                            showCart || cart.length > 0
                                ? 'bg-retarder-red text-white shadow-md shadow-retarder-red/20'
                                : 'bg-retarder-gray-100 text-retarder-gray-500 hover:bg-retarder-gray-200'
                        )}
                    >
                        <ShoppingCart size={16} />
                        <span className="hidden sm:inline">Cotización</span>
                        {cartCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-white text-retarder-red text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-retarder-red">
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Category Filters ────────────────── */}
            <div className="flex gap-2 overflow-x-auto pb-1 print:hidden">
                <button
                    onClick={() => {
                        setSelectedCategory('all');
                        setCurrentPage(1);
                    }}
                    className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border',
                        selectedCategory === 'all'
                            ? 'bg-retarder-black text-white border-retarder-black'
                            : 'bg-white text-retarder-gray-600 border-retarder-gray-200 hover:bg-retarder-gray-50'
                    )}
                >
                    Todas ({refacciones.length})
                </button>
                {REFACCION_CATEGORIAS.map(cat => (
                    <button
                        key={cat}
                        onClick={() => {
                            setSelectedCategory(cat);
                            setCurrentPage(1);
                        }}
                        className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border',
                            selectedCategory === cat
                                ? 'bg-retarder-black text-white border-retarder-black'
                                : 'bg-white text-retarder-gray-600 border-retarder-gray-200 hover:bg-retarder-gray-50'
                        )}
                    >
                        {cat} ({categoryCounts[cat] || 0})
                    </button>
                ))}
            </div>

            {/* ── Results info ────────────────────── */}
            <div className="flex items-center justify-between print:hidden">
                <p className="text-xs text-retarder-gray-400">
                    {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} · Página {currentPage} de {totalPages || 1}
                </p>
                {filtered.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage <= 1}
                            className="px-2 py-1 text-xs rounded border border-retarder-gray-200 hover:bg-retarder-gray-50 disabled:opacity-30"
                        >
                            ← Anterior
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="px-2 py-1 text-xs rounded border border-retarder-gray-200 hover:bg-retarder-gray-50 disabled:opacity-30"
                        >
                            Siguiente →
                        </button>
                    </div>
                )}
            </div>

            <div className="flex gap-4">
                {/* ── Product Table ───────────────── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                        'bg-white rounded-xl border border-retarder-gray-200 overflow-hidden shadow-sm transition-all print:hidden',
                        showCart ? 'flex-1' : 'w-full'
                    )}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-retarder-gray-50">
                                <tr className="border-b border-retarder-gray-200">
                                    <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Código</th>
                                    <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Descripción</th>
                                    <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden md:table-cell">Categoría</th>
                                    <th className="text-left py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase hidden lg:table-cell">Modelo</th>
                                    <th className="text-right py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase">Precio</th>
                                    <th className="text-center py-3 px-4 text-[10px] font-semibold text-retarder-gray-400 uppercase w-20"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((ref, i) => (
                                    <motion.tr
                                        key={ref.codigo + '-' + i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: Math.min(i * 0.01, 0.3) }}
                                        className={cn(
                                            'border-b border-retarder-gray-50 hover:bg-retarder-gray-50 transition-colors',
                                            isInCart(ref.codigo) && 'bg-retarder-red/5'
                                        )}
                                    >
                                        <td className="py-2.5 px-4 font-mono text-xs font-bold text-retarder-red whitespace-nowrap">{ref.codigo}</td>
                                        <td className="py-2.5 px-4 text-retarder-gray-800 text-xs">{ref.descripcion}</td>
                                        <td className="py-2.5 px-4 hidden md:table-cell">
                                            <span className={cn('text-[9px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap', CATEGORY_COLORS[ref.area] || 'bg-gray-100 text-gray-600')}>
                                                {ref.area}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-4 text-[10px] text-retarder-gray-400 hidden lg:table-cell max-w-[200px] truncate">
                                            {ref.modelo_freno || '—'}
                                        </td>
                                        <td className="py-2.5 px-4 text-right font-bold text-retarder-gray-800 whitespace-nowrap">{formatMXN(ref.precio_venta)}</td>
                                        <td className="py-2.5 px-4 text-center">
                                            <button
                                                onClick={() => addToCart(ref)}
                                                className={cn(
                                                    'p-1.5 rounded-lg transition-all',
                                                    isInCart(ref.codigo)
                                                        ? 'bg-retarder-red/10 text-retarder-red'
                                                        : 'hover:bg-retarder-gray-100 text-retarder-gray-400 hover:text-retarder-red'
                                                )}
                                                title="Agregar a cotización"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* ── Cart Sidebar (UI Only) ────────── */}
                <AnimatePresence>
                    {showCart && (
                        <motion.div
                            initial={{ opacity: 0, x: 380 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 380 }}
                            transition={{ duration: 0.3, type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 w-full sm:w-[380px] bg-white z-50 shadow-2xl lg:relative lg:inset-auto lg:block lg:shadow-none print:hidden"
                        >
                            {/* Mobile overlay backdrop */}
                            <div
                                className="lg:hidden fixed inset-0 bg-black/40 -z-10"
                                onClick={() => setShowCart(false)}
                            />
                            <div className="bg-white rounded-xl border border-retarder-gray-200 shadow-lg overflow-hidden sticky top-4 max-h-[calc(100vh-2rem)] flex flex-col">
                                <div className="bg-gradient-to-r from-retarder-black to-retarder-gray-800 px-4 py-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-bold text-sm">Cotización</p>
                                        <p className="text-white/50 text-[10px]">{cart.length} productos · {cartCount} unidades</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={clearCart} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white" title="Vaciar"><Trash2 size={14} /></button>
                                        <button onClick={() => setShowCart(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"><X size={14} /></button>
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-50/50 border-b border-blue-100 shrink-0">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                                            <Building2 size={10} /> Cliente / Empresa
                                        </label>
                                        <div className="relative">
                                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-retarder-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Buscar cliente..."
                                                value={clientSearch}
                                                onChange={e => setClientSearch(e.target.value)}
                                                className="w-full bg-white border border-retarder-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:border-retarder-red transition-all"
                                            />
                                        </div>
                                        <select
                                            value={selectedClienteId}
                                            onChange={(e) => setSelectedClienteId(e.target.value)}
                                            className="w-full bg-white border border-retarder-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-retarder-red"
                                        >
                                            <option value="">-- Seleccionar --</option>
                                            {filteredClientes.map(c => (
                                                <option key={c.id} value={c.id}>{(c as any).nombre_comercial || (c as any).razon_social || 'Empresa sin nombre'}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-retarder-gray-50 bg-retarder-gray-50/30">
                                    {cart.map(item => (
                                        <div key={item.refaccion.codigo} className="px-4 py-3 bg-white hover:bg-retarder-gray-50 transition-colors">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-mono text-[10px] font-bold text-retarder-red">{item.refaccion.codigo}</p>
                                                    <p className="text-xs text-retarder-gray-700 truncate">{item.refaccion.descripcion}</p>
                                                    <p className="text-[10px] text-retarder-gray-400 mt-0.5">{formatMXN(item.refaccion.precio_venta)} c/u</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => updateQuantity(item.refaccion.codigo, -1)} className="w-6 h-6 rounded bg-retarder-gray-100 flex items-center justify-center"><Minus size={10} /></button>
                                                    <span className="w-8 text-center text-xs font-bold">{item.cantidad}</span>
                                                    <button onClick={() => updateQuantity(item.refaccion.codigo, 1)} className="w-6 h-6 rounded bg-retarder-gray-100 flex items-center justify-center"><Plus size={10} /></button>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className={cn('text-[9px] font-semibold px-1.5 py-0.5 rounded-full', CATEGORY_COLORS[item.refaccion.area] || 'bg-gray-100 text-gray-600')}>{item.refaccion.area}</span>
                                                <p className="text-xs font-bold text-retarder-gray-800">{formatMXN(item.refaccion.precio_venta * item.cantidad)}</p>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="p-4 space-y-4 border-t border-retarder-gray-100">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-retarder-gray-400 px-1">Gastos de Traslado (MXN)</label>
                                            <input
                                                type="number"
                                                value={traslado || ''}
                                                onChange={e => setTraslado(parseFloat(e.target.value) || 0)}
                                                placeholder="0.00"
                                                className="w-full bg-white border border-retarder-gray-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-retarder-red transition-all"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-retarder-gray-400 px-1">Observaciones</label>
                                            <textarea
                                                value={observaciones}
                                                onChange={e => setObservaciones(e.target.value)}
                                                className="w-full bg-white border border-retarder-gray-200 rounded-lg px-3 py-2 text-[10px] outline-none focus:border-retarder-red min-h-[60px] resize-none"
                                                placeholder="Notas internas o técnicas..."
                                            />
                                        </div>

                                        <div className="flex flex-col gap-1.5 pb-2">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-retarder-gray-400 px-1">Notas Vigencia/Garantía</label>
                                            <textarea
                                                value={notas}
                                                onChange={e => setNotas(e.target.value)}
                                                className="w-full bg-white border border-retarder-gray-200 rounded-lg px-3 py-2 text-[10px] outline-none focus:border-retarder-red min-h-[40px] resize-none"
                                                placeholder="Ej: Precios sujetos a cambio..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 border-t border-retarder-gray-100 bg-white space-y-3 shrink-0">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-retarder-gray-500"><span>Subtotal Refacciones</span><span>{formatMXN(cartTotal)}</span></div>
                                        {traslado > 0 && <div className="flex justify-between text-xs text-retarder-gray-500"><span>Gastos Traslado</span><span>{formatMXN(traslado)}</span></div>}
                                        <div className="flex justify-between text-xs text-retarder-gray-500"><span>IVA (16%)</span><span>{formatMXN((cartTotal + traslado) * 0.16)}</span></div>
                                        <div className="flex justify-between pt-2 border-t border-retarder-gray-200">
                                            <span className="font-bold text-sm text-retarder-gray-700">Total</span>
                                            <span className="font-bold text-lg text-retarder-red">{formatMXN((cartTotal + traslado) * 1.16)}</span>
                                        </div>
                                    </div>

                                    {savedFolio && (
                                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl animate-in fade-in zoom-in duration-300">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                                                    <CheckCircle2 size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-green-800 font-black text-sm uppercase">¡Cotización Guardada Exitosamente!</p>
                                                    <p className="text-green-600 text-[10px] font-bold uppercase tracking-wider">Folio: {savedFolio}. Redirigiendo al Pipeline en 5s...</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="pt-1 pb-4">
                                        {savedFolio ? (
                                            <div className="space-y-3">
                                                <button
                                                    onClick={() => {
                                                        const oldTitle = document.title;
                                                        document.title = savedFolio;
                                                        window.print();
                                                        setTimeout(() => { document.title = oldTitle; }, 100);
                                                    }}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-retarder-red text-white rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg"
                                                >
                                                    <Printer size={18} /> IMPRIMIR PDF
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setCart([]);
                                                        setSavedFolio('');
                                                        if (redirectTimer) clearTimeout(redirectTimer);
                                                    }}
                                                    className="w-full py-3 bg-white border border-retarder-gray-200 text-retarder-gray-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-retarder-gray-50 transition-all"
                                                >
                                                    NUEVA COTIZACIÓN
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (redirectTimer) clearTimeout(redirectTimer);
                                                        router.push('/oportunidades/ordenes');
                                                    }}
                                                    className="w-full py-3 bg-retarder-gray-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black transition-all"
                                                >
                                                    IR A ÓRDENES
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 px-1">
                                                    <input 
                                                        type="checkbox" 
                                                        id="autoPrintRef" 
                                                        checked={autoPrint} 
                                                        onChange={e => setAutoPrint(e.target.checked)}
                                                        className="w-4 h-4 text-retarder-red rounded focus:ring-retarder-red border-retarder-gray-300"
                                                    />
                                                    <label htmlFor="autoPrintRef" className="text-[10px] font-bold text-retarder-gray-400 cursor-pointer uppercase tracking-tight">Imprimir automáticamente al guardar</label>
                                                </div>
                                                <button
                                                    onClick={handleFinalize}
                                                    disabled={!selectedClienteId || isCreating || cart.length === 0}
                                                    className={cn(
                                                        "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg active:scale-95",
                                                        !selectedClienteId || isCreating || cart.length === 0 ? "bg-retarder-gray-200 text-retarder-gray-400 shadow-none cursor-not-allowed" : "bg-retarder-red text-white hover:bg-retarder-red-700 shadow-retarder-red/20"
                                                    )}
                                                >
                                                    {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                                                    {isCreating ? "GUARDANDO..." : "GUARDAR Y GENERAR PDF"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── PROFESSIONAL PRINT AREA ──────────────── */}
            <AnimatePresence>
                {cart.length > 0 && (
                    <div className="print-area hidden print:block bg-white p-0">
                        <div className="max-w-[800px] mx-auto bg-white overflow-hidden">
                            {/* PDF Header */}
                            <div className="flex items-center justify-between px-8 py-6 border-b-4 border-retarder-red">
                                <div><img src="/logo-retarder.png" alt="Retarder México Logo" className="h-24 object-contain" /></div>
                                <div className="text-right">
                                    <h2 className="text-xl font-black text-retarder-black tracking-tight uppercase">RETARDER MÉXICO</h2>
                                    <p className="text-xs text-retarder-gray-500 font-medium">Cotización de Refacciones</p>
                                    <p className="text-[10px] text-retarder-gray-400 mt-1">Fecha: {new Date().toLocaleDateString('es-MX')}</p>
                                </div>
                            </div>

                            {/* Client Info (PDF) */}
                            {(() => {
                                const cli = clientes.find(c => c.id === selectedClienteId);
                                if (!cli) return null;
                                return (
                                    <div className="px-8 py-4 mb-4 text-[10px] text-retarder-black leading-tight border-b border-retarder-gray-100">
                                        <div className="flex justify-between">
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-bold uppercase text-retarder-red mb-1">{cli.nombre_comercial}</p>
                                                <p className="font-bold text-[11px] uppercase">{cli.persona_contacto || cli.nombre_comercial}</p>
                                                {cli.rfc && <p><span className="font-bold">RFC:</span> {cli.rfc}</p>}
                                                {cli.direccion_fiscal && <p className="whitespace-pre-line"><span className="font-bold">DIR:</span> {cli.direccion_fiscal}</p>}
                                                {cli.email && <p className="text-blue-600 underline">{cli.email}</p>}
                                                {cli.telefono && <p>Tel: {cli.telefono}</p>}
                                            </div>
                                            <div className="text-right">
                                                <div className="grid grid-cols-[auto_1fr] gap-x-2 text-left">
                                                    <span className="font-bold">FOLIO:</span> <span className="text-retarder-red font-bold">{savedFolio || 'POR ASIGNAR'}</span>
                                                    <span className="font-bold">FECHA:</span> <span>{new Date().toLocaleDateString('es-MX')}</span>
                                                    <span className="font-bold">SUCURSAL:</span> <span>MATRIZ</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Items Table (PDF) */}
                            <div className="px-8 py-2">
                                <table className="w-full text-[10px] border-collapse">
                                    <thead>
                                        <tr className="bg-retarder-gray-800 text-white">
                                            <th className="py-2 px-3 text-left">CODIGO</th>
                                            <th className="py-2 px-3 text-left">DESCRIPCION</th>
                                            <th className="py-2 px-3 text-center">CANT</th>
                                            <th className="py-2 px-3 text-right">P. UNIT</th>
                                            <th className="py-2 px-3 text-right">SUBTOTAL</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-retarder-gray-100">
                                        {cart.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-retarder-gray-50">
                                                <td className="py-2 px-3 font-bold text-retarder-red">{item.refaccion.codigo}</td>
                                                <td className="py-2 px-3">{item.refaccion.descripcion}</td>
                                                <td className="py-2 px-3 text-center">{item.cantidad}</td>
                                                <td className="py-2 px-3 text-right">{formatMXN(item.refaccion.precio_venta)}</td>
                                                <td className="py-2 px-3 text-right font-bold">{formatMXN(item.refaccion.precio_venta * item.cantidad)}</td>
                                            </tr>
                                        ))}
                                        {traslado > 0 && (
                                            <tr className="bg-retarder-gray-50/30">
                                                <td className="py-2 px-3 font-bold text-retarder-red">SERV-TRAS</td>
                                                <td className="py-2 px-3 uppercase font-bold">Gastos de Traslado / Desplazamiento Técnico</td>
                                                <td className="py-2 px-3 text-center">1</td>
                                                <td className="py-2 px-3 text-right">{formatMXN(traslado)}</td>
                                                <td className="py-2 px-3 text-right font-bold">{formatMXN(traslado)}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals Breakdown (PDF) */}
                            <div className="px-8 py-4 flex justify-end">
                                <div className="w-64 space-y-1">
                                    <div className="flex justify-between text-[11px] text-retarder-gray-600 print:!text-black font-semibold">
                                        <span>Subtotal</span>
                                        <span>{formatMXN(cartTotal + traslado)}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px] text-retarder-gray-600 print:!text-black font-semibold">
                                        <span>IVA (16.0%)</span>
                                        <span>{formatMXN((cartTotal + traslado) * 0.16)}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t-2 border-retarder-red print:border-black">
                                        <span className="font-black text-sm text-retarder-black print:!text-black uppercase">Total Neto</span>
                                        <span className="font-black text-sm text-retarder-red print:!text-black">{formatMXN((cartTotal + traslado) * 1.16)}</span>
                                    </div>
                                    <div className="text-right pt-2 border-b border-transparent">
                                        <p className="text-[10px] font-bold text-retarder-gray-500 uppercase tracking-widest inline-block print:text-xs print:font-black print:!text-black">
                                            *({numeroALetras((cartTotal + traslado) * 1.16)})*
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Observations & Notes (PDF/UI) */}
                            <div className="px-8 py-4 mt-4 print:mt-10">
                                <div className="mb-4">
                                    <p className="text-[10px] font-black text-retarder-black uppercase mb-2 tracking-wide">OBSERVACIONES:</p>
                                    <textarea
                                        value={observaciones}
                                        onChange={(e) => setObservaciones(e.target.value)}
                                        rows={4}
                                        className="w-full text-[10px] text-retarder-gray-700 border border-retarder-gray-200 rounded-lg p-3 outline-none focus:border-retarder-red resize-none leading-relaxed print:border-none print:p-0"
                                    />
                                </div>
                                <div className="mb-4">
                                    <p className="text-[10px] font-black text-retarder-red uppercase mb-1 tracking-wide">NOTAS IMPORTANTES:</p>
                                    <textarea
                                        value={notas}
                                        onChange={(e) => setNotas(e.target.value)}
                                        rows={2}
                                        className="w-full text-[10px] text-retarder-red font-bold border border-retarder-gray-200 rounded-lg p-3 outline-none focus:border-retarder-red resize-none leading-relaxed print:border-none print:p-0"
                                    />
                                </div>
                            </div>

                            {/* Signature Footer (PDF) */}
                            <div className="px-8 py-6 border-t border-retarder-gray-100 flex justify-between items-end mt-12">
                                <div>
                                    <p className="text-[10px] font-bold text-retarder-black">{user?.fullName || 'CRISTINA VELASCO'}</p>
                                    <p className="text-[9px] text-retarder-gray-500 uppercase">Gerente de Ventas</p>
                                    <p className="text-[9px] text-retarder-red font-semibold">TEL. 55-7372-1633</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-retarder-gray-500">ventasyservicio@tgrpentarmexico.com</p>
                                    <p className="text-[9px] font-medium text-retarder-red">www.tgrpentarmexico.com</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>



            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white !important;
                    }
                    @page {
                        margin: 15mm;
                        size: A4 portrait;
                    }
                    .print\\:hidden { display: none !important; }
                    textarea { border: none !important; overflow: hidden !important; }
                }
            `}</style>
        </div >
    );
}
