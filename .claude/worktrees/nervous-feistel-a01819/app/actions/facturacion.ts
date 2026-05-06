'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

export type EstadoFacturacion =
  | 'pendiente_facturar'
  | 'facturada'
  | 'enviada_cliente'
  | 'pagada'
  | 'vencida';

export interface FacturaRow {
  id: string;
  numero: string;
  numero_factura: string | null;
  monto_factura: number | null;
  concepto_factura: string | null;
  fecha_vencimiento: string | null;
  estado_facturacion: EstadoFacturacion;
  created_at: string;
  empresas: { nombre_comercial: string } | null;
  tecnico: { nombre: string } | null;
}

export interface NotaCreditoRow {
  id: string;
  numero_nc: string | null;
  os_id: string | null;
  empresa_id: string | null;
  monto: number;
  descripcion: string | null;
  fecha: string;
  created_at: string;
  empresas: { nombre_comercial: string } | null;
  orden: { numero: string } | null;
}

const SELECT_FACTURA = `
  id, numero, numero_factura, monto_factura, concepto_factura,
  fecha_vencimiento, estado_facturacion, created_at,
  empresas:empresa_id(nombre_comercial),
  tecnico:tecnico_id(nombre)
`;

// ── obtenerFacturas ───────────────────────────────────────────────────────────
export async function obtenerFacturas(): Promise<{ data: FacturaRow[]; error: string | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ordenes_servicio')
      .select(SELECT_FACTURA)
      .in('estado', ['facturado', 'pagado'])
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: (data ?? []) as unknown as FacturaRow[], error: null };
  } catch (e) { return { data: [], error: String(e) }; }
}

// ── actualizarFactura ─────────────────────────────────────────────────────────
export async function actualizarFactura(id: string, datos: {
  numero_factura?: string | null;
  monto_factura?: number | null;
  concepto_factura?: string | null;
  fecha_vencimiento?: string | null;
  estado_facturacion?: EstadoFacturacion;
}): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin
    .from('ordenes_servicio')
    .update({ ...datos, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

// ── limpiarDatosFactura ───────────────────────────────────────────────────────
/** Borra los datos de factura y regresa la OS al estado anterior (documentacion_entregada) */
export async function limpiarDatosFactura(id: string): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin
    .from('ordenes_servicio')
    .update({
      numero_factura:     null,
      monto_factura:      null,
      concepto_factura:   null,
      fecha_vencimiento:  null,
      estado_facturacion: 'pendiente_facturar',
      estado:             'documentacion_entregada',
      fase:               3,
      updated_at:         new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

// ── marcarPagada ──────────────────────────────────────────────────────────────
export async function marcarFacturaPagada(id: string): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin
    .from('ordenes_servicio')
    .update({ estado_facturacion: 'pagada', updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

// ── obtenerNotasCredito ───────────────────────────────────────────────────────
export async function obtenerNotasCredito(): Promise<{ data: NotaCreditoRow[]; error: string | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('notas_credito')
      .select('*, empresas:empresa_id(nombre_comercial), orden:os_id(numero)')
      .order('fecha', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: (data ?? []) as unknown as NotaCreditoRow[], error: null };
  } catch (e) { return { data: [], error: String(e) }; }
}

// ── crearNotaCredito ──────────────────────────────────────────────────────────
export async function crearNotaCredito(datos: {
  numero_nc?: string;
  os_id?: string;
  empresa_id?: string;
  monto: number;
  descripcion?: string;
  fecha?: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin
    .from('notas_credito')
    .insert(datos);
  if (error) return { error: error.message };
  return { error: null };
}

// ── eliminarNotaCredito ───────────────────────────────────────────────────────
export async function eliminarNotaCredito(id: string): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin
    .from('notas_credito')
    .delete()
    .eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

// ── resumenFacturacion (para dashboard) ───────────────────────────────────────
export async function obtenerResumenFacturacion(): Promise<{
  totalFacturado: number;
  totalCobrado: number;
  pendientes: number;
  vencidas: number;
  totalNotasCredito: number;
  error: string | null;
}> {
  try {
    const [{ data: facts }, { data: ncs }] = await Promise.all([
      supabaseAdmin
        .from('ordenes_servicio')
        .select('monto_factura, estado_facturacion')
        .in('estado', ['facturado', 'pagado']),
      supabaseAdmin
        .from('notas_credito')
        .select('monto'),
    ]);

    const totalFacturado = (facts ?? []).reduce((s, r) => s + (r.monto_factura ?? 0), 0);
    const totalCobrado   = (facts ?? []).filter(r => r.estado_facturacion === 'pagada').reduce((s, r) => s + (r.monto_factura ?? 0), 0);
    const pendientes     = (facts ?? []).filter(r => ['pendiente_facturar', 'facturada', 'enviada_cliente'].includes(r.estado_facturacion)).length;
    const vencidas       = (facts ?? []).filter(r => r.estado_facturacion === 'vencida').length;
    const totalNotasCredito = (ncs ?? []).reduce((s, r) => s + (r.monto ?? 0), 0);

    return { totalFacturado, totalCobrado, pendientes, vencidas, totalNotasCredito, error: null };
  } catch (e) { return { totalFacturado: 0, totalCobrado: 0, pendientes: 0, vencidas: 0, totalNotasCredito: 0, error: String(e) }; }
}
