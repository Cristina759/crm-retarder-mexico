'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

export type ClienteRow = {
  id: string;
  nombre_comercial: string | null;
  razon_social: string | null;
  rfc: string | null;
  sucursal: string | null;
  telefono: string | null;
  telefono2: string | null;
  telefono3: string | null;
  email: string | null;
  email2: string | null;
  contacto1_nombre: string | null;
  contacto1_cargo: string | null;
  contacto2_nombre: string | null;
  contacto2_cargo: string | null;
  direccion_fiscal: string | null;
  ciudad: string | null;
  estado: string | null;
  cp: string | null;
  persona_encargada: string | null;
  activo: boolean | null;
  created_at: string;
  total_os?: number;
};

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

const SELECT_CLIENTE = `
  id, nombre_comercial, razon_social, rfc, sucursal,
  telefono, telefono2, telefono3,
  email, email2,
  contacto1_nombre, contacto1_cargo,
  contacto2_nombre, contacto2_cargo,
  direccion_fiscal, ciudad, estado, cp,
  persona_encargada, activo, created_at
`;

export async function obtenerClientes(): Promise<{ data: ClienteRow[]; error: string | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('empresas')
      .select(SELECT_CLIENTE)
      .order('nombre_comercial');

    if (error) return { data: [], error: error.message };

    const rows = (data ?? []) as unknown as (ClienteRow & { id: string })[];
    const ids = rows.map(e => e.id);

    const { data: osCounts } = await supabaseAdmin
      .from('ordenes_servicio')
      .select('empresa_id')
      .in('empresa_id', ids);

    const countMap: Record<string, number> = {};
    (osCounts ?? []).forEach(r => { countMap[r.empresa_id] = (countMap[r.empresa_id] ?? 0) + 1; });

    return { data: rows.map(e => ({ ...e, total_os: countMap[e.id] ?? 0 })), error: null };
  } catch (e) {
    return { data: [], error: String(e) };
  }
}

export async function obtenerClienteDetalle(id: string): Promise<{ data: ClienteDetalle | null; error: string | null }> {
  try {
    const [{ data: emp, error: empErr }, { data: os }, { data: cots }, { data: ncs }] = await Promise.all([
      supabaseAdmin.from('empresas').select(SELECT_CLIENTE).eq('id', id).single(),
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

export async function actualizarCliente(
  id: string,
  datos: { nombre_comercial?: string; razon_social?: string; rfc?: string; sucursal?: string; telefono?: string; telefono2?: string; telefono3?: string; email?: string; email2?: string; contacto1_nombre?: string; contacto1_cargo?: string; contacto2_nombre?: string; contacto2_cargo?: string; direccion_fiscal?: string; ciudad?: string; estado?: string; cp?: string; persona_encargada?: string; activo?: boolean }
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabaseAdmin.from('empresas').update(datos).eq('id', id);
    return { error: error?.message ?? null };
  } catch (e) {
    return { error: String(e) };
  }
}
