import { NextResponse } from 'next/server';

export async function GET() {
  const fechas = buildFechas(6);

  for (const { dfecha, label } of fechas) {
    try {
      const url =
        `https://dof.gob.mx/indicadores_detalle.php` +
        `?cod_tipo_indicador=158&dfecha=${dfecha}&hfecha=${dfecha}`;

      const html = await fetchDOF(url);
      const valor = extractValor(html);

      if (valor !== null) {
        return NextResponse.json(
          { tipoCambio: valor, fecha: label, fuente: 'DOF' },
          {
            headers: {
              'Cache-Control': 'public, max-age=3600, stale-while-revalidate=1800',
            },
          }
        );
      }
    } catch {}
  }

  return NextResponse.json(
    { error: 'DOF no disponible en este momento' },
    { status: 503 }
  );
}

async function fetchDOF(url: string, timeoutMs = 10_000): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-MX,es;q=0.9',
    },
    redirect: 'follow',
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

function extractValor(html: string): number | null {
  const patterns = [
    /\d{2}-\d{2}-\d{4}<\/td>\s*<td[^>]*>\s*([\d,\.]+)/i,
    /align="right"[^>]*>\s*(1[0-9]\.\d{4,})/i,
    />\s*(1[5-9]\.\d{4,}|2[0-4]\.\d{4,})\s*</,
  ];

  for (const re of patterns) {
    const match = html.match(re);
    if (match) {
      const valor = parseFloat(match[1].replace(',', '.'));
      if (!Number.isNaN(valor) && valor > 10 && valor < 50) {
        return round4(valor);
      }
    }
  }

  return null;
}

function round4(value: number) {
  return Math.round(value * 10_000) / 10_000;
}

function buildFechas(n: number): { dfecha: string; label: string }[] {
  return Array.from({ length: n }, (_, i) => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - i);
    const dd = String(fecha.getDate()).padStart(2, '0');
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const yyyy = fecha.getFullYear();

    return {
      dfecha: `${dd}%2F${mm}%2F${yyyy}`,
      label: `${dd}-${mm}-${yyyy}`,
    };
  });
}