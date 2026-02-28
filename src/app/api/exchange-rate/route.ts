import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    // 1. Try Banxico (DOF Official) - Most accurate for obligations
    const BANXICO_TOKEN = 'c42c3c2819e3e3af8e5b2978a2ff7d36a580b3d75b3d8e7f89b55b6e1e17f76e';
    const BANXICO_URL = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno?token=${BANXICO_TOKEN}`;

    try {
        const res = await fetch(BANXICO_URL, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 }
        });

        if (res.ok) {
            const data = await res.json();
            const valor = data?.bmx?.series?.[0]?.datos?.[0]?.dato;
            if (valor && !isNaN(parseFloat(valor))) {
                return NextResponse.json({
                    rate: parseFloat(valor),
                    source: 'Banxico / DOF Oficial',
                    date: data.bmx.series[0].datos[0].fecha,
                });
            }
        }
    } catch (e) {
        // Fall through to next provider
    }

    try {
        // 2. Try open.er-api.com (Reliable market rate)
        const res1 = await fetch('https://open.er-api.com/v6/latest/USD');
        if (res1.ok) {
            const data = await res1.json();
            if (data?.rates?.MXN) {
                return NextResponse.json({
                    rate: Math.round(data.rates.MXN * 10000) / 10000,
                    source: 'ExchangeRate-API (Mercado)',
                    date: new Date().toISOString(),
                });
            }
        }
    } catch (e) {
        // Fall through
    }

    // 3. Ultimate Fallback (Manual DOF value)
    return NextResponse.json({
        rate: 17.2563,
        source: 'DOF (Manual/Fallback)',
        date: new Date().toISOString(),
    });
}

