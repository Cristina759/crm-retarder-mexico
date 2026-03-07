// Orden de Servicio pipeline states — ordered
export const ORDEN_ESTADOS = [
    'solicitud_recibida',
    'cotizacion_enviada',
    'cotizacion_aceptada',
    'asignacion_tecnico',
    'servicio_programado',
    'documentacion_enviada',
    'tecnico_en_contacto',
    'servicio_en_proceso',
    'autorizacion_adicional',
    'servicio_concluido',
    'evidencia_cargada',
    'documentacion_entregada',
    'encuesta_enviada',
    'facturado',
    'pagado',
] as const;


export type OrdenEstado = (typeof ORDEN_ESTADOS)[number];

export const ORDEN_ESTADO_LABELS: Record<OrdenEstado, string> = {
    solicitud_recibida: 'Solicitud Recibida',
    cotizacion_enviada: 'Cotización Enviada',
    cotizacion_aceptada: 'Cotización Aceptada',
    asignacion_tecnico: 'Asignación de Técnico',
    servicio_programado: 'Servicio Programado',
    documentacion_enviada: 'Documentación Enviada',
    tecnico_en_contacto: 'Técnico en Contacto',
    servicio_en_proceso: 'Servicio en Proceso',
    autorizacion_adicional: 'Autorización Adicional',
    servicio_concluido: 'Servicio Concluido',
    evidencia_cargada: 'Evidencia Cargada',
    documentacion_entregada: 'Documentación Entregada',
    encuesta_enviada: 'Encuesta Enviada',
    facturado: 'Facturado',
    pagado: 'Pagado',
};

// ── Phase Grouping ─────────────────────────────────

export type OrdenPhase = 'comercial' | 'operativa' | 'cierre' | 'administrativa';

export interface PhaseConfig {
    id: OrdenPhase;
    label: string;
    emoji: string;
    estados: OrdenEstado[];
    /** Tailwind bg for the phase header strip */
    bgColor: string;
    /** Lighter bg for the column drop zone */
    bgLight: string;
    /** Accent for column top border */
    borderColor: string;
    /** Text color */
    textColor: string;
    /** Dot / badge color */
    dotColor: string;
}

export const ORDEN_PHASES: PhaseConfig[] = [
    {
        id: 'comercial',
        label: 'Fase Comercial',
        emoji: '💼',
        estados: ['solicitud_recibida', 'cotizacion_enviada', 'cotizacion_aceptada'],
        bgColor: 'bg-blue-600',
        bgLight: 'bg-blue-50',
        borderColor: 'border-blue-500',
        textColor: 'text-blue-700',
        dotColor: 'bg-blue-500',
    },
    {
        id: 'operativa',
        label: 'Fase Operativa',
        emoji: '🔧',
        estados: ['asignacion_tecnico', 'servicio_programado', 'documentacion_enviada', 'tecnico_en_contacto', 'servicio_en_proceso', 'autorizacion_adicional'],
        bgColor: 'bg-orange-500',
        bgLight: 'bg-orange-50',
        borderColor: 'border-orange-400',
        textColor: 'text-orange-700',
        dotColor: 'bg-orange-500',
    },
    {
        id: 'cierre',
        label: 'Fase Cierre',
        emoji: '✅',
        estados: ['servicio_concluido', 'evidencia_cargada', 'documentacion_entregada'],
        bgColor: 'bg-emerald-600',
        bgLight: 'bg-emerald-50',
        borderColor: 'border-emerald-500',
        textColor: 'text-emerald-700',
        dotColor: 'bg-emerald-500',
    },
    {
        id: 'administrativa',
        label: 'Fase Administrativa',
        emoji: '📋',
        estados: ['encuesta_enviada', 'facturado', 'pagado'],
        bgColor: 'bg-slate-500',
        bgLight: 'bg-slate-50',
        borderColor: 'border-slate-400',
        textColor: 'text-slate-600',
        dotColor: 'bg-slate-500',
    },
];

