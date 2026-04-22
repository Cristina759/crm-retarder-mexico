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

export interface OportunidadRow {
  id: string;
  empresa_id: string;
  titulo: string;
  estado: OportunidadEstado;
  probabilidad: number;
  monto: number;
  vendedor_id: string | null;
  created_at: string;
  updated_at: string;
  empresas: { nombre_comercial: string } | null;
  vendedor: { nombre: string } | null;
}

export interface CrearOportunidadInput {
  titulo: string;
  empresa_id?: string;
  empresa_nombre?: string;
  vendedor_id?: string | null;
  estado?: OportunidadEstado;
  probabilidad?: number;
  monto?: number;
}

// ── Cotizaciones ──────────────────────────────────────────────────────────────
export interface CotizacionRow {
  id: string;
  folio: string;
  empresa_id: string;
  oportunidad_id: string | null;
  vendedor_id: string | null;
  tipo: string;
  estado: string;
  subtotal: number;
  iva: number;
  total_mxn: number;
  pdf_url: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
  empresas: { nombre_comercial: string } | null;
  vendedor: { nombre: string } | null;
  oportunidad: { estado: string } | null;
}

export interface CrearCotizacionInput {
  empresa_nombre: string;
  empresa_id?: string;
  vendedor_id?: string | null;
  tipo: string;
  subtotal: number;
  iva: number;
  total_mxn: number;
  notas?: string;
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
  fotos_antes: string[];
  fotos_despues: string[];
  firma_tecnico: string | null;
  firma_cliente: string | null;
  encuesta_enviada: boolean;
  factura_generada: boolean;
  notas: string | null;
  // Nuevos campos pipeline
  numero_os_manual: string | null;
  foto_os: string | null;
  numero_orden_compra: string | null;
  foto_orden_compra: string | null;
  archivada: boolean;
  created_at: string;
  updated_at: string;
  empresas: { nombre_comercial: string } | null;
  tecnico: { nombre: string } | null;
}

export type OSEstado =
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
