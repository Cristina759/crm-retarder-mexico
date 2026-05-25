'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { obtenerResumenFacturacion } from './facturacion';

// ── General ───────────────────────────────────────────────────────────────────
// totalFacturado / totalCobrado / totalPendiente vienen SIEMPRE de
// obtenerResumenFacturacion — fuente única de verdad financiera.
export async function obtenerResumenGeneral() {
  try {
    const [
      { data: osAll },
      { data: oportunidades },
      { count: empresas },
      resumenFact,
      { data: facturasPorCliente },
    ] = await Promise.all([
      supabaseAdmin.from('ordenes_servicio').select('id, archivada'),
      supabaseAdmin.from('oportunidades').select('monto_estimado, estado').neq('estado', 'perdido'),
      supabaseAdmin.from('empresas').select('id', { count: 'exact', head: true }),
      // ← ÚNICA FUENTE DE VERDAD para totales financieros
      obtenerResumenFacturacion(),
      // Solo para armar pendientesPorCliente (desglose por empresa)
      supabaseAdmin.from('ordenes_servicio')
        .select('monto_factura, estado_facturacion, numero_factura, empresa_id, empresas(nombre_comercial), cotizacion_id, abonos')
        .or('estado_facturacion.in.(facturada,pagada,pago_parcial,vencida),monto_factura.gt.0,numero_factura.neq.null'),
    ]);

    const osActivas = (osAll ?? []).filter((r: { archivada?: boolean | null }) => r.archivada !== true).length;
    const piplineValor = Math.round((oportunidades ?? []).reduce((s, r) => s + Math.round((r.monto_estimado ?? 0) * 100), 0)) / 100;

    // Pendientes por cliente — usa la misma lógica de cast que obtenerResumenFacturacion
    const cotIds = Array.from(new Set((facturasPorCliente ?? []).map(r => r.cotizacion_id).filter((x): x is string => !!x)));
    const { data: cots } = cotIds.length
      ? await supabaseAdmin.from('cotizaciones').select('id, total_mxn').in('id', cotIds)
      : { data: [] };
    const cotMap = new Map((cots ?? []).map(c => [c.id, Number(c.total_mxn) || 0]));

    const clienteMap: Record<string, { cliente: string; total: number; folios: string[] }> = {};
    (facturasPorCliente ?? [])
      .filter(r => r.estado_facturacion !== 'cancelada' && r.estado_facturacion !== 'pagada')
      .forEach(r => {
        let monto = Number(r.monto_factura) || 0;
        if (monto === 0 && r.cotizacion_id) monto = cotMap.get(r.cotizacion_id) || 0;
        const montoCents = Math.round(monto * 100);
        if (montoCents <= 0) return;

        const abonos = Array.isArray(r.abonos) ? (r.abonos as any[]) : [];
        const totalAbonado = abonos.reduce((s: number, a: any) => s + (Number(a?.monto) || 0), 0);
        const abonadoCents = Math.round(totalAbonado * 100);
        const saldoCents = Math.max(0, montoCents - abonadoCents);

        const nombre = (r.empresas as any)?.nombre_comercial ?? 'Desconocido';
        if (!clienteMap[nombre]) clienteMap[nombre] = { cliente: nombre, total: 0, folios: [] };
        clienteMap[nombre].total += saldoCents / 100;
        if (r.numero_factura) clienteMap[nombre].folios.push(r.numero_factura);
      });

    // Totales financieros: directamente de la fuente única — sin recálculo
    const { totalFacturado, totalCobrado, totalNetoFacturado, totalPendiente } = resumenFact;

    return {
      osActivas,
      totalFacturado,
      totalCobrado,
      totalNetoFacturado,
      totalNetoPagado:       totalCobrado,
      totalPendiente,
      piplineValor,
      empresas:              empresas ?? 0,
      pendientesPorCliente:  Object.values(clienteMap).sort((a, b) => b.total - a.total),
      error: null,
    };

  } catch (e) {
    console.error('Error Dashboard:', e);
    return { osActivas: 0, totalFacturado: 0, totalCobrado: 0, totalNetoFacturado: 0, totalNetoPagado: 0, totalPendiente: 0, piplineValor: 0, empresas: 0, pendientesPorCliente: [], error: String(e) };
  }
}


