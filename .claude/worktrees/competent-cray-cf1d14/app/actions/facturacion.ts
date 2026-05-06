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
  estado_facturacion: EstadoFacturacion | null;
  created_at: string;
  empresa_nombre: string | null;
}

export interface NotaCreditoRow {
  id: string;
  numero_nc: string | null;
  os_id: string | null;
  empresa_id: string | null;
  monto: number;
  descripcion: string | null;
  created_at: string;
  empresa_nombre: string | null;
}

// ── obtenerFacturas ───────────────────────────────────────────────────────────
export async function obtenerFacturas(): Promise<{ data: FacturaRow[]; error: string | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ordenes_servicio')
      .select('*')
      .in('estado', ['facturado', 'pagado'])
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (data ?? []) as any[];
    const empresaIds = Array.from(new Set(rows.map((r: { empresa_id: string }) => r.empresa_id).filter(Boolean)));
    const { data: empresas } = empresaIds.length
      ? await supabaseAdmin.from('empresas').select('id, nombre_comercial').in('id', empresaIds)
      : { data: [] as Array<{ id: string; nombre_comercial: string }> };
    const empresaMap = new Map((empresas ?? []).map(e => [e.id, e.nombre_comercial]));

    const enriched: FacturaRow[] = rows.map(r => ({
      id:                 r.id,
      numero:             r.numero,
      numero_factura:     r.numero_factura ?? null,
      monto_factura:      r.monto_factura ?? null,
      concepto_factura:   r.concepto_factura ?? null,
      fecha_vencimiento:  r.fecha_vencimiento ?? null,
      estado_facturacion: r.estado_facturacion ?? null,
      created_at:         r.created_at,
      empresa_nombre:     empresaMap.get(r.empresa_id) ?? null,
    }));

    return { data: enriched, error: null };
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
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (data ?? []) as any[];
    const empresaIds = Array.from(new Set(rows.map((r: { empresa_id: string | null }) => r.empresa_id).filter((x): x is string => !!x)));
    const { data: empresas } = empresaIds.length
      ? await supabaseAdmin.from('empresas').select('id, nombre_comercial').in('id', empresaIds)
      : { data: [] as Array<{ id: string; nombre_comercial: string }> };
    const empresaMap = new Map((empresas ?? []).map(e => [e.id, e.nombre_comercial]));

    const enriched: NotaCreditoRow[] = rows.map(r => ({
      id:             r.id,
      numero_nc:      r.numero_nc ?? null,
      os_id:          r.os_id ?? null,
      empresa_id:     r.empresa_id ?? null,
      monto:          r.monto,
      descripcion:    r.descripcion ?? null,
      created_at:     r.created_at,
      empresa_nombre: (r.empresa_id && empresaMap.get(r.empresa_id)) ?? null,
    }));

    return { data: enriched, error: null };
  } catch (e) { return { data: [], error: String(e) }; }
}

// ── crearNotaCredito ──────────────────────────────────────────────────────────
export async function crearNotaCredito(datos: {
  numero_nc?: string;
  os_id?: string;
  empresa_id?: string;
  monto: number;
  descripcion?: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin.from('notas_credito').insert(datos);
  if (error) return { error: error.message };
  return { error: null };
}

// ── eliminarNotaCredito ───────────────────────────────────────────────────────
export async function eliminarNotaCredito(id: string): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin.from('notas_credito').delete().eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

// ── resumenFacturacion ────────────────────────────────────────────────────────
export async function obtenerResumenFacturacion(): Promise<{
  totalFacturado: number; totalCobrado: number; pendientes: number;
  vencidas: number; totalNotasCredito: number; error: string | null;
}> {
  try {
    const [{ data: facts }, { data: ncs }] = await Promise.all([
      supabaseAdmin.from('ordenes_servicio').select('*').in('estado', ['facturado', 'pagado']),
      supabaseAdmin.from('notas_credito').select('monto'),
    ]);
    const totalFacturado    = (facts ?? []).reduce((s, r) => s + (r.monto_factura ?? 0), 0);
    const totalCobrado      = (facts ?? []).filter(r => r.estado_facturacion === 'pagada').reduce((s, r) => s + (r.monto_factura ?? 0), 0);
    const pendientes        = (facts ?? []).filter(r => ['pendiente_facturar', 'facturada', 'enviada_cliente'].includes(r.estado_facturacion ?? '')).length;
    const vencidas          = (facts ?? []).filter(r => r.estado_facturacion === 'vencida').length;
    const totalNotasCredito = (ncs ?? []).reduce((s, r) => s + (r.monto ?? 0), 0);
    return { totalFacturado, totalCobrado, pendientes, vencidas, totalNotasCredito, error: null };
  } catch (e) { return { totalFacturado: 0, totalCobrado: 0, pendientes: 0, vencidas: 0, totalNotasCredito: 0, error: String(e) }; }
}