/** Get the phase config for a given orden state */
export function getPhaseForEstado(estado: OrdenEstado): PhaseConfig {
    return ORDEN_PHASES.find(p => p.estados.includes(estado))!;
}

// Per-state colors (aligned with phase)
export const ORDEN_ESTADO_COLORS: Record<OrdenEstado, string> = {
    solicitud_recibida: 'bg-blue-400',
    cotizacion_enviada: 'bg-blue-500',
    cotizacion_aceptada: 'bg-blue-600',
    asignacion_tecnico: 'bg-amber-400',
    servicio_programado: 'bg-orange-400',
    documentacion_enviada: 'bg-orange-500',
    tecnico_en_contacto: 'bg-amber-500',
    servicio_en_proceso: 'bg-orange-600',
    autorizacion_adicional: 'bg-red-500',
    servicio_concluido: 'bg-emerald-500',
    evidencia_cargada: 'bg-emerald-600',
    documentacion_entregada: 'bg-teal-600',
    encuesta_enviada: 'bg-slate-400',
    facturado: 'bg-slate-500',
    pagado: 'bg-slate-700',
};

// ── Roles ──────────────────────────────────────────

export type Rol = 'admin' | 'vendedor' | 'tecnico' | 'cliente' | 'direccion' | 'administracion';

export const ROL_LABELS: Record<Rol, string> = {
    admin: 'Admin/Dirección',
    vendedor: 'Vendedor',
    tecnico: 'Técnico',
    cliente: 'Cliente',
    direccion: 'Admin/Dirección',
    administracion: 'Área Administrativa',
};

// ── Other Types ────────────────────────────────────

export type TipoServicio = 'preventivo' | 'correctivo' | 'instalacion' | 'diagnostico';
export type Prioridad = 'baja' | 'media' | 'alta' | 'urgente';
export type OportunidadEstado = 'prospecto' | 'contactado' | 'cotizado' | 'negociacion' | 'ganada' | 'perdida';
export type CotizacionEstado = 'borrador' | 'enviada' | 'negociacion' | 'aceptada' | 'rechazada' | 'vencida';
export type ProductoTipo = 'freno' | 'refaccion' | 'insumo';
export type MovimientoTipo = 'entrada' | 'salida' | 'ajuste';
export type MovimientoMotivo = 'compra' | 'venta' | 'servicio' | 'devolucion' | 'ajuste_manual';

export const PRIORIDAD_COLORS: Record<Prioridad, string> = {
    baja: 'bg-gray-200 text-gray-700',
    media: 'bg-blue-100 text-blue-700',
    alta: 'bg-retarder-yellow-light text-yellow-800',
    urgente: 'bg-retarder-red-light text-red-800',
};

export const PRIORIDAD_LABELS: Record<Prioridad, string> = {
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta',
    urgente: 'Urgente',
};

export const COTIZACION_ESTADO_LABELS: Record<CotizacionEstado, string> = {
    borrador: 'Borrador',
    enviada: 'Enviada',
    negociacion: 'En Negociación',
    aceptada: 'Aceptada',
    rechazada: 'Rechazada',
    vencida: 'Vencida',
};

export const COTIZACION_ESTADO_COLORS: Record<CotizacionEstado, string> = {
    borrador: 'bg-slate-400',
    enviada: 'bg-blue-500',
    negociacion: 'bg-orange-500',
    aceptada: 'bg-emerald-500',
    rechazada: 'bg-retarder-red',
    vencida: 'bg-retarder-gray-400',
};

export const TIPO_SERVICIO_LABELS: Record<TipoServicio, string> = {
    preventivo: 'Preventivo',
    correctivo: 'Correctivo',
    instalacion: 'Instalación',
    diagnostico: 'Diagnóstico',
};

