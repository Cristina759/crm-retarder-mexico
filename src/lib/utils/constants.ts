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

export type Rol = 'admin' | 'vendedor' | 'tecnico' | 'cliente' | 'direccion';

export const ROL_LABELS: Record<Rol, string> = {
    admin: 'Admin/Dirección',
    vendedor: 'Vendedor',
    tecnico: 'Técnico',
    cliente: 'Cliente',
    direccion: 'Admin/Dirección',
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
    // Campos de facturación (datos reales)
    numero_factura?: string;
    mano_obra?: number;
    refacciones?: number;
    gastos_traslado?: number;
    subtotal?: number;
    iva?: number;
    pagado?: boolean;
}

export const DEMO_ORDENES: DemoOrden[] = [
    // ── DATOS REALES — Facturados 2026 ──────────────────
    // Pagados
    { id: '1', numero: 'OS-00487', empresa: 'Minería Burval', tipo: 'instalacion', estado: 'pagado', prioridad: 'alta', tecnico: 'Abraham Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B558 — Pagado', fecha_creado: '2026-01-10', monto: 24326.62, numero_factura: 'B558', mano_obra: 1200, refacciones: 14771.22, gastos_traslado: 5000, subtotal: 20971.22, iva: 3355.40, pagado: true },
    { id: '2', numero: 'OS-00519', empresa: 'Austin Bacis', tipo: 'instalacion', estado: 'pagado', prioridad: 'urgente', tecnico: 'Israel Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B560 — Instalación completa — Pagado', fecha_creado: '2026-01-15', monto: 178216.75, numero_factura: 'B560', mano_obra: 14645.67, refacciones: 124716.90, gastos_traslado: 14272.56, subtotal: 153635.13, iva: 24581.62, pagado: true },
    { id: '3', numero: 'OS-00559', empresa: 'Austin Bacis', tipo: 'correctivo', estado: 'pagado', prioridad: 'media', tecnico: 'Abraham Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B559 — Refacciones — Pagado', fecha_creado: '2026-01-12', monto: 17980, numero_factura: 'B559', refacciones: 15500, subtotal: 15500, iva: 2480, pagado: true },
    { id: '4', numero: 'OS-00569', empresa: 'Maple Transportes y Servicios', tipo: 'instalacion', estado: 'pagado', prioridad: 'alta', tecnico: 'Israel Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B569 — Instalación mayor — Pagado', fecha_creado: '2026-01-20', monto: 435647.28, numero_factura: 'B569', mano_obra: 12894, refacciones: 335156, gastos_traslado: 27508, subtotal: 375558, iva: 60089.28, pagado: true },
    { id: '5', numero: 'OS-00492b', empresa: 'La Cantera', tipo: 'correctivo', estado: 'pagado', prioridad: 'media', tecnico: 'Abraham Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B576 — Servicio correctivo — Pagado', fecha_creado: '2026-02-01', monto: 10371.33, numero_factura: 'B576', mano_obra: 4750, refacciones: 1690.80, gastos_traslado: 2500, subtotal: 8940.80, iva: 1430.53, pagado: true },
    { id: '6', numero: 'OS-00618', empresa: 'Promaco', tipo: 'instalacion', estado: 'pagado', prioridad: 'alta', tecnico: 'Israel Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B578 — Pagado', fecha_creado: '2026-02-05', monto: 13375.26, numero_factura: 'B578', mano_obra: 4530.40, gastos_traslado: 7000, subtotal: 11530.40, iva: 1844.86, pagado: true },
    { id: '7', numero: 'OS-00617', empresa: 'Promaco', tipo: 'instalacion', estado: 'pagado', prioridad: 'alta', tecnico: 'Abraham Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B579 — Instalación con refacciones — Pagado', fecha_creado: '2026-02-06', monto: 39510.44, numero_factura: 'B579', mano_obra: 7250, refacciones: 19810.72, gastos_traslado: 7000, subtotal: 34060.72, iva: 5449.72, pagado: true },
    { id: '8', numero: 'OS-00580', empresa: 'Promaco', tipo: 'instalacion', estado: 'pagado', prioridad: 'media', tecnico: 'Israel Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B580 — Pagado', fecha_creado: '2026-02-07', monto: 26100, numero_factura: 'B580', mano_obra: 8500, gastos_traslado: 14000, subtotal: 22500, iva: 3600, pagado: true },
    { id: '9', numero: 'OS-00549', empresa: 'Versa Perforaciones', tipo: 'instalacion', estado: 'pagado', prioridad: 'alta', tecnico: 'Abraham Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B582 — OS 549,550,551,552 — Pagado', fecha_creado: '2026-02-10', monto: 40960.10, numero_factura: 'B582', mano_obra: 20150, refacciones: 5160.43, gastos_traslado: 10000, subtotal: 35310.43, iva: 5649.67, pagado: true },

    // Facturados (pendientes de pago)
    { id: '10', numero: 'OS-00486', empresa: 'La Cantera (Capela)', tipo: 'instalacion', estado: 'facturado', prioridad: 'alta', tecnico: 'Israel Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B577 — Pendiente de pago', fecha_creado: '2026-01-11', monto: 43500, numero_factura: 'B577', mano_obra: 7000, refacciones: 10500, gastos_traslado: 20000, subtotal: 37500, iva: 6000, pagado: false },
    { id: '11', numero: 'OS-00488', empresa: 'Raunel Ruiz', tipo: 'instalacion', estado: 'facturado', prioridad: 'alta', tecnico: 'Abraham Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B568 — Pendiente de pago', fecha_creado: '2026-01-13', monto: 40410.58, numero_factura: 'B568', mano_obra: 7000, refacciones: 21836.71, gastos_traslado: 6000, subtotal: 34836.71, iva: 5573.87, pagado: false },
    { id: '12', numero: 'OS-00507', empresa: 'Austin Bacis', tipo: 'correctivo', estado: 'facturado', prioridad: 'media', tecnico: 'Israel Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B561 — Servicio unidad 507', fecha_creado: '2026-01-16', monto: 7830, numero_factura: 'B561', mano_obra: 4250, gastos_traslado: 2500, subtotal: 6750, iva: 1080, pagado: false },
    { id: '13', numero: 'OS-00506', empresa: 'Austin Bacis', tipo: 'correctivo', estado: 'facturado', prioridad: 'media', tecnico: 'Abraham Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B562 — Servicio unidad 506', fecha_creado: '2026-01-16', monto: 7830, numero_factura: 'B562', mano_obra: 4250, gastos_traslado: 2500, subtotal: 6750, iva: 1080, pagado: false },
    { id: '14', numero: 'OS-00505', empresa: 'Austin Bacis', tipo: 'correctivo', estado: 'facturado', prioridad: 'media', tecnico: 'Israel Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B563 — Servicio unidad 505', fecha_creado: '2026-01-17', monto: 7830, numero_factura: 'B563', mano_obra: 4250, gastos_traslado: 2500, subtotal: 6750, iva: 1080, pagado: false },
    { id: '15', numero: 'OS-00504', empresa: 'Austin Bacis', tipo: 'correctivo', estado: 'facturado', prioridad: 'media', tecnico: 'Abraham Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B564 — Servicio unidad 504', fecha_creado: '2026-01-17', monto: 7830, numero_factura: 'B564', mano_obra: 4250, gastos_traslado: 2500, subtotal: 6750, iva: 1080, pagado: false },
    { id: '16', numero: 'OS-00503', empresa: 'Austin Bacis', tipo: 'correctivo', estado: 'facturado', prioridad: 'media', tecnico: 'Israel Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B565 — Servicio unidad 503', fecha_creado: '2026-01-18', monto: 7830, numero_factura: 'B565', mano_obra: 4250, gastos_traslado: 2500, subtotal: 6750, iva: 1080, pagado: false },
    { id: '17', numero: 'OS-00502', empresa: 'Austin Bacis', tipo: 'correctivo', estado: 'facturado', prioridad: 'media', tecnico: 'Abraham Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B566 — Servicio unidad 502', fecha_creado: '2026-01-18', monto: 7830, numero_factura: 'B566', mano_obra: 4250, gastos_traslado: 2500, subtotal: 6750, iva: 1080, pagado: false },
    { id: '18', numero: 'OS-00501', empresa: 'Austin Bacis', tipo: 'correctivo', estado: 'facturado', prioridad: 'media', tecnico: 'Israel Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B567 — Servicio unidad 501', fecha_creado: '2026-01-19', monto: 7830, numero_factura: 'B567', mano_obra: 4250, gastos_traslado: 2500, subtotal: 6750, iva: 1080, pagado: false },
    { id: '19', numero: 'OS-00492', empresa: 'La Cantera', tipo: 'correctivo', estado: 'facturado', prioridad: 'media', tecnico: 'Abraham Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B570 — Servicio con refacciones', fecha_creado: '2026-01-25', monto: 10081.33, numero_factura: 'B570', mano_obra: 4500, refacciones: 1690.80, gastos_traslado: 2500, subtotal: 8690.80, iva: 1390.53, pagado: false },
    { id: '20', numero: 'OS-00497', empresa: 'La Cantera', tipo: 'correctivo', estado: 'facturado', prioridad: 'media', tecnico: 'Israel Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B571 — Mano de obra', fecha_creado: '2026-01-26', monto: 7830, numero_factura: 'B571', mano_obra: 4250, gastos_traslado: 2500, subtotal: 6750, iva: 1080, pagado: false },
    { id: '21', numero: 'OS-00496', empresa: 'La Cantera', tipo: 'correctivo', estado: 'facturado', prioridad: 'media', tecnico: 'Abraham Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B572 — Servicio con refacciones', fecha_creado: '2026-01-27', monto: 10081.33, numero_factura: 'B572', mano_obra: 4500, refacciones: 1690.80, gastos_traslado: 2500, subtotal: 8690.80, iva: 1390.53, pagado: false },
    { id: '22', numero: 'OS-00495', empresa: 'La Cantera', tipo: 'correctivo', estado: 'facturado', prioridad: 'media', tecnico: 'Israel Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B573 — Servicio con refacciones', fecha_creado: '2026-01-28', monto: 8562.15, numero_factura: 'B573', mano_obra: 4500, refacciones: 381.16, gastos_traslado: 2500, subtotal: 7381.16, iva: 1180.99, pagado: false },
    { id: '23', numero: 'OS-00494', empresa: 'La Cantera', tipo: 'correctivo', estado: 'facturado', prioridad: 'media', tecnico: 'Abraham Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B574 — Mano de obra', fecha_creado: '2026-01-29', monto: 7830, numero_factura: 'B574', mano_obra: 4250, gastos_traslado: 2500, subtotal: 6750, iva: 1080, pagado: false },
    { id: '24', numero: 'OS-00493', empresa: 'La Cantera', tipo: 'correctivo', estado: 'facturado', prioridad: 'media', tecnico: 'Israel Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B575 — Mano de obra', fecha_creado: '2026-01-30', monto: 7830, numero_factura: 'B575', mano_obra: 4250, gastos_traslado: 2500, subtotal: 6750, iva: 1080, pagado: false },
    { id: '25', numero: 'OS-00581', empresa: 'Zemer Constructora', tipo: 'correctivo', estado: 'facturado', prioridad: 'baja', tecnico: 'Abraham Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B581 — Refacciones', fecha_creado: '2026-02-08', monto: 6758.66, numero_factura: 'B581', refacciones: 5826.43, subtotal: 5826.43, iva: 932.23, pagado: false },
    { id: '26', numero: 'OS-00583', empresa: 'Denisse Perlette Alvarez Cruz', tipo: 'correctivo', estado: 'facturado', prioridad: 'media', tecnico: 'Israel Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B583 — Mano de obra', fecha_creado: '2026-02-12', monto: 7830, numero_factura: 'B583', mano_obra: 4250, gastos_traslado: 2500, subtotal: 6750, iva: 1080, pagado: false },
    { id: '27', numero: 'OS-00584', empresa: 'La Cantera Tizapa', tipo: 'instalacion', estado: 'facturado', prioridad: 'alta', tecnico: 'Abraham Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Factura B584 — Refacciones mayor', fecha_creado: '2026-02-15', monto: 179005.79, numero_factura: 'B584', refacciones: 154315.34, subtotal: 154315.34, iva: 24690.45, pagado: false },

    // ── POR FACTURAR — La Cantera Ciénega (Servicio concluido, pendiente factura) ──
    { id: '28', numero: 'OS-00518', empresa: 'La Cantera Ciénega', tipo: 'correctivo', estado: 'servicio_concluido', prioridad: 'media', tecnico: 'Abraham Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Por facturar — Servicio con refacciones', fecha_creado: '2026-02-16', monto: 14783.69, mano_obra: 4550, refacciones: 5694.56, gastos_traslado: 2500, subtotal: 12744.56, iva: 2039.13, pagado: false },
    { id: '29', numero: 'OS-00508', empresa: 'La Cantera Ciénega', tipo: 'correctivo', estado: 'servicio_concluido', prioridad: 'media', tecnico: 'Israel Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Por facturar — Servicio con refacciones', fecha_creado: '2026-02-17', monto: 8979.73, mano_obra: 4750, refacciones: 491.15, gastos_traslado: 2500, subtotal: 7741.15, iva: 1238.58, pagado: false },
    { id: '30', numero: 'OS-00509', empresa: 'La Cantera Ciénega', tipo: 'correctivo', estado: 'servicio_concluido', prioridad: 'alta', tecnico: 'Abraham Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Por facturar — Servicio mayor con refacciones', fecha_creado: '2026-02-17', monto: 32036.44, mano_obra: 5750, refacciones: 19367.62, gastos_traslado: 2500, subtotal: 27617.62, iva: 4418.82, pagado: false },
    { id: '31', numero: 'OS-00510', empresa: 'La Cantera Ciénega', tipo: 'correctivo', estado: 'servicio_concluido', prioridad: 'media', tecnico: 'Israel Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Por facturar — Servicio con refacciones', fecha_creado: '2026-02-18', monto: 9004.50, mano_obra: 4700, refacciones: 562.50, gastos_traslado: 2500, subtotal: 7762.50, iva: 1242, pagado: false },
    { id: '32', numero: 'OS-00511', empresa: 'La Cantera Ciénega', tipo: 'correctivo', estado: 'servicio_concluido', prioridad: 'media', tecnico: 'Abraham Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Por facturar — Mano de obra', fecha_creado: '2026-02-18', monto: 7830, mano_obra: 4250, gastos_traslado: 2500, subtotal: 6750, iva: 1080, pagado: false },
    { id: '33', numero: 'OS-00515', empresa: 'La Cantera Ciénega', tipo: 'correctivo', estado: 'servicio_concluido', prioridad: 'media', tecnico: 'Israel Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Por facturar — Mano de obra', fecha_creado: '2026-02-19', monto: 7830, mano_obra: 4250, gastos_traslado: 2500, subtotal: 6750, iva: 1080, pagado: false },
    { id: '34', numero: 'OS-00514', empresa: 'La Cantera Ciénega', tipo: 'correctivo', estado: 'servicio_concluido', prioridad: 'media', tecnico: 'Abraham Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Por facturar — Servicio con refacciones', fecha_creado: '2026-02-19', monto: 10011.67, mano_obra: 4600, refacciones: 1530.75, gastos_traslado: 2500, subtotal: 8630.75, iva: 1380.92, pagado: false },
    { id: '35', numero: 'OS-00513', empresa: 'La Cantera Ciénega', tipo: 'correctivo', estado: 'servicio_concluido', prioridad: 'media', tecnico: 'Israel Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Por facturar — Servicio con refacciones', fecha_creado: '2026-02-20', monto: 8474.98, mano_obra: 4600, refacciones: 206.02, gastos_traslado: 2500, subtotal: 7306.02, iva: 1168.96, pagado: false },
    { id: '36', numero: 'OS-00512', empresa: 'La Cantera Ciénega', tipo: 'correctivo', estado: 'servicio_concluido', prioridad: 'media', tecnico: 'Abraham Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Por facturar — Mano de obra', fecha_creado: '2026-02-20', monto: 7830, mano_obra: 4250, gastos_traslado: 2500, subtotal: 6750, iva: 1080, pagado: false },
    { id: '37', numero: 'OS-00517', empresa: 'La Cantera Ciénega', tipo: 'correctivo', estado: 'servicio_concluido', prioridad: 'alta', tecnico: 'Israel Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Por facturar — Servicio mayor con refacciones', fecha_creado: '2026-02-21', monto: 32584.20, mano_obra: 5150, refacciones: 20439.83, gastos_traslado: 2500, subtotal: 28089.83, iva: 4494.37, pagado: false },
    { id: '38', numero: 'OS-00516', empresa: 'La Cantera Ciénega', tipo: 'correctivo', estado: 'servicio_concluido', prioridad: 'media', tecnico: 'Abraham Garcia', vendedor: 'Ing. Cristina Velasco', descripcion: 'Por facturar — Servicio con refacciones', fecha_creado: '2026-02-22', monto: 14783.69, mano_obra: 4550, refacciones: 5694.56, gastos_traslado: 2500, subtotal: 12744.56, iva: 2039.13, pagado: false },
];

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

export const DEFAULT_TIPO_CAMBIO = 17.2563;

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
