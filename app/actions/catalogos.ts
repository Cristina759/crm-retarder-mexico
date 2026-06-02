'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

export type ManoDeObraRow = {
  id: string;
  nombre: string;
  categoria: 'ELÉCTRICO' | 'NEUMÁTICO' | 'MECÁNICO' | 'OTRO';
  precio: number;
  activo: boolean;
};

export type RefaccionRow = {
  id: string;
  nombre: string;
  categoria: 'ELÉCTRICO' | 'NEUMÁTICO' | 'TORNILLERÍA' | 'MECÁNICO' | 'SOPORTERÍA' | 'CARDANES' | 'MATERIAL ELÉCTRICO';
  precio_venta: number;
  numero_parte: string | null;
  activo: boolean;
};

// ── Mano de Obra ──────────────────────────────────────────────────────────────

/** Devuelve todo el catálogo de mano de obra activo, en el orden del Excel (created_at asc) */
export async function obtenerManoDeObra(): Promise<{ data: ManoDeObraRow[]; error: string | null }> {
  const { data, error } = await supabaseAdmin
    .from('mano_de_obra')
    .select('id, nombre, categoria, precio, activo')
    .eq('activo', true)
    .order('sort_order', { ascending: true });

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as ManoDeObraRow[], error: null };
}

/** Devuelve TODO el catálogo (activos e inactivos) para la vista de configuración */
export async function obtenerManoDeObraCompleto(): Promise<{ data: ManoDeObraRow[]; error: string | null }> {
  const { data, error } = await supabaseAdmin
    .from('mano_de_obra')
    .select('id, nombre, categoria, precio, activo')
    .order('sort_order', { ascending: true });

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as ManoDeObraRow[], error: null };
}

export async function crearManoDeObra(datos: {
  nombre: string;
  categoria: ManoDeObraRow['categoria'];
  precio: number;
}): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin.from('mano_de_obra').insert({
    nombre: datos.nombre,
    categoria: datos.categoria,
    precio: datos.precio,
    activo: true,
  });
  return { error: error?.message ?? null };
}

export async function actualizarManoDeObra(
  id: string,
  datos: Partial<Pick<ManoDeObraRow, 'nombre' | 'categoria' | 'precio' | 'activo'>>
): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin.from('mano_de_obra').update(datos).eq('id', id);
  return { error: error?.message ?? null };
}

export async function eliminarManoDeObra(id: string): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin.from('mano_de_obra').update({ activo: false }).eq('id', id);
  return { error: error?.message ?? null };
}

// ── Refacciones ───────────────────────────────────────────────────────────────

/** Devuelve todo el catálogo de refacciones activo, ordenado por categoría y nombre */
export async function obtenerRefacciones(): Promise<{ data: RefaccionRow[]; error: string | null }> {
  const { data, error } = await supabaseAdmin
    .from('refacciones')
    .select('id, nombre, categoria, precio_venta, numero_parte, activo')
    .eq('activo', true)
    .order('categoria')
    .order('sort_order', { ascending: true });

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as RefaccionRow[], error: null };
}

/** Devuelve TODO el catálogo (activos e inactivos) para la vista de configuración */
export async function obtenerRefaccionesCompleto(): Promise<{ data: RefaccionRow[]; error: string | null }> {
  const { data, error } = await supabaseAdmin
    .from('refacciones')
    .select('id, nombre, categoria, precio_venta, numero_parte, activo')
    .order('categoria')
    .order('sort_order', { ascending: true });

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as RefaccionRow[], error: null };
}

export async function crearRefaccion(datos: {
  nombre: string;
  categoria: RefaccionRow['categoria'];
  precio_venta: number;
  numero_parte?: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin.from('refacciones').insert({
    nombre: datos.nombre,
    categoria: datos.categoria,
    precio_venta: datos.precio_venta,
    numero_parte: datos.numero_parte || null,
    activo: true,
  });
  return { error: error?.message ?? null };
}

export async function actualizarRefaccion(
  id: string,
  datos: Partial<Pick<RefaccionRow, 'nombre' | 'categoria' | 'precio_venta' | 'numero_parte' | 'activo'>>
): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin.from('refacciones').update(datos).eq('id', id);
  return { error: error?.message ?? null };
}

export async function eliminarRefaccion(id: string): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin.from('refacciones').update({ activo: false }).eq('id', id);
  return { error: error?.message ?? null };
}
