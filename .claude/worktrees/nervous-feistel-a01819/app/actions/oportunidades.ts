'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import type { OportunidadEstado, OportunidadRow, CrearOportunidadInput } from './types';

// ── obtenerOportunidades ──────────────────────────────────────────────────────
export async function obtenerOportunidades(): Promise<{
  data: OportunidadRow[];
  error: string | null;
}> {
  console.log('[obtenerOportunidades] SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'VACÍO');
  console.log('[obtenerOportunidades] SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'VACÍO');

  try {
    const { data, error } = await supabaseAdmin
      .from('oportunidades')
      .select('*, empresas:empresa_id(nombre_comercial)')
      .order('created_at', { ascending: false });

    console.log('[obtenerOportunidades] result:', { count: data?.length, error });

    if (error) {
      console.error('[obtenerOportunidades] Supabase error:', JSON.stringify(error));
      return { data: [], error: error.message };
    }
    return { data: (data ?? []) as unknown as OportunidadRow[], error: null };
  } catch (e) {
    console.error('[obtenerOportunidades] excepción:', e);
    return { data: [], error: String(e) };
  }
}

// ── actualizarEstadoOportunidad ───────────────────────────────────────────────
export async function actualizarEstadoOportunidad(
  id: string,
  estado: OportunidadEstado,
  probabilidad?: number
): Promise<{ error: string | null }> {
  const payload = probabilidad !== undefined
    ? { estado, probabilidad }
    : { estado };

  const { error } = await supabaseAdmin
    .from('oportunidades')
    .update(payload)
    .eq('id', id);

  if (error) {
    console.error('[actualizarEstadoOportunidad]', error);
    return { error: error.message };
  }
  return { error: null };
}

// ── eliminarOportunidad ───────────────────────────────────────────────────────
export async function eliminarOportunidad(id: string): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin
    .from('oportunidades')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[eliminarOportunidad]', error);
    return { error: error.message };
  }
  return { error: null };
}

// ── crearOportunidad ──────────────────────────────────────────────────────────
export async function crearOportunidad(
  input: CrearOportunidadInput
): Promise<{ data: { id: string } | null; error: string | null }> {
  let empresa_id = input.empresa_id ?? null;

  if (!empresa_id && input.empresa_nombre) {
    const { data: emp, error: empError } = await supabaseAdmin
      .from('empresas')
      .insert({ nombre_comercial: input.empresa_nombre })
      .select('id')
      .single();

    if (empError) {
      console.error('[crearOportunidad] crear empresa:', empError);
      return { data: null, error: empError.message };
    }
    empresa_id = emp.id;
  }

  if (!empresa_id) {
    return { data: null, error: 'Se requiere empresa_id o empresa_nombre.' };
  }

  const { data, error } = await supabaseAdmin
    .from('oportunidades')
    .insert({
      empresa_id,
      titulo:       input.titulo,
      estado:       input.estado       ?? 'lead',
      probabilidad: input.probabilidad ?? 50,
      monto:        input.monto        ?? 0,
      vendedor_id:  input.vendedor_id  ?? null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[crearOportunidad]', error);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}
