import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export const SurveyService = {
    /**
     * Gets or creates a survey record for a specific order.
     */
    async getOrCreateSurvey(ordenId: string) {
        try {
            // Try to fetch existing
            const { data: existing, error: fetchError } = await supabase
                .from('encuestas')
                .select('*')
                .eq('orden_id', ordenId)
                .maybeSingle();

            if (fetchError) throw fetchError;
            if (existing) return { data: existing, error: null };

            // Create new if not exists
            const { data: created, error: createError } = await supabase
                .from('encuestas')
                .insert([{ orden_id: ordenId }])
                .select()
                .single();

            if (createError) throw createError;
            return { data: created, error: null };
        } catch (error) {
            console.error('Error in getOrCreateSurvey:', error);
            return { data: null, error };
        }
    },

    /**
     * Fetches a survey by its public access token.
     */
    async getSurveyByToken(token: string) {
        try {
            const { data, error } = await supabase
                .from('encuestas')
                .select(`
                    *,
                    ordenes_servicio (
                        numero,
                        empresa,
                        descripcion,
                        tecnico
                    )
                `)
                .eq('token_acceso', token)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching survey by token:', error);
            return { data: null, error };
        }
    },

    /**
     * Submits survey responses.
     */
    async submitSurvey(token: string, responses: {
        calificacion_general: number;
        calificacion_tecnico: number;
        calificacion_tiempo: number;
        comentarios?: string;
    }) {
        try {
            const { data, error } = await supabase
                .from('encuestas')
                .update({
                    ...responses,
                    respondida: true,
                    fecha_respuesta: new Date().toISOString()
                })
                .eq('token_acceso', token)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error submitting survey:', error);
            return { data: null, error };
        }
    }
};
