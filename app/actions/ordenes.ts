'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import type { OSRow, OSEstado } from './types';
import { OS_ESTADOS, OS_FASE } from './types';

// ── obtenerOrdenes (ULTRA-LIGERA) ────────────────────────────────────────────
export async function obtenerOrdenes(): Promise<{ data: OSRow[]; error: string | null }> {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from('ordenes_servicio')
      .select('id, numero, numero_os_manual, estado, fase, created_at, updated_at, archivada, empresa_id, tecnico_id, estado_facturacion')
      .or('archivada.is.null,archivada.eq.false')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    if (!rows || rows.length === 0) return { data: [], error: null };

    const empresaIds = Array.from(new Set(rows.map(o => o.empresa_id).filter(Boolean)));
    const { data: empresas } = await supabaseAdmin.from('empresas').select('id, nombre_comercial').in('id', empresaIds);
    const empresaMap = new Map((empresas ?? []).map(e => [e.id, e.nombre_comercial]));

    const tecnicoIds = Array.from(new Set(rows.map(o => o.tecnico_id).filter((x): x is string => !!x)));
    const { data: tecnicos } = await supabaseAdmin.from('usuarios').select('id, nombre').in('id', tecnicoIds);
    const tecnicoMap = new Map((tecnicos ?? []).map(t => [t.id, t.nombre]));

    const result = rows.map(o => ({
      ...o,
      empresas: empresaMap.has(o.empresa_id) ? { nombre_comercial: empresaMap.get(o.empresa_id)! } : null,
      tecnico: tecnicoMap.has(o.tecnico_id!) ? { nombre: tecnicoMap.get(o.tecnico_id!)! } : null
    }));

    return { data: result as unknown as OSRow[], error: null };
  } catch (e) { return { data: [], error: 'Error de carga rápida' }; }
}

// ── crearOrdenServicio ────────────────────────────────────────────────────────
export async function crearOrdenServicio(input: {
  numero: string;
  empresa_id: string;
  oportunidad_id?: string;
  cotizacion_id?: string;
}): Promise<{ error: string | null }> {
  if (input.oportunidad_id) {
    const { count } = await supabaseAdmin
      .from('ordenes_servicio')
      .select('id', { count: 'exact', head: true })
      .eq('oportunidad_id', input.oportunidad_id);
    
    if (count && count > 0) {
      return { error: null }; // Silently return success to avoid annoying errors when dragging back and forth
    }
  }

  // Si no se proporcionó cotizacion_id pero sí oportunidad_id,
  // buscar la cotización vinculada para heredar el monto en facturación
  let cotizacion_id = input.cotizacion_id ?? null;
  if (!cotizacion_id && input.oportunidad_id) {
    try {
      const { data: cotData } = await supabaseAdmin
        .from('cotizaciones')
        .select('id')
        .eq('oportunidad_id', input.oportunidad_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cotData?.id) cotizacion_id = cotData.id;
    } catch (e) {
      console.error('[crearOrdenServicio] error buscando cotización vinculada:', e);
    }
  }

  const { error } = await supabaseAdmin
    .from('ordenes_servicio')
    .insert({ 
      numero: input.numero, 
      empresa_id: input.empresa_id, 
      oportunidad_id: input.oportunidad_id ?? null,
      cotizacion_id,
      estado: 'tecnico_asignado', 
      fase: 1,
      estado_facturacion: 'pendiente'
    });

  return { error: error?.message ?? null };
}

