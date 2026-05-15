'use server';

export async function obtenerTipoCambio(): Promise<{ tipoCambio: number; fecha: string; fuente: string }> {
  try {
    // Reutilizamos la lógica del scraper (pero en el servidor es más directo)
    const res = await fetch('https://crm-retarder-v2.vercel.app/api/tipo-cambio-dof', { cache: 'no-store' });
    const data = await res.json();
    if (data.tipoCambio) return data;
  } catch (e) {
    console.error('[obtenerTipoCambio] error:', e);
  }
  
  // Fallback robusto (actualizar periódicamente si el API falla)
  return { tipoCambio: 17.2400, fecha: 'Estimado', fuente: 'CRM Fallback' };
}
