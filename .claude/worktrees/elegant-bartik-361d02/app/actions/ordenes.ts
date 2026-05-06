'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import type { OSRow, OSEstado } from './types';

const OS_ESTADOS: OSEstado[] = [
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

// Fase por estado
const OS_FASE: Record<OSEstado, number> = {
  tecnico_asignado:       1,
  servicio_programado:    1,
  documentacion_enviada:  1,
  tecnico_en_contacto:    1,
  servicio_en_proceso:    1,
  autorizacion_adicional: 2,
  servicio_concluido:     2,
  evidencia_cargada:      2,
  documentacion_entregada: 3,
  encuesta_enviada:       3,
  facturado:              3,
  pagado:                 3,
};

const STOP_WORDS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'sa', 'srl', 'cv', 'sa de cv', 's.a.']);

function generarAbrev(nombre: string, fallback: string): string {
  return (
    nombre
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOP_WORDS.has(w.toLowerCase()))
      .map((w) => w[0].toUpperCase())
      .join('')
      .slice(0, 4) || fallback.slice(0, 4).toUpperCase()
  );
}

async function enriquecerOS<T extends { empresa_id: string }>(rows: T[]): Promise<Array<T & { empresas: { nombre_comercial: string } | null; tecnico: null }>> {
  const empresaIds = Array.from(new Set(rows.map(r => r.empresa_id).filter(Boolean)));
  const { data: empresas } = empresaIds.length
    ? await supabaseAdmin.from('empresas').select('id, nombre_comercial').in('id', empresaIds)
    : { data: [] as Array<{ id: string; nombre_comercial: string }> };
  const empresaMap = new Map((empresas ?? []).map(e => [e.id, e.nombre_comercial]));
  return rows.map(r => ({
    ...r,
    empresas: empresaMap.has(r.empresa_id) ? { nombre_comercial: empresaMap.get(r.empresa_id)! } : null,
    tecnico: null,
  }));
}

// ── obtenerOrdenes ────────────────────────────────────────────────────────────
export async function obtenerOrdenes(): Promise<{ data: OSRow[]; error: string | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ordenes_servicio')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    const rows = (data ?? []) as Array<{ empresa_id: string; archivada?: boolean | null }>;
    const activas = rows.filter(r => r.archivada !== true);
    const enriched = await enriquecerOS(activas);
    return { data: enriched as unknown as OSRow[], error: null };
  } catch (e) { return { data: [], error: String(e) }; }
}

// ── obtenerOrdenesArchivadas ──────────────────────────────────────────────────
export async function obtenerOrdenesArchivadas(): Promise<{ data: OSRow[]; error: string | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ordenes_servicio')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    const rows = (data ?? []) as Array<{ empresa_id: string; archivada?: boolean | null }>;
    const archivadas = rows.filter(r => r.archivada === true);
    const enriched = await enriquecerOS(archivadas);
    return { data: enriched as unknown as OSRow[], error: null };
  } catch (e) { return { data: [], error: String(e) }; }
}

// ── obtenerOrdenPorId ─────────────────────────────────────────────────────────
export async function obtenerOrdenPorId(id: string): Promise<{ data: OSRow | null; error: string | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ordenes_servicio')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return { data: null, error: error.message };
    if (!data) return { data: null, error: null };
    const [enriched] = await enriquecerOS([data as { empresa_id: string }]);
    return { data: enriched as unknown as OSRow, error: null };
  } catch (e) { return { data: null, error: String(e) }; }
}

