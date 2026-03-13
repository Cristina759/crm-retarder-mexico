'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingCart,
    DollarSign,
    RefreshCw,
    Check,
    Package,
    Zap,
    Wrench,
    ArrowRight,
    Printer,
    Settings2,
    TrendingUp,
    Building2,
    Loader2,
    ChevronDown,
    ChevronUp,
    X,
    Truck,
    CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn, formatMXN, formatUSD, formatUserName } from '@/lib/utils';
import { numeroALetras } from '@/lib/utils/numeroALetras';
import {
    CATALOGO_FRENOS,
    TABULADOR_MANO_OBRA,
    MANO_OBRA_CATEGORIAS,
    type CatalogoFreno,
    type ManoObraItem,
} from '@/lib/utils/constants';
import { CLIENTES_REALES } from '@/lib/data/clientes-reales';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

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

// ── Price Line Component ────────────────────────────

function PriceLine({
    label,
    icon,
    usd,
    mxn,
    delay = 0,
    accent = false,
}: {
    label: string;
    icon: React.ReactNode;
    usd: number;
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
                'flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-3.5 px-4 rounded-xl transition-colors print:!flex-row print:!items-center print:!p-0 print:bg-transparent print:mb-2 print:!text-black',
                accent
                    ? 'bg-gradient-to-r from-retarder-red to-retarder-red-700 text-white shadow-lg shadow-retarder-red/20 print:bg-none print:bg-transparent print:shadow-none'
                    : 'bg-retarder-gray-50 hover:bg-retarder-gray-100'
            )}
        >
            <div className="flex items-center gap-3 mb-2 sm:mb-0">
                <div className={cn(
                    'p-2 rounded-lg print:hidden',
                    accent ? 'bg-white/20' : 'bg-white shadow-sm'
                )}>
                    {icon}
                </div>
                <span className={cn(
                    'font-semibold text-sm',
                    accent ? 'text-white print:!text-black print:font-black' : 'text-retarder-gray-700 print:!text-black font-semibold'
                )}>{label}</span>
            </div>
            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                <div className="text-left sm:text-right">
                    <p className={cn(
                        'text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider',
                        accent ? 'text-white/60 print:!text-black' : 'text-retarder-gray-400 print:!text-black'
                    )}>USD</p>
                    <p className={cn(
                        'font-bold text-xs sm:text-sm font-mono',
                        accent ? 'text-white print:!text-black' : 'text-retarder-gray-700 print:!text-black'
                    )}>{formatUSD(usd)}</p>
                </div>
                <ArrowRight size={14} className={cn("hidden sm:block print:hidden", accent ? 'text-white/40' : 'text-retarder-gray-300')} />
                <div className="text-right min-w-[100px] sm:min-w-[120px]">
                    <p className={cn(
                        'text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider',
                        accent ? 'text-white/60 print:!text-black' : 'text-retarder-gray-400 print:!text-black'
                    )}>MXN</p>
                    <p className={cn(
                        'font-bold font-mono',
                        accent ? 'text-lg sm:text-xl text-white print:!text-black print:text-lg print:font-bold' : 'text-sm text-retarder-red print:!text-black print:font-bold'
                    )}>{formatMXN(mxn)}</p>
                </div>
            </div>
        </motion.div>
    );
}

// ── Model Card ──────────────────────────────────────

