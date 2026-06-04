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
  concepto_factura: string | null;
  fecha_vencimiento: string | null;
  estado_facturacion: EstadoFacturacion | null;
  created_at: string | null;
  empresa_id: string | null;
  empresa_nombre: string | null;
  total_pagado?: number;
  saldo_pendiente?: number;
}

// ── obtenerFacturas ───────────────────────────────────────────────────────────
export async function obtenerFacturas(): Promise<{ data: FacturaRow[]; error: string | null }> {
  try {
    const selectFields = 'id, numero, numero_os_manual, numero_factura, monto_factura, concepto_factura, fecha_vencimiento, estado_facturacion, estado, created_at, empresa_id, cotizacion_id, abonos';

    const [{ data: rowsActivas, error: err1 }, { data: rowsCancelFact }, { data: rowsCancelOS }] = await Promise.all([
      // OS facturadas/pagadas (flujo normal)
      supabaseAdmin.from('ordenes_servicio').select(selectFields)
        .in('estado', ['facturado', 'pagado'])
        .order('created_at', { ascending: false })
        .limit(200),
      // Canceladas por estado_facturacion
      supabaseAdmin.from('ordenes_servicio').select(selectFields)
        .eq('estado_facturacion', 'cancelado')
        .order('created_at', { ascending: false })
        .limit(100),
      // OS canceladas (estado principal) que tengan numero_factura asignado
      supabaseAdmin.from('ordenes_servicio').select(selectFields)
        .eq('estado', 'cancelado')
        .not('numero_factura', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    if (err1) return { data: [], error: err1.message };

    // Merge deduplicado por id
    const seen = new Set<string>();
    const rows: typeof rowsActivas = [];
    for (const r of [...(rowsActivas ?? []), ...(rowsCancelFact ?? []), ...(rowsCancelOS ?? [])]) {
      if (r && !seen.has(r.id)) { seen.add(r.id); rows.push(r); }
    }

    const empresaIds = Array.from(new Set((rows ?? []).map(r => r.empresa_id).filter(Boolean)));
    const { data: empresas } = await supabaseAdmin.from('empresas').select('id, nombre_comercial').in('id', empresaIds);
    const empresaMap = new Map((empresas ?? []).map(e => [e.id, e.nombre_comercial]));

    // Cargar totales y folios de cotizaciones vinculadas para los que no tienen monto o concepto
    const cotIds = Array.from(new Set((rows ?? []).map(r => r.cotizacion_id).filter((x): x is string => !!x)));
    const { data: cots } = cotIds.length
      ? await supabaseAdmin.from('cotizaciones').select('id, total_mxn, folio, tipo').in('id', cotIds)
      : { data: [] };
    const cotMap = new Map((cots ?? []).map(c => [c.id, c]));

    // Cargar Notas de Crédito vinculadas a estas facturas
    const { data: ncs } = await supabaseAdmin
      .from('notas_credito')
      .select('os_id, monto')
      .in('os_id', (rows ?? []).map(r => r.id));
    const ncMap = new Map<string, number>();
    (ncs ?? []).forEach(nc => {
      if (nc.os_id) {
        ncMap.set(nc.os_id, (ncMap.get(nc.os_id) || 0) + (Number(nc.monto) || 0));
      }
    });


    const enriched: FacturaRow[] = (rows ?? []).map(r => {
      // OS cuyo estado principal es 'cancelado' se tratan igual que estado_facturacion='cancelado'
      const estadoFact = r.estado_facturacion || (r.estado === 'cancelado' ? 'cancelado' : null);

      const cot = cotMap.get(r.cotizacion_id || '');
      let finalMonto = Number(r.monto_factura) || 0;
      if (finalMonto === 0 && cot) finalMonto = Number(cot.total_mxn) || 0;

      // RESTAR NOTAS DE CRÉDITO ESPECÍFICAS
      const montoNC = ncMap.get(r.id) || 0;
      finalMonto = Math.max(0, finalMonto - Math.abs(montoNC));

      // Facturas canceladas se muestran con $0 en todos los montos
      if (estadoFact === 'cancelado') finalMonto = 0;

      const abonos = Array.isArray(r.abonos) ? (r.abonos as any[]) : [];
      let total_pagado = estadoFact === 'cancelado'
        ? 0
        : abonos.reduce((s: number, a: any) => s + (Number(a?.monto) || 0), 0);

      if (estadoFact === 'pagada' && total_pagado === 0) total_pagado = finalMonto;

      // Cobrado nunca puede exceder el monto neto (ya descontadas NCs)
      total_pagado = Math.min(total_pagado, finalMonto);

      const saldo_pendiente = estadoFact === 'cancelado' ? 0 : Math.max(0, finalMonto - total_pagado);

      // Fallback de Concepto
      let finalConcepto = r.concepto_factura;
      if (!finalConcepto && cot) {
        const tipoStr = cot.tipo ? (cot.tipo.charAt(0).toUpperCase() + cot.tipo.slice(1)) : '';
        finalConcepto = `Cotización ${cot.folio}${tipoStr ? ' - ' + tipoStr : ''}`;
      }

      return {
        id: r.id,
        numero: r.numero_os_manual || r.numero,
        numero_factura: r.numero_factura,
        monto_factura: finalMonto,
        concepto_factura: finalConcepto,
        fecha_vencimiento: r.fecha_vencimiento,
        estado_facturacion: (estadoFact as EstadoFacturacion) || null,
        created_at: r.created_at,
        empresa_id: r.empresa_id ?? null,
        empresa_nombre: empresaMap.get(r.empresa_id) || 'Empresa Desconocida',
        total_pagado,
        saldo_pendiente,
      };
    });


    return { data: enriched, error: null };


  } catch (e) { return { data: [], error: String(e) }; }
}

// ── resumenFacturacion (CONCORDANTE CON SQL) ──────────────────────────────────
export async function obtenerResumenFacturacion(): Promise<{
  totalFacturado: number; totalCobrado: number;
  totalNetoFacturado: number; totalPendiente: number;
  pendientes: number; vencidas: number;
  totalNotasCredito: number; error: string | null;
}> {
  try {
    const [{ data: facts, error: errFacts }, { data: ncs, error: errNcs }] = await Promise.all([
      supabaseAdmin
        .from('ordenes_servicio')
        .select('id, monto_factura, estado_facturacion, cotizacion_id, abonos')
        .or('monto_factura.gt.0,numero_factura.neq.null,estado_facturacion.in.(facturada,pagada,pago_parcial,vencida)'),

      supabaseAdmin.from('notas_credito').select('monto, os_id'),
    ]);

    if (errFacts || errNcs) {
      return { totalFacturado: 0, totalCobrado: 0, totalNetoFacturado: 0, totalPendiente: 0, pendientes: 0, vencidas: 0, totalNotasCredito: 0, error: errFacts?.message || errNcs?.message || 'Error de BD' };
    }

    // NC por OS (para calcular monto neto por factura, igual que obtenerFacturas)
    const ncPerOS = new Map<string, number>();
    (ncs ?? []).forEach(nc => {
      if (nc.os_id) ncPerOS.set(nc.os_id, (ncPerOS.get(nc.os_id) || 0) + (Number(nc.monto) || 0));
    });

    // Cargar totales de cotizaciones vinculadas (fallback)
    const cotIds = Array.from(new Set((facts ?? []).map(r => r.cotizacion_id).filter((x): x is string => !!x)));
    const { data: cots } = cotIds.length
      ? await supabaseAdmin.from('cotizaciones').select('id, total_mxn').in('id', cotIds)
      : { data: [] };
    const cotMap = new Map((cots ?? []).map(c => [c.id, Number(c.total_mxn) || 0]));

    let totalFacturadoCents = 0;
    let totalCobradoCents = 0;
    let pendientes = 0;
    let vencidas = 0;

    // 'cancelado' (no 'cancelada') es el valor real en BD
    (facts ?? []).filter(r => r.estado_facturacion !== 'cancelado').forEach(r => {
      let monto = Number(r.monto_factura) || 0;
      if (monto === 0 && r.cotizacion_id) monto = cotMap.get(r.cotizacion_id) || 0;

      const montoCents    = Math.round(monto * 100);
      const ncMontoCents  = Math.round((ncPerOS.get(r.id) || 0) * 100);
      const montoNetoCents = Math.max(0, montoCents - ncMontoCents);

      totalFacturadoCents += montoCents;

      const abonos = Array.isArray(r.abonos) ? (r.abonos as any[]) : [];
      const totalAbonado = abonos.reduce((s: number, a: any) => s + (Number(a?.monto) || 0), 0);
      const abonadoCents = Math.round(totalAbonado * 100);

      if (r.estado_facturacion === 'pagada' && abonadoCents === 0) {
        // Pagada sin abonos: asumir cobro completo al monto neto
        totalCobradoCents += montoNetoCents;
      } else {
        // Abonos: capear al monto neto para que cobrado nunca exceda lo facturado neto
        totalCobradoCents += Math.min(abonadoCents, montoNetoCents);
      }

      const st = r.estado_facturacion ?? '';
      if (['pendiente', 'facturada', 'enviada_cliente', 'pago_parcial'].includes(st)) pendientes++;
      if (st === 'vencida') vencidas++;
    });

const totalNotasCreditoCents = (ncs ?? []).reduce(
        (s, r) => s + Math.round((Number(r.monto) || 0) * 100), 0
      );
        const totalNotasCredito = totalNotasCreditoCents / 100;

        const totalFacturado = totalFacturadoCents / 100;
        const totalNetoFacturadoCents = Math.max(0, totalFacturadoCents - totalNotasCreditoCents);
        const totalNetoFacturado = totalNetoFacturadoCents / 100;
        const totalCobradoFinalCents = Math.min(totalCobradoCents, totalNetoFacturadoCents);
        const totalCobrado = totalCobradoFinalCents / 100;
        const totalPendiente = Math.max(0, totalNetoFacturadoCents - totalCobradoFinalCents) / 100;

    return {
      totalFacturado,
      totalCobrado,
      totalNetoFacturado,
      totalPendiente,
      pendientes,
      vencidas,
      totalNotasCredito,
      error: null,
    };



  } catch (e) {
    return { totalFacturado: 0, totalCobrado: 0, totalNetoFacturado: 0, totalPendiente: 0, pendientes: 0, vencidas: 0, totalNotasCredito: 0, error: String(e) };
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

    const abonos = (os.abonos as any[] | null) || [];
    const nuevosAbonos = [...abonos, { ...pago, id: Date.now().toString() }];
    
    // Calcular si ya se pagó todo
    const totalPagado = nuevosAbonos.reduce((s, a) => s + (Number(a.monto) || 0), 0);
    
    // Obtener monto total (manual o cotización)
    let montoTotal = os.monto_factura || 0;
    if (montoTotal === 0 && os.cotizacion_id) {
      const { data: cot } = await supabaseAdmin.from('cotizaciones').select('total_mxn').eq('id', os.cotizacion_id).single();
      montoTotal = cot?.total_mxn || 0;
    }

    let nuevoEstado: EstadoFacturacion = 'pago_parcial';
    if (totalPagado >= montoTotal && montoTotal > 0) {
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
