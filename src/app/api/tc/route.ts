import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SERIE = 'SF43718'; // Tipo de cambio FIX USD/MXN (DOF)
const BANXICO_URL = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/${SERIE}/datos`;

export async function GET() {
    const BANXICO_TOKEN = process.env.BANXICO_TOKEN;

    if (!BANXICO_TOKEN) {
        return NextResponse.json({
            rate: 20.50,
            source: 'Fallback (sin token)',
            fecha: new Date().toLocaleDateString('es-MX'),
        });
    }

    try {
        // Fetch Ãºltimos 7 dÃ­as para asegurar encontrar el FIX anterior (Ãºtil en fines de semana/puentes)
        const today = new Date();
        const past = new Date(today);
        past.setDate(today.getDate() - 7);

        const formatDate = (d: Date) => d.toISOString().split('T')[0];
        const rangeUrl = `${BANXICO_URL}/${formatDate(past)}/${formatDate(today)}`;

        const res = await fetch(rangeUrl, {
            headers: {
                'Bmx-Token': BANXICO_TOKEN,
                'Accept': 'application/json',
            },
            next: { revalidate: 60 }, // Cache por 1 minuto para ser responsivo
        });

        if (!res.ok) {
            throw new Error(`Banxico respondiÃ³ con status ${res.status}`);
        }

        const data = await res.json();
        const datos = data?.bmx?.series?.[0]?.datos || [];

        if (datos.length === 0) {
            throw new Error('No se recibieron datos de Banxico');
        }

        // Obtener fecha de hoy en formato DD/MM/YYYY para comparar con Banxico
        const nowMx = new Date().toLocaleDateString('es-MX', {
            timeZone: 'America/Mexico_City',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // La regla del DOF: La tasa publicada HOY en el DOF es el FIX determinado el dÃ­a hÃ¡bil anterior.
        // Por lo tanto, buscamos el dato mÃ¡s reciente cuya fecha sea MENOR a hoy.
        // Si Banxico ya publicÃ³ el FIX de hoy (despuÃ©s de las 12pm), ese dato NO es el del DOF de hoy.

        // Invertimos para empezar por el mÃ¡s reciente
        const sortedDatos = [...datos].sort((a, b) => {
            const [da, ma, ya] = a.fecha.split('/');
            const [db, mb, yb] = b.fecha.split('/');
            const timeA = new Date(parseInt(ya), parseInt(ma) - 1, parseInt(da)).getTime();
            const timeB = new Date(parseInt(yb), parseInt(mb) - 1, parseInt(db)).getTime();
            return timeB - timeA; // Descendente (mÃ¡s reciente primero)
        });

        // Buscamos el primero que sea estrictamente anterior a hoy (FÃ³rmulas DOF)
        let datoOficial = sortedDatos.find(d => {
            const [dD, dM, dY] = d.fecha.split('/');
            const [tD, tM, tY] = nowMx.split('/');
            const dateD = new Date(parseInt(dY), parseInt(dM) - 1, parseInt(dD));
            const dateT = new Date(parseInt(tY), parseInt(tM) - 1, parseInt(tD));
            return dateD < dateT;
        });

        // Si no hay ninguno anterior (caso raro), usamos el mÃ¡s reciente disponible
        if (!datoOficial) {
            datoOficial = sortedDatos[0];
        }

        const valor = parseFloat(datoOficial.dato);

        return NextResponse.json({
            rate: valor,
            tipoCambio: valor,
            source: 'Banxico / DOF Oficial',
            fecha: nowMx, // Retornamos HOY como la fecha de validez DOF
            debug_determination_date: datoOficial.fecha,
            debug_today: nowMx
        });
    } catch (error) {

        return NextResponse.json({
            rate: 20.50,
            tipoCambio: 20.50,
            source: 'Fallback (error de conexiÃ³n)',
            fecha: new Date().toLocaleDateString('es-MX'),
            error: (error as Error).message,
        });
    }
}
