// Database types — generated from Supabase schema
// These mirror the SQL schema in supabase/migrations/001_complete_schema.sql

import type {
    OrdenEstado,
    Rol,
    TipoServicio,
    Prioridad,
    OportunidadEstado,
    CotizacionEstado,
    ProductoTipo,
    MovimientoTipo,
    MovimientoMotivo,
} from '@/lib/utils/constants';

// ── Core Entities ──────────────────────────────────

export interface Empresa {
    id: string;
    razon_social: string;
    nombre_comercial: string | null;
    rfc: string | null;
    giro: string | null;
    direccion_fiscal: string | null;
    ciudad: string | null;
    estado: string | null;
    cp: string | null;
    telefono: string | null;
    email: string | null;
    sitio_web: string | null;
    condiciones_pago: 'contado' | '15_dias' | '30_dias' | '45_dias' | '60_dias';
    notas: string | null;
    activo: boolean;
    created_at: string;
    updated_at: string;
}

export interface Sucursal {
    id: string;
    empresa_id: string;
    nombre: string;
    direccion: string | null;
    ciudad: string | null;
    estado: string | null;
    cp: string | null;
    telefono: string | null;
    contacto_principal: string | null;
    es_matriz: boolean;
    activo: boolean;
    created_at: string;
    updated_at: string;
}

export interface Usuario {
    id: string;
    clerk_user_id: string;
    nombre: string;
    apellido: string | null;
    email: string;
    rol: Rol;
    empresa_id: string | null;
    avatar_url: string | null;
    telefono: string | null;
    activo: boolean;
    created_at: string;
    updated_at: string;
}

export interface Contacto {
    id: string;
    empresa_id: string;
    sucursal_id: string | null;
    nombre: string;
    apellido: string;
    puesto: string | null;
    email: string | null;
    telefono: string | null;
    celular: string | null;
    es_decisor: boolean;
    es_contacto_principal: boolean;
    notas: string | null;
    activo: boolean;
    created_at: string;
    updated_at: string;
}

// ── Órdenes de Servicio ────────────────────────────

export interface OrdenServicio {
    id: string;
    numero_orden: number;
    empresa_id: string;
    contacto_id: string | null;
    sucursal_id: string | null;
    tipo_servicio: TipoServicio;
    descripcion: string;
    estado: OrdenEstado;
    prioridad: Prioridad;
    tecnico_id: string | null;
    vendedor_id: string | null;
    fecha_programada: string | null;
    fecha_inicio_servicio: string | null;
    fecha_fin_servicio: string | null;
    cotizacion_id: string | null;
    monto_facturado: number | null;
    numero_factura: string | null;
    fecha_factura: string | null;
    fecha_pago: string | null;
    metodo_pago: string | null;
    requiere_autorizacion: boolean;
    notas_internas: string | null;
    created_at: string;
    updated_at: string;
    // Joined fields
    empresa?: Empresa;
    contacto?: Contacto;
    tecnico?: Usuario;
    vendedor?: Usuario;
}

export interface OrdenHistorial {
    id: string;
    orden_id: string;
    estado_anterior: OrdenEstado | null;
    estado_nuevo: OrdenEstado;
    usuario_id: string | null;
    notas: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
    usuario?: Usuario;
}

export interface Evidencia {
    id: string;
    orden_id: string;
    tipo: 'foto_antes' | 'foto_despues' | 'video' | 'documento' | 'firma';
    archivo_url: string;
    descripcion: string | null;
    subido_por: string | null;
    created_at: string;
}

export interface Encuesta {
    id: string;
    orden_id: string;
    contacto_id: string | null;
    calificacion_general: number | null;
    calificacion_tecnico: number | null;
    calificacion_tiempo: number | null;
    comentarios: string | null;
    respondida: boolean;
    token_acceso: string;
    fecha_envio: string;
    fecha_respuesta: string | null;
}

// ── Sales ──────────────────────────────────────────

export interface Oportunidad {
    id: string;
    empresa_id: string;
    contacto_id: string | null;
    vendedor_id: string | null;
    tipo: 'frenos' | 'refacciones' | 'servicios';
    descripcion: string | null;
    estado: OportunidadEstado;
    monto_estimado: number;
    probabilidad: number;
    fecha_cierre_estimada: string | null;
    motivo_perdida: string | null;
    notas: string | null;
    created_at: string;
    updated_at: string;
    empresa?: Empresa;
    contacto?: Contacto;
    vendedor?: Usuario;
}

export interface Cotizacion {
    id: string;
    numero_cotizacion: number;
    empresa_id: string;
    contacto_id: string | null;
    oportunidad_id: string | null;
    vendedor_id: string | null;
    subtotal: number;
    iva: number;
    total: number;
    estado: CotizacionEstado;
    vigencia_dias: number;
    condiciones: string | null;
    notas: string | null;
    token_aprobacion: string;
    created_at: string;
    updated_at: string;
    items?: CotizacionItem[];
    empresa?: Empresa;
    contacto?: Contacto;
}

export interface CotizacionItem {
    id: string;
    cotizacion_id: string;
    tipo_item: 'freno' | 'refaccion' | 'servicio';
    catalogo_id: string | null;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    descuento_pct: number;
    subtotal: number;
}

// ── Catalogs ───────────────────────────────────────

export interface CatFreno {
    id: string;
    modelo: string;
    descripcion: string | null;
    precio_lista: number;
    especificaciones: Record<string, unknown>;
    imagen_url: string | null;
    activo: boolean;
}

export interface CatRefaccion {
    id: string;
    categoria: string;
    nombre: string;
    numero_parte: string | null;
    descripcion: string | null;
    precio_lista: number;
    unidad: string;
    stock_minimo: number;
    activo: boolean;
}

export interface CatServicio {
    id: string;
    tipo: TipoServicio;
    nombre: string;
    descripcion: string | null;
    precio_base: number;
    duracion_estimada_hrs: number | null;
    requiere_equipo: string[];
    activo: boolean;
}

// ── Inventory ──────────────────────────────────────

export interface Inventario {
    id: string;
    producto_tipo: ProductoTipo;
    freno_id: string | null;
    refaccion_id: string | null;
    nombre: string;
    codigo_interno: string | null;
    stock_actual: number;
    stock_minimo: number;
    ubicacion: string | null;
    costo_unitario: number;
    precio_venta: number;
    activo: boolean;
    created_at: string;
    updated_at: string;
}

export interface MovimientoInventario {
    id: string;
    inventario_id: string;
    tipo: MovimientoTipo;
    cantidad: number;
    motivo: MovimientoMotivo;
    orden_id: string | null;
    oportunidad_id: string | null;
    notas: string | null;
    created_by: string | null;
    created_at: string;
    inventario?: Inventario;
    usuario?: Usuario;
}

// ── Other ──────────────────────────────────────────

export interface Recordatorio {
    id: string;
    tipo: 'seguimiento_cotizacion' | 'cobranza' | 'alerta_pago' | 'tarea';
    referencia_id: string | null;
    usuario_id: string | null;
    fecha_recordatorio: string;
    mensaje: string;
    completado: boolean;
    created_at: string;
}

export interface AuditLog {
    id: string;
    tabla: string;
    registro_id: string;
    accion: 'INSERT' | 'UPDATE' | 'DELETE';
    datos_anteriores: Record<string, unknown> | null;
    datos_nuevos: Record<string, unknown> | null;
    usuario_id: string | null;
    ip_address: string | null;
    created_at: string;
}
