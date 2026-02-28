import { createClient } from '@supabase/supabase-js';

// Admin client with service role — for server-side operations only
// NEVER expose this on the client side
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);
