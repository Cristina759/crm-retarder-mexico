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
    CheckCircle2,
    FileText,
    Plus
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
import { toast, confirmModal, promptModal } from '@/lib/modals';
import { MATERIAL_ELECTRICO_BASE, type MaterialElectricoItem } from '@/lib/data/material-electrico';

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

//  Price Line Component 

function PriceLine({
    label,
    icon,
    usd,
    mxn,
    delay = 0,
    accent = false,
    editable = false,
    onLabelChange,
    onUsdChange
}: {
    label: string;
    icon: React.ReactNode;
    usd: number;
    mxn: number;
    delay?: number;
    accent?: boolean;
    editable?: boolean;
    onLabelChange?: (val: string) => void;
    onUsdChange?: (val: number) => void;
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
                {editable && onLabelChange ? (
                    <input 
                        type="text" 
                        value={label} 
                        onChange={e => onLabelChange(e.target.value)} 
                        className={cn(
                            'font-semibold text-sm bg-transparent outline-none border-b border-transparent hover:border-retarder-gray-300 focus:border-retarder-red print:border-none px-1 w-40 sm:w-64 transition-colors',
                            accent ? 'text-white border-white/30' : 'text-retarder-gray-700'
                        )} 
                        onClick={e => e.stopPropagation()}
                    />
                ) : (
                    <span className={cn(
                        'font-semibold text-sm',
                        accent ? 'text-white print:!text-black print:font-black' : 'text-retarder-gray-700 print:!text-black font-semibold'
                    )}>{label}</span>
                )}
            </div>
            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                <div className="text-left sm:text-right">
                    <p className={cn(
                        'text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider',
                        accent ? 'text-white/60 print:!text-black' : 'text-retarder-gray-400 print:!text-black'
                    )}>USD</p>
                    {editable && onUsdChange ? (
                        <input 
                            type="number" 
                            step="any"
                            value={usd} 
                            onChange={e => onUsdChange(parseFloat(e.target.value) || 0)}
                            className={cn(
                                'font-bold text-xs sm:text-sm font-mono bg-transparent outline-none border-b border-transparent hover:border-retarder-gray-300 focus:border-retarder-red print:border-none px-1 w-20 text-left sm:text-right transition-colors',
                                accent ? 'text-white border-white/30' : 'text-retarder-gray-700'
                            )}
                            onClick={e => e.stopPropagation()}
                        />
                    ) : (
                        <p className={cn(
                            'font-bold text-xs sm:text-sm font-mono',
                            accent ? 'text-white print:!text-black' : 'text-retarder-gray-700 print:!text-black'
                        )}>{formatUSD(usd)}</p>
                    )}
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

//  Model Card 

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
                            <span className="text-[10px] font-semibold text-retarder-gray-600">{freno.pentar_nm} NM  {formatUSD(freno.pentar_precio_usd)}</span>
                        </div>
                    )}
                    {freno.frenelsa_precio_usd > 0 && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-bold rounded">FRENELSA</span>
                                <span className="text-[10px] text-retarder-gray-500">{freno.frenelsa_serie}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-retarder-gray-600">{freno.frenelsa_nm} NM  {formatUSD(freno.frenelsa_precio_usd)}</span>
                        </div>
                    )}
                    {freno.cofremex_precio_usd > 0 && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-bold rounded">COFREMEX</span>
                                <span className="text-[10px] text-retarder-gray-500">{freno.cofremex_serie}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-retarder-gray-600">{freno.cofremex_nm} NM  {formatUSD(freno.cofremex_precio_usd)}</span>
                        </div>
                    )}
                    {/* Show series without price if available */}
                    {freno.frenelsa_serie && freno.frenelsa_precio_usd === 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-400 text-[8px] font-bold rounded">FRENELSA</span>
                            <span className="text-[10px] text-retarder-gray-400">{freno.frenelsa_serie}  {freno.frenelsa_nm} NM</span>
                        </div>
                    )}
                    {freno.cofremex_serie && freno.cofremex_precio_usd === 0 && freno.pentar_precio_usd > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-400 text-[8px] font-bold rounded">COFREMEX</span>
                            <span className="text-[10px] text-retarder-gray-400">{freno.cofremex_serie}  {freno.cofremex_nm} NM</span>
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

//  Main Page 

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
    const [costoKitLedUSD, setCostoKitLedUSD] = useState<number>(0);
    const [isCreating, setIsCreating] = useState(false);
    const [savedFolio, setSavedFolio] = useState<string>('');
    const [autoPrint, setAutoPrint] = useState(false);
    const [redirectTimer, setRedirectTimer] = useState<number | null>(null);
    const cotizacionRef = useRef<HTMLDivElement>(null);
    const [showForm, setShowForm] = useState(false);
    const [newCot, setNewCot] = useState({ empresa_id: '', atencion_a: '', folio: '', fecha: '' });

    // Manual overrides for the final preview
    const [priceOverrides, setPriceOverrides] = useState<Record<string, { label?: string, usd?: number }>>({});
    const [manualFolio, setManualFolio] = useState('');
    const [manualAtencion, setManualAtencion] = useState('');

    // Material Eléctrico Sub-catalog state
    const [showMaterialModal, setShowMaterialModal] = useState(false);
    const [selectedMaterialItems, setSelectedMaterialItems] = useState<MaterialElectricoItem[]>(MATERIAL_ELECTRICO_BASE);

    // Clear overrides when model changes
    useEffect(() => {
        setPriceOverrides({});
        setSelectedMaterialItems(MATERIAL_ELECTRICO_BASE);
    }, [selectedModelo, selectedMarca, cantidadUnidades]);

    const handleOpenCreateForm = async () => {
        let nextFolio = 'COT-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        try {
            const { count } = await supabase.from('cotizaciones').select('*', { count: 'exact', head: true });
            if (count !== null) {
                nextFolio = `COT-${String(count + 1).padStart(4, '0')}`;
            }
        } catch (err) {}

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        
        setNewCot({
            empresa_id: '',
            atencion_a: '',
            folio: nextFolio,
            fecha: `${yyyy}-${mm}-${dd}`
        });
        setShowForm(true);
    };

    const handleCreateCot = async () => {
        if (!newCot.empresa_id || !newCot.folio || !newCot.fecha) {
            toast.error('Por favor selecciona la empresa, folio y fecha.');
            return;
        }
        setIsCreating(true);
        try {
            const clienteMatch = clientes.find(c => c.id === newCot.empresa_id);

            // Buscar UUID real de la base de datos
            let realEmpresaId = null;
            if (clienteMatch) {
                try {
                    const { data: dbCliente } = await supabase
                        .from('clientes')
                        .select('id')
                        .eq('nombre_comercial', clienteMatch.nombre_comercial)
                        .limit(1)
                        .single();
                    if (dbCliente) {
                        realEmpresaId = dbCliente.id;
                    }
                } catch(e) {}
            }

            const { data, error } = await supabase.from('cotizaciones').insert({
                empresa_id: realEmpresaId,
                empresa: clienteMatch?.nombre_comercial || 'Sin empresa',
                cliente: clienteMatch?.nombre_comercial || 'Sin empresa',
                atencion_a: newCot.atencion_a,
                folio: newCot.folio,
                fecha: newCot.fecha,
                estado: 'borrador',
                subtotal: 0,
                iva: 0,
                total: 0,
            }).select().single();

            if (error) throw error;
            toast.success('Cotización en borrador creada. Redirigiendo...');
            setShowForm(false);
            router.push('/cotizaciones'); 
        } catch (err: any) {
            toast.error(`Error al crear: ${err.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    const filteredClientes = useMemo(() => {
        if (!clientSearch.trim()) return CLIENTES_REALES;
        const q = clientSearch.toLowerCase();
        return CLIENTES_REALES.filter(c => 
            (c.nombre_comercial?.toLowerCase() || '').includes(q)
        );
    }, [clientSearch]);

    // Observaciones y Notas editables (valores del machote)
    const [observaciones, setObservaciones] = useState(
        '*NO INCLUYE MODIFICACIN DE CARDANES\n*NO INCLUYE SOLDADURAS NI OTRAS MODIFICACIONES QUE INTERFIERAN CON LA INSTALACIN DEL FRENO\n*SE REQUIERE EL PAGO TOTAL DEL EQUIPO POR ADELANTADO\n*GASTOS DE ENVO DEL FRENO POR PARTE DEL CLIENTE\n*UNA VEZ RECIBIDO EL PAGO, SE DA FECHA DE INSTALACIN'
    );
    const [notas, setNotas] = useState(
        '*PRECIO SUJETO A CAMBIO SIN PREVIO AVISO\n*COTIZACIN VLIDA POR 8 DAS\n*EQUIPO NUEVO CON GARANTA DE UN AO'
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
                router.push('/ordenes');
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

    // Compute breakdown with units multiplier  usa el precio correcto por marca seleccionada
    const breakdown = useMemo(() => {
        if (!selectedModelo) return null;

        const units = cantidadUnidades || 1;
        const baseFrenoUSD = (() => {
            switch (selectedMarca) {
                case 'pentar': return selectedModelo.pentar_precio_usd;
                case 'frenelsa': return selectedModelo.frenelsa_precio_usd;
                case 'cofremex': return selectedModelo.cofremex_precio_usd;
                default: return selectedModelo.precio_freno_usd;
            }
        })();

        // Apply overrides or defaults
        const base_f_usd = priceOverrides.freno?.usd ?? (baseFrenoUSD * units);
        const c_usd = selectedModelo.cardanes_usd * units;
        const s_usd = selectedModelo.soporteria_usd * units;
        
        // Calculate current Material Electrónico from selected sub-catalog
        const base_m_mxn = selectedMaterialItems.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario_mxn), 0) * units;
        const base_m_usd = base_m_mxn / tipoCambio;

        // Roll up the cost of cardanes, soporteria and material into the Freno price
        const f_usd = priceOverrides.freno?.usd ?? (base_f_usd + c_usd + s_usd + base_m_usd);

        const base_t_usd = (gastosTrasladoMXN * units) / tipoCambio;
        const t_usd = priceOverrides.traslado?.usd ?? base_t_usd;

        const base_mo_usd = manoObraInstalacionMXN / tipoCambio;
        const mo_usd = priceOverrides.manoObra?.usd ?? base_mo_usd;

        const totalKitLedUSD = costoKitLedUSD * units;
        
        const total_usd = f_usd + totalKitLedUSD + t_usd + mo_usd;
        const total_mxn = total_usd * tipoCambio;

        return {
            freno: { 
                label: priceOverrides.freno?.label ?? 'Equipo Freno (Retarder) Incluye Accesorios', 
                usd: f_usd, 
                mxn: f_usd * tipoCambio 
            },
            kitLed: {
                label: 'Kit de Luces LED',
                usd: totalKitLedUSD,
                mxn: totalKitLedUSD * tipoCambio
            },
            traslado: { 
                label: priceOverrides.traslado?.label ?? `Gastos de Traslado / Viáticos (${units} u.)`,
                usd: t_usd,
                mxn: t_usd * tipoCambio
            },
            manoObra: { 
                label: priceOverrides.manoObra?.label ?? 'Mano de Obra Instalación',
                usd: mo_usd,
                mxn: mo_usd * tipoCambio
            },
            total: { usd: total_usd, mxn: total_mxn }
        };
    }, [selectedModelo, selectedMarca, tipoCambio, gastosTrasladoMXN, manoObraInstalacionMXN, cantidadUnidades, priceOverrides, selectedMaterialItems]);

    const handleFinalize = async () => {
        if (!selectedModelo || !selectedClienteId) {
            toast.error('Por favor selecciona un modelo de freno y un cliente.');
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

            // Intentar guardar en Supabase (no bloquea la impresin si falla)
            try {
                // Fetch next numbers
                const { count: cotCount, error: countErr1 } = await supabase.from('cotizaciones').select('*', { count: 'exact', head: true });
                const { count: osCount, error: countErr2 } = await supabase.from('ordenes_servicio').select('*', { count: 'exact', head: true });

                if (!countErr1 && !countErr2) {
                    const nextCotIdx = (cotCount || 0) + 100;
                    cotNumero = `COT-${String(nextCotIdx).padStart(4, '0')}`;
                }

                // Buscar UUID real en Supabase por nombre_comercial
                const { data: empresaData } = await supabase
                    .from('empresas')
                    .select('id')
                    .eq('nombre_comercial', cliente?.nombre_comercial);

                const empresaUUID = empresaData?.[0]?.id || null;

                // 1. Crear Cotizacin
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
                }

                if (!cotError && cotData) {
                    cotId = cotData.id;
                    setSavedFolio(cotNumero);

                    // Crear Orden de Servicio automticamente
                    await supabase.from('ordenes_servicio').insert({
                        empresa_id:    empresaUUID,
                        empresa:       cliente?.nombre_comercial || 'Sin empresa',
                        vendedor:      sellerName,
                        estado:        'cotizacion_enviada_al_cliente',
                        cotizacion_id: cotData.id,
                        folio:         cotData.folio,
                        numero:        '', // Se captura manualmente
                        tipo:          'frenos',
                        prioridad:     'media',
                        tecnico:       '',
                        descripcion:   `Cotizacin de frenos ${cotData.folio}`,
                        total:         breakdown.total.mxn,
                        subtotal:      breakdown.total.mxn / 1.16,
                        iva:           breakdown.total.mxn - (breakdown.total.mxn / 1.16),
                        monto:         breakdown.total.mxn,
                        fecha_creado:  new Date().toISOString()
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
                setSavedFolio(cotNumero);
                if (autoPrint) {
                    setTimeout(() => window.print(), 500);
                }
            }
        } catch (error: any) {
            toast.error(`Error al generar la cotizacin: ${error.message || 'Error desconocido'}`);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/*  Header  */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-retarder-black flex items-center gap-2">
                        <ShoppingCart size={22} className="text-retarder-red" />
                        Cotizador de Frenos
                    </h2>
                    <p className="text-xs text-retarder-gray-500 mt-1 mb-3">
                        Selecciona un modelo para ver el desglose de precios con conversión USD / MXN en tiempo real
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
                                <p className="text-[10px] text-retarder-gray-400">USD  MXN</p>
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
                                placeholder=" Buscar cliente..."
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
                                <p className="text-[10px] text-retarder-gray-400">Vehculos a instalar</p>
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

                    {/* Mano de Obra  Manual */}
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

                    {/* Kit de Luces LED */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 bg-white rounded-2xl border border-retarder-gray-200 px-5 py-3 shadow-sm hover:border-retarder-red/40 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Zap size={16} className="text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-[9px] font-semibold uppercase tracking-wider text-retarder-gray-400">Kit Luces LED</p>
                                <p className="text-[10px] text-retarder-gray-400">Opcional (USD)</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-retarder-gray-400">$</span>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                placeholder="0.00"
                                value={costoKitLedUSD || ''}
                                onChange={(e) => setCostoKitLedUSD(parseFloat(e.target.value) || 0)}
                                className="w-24 text-sm font-bold text-retarder-black border border-retarder-gray-200 rounded-xl px-3 py-1.5 focus:border-retarder-red outline-none"
                            />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Material Electrónico Sub-catalog Summary */}
            {selectedModelo && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2rem] border border-retarder-gray-200 p-6 shadow-sm overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 rounded-xl">
                                <Settings2 size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-retarder-black uppercase tracking-wider">Configuración de Material Eléctrico</h4>
                                <p className="text-[10px] text-retarder-gray-400 font-bold uppercase">Personaliza los componentes del kit</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowMaterialModal(true)}
                            className="bg-retarder-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-retarder-gray-800 transition-all flex items-center gap-2"
                        >
                            <Plus size={14} /> Editar Sub-catálogo
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <div className="bg-retarder-gray-50 p-3 rounded-2xl border border-retarder-gray-100">
                            <p className="text-[9px] font-bold text-retarder-gray-400 uppercase">Total Items</p>
                            <p className="text-sm font-black text-retarder-black">{selectedMaterialItems.length} componentes</p>
                        </div>
                        <div className="bg-retarder-gray-50 p-3 rounded-2xl border border-retarder-gray-100">
                            <p className="text-[9px] font-bold text-retarder-gray-400 uppercase">Subtotal Kit (MXN)</p>
                            <p className="text-sm font-black text-retarder-red">{formatMXN(selectedMaterialItems.reduce((acc, i) => acc + (i.cantidad * i.precio_unitario_mxn), 0))}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Material Eléctrico Modal */}
            <AnimatePresence>
                {showMaterialModal && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setShowMaterialModal(false)} 
                            className="fixed inset-0 bg-retarder-black/60 backdrop-blur-md z-[60]" 
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl z-[70] overflow-hidden max-h-[85vh] flex flex-col"
                        >
                            <div className="p-8 border-b border-retarder-gray-100 flex items-center justify-between bg-retarder-gray-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600">
                                        <Settings2 size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-retarder-black uppercase tracking-tight">Material Eléctrico</h3>
                                        <p className="text-xs text-retarder-gray-400 font-bold uppercase tracking-widest">Sub-catálogo Personalizable</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowMaterialModal(false)}
                                    className="p-3 rounded-2xl bg-white text-retarder-gray-400 hover:text-retarder-red transition-all shadow-sm"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 pt-4">
                                <div className="space-y-3">
                                    <div className="grid grid-cols-[80px_1fr_120px_120px_60px] gap-4 px-4 py-2 border-b border-retarder-gray-100 text-[10px] font-black uppercase text-retarder-gray-500">
                                        <span>Cant.</span>
                                        <span>Concepto</span>
                                        <span className="text-right">P.U. (MXN)</span>
                                        <span className="text-right">Total (MXN)</span>
                                        <span></span>
                                    </div>
                                    {selectedMaterialItems.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-[80px_1fr_120px_120px_60px] gap-4 items-center p-3 bg-white hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-retarder-gray-100 group">
                                            <input 
                                                type="number" 
                                                value={item.cantidad} 
                                                onChange={e => {
                                                    const newItems = [...selectedMaterialItems];
                                                    newItems[idx].cantidad = parseFloat(e.target.value) || 0;
                                                    setSelectedMaterialItems(newItems);
                                                }}
                                                className="w-full bg-retarder-gray-50 border border-transparent focus:border-blue-300 rounded-xl px-3 py-2 text-sm font-bold text-center outline-none"
                                            />
                                            <input 
                                                type="text" 
                                                value={item.concepto} 
                                                onChange={e => {
                                                    const newItems = [...selectedMaterialItems];
                                                    newItems[idx].concepto = e.target.value;
                                                    setSelectedMaterialItems(newItems);
                                                }}
                                                className="w-full bg-transparent border-b border-transparent focus:border-blue-300 px-2 py-1 text-sm font-semibold outline-none"
                                            />
                                            <input 
                                                type="number" 
                                                value={item.precio_unitario_mxn} 
                                                onChange={e => {
                                                    const newItems = [...selectedMaterialItems];
                                                    newItems[idx].precio_unitario_mxn = parseFloat(e.target.value) || 0;
                                                    setSelectedMaterialItems(newItems);
                                                }}
                                                className="w-full bg-transparent border-b border-transparent focus:border-blue-300 px-2 py-1 text-sm font-mono text-right outline-none"
                                            />
                                            <p className="text-sm font-black text-retarder-black text-right font-mono">
                                                {formatMXN(item.cantidad * item.precio_unitario_mxn)}
                                            </p>
                                            <button 
                                                onClick={() => {
                                                    const newItems = selectedMaterialItems.filter((_, i) => i !== idx);
                                                    setSelectedMaterialItems(newItems);
                                                }}
                                                className="p-2 text-retarder-gray-300 hover:text-retarder-red opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => setSelectedMaterialItems([...selectedMaterialItems, { cantidad: 1, concepto: 'Nuevo Item', precio_unitario_mxn: 0 }])}
                                        className="w-full py-4 border-2 border-dashed border-retarder-gray-100 rounded-[2rem] text-retarder-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest mt-6"
                                    >
                                        <Plus size={18} /> Agregar Concepto Personalizado
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 bg-retarder-gray-50 border-t border-retarder-gray-100 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-retarder-gray-400">Total Material Eléctrico</p>
                                    <p className="text-3xl font-black text-retarder-red">
                                        {formatMXN(selectedMaterialItems.reduce((acc, i) => acc + (i.cantidad * i.precio_unitario_mxn), 0))} <span className="text-sm text-retarder-gray-400">MXN</span>
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setShowMaterialModal(false)}
                                    className="bg-blue-600 text-white px-10 py-4 rounded-3xl text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    Confirmar y Actualizar Precios
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/*  Model Grid  */}
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

            {/*  Brand Selector  */}
            <AnimatePresence>
                {selectedModelo && availableBrands.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="bg-white rounded-2xl border border-retarder-gray-200 shadow-sm p-5"
                    >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400 mb-3">
                            Selecciona la marca a cotizar  {selectedModelo.modelo}
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
                                        {brand.nm} NM  {formatUSD(brand.precio)} USD
                                    </span>
                                </button>
                            ))}
                        </div>
                        {availableBrands.length > 0 && (
                            <p className="text-[10px] text-retarder-gray-400 mt-3 text-center">
                                Cotizando: <span className="font-bold text-retarder-red">{marcaInfo.nombre} {marcaInfo.serie}</span> ({marcaInfo.nm} NM)  {formatUSD(precioFrenoUSD)} USD
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
                                        <p className="text-green-800 font-black text-sm uppercase">Cotizacin Guardada Exitosamente!</p>
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
                                        <img src="/logo-retarder.png" alt="Retarder Mxico" className="h-24 w-auto object-contain" />
                                    </div>
                                    <div className="h-14 w-[1px] bg-retarder-gray-200 mx-1" />
                                    <div className="space-y-0.5">
                                        <div className="bg-[#FFEB3B] px-3 py-1 mb-1 inline-block border-b-2 border-black/10">
                                            <h1 className="text-2xl font-black text-retarder-black leading-none tracking-tighter uppercase whitespace-nowrap">
                                                RETARDER MXICO
                                            </h1>
                                        </div>
                                        <p className="text-[10px] text-retarder-gray-500 font-bold uppercase tracking-[0.2em]">Especialistas en Frenos Auxiliares</p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col justify-center">
                                    <div className="bg-retarder-red text-white px-4 py-1.5 rounded-lg mb-2 shadow-sm print:bg-white print:border-2 print:border-black">
                                        <h2 className="text-sm font-black tracking-widest uppercase print:!text-black">Cotizacin Oficial</h2>
                                    </div>
                                    <p className="text-[10px] text-retarder-gray-400 font-medium">Folio de Referencia:</p>
                                    <input 
                                        type="text" 
                                        value={manualFolio || `Ref: ${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-FRENOS`} 
                                        onChange={e => setManualFolio(e.target.value)} 
                                        className="text-[11px] text-retarder-black font-bold font-mono bg-transparent text-right outline-none hover:bg-gray-50 focus:bg-gray-50 focus:border-b focus:border-retarder-red transition-all print:border-none print:bg-transparent" 
                                    />
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
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="font-bold text-[10px]">ATENCIÓN A:</span>
                                                    <input 
                                                        type="text" 
                                                        value={manualAtencion} 
                                                        onChange={e => setManualAtencion(e.target.value)} 
                                                        placeholder="Nombre del contacto..." 
                                                        className="text-[10px] w-48 bg-transparent outline-none border-b border-dashed border-gray-300 hover:border-gray-500 print:border-none uppercase" 
                                                    />
                                                </div>
                                                {cli.rfc && <p className="mt-1">{cli.rfc}</p>}
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
                                        <p className="text-white/50 text-xs mt-1 print:!text-black">Para: {clientes.find(c => c.id === selectedClienteId)?.nombre_comercial || 'Cliente no seleccionado'}  {marcaInfo.nm} NM  {selectedModelo.aplicacion}</p>
                                    </div>
                                    <div className="text-right hidden sm:block">
                                        <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider print:!text-black">T.C. Extranjero</p>
                                        <p className="text-white font-bold text-lg font-mono print:!text-black">${tipoCambio.toFixed(4)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Price lines */}
                            <div className="p-6 space-y-3 relative group">
                                <PriceLine
                                    label={breakdown.freno.label}
                                    icon={<Package size={16} className="text-retarder-red" />}
                                    usd={breakdown.freno.usd}
                                    mxn={breakdown.freno.mxn}
                                    delay={0.1}
                                    editable
                                    onUsdChange={v => setPriceOverrides(p => ({ ...p, freno: { ...p.freno, usd: v } }))}
                                />
                                {costoKitLedUSD > 0 && (
                                    <PriceLine
                                        label={breakdown.kitLed.label}
                                        icon={<Zap size={16} className="text-yellow-500" />}
                                        usd={breakdown.kitLed.usd}
                                        mxn={breakdown.kitLed.mxn}
                                        delay={0.15}
                                    />
                                )}
                                <PriceLine
                                    label={breakdown.traslado.label}
                                    icon={<Package size={16} className="text-purple-500" />}
                                    usd={breakdown.traslado.usd}
                                    mxn={breakdown.traslado.mxn}
                                    delay={0.28}
                                    editable
                                    onLabelChange={v => setPriceOverrides(p => ({ ...p, traslado: { ...p.traslado, label: v } }))}
                                    onUsdChange={v => setPriceOverrides(p => ({ ...p, traslado: { ...p.traslado, usd: v } }))}
                                />
                                <PriceLine
                                    label={breakdown.manoObra.label}
                                    icon={<Wrench size={16} className="text-orange-500" />}
                                    usd={breakdown.manoObra.usd}
                                    mxn={breakdown.manoObra.mxn}
                                    delay={0.30}
                                    editable
                                    onLabelChange={v => setPriceOverrides(p => ({ ...p, manoObra: { ...p.manoObra, label: v } }))}
                                    onUsdChange={v => setPriceOverrides(p => ({ ...p, manoObra: { ...p.manoObra, usd: v } }))}
                                />

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

                            {/*  Observaciones y Notas (editables + se imprimen)  */}
                            <div className="px-6 py-5 border-t border-retarder-gray-200">
                                {/* OBSERVACIONES */}
                                <div className="mb-4">
                                    <p className="text-xs font-black text-retarder-black uppercase mb-2 tracking-wide">OBSERVACIONES:</p>
                                    <textarea
                                        value={observaciones}
                                        onChange={(e) => setObservaciones(e.target.value)}
                                        rows={5}
                                        className="w-full text-xs text-retarder-gray-700 border border-retarder-gray-200 rounded-lg p-3 outline-none focus:border-retarder-red resize-y leading-relaxed print:border-none print:p-0 print:resize-none"
                                        placeholder="Escribe las observaciones aqu..."
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
                                        placeholder="Escribe las notas aqu..."
                                    />
                                </div>

                                {/* Firma / Pie de Pgina */}
                                <div className="mt-8 pt-6 border-t border-retarder-gray-100 flex justify-between items-end">
                                    <div className="space-y-4 max-w-[50%]">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-retarder-black uppercase tracking-widest italic opacity-70">Marca del Freno:</p>
                                            <img src="/logo-pentar.png" alt="Pentar Kloft" className="h-14 w-auto object-contain" />
                                        </div>
                                        <p className="text-[9px] text-retarder-gray-500 leading-tight">
                                            Pentar Kloft Retarder es una marca registrada especializada en sistemas de frenado auxiliares electromagnticos de alta eficiencia.
                                        </p>
                                    </div>
                                    <div className="text-right space-y-6">
                                        <div className="space-y-1">
                                            <p className="text-[9px] text-retarder-gray-400 font-bold uppercase tracking-wider">Atentamente:</p>
                                            <p className="text-sm font-black text-retarder-black uppercase">
                                                {formatUserName(user?.fullName) || 'CRISTINA VELASCO'}
                                            </p>
                                            <p className="text-[10px] font-bold text-retarder-red uppercase">rea de Ventas</p>
                                            <p className="text-[10px] font-medium text-retarder-gray-600 italic">Retarder Mxico S.A. de C.V.</p>
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
                                        Retarder Mxico  {new Date().getFullYear()}  Todos los derechos reservados
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
                                                setTimeout(() => {
                                                    document.title = oldTitle;
                                                    if (redirectTimer) clearTimeout(redirectTimer);
                                                    router.push('/ordenes');
                                                }, 500);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all shadow-md bg-retarder-red text-white hover:bg-retarder-red-700 shadow-retarder-red/20"
                                        >
                                            <Printer size={16} />
                                            IMPRIMIR COTIZACIN PDF
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
                                            <label htmlFor="autoPrint" className="text-xs font-bold text-retarder-gray-500 cursor-pointer">IMPRIMIR AUTOMTICAMENTE</label>
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

            {/* Create Modal */}
            <AnimatePresence>
                {showForm && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="fixed inset-0 bg-retarder-black/60 backdrop-blur-md z-40" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[2rem] shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-[#FACC15]/20 flex items-center justify-center text-black">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-retarder-black">Nueva Cotización</h3>
                                            <p className="text-xs text-retarder-gray-400 font-bold uppercase tracking-widest">Estado Borrador</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowForm(false)} className="p-2 rounded-xl bg-retarder-gray-50 text-retarder-gray-400 hover:bg-retarder-red/10 hover:text-retarder-red transition-all"><X size={20} /></button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-retarder-gray-400 block px-1 mb-1">Cliente / Empresa *</label>
                                        <select 
                                            value={newCot.empresa_id} 
                                            onChange={e => setNewCot({...newCot, empresa_id: e.target.value})}
                                            className="w-full bg-retarder-gray-50 border border-retarder-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FACC15]"
                                        >
                                            <option value="">-- Seleccionar Empresa --</option>
                                            {CLIENTES_REALES.map(c => (
                                                <option key={c.id} value={c.id}>{c.nombre_comercial}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-retarder-gray-400 block px-1 mb-1">Atención a (Opcional)</label>
                                        <input 
                                            type="text" 
                                            placeholder="Nombre del cliente/contacto..." 
                                            value={newCot.atencion_a} 
                                            onChange={e => setNewCot({...newCot, atencion_a: e.target.value})}
                                            className="w-full bg-retarder-gray-50 border border-retarder-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FACC15]"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-retarder-gray-400 block px-1 mb-1">Folio *</label>
                                            <input 
                                                type="text" 
                                                value={newCot.folio} 
                                                onChange={e => setNewCot({...newCot, folio: e.target.value})}
                                                className="w-full bg-retarder-gray-50 border border-retarder-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FACC15] font-mono font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-retarder-gray-400 block px-1 mb-1">Fecha *</label>
                                            <input 
                                                type="date" 
                                                value={newCot.fecha} 
                                                onChange={e => setNewCot({...newCot, fecha: e.target.value})}
                                                className="w-full bg-retarder-gray-50 border border-retarder-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FACC15]"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-retarder-gray-100 flex gap-3">
                                        <button
                                            onClick={handleCreateCot}
                                            disabled={isCreating}
                                            className="flex-1 py-3 bg-[#FACC15] text-black rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-yellow-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                                        >
                                            {isCreating ? 'Creando...' : 'Crear y Añadir Conceptos'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