// ── OS por estado (pipeline donut) ────────────────────────────────────────────
export async function obtenerOSporEstado() {
  try {
    const { data } = await supabaseAdmin
      .from('ordenes_servicio')
      .select('estado, archivada');
    const counts: Record<string, number> = {};
    (data ?? [])
      .filter((r: { archivada?: boolean | null }) => r.archivada !== true)
      .forEach(r => { counts[r.estado] = (counts[r.estado] ?? 0) + 1; });
    return Object.entries(counts).map(([estado, count]) => ({ estado, count }));
  } catch { return []; }
}

// ── Ventas ────────────────────────────────────────────────────────────────────
export async function obtenerResumenVentas() {
  try {
    const [{ data: facturas }, { data: oportunidades }] = await Promise.all([
      supabaseAdmin.from('ordenes_servicio').select('monto_factura, estado_facturacion, created_at').in('estado', ['facturado', 'pagado']),
      supabaseAdmin.from('oportunidades').select('monto_estimado, estado, created_at, probabilidad'),
    ]);

    // Total facturado real desde ordenes_servicio
    const total          = (facturas ?? []).reduce((s, r) => s + (r.monto_factura ?? 0), 0);
    const cobradas       = (facturas ?? []).filter(r => r.estado_facturacion === 'pagada');
    const tasaCierre     = (facturas ?? []).length > 0 ? Math.round((cobradas.length / (facturas ?? []).length) * 100) : 0;
    const ticketPromedio = cobradas.length > 0 ? cobradas.reduce((s, r) => s + (r.monto_factura ?? 0), 0) / cobradas.length : 0;

    // Ganadas vs perdidas (oportunidades)
    const ganadas  = (oportunidades ?? []).filter(o => o.estado === 'ganado' || o.estado === 'ganada');
    const perdidas = (oportunidades ?? []).filter(o => o.estado === 'perdido' || o.estado === 'perdida');

    const porEstado = [
      { estado: 'Lead',          count: (oportunidades ?? []).filter(o => o.estado === 'lead').length },
      { estado: 'Calificación',  count: (oportunidades ?? []).filter(o => o.estado === 'calificacion').length },
      { estado: 'Cotización',    count: (oportunidades ?? []).filter(o => ['cotizacion_enviada', 'cotizado'].includes(o.estado ?? '')).length },
      { estado: 'Seguimiento',   count: (oportunidades ?? []).filter(o => o.estado === 'seguimiento_activo').length },
      { estado: 'Negociación',   count: (oportunidades ?? []).filter(o => o.estado === 'negociacion_cierre' || o.estado === 'negociacion').length },
      { estado: 'Ganada',        count: ganadas.length },
    ];

    // Ventas por mes (últimos 6 meses) desde ordenes_servicio
    const now   = new Date();
    const meses = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { mes: d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }), year: d.getFullYear(), month: d.getMonth(), monto: 0, cotizaciones: 0 };
    });
    (facturas ?? []).forEach(r => {
      if (!r.created_at) return;
      const d = new Date(r.created_at);
      const m = meses.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
      if (m) { m.monto += r.monto_factura ?? 0; m.cotizaciones++; }
    });

    return { total, tasaCierre, ticketPromedio, porEstado, meses, ganadas: ganadas.length, perdidas: perdidas.length, error: null };
  } catch (e) { return { total: 0, tasaCierre: 0, ticketPromedio: 0, porEstado: [], meses: [], ganadas: 0, perdidas: 0, error: String(e) }; }
}

// ── Marketing ─────────────────────────────────────────────────────────────────
export async function obtenerResumenMarketing() {
  // Tabla campanas_marketing se creará después — devuelve vacío por ahora
  return {
    campanasActivas: 0,
    leadsGenerados: 0,
    costoPorLead: 0,
    conversionRate: 0,
    porCanal: [] as { canal: string; leads: number; costo: number }[],
    tendencia: [] as { mes: string; leads: number; conversiones: number }[],
    error: null,
  };
}
