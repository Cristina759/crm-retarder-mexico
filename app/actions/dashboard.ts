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
      supabaseAdmin.from('ordenes_servicio').select('*').in('estado', ['facturado', 'pagado']),
      supabaseAdmin.from('oportunidades').select('monto_estimado, estado').neq('estado', 'perdido'),
      supabaseAdmin.from('empresas').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('notas_credito').select('monto'),
    ]);
    const osActivas = (osAll ?? []).filter((r: { archivada?: boolean | null }) => r.archivada !== true).length;

    const totalFacturado   = (facturas ?? []).reduce((s, r) => s + (r.monto_factura ?? 0), 0);
    const totalCobrado     = (facturas ?? []).filter(r => r.estado_facturacion === 'pagada').reduce((s, r) => s + (r.monto_factura ?? 0), 0);
    const totalNotasCredito = (notas ?? []).reduce((s, r) => s + (r.monto ?? 0), 0);
    const piplineValor     = (oportunidades ?? []).reduce((s, r) => s + (r.monto_estimado ?? 0), 0);

    return {
      osActivas,
      totalFacturado,
      totalCobrado,
      totalNetoCobrado: totalCobrado - totalNotasCredito,
      piplineValor,
      empresas:        empresas ?? 0,
      error: null,
    };
  } catch (e) { return { osActivas: 0, totalFacturado: 0, totalCobrado: 0, totalNetoCobrado: 0, piplineValor: 0, empresas: 0, error: String(e) }; }
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
    const [{ data: cotizaciones }, { data: oportunidades }] = await Promise.all([
      supabaseAdmin.from('cotizaciones').select('total_mxn, estado, created_at'),
      supabaseAdmin.from('oportunidades').select('monto_estimado, estado, created_at, probabilidad'),
    ]);

    const total          = (cotizaciones ?? []).reduce((s, c) => s + (c.total_mxn ?? 0), 0);
    const aceptadas      = (cotizaciones ?? []).filter(c => c.estado === 'aceptada');
    const enviadas       = (cotizaciones ?? []).filter(c => ['enviada', 'aceptada'].includes(c.estado ?? ''));
    const tasaCierre     = enviadas.length > 0 ? Math.round((aceptadas.length / enviadas.length) * 100) : 0;
    const ticketPromedio = aceptadas.length > 0 ? aceptadas.reduce((s, c) => s + (c.total_mxn ?? 0), 0) / aceptadas.length : 0;

    // Ganadas vs perdidas
    const ganadas  = (oportunidades ?? []).filter(o => o.estado === 'ganado' || o.estado === 'ganada');
    const perdidas = (oportunidades ?? []).filter(o => o.estado === 'perdido' || o.estado === 'perdida');

    // Por estado de oportunidad
    const porEstado = [
      { estado: 'Lead',          count: (oportunidades ?? []).filter(o => o.estado === 'lead').length },
      { estado: 'Calificación',  count: (oportunidades ?? []).filter(o => o.estado === 'calificacion').length },
      { estado: 'Cotización',    count: (oportunidades ?? []).filter(o => ['cotizacion_enviada', 'cotizado'].includes(o.estado ?? '')).length },
      { estado: 'Seguimiento',   count: (oportunidades ?? []).filter(o => o.estado === 'seguimiento_activo').length },
      { estado: 'Negociación',   count: (oportunidades ?? []).filter(o => o.estado === 'negociacion_cierre' || o.estado === 'negociacion').length },
      { estado: 'Ganada',        count: ganadas.length },
    ];

    // Ventas por mes (últimos 6 meses)
    const now   = new Date();
    const meses = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { mes: d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }), year: d.getFullYear(), month: d.getMonth(), monto: 0, cotizaciones: 0 };
    });
    (aceptadas ?? []).forEach(c => {
      if (!c.created_at) return;
      const d = new Date(c.created_at);
      const m = meses.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
      if (m) { m.monto += c.total_mxn ?? 0; m.cotizaciones++; }
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
