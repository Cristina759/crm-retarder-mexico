'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import type { UsuarioRow } from './types';

type RolUsuario = 'admin' | 'ventas' | 'tecnico' | 'facturacion' | 'direccion' | 'cliente' | 'administrativo';

export async function obtenerUsuarios(): Promise<{ data: UsuarioRow[]; error: string | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('id, nombre, email, rol')
      .order('rol')
      .order('nombre');

    if (error) return { data: [], error: error.message };
    return { data: (data ?? []) as UsuarioRow[], error: null };
  } catch (e) {
    return { data: [], error: String(e) };
  }
}

export async function crearUsuario(datos: {
  nombre: string;
  email: string;
  rol: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin.from('usuarios').insert({
    nombre: datos.nombre,
    email: datos.email,
    rol: datos.rol as RolUsuario,
  });
  return { error: error?.message ?? null };
}

export async function actualizarUsuario(
  id: string,
  datos: Partial<Pick<UsuarioRow, 'nombre' | 'email' | 'rol'>>
): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin
    .from('usuarios')
    .update({
      ...(datos.nombre !== undefined && { nombre: datos.nombre }),
      ...(datos.email  !== undefined && { email:  datos.email  }),
      ...(datos.rol    !== undefined && { rol:    datos.rol as RolUsuario }),
    })
    .eq('id', id);
  return { error: error?.message ?? null };
}

export async function eliminarUsuario(id: string): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin.from('usuarios').delete().eq('id', id);
  return { error: error?.message ?? null };
}
