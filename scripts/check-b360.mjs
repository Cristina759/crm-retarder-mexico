/**
 * Diagnóstico B360: por qué apareció en facturación con monto 140,648.96
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

console.log('── B360 (OS-ACA-4916) diagnóstico ──\n');

// 1. Estado actual de B360
const { data: rows } = await sb.from('ordenes_servicio')
  .select('id, numero, numero_factura, monto_factura, cotizacion_id, estado, estado_facturacion, updated_at, created_at, abonos')
  .or('numero_factura.eq.B360,id.eq.OS-ACA-4916,numero.eq.OS-ACA-4916');

if (!rows?.length) {
  // Buscar por número de OS
  const { data: r2 } = await sb.from('ordenes_servicio')
    .select('id, numero, numero_factura, monto_factura, cotizacion_id, estado, estado_facturacion, updated_at, created_at, abonos')
    .eq('numero_factura', 'B360');
  rows?.push(...(r2 ?? []));
}

const { data: b360rows } = await sb.from('ordenes_servicio')
  .select('id, numero, numero_os_manual, numero_factura, monto_factura, cotizacion_id, estado, estado_facturacion, updated_at, created_at, abonos')
  .eq('numero_factura', 'B360');

if (!b360rows?.length) {
  console.error('❌ No se encontró OS con numero_factura=B360');
  process.exit(1);
}

const os = b360rows[0];
console.log('OS encontrada:');
console.log('  id:                ', os.id);
console.log('  numero:            ', os.numero);
console.log('  numero_os_manual:  ', os.numero_os_manual);
console.log('  numero_factura:    ', os.numero_factura);
console.log('  monto_factura:     ', os.monto_factura);
console.log('  cotizacion_id:     ', os.cotizacion_id);
console.log('  estado:            ', os.estado);
console.log('  estado_facturacion:', os.estado_facturacion);
console.log('  created_at:        ', os.created_at);
console.log('  updated_at:        ', os.updated_at);
console.log('  abonos:            ', JSON.stringify(os.abonos));

// 2. Verificar si la cotización vinculada existe
if (os.cotizacion_id) {
  const { data: cot } = await sb.from('cotizaciones')
    .select('id, folio, total_mxn').eq('id', os.cotizacion_id).maybeSingle();
  if (cot) {
    console.log('\n✅ Cotización vinculada:');
    console.log('  id:        ', cot.id);
    console.log('  folio:     ', cot.folio);
    console.log('  total_mxn: ', cot.total_mxn);
    if (Number(cot.total_mxn) === Number(os.monto_factura)) {
      console.log('  ✓ monto_factura coincide con total_mxn de la cotización');
      console.log('  → La auto-llenado funcionó correctamente');
    }
  } else {
    console.log('\n⚠️  cotizacion_id existe pero la cotización NO existe en BD — fue eliminada');
    console.log('  → Esto explicaría por qué cotizacion_id=null ahora: eliminarCotizacion limpia el id');
  }
} else {
  console.log('\n⚠️  cotizacion_id = NULL en este momento');
  console.log('  Posibles causas:');
  console.log('  1. La OS fue creada manualmente (no via "Crear OS")');
  console.log('  2. La cotización vinculada fue eliminada → eliminarCotizacion pone cotizacion_id=null');
}

// 3. Buscar OS con updated_at cercano a B360 (ventana ±30 segundos)
console.log('\n── OS actualizadas en ventana ±30s de B360 ──');
const updTime = new Date(os.updated_at);
const desde   = new Date(updTime.getTime() - 30000).toISOString();
const hasta   = new Date(updTime.getTime() + 30000).toISOString();

const { data: cercanas } = await sb.from('ordenes_servicio')
  .select('id, numero, numero_factura, cotizacion_id, monto_factura, estado_facturacion, updated_at')
  .gte('updated_at', desde)
  .lte('updated_at', hasta)
  .order('updated_at');

(cercanas ?? []).forEach(r => {
  console.log(`  ${r.updated_at}  ${r.numero_factura ?? '(sin factura)'}  monto=${r.monto_factura}  cot=${r.cotizacion_id ?? 'null'}`);
});

// 4. Verificar si hay notas de crédito vinculadas a B360
const { data: ncs } = await sb.from('notas_credito').select('id, monto, numero_nc, descripcion').eq('os_id', os.id);
if (ncs?.length) {
  console.log('\n── Notas de crédito vinculadas ──');
  ncs.forEach(nc => console.log(`  NC ${nc.numero_nc}: $${nc.monto}  ${nc.descripcion ?? ''}`));
  const totalNC = ncs.reduce((s, nc) => s + Number(nc.monto), 0);
  console.log(`  Total NC: $${totalNC}`);
  console.log(`  Neto B360: $${Number(os.monto_factura) - totalNC}`);
} else {
  console.log('\n  Sin notas de crédito vinculadas');
}

// 5. Resumen y diagnóstico
console.log('\n── DIAGNÓSTICO ──');
console.log(`  B360 updated_at = ${os.updated_at}`);
console.log(`  monto_factura   = $${os.monto_factura}`);
if (!os.cotizacion_id) {
  console.log('  cotizacion_id   = NULL');
  console.log('');
  console.log('  CONCLUSIÓN: El monto fue escrito HOY pero no hay cotización vinculada ahora.');
  console.log('  Hipótesis más probable: se eliminó una cotización que estaba vinculada a esta OS,');
  console.log('  y eliminarCotizacion() limpió el cotizacion_id. El monto quedó guardado.');
  console.log('  El Math.min fix NO es la causa — solo afecta cobrado, no qué filas aparecen.');
}