// ── actualizarEstadoOS ────────────────────────────────────────────────────────
export async function actualizarEstadoOS(id: string, nuevoEstado: OSEstado): Promise<{ error: string | null }> {
  try {
    const nuevaFase = OS_FASE[nuevoEstado];
     const update: any = { estado: nuevoEstado, fase: nuevaFase };
    if (nuevoEstado === 'facturado') update.estado_facturacion = 'facturada';
    else if (nuevoEstado === 'pagado') { update.estado_facturacion = 'pagada'; update.archivada = true; }

    // Al pasar a facturado, asegurar que haya cotizacion_id para resolver el monto
    if (nuevoEstado === 'facturado') {
      const { data: os } = await supabaseAdmin
        .from('ordenes_servicio')
        .select('cotizacion_id, oportunidad_id, monto_factura')
        .eq('id', id)
        .single();

      if (os && !os.cotizacion_id && !os.monto_factura && os.oportunidad_id) {
        // Buscar cotización vinculada a la oportunidad
        const { data: cotData } = await supabaseAdmin
          .from('cotizaciones')
          .select('id')
          .eq('oportunidad_id', os.oportunidad_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (cotData?.id) {
          update.cotizacion_id = cotData.id;
        }
      }
    }

    const { error } = await supabaseAdmin.from('ordenes_servicio').update(update).eq('id', id);
    return { error: error?.message ?? null };
  } catch (e) { return { error: String(e) }; }
}

// ── Otros métodos (Iguales pero consistentes con los nuevos estados) ──────────
export async function obtenerOrdenesArchivadas(): Promise<{ data: OSRow[]; error: string | null }> {
  try {
    const { data: rows, error } = await supabaseAdmin.from('ordenes_servicio').select('id, numero, numero_os_manual, estado, fase, created_at, updated_at, archivada, empresa_id, tecnico_id, estado_facturacion').eq('archivada', true).order('updated_at', { ascending: false }).limit(50);
    if (error) return { data: [], error: error.message };
    return { data: rows as unknown as OSRow[], error: null };
  } catch (e) { return { data: [], error: String(e) }; }
}

export async function obtenerOrdenPorId(id: string) {
  const { data, error } = await supabaseAdmin.from('ordenes_servicio').select('*, empresas:empresas(nombre_comercial), tecnico:usuarios(nombre)').eq('id', id).single();
  return { data: data as unknown as OSRow, error: error?.message ?? null };
}

export async function asignarTecnicoOS(id: string, tecnico_id: string) {
  const { error } = await supabaseAdmin.from('ordenes_servicio').update({ tecnico_id }).eq('id', id);
  return { error: error?.message ?? null };
}
export async function guardarDatosOS(id: string, datos: any) {
  const { error } = await supabaseAdmin.from('ordenes_servicio').update(datos).eq('id', id);
  return { error: error?.message ?? null };
}
export async function eliminarOrdenServicio(id: string) {
  const { error } = await supabaseAdmin.from('ordenes_servicio').delete().eq('id', id);
  return { error: error?.message ?? null };
}

export async function avanzarEstadoOS(id: string) {
  const { data: os, error: fetchError } = await supabaseAdmin
    .from('ordenes_servicio')
    .select('estado')
    .eq('id', id)
    .single();
  if (fetchError || !os) return { error: fetchError?.message ?? 'No encontrado' };

  const idx = OS_ESTADOS.indexOf(os.estado as OSEstado);
  if (idx === -1 || idx >= OS_ESTADOS.length - 1) return { error: 'Estado final, no se puede avanzar' };

  const nuevoEstado = OS_ESTADOS[idx + 1];
  return actualizarEstadoOS(id, nuevoEstado);
}

export async function actualizarNotasOS(id: string, notas: string) {
  return guardarDatosOS(id, { notas });
}

export async function actualizarDescripcionOS(id: string, descripcion: string) {
  return guardarDatosOS(id, { descripcion_trabajo: descripcion });
}

export async function guardarFotosOS(id: string, campo: 'fotos_antes' | 'fotos_despues', fotos: string[]) {
  return guardarDatosOS(id, { [campo]: fotos });
}

export async function guardarFirmaOS(id: string, campo: 'firma_tecnico' | 'firma_cliente', dataUrl: string) {
  return guardarDatosOS(id, { [campo]: dataUrl });
}

export async function guardarOrdenCompra(id: string, datos: { numero_orden_compra?: string; foto_orden_compra?: string }) {
  return guardarDatosOS(id, datos);
}