export const FRENO_MODELOS = ['PK1', 'PK', 'P5-1', 'P5', 'P7-1', 'P7', 'P11-1', 'P11', 'P10', 'P9'] as const;

export const REFACCION_CATEGORIAS = [
    'cardan', 'cruceta', 'material_electrico', 'soporteria', 'hules', 'tornilleria', 'placas'
] as const;

// ── Demo Data ──────────────────────────────────────

export interface DemoCotizacion {
    id: string;
    numero: string;
    numero_cotizacion?: number;
    empresa: string;
    empresa_id?: string;
    vendedor: string;
    vendedor_id?: string;
    subtotal: number;
    iva: number;
    total: number;
    estado: CotizacionEstado;
    vigencia_dias: number;
    fecha: string;
    created_at?: string;
    updated_at?: string;
    items: number;
    orden_id?: string;
    orden_numero?: string;
}

export interface DemoOrden {
    id: string;
    numero: string;
    empresa: string;
    tipo: TipoServicio;
    estado: OrdenEstado;
    prioridad: Prioridad;
    tecnico: string;
    vendedor: string;
    descripcion: string;
    fecha_creado: string;
    monto: number | null;
    cotizacion_id?: string;
    cotizacion_numero?: string;
    numero_orden_fisica?: string;
    numero_orden_compra?: string;
    // Campos de facturación (datos reales)
    numero_factura?: string;
    mano_obra?: number;
    refacciones?: number;
    gastos_traslado?: number;
    subtotal?: number;
    iva?: number;
    pagado?: boolean;
}


export const DEMO_ORDENES: DemoOrden[] = [];

// ── Tabulador de Mano de Obra — Precios en MXN ─────

export interface ManoObraItem {
    id: string;
    concepto: string;
    precio_mxn: number;
    categoria: 'electrico' | 'mecanico' | 'neumatico' | 'otro';
}

