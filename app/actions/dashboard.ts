'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { obtenerTipoCambio } from './ajustes';

// ── Utilidad: conversión segura a centavos (integer) ─────────────────────────
// REGLA CONTABLE: nunca usar float para dinero. Toda aritmética en centavos.
function toCents(v: any): number {
  if (v === null || v === undefined) return 0;
  const s = String(v);
  const neg = s.startsWith('-');
  const abs = neg ? s.slice(1) : s;
  const parts = abs.split('.');
  const intPart = parseInt(parts[0] || '0', 10) || 0;
  const decStr = (parts[1] || '00').padEnd(2, '0').slice(0, 2);
  const decPart = parseInt(decStr, 10) || 0;
  const cents = intPart * 100 + decPart;
  return neg ? -cents : cents;
}
function fromCents(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

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
      // SINCRONIZADO: mismo filtro que facturacion.ts para que los totales cuadren
      supabaseAdmin.from('ordenes_servicio')
        .select('id, monto_factura, estado_facturacion, numero_factura, empresa_id, empresas(nombre_comercial), cotizacion_id, abonos')
        .in('estado', ['facturado', 'pagado', 'facturada', 'pagada']),


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

    // ARITMÉTICA EN CENTAVOS
    let totalFacturadoBrutoCents = 0;
    let totalFacturadoNetoCents = 0;
    let totalCobradoNetoCents = 0;
    const clienteMap: Record<string, { cliente: string; totalCents: number; folios: string[] }> = {};

    // Agrupar NCs por OS para descuentos precisos — EN CENTAVOS
    const ncMapCents = new Map<string, number>();
    (notas ?? []).forEach(nc => {
      if ((nc as any).os_id) ncMapCents.set((nc as any).os_id, (ncMapCents.get((nc as any).os_id) || 0) + toCents(nc.monto));
    });

    ((facturas as any[]) ?? []).forEach(r => {
      let brutoCents = toCents(r.monto_factura);
      // Fallback a cotización si no hay monto manual
      if (brutoCents === 0 && r.cotizacion_id) {
        brutoCents = toCents(cotMap.get(r.cotizacion_id));
      }

      const ncCents = ncMapCents.get(r.id) || 0;
      const netoCents = brutoCents - ncCents;

      totalFacturadoBrutoCents += brutoCents;
      totalFacturadoNetoCents  += netoCents;

       // EL COBRADO es la suma de todos los abonos individuales — en centavos
       const abonos = (r.abonos as { monto?: number }[]) || [];
       const totalAbonadoCents = abonos.reduce((s: number, a: any) => s + toCents(a.monto), 0);
       
       // El cobrado real es lo abonado, pero si está marcada como pagada y no hay abonos, usamos el neto
       let cobradoCents = (r.estado_facturacion === 'pagada' && totalAbonadoCents === 0) ? netoCents : totalAbonadoCents;
       cobradoCents = Math.min(cobradoCents, Math.max(0, netoCents));
       totalCobradoNetoCents += cobradoCents;

 
       // Pendientes por cliente (lo que no está pagado)
       if (r.estado_facturacion !== 'pagada' && netoCents > 0) {
         const nombre = (r.empresas as { nombre_comercial?: string })?.nombre_comercial ?? 'Desconocido';
         if (!clienteMap[nombre]) clienteMap[nombre] = { cliente: nombre, totalCents: 0, folios: [] };
         
         const saldoCents = Math.max(0, netoCents - totalAbonadoCents);
         clienteMap[nombre].totalCents += saldoCents;
         if (r.numero_factura) clienteMap[nombre].folios.push(r.numero_factura);
       }
     });


 

    const totalNotasCreditoCents = (notas ?? []).reduce((s: number, r: any) => s + toCents(r.monto), 0);
    const piplineValor      = (oportunidades ?? []).reduce((s, r) => s + (r.monto_estimado ?? 0), 0);
    const pendientesPorCliente = Object.values(clienteMap)
      .map(c => ({ cliente: c.cliente, total: fromCents(c.totalCents), folios: c.folios }))
      .sort((a, b) => b.total - a.total);


    // El total pendiente es la suma de los saldos de los clientes
    const totalPendienteCalculadoCents = Object.values(clienteMap).reduce((s, c) => s + c.totalCents, 0);

    const { tipoCambio } = await obtenerTipoCambio();

    return {
      osActivas,
      totalFacturado:      fromCents(totalFacturadoBrutoCents),
      totalNotasCredito:   fromCents(totalNotasCreditoCents),
      totalNetoFacturado:  fromCents(totalFacturadoNetoCents),
      totalNetoPagado:     fromCents(totalFacturadoNetoCents - totalPendienteCalculadoCents),
      totalPendiente:      fromCents(totalPendienteCalculadoCents),
      piplineValor,
      empresas:            empresas ?? 0,
      pendientesPorCliente,
      tc:                  tipoCambio,
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

    const totalNCsCents = (notas ?? []).reduce((s: number, r: any) => s + toCents(r.monto), 0);

    // Total facturado real neto desde ordenes_servicio — EN CENTAVOS
    const totalBrutoCents = ((facturas as any[]) ?? []).reduce((s: number, r: any) => s + toCents(r.monto_factura), 0);
    const totalCents      = totalBrutoCents - totalNCsCents;
    const cobradas       = ((facturas as any[]) ?? []).filter(r => r.estado_facturacion === 'pagada');
    const tasaCierre     = ((facturas as any[]) ?? []).length > 0 ? Math.round((cobradas.length / ((facturas as any[]) ?? []).length) * 100) : 0;
    const ticketPromedioCents = cobradas.length > 0 ? Math.round(cobradas.reduce((s: number, r: any) => s + toCents(r.monto_factura), 0) / cobradas.length) : 0;

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

    return { total: fromCents(totalCents), tasaCierre, ticketPromedio: fromCents(ticketPromedioCents), porEstado, meses, ganadas: ganadas.length, perdidas: perdidas.length, error: null };
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
