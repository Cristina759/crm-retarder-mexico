'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

const BUCKET = 'fotos-os';

// Sube una foto (base64 dataURL) a Supabase Storage y devuelve la URL pública
export async function subirFotoOS(
  osId: string,
  dataUrl: string,
  index: number
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Convertir base64 dataURL a Buffer
    const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!matches) return { url: null, error: 'Formato de imagen inválido' };

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const ext = mimeType.includes('png') ? 'png' : 'jpg';
    const path = `${osId}/${Date.now()}_${index}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) return { url: null, error: error.message };

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  } catch (e) {
    return { url: null, error: String(e) };
  }
}

// Elimina una foto del storage dado su URL pública
export async function eliminarFotoOS(
  url: string
): Promise<{ error: string | null }> {
  try {
    // Extraer el path del bucket desde la URL pública
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return { error: 'URL de foto no reconocida' };
    const path = url.slice(idx + marker.length);

    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
    return { error: error?.message ?? null };
  } catch (e) {
    return { error: String(e) };
  }
}
