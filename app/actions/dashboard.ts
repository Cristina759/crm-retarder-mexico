'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

// ── General ───────────────────────────────────────────────────────────────────
export async function obtenerResumenGeneral() {
  try {
    const [
      { data: osAll },
      { data: facturas },
      { data: oportunidades },
      { count: empresas },
      { data: notas },
    ] = await Promise.all([
      supabaseAdmin.from('ordenes_servicio').select('id, archivada'),
      // Traemos todas las que tengan algún dato financiero
      supabaseAdmin.from('ordenes_servicio')
        .select('id, monto_factura, estado_facturacion, numero_factura, empresa_id, empresas(nombre_comercial), cotizacion_id, abonos')
        .or('estado_facturacion.in.(facturada,pagada,pago_parcial,vencida),monto_factura.gt.0,numero_factura.neq.null'),


      supabaseAdmin.from('oportunidades').select('monto_estimado, estado').neq('estado', 'perdido'),
      supabaseAdmin.from('empresas').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('notas_credito').select('monto, os_id'),
    ]);

    // Cargar totales de cotizaciones vinculadas para el fallback del dashboard
    const cotIds = Array.from(new Set(((facturas as any[]) ?? []).map(r => r.cotizacion_id).filter(Boolean)));
    const { data: cots } = cotIds.length 
      ? await supabaseAdmin.from('cotizaciones').select('id, total_mxn').in('id', cotIds)
      : { data: [] };
    const cotMap = new Map((cots ?? []).map(c => [c.id, c.total_mxn]));

    const osActivas = (osAll ?? []).filter((r: { archivada?: boolean | null }) => r.archivada !== true).length;

    let totalFacturadoBruto = 0;
    let totalFacturadoNeto = 0;
    let totalCobradoNeto = 0;
    const clienteMap: Record<string, { cliente: string; total: number; folios: string[] }> = {};

    // Agrupar NCs por OS para descuentos precisos
    const ncMap = new Map<string, number>();
    (notas ?? []).forEach(nc => {
      if ((nc as any).os_id) ncMap.set((nc as any).os_id, (ncMap.get((nc as any).os_id) || 0) + (Number(nc.monto) || 0));
    });

    ((facturas as any[]) ?? []).forEach(r => {
      let bruto = r.monto_factura;
      // Fallback a cotización si no hay monto manual
      if ((!bruto || bruto === 0) && r.cotizacion_id) {
        bruto = cotMap.get(r.cotizacion_id) || 0;
      }
      bruto = bruto || 0;

      const ncMonto = ncMap.get(r.id) || 0;
      const montoNeto = bruto - ncMonto;

      totalFacturadoBruto += bruto;
      totalFacturadoNeto  += montoNeto;

       // EL COBRADO es la suma de todos los abonos individuales
       const abonos = (r.abonos as { monto?: number }[]) || [];
       const totalAbonado = abonos.reduce((s, a) => s + (Number(a.monto) || 0), 0);
       
       if (r.estado_facturacion === 'pagada' && totalAbonado === 0) {
         totalCobradoNeto += montoNeto;
       } else {
         totalCobradoNeto += totalAbonado;
       }
 
       // Pendientes por cliente (lo que no está pagado)
       if (r.estado_facturacion !== 'pagada' && montoNeto > 0) {
         const nombre = (r.empresas as { nombre_comercial?: string })?.nombre_comercial ?? 'Desconocido';
         if (!clienteMap[nombre]) clienteMap[nombre] = { cliente: nombre, total: 0, folios: [] };
         
         const saldo = Math.max(0, montoNeto - totalAbonado);
         clienteMap[nombre].total += saldo;
         if (r.numero_factura) clienteMap[nombre].folios.push(r.numero_factura);
       }
     });




    const totalNotasCredito = (notas ?? []).reduce((s, r) => s + (r.monto ?? 0), 0);
    const piplineValor      = (oportunidades ?? []).reduce((s, r) => s + (r.monto_estimado ?? 0), 0);
    const pendientesPorCliente = Object.values(clienteMap).sort((a, b) => b.total - a.total);

    const totalNotasCredito = (notas ?? []).reduce((s, r) => s + (r.monto ?? 0), 0);

    return {
      osActivas,
      totalFacturado:      totalFacturadoBruto,
      totalNotasCredito,
      totalNetoFacturado:  totalFacturadoNeto,
      totalNetoPagado:     totalCobradoNeto,
      totalPendiente:      totalFacturadoNeto - totalCobradoNeto,
      piplineValor,
      empresas:            empresas ?? 0,
      pendientesPorCliente,
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
    const [{ data: facturas }, { data: oportunidades }, { data: notas }] = await Promise.all([
      supabaseAdmin.from('ordenes_servicio').select('monto_factura, estado_facturacion, created_at').in('estado', ['facturado', 'pagado', 'facturada', 'pagada']),
      supabaseAdmin.from('oportunidades').select('monto_estimado, estado, created_at, probabilidad'),
      supabaseAdmin.from('notas_credito').select('monto'),
    ]);

    const totalNCs = (notas ?? []).reduce((s, r) => s + (Number(r.monto) || 0), 0);

    // Total facturado real neto desde ordenes_servicio
    const totalBruto      = ((facturas as any[]) ?? []).reduce((s, r) => s + (Number(r.monto_factura) || 0), 0);
    const total           = totalBruto - totalNCs;
    const cobradas       = ((facturas as any[]) ?? []).filter(r => r.estado_facturacion === 'pagada');
    const tasaCierre     = ((facturas as any[]) ?? []).length > 0 ? Math.round((cobradas.length / ((facturas as any[]) ?? []).length) * 100) : 0;
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
    ((facturas as any[]) ?? []).forEach(r => {
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
