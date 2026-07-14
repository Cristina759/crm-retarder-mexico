'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

export interface RespuestaEncuesta {
  calificacion_general: number;
  calificacion_tiempo: number;
  calificacion_calidad: number;
  calificacion_atencion: number;
  calificacion_recomendacion: number;
  comentarios: string;
}

// ── obtenerEncuestaOS — datos públicos mínimos para renderizar el formulario ──
export async function obtenerEncuestaOS(osId: string) {
  try {
    const { data: os, error } = await supabaseAdmin
      .from('ordenes_servicio')
      .select('id, numero, empresas:empresas(nombre_comercial)')
      .eq('id', osId)
      .single();

    if (error || !os) return { data: null, respondida: false, error: 'Orden no encontrada' };

    // Cast a any: tabla encuestas_satisfaccion aun no reflejada en tipos generados de Supabase
    const { data: respuesta } = await (supabaseAdmin as any).from('encuestas_satisfaccion')
      .select('id')
      .eq('os_id', osId)
      .maybeSingle();

    return {
      data: { numero: os.numero, empresa: (os.empresas as any)?.nombre_comercial ?? 'Cliente' },
      respondida: !!respuesta,
      error: null,
    };
  } catch (e) {
    return { data: null, respondida: false, error: String(e) };
  }
}

// ── enviarEncuesta ────────────────────────────────────────────────────────────
export async function enviarEncuesta(osId: string, respuesta: RespuestaEncuesta) {
  try {
    // Cast a any: tabla encuestas_satisfaccion aun no reflejada en tipos generados de Supabase
    const { error } = await (supabaseAdmin as any).from('encuestas_satisfaccion').insert({
      os_id: osId,
      ...respuesta,
    });

    if (error) return { error: error.code === '23505' ? 'Esta encuesta ya fue respondida.' : error.message };

    await supabaseAdmin.from('ordenes_servicio').update({ encuesta_enviada: true }).eq('id', osId);

    return { error: null };
  } catch (e) {
    return { error: String(e) };
  }
}

// ── obtenerResumenEncuestas — promedios para el Dashboard ────────────────────
export async function obtenerResumenEncuestas() {
  try {
    // Cast a any: tabla encuestas_satisfaccion aun no reflejada en tipos generados de Supabase
    const { data, error } = await (supabaseAdmin as any).from('encuestas_satisfaccion')
      .select('calificacion_general, calificacion_tiempo, calificacion_calidad, calificacion_atencion, calificacion_recomendacion, comentarios, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error || !data || data.length === 0) {
      return { total: 0, promedioGeneral: 0, promedioTiempo: 0, promedioCalidad: 0, promedioAtencion: 0, promedioRecomendacion: 0, comentariosRecientes: [] as { comentario: string; fecha: string }[], error: null };
    }

    const avg = (campo: string) => Math.round((data.reduce((s: number, r: any) => s + (Number(r[campo]) || 0), 0) / data.length) * 10) / 10;

    const comentariosRecientes = data
      .filter((r: any) => r.comentarios)
      .slice(0, 5)
      .map((r: any) => ({ comentario: r.comentarios as string, fecha: r.created_at as string }));

    return {
      total: data.length,
      promedioGeneral:       avg('calificacion_general'),
      promedioTiempo:        avg('calificacion_tiempo'),
      promedioCalidad:       avg('calificacion_calidad'),
      promedioAtencion:      avg('calificacion_atencion'),
      promedioRecomendacion: avg('calificacion_recomendacion'),
      comentariosRecientes,
      error: null,
    };
  } catch (e) {
    return { total: 0, promedioGeneral: 0, promedioTiempo: 0, promedioCalidad: 0, promedioAtencion: 0, promedioRecomendacion: 0, comentariosRecientes: [], error: String(e) };
  }
}
