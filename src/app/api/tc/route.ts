import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SERIE = 'SF43718'; // Tipo de cambio FIX USD/MXN (DOF)
const BANXICO_URL = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/${SERIE}/datos`;

export async function GET() {
    const BANXICO_TOKEN = process.env.BANXICO_TOKEN;

    if (!BANXICO_TOKEN) {
        console.error('BANXICO_TOKEN no está definido');
        return NextResponse.json({
            rate: 20.50,
            source: 'Fallback (sin token)',
            fecha: new Date().toLocaleDateString('es-MX'),
        });
    }

    try {
        // Fetch últimos 7 días para asegurar encontrar el FIX anterior (útil en fines de semana/puentes)
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
            throw new Error(`Banxico respondió con status ${res.status}`);
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

        // La regla del DOF: La tasa publicada HOY en el DOF es el FIX determinado el día hábil anterior.
        // Por lo tanto, buscamos el dato más reciente cuya fecha sea MENOR a hoy.
        // Si Banxico ya publicó el FIX de hoy (después de las 12pm), ese dato NO es el del DOF de hoy.

        // Invertimos para empezar por el más reciente
        const sortedDatos = [...datos].sort((a, b) => {
            const [da, ma, ya] = a.fecha.split('/');
            const [db, mb, yb] = b.fecha.split('/');
            const timeA = new Date(parseInt(ya), parseInt(ma) - 1, parseInt(da)).getTime();
            const timeB = new Date(parseInt(yb), parseInt(mb) - 1, parseInt(db)).getTime();
            return timeB - timeA; // Descendente (más reciente primero)
        });

        // Buscamos el primero que sea estrictamente anterior a hoy (Fórmulas DOF)
        let datoOficial = sortedDatos.find(d => {
            const [dD, dM, dY] = d.fecha.split('/');
            const [tD, tM, tY] = nowMx.split('/');
            const dateD = new Date(parseInt(dY), parseInt(dM) - 1, parseInt(dD));
            const dateT = new Date(parseInt(tY), parseInt(tM) - 1, parseInt(tD));
            return dateD < dateT;
        });

        // Si no hay ninguno anterior (caso raro), usamos el más reciente disponible
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
        console.error('Banxico Fetch Error:', error);

        return NextResponse.json({
            rate: 20.50,
            tipoCambio: 20.50,
            source: 'Fallback (error de conexión)',
            fecha: new Date().toLocaleDateString('es-MX'),
            error: (error as Error).message,
        });
    }
}
