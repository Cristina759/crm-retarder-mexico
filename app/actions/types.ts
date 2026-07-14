// Tipos compartidos para las server actions — NO usar 'use server' aquí

// ── Usuarios ──────────────────────────────────────────────────────────────────
export interface UsuarioRow {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

// ── Oportunidades ─────────────────────────────────────────────────────────────
export type OportunidadEstado =
  | 'lead'
  | 'calificacion'
  | 'cotizacion_enviada'
  | 'seguimiento_activo'
  | 'negociacion_cierre'
  | 'ganado'
  | 'perdido';

// ── Cotizaciones ──────────────────────────────────────────────────────────────
export interface CotizacionRow {
  id: string;
  folio: string | null;
  empresa_id: string;
  oportunidad_id: string | null;
  vendedor_id: string | null;
  tipo: string | null;
  estado: string | null;
  subtotal: number | null;
  iva: number | null;
  total_mxn: number | null;
  notas: string | null;
  created_at: string | null;
  updated_at: string | null;
  empresas: { nombre_comercial: string; email?: string | null } | null;
  vendedor: { nombre: string } | null;
  oportunidad: { estado: string } | null;
}

export interface CrearCotizacionInput {

  empresa_id?: string;
  empresa_nombre: string;
  tipo: string;
  subtotal: number;
  iva: number;
  total_mxn: number;
  notas?: string;
  vendedor_id?: string | null;
  folio?: string;
}

// ── Oportunidades ─────────────────────────────────────────────────────────────
export interface CrearOportunidadInput {
  empresa_id: string;
  titulo: string;
  estado?: string;
  probabilidad?: number;
  monto_estimado?: number;
  vendedor_id?: string;
}

export interface OportunidadRow {
  id: string;
  empresa_id: string;
  titulo: string;
  estado: OportunidadEstado;
  probabilidad: number;
  monto_estimado: number;
  vendedor_id: string | null;
  created_at: string;
  updated_at: string;
  archivada?: boolean;
  empresas: { nombre_comercial: string } | null;
  vendedor: { nombre: string } | null;
}

// ── Órdenes de Servicio ───────────────────────────────────────────────────────
export interface OSRow {
  id: string;
  numero: string;
  empresa_id: string;
  oportunidad_id: string | null;
  cotizacion_id: string | null;
  tecnico_id: string | null;
  estado: string;
  fase: number;
  descripcion_trabajo: string | null;
  fecha_tentativa: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  fotos_antes: any;
  fotos_despues: any;
  firma_tecnico: string | null;
  firma_cliente: string | null;
  encuesta_enviada: boolean;
  factura_generada: boolean;
  notas: string | null;
  numero_os_manual: string | null;
  foto_os: string | null;
  numero_orden_compra: string | null;
  foto_orden_compra: string | null;
  archivada: boolean;
  // Campos de facturación (añadidos en migración 005/006)
  numero_factura: string | null;
  monto_factura: number | null;
  concepto_factura: string | null;
  fecha_vencimiento: string | null;
  abonos: any[];
  created_at: string;
  updated_at: string;
  empresas: { nombre_comercial: string; telefono: string | null } | null;
  tecnico: { nombre: string } | null;
  estado_facturacion: string;
}

export type OSEstado =
  | 'solicitud_recibida'
  | 'tecnico_asignado'
  | 'servicio_programado'
  | 'documentacion_enviada'
  | 'tecnico_en_contacto'
  | 'servicio_en_proceso'
  | 'autorizacion_adicional'
  | 'servicio_concluido'
  | 'evidencia_cargada'
  | 'documentacion_entregada'
  | 'encuesta_enviada'
  | 'facturado'
  | 'pagado';

export const OS_ESTADOS: OSEstado[] = [
  'solicitud_recibida',
  'tecnico_asignado',
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
];

export const OS_FASE: Record<OSEstado, number> = {
  solicitud_recibida:      1,
  tecnico_asignado:        1,
  servicio_programado:     1,
  documentacion_enviada:   1,
  tecnico_en_contacto:     1,
  servicio_en_proceso:     1,
  autorizacion_adicional:  2,
  servicio_concluido:      2,
  evidencia_cargada:       2,
  documentacion_entregada: 3,
  encuesta_enviada:        3,
  facturado:               3,
  pagado:                  3,
};