// ── crearOrdenServicio ────────────────────────────────────────────────────────
export async function crearOrdenServicio(input: {
  empresa_id: string;
  oportunidad_id?: string;
}): Promise<{ error: string | null }> {
  // Verificar duplicado activo (no archivada)
  const { data: activasEmpresa } = await supabaseAdmin
    .from('ordenes_servicio')
    .select('id, numero, archivada')
    .eq('empresa_id', input.empresa_id);
  const existente = (activasEmpresa ?? []).find((r: { archivada?: boolean | null }) => r.archivada !== true);

  if (existente) {
    console.log('[crearOrdenServicio] Ya existe OS activa:', existente.numero);
    return { error: null };
  }

  const { data: empresa } = await supabaseAdmin
    .from('empresas').select('nombre_comercial').eq('id', input.empresa_id).single();

  const abrev = generarAbrev(empresa?.nombre_comercial ?? '', input.empresa_id);

  const { count } = await supabaseAdmin
    .from('ordenes_servicio')
    .select('id', { count: 'exact', head: true })
    .eq('empresa_id', input.empresa_id);

  const numero = `OS-${abrev}-${String((count ?? 0) + 1).padStart(3, '0')}`;

  const { data: nuevaOS, error } = await supabaseAdmin
    .from('ordenes_servicio')
    .insert({ numero, empresa_id: input.empresa_id, estado: 'tecnico_asignado', fase: 1 })
    .select('id').single();

  if (error) return { error: error.message };

  if (input.oportunidad_id && nuevaOS?.id) {
    await supabaseAdmin
      .from('ordenes_servicio')
      .update({ oportunidad_id: input.oportunidad_id })
      .eq('id', nuevaOS.id);
  }

  console.log('[crearOrdenServicio] creada:', numero);
  return { error: null };
}

// ── avanzarEstadoOS ───────────────────────────────────────────────────────────
export async function avanzarEstadoOS(id: string): Promise<{ error: string | null }> {
  const { data: os } = await supabaseAdmin
    .from('ordenes_servicio')
    .select('estado, tecnico_id, numero_os_manual, foto_os')
    .eq('id', id).single();

  if (!os) return { error: 'OS no encontrada' };

  // Candados: solo aplican al avanzar desde el primer estado
  if (os.estado === 'tecnico_asignado') {
    if (!os.tecnico_id)         return { error: 'CANDADO: Debes asignar un técnico antes de avanzar.' };
    if (!os.numero_os_manual)   return { error: 'CANDADO: Debes ingresar el número de orden de servicio.' };
    if (!os.foto_os)            return { error: 'CANDADO: Debes subir la foto de la orden de servicio.' };
  }

  const idx = OS_ESTADOS.indexOf(os.estado as OSEstado);
  if (idx === -1 || idx >= OS_ESTADOS.length - 1) return { error: null };

  const nuevoEstado = OS_ESTADOS[idx + 1];
  const nuevaFase   = OS_FASE[nuevoEstado];

  const update = nuevoEstado === 'pagado'
    ? { estado: nuevoEstado, fase: nuevaFase, archivada: true }
    : { estado: nuevoEstado, fase: nuevaFase };

  const { error } = await supabaseAdmin
    .from('ordenes_servicio').update(update).eq('id', id);

  if (error) return { error: error.message };
  return { error: null };
}

// ── asignarTecnico ────────────────────────────────────────────────────────────
export async function asignarTecnicoOS(id: string, tecnico_id: string): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin
    .from('ordenes_servicio').update({ tecnico_id: tecnico_id || null }).eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

// ── guardarDatosOS (número manual + foto) ────────────────────────────────────
export async function guardarDatosOS(id: string, datos: {
  numero_os_manual?: string;
  foto_os?: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin
    .from('ordenes_servicio').update(datos).eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

// ── guardarOrdenCompra ────────────────────────────────────────────────────────
export async function guardarOrdenCompra(id: string, datos: {
  numero_orden_compra?: string;
  foto_orden_compra?: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin
    .from('ordenes_servicio').update(datos).eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

// ── actualizarNotas ───────────────────────────────────────────────────────────
export async function actualizarNotasOS(id: string, notas: string): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin
    .from('ordenes_servicio').update({ notas }).eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

// ── guardarFotos ──────────────────────────────────────────────────────────────
export async function guardarFotosOS(
  id: string,
  campo: 'fotos_antes' | 'fotos_despues',
  fotos: string[]
): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin
    .from('ordenes_servicio')
    .update(campo === 'fotos_antes' ? { fotos_antes: fotos } : { fotos_despues: fotos })
    .eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

// ── guardarFirma ──────────────────────────────────────────────────────────────
export async function guardarFirmaOS(
  id: string,
  campo: 'firma_tecnico' | 'firma_cliente',
  dataUrl: string
): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin
    .from('ordenes_servicio')
    .update(campo === 'firma_tecnico' ? { firma_tecnico: dataUrl } : { firma_cliente: dataUrl })
    .eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

// ── actualizarDescripcion ─────────────────────────────────────────────────────
export async function actualizarDescripcionOS(id: string, descripcion_trabajo: string): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin
    .from('ordenes_servicio').update({ descripcion_trabajo }).eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}
