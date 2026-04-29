import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const resultado: Record<string, unknown> = {
    NEXT_PUBLIC_SUPABASE_URL:    process.env.NEXT_PUBLIC_SUPABASE_URL     ? '✅ OK' : '❌ VACÍO',
    SUPABASE_SERVICE_ROLE_KEY:   process.env.SUPABASE_SERVICE_ROLE_KEY    ? '✅ OK' : '❌ VACÍO',
    key_empieza_con_eyJ:         process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('eyJ') ? '✅' : '❌',
  };

  try {
    const { data, error } = await supabaseAdmin
      .from('cotizaciones')
      .select('id')
      .limit(1);

    resultado.supabase_query = error
      ? `❌ ERROR: ${error.message} (code: ${error.code})`
      : `✅ OK — devolvió ${data?.length ?? 0} fila(s)`;
  } catch (e: unknown) {
    resultado.supabase_query = `❌ EXCEPCIÓN: ${String(e)}`;
  }

  return NextResponse.json(resultado, { status: 200 });
}
