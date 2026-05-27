import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const EMPRESA_CROSO = '9d63e758-0fd8-4dca-8bcc-95d97f169240';

const { data, error } = await supabase
  .from('ordenes_servicio')
  .insert({
    numero:            'B677',
    numero_factura:    'B677',
    numero_os_manual:  'B677',
    estado:            'cancelado',
    estado_facturacion: 'cancelado',
    empresa_id:        EMPRESA_CROSO,
    monto_factura:     0,
    created_at:        '2026-05-04T00:00:00.000Z',
  })
  .select('id, numero, numero_factura, estado, estado_facturacion');

if (error) console.error('❌ Error:', error.message);
else console.log('✅ B677 creada:', JSON.stringify(data));
