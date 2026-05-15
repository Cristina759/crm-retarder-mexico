'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

export type EstadoFacturacion =
  | 'pendiente'      // Según SQL
  | 'facturada'
  | 'enviada_cliente'
  | 'pago_parcial'
  | 'pagada'
  | 'vencida';

export interface FacturaRow {
  id: string;
  numero: string;
  numero_factura: string | null;
  monto_factura: number | null;
  monto_neto?: number;
  concepto_factura: string | null;
  fecha_vencimiento: string | null;
  estado_facturacion: EstadoFacturacion | null;
  created_at: string | null;
  empresa_id: string | null;
  empresa_nombre: string | null;
  total_pagado?: number;
  saldo_pendiente?: number;
  abonos?: any[];
}

// ── Utilidad: conversión segura a centavos (integer) ─────────────────────────
// REGLA CONTABLE: nunca usar float para dinero. Toda aritmética en centavos.
function toCents(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return Math.round(v * 100);
  
  const s = String(v).trim().replace(/,/g, ''); // Quitar comas de miles
  if (!s) return 0;

  const neg = s.startsWith('-');
  const abs = neg ? s.slice(1) : s;
  const parts = abs.split('.');
  const intPart = parseInt(parts[0] || '0', 10) || 0;
  const decStr = (parts[1] || '00').padEnd(2, '0').slice(0, 2);
  const decPart = parseInt(decStr, 10) || 0;

  const cents = intPart * 100 + decPart;
  return neg ? -cents : cents;
}

/** Convierte centavos a pesos con 2 decimales exactos */
function fromCents(cents: number): number {
  return cents / 100;
}

// ── obtenerFacturas ───────────────────────────────────────────────────────────
export async function obtenerFacturas(): Promise<{ data: FacturaRow[]; error: string | null }> {
  try {
    const rawResult = await supabaseAdmin
      .from('ordenes_servicio')
      .select('id, numero, numero_os_manual, numero_factura, monto_factura, concepto_factura, fecha_vencimiento, estado_facturacion, created_at, empresa_id, cotizacion_id, abonos')
      .in('estado', ['facturado', 'pagado', 'facturada', 'pagada'])
      .order('created_at', { ascending: true })
      .limit(500);
    const rows: any[] = (rawResult.data ?? []) as any[];
    const error = rawResult.error;

    if (error) return { data: [], error: error.message };


    const empresaIds = Array.from(new Set((rows ?? []).map(r => r.empresa_id).filter(Boolean))) as string[];
    const { data: empresas } = await supabaseAdmin.from('empresas').select('id, nombre_comercial').in('id', empresaIds);
    const empresaMap = new Map((empresas ?? []).map(e => [e.id, e.nombre_comercial]));

    // Cargar totales y folios de cotizaciones vinculadas (o por oportunidad si no hay cotizacion_id)
    const cotIds = Array.from(new Set((rows ?? []).map(r => r.cotizacion_id).filter(Boolean))) as string[];
    const oppIds = Array.from(new Set((rows ?? []).map(r => r.oportunidad_id).filter(Boolean))) as string[];

    const [{ data: cotsDirectas }, { data: cotsPorOpp }] = await Promise.all([
      cotIds.length ? supabaseAdmin.from('cotizaciones').select('id, total_mxn, folio, tipo, oportunidad_id').in('id', cotIds) : { data: [] },
      oppIds.length ? supabaseAdmin.from('cotizaciones').select('id, total_mxn, folio, tipo, oportunidad_id').in('oportunidad_id', oppIds) : { data: [] }
    ]);

    const allCots = [...(cotsDirectas ?? []), ...(cotsPorOpp ?? [])];
    const cotMap = new Map();
    allCots.forEach(c => {
      if (!cotMap.has(c.id)) cotMap.set(c.id, c);
    });

    const { data: ncs } = await supabaseAdmin
      .from('notas_credito')
      .select('os_id, monto')
      .in('os_id', (rows ?? []).map(r => r.id));
    // NC map en CENTAVOS
    const ncMapCents = new Map<string, number>();
    (ncs ?? []).forEach(nc => {
      if (nc.os_id) {
        ncMapCents.set(nc.os_id, (ncMapCents.get(nc.os_id) || 0) + toCents(nc.monto));
      }
    });

     const enriched: FacturaRow[] = ((rows as any[]) ?? []).map(r => {
       let cot = cotMap.get(r.cotizacion_id || '');

       // Fallback: Si no hay cotización directa, buscar por oportunidad en el mapa cargado
       if (!cot && r.oportunidad_id) {
         cot = Array.from(cotMap.values()).find((c: any) => c.oportunidad_id === r.oportunidad_id);
       }

       let brutoCents = toCents(r.monto_factura);
       if (brutoCents === 0 && cot) brutoCents = toCents(cot.total_mxn);

        const ncCents = ncMapCents.get(r.id) || 0;
        const netoCents = brutoCents - ncCents;

        // Abonos y Saldo — todo en centavos
        const abonos = Array.isArray(r.abonos) ? r.abonos : [];
        const totalAbonadoCents = abonos.reduce((s: number, a: any) => s + toCents(a?.monto), 0);
        
        // Si está pagada pero no hay abonos registrados, usamos el neto como base
        let cobradoCents = (r.estado_facturacion === 'pagada' && totalAbonadoCents === 0) ? netoCents : totalAbonadoCents;
        // Nunca podemos reportar un pago mayor a la deuda neta
        cobradoCents = Math.min(cobradoCents, Math.max(0, netoCents));

        const saldoCents = Math.max(0, netoCents - cobradoCents);

        return {
           id: r.id,
           numero: r.numero_os_manual || r.numero,
           numero_factura: r.numero_factura,
           monto_factura: fromCents(brutoCents), // Bruto para que el usuario vea el original
           monto_neto: fromCents(netoCents),     // Neto para totales
           concepto_factura: r.concepto_factura || cot?.tipo || 'Servicio',
           fecha_vencimiento: r.fecha_vencimiento,
           estado_facturacion: (r.estado_facturacion as EstadoFacturacion) || null,
           created_at: r.created_at,
           empresa_id: r.empresa_id,
           empresa_nombre: empresaMap.get(r.empresa_id) || 'Empresa Desconocida',
            total_pagado: fromCents(cobradoCents),
            saldo_pendiente: fromCents(saldoCents),
            abonos
          };
      });



    return { data: enriched, error: null };


  } catch (e) { return { data: [], error: String(e) }; }
}

