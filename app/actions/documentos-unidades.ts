'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

// La tabla documentos_unidades no está en los tipos generados aún — usamos cast any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any;

const BUCKET = 'documentos-unidades';

export interface DocUnidad {
  id: string;
  nombre: string;
  descripcion: string | null;
  cliente: string | null;
  numero_unidad: string | null;
  tipo_doc: string | null;
  archivo_url: string;
  archivo_nombre: string;
  created_at: string;
  subido_por: string | null;
}

export async function listarDocsUnidades(): Promise<{ data: DocUnidad[]; error: string | null }> {
  const { data, error } = await db
    .from('documentos_unidades')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as DocUnidad[], error: null };
}

export async function subirDocUnidad(formData: FormData): Promise<{ error: string | null }> {
  const archivo = formData.get('archivo') as File | null;
  const nombre = (formData.get('nombre') as string)?.trim();
  const descripcion = (formData.get('descripcion') as string)?.trim() || null;
  const cliente = (formData.get('cliente') as string)?.trim() || null;
  const numero_unidad = (formData.get('numero_unidad') as string)?.trim() || null;
  const tipo_doc = (formData.get('tipo_doc') as string)?.trim() || null;
  const subido_por = (formData.get('subido_por') as string)?.trim() || null;

  if (!archivo || !nombre) return { error: 'Archivo y nombre son requeridos.' };
  if (archivo.size > 25 * 1024 * 1024) return { error: 'El archivo no puede superar 25 MB.' };

  const ext = archivo.name.split('.').pop() ?? 'bin';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const arrayBuffer = await archivo.arrayBuffer();
  const { error: upErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, { contentType: archivo.type, upsert: false });

  if (upErr) return { error: upErr.message };

  const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

  const { error: dbErr } = await db.from('documentos_unidades').insert({
    nombre, descripcion, cliente, numero_unidad, tipo_doc,
    archivo_url: urlData.publicUrl,
    archivo_nombre: archivo.name,
    subido_por,
  });

  if (dbErr) {
    await supabaseAdmin.storage.from(BUCKET).remove([path]);
    return { error: dbErr.message };
  }
  return { error: null };
}

export async function eliminarDocUnidad(id: string): Promise<{ error: string | null }> {
  const { data: doc } = await db
    .from('documentos_unidades').select('archivo_url').eq('id', id).single();

  if (doc?.archivo_url) {
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const idx = doc.archivo_url.indexOf(marker);
    if (idx !== -1) {
      const path = doc.archivo_url.slice(idx + marker.length);
      await supabaseAdmin.storage.from(BUCKET).remove([path]);
    }
  }

  const { error } = await db.from('documentos_unidades').delete().eq('id', id);
  return { error: error?.message ?? null };
}