function ModelCard({
    freno,
    selected,
    tipoCambio,
    onClick,
    index,
}: {
    freno: CatalogoFreno;
    selected: boolean;
    tipoCambio: number;
    onClick: () => void;
    index: number;
}) {
    const totalUSD = freno.precio_freno_usd + freno.cardanes_usd + freno.soporteria_usd + freno.material_electrico_usd;
    const totalMXN = totalUSD * tipoCambio;

    return (
        <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={onClick}
            className={cn(
                'relative text-left rounded-2xl border-2 overflow-hidden transition-all duration-300 group',
                selected
                    ? 'border-retarder-red shadow-xl shadow-retarder-red/15 scale-[1.02]'
                    : 'border-retarder-gray-200 hover:border-retarder-red/40 hover:shadow-lg',
                !freno.activo && 'opacity-60'
            )}
        >
            {/* Selected indicator */}
            {selected && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 w-6 h-6 bg-retarder-red rounded-full flex items-center justify-center z-10"
                >
                    <Check size={14} className="text-white" />
                </motion.div>
            )}

            {/* Top strip */}
            <div className={cn(
                'px-4 py-3 transition-colors',
                selected
                    ? 'bg-gradient-to-r from-retarder-red to-retarder-red-700'
                    : 'bg-gradient-to-r from-retarder-gray-800 to-retarder-gray-700 group-hover:from-retarder-red group-hover:to-retarder-red-700'
            )}>
                <p className="text-white font-bold text-lg tracking-wider">{freno.modelo}</p>
                <p className="text-white/70 text-[10px] font-medium">{freno.aplicacion}</p>
            </div>

            {/* Body */}
            <div className="p-4 bg-white space-y-3">
                {/* Brand badges with NM */}
                <div className="space-y-1.5">
                    {freno.pentar_precio_usd > 0 && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[8px] font-bold rounded">PENTAR</span>
                                <span className="text-[10px] text-retarder-gray-500">{freno.pentar_serie}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-retarder-gray-600">{freno.pentar_nm} NM · {formatUSD(freno.pentar_precio_usd)}</span>
                        </div>
                    )}
                    {freno.frenelsa_precio_usd > 0 && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-bold rounded">FRENELSA</span>
                                <span className="text-[10px] text-retarder-gray-500">{freno.frenelsa_serie}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-retarder-gray-600">{freno.frenelsa_nm} NM · {formatUSD(freno.frenelsa_precio_usd)}</span>
                        </div>
                    )}
                    {freno.cofremex_precio_usd > 0 && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-bold rounded">COFREMEX</span>
                                <span className="text-[10px] text-retarder-gray-500">{freno.cofremex_serie}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-retarder-gray-600">{freno.cofremex_nm} NM · {formatUSD(freno.cofremex_precio_usd)}</span>
                        </div>
                    )}
                    {/* Show series without price if available */}
                    {freno.frenelsa_serie && freno.frenelsa_precio_usd === 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-400 text-[8px] font-bold rounded">FRENELSA</span>
                            <span className="text-[10px] text-retarder-gray-400">{freno.frenelsa_serie} · {freno.frenelsa_nm} NM</span>
                        </div>
                    )}
                    {freno.cofremex_serie && freno.cofremex_precio_usd === 0 && freno.pentar_precio_usd > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-400 text-[8px] font-bold rounded">COFREMEX</span>
                            <span className="text-[10px] text-retarder-gray-400">{freno.cofremex_serie} · {freno.cofremex_nm} NM</span>
                        </div>
                    )}
                </div>

                {/* Price */}
                <div className="pt-2 border-t border-retarder-gray-100">
                    <p className="text-[9px] font-semibold uppercase text-retarder-gray-400">Precio Freno (Pentar)</p>
                    <p className="text-sm font-bold text-retarder-gray-700">{formatUSD(freno.precio_freno_usd)} USD</p>
                    <p className="text-[10px] text-retarder-gray-400 mt-0.5">Total instalado: <span className="font-semibold text-retarder-red">{formatMXN(totalMXN)}</span></p>
                </div>
            </div>
        </motion.button>
    );
}

// ── Main Page ───────────────────────────────────────

