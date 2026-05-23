import { NextResponse } from 'next/server';
import https from 'https';

/**
 * GET /api/tipo-cambio-dof
 *
 * Obtiene el tipo de cambio USD oficial del Diario Oficial de la Federación.
 * Usa https.get() nativo con rejectUnauthorized:false para bypass del SSL
 * auto-firmado de dof.gob.mx en entornos locales.
 *
 * Respuesta OK:  { tipoCambio: number, fecha: string, fuente: 'DOF' }
 * Respuesta KO:  { error: string }  HTTP 503
 *
 * Si retorna 503, el cliente usa el último valor guardado en localStorage.
 */
export async function GET() {
  const fechas = buildFechas(6); // hoy + 5 días hacia atrás

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
          { headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=1800' } }
        );
      }
    } catch {
      // DOF no respondió para esta fecha → intenta el día anterior
    }
  }

  return NextResponse.json(
    { error: 'DOF no disponible en este momento' },
    { status: 503 }
  );
}

// ── Fetch con bypass SSL ──────────────────────────────────────────────────────

function fetchDOF(url: string, timeoutMs = 10_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        rejectUnauthorized: false, // dof.gob.mx usa un cert que Node no valida (CA gubernamental MX no incluida)
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-MX,es;q=0.9',
        },
      },
      (res) => {
        // Seguir redirección simple
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          fetchDOF(res.headers.location, timeoutMs).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => { body += chunk; });
        res.on('end', () => resolve(body));
        res.on('error', reject);
      }
    );
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error('timeout'));
    });
    req.on('error', reject);
  });
}

// ── Extracción del valor del HTML ─────────────────────────────────────────────

function extractValor(html: string): number | null {
  // El DOF devuelve una tabla así:
  //   <td>15-04-2026</td><td align="right">17.268800</td>
  // Probamos varios patrones por si cambia el markup.
  const patterns = [
    /\d{2}-\d{2}-\d{4}<\/td>\s*<td[^>]*>\s*([\d,\.]+)/i,
    /align="right"[^>]*>\s*(1[0-9]\.\d{4,})/i,
    />\s*(1[5-9]\.\d{4,}|2[0-4]\.\d{4,})\s*</,
  ];

  for (const re of patterns) {
    const m = html.match(re);
    if (m) {
      const v = parseFloat(m[1].replace(',', '.'));
      if (!isNaN(v) && v > 10 && v < 50) return round4(v);
    }
  }
  return null;
}

// ── Utilidades ────────────────────────────────────────────────────────────────

function round4(n: number) {
  return Math.round(n * 10_000) / 10_000;
}

/** Genera fechas en formato DD%2FMM%2FYYYY para la URL del DOF */
function buildFechas(n: number): { dfecha: string; label: string }[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return {
      dfecha: `${dd}%2F${mm}%2F${yyyy}`,
      label:  `${dd}-${mm}-${yyyy}`,
    };
  });
}