export const TABULADOR_MANO_OBRA: ManoObraItem[] = [
    // ── ELÉCTRICO ──
    { id: 'e01', concepto: 'Servicio Preventivo', precio_mxn: 4250, categoria: 'electrico' },
    { id: 'e02', concepto: 'Cambio y reconectar relay de corte o velocidad (relevador)', precio_mxn: 300, categoria: 'electrico' },
    { id: 'e03', concepto: 'Cambio de bulbo de aire', precio_mxn: 300, categoria: 'electrico' },
    { id: 'e04', concepto: 'Cambio palanca', precio_mxn: 300, categoria: 'electrico' },
    { id: 'e05', concepto: 'Cambio caja de contactores', precio_mxn: 600, categoria: 'electrico' },
    { id: 'e06', concepto: 'Cambio caja electrónica', precio_mxn: 800, categoria: 'electrico' },
    { id: 'e07', concepto: 'Cambio de foco piloto', precio_mxn: 100, categoria: 'electrico' },
    { id: 'e08', concepto: 'Reparación arnés sensor velocidad', precio_mxn: 150, categoria: 'electrico' },
    { id: 'e09', concepto: 'Cambio de sensor de velocidad', precio_mxn: 350, categoria: 'electrico' },
    { id: 'e10', concepto: 'Cambio arnés corriente (Cal 0) caja contactores / batería positivo', precio_mxn: 250, categoria: 'electrico' },
    { id: 'e11', concepto: 'Cambio arnés de tierra (Cal 8) reparación de maza negativo', precio_mxn: 250, categoria: 'electrico' },
    { id: 'e12', concepto: 'Cambio de arnés (7 vías)', precio_mxn: 800, categoria: 'electrico' },
    { id: 'e13', concepto: 'Cambio de arnés de potencia (4 vías)', precio_mxn: 350, categoria: 'electrico' },
    { id: 'e14', concepto: 'Cambio arnés tierra (de freno a baterías) rep. o fab. maza negativo', precio_mxn: 250, categoria: 'electrico' },
    { id: 'e15', concepto: 'Reparación de arnés de control (cambio de terminales) 4 líneas block conex.', precio_mxn: 150, categoria: 'electrico' },
    { id: 'e16', concepto: 'Sistema de control completo caja mecánica', precio_mxn: 2000, categoria: 'electrico' },
    { id: 'e17', concepto: 'Fabricación líneas sensor c/conector', precio_mxn: 150, categoria: 'electrico' },
    { id: 'e18', concepto: 'Sistema de control completo caja electrónica', precio_mxn: 2500, categoria: 'electrico' },
    { id: 'e19', concepto: 'Cambio de interruptor', precio_mxn: 150, categoria: 'electrico' },
    { id: 'e20', concepto: 'Cambio de block conexiones', precio_mxn: 400, categoria: 'electrico' },
    { id: 'e21', concepto: 'Reparación líneas de tablero', precio_mxn: 200, categoria: 'electrico' },
    { id: 'e22', concepto: 'Reparación líneas de tablero alimentación o port fusible', precio_mxn: 200, categoria: 'electrico' },
    { id: 'e23', concepto: 'Reparación arnés de 7 vías (sin realizar cambio completo)', precio_mxn: 250, categoria: 'electrico' },
    { id: 'e24', concepto: 'Reparación caja contactores', precio_mxn: 300, categoria: 'electrico' },
    { id: 'e25', concepto: 'Cambio de mega fusible o porta mega fusible', precio_mxn: 200, categoria: 'electrico' },
    { id: 'e26', concepto: 'Instalación de sistema eléctrico completo', precio_mxn: 3000, categoria: 'electrico' },
    { id: 'e27', concepto: 'Revisión de consumos', precio_mxn: 500, categoria: 'electrico' },

    // ── SISTEMA NEUMÁTICO ──
    { id: 'n01', concepto: 'Instalación sistema neumático', precio_mxn: 1000, categoria: 'neumatico' },
    { id: 'n02', concepto: 'Reparación sistema neumático (bulbo)', precio_mxn: 300, categoria: 'neumatico' },
    { id: 'n03', concepto: 'Cambio manguera', precio_mxn: 250, categoria: 'neumatico' },

    // ── MECÁNICO ──
    { id: 'm01', concepto: 'Limpieza de frenos sin desarmar', precio_mxn: 400, categoria: 'mecanico' },
    { id: 'm02', concepto: 'Instalación mecánica o reinstalación de freno', precio_mxn: 3500, categoria: 'mecanico' },
    { id: 'm03', concepto: 'Solo bajar puro freno', precio_mxn: 1500, categoria: 'mecanico' },
    { id: 'm04', concepto: 'Cambio de soporte de chasis tipo "L" c/u', precio_mxn: 400, categoria: 'mecanico' },
    { id: 'm05', concepto: 'Cambio de rotor freno instalado c/u', precio_mxn: 600, categoria: 'mecanico' },
    { id: 'm06', concepto: 'Montaje de freno (axial) completo con kit de control', precio_mxn: 6000, categoria: 'mecanico' },
    { id: 'm07', concepto: 'Cambio de silentbloks', precio_mxn: 2500, categoria: 'mecanico' },
    { id: 'm08', concepto: 'Cambio de retén de freno', precio_mxn: 700, categoria: 'mecanico' },
    { id: 'm09', concepto: 'Cambio o reparación de arnés interior (conexión)', precio_mxn: 500, categoria: 'mecanico' },
    { id: 'm10', concepto: 'Bajar cardanes y desconectar arneses de freno', precio_mxn: 750, categoria: 'mecanico' },
    { id: 'm11', concepto: 'Montaje de cardanes y arneses de freno', precio_mxn: 750, categoria: 'mecanico' },
    { id: 'm12', concepto: 'Cambio de placas laterales c/u', precio_mxn: 300, categoria: 'mecanico' },
    { id: 'm13', concepto: 'Desarmado de freno quitando bobinas (siempre y cuando salgan)', precio_mxn: 1000, categoria: 'mecanico' },
    { id: 'm14', concepto: 'Reparación de freno (baleros, retenes, casquillos, armado)', precio_mxn: 2500, categoria: 'mecanico' },
    { id: 'm15', concepto: 'Cambio kit de engrase sistema de lubricación', precio_mxn: 570, categoria: 'mecanico' },
    { id: 'm16', concepto: 'Cambio de 1 kit de reparación de bobina', precio_mxn: 200, categoria: 'mecanico' },
    { id: 'm17', concepto: 'Reparación de cuerda de freno o placa lateral c/u', precio_mxn: 100, categoria: 'mecanico' },
    { id: 'm18', concepto: 'Refresco, cuerdas de tornillos, de cruceta c/u', precio_mxn: 100, categoria: 'mecanico' },
    { id: 'm19', concepto: 'Cambio seguros de crucetas', precio_mxn: 200, categoria: 'mecanico' },
    { id: 'm20', concepto: 'Cambio de cruceta', precio_mxn: 500, categoria: 'mecanico' },
    { id: 'm21', concepto: 'Cambio de bobina c/u', precio_mxn: 300, categoria: 'mecanico' },
    { id: 'm22', concepto: 'Cambio placa polar/rotor c/u', precio_mxn: 200, categoria: 'mecanico' },
    { id: 'm23', concepto: 'Calibración entre hierro rotor', precio_mxn: 550, categoria: 'mecanico' },
    { id: 'm24', concepto: 'Bajar y subir cardanes lado de freno caja y diferencial', precio_mxn: 1500, categoria: 'mecanico' },
    { id: 'm25', concepto: 'Cambio tornillo plato acople c/u', precio_mxn: 75, categoria: 'mecanico' },
    { id: 'm26', concepto: 'Desinstalación freno (con arnés)', precio_mxn: 2500, categoria: 'mecanico' },
    { id: 'm27', concepto: 'Cambio de terminales', precio_mxn: 200, categoria: 'mecanico' },
    { id: 'm28', concepto: 'Reconexión eléctrica', precio_mxn: 200, categoria: 'mecanico' },
    { id: 'm29', concepto: 'Subir freno', precio_mxn: 750, categoria: 'mecanico' },
    { id: 'm30', concepto: 'Cambio corta corriente', precio_mxn: 350, categoria: 'mecanico' },

    // ── OTROS ──
    { id: 'o01', concepto: 'Kit de luces LED', precio_mxn: 4250, categoria: 'otro' },
    { id: 'o02', concepto: 'Pláticas capacitación a conductores o técnicos', precio_mxn: 0, categoria: 'otro' },
];

