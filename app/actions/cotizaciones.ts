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
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[obtenerCotizaciones]', error);
      return { data: [], error: error.message };
    }

    const rows = (data ?? []) as unknown as Array<Omit<CotizacionRow, 'empresas' | 'vendedor' | 'oportunidad'> & {
      empresa_id: string;
      oportunidad_id: string | null;
    }>;

    const empresaIds = Array.from(new Set(rows.map(r => r.empresa_id).filter(Boolean)));
    const oppIds     = Array.from(new Set(rows.map(r => r.oportunidad_id).filter((x): x is string => !!x)));

    const [empresasRes, oppsRes] = await Promise.all([
      empresaIds.length
        ? supabaseAdmin.from('empresas').select('id, nombre_comercial').in('id', empresaIds)
        : Promise.resolve({ data: [] as Array<{ id: string; nombre_comercial: string }> }),
      oppIds.length
        ? supabaseAdmin.from('oportunidades').select('id, estado').in('id', oppIds)
        : Promise.resolve({ data: [] as Array<{ id: string; estado: string }> }),
    ]);

    const empresaMap = new Map((empresasRes.data ?? []).map(e => [e.id, e.nombre_comercial]));
    const oppMap     = new Map((oppsRes.data ?? []).map(o => [o.id, o.estado]));

    const enriched: CotizacionRow[] = rows.map(r => ({
      ...r,
      empresas:    empresaMap.has(r.empresa_id) ? { nombre_comercial: empresaMap.get(r.empresa_id)! } : null,
      vendedor:    null,
      oportunidad: r.oportunidad_id && oppMap.has(r.oportunidad_id) ? { estado: oppMap.get(r.oportunidad_id)! } : null,
    })) as CotizacionRow[];

    return { data: enriched, error: null };
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
  try {
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
          })
          .select('id')
          .single();
        if (empError) return { data: null, error: `Error Empresa: ${empError.message}` };
        empresa_id = nueva.id;
      }
    }

    // 2. Crear oportunidad vinculada
    const { data: opp, error: oppError } = await supabaseAdmin
      .from('oportunidades')
      .insert({
        empresa_id,
        tipo:         input.tipo.split('-')[0] as any,
        titulo:       `Cotización ${input.tipo} — ${input.empresa_nombre}`,
        estado:       'cotizacion_enviada',
        probabilidad: 40,
        monto_estimado: input.total_mxn,
        vendedor_id:  input.vendedor_id ?? null,
      })
      .select('id')
      .single();

    if (oppError) return { data: null, error: `Error Oportunidad: ${oppError.message}` };

    // 3. Crear cotización
    const folio = await generarFolio();

    const { data: cotData, error: cotError } = await supabaseAdmin
      .from('cotizaciones')
      .insert({
        folio,
        empresa_id,
        // oportunidad_id: opp.id, // REMOVIDO TEMPORALMENTE: La tabla en Supabase no tiene esta columna
        vendedor_id: input.vendedor_id ?? null,
        tipo: input.tipo,
        estado: 'enviada',
        subtotal: input.subtotal,
        iva: input.iva,
        total_mxn: input.total_mxn,
        notas: input.notas ?? null,
      })
      .select('id, folio')
      .single();

    if (cotError || !cotData) {
      console.error('[crearCotizacion] cotización:', cotError);
      return { data: null, error: cotError?.message ?? 'Error al insertar cotización' };
    }

    console.log('[crearCotizacion] creada:', cotData.folio ?? cotData.id);
    return { data: { id: cotData.id, folio: cotData.folio ?? '' }, error: null };
  } catch (err: any) {
    console.error('[crearCotizacion] EXCEPCIÓN:', err);
    return { data: null, error: err.message ?? 'Error inesperado en el servidor' };
  }
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
  // Obtener oportunidad vinculada antes de borrar
  const { data: cot } = await supabaseAdmin
    .from('cotizaciones')
    .select('oportunidad_id')
    .eq('id', id)
    .single();

  // Desligar ordenes_servicio que apunten a esta cotización
  await supabaseAdmin
    .from('ordenes_servicio')
    .update({ cotizacion_id: null })
    .eq('cotizacion_id', id);

  const { error } = await supabaseAdmin
    .from('cotizaciones')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[eliminarCotizacion]', error);
    return { error: error.message };
  }

  // Borrar oportunidad vinculada si existe
  if (cot?.oportunidad_id) {
    await supabaseAdmin.from('oportunidades').delete().eq('id', cot.oportunidad_id);
  }

  return { error: null };
}
