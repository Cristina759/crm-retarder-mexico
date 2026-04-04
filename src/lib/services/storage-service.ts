import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export type StorageBucket = 'evidencias' | 'documentos' | 'firmas';

/**
 * Upload a file to Cloudflare R2 via the /api/upload endpoint.
 * Falls back to Supabase Storage if the API call fails.
 */
async function uploadToR2(
    file: File,
    folder: string,
): Promise<{ url: string; error: any }> {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `Upload failed: ${res.status}`);
        }

        const { url } = await res.json();
        return { url, error: null };
    } catch (error) {
        return { url: '', error };
    }
}

export const StorageService = {
    /**
     * Uploads a file — tries R2 first, falls back to Supabase Storage.
     */
    async uploadFile(
        file: File,
        bucket: StorageBucket,
        path: string,
    ): Promise<{ url: string; error: any }> {
        // Try R2
        const r2Result = await uploadToR2(file, bucket);
        if (!r2Result.error) return r2Result;

        // Fallback: Supabase Storage
        try {
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(path, file, { cacheControl: '3600', upsert: true });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(data.path);

            return { url: publicUrl, error: null };
        } catch (error) {
            return { url: '', error };
        }
    },

    /**
     * Registers an evidence record in the database.
     */
    async registerEvidence(evidence: {
        orden_id: string;
        tipo: 'foto_antes' | 'foto_despues' | 'video' | 'documento' | 'firma';
        archivo_url: string;
        descripcion?: string;
        subido_por?: string;
    }) {
        try {
            const { data, error } = await supabase
                .from('evidencias')
                .insert([evidence])
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Gets all evidences for a specific orden.
     */
    async getEvidences(ordenId: string) {
        try {
            const { data, error } = await supabase
                .from('evidencias')
                .select('*')
                .eq('orden_id', ordenId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            return { data: [], error };
        }
    },
};
