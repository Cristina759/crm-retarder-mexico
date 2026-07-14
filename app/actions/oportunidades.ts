'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import type { OportunidadEstado, OportunidadRow, CrearOportunidadInput } from './types';

// ── obtenerOportunidades (ULTRA-LIGERA) ──────────────────────────────────────
export async function obtenerOportunidades(): Promise<{ data: OportunidadRow[]; error: string | null; }> {
  try {
    // 1. Consulta plana y rápida
    // Cast a any: columna `archivada` aun no reflejada en los tipos generados de Supabase
    const { data, error } = await (supabaseAdmin
      .from('oportunidades') as any)
      .select('id, titulo, estado, probabilidad, monto_estimado, vendedor_id, empresa_id, created_at, archivada')
      .or('archivada.is.null,archivada.eq.false')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) return { data: [], error: error.message };
    if (!data || data.length === 0) return { data: [], error: null };

    // 2. Carga de nombres de empresas en paralelo (más rápido)
    const empresaIds: string[] = Array.from(new Set(data.map((r: any) => r.empresa_id).filter(Boolean)));
    const { data: empresas } = await supabaseAdmin
      .from('empresas')
      .select('id, nombre_comercial')
      .in('id', empresaIds);
    
    const empresaMap = new Map((empresas ?? []).map(e => [e.id, e.nombre_comercial]));

    // 3. Enriquecimiento en memoria
    const enriched: OportunidadRow[] = data.map((r: any) => ({
      ...r,
      titulo: r.titulo || 'Sin título',
      estado: (r.estado as OportunidadEstado) || 'lead',
      probabilidad: r.probabilidad ?? 0,
      monto_estimado: r.monto_estimado ?? 0,
      created_at: r.created_at || new Date().toISOString(),
      updated_at: r.created_at || new Date().toISOString(),
      empresas: empresaMap.has(r.empresa_id) ? { nombre_comercial: empresaMap.get(r.empresa_id)! } : null,
      vendedor: null,
    }));

    return { data: enriched, error: null };
  } catch (e) {
    console.error('[obtenerOportunidades] Error:', e);
    return { data: [], error: 'Error de conexión rápida' };
  }
}

// ── actualizarEstadoOportunidad ───────────────────────────────────────────────
export async function actualizarEstadoOportunidad(id: string, estado: OportunidadEstado, probabilidad?: number) {
  const { error } = await supabaseAdmin.from('oportunidades').update({ estado, probabilidad }).eq('id', id);
  return { error: error?.message ?? null };
}

// ── eliminarOportunidad ───────────────────────────────────────────────────────
export async function eliminarOportunidad(id: string) {
  // Desligar registros que apuntan a esta oportunidad antes de borrar
  await supabaseAdmin.from('cotizaciones').update({ oportunidad_id: null }).eq('oportunidad_id', id);
  await supabaseAdmin.from('ordenes_servicio').update({ oportunidad_id: null }).eq('oportunidad_id', id);

  const { error } = await supabaseAdmin.from('oportunidades').delete().eq('id', id);
  return { error: error?.message ?? null };
}

// ── crearOportunidad ──────────────────────────────────────────────────────────
export async function crearOportunidad(input: CrearOportunidadInput) {
  try {
    const { data, error } = await supabaseAdmin
      .from('oportunidades')
      .insert({
        empresa_id: input.empresa_id,
        titulo: input.titulo,
        estado: (input.estado || 'lead') as any,
        probabilidad: input.probabilidad || 50,
        monto_estimado: input.monto_estimado || 0,
        vendedor_id: input.vendedor_id
      })
      .select('id')
      .single();
    return { data, error: error?.message ?? null };
  } catch (e) { return { data: null, error: String(e) }; }
}
