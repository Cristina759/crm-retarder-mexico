/**
 * Test: cotización → OS → avanzar a facturado → verificar monto_factura
 * Limpia todo al final (rollback).
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const OS_ESTADOS = [
  'solicitud_recibida','tecnico_asignado','servicio_programado','documentacion_enviada',
  'tecnico_en_contacto','servicio_en_proceso','autorizacion_adicional','servicio_concluido',
  'evidencia_cargada','documentacion_entregada','encuesta_enviada','facturado','pagado',
];
const OS_FASE = { solicitud_recibida:1,tecnico_asignado:1,servicio_programado:1,documentacion_enviada:1,tecnico_en_contacto:1,servicio_en_proceso:1,autorizacion_adicional:2,servicio_concluido:2,evidencia_cargada:2,documentacion_entregada:3,encuesta_enviada:3,facturado:3,pagado:3 };

let cotId = null, osId = null, empId = null, oppId = null;
const EMPRESA_TEST = 'TEST-EMPRESA-FLUJO-' + Date.now();
const TOTAL_COT = 123456.78;

const ok  = (msg) => console.log('  ✅', msg);
const err = (msg) => { console.error('  ❌', msg); };
const sep = (t)  => console.log(`\n── ${t} ──`);

// ── PASO 1: Crear empresa temporal ───────────────────────────────────────────
sep('PASO 1 — Crear empresa de prueba');
{
  const { data, error } = await sb.from('empresas').insert({ nombre_comercial: EMPRESA_TEST }).select('id').single();
  if (error || !data) { err('Error empresa: ' + error?.message); process.exit(1); }
  empId = data.id;
  ok(`Empresa creada: ${empId}`);
}

// ── PASO 2: Crear cotización (igual que crearCotizacion) ─────────────────────
sep('PASO 2 — Crear cotización');
{
  // Crear oportunidad vinculada
  const { data: opp, error: oppErr } = await sb.from('oportunidades').insert({
    empresa_id: empId, tipo: 'servicios',
    titulo: 'Test flujo', estado: 'cotizacion_enviada', probabilidad: 40, monto_estimado: TOTAL_COT,
  }).select('id').single();
  if (oppErr || !opp) { err('Error oportunidad: ' + oppErr?.message); process.exit(1); }
  oppId = opp.id;
  ok(`Oportunidad: ${oppId}`);

  const { data: cot, error: cotErr } = await sb.from('cotizaciones').insert({
    folio: 'TEST-FLUJO-001', empresa_id: empId, oportunidad_id: oppId,
    tipo: 'servicios', estado: 'enviada',
    subtotal: 106600.67, iva: 17056.11, total_mxn: TOTAL_COT, notas: 'Test automático',
  }).select('id, folio, total_mxn').single();
  if (cotErr || !cot) { err('Error cotización: ' + cotErr?.message); process.exit(1); }
  cotId = cot.id;
  ok(`Cotización creada: folio=${cot.folio} total_mxn=$${cot.total_mxn} id=${cotId}`);
}

// ── PASO 3: Crear OS desde la cotización (igual que crearOrdenServicio) ──────
sep('PASO 3 — Crear OS desde cotización (botón "Crear OS")');
{
  const { data: emp } = await sb.from('empresas').select('nombre_comercial').eq('id', empId).single();
  const abrev = emp?.nombre_comercial?.slice(0,3).toUpperCase() || 'OS';
  const numero = `OS-${abrev}-${Date.now().toString().slice(-4)}`;

  const { data: os, error: osErr } = await sb.from('ordenes_servicio').insert({
    numero, empresa_id: empId,
    cotizacion_id: cotId,    // ← PUNTO CLAVE
    estado: 'solicitud_recibida', fase: 1, estado_facturacion: 'pendiente',
  }).select('id, numero, cotizacion_id, monto_factura').single();

  if (osErr || !os) { err('Error OS: ' + osErr?.message); process.exit(1); }
  osId = os.id;

  console.log(`     numero:        ${os.numero}`);
  console.log(`     cotizacion_id: ${os.cotizacion_id}`);
  console.log(`     monto_factura: ${os.monto_factura}`);

  if (os.cotizacion_id === cotId) ok('cotizacion_id guardado correctamente en la OS');
  else err(`cotizacion_id NO coincide: esperado=${cotId} obtenido=${os.cotizacion_id}`);
}

// ── PASO 4: Avanzar directamente a "facturado" (igual que actualizarEstadoOS) ─
sep('PASO 4 — Avanzar a estado "facturado" (lógica de actualizarEstadoOS)');
{
  const nuevoEstado = 'facturado';
  const update = { estado: nuevoEstado, fase: OS_FASE[nuevoEstado], estado_facturacion: 'facturada' };

  // Replicar lógica exacta de actualizarEstadoOS
  const { data: os } = await sb.from('ordenes_servicio')
    .select('monto_factura, cotizacion_id').eq('id', osId).single();

  console.log(`     monto_factura antes:  ${os?.monto_factura}`);
  console.log(`     cotizacion_id:        ${os?.cotizacion_id}`);

  if (os && (!os.monto_factura || os.monto_factura === 0) && os.cotizacion_id) {
    const { data: cot } = await sb.from('cotizaciones')
      .select('total_mxn').eq('id', os.cotizacion_id).single();
    if (cot?.total_mxn) {
      update.monto_factura = cot.total_mxn;
      ok(`monto_factura tomado de cotización: $${cot.total_mxn}`);
    } else {
      err(`cotización tiene total_mxn=${cot?.total_mxn} — no se puede auto-llenar`);
    }
  } else if (!os?.cotizacion_id) {
    err('cotizacion_id es null — el fallback no aplica');
  } else {
    ok(`monto_factura ya tenía valor: $${os?.monto_factura}`);
  }

  const { error: upErr } = await sb.from('ordenes_servicio').update(update).eq('id', osId);
  if (upErr) { err('Error update estado: ' + upErr.message); }
  else ok(`Estado actualizado a "${nuevoEstado}"`);
}

// ── PASO 5: Leer la OS final y verificar ─────────────────────────────────────
sep('PASO 5 — Leer OS final y verificar');
{
  const { data: os } = await sb.from('ordenes_servicio')
    .select('id, estado, estado_facturacion, cotizacion_id, monto_factura').eq('id', osId).single();

  console.log(`     estado:           ${os?.estado}`);
  console.log(`     estado_factura:   ${os?.estado_facturacion}`);
  console.log(`     cotizacion_id:    ${os?.cotizacion_id}`);
  console.log(`     monto_factura:    ${os?.monto_factura}`);

  if (os?.monto_factura === TOTAL_COT)
    ok(`monto_factura = $${os.monto_factura} ✓ coincide con total_mxn de la cotización`);
  else if (os?.monto_factura && os.monto_factura > 0)
    err(`monto_factura = $${os.monto_factura} ≠ esperado $${TOTAL_COT}`);
  else
    err(`monto_factura sigue en 0/null — el flujo está roto`);
}

// ── PASO 6: Simular obtenerFacturas (fallback en enriquecimiento) ─────────────
sep('PASO 6 — Simular lógica de obtenerFacturas (fallback cotización)');
{
  const { data: rows } = await sb.from('ordenes_servicio')
    .select('id, monto_factura, cotizacion_id, abonos, estado, estado_facturacion')
    .eq('id', osId);
  const r = rows?.[0];
  const cotIds = r?.cotizacion_id ? [r.cotizacion_id] : [];
  const { data: cots } = cotIds.length
    ? await sb.from('cotizaciones').select('id, total_mxn').in('id', cotIds)
    : { data: [] };
  const cotMap = new Map((cots ?? []).map(c => [c.id, c]));
  const cot = cotMap.get(r?.cotizacion_id || '');
  let finalMonto = Number(r?.monto_factura) || 0;
  if (finalMonto === 0 && cot) finalMonto = Number(cot.total_mxn) || 0;

  console.log(`     monto_factura en DB:      $${r?.monto_factura}`);
  console.log(`     finalMonto tras fallback:  $${finalMonto}`);
  if (finalMonto === TOTAL_COT) ok('Fallback de obtenerFacturas funciona correctamente');
  else err(`finalMonto = $${finalMonto} — fallback no funciona`);
}

// ── ROLLBACK: Limpiar datos de prueba ─────────────────────────────────────────
sep('ROLLBACK — Eliminar datos de prueba');
if (osId)  { await sb.from('ordenes_servicio').delete().eq('id', osId);   ok(`OS ${osId} eliminada`); }
if (cotId) { await sb.from('cotizaciones').delete().eq('id', cotId);      ok(`Cotización ${cotId} eliminada`); }
if (oppId) { await sb.from('oportunidades').delete().eq('id', oppId);     ok(`Oportunidad ${oppId} eliminada`); }
if (empId) { await sb.from('empresas').delete().eq('id', empId);          ok(`Empresa ${empId} eliminada`); }

console.log('\n── RESUMEN COMPLETO ──');
