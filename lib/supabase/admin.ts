import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Forzar IPv4 — evita "TypeError: fetch failed" con Supabase en Windows y Linux
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dns = require('dns') as typeof import('dns');
  dns.setDefaultResultOrder('ipv4first');
} catch { /* entorno sin módulo dns */ }

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