// ── resumenFacturacion (CONCORDANTE CON SQL, ARITMÉTICA EN CENTAVOS) ──────────
export async function obtenerResumenFacturacion(): Promise<{
  totalFacturado: number; totalCobrado: number; pendientes: number;
  vencidas: number; totalNotasCredito: number; error: string | null;
}> {
  try {
    // Usamos el mismo filtro que obtenerFacturas para asegurar consistencia total
    const { data: facts, error: errFacts } = await supabaseAdmin
      .from('ordenes_servicio')
      .select('id, monto_factura, estado_facturacion, cotizacion_id, oportunidad_id, abonos, numero_factura')
      .in('estado', ['facturado', 'pagado', 'facturada', 'pagada']) as any;
    
    const { data: notas } = await supabaseAdmin.from('notas_credito').select('monto');

    // Cargar totales de cotizaciones vinculadas o por oportunidad (fallback)
    const cotIds = Array.from(new Set(((facts as any[]) ?? []).map(r => r.cotizacion_id).filter(Boolean))) as string[];
    const oppIds = Array.from(new Set(((facts as any[]) ?? []).map(r => r.oportunidad_id).filter(Boolean))) as string[];

    const [{ data: cotsDirectas }, { data: cotsPorOpp }] = await Promise.all([
      cotIds.length ? supabaseAdmin.from('cotizaciones').select('id, total_mxn, oportunidad_id').in('id', cotIds) : { data: [] },
      oppIds.length ? supabaseAdmin.from('cotizaciones').select('id, total_mxn, oportunidad_id').in('oportunidad_id', oppIds) : { data: [] }
    ]);

    const allCots = [...(cotsDirectas ?? []), ...(cotsPorOpp ?? [])];
    const cotMap = new Map();
    allCots.forEach(c => {
      if (!cotMap.has(c.id)) cotMap.set(c.id, c.total_mxn);
    });

    // Cargar Notas de Crédito agrupadas por os_id — EN CENTAVOS
    const { data: allNCs } = await supabaseAdmin.from('notas_credito').select('os_id, monto');
    const ncMapCents = new Map<string, number>();
    (allNCs ?? []).forEach(nc => {
      if (nc.os_id) ncMapCents.set(nc.os_id, (ncMapCents.get(nc.os_id) || 0) + toCents(nc.monto));
    });

    // Totales en CENTAVOS
    let totalFacturadoCents = 0;
    let totalCobradoCents = 0;
    let pendientes = 0;
    let vencidas = 0;

    ((facts as any[]) ?? []).forEach(r => {
      let brutoCents = toCents(r.monto_factura);
      if (brutoCents === 0 && r.cotizacion_id) {
        brutoCents = toCents(cotMap.get(r.cotizacion_id));
      }
      // Fallback por oportunidad
      if (brutoCents === 0 && r.oportunidad_id) {
        // Buscamos en allCots la que coincida con la oportunidad
        const cotO = allCots.find(c => c.oportunidad_id === r.oportunidad_id);
        if (cotO) brutoCents = toCents(cotO.total_mxn);
      }

      const ncCents = ncMapCents.get(r.id) || 0;
      const netoCents = brutoCents - ncCents;

      totalFacturadoCents += netoCents;

      // EL COBRADO es la suma de todos los abonos individuales — en centavos
      const abonos = Array.isArray(r.abonos) ? r.abonos : [];
      const totalAbonadoCents = abonos.reduce((s: number, a: any) => s + toCents(a?.monto), 0);
      
      let cobradoCents = (r.estado_facturacion === 'pagada' && totalAbonadoCents === 0) ? netoCents : totalAbonadoCents;
      cobradoCents = Math.min(cobradoCents, Math.max(0, netoCents));

      totalCobradoCents += cobradoCents;

      
      const st = r.estado_facturacion ?? '';
      if (['pendiente', 'facturada', 'enviada_cliente', 'pago_parcial'].includes(st)) pendientes++;
      if (st === 'vencida') vencidas++;
    });

    const totalNotasCreditoCents = (notas ?? []).reduce((s: number, r: any) => s + toCents(r.monto), 0);

    // Convertir de centavos a pesos para la respuesta
    return {
      totalFacturado: fromCents(totalFacturadoCents),
      totalCobrado: fromCents(totalCobradoCents),
      pendientes,
      vencidas,
      totalNotasCredito: fromCents(totalNotasCreditoCents),
      error: null
    };



  } catch (e) {
    return { totalFacturado: 0, totalCobrado: 0, pendientes: 0, vencidas: 0, totalNotasCredito: 0, error: String(e) };
  }
}

