'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

export interface ItemCatalogoGeneral {
  id: string;
  codigo: string | null;
  descripcion: string;
  area: string | null;
  categoria: string | null;
  precio_compra: number | null;
  precio_venta: number | null;
  created_at: string;
}

export async function obtenerCatalogoGeneral(): Promise<{
  data: ItemCatalogoGeneral[];
  error: string | null;
}> {
  const { data, error } = await supabaseAdmin
    .from('catalogo_general')
    .select('*')
    .order('descripcion', { ascending: true });

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as ItemCatalogoGeneral[], error: null };
}
