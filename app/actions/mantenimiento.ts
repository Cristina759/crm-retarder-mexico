'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

// ── limpiarPipelinesDelMes ────────────────────────────────────────────────────
// Archiva (no borra) las tarjetas ya cerradas de los dos pipelines:
// - Oportunidades en 'ganado'/'ganada'/'perdido'/'perdida' → archivada = true
// - Órdenes de Servicio en 'facturado'/'pagado' que aun no estén archivadas
// Las tarjetas activas (en proceso) no se tocan. Pensado para correr una vez
// al mes vía Vercel Cron (ver vercel.json + app/api/cron/limpiar-pipelines).
export async function limpiarPipelinesDelMes() {
  try {
    // Cast a any: columna `archivada` de oportunidades aun no reflejada en tipos generados
    const { data: oportunidadesArchivadas, error: errOps } = await (supabaseAdmin
      .from('oportunidades') as any)
      .update({ archivada: true })
      .in('estado', ['ganado', 'ganada', 'perdido', 'perdida'])
      .or('archivada.is.null,archivada.eq.false')
      .select('id');

    const { data: osArchivadas, error: errOs } = await supabaseAdmin
      .from('ordenes_servicio')
      .update({ archivada: true })
      .in('estado', ['facturado', 'pagado'])
      .or('archivada.is.null,archivada.eq.false')
      .select('id');

    return {
      oportunidadesArchivadas: oportunidadesArchivadas?.length ?? 0,
      osArchivadas: osArchivadas?.length ?? 0,
      error: errOps?.message || errOs?.message || null,
    };
  } catch (e) {
    return { oportunidadesArchivadas: 0, osArchivadas: 0, error: String(e) };
  }
}