export default function CotizadorFrenosPage() {
    const router = useRouter();
    const { user } = useUser();
    const { tipoCambio, setTipoCambio, refresh: fetchTipoCambio, isLoading: isLoadingTC, source: tcSource, fecha: tcFecha } = useExchangeRate();
    const [selectedModelo, setSelectedModelo] = useState<CatalogoFreno | null>(null);
    const [selectedMarca, setSelectedMarca] = useState<'pentar' | 'frenelsa' | 'cofremex'>('pentar');
    const [clientes, setClientes] = useState(CLIENTES_REALES);
    const [selectedClienteId, setSelectedClienteId] = useState<string>('');
    const [clientSearch, setClientSearch] = useState('');
    const [cantidadUnidades, setCantidadUnidades] = useState<number>(1);
    const [gastosTrasladoMXN, setGastosTrasladoMXN] = useState<number>(0);
    const [isCreating, setIsCreating] = useState(false);
    const [savedFolio, setSavedFolio] = useState<string>('');
    const [autoPrint, setAutoPrint] = useState(false);
    const [redirectTimer, setRedirectTimer] = useState<number | null>(null);
    const cotizacionRef = useRef<HTMLDivElement>(null);

    const filteredClientes = useMemo(() => {
        if (!clientSearch.trim()) return CLIENTES_REALES;
        const q = clientSearch.toLowerCase();
        return CLIENTES_REALES.filter(c => 
            (c.nombre_comercial?.toLowerCase() || '').includes(q)
        );
    }, [clientSearch]);

    // Observaciones y Notas editables (valores del machote)
    const [observaciones, setObservaciones] = useState(
        '*NO INCLUYE MODIFICACIÓN DE CARDANES\n*NO INCLUYE SOLDADURAS NI OTRAS MODIFICACIONES QUE INTERFIERAN CON LA INSTALACIÓN DEL FRENO\n*SE REQUIERE EL PAGO TOTAL DEL EQUIPO POR ADELANTADO\n*GASTOS DE ENVÍO DEL FRENO POR PARTE DEL CLIENTE\n*UNA VEZ RECIBIDO EL PAGO, SE DA FECHA DE INSTALACIÓN'
    );
    const [notas, setNotas] = useState(
        '*PRECIO SUJETO A CAMBIO SIN PREVIO AVISO\n*COTIZACIÓN VÁLIDA POR 8 DÍAS\n*EQUIPO NUEVO CON GARANTÍA DE UN AÑO'
    );

    // Mano de Obra (por unidad manual)
    const [manoObraPorUnidadMXN, setManoObraPorUnidadMXN] = useState<number>(0);

    // Computed total mano de obra (multiplicado por unidades)
    const manoObraInstalacionMXN = useMemo(() => {
        return manoObraPorUnidadMXN * (cantidadUnidades || 1);
    }, [manoObraPorUnidadMXN, cantidadUnidades]);

    useEffect(() => {
        if (savedFolio) {
            const timer = window.setTimeout(() => {
                router.push('/cotizaciones');
            }, 5000);
            setRedirectTimer(timer as any);
            return () => clearTimeout(timer);
        }
    }, [savedFolio, router]);

    // Derived prices
    // Get the brake price based on selected brand
    const precioFrenoUSD = useMemo(() => {
        if (!selectedModelo) return 0;
        switch (selectedMarca) {
            case 'pentar': return selectedModelo.pentar_precio_usd;
            case 'frenelsa': return selectedModelo.frenelsa_precio_usd;
            case 'cofremex': return selectedModelo.cofremex_precio_usd;
        }
    }, [selectedModelo, selectedMarca]);

    // Get brand display name and series
    const marcaInfo = useMemo(() => {
        if (!selectedModelo) return { nombre: '', serie: '', nm: 0 };
        switch (selectedMarca) {
            case 'pentar': return { nombre: 'Pentar', serie: selectedModelo.pentar_serie, nm: selectedModelo.pentar_nm };
            case 'frenelsa': return { nombre: 'Frenelsa', serie: selectedModelo.frenelsa_serie, nm: selectedModelo.frenelsa_nm };
            case 'cofremex': return { nombre: 'Cofremex', serie: selectedModelo.cofremex_serie, nm: selectedModelo.cofremex_nm };
        }
    }, [selectedModelo, selectedMarca]);

    // Available brands for selected model
    const availableBrands = useMemo(() => {
        if (!selectedModelo) return [];
        const brands: { id: 'pentar' | 'frenelsa' | 'cofremex'; nombre: string; serie: string; nm: number; precio: number; color: string; bgColor: string }[] = [];
        if (selectedModelo.pentar_precio_usd > 0) brands.push({ id: 'pentar', nombre: 'Pentar', serie: selectedModelo.pentar_serie, nm: selectedModelo.pentar_nm, precio: selectedModelo.pentar_precio_usd, color: 'text-red-700', bgColor: 'bg-red-100 border-red-300' });
        if (selectedModelo.frenelsa_precio_usd > 0) brands.push({ id: 'frenelsa', nombre: 'Frenelsa', serie: selectedModelo.frenelsa_serie, nm: selectedModelo.frenelsa_nm, precio: selectedModelo.frenelsa_precio_usd, color: 'text-blue-700', bgColor: 'bg-blue-100 border-blue-300' });
        if (selectedModelo.cofremex_precio_usd > 0) brands.push({ id: 'cofremex', nombre: 'Cofremex', serie: selectedModelo.cofremex_serie, nm: selectedModelo.cofremex_nm, precio: selectedModelo.cofremex_precio_usd, color: 'text-amber-700', bgColor: 'bg-amber-100 border-amber-300' });
        return brands;
    }, [selectedModelo]);

    // Compute breakdown with units multiplier — usa el precio correcto por marca seleccionada
    const breakdown = useMemo(() => {
        if (!selectedModelo) return null;

        const units = cantidadUnidades || 1;
        const totalTraslado = gastosTrasladoMXN * units;

        // Precio del FRENO según la marca seleccionada (no el campo legacy)
        const precioFrenoUnitarioUSD = (() => {
            switch (selectedMarca) {
                case 'pentar': return selectedModelo.pentar_precio_usd;
                case 'frenelsa': return selectedModelo.frenelsa_precio_usd;
                case 'cofremex': return selectedModelo.cofremex_precio_usd;
                default: return selectedModelo.precio_freno_usd;
            }
        })();

        const frenoTotalUSD = precioFrenoUnitarioUSD * units;
        const total_usd = frenoTotalUSD + (selectedModelo.cardanes_usd * units) + (selectedModelo.soporteria_usd * units) + (selectedModelo.material_electrico_usd * units);
        const total_mxn = (total_usd * tipoCambio) + totalTraslado + manoObraInstalacionMXN;

        return {
            freno: { usd: frenoTotalUSD, mxn: frenoTotalUSD * tipoCambio },
            cardanes: { usd: selectedModelo.cardanes_usd * units, mxn: (selectedModelo.cardanes_usd * units) * tipoCambio },
            soporteria: { usd: selectedModelo.soporteria_usd * units, mxn: (selectedModelo.soporteria_usd * units) * tipoCambio },
            material: { usd: selectedModelo.material_electrico_usd * units, mxn: (selectedModelo.material_electrico_usd * units) * tipoCambio },
            traslado: { mxn: totalTraslado },
            manoObra: { mxn: manoObraInstalacionMXN },
            total: { usd: total_usd, mxn: total_mxn }
        };
    }, [selectedModelo, selectedMarca, tipoCambio, gastosTrasladoMXN, manoObraInstalacionMXN, cantidadUnidades]);

    const handleFinalize = async () => {
        if (!selectedModelo || !selectedClienteId) {
            alert('Por favor selecciona un modelo de freno y un cliente.');
            return;
        }
        if (!breakdown) return;

        setIsCreating(true);
        try {
            const cliente = clientes.find(c => c.id === selectedClienteId);
            const sellerName = user?.fullName || 'Sistema (Venta Directa)';
            const fechaActual = new Date().toISOString().split('T')[0];

            // Generate dummy numbers just in case DB fails
            let cotNumero = `COT-LOCAL-${Math.floor(Math.random() * 1000)}`;
            let osNumero = `OS-LOCAL-${Math.floor(Math.random() * 1000)}`;
            let cotId = "local-cot-" + Math.random();

            // Intentar guardar en Supabase (no bloquea la impresión si falla)
            try {
                // Fetch next numbers
                const { count: cotCount, error: countErr1 } = await supabase.from('cotizaciones').select('*', { count: 'exact', head: true });
                const { count: osCount, error: countErr2 } = await supabase.from('ordenes_servicio').select('*', { count: 'exact', head: true });

                if (!countErr1 && !countErr2) {
                    const nextCotIdx = (cotCount || 0) + 1;
                    const nextOsIdx = (osCount || 0) + 1;
                    cotNumero = `COT-${String(nextCotIdx).padStart(4, '0')}`;
                    osNumero = `OS-${String(nextOsIdx).padStart(4, '0')}`;
                }

                // Buscar UUID real en Supabase por nombre_comercial
                const { data: empresaData } = await supabase
                    .from('empresas')
                    .select('id')
                    .eq('nombre_comercial', cliente?.nombre_comercial);

                const empresaUUID = empresaData?.[0]?.id || null;

                // 1. Crear Cotización
                const { data: cotData, error: cotError } = await supabase
                    .from('cotizaciones')
                    .insert({
                        folio: cotNumero,
                        empresa_id: empresaUUID,
                        empresa: cliente?.nombre_comercial || 'Sin empresa',
                        cliente: cliente?.nombre_comercial || 'Sin empresa',
                        vendedor: sellerName,
                        subtotal: breakdown.total.mxn / 1.16,
                        iva: breakdown.total.mxn - (breakdown.total.mxn / 1.16),
                        total: breakdown.total.mxn,
                        tipo: 'frenos',
                        estado: 'enviada',
                        notas: `TC: ${tipoCambio} MXN (${tcFecha || 'N/A'})`
                    })
                    .select()
                    .single();

                if (cotError) {
                    console.error('ERROR INSERT COTIZACION:', JSON.stringify(cotError));
                } else {
                    console.log('COTIZACION GUARDADA:', cotData);
                }

                if (!cotError && cotData) {
                    cotId = cotData.id;
                    setSavedFolio(cotNumero);

                    // Crear Orden de Servicio automáticamente
                    await supabase.from('ordenes_servicio').insert({
                        empresa_id: empresaUUID,
                        empresa: cliente?.nombre_comercial || 'Sin empresa',
                        vendedor: sellerName,
                        estado: 'cotizacion_enviada',
                        cotizacion_id: cotData.id,
                        folio: cotData.folio,
                        tipo: 'frenos',
                        total: breakdown.total.mxn,
                        subtotal: breakdown.total.mxn / 1.16,
                        iva: breakdown.total.mxn - (breakdown.total.mxn / 1.16),
                        fecha_creado: new Date().toISOString()
                    });
                } else {
                    setSavedFolio(cotNumero);
                }

                // If autoPrint is still requested manually
                if (autoPrint) {
                    setTimeout(() => {
                        const oldTitle = document.title;
                        document.title = cotNumero;
                        window.print();
                        setTimeout(() => { document.title = oldTitle; }, 100);
                    }, 500);
                }
            } catch (dbError: any) {
                console.warn("No se pudo guardar en Supabase. Generando solo PDF.", dbError);
                setSavedFolio(cotNumero);
                if (autoPrint) {
                    setTimeout(() => window.print(), 500);
                }
            }
        } catch (error: any) {
            console.error('Error generating quotation:', error);
            alert(`Error al generar la cotización: ${error.message || 'Error desconocido'}`);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* ── Header ─────────────────────────────── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-retarder-black flex items-center gap-2">
                        <ShoppingCart size={22} className="text-retarder-red" />
                        Cotizador de Frenos
                    </h2>
                    <p className="text-xs text-retarder-gray-500 mt-1">
                        Selecciona un modelo para ver el desglose de precios con conversión USD → MXN en tiempo real
                    </p>
                </div>

                {/* Exchange rate control */}
                <div className="flex flex-wrap items-center gap-3">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 bg-white rounded-2xl border border-retarder-gray-200 px-5 py-3 shadow-sm"
                    >
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-retarder-yellow-50 rounded-lg">
                                <DollarSign size={16} className="text-retarder-yellow" />
                            </div>
                            <div>
                                <p className="text-[9px] font-semibold uppercase tracking-wider text-retarder-gray-400">Tipo de Cambio</p>
                                <p className="text-[10px] text-retarder-gray-400">USD → MXN</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-retarder-gray-400">$</span>
                            <input
                                type="number"
                                step="0.0001"
                                value={tipoCambio || ''}
                                onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                    setTipoCambio(val);
                                }}
                                className="w-28 text-lg font-bold text-retarder-black border border-retarder-gray-200 rounded-xl px-3 py-1.5 text-center focus:border-retarder-red focus:ring-2 focus:ring-retarder-red/10 outline-none"
                            />
                        </div>
                        <button
                            onClick={() => fetchTipoCambio()}
                            disabled={isLoadingTC}
                            className={cn(
                                "p-2 rounded-lg hover:bg-retarder-gray-100 transition-colors",
                            )}
                            title={`Actualizar tipo de cambio`}
                        >
                            {isLoadingTC ? <RefreshCw size={14} className="animate-spin text-retarder-gray-400" /> : <RefreshCw size={14} className="text-retarder-gray-400 hover:text-retarder-red" />}
                        </button>
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
                    </motion.div>

                    {/* Client Selection */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-2 bg-white rounded-2xl border border-retarder-gray-200 px-5 py-3 shadow-sm"
                    >
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Building2 size={16} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[9px] font-semibold uppercase tracking-wider text-retarder-gray-400">Cliente / Empresa</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="🔍 Buscar cliente..."
                                value={clientSearch}
                                onChange={(e) => setClientSearch(e.target.value)}
                                className="w-full bg-retarder-gray-50 border border-retarder-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-retarder-red transition-all"
                            />
                            <select
                                value={selectedClienteId}
                                onChange={(e) => setSelectedClienteId(e.target.value)}
                                className="w-full bg-transparent border border-retarder-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-retarder-red"
                            >
                                <option value="">-- Seleccionar --</option>
                                {filteredClientes.map(c => (
                                    <option key={c.id} value={c.id}>{c.nombre_comercial}</option>
                                ))}
                            </select>
                        </div>
                    </motion.div>

                    {/* Unidades a Instalar */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 bg-white rounded-2xl border border-retarder-gray-200 px-5 py-3 shadow-sm"
                    >
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-retarder-red/10 rounded-lg">
                                <Truck size={16} className="text-retarder-red" />
                            </div>
                            <div>
                                <p className="text-[9px] font-semibold uppercase tracking-wider text-retarder-gray-400">Unidades</p>
                                <p className="text-[10px] text-retarder-gray-400">Vehículos a instalar</p>
                            </div>
                        </div>
                        <input
                            type="number"
                            min="1"
                            step="1"
                            value={cantidadUnidades || ''}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setCantidadUnidades(isNaN(val) ? 1 : Math.max(1, val));
                            }}
                            className="w-24 text-sm font-bold text-retarder-black border border-retarder-gray-200 rounded-xl px-3 py-1.5 focus:border-retarder-red outline-none"
                        />
                    </motion.div>

                    {/* Gastos de Traslado */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 bg-white rounded-2xl border border-retarder-gray-200 px-5 py-3 shadow-sm"
                    >
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <Building2 size={16} className="text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-[9px] font-semibold uppercase tracking-wider text-retarder-gray-400">Gastos de Traslado (U.)</p>
                                <p className="text-[10px] text-retarder-gray-400">Opcional (MXN)</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-retarder-gray-400">$</span>
                            <input
                                type="number"
                                step="1"
                                placeholder="0"
                                value={gastosTrasladoMXN || ''}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setGastosTrasladoMXN(isNaN(val) ? 0 : val);
                                }}
                                className="w-24 text-sm font-bold text-retarder-black border border-retarder-gray-200 rounded-xl px-3 py-1.5 focus:border-retarder-red outline-none"
                            />
                        </div>
                    </motion.div>

                    {/* Mano de Obra — Manual */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 bg-white rounded-2xl border border-retarder-gray-200 px-5 py-3 shadow-sm"
                    >
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-orange-50 rounded-lg">
                                <Wrench size={16} className="text-orange-600" />
                            </div>
                            <div>
                                <p className="text-[9px] font-semibold uppercase tracking-wider text-retarder-gray-400">Mano de Obra (U.)</p>
                                <p className="text-[10px] text-retarder-gray-400">
                                    Opcional (MXN)
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-retarder-gray-400">$</span>
                            <input
                                type="number"
                                step="1"
                                placeholder="0"
                                value={manoObraPorUnidadMXN || ''}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setManoObraPorUnidadMXN(isNaN(val) ? 0 : val);
                                }}
                                className="w-24 text-sm font-bold text-retarder-black border border-retarder-gray-200 rounded-xl px-3 py-1.5 focus:border-retarder-red outline-none"
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
            {/* ── Model Grid ─────────────────────────── */}
            <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-3">
                    Selecciona un modelo de freno
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {CATALOGO_FRENOS.map((freno, i) => (
                        <ModelCard
                            key={freno.modelo}
                            freno={freno}
                            selected={selectedModelo?.modelo === freno.modelo}
                            tipoCambio={tipoCambio}
                            onClick={() => {
                                setSelectedModelo(freno);
                                // Auto-select first available brand
                                if (freno.pentar_precio_usd > 0) setSelectedMarca('pentar');
                                else if (freno.frenelsa_precio_usd > 0) setSelectedMarca('frenelsa');
                                else if (freno.cofremex_precio_usd > 0) setSelectedMarca('cofremex');
                                else setSelectedMarca('pentar');
                            }}
                            index={i}
                        />
                    ))}
                </div>
            </div>

            {/* ── Brand Selector ────────────────────── */}
            <AnimatePresence>
                {selectedModelo && availableBrands.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="bg-white rounded-2xl border border-retarder-gray-200 shadow-sm p-5"
                    >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-3">
                            Selecciona la marca a cotizar — {selectedModelo.modelo}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {availableBrands.map((brand) => (
                                <button
                                    key={brand.id}
                                    onClick={() => setSelectedMarca(brand.id)}
                                    className={cn(
                                        'relative flex flex-col p-4 rounded-xl border-2 transition-all duration-200 text-left',
                                        selectedMarca === brand.id
                                            ? `${brand.bgColor} shadow-md scale-[1.02]`
                                            : 'border-retarder-gray-200 hover:border-retarder-gray-300 bg-retarder-gray-50'
                                    )}
                                >
                                    {selectedMarca === brand.id && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-retarder-red rounded-full flex items-center justify-center">
                                            <Check size={12} className="text-white" />
                                        </div>
                                    )}
                                    <span className={cn(
                                        'text-xs font-bold uppercase tracking-wider',
                                        selectedMarca === brand.id ? brand.color : 'text-retarder-gray-500'
                                    )}>
                                        {brand.nombre}
                                    </span>
                                    <span className="text-sm font-bold text-retarder-gray-800 mt-1">
                                        {brand.serie}
                                    </span>
                                    <span className="text-[10px] text-retarder-gray-400">
                                        {brand.nm} NM · {formatUSD(brand.precio)} USD
                                    </span>
                                </button>
                            ))}
                        </div>
                        {availableBrands.length > 0 && (
                            <p className="text-[10px] text-retarder-gray-400 mt-3 text-center">
                                Cotizando: <span className="font-bold text-retarder-red">{marcaInfo.nombre} {marcaInfo.serie}</span> ({marcaInfo.nm} NM) — {formatUSD(precioFrenoUSD)} USD
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {breakdown && selectedModelo && (
                    <motion.div
                        ref={cotizacionRef}
                        initial={{ opacity: 0, y: 30, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: 30, height: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="print-area"
                    >
                        {savedFolio && (
                            <motion.div 
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-4 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between print:hidden"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div>
                                        <p className="text-green-800 font-black text-sm uppercase">¡Cotización Guardada Exitosamente!</p>
                                        <p className="text-green-600 text-[10px] font-bold uppercase tracking-wider">Folio: {savedFolio}. Redirigiendo al Pipeline en 5s...</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => {
                                            const oldTitle = document.title;
                                            document.title = savedFolio;
                                            window.print();
                                            setTimeout(() => { document.title = oldTitle; }, 100);
                                        }}
                                        className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-colors shadow-md shadow-green-100 uppercase"
                                    >
                                        Imprimir Ahora
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (redirectTimer) clearTimeout(redirectTimer);
                                            router.push('/cotizaciones');
                                        }}
                                        className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-colors shadow-md shadow-green-100 uppercase"
                                    >
                                        Ir al Pipeline
                                    </button>
                                </div>
                            </motion.div>
                        )}
                        <div className="bg-white rounded-2xl border border-retarder-gray-200 overflow-hidden shadow-xl print:border-none print:shadow-none">
                            {/* Header (Visible on Screen & Print) */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-6 sm:px-8 sm:py-8 border-b-2 border-retarder-gray-100 font-sans bg-white gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="bg-white p-3 border border-retarder-gray-100 rounded-xl shadow-sm">
                                        <img src="/logo-retarder.png" alt="Retarder México" className="h-24 w-auto object-contain" />
                                    </div>
                                    <div className="h-14 w-[1px] bg-retarder-gray-200 mx-1" />
                                    <div className="space-y-0.5">
                                        <div className="bg-[#FFEB3B] px-3 py-1 mb-1 inline-block border-b-2 border-black/10">
                                            <h1 className="text-2xl font-black text-retarder-black leading-none tracking-tighter uppercase whitespace-nowrap">
                                                RETARDER MÉXICO
                                            </h1>
                                        </div>
                                        <p className="text-[10px] text-retarder-gray-500 font-bold uppercase tracking-[0.2em]">Especialistas en Frenos Auxiliares</p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col justify-center">
                                    <div className="bg-retarder-red text-white px-4 py-1.5 rounded-lg mb-2 shadow-sm print:bg-white print:border-2 print:border-black">
                                        <h2 className="text-sm font-black tracking-widest uppercase print:!text-black">Cotización Oficial</h2>
                                    </div>
                                    <p className="text-[10px] text-retarder-gray-400 font-medium">Folio de Referencia:</p>
                                    <p className="text-[11px] text-retarder-black font-bold font-mono">Ref: {new Date().toISOString().slice(0, 10).replace(/-/g, '')}-FRENOS</p>
                                </div>
                            </div>

                            {/* Detalle del Cliente (Solo en PDF) */}
                            {(() => {
                                const cli = clientes.find(c => c.id === selectedClienteId);
                                if (!cli) return null;
                                return (
                                    <div className="hidden print:block px-8 py-4 mb-4 text-[10px] text-retarder-black leading-tight">
                                        <p className="text-sm font-bold mb-1 uppercase text-center border-b border-retarder-gray-200 pb-2 mb-3 tracking-wide">{cli.nombre_comercial}</p>
                                        <div className="flex justify-between">
                                            <div className="space-y-0.5">
                                                <p className="font-bold text-[11px] uppercase">{cli.persona_contacto || cli.nombre_comercial}</p>
                                                {cli.rfc && <p>{cli.rfc}</p>}
                                                {cli.direccion_fiscal && <p className="whitespace-pre-line">{cli.direccion_fiscal}</p>}
                                                {cli.email && <p className="text-blue-600 underline">{cli.email}</p>}
                                                {cli.telefono && <p>Tel: {cli.telefono}</p>}
                                            </div>
                                            <div className="text-right flex flex-col items-end justify-start">
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

                            {/* Breakdown header */}
                            <div className="bg-gradient-to-r from-retarder-black to-retarder-gray-800 px-6 py-5 print:rounded-2xl print:mb-4 print:bg-none print:bg-white print:border-2 print:border-black">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider print:!text-black">Detalle del Equipo</p>
                                        <h3 className="text-white font-bold text-xl mt-1 print:!text-black">
                                            {marcaInfo.nombre} {marcaInfo.serie} <span className="text-white/40 text-sm print:!text-black">({selectedModelo.modelo})</span>
                                        </h3>
                                        <p className="text-white/50 text-xs mt-1 print:!text-black">Para: {clientes.find(c => c.id === selectedClienteId)?.nombre_comercial || 'Cliente no seleccionado'} · {marcaInfo.nm} NM · {selectedModelo.aplicacion}</p>
                                    </div>
                                    <div className="text-right hidden sm:block">
                                        <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider print:!text-black">T.C. Extranjero</p>
                                        <p className="text-white font-bold text-lg font-mono print:!text-black">${tipoCambio.toFixed(4)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Price lines */}
                            <div className="p-6 space-y-3">
                                <PriceLine
                                    label="Freno (Retarder)"
                                    icon={<Package size={16} className="text-retarder-red" />}
                                    usd={breakdown.freno.usd}
                                    mxn={breakdown.freno.mxn}
                                    delay={0.1}
                                />
                                <PriceLine
                                    label="Cardanes"
                                    icon={<Wrench size={16} className="text-blue-500" />}
                                    usd={breakdown.cardanes.usd}
                                    mxn={breakdown.cardanes.mxn}
                                    delay={0.15}
                                />
                                <PriceLine
                                    label="Soportería"
                                    icon={<Settings2 size={16} className="text-amber-500" />}
                                    usd={breakdown.soporteria.usd}
                                    mxn={breakdown.soporteria.mxn}
                                    delay={0.2}
                                />
                                <PriceLine
                                    label="Material Eléctrico"
                                    icon={<Zap size={16} className="text-yellow-500" />}
                                    usd={breakdown.material.usd}
                                    mxn={breakdown.material.mxn}
                                    delay={0.25}
                                />
                                {gastosTrasladoMXN > 0 && (
                                    <PriceLine
                                        label={`Gastos de Traslado / Viáticos (${cantidadUnidades} u.)`}
                                        icon={<Package size={16} className="text-purple-500" />}
                                        usd={breakdown.traslado.mxn / tipoCambio}
                                        mxn={breakdown.traslado.mxn}
                                        delay={0.28}
                                    />
                                )}
                                {manoObraInstalacionMXN > 0 && (
                                    <PriceLine
                                        label={`Mano de Obra Instalación`}
                                        icon={<Wrench size={16} className="text-orange-500" />}
                                        usd={breakdown.manoObra.mxn / tipoCambio}
                                        mxn={breakdown.manoObra.mxn}
                                        delay={0.30}
                                    />
                                )}

                                {/* Divider */}
                                <div className="border-t-2 border-dashed border-retarder-gray-200 my-4" />

                                {/* Total */}
                                <PriceLine
                                    label="TOTAL INSTALADO"
                                    icon={<TrendingUp size={18} className="text-white" />}
                                    usd={breakdown.total.usd}
                                    mxn={breakdown.total.mxn}
                                    delay={0.3}
                                    accent
                                />

                                {/* Importe con letra */}
                                <div className="mt-4 text-center pb-2">
                                    <p className="text-[10px] font-bold text-retarder-gray-500 uppercase tracking-widest bg-gray-50 inline-block px-4 py-1.5 rounded-full border border-gray-100 print:bg-transparent print:border-none print:text-xs print:!text-black print:font-black">
                                        *({numeroALetras(breakdown.total.mxn)})*
                                    </p>
                                </div>
                            </div>

                            {/* ── Observaciones y Notas (editables + se imprimen) ── */}
                            <div className="px-6 py-5 border-t border-retarder-gray-200">
                                {/* OBSERVACIONES */}
                                <div className="mb-4">
                                    <p className="text-xs font-black text-retarder-black uppercase mb-2 tracking-wide">OBSERVACIONES:</p>
                                    <textarea
                                        value={observaciones}
                                        onChange={(e) => setObservaciones(e.target.value)}
                                        rows={5}
                                        className="w-full text-xs text-retarder-gray-700 border border-retarder-gray-200 rounded-lg p-3 outline-none focus:border-retarder-red resize-y leading-relaxed print:border-none print:p-0 print:resize-none"
                                        placeholder="Escribe las observaciones aquí..."
                                    />
                                </div>

                                {/* NOTAS */}
                                <div className="mb-4">
                                    <p className="text-xs font-black text-retarder-red uppercase mb-2 tracking-wide">NOTAS:</p>
                                    <textarea
                                        value={notas}
                                        onChange={(e) => setNotas(e.target.value)}
                                        rows={3}
                                        className="w-full text-xs text-retarder-red font-bold border border-retarder-gray-200 rounded-lg p-3 outline-none focus:border-retarder-red resize-y leading-relaxed print:border-none print:p-0 print:resize-none"
                                        placeholder="Escribe las notas aquí..."
                                    />
                                </div>

                                {/* Firma / Pie de Página */}
                                <div className="mt-8 pt-6 border-t border-retarder-gray-100 flex justify-between items-end">
                                    <div className="space-y-4 max-w-[50%]">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-retarder-black uppercase tracking-widest italic opacity-70">Marca del Freno:</p>
                                            <img src="/logo-pentar.png" alt="Pentar Kloft" className="h-14 w-auto object-contain" />
                                        </div>
                                        <p className="text-[9px] text-retarder-gray-500 leading-tight">
                                            Pentar Kloft Retarder es una marca registrada especializada en sistemas de frenado auxiliares electromagnéticos de alta eficiencia.
                                        </p>
                                    </div>
                                    <div className="text-right space-y-6">
                                        <div className="space-y-1">
                                            <p className="text-[9px] text-retarder-gray-400 font-bold uppercase tracking-wider">Atentamente:</p>
                                            <p className="text-sm font-black text-retarder-black uppercase">
                                                {formatUserName(user?.fullName) || 'CRISTINA VELASCO'}
                                            </p>
                                            <p className="text-[10px] font-bold text-retarder-red uppercase">Área de Ventas</p>
                                            <p className="text-[10px] font-medium text-retarder-gray-600 italic">Retarder México S.A. de C.V.</p>
                                        </div>
                                        <div className="space-y-1 text-[9px] text-retarder-gray-400 font-medium">
                                            <p>Ventas: 55-7372-1633</p>
                                            <p>Email: ventasyservicio@tgrpentarmexico.com</p>
                                            <p>Web: www.pentarkloftretarder.com</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 text-center border-t border-retarder-gray-50 pt-4">
                                    <p className="text-[9px] text-retarder-gray-300 font-medium uppercase tracking-[0.3em]">
                                        Retarder México © {new Date().getFullYear()} · Todos los derechos reservados
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-6 py-4 border-t border-retarder-gray-100 bg-retarder-gray-50 flex flex-col sm:flex-row gap-3 print:hidden">
                                {savedFolio ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                const oldTitle = document.title;
                                                document.title = savedFolio;
                                                window.print();
                                                setTimeout(() => { document.title = oldTitle; }, 100);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all shadow-md bg-retarder-red text-white hover:bg-retarder-red-700 shadow-retarder-red/20"
                                        >
                                            <Printer size={16} />
                                            IMPRIMIR COTIZACIÓN PDF
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedModelo(null);
                                                setSavedFolio('');
                                            }}
                                            className="flex-1 px-5 py-3 border border-retarder-gray-200 rounded-xl text-sm font-medium text-retarder-gray-600 hover:bg-white transition-colors"
                                        >
                                            NUEVA COTIZACIÓN
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (redirectTimer) clearTimeout(redirectTimer);
                                                router.push('/cotizaciones');
                                            }}
                                            className="px-5 py-3 bg-retarder-gray-800 text-white rounded-xl text-sm font-medium hover:bg-retarder-black transition-colors"
                                        >
                                            VER PIPELINE
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3 px-2 mb-2 sm:mb-0">
                                            <input 
                                                type="checkbox" 
                                                id="autoPrint" 
                                                checked={autoPrint} 
                                                onChange={e => setAutoPrint(e.target.checked)}
                                                className="w-4 h-4 text-retarder-red rounded focus:ring-retarder-red border-retarder-gray-300"
                                            />
                                            <label htmlFor="autoPrint" className="text-xs font-bold text-retarder-gray-500 cursor-pointer">IMPRIMIR AUTOMÁTICAMENTE</label>
                                        </div>
                                        <button
                                            onClick={handleFinalize}
                                            disabled={!selectedClienteId || !selectedModelo || isCreating}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all shadow-md",
                                                !selectedClienteId || !selectedModelo || isCreating
                                                    ? "bg-retarder-gray-200 text-retarder-gray-400 cursor-not-allowed"
                                                    : "bg-retarder-red text-white hover:bg-retarder-red-700 shadow-retarder-red/20"
                                            )}
                                        >
                                            {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                                            {isCreating ? "GUARDANDO..." : "GUARDAR Y GENERAR PDF"}
                                        </button>
                                        <button
                                            onClick={() => setSelectedModelo(null)}
                                            className="px-5 py-3 border border-retarder-gray-200 rounded-xl text-sm font-medium text-retarder-gray-600 hover:bg-white transition-colors"
                                        >
                                            Limpiar
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>



            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .print-area, .print-area * {
                        color: #000000 !important;
                    }
                    body * {
                        visibility: hidden;
                    }
                    .print-area,
                    .print-area * {
                        visibility: visible;
                    }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white !important;
                    }
                    /* Remove default margins injected by browsers for print */
                    @page {
                        margin: 20mm;
                        size: A4 portrait;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:flex {
                        display: flex !important;
                    }
                    .print\\:block {
                        display: block !important;
                    }
                    .print\\:border-none {
                        border: none !important;
                    }
                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }
                    .print\\:rounded-2xl {
                        border-radius: 1rem !important;
                    }
                    .print\\:mb-4 {
                        margin-bottom: 1rem !important;
                    }
                }
            `}</style>
        </div>
    );
}
