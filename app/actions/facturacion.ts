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
  empresa_nombre: string | null;
  total_pagado?: number;
  saldo_pendiente?: number;
}

// ── obtenerFacturas ───────────────────────────────────────────────────────────
export async function obtenerFacturas(): Promise<{ data: FacturaRow[]; error: string | null }> {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from('ordenes_servicio')
      .select('id, numero, numero_os_manual, numero_factura, monto_factura, concepto_factura, fecha_vencimiento, estado_facturacion, created_at, empresa_id, cotizacion_id, abonos')
      .in('estado', ['facturado', 'pagado'])
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) return { data: [], error: error.message };

    const empresaIds = Array.from(new Set((rows ?? []).map(r => r.empresa_id).filter(Boolean)));
    const { data: empresas } = await supabaseAdmin.from('empresas').select('id, nombre_comercial').in('id', empresaIds);
    const empresaMap = new Map((empresas ?? []).map(e => [e.id, e.nombre_comercial]));

    // Cargar totales y folios de cotizaciones vinculadas para los que no tienen monto o concepto
    const cotIds = Array.from(new Set((rows ?? []).map(r => r.cotizacion_id).filter(Boolean)));
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
      const cot = cotMap.get(r.cotizacion_id || '');
      let finalMonto = Number(r.monto_factura) || 0;
      if (finalMonto === 0 && cot) finalMonto = Number(cot.total_mxn) || 0;

      // RESTAR NOTAS DE CRÉDITO ESPECÍFICAS
      const montoNC = ncMap.get(r.id) || 0;
      finalMonto = Math.max(0, finalMonto - Math.abs(montoNC));

      // Abonos y Saldo
      const abonos = Array.isArray(r.abonos) ? r.abonos : [];
      let total_pagado = abonos.reduce((s, a) => s + (Number(a?.monto) || 0), 0);
      
      // Si está pagada pero no tiene abonos (factura vieja), asumimos cobro total
      if (r.estado_facturacion === 'pagada' && total_pagado === 0) {
        total_pagado = finalMonto;
      }
      
      const saldo_pendiente = Math.max(0, finalMonto - total_pagado);

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
        estado_facturacion: (r.estado_facturacion as EstadoFacturacion) || null,
        created_at: r.created_at,
        empresa_nombre: empresaMap.get(r.empresa_id) || 'Empresa Desconocida',
        total_pagado,
        saldo_pendiente,
        abonos
      };
    });


    return { data: enriched, error: null };


  } catch (e) { return { data: [], error: String(e) }; }
}

// ── resumenFacturacion (CONCORDANTE CON SQL) ──────────────────────────────────
export async function obtenerResumenFacturacion(): Promise<{
  totalFacturado: number; totalCobrado: number; pendientes: number;
  vencidas: number; totalNotasCredito: number; error: string | null;
}> {
  try {
    // Usamos el mismo filtro que obtenerFacturas para asegurar consistencia total
    const [{ data: facts, error: errFacts }, { data: ncs, error: errNcs }] = await Promise.all([
      supabaseAdmin
        .from('ordenes_servicio')
        .select('monto_factura, estado_facturacion, cotizacion_id, abonos')
        .or('monto_factura.gt.0,numero_factura.neq.null,estado_facturacion.in.(facturada,pagada,pago_parcial,vencida)'),

      supabaseAdmin.from('notas_credito').select('monto'),
    ]);

    if (errFacts || errNcs) {
      return { totalFacturado: 0, totalCobrado: 0, pendientes: 0, vencidas: 0, totalNotasCredito: 0, error: errFacts?.message || errNcs?.message || 'Error de BD' };
    }

    // Cargar totales de cotizaciones vinculadas (fallback)
    const cotIds = Array.from(new Set((facts ?? []).map(r => r.cotizacion_id).filter(Boolean)));
    const { data: cots } = cotIds.length 
      ? await supabaseAdmin.from('cotizaciones').select('id, total_mxn').in('id', cotIds)
      : { data: [] };
    const cotMap = new Map((cots ?? []).map(c => [c.id, Number(c.total_mxn) || 0]));

    let totalFacturado = 0;
    let totalCobrado = 0;
    let pendientes = 0;
    let vencidas = 0;

    (facts ?? []).forEach(r => {
      let monto = Number(r.monto_factura) || 0;
      if (monto === 0 && r.cotizacion_id) {
        monto = cotMap.get(r.cotizacion_id) || 0;
      }

      totalFacturado += monto;

      // EL COBRADO es la suma de todos los abonos individuales
      const abonos = Array.isArray(r.abonos) ? r.abonos : [];
      const totalAbonado = abonos.reduce((s, a) => s + (Number(a?.monto) || 0), 0);
      
      if (r.estado_facturacion === 'pagada' && totalAbonado === 0) {
        totalCobrado += monto;
      } else {
        totalCobrado += totalAbonado;
      }
      
      const st = r.estado_facturacion ?? '';
      if (['pendiente', 'facturada', 'enviada_cliente', 'pago_parcial'].includes(st)) pendientes++;
      if (st === 'vencida') vencidas++;
    });

    const totalNotasCredito = (ncs ?? []).reduce((s, r) => s + (Number(r.monto) || 0), 0);

    return { totalFacturado, totalCobrado, pendientes, vencidas, totalNotasCredito, error: null };



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

    const abonos = (os.abonos as any[]) || [];
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
    }).eq('id', id);

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
