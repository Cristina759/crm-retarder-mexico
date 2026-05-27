/**
 * Detecta discrepancias entre obtenerFacturas (tabla) y obtenerResumenFacturacion (totales)
 * Busca OS que entran al total pero NO aparecen en tabla, o aparecen con $0
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// ── 1. Simulación de obtenerFacturas ──────────────────────────────────────────
const selectFields = 'id, numero, numero_os_manual, numero_factura, monto_factura, concepto_factura, fecha_vencimiento, estado_facturacion, estado, created_at, empresa_id, cotizacion_id, abonos';

const [
  { data: rowsActivas,   error: err1 },
  { data: rowsCancelFact },
  { data: rowsCancelOS },
] = await Promise.all([
  sb.from('ordenes_servicio').select(selectFields)
    .in('estado', ['facturado', 'pagado'])
    .order('created_at', { ascending: false }).limit(200),
  sb.from('ordenes_servicio').select(selectFields)
    .eq('estado_facturacion', 'cancelado')
    .order('created_at', { ascending: false }).limit(100),
  sb.from('ordenes_servicio').select(selectFields)
    .eq('estado', 'cancelado').not('numero_factura', 'is', null)
    .order('created_at', { ascending: false }).limit(100),
]);

if (err1) { console.error('Error query 1:', err1.message); process.exit(1); }

const seen = new Set();
const tablaRows = [];
for (const r of [...(rowsActivas ?? []), ...(rowsCancelFact ?? []), ...(rowsCancelOS ?? [])]) {
  if (r && !seen.has(r.id)) { seen.add(r.id); tablaRows.push(r); }
}

// Cotizaciones fallback para tabla
const cotIdsTabla = [...new Set(tablaRows.map(r => r.cotizacion_id).filter(Boolean))];
const { data: cotsTabla } = cotIdsTabla.length
  ? await sb.from('cotizaciones').select('id, total_mxn, folio, tipo').in('id', cotIdsTabla)
  : { data: [] };
const cotMapTabla = new Map((cotsTabla ?? []).map(c => [c.id, c]));

// NCs para tabla
const { data: ncsTabla } = await sb.from('notas_credito').select('os_id, monto')
  .in('os_id', tablaRows.map(r => r.id));
const ncMapTabla = new Map();
(ncsTabla ?? []).forEach(nc => { if (nc.os_id) ncMapTabla.set(nc.os_id, (ncMapTabla.get(nc.os_id) || 0) + Number(nc.monto)); });

// Calcular finalMonto para cada fila de tabla
const tablaConMonto = tablaRows.map(r => {
  const estadoFact = r.estado_facturacion || (r.estado === 'cancelado' ? 'cancelado' : null);
  const cot = cotMapTabla.get(r.cotizacion_id || '');
  let finalMonto = Number(r.monto_factura) || 0;
  if (finalMonto === 0 && cot) finalMonto = Number(cot.total_mxn) || 0;
  const montoNC = ncMapTabla.get(r.id) || 0;
  finalMonto = Math.max(0, finalMonto - Math.abs(montoNC));
  if (estadoFact === 'cancelado') finalMonto = 0;
  return { id: r.id, numero: r.numero_os_manual || r.numero, numero_factura: r.numero_factura, monto_en_tabla: finalMonto, monto_en_db: Number(r.monto_factura) || 0, cotizacion_id: r.cotizacion_id, estado: r.estado, estado_facturacion: estadoFact };
});
const tablaMapById = new Map(tablaConMonto.map(r => [r.id, r]));

// ── 2. Simulación de obtenerResumenFacturacion ────────────────────────────────
const { data: factsResumen } = await sb.from('ordenes_servicio')
  .select('id, monto_factura, estado_facturacion, cotizacion_id, abonos, numero_factura, estado')
  .or('monto_factura.gt.0,numero_factura.neq.null,estado_facturacion.in.(facturada,pagada,pago_parcial,vencida)');

const cotIdsResumen = [...new Set((factsResumen ?? []).map(r => r.cotizacion_id).filter(Boolean))];
const { data: cotsResumen } = cotIdsResumen.length
  ? await sb.from('cotizaciones').select('id, total_mxn').in('id', cotIdsResumen)
  : { data: [] };
const cotMapResumen = new Map((cotsResumen ?? []).map(c => [c.id, Number(c.total_mxn) || 0]));

const { data: ncsResumen } = await sb.from('notas_credito').select('monto, os_id');
const ncPerOS = new Map();
(ncsResumen ?? []).forEach(nc => { if (nc.os_id) ncPerOS.set(nc.os_id, (ncPerOS.get(nc.os_id) || 0) + Number(nc.monto)); });

let totalFacturadoCents = 0;
const resumenByRow = new Map();
(factsResumen ?? []).filter(r => r.estado_facturacion !== 'cancelado').forEach(r => {
  let monto = Number(r.monto_factura) || 0;
  if (monto === 0 && r.cotizacion_id) monto = cotMapResumen.get(r.cotizacion_id) || 0;
  const montoCents = Math.round(monto * 100);
  totalFacturadoCents += montoCents;
  resumenByRow.set(r.id, monto);
});

// ── 3. Buscar discrepancias ───────────────────────────────────────────────────
console.log('\n══ DISCREPANCIAS: en TOTAL pero no en TABLA (o con $0 en tabla) ══\n');

let hayDiscrepancias = false;

// 3a. En resumen pero no en tabla
for (const [id, montoResumen] of resumenByRow) {
  if (montoResumen === 0) continue; // no importa si monto=0
  if (!tablaMapById.has(id)) {
    const r = (factsResumen ?? []).find(x => x.id === id);
    console.log(`❌ EN TOTAL pero NO en tabla:`);
    console.log(`   id: ${id}  estado: ${r?.estado}  estado_fact: ${r?.estado_facturacion}  monto_resumen: $${montoResumen}  numero_factura: ${r?.numero_factura}`);
    hayDiscrepancias = true;
  }
}

// 3b. En tabla con $0 pero en resumen con monto > 0
for (const [id, tablaRow] of tablaMapById) {
  const montoResumen = resumenByRow.get(id) || 0;
  if (tablaRow.monto_en_tabla === 0 && montoResumen > 0) {
    console.log(`⚠️  EN TABLA con $0 pero en TOTAL con $${montoResumen}:`);
    console.log(`   numero: ${tablaRow.numero}  factura: ${tablaRow.numero_factura}  monto_db: $${tablaRow.monto_en_db}  cot: ${tablaRow.cotizacion_id}  estado_fact: ${tablaRow.estado_facturacion}`);
    hayDiscrepancias = true;
  }
}

// 3c. En tabla con monto > 0 pero diferente del resumen
for (const [id, tablaRow] of tablaMapById) {
  const montoResumen = resumenByRow.get(id) || 0;
  if (tablaRow.monto_en_tabla !== montoResumen && (tablaRow.monto_en_tabla > 0 || montoResumen > 0)) {
    console.log(`🔍 MONTO DIFERENTE tabla=$${tablaRow.monto_en_tabla} vs total=$${montoResumen}:`);
    console.log(`   numero: ${tablaRow.numero}  factura: ${tablaRow.numero_factura}  monto_db: $${tablaRow.monto_en_db}`);
    hayDiscrepancias = true;
  }
}

if (!hayDiscrepancias) console.log('✅ No hay discrepancias entre tabla y totales.');

// ── 4. Verificar B360 específicamente ────────────────────────────────────────
console.log('\n══ B360 (OS-ACA-4916) ══');
const b360tabla = tablaConMonto.find(r => r.numero_factura === 'B360');
const b360resumen = (factsResumen ?? []).find(r => r.numero_factura === 'B360');

if (b360tabla) {
  console.log(`  En tabla: monto_en_tabla=$${b360tabla.monto_en_tabla}  monto_db=$${b360tabla.monto_en_db}  estado_fact=${b360tabla.estado_facturacion}`);
} else {
  console.log(`  ❌ B360 NO está en la tabla (no aparece en obtenerFacturas)`);
}
if (b360resumen) {
  const montoR = resumenByRow.get(b360resumen.id) || 0;
  console.log(`  En resumen: monto=$${montoR}  estado_fact=${b360resumen.estado_facturacion}`);
} else {
  console.log(`  ❌ B360 NO está en el resumen`);
}

// ── 5. Total general ──────────────────────────────────────────────────────────
const totalNotasCredito = (ncsResumen ?? []).reduce((s, nc) => s + Number(nc.monto), 0);
const totalFacturado = totalFacturadoCents / 100;
const totalNetoFacturado = Math.round(totalFacturado * 100) / 100 - Math.round(totalNotasCredito * 100) / 100;
console.log(`\n══ TOTALES ══`);
console.log(`  Total Facturado bruto (resumen):  $${totalFacturado.toFixed(2)}`);
console.log(`  Total NCs:                        $${totalNotasCredito.toFixed(2)}`);
console.log(`  Total Neto Facturado (resumen):   $${totalNetoFacturado.toFixed(2)}`);
console.log(`  Filas en tabla:                   ${tablaConMonto.length}`);
console.log(`  Filas en resumen:                 ${(factsResumen ?? []).filter(r => r.estado_facturacion !== 'cancelado').length}`);
console.log(`  rowsActivas (facturado/pagado):   ${(rowsActivas ?? []).length}  (limit=200)`);
