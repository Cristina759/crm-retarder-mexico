import { NextResponse } from 'next/server';
import { limpiarPipelinesDelMes } from '@/app/actions/mantenimiento';

export async function GET(request: Request) {
  // Vercel envía Authorization: Bearer $CRON_SECRET en las invocaciones de cron
  // cuando CRON_SECRET está configurado en las variables de entorno del proyecto.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
  }

  const resultado = await limpiarPipelinesDelMes();
  return NextResponse.json(resultado);
}