export const MANO_OBRA_CATEGORIAS = {
    electrico: { label: '⚡ Eléctrico', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
    mecanico: { label: '🔧 Mecánico', color: 'bg-blue-50 border-blue-200 text-blue-800' },
    neumatico: { label: '💨 Neumático', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
    otro: { label: '📦 Otros', color: 'bg-gray-50 border-gray-200 text-gray-800' },
};

// ── Catálogo de Frenos — Precios en USD ─────────────

export const DEFAULT_TIPO_CAMBIO = 17.2193;

export interface CatalogoFreno {
    modelo: string;          // Pentar model name (primary)
    descripcion: string;
    // ── Pentar ──
    pentar_serie: string;
    pentar_nm: number;
    pentar_precio_usd: number;
    // ── Frenelsa ──
    frenelsa_serie: string;
    frenelsa_nm: number;
    frenelsa_precio_usd: number;
    // ── Cofremex ──
    cofremex_serie: string;
    cofremex_nm: number;
    cofremex_precio_usd: number;
    // ── Shared install costs (USD) ──
    cardanes_usd: number;
    soporteria_usd: number;
    material_electrico_usd: number;
    // ── Specs ──
    aplicacion: string;
    tonelaje: string;
    activo: boolean;
    // Legacy field for backward compatibility
    precio_freno_usd: number;
    torque_max: string;
    peso: string;
}

export const CATALOGO_FRENOS: CatalogoFreno[] = [
    {
        modelo: 'PK1', descripcion: 'Freno Retarder para Camiones 3 a 5 Ton',
        pentar_serie: 'PK1', pentar_nm: 420, pentar_precio_usd: 7000,
        frenelsa_serie: 'F12-40', frenelsa_nm: 400, frenelsa_precio_usd: 4620,
        cofremex_serie: 'K-40C', cofremex_nm: 370, cofremex_precio_usd: 0,
        cardanes_usd: 306.07, soporteria_usd: 491.49, material_electrico_usd: 779.03,
        aplicacion: 'Camiones 3 a 5 Ton', tonelaje: '3 a 5', activo: true,
        precio_freno_usd: 7000, torque_max: '420 NM', peso: '48 kg',
    },
    {
        modelo: 'PK', descripcion: 'Freno Retarder para Camiones 4 a 8 Ton',
        pentar_serie: 'PK', pentar_nm: 525, pentar_precio_usd: 7000,
        frenelsa_serie: 'F16-65', frenelsa_nm: 650, frenelsa_precio_usd: 6156,
        cofremex_serie: 'CFK-65', cofremex_nm: 638, cofremex_precio_usd: 0,
        cardanes_usd: 271.30, soporteria_usd: 491.49, material_electrico_usd: 779.03,
        aplicacion: 'Camiones 4 a 8 Ton', tonelaje: '4 a 8', activo: true,
        precio_freno_usd: 7000, torque_max: '525 NM', peso: '45 kg',
    },
    {
        modelo: 'P5-1', descripcion: 'Freno Retarder para Vehículos 6 a 10 Ton',
        pentar_serie: 'P5-1', pentar_nm: 1200, pentar_precio_usd: 7250,
        frenelsa_serie: 'F16-80', frenelsa_nm: 840, frenelsa_precio_usd: 6156,
        cofremex_serie: 'CFL-90', cofremex_nm: 900, cofremex_precio_usd: 0,
        cardanes_usd: 625.80, soporteria_usd: 498.00, material_electrico_usd: 779.03,
        aplicacion: 'Vehículos 6 a 10 Ton', tonelaje: '6 a 10', activo: true,
        precio_freno_usd: 7250, torque_max: '1200 NM', peso: '38 kg',
    },
    {
        modelo: 'P5', descripcion: 'Freno Retarder para Vehículos 10 a 15 Ton',
        pentar_serie: 'P5', pentar_nm: 1500, pentar_precio_usd: 7500,
        frenelsa_serie: 'F16-140', frenelsa_nm: 1350, frenelsa_precio_usd: 7236,
        cofremex_serie: 'CFK-140', cofremex_nm: 1400, cofremex_precio_usd: 0,
        cardanes_usd: 710.96, soporteria_usd: 498.00, material_electrico_usd: 779.03,
        aplicacion: 'Vehículos 10 a 15 Ton', tonelaje: '10 a 15', activo: true,
        precio_freno_usd: 7500, torque_max: '1500 NM', peso: '36 kg',
    },
    {
        modelo: 'P7-1', descripcion: 'Freno Retarder para Vehículos 15 a 20 Ton',
        pentar_serie: 'P7-1', pentar_nm: 1750, pentar_precio_usd: 8500,
        frenelsa_serie: 'F16-200', frenelsa_nm: 2150, frenelsa_precio_usd: 8316,
        cofremex_serie: 'CFK-200', cofremex_nm: 1650, cofremex_precio_usd: 0,
        cardanes_usd: 1005.20, soporteria_usd: 569.85, material_electrico_usd: 779.03,
        aplicacion: 'Vehículos 15 a 20 Ton', tonelaje: '15 a 20', activo: true,
        precio_freno_usd: 8500, torque_max: '1750 NM', peso: '52 kg',
    },
    {
        modelo: 'P7', descripcion: 'Freno Retarder para Vehículos 20 a 25 Ton',
        pentar_serie: 'P7', pentar_nm: 2050, pentar_precio_usd: 9500,
        frenelsa_serie: 'F16-280', frenelsa_nm: 1950, frenelsa_precio_usd: 9180,
        cofremex_serie: 'CFK-250', cofremex_nm: 1950, cofremex_precio_usd: 6900,
        cardanes_usd: 1005.20, soporteria_usd: 569.85, material_electrico_usd: 779.03,
        aplicacion: 'Vehículos 20 a 25 Ton', tonelaje: '20 a 25', activo: true,
        precio_freno_usd: 9500, torque_max: '2050 NM', peso: '50 kg',
    },
    {
        modelo: 'P11-1', descripcion: 'Freno Retarder para Vehículos 25 a 32 Ton',
        pentar_serie: 'P11-1', pentar_nm: 2850, pentar_precio_usd: 10260,
        frenelsa_serie: 'F16-300', frenelsa_nm: 3000, frenelsa_precio_usd: 10260,
        cofremex_serie: 'CFK-300', cofremex_nm: 2140, cofremex_precio_usd: 0,
        cardanes_usd: 844.76, soporteria_usd: 533.48, material_electrico_usd: 779.03,
        aplicacion: 'Vehículos 25 a 32 Ton', tonelaje: '25 a 32', activo: true,
        precio_freno_usd: 10260, torque_max: '2850 NM', peso: '60 kg',
    },
    {
        modelo: 'P11', descripcion: 'Freno Retarder para Vehículos 32 a 50 Ton',
        pentar_serie: 'P11', pentar_nm: 3300, pentar_precio_usd: 0,
        frenelsa_serie: '', frenelsa_nm: 0, frenelsa_precio_usd: 0,
        cofremex_serie: 'CFK-310', cofremex_nm: 3074, cofremex_precio_usd: 8500,
        cardanes_usd: 844.76, soporteria_usd: 533.48, material_electrico_usd: 779.03,
        aplicacion: 'Vehículos 32 a 50 Ton', tonelaje: '32 a 50', activo: true,
        precio_freno_usd: 8500, torque_max: '3300 NM', peso: '62 kg',
    },
    {
        modelo: 'P10', descripcion: 'Freno Retarder para Vehículos 32 a 50 Ton',
        pentar_serie: 'P10', pentar_nm: 3300, pentar_precio_usd: 11000,
        frenelsa_serie: '', frenelsa_nm: 0, frenelsa_precio_usd: 0,
        cofremex_serie: 'CFK-360', cofremex_nm: 2605, cofremex_precio_usd: 0,
        cardanes_usd: 844.76, soporteria_usd: 533.48, material_electrico_usd: 779.03,
        aplicacion: 'Vehículos 32 a 50 Ton', tonelaje: '32 a 50', activo: true,
        precio_freno_usd: 11000, torque_max: '3300 NM', peso: '65 kg',
    },
    {
        modelo: 'P9', descripcion: 'Freno Retarder para Vehículos 50 a 60 Ton',
        pentar_serie: 'P9', pentar_nm: 3800, pentar_precio_usd: 0,
        frenelsa_serie: '', frenelsa_nm: 0, frenelsa_precio_usd: 0,
        cofremex_serie: 'CFK-500', cofremex_nm: 3775, cofremex_precio_usd: 0,
        cardanes_usd: 844.76, soporteria_usd: 533.48, material_electrico_usd: 779.03,
        aplicacion: 'Vehículos 50 a 60 Ton', tonelaje: '50 a 60', activo: false,
        precio_freno_usd: 0, torque_max: '3800 NM', peso: '70 kg',
    },
];
