'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

const BUCKET = 'documentos-usuarios';

export interface DocumentoRow {
  id: string;
  usuario_id: string;
  nombre: string;
  storage_path: string;
  tipo: string | null;
  tamanio: number | null;
  created_at: string;
}

// ── Listar documentos de un usuario ──────────────────────────────────────────
export async function obtenerDocumentosUsuario(
  usuarioId: string
): Promise<{ data: DocumentoRow[]; error: string | null }> {
  const { data, error } = await supabaseAdmin
    .from('documentos_usuario')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('created_at', { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as DocumentoRow[], error: null };
}

// ── Subir documento ───────────────────────────────────────────────────────────
export async function subirDocumentoUsuario(
  usuarioId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const file = formData.get('file') as File | null;
  if (!file) return { error: 'No se recibió ningún archivo.' };
  if (file.size > 20 * 1024 * 1024) return { error: 'El archivo supera el límite de 20 MB.' };

  const ext = file.name.split('.').pop() ?? '';
  const storagePath = `${usuarioId}/${Date.now()}_${file.name}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) return { error: uploadError.message };

  const { error: dbError } = await supabaseAdmin.from('documentos_usuario').insert({
    usuario_id:   usuarioId,
    nombre:       file.name,
    storage_path: storagePath,
    tipo:         ext.toUpperCase() || file.type,
    tamanio:      file.size,
  });

  if (dbError) {
    // Revertir el archivo subido si falla el registro
    await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
    return { error: dbError.message };
  }

  return { error: null };
}

// ── Eliminar documento ────────────────────────────────────────────────────────
export async function eliminarDocumentoUsuario(
  id: string
): Promise<{ error: string | null }> {
  const { data, error: fetchError } = await supabaseAdmin
    .from('documentos_usuario')
    .select('storage_path')
    .eq('id', id)
    .single();

  if (fetchError) return { error: fetchError.message };

  await supabaseAdmin.storage.from(BUCKET).remove([data.storage_path]);

  const { error } = await supabaseAdmin
    .from('documentos_usuario')
    .delete()
    .eq('id', id);

  return { error: error?.message ?? null };
}

// ── Obtener URL firmada para descarga ─────────────────────────────────────────
export async function getDocumentoUrl(
  storagePath: string
): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60 * 5); // 5 minutos

  if (error) return { url: null, error: error.message };
  return { url: data.signedUrl, error: null };
}
