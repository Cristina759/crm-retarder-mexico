import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SERIE = 'SF43718'; // Tipo de cambio FIX USD/MXN (DOF)
const BANXICO_URL = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/${SERIE}/datos/oportuno`;

export async function GET() {
    const BANXICO_TOKEN = process.env.BANXICO_TOKEN;

    if (!BANXICO_TOKEN) {
        console.error('BANXICO_TOKEN no está definido en .env.local');
        return NextResponse.json({
            rate: 20.50,
            source: 'Fallback (sin token)',
            fecha: new Date().toLocaleDateString('es-MX'),
        });
    }

    try {
        const res = await fetch(BANXICO_URL, {
            headers: {
                'Bmx-Token': BANXICO_TOKEN,
                'Accept': 'application/json',
            },
            next: { revalidate: 3600 }, // Cache por 1 hora
        });

        if (!res.ok) {
            throw new Error(`Banxico respondió con status ${res.status}`);
        }

        const data = await res.json();
        const dato = data?.bmx?.series?.[0]?.datos?.[0];

        if (!dato) {
            throw new Error('No se pudo leer el dato de Banxico');
        }

        const valor = parseFloat(dato.dato);
        if (isNaN(valor)) {
            throw new Error(`Valor inválido de Banxico: ${dato.dato}`);
        }

        return NextResponse.json({
            rate: valor,
            tipoCambio: valor,
            source: 'Banxico / DOF Oficial',
            fecha: dato.fecha,
        });
    } catch (error) {
        console.error('Banxico Fetch Error:', error);

        // Fallback con valor conservador
        return NextResponse.json({
            rate: 20.50,
            tipoCambio: 20.50,
            source: 'Fallback (error de conexión)',
            fecha: new Date().toLocaleDateString('es-MX'),
            error: (error as Error).message,
        });
    }
}
