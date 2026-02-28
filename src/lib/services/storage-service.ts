import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export type StorageBucket = 'evidencias' | 'documentos';

export const StorageService = {
    /**
     * Uploads a file to a specific Supabase Storage bucket.
     */
    async uploadFile(
        file: File,
        bucket: StorageBucket,
        path: string
    ): Promise<{ url: string; error: any }> {
        try {
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(path, file, {
                    cacheControl: '3600',
                    upsert: true,
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(data.path);

            return { url: publicUrl, error: null };
        } catch (error) {
            console.error(`Error uploading to ${bucket}:`, error);
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
            console.error('Error registering evidence:', error);
            return { data: null, error };
        }
    },

    /**
     * Gets all evidences for a specific ticket.
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
            console.error('Error fetching evidences:', error);
            return { data: [], error };
        }
    }
};
