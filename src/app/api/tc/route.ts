import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    // SF43718: Tipo de cambio para solventar obligaciones (DOF)
    const BANXICO_TOKEN = 'c42c3c2819e3e3af8e5b2978a2ff7d36a580b3d75b3d8e7f89b55b6e1e17f76e';
    const BANXICO_URL = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno?token=${BANXICO_TOKEN}`;

    try {
        const res = await fetch(BANXICO_URL, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 } // Cache for 1 hour to avoid excessive hits
        });

        if (res.ok) {
            const data = await res.json();
            const valor = data?.bmx?.series?.[0]?.datos?.[0]?.dato;
            if (valor && !isNaN(parseFloat(valor))) {
                return NextResponse.json({
                    rate: parseFloat(valor),
                    source: 'Banxico / DOF Oficial',
                    fecha: data.bmx.series[0].datos[0].fecha
                });
            }
        }
    } catch (err) {
        console.error('Banxico Fetch Error:', err);
    }

    // Ultimate Fallback: el valor exacto del DOF reportado por el usuario
    return NextResponse.json({
        rate: 17.2563,
        source: 'DOF (Manual/Fallback)',
        fecha: new Date().toLocaleDateString('es-MX')
    });
}
