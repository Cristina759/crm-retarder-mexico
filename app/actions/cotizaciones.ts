'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import type { CotizacionRow, CrearCotizacionInput } from './types';

// ── Helper: generar folio ─────────────────────────────────────────────────────
async function generarFolio(): Promise<string> {
  const { count } = await supabaseAdmin
    .from('cotizaciones')
    .select('id', { count: 'exact', head: true });
  return `COT-${String((count ?? 0) + 1).padStart(4, '0')}`;
}

// ── obtenerCotizaciones ───────────────────────────────────────────────────────
export async function obtenerCotizaciones(): Promise<{
  data: CotizacionRow[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('cotizaciones')
      .select('*, empresas:empresa_id(nombre_comercial), vendedor:vendedor_id(nombre), oportunidad:oportunidad_id(estado)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[obtenerCotizaciones]', error);
      return { data: [], error: error.message };
    }
    return { data: (data ?? []) as unknown as CotizacionRow[], error: null };
  } catch (e) {
    console.error('[obtenerCotizaciones] excepción:', e);
    return { data: [], error: String(e) };
  }
}

// ── crearCotizacion ───────────────────────────────────────────────────────────
export async function crearCotizacion(input: CrearCotizacionInput): Promise<{
  data: { id: string; folio: string } | null;
  error: string | null;
}> {
  // 1. Resolver o crear empresa
  let empresa_id = input.empresa_id ?? null;

  if (!empresa_id) {
    const { data: existente } = await supabaseAdmin
      .from('empresas')
      .select('id')
      .ilike('nombre_comercial', input.empresa_nombre.trim())
      .maybeSingle();

    if (existente?.id) {
      empresa_id = existente.id;
    } else {
      const { data: nueva, error: empError } = await supabaseAdmin
        .from('empresas')
        .insert({
          nombre_comercial: input.empresa_nombre.trim(),
          razon_social:     input.empresa_nombre.trim(),
        })
        .select('id')
        .single();
      if (empError) return { data: null, error: empError.message };
      empresa_id = nueva.id;
    }
  }

  // 2. Crear oportunidad vinculada
  const { data: opp, error: oppError } = await supabaseAdmin
    .from('oportunidades')
    .insert({
      empresa_id,
      titulo:       `Cotización ${input.tipo} — ${input.empresa_nombre}`,
      estado:       'cotizacion_enviada',
      probabilidad: 40,
      monto:        input.total_mxn,
      vendedor_id:  input.vendedor_id ?? null,
    })
    .select('id')
    .single();

  if (oppError) {
    console.error('[crearCotizacion] oportunidad:', oppError);
    return { data: null, error: oppError.message };
  }

  // 3. Crear cotización
  const folio = await generarFolio();

  const { data: cot, error: cotError } = await supabaseAdmin
    .from('cotizaciones')
    .insert({
      folio,
      empresa_id,
      oportunidad_id: opp.id,
      vendedor_id:    input.vendedor_id ?? null,
      tipo:           input.tipo,
      estado:         'enviada',
      subtotal:       input.subtotal,
      iva:            input.iva,
      total_mxn:      input.total_mxn,
      notas:          input.notas ?? null,
    })
    .select('id, folio')
    .single();

  if (cotError) {
    console.error('[crearCotizacion] cotización:', cotError);
    return { data: null, error: cotError.message };
  }

  console.log('[crearCotizacion] creada:', cot.folio ?? cot.id);
  return { data: { id: cot.id, folio: cot.folio ?? '' }, error: null };
}

// ── actualizarCotizacion ──────────────────────────────────────────────────────
export async function actualizarCotizacion(
  id: string,
  data: Partial<{
    estado: 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | 'vencida';
    subtotal: number;
    iva: number;
    total_mxn: number;
    notas: string;
    vendedor_id: string;
  }>
): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin
    .from('cotizaciones')
    .update(data)
    .eq('id', id);

  if (error) {
    console.error('[actualizarCotizacion]', error);
    return { error: error.message };
  }
  return { error: null };
}

// ── buscarEmpresas ────────────────────────────────────────────────────────────
export interface EmpresaBusquedaResult {
  id: string;
  nombre_comercial: string;
  rfc: string | null;
  email: string | null;
  telefono: string | null;
}

export async function buscarEmpresas(query: string): Promise<EmpresaBusquedaResult[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const { data } = await supabaseAdmin
      .from('empresas')
      .select('id, nombre_comercial, rfc, email, telefono')
      .ilike('nombre_comercial', `%${query.trim()}%`)
      .order('nombre_comercial')
      .limit(8);
    return (data ?? []) as EmpresaBusquedaResult[];
  } catch {
    return [];
  }
}

// ── eliminarCotizacion ────────────────────────────────────────────────────────
export async function eliminarCotizacion(id: string): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin
    .from('cotizaciones')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[eliminarCotizacion]', error);
    return { error: error.message };
  }
  return { error: null };
}
