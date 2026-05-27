import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Buscar la OS con factura B700
const { data: rows, error } = await supabase
  .from('ordenes_servicio')
  .select('id, numero, numero_factura, monto_factura, cotizacion_id, estado, estado_facturacion')
  .or('numero_factura.eq.B700,numero.eq.300,numero_os_manual.eq.300');

if (error || !rows?.length) { console.error('❌ No se encontró OS 300/B700:', error?.message); process.exit(1); }

const os = rows[0];
console.log(`📋 ${rows.length} fila(s) encontrada(s). Usando la primera:`);
console.log('  id:              ', os.id);
console.log('  numero:          ', os.numero);
console.log('  numero_factura:  ', os.numero_factura);
console.log('  monto_factura:   ', os.monto_factura);
console.log('  cotizacion_id:   ', os.cotizacion_id);
console.log('  estado:          ', os.estado);
console.log('  estado_factura:  ', os.estado_facturacion);
if (rows.length > 1) rows.slice(1).forEach((r, i) => console.log(`  [${i+2}] numero=${r.numero} factura=${r.numero_factura} cot=${r.cotizacion_id}`));

if (!os.cotizacion_id) {
  console.log('\n⚠️  cotizacion_id es NULL — no hay cotización vinculada en BD');
  process.exit(0);
}

// Buscar la cotización vinculada
const { data: cot, error: errCot } = await supabase
  .from('cotizaciones')
  .select('id, folio, total_mxn, subtotal, iva, tipo')
  .eq('id', os.cotizacion_id)
  .maybeSingle();

if (errCot || !cot) {
  console.log('\n❌ La cotización vinculada NO existe en BD:', errCot?.message);
  process.exit(1);
}

console.log('\n📑 Cotización vinculada:');
console.log('  id:        ', cot.id);
console.log('  folio:     ', cot.folio);
console.log('  tipo:      ', cot.tipo);
console.log('  subtotal:  ', cot.subtotal);
console.log('  iva:       ', cot.iva);
console.log('  total_mxn: ', cot.total_mxn);

if (!cot.total_mxn || cot.total_mxn === 0) {
  console.log('\n⚠️  total_mxn es 0 o null en la cotización — por eso no hace fallback');
} else {
  console.log('\n✅ La cotización tiene total_mxn válido. El fallback en facturacion.ts DEBERÍA funcionar.');
  console.log('   Revisa si el deploy está actualizado en Vercel.');
}
