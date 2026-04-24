'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

export type ClienteRow = {
  id: string;
  nombre_comercial: string | null;
  rfc: string | null;
  telefono: string | null;
  email: string | null;
  activo: boolean | null;
  created_at: string;
  total_os?: number;
};

export async function obtenerClientes(): Promise<{ data: ClienteRow[]; error: string | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('empresas')
      .select('id, nombre_comercial, rfc, telefono, email, activo, created_at')
      .order('nombre_comercial');

    if (error) return { data: [], error: error.message };
    return { data: (data ?? []) as ClienteRow[], error: null };
  } catch (e) {
    return { data: [], error: String(e) };
  }
}

export type ClienteDetalle = ClienteRow & {
  total_os: number;
  ordenes: {
    id: string; numero: string; numero_os_manual: string | null;
    estado: string; fase: number; created_at: string;
    monto_factura: number | null; estado_facturacion: string | null;
    numero_factura: string | null; tecnico: null;
  }[];
  cotizaciones: {
    id: string; folio: string | null; tipo: string | null;
    estado: string | null; total_mxn: number | null; created_at: string;
  }[];
  notas_credito: {
    id: string; numero_nc: string | null; monto: number; fecha: string;
  }[];
};

export async function obtenerClienteDetalle(id: string): Promise<{ data: ClienteDetalle | null; error: string | null }> {
  try {
    const [{ data: emp, error: empErr }, { data: os }, { data: cots }, { data: ncs }] = await Promise.all([
      supabaseAdmin.from('empresas').select('id, nombre_comercial, rfc, telefono, email, activo, created_at').eq('id', id).single(),
      supabaseAdmin.from('ordenes_servicio').select('id, numero, numero_os_manual, estado, fase, created_at, monto_factura, estado_facturacion, numero_factura').eq('empresa_id', id).order('created_at', { ascending: false }),
      supabaseAdmin.from('cotizaciones').select('id, folio, tipo, estado, total_mxn, created_at').eq('empresa_id', id).order('created_at', { ascending: false }),
      supabaseAdmin.from('notas_credito').select('id, numero_nc, monto, created_at').eq('empresa_id', id).order('created_at', { ascending: false }),
    ]);
    if (empErr || !emp) return { data: null, error: empErr?.message ?? 'Cliente no encontrado' };
    const detalle: ClienteDetalle = {
      ...(emp as unknown as ClienteRow),
      total_os: (os ?? []).length,
      ordenes: (os ?? []).map(o => ({ ...o, tecnico: null })) as ClienteDetalle['ordenes'],
      cotizaciones: (cots ?? []) as ClienteDetalle['cotizaciones'],
      notas_credito: (ncs ?? []).map(n => ({ ...n, fecha: (n as { created_at?: string }).created_at ?? '' })) as ClienteDetalle['notas_credito'],
    };
    return { data: detalle, error: null };
  } catch (e) {
    return { data: null, error: String(e) };
  }
}

export async function actualizarCliente(
  id: string,
  datos: { nombre_comercial?: string; rfc?: string; telefono?: string; email?: string; activo?: boolean }
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabaseAdmin.from('empresas').update(datos).eq('id', id);
    return { error: error?.message ?? null };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function crearCliente(datos: {
  nombre_comercial: string;
  rfc?: string;
  telefono?: string;
  email?: string;
}): Promise<{ data: { id: string } | null; error: string | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('empresas')
      .insert({ ...datos, activo: true })
      .select('id')
      .single();
    if (error) return { data: null, error: error.message };
    return { data: { id: data.id }, error: null };
  } catch (e) {
    return { data: null, error: String(e) };
  }
}