export async function actualizarFactura(id: string, datos: any) {
  const { error } = await supabaseAdmin.from('ordenes_servicio').update(datos).eq('id', id);
  return { error: error?.message ?? null };
}
export async function marcarFacturaPagada(id: string) {
  const { error } = await supabaseAdmin.from('ordenes_servicio').update({ estado_facturacion: 'pagada' }).eq('id', id);
  return { error: error?.message ?? null };
}
export async function registrarPago(id: string, pago: { monto: number, fecha: string, referencia: string }) {
  try {
    const { data: os } = await supabaseAdmin.from('ordenes_servicio').select('abonos, monto_factura, cotizacion_id').eq('id', id).single();
    if (!os) return { error: 'No se encontró la orden' };

    const abonos = ((os as any).abonos as any[]) || [];
    const nuevosAbonos = [...abonos, { ...pago, id: Date.now().toString() }];
    
    // Calcular si ya se pagó todo — en centavos
    const totalPagadoCents = nuevosAbonos.reduce((s, a) => s + toCents(a.monto), 0);
    
    // Obtener monto total (manual o cotización)
    let montoTotalCents = toCents((os as any).monto_factura);
    if (montoTotalCents === 0) {
      if ((os as any).cotizacion_id) {
        const { data: cot } = await supabaseAdmin.from('cotizaciones').select('total_mxn').eq('id', (os as any).cotizacion_id).single();
        montoTotalCents = toCents(cot?.total_mxn);
      } else if ((os as any).oportunidad_id) {
        const { data: cot } = await supabaseAdmin.from('cotizaciones').select('total_mxn').eq('oportunidad_id', (os as any).oportunidad_id).order('created_at', { ascending: false }).limit(1).maybeSingle();
        montoTotalCents = toCents(cot?.total_mxn);
      }
    }

    let nuevoEstado: EstadoFacturacion = 'pago_parcial';
    if (totalPagadoCents >= montoTotalCents && montoTotalCents > 0) {
      nuevoEstado = 'pagada';
    }

    const { error } = await supabaseAdmin.from('ordenes_servicio').update({
      abonos: nuevosAbonos,
      estado_facturacion: nuevoEstado
    } as any).eq('id', id);

    return { error: error?.message ?? null };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function eliminarFactura(id: string) {
  // Revierte el estado de la OS a 'encuesta_enviada' (antes de facturado)
  // y limpia todos los campos de factura
  const { error } = await supabaseAdmin.from('ordenes_servicio').update({
    estado: 'encuesta_enviada',
    estado_facturacion: 'pendiente',
    numero_factura: null,
    monto_factura: null,
    concepto_factura: null,
    fecha_vencimiento: null,
    archivada: false,
  }).eq('id', id);
  return { error: error?.message ?? null };
}

export interface NotaCreditoRow {
  id: string;
  numero_nc: string | null;
  monto: number;
  descripcion: string | null;
  empresa_id: string | null;
  empresa_nombre: string | null;
  created_at: string;
}

export async function obtenerNotasCredito(): Promise<{ data: NotaCreditoRow[]; error: string | null }> {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from('notas_credito')
      .select('id, numero_nc, monto, descripcion, empresa_id, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return { data: [], error: error.message };

    const empresaIds = Array.from(new Set((rows ?? []).map(r => r.empresa_id).filter((x): x is string => !!x)));
    const { data: empresas } = empresaIds.length
      ? await supabaseAdmin.from('empresas').select('id, nombre_comercial').in('id', empresaIds)
      : { data: [] as Array<{ id: string; nombre_comercial: string }> };
    const empresaMap = new Map((empresas ?? []).map(e => [e.id, e.nombre_comercial]));

    const enriched: NotaCreditoRow[] = (rows ?? []).map(r => ({
      ...r,
      empresa_nombre: r.empresa_id ? (empresaMap.get(r.empresa_id) ?? null) : null,
    }));

    return { data: enriched, error: null };
  } catch (e) { return { data: [], error: String(e) }; }
}

export async function crearNotaCredito(datos: {
  numero_nc?: string;
  monto: number;
  descripcion?: string;
  empresa_id?: string;
  os_id?: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin.from('notas_credito').insert({
    numero_nc:   datos.numero_nc   ?? null,
    monto:       datos.monto,
    descripcion: datos.descripcion ?? null,
    empresa_id:  datos.empresa_id  ?? null,
    os_id:       datos.os_id       ?? null,
  });
  return { error: error?.message ?? null };
}



export async function eliminarNotaCredito(id: string): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin.from('notas_credito').delete().eq('id', id);
  return { error: error?.message ?? null };
}

export async function buscarFacturasParaNC(query: string) {
  const { data } = await supabaseAdmin
    .from('ordenes_servicio')
    .select('id, numero_factura, numero, empresas(id, nombre_comercial)')
    .or(`numero_factura.ilike.%${query}%,numero.ilike.%${query}%`)
    .not('numero_factura', 'is', null)
    .limit(10);
  
  return (data ?? []).map((r: any) => ({
    id: r.id,
    numero_factura: r.numero_factura,
    numero_os: r.numero,
    empresa_id: r.empresas?.id,
    empresa_nombre: r.empresas?.nombre_comercial
  }));
}
