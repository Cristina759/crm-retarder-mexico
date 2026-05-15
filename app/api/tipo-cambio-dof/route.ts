import { NextResponse } from 'next/server';

export async function GET() {
  // ── Estrategia 1: DOF directo (con manejo de SSL roto) ─────────────────────
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
          { headers: { 'Cache-Control': 'no-store, max-age=0' } }
        );
      }
    } catch (e) {
      // SSL del DOF falla frecuentemente, continuar al siguiente intento
    }
  }

  // ── Estrategia 2: Banxico SIE (API pública, SSL válido) ────────────────────
  try {
    const banxicoTC = await fetchBanxico();
    if (banxicoTC !== null) {
      return NextResponse.json(
        { tipoCambio: banxicoTC.valor, fecha: banxicoTC.fecha, fuente: 'Banxico SIE' },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }
  } catch (e) {
    // Banxico también puede fallar
  }

  // ── Estrategia 3: Banxico RSS (alternativa ligera) ─────────────────────────
  try {
    const rssTC = await fetchBanxicoRSS();
    if (rssTC !== null) {
      return NextResponse.json(
        { tipoCambio: rssTC.valor, fecha: rssTC.fecha, fuente: 'Banxico RSS' },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }
  } catch {}

  // ── Fallback ───────────────────────────────────────────────────────────────
  return NextResponse.json(
    { tipoCambio: 17.2400, fecha: 'Estimado', fuente: 'Fallback' },
    { status: 200 }
  );
}

// ── DOF fetch con bypass de SSL roto ──────────────────────────────────────────
async function fetchDOF(url: string, timeoutMs = 8_000): Promise<string> {
  // El DOF tiene certificados SSL rotos. Usamos el módulo https nativo
  // con rejectUnauthorized:false solo para esta petición específica.
  const https = require('https') as typeof import('https');
  const { URL } = require('url');
  
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      rejectUnauthorized: false, // DOF tiene certificado roto
      timeout: timeoutMs,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-MX,es;q=0.9',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

// ── Banxico SIE API (tipo de cambio fix, serie SF43718) ──────────────────────
async function fetchBanxico(): Promise<{ valor: number; fecha: string } | null> {
  // API pública de Banxico — no requiere token para consultas básicas
  const hoy = new Date();
  const hace7 = new Date(hoy.getTime() - 7 * 86400000);
  const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const url = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/${fmtDate(hace7)}/${fmtDate(hoy)}`;
  
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Bmx-Token': 'token', // Banxico acepta cualquier token para esta serie pública
    },
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  });

  if (!res.ok) return null;

  const json = await res.json();
  const datos = json?.bmx?.series?.[0]?.datos;
  if (!Array.isArray(datos) || datos.length === 0) return null;

  // Último dato disponible
  const ultimo = datos[datos.length - 1];
  const valor = parseFloat(String(ultimo.dato).replace(',', '.'));
  if (isNaN(valor) || valor < 12 || valor > 40) return null;

  return { valor: round4(valor), fecha: ultimo.fecha };
}

// ── Banxico RSS feed alternativo ─────────────────────────────────────────────
async function fetchBanxicoRSS(): Promise<{ valor: number; fecha: string } | null> {
  const url = 'https://www.banxico.org.mx/rsscb/rss?BMXC_CANAL=fix&BMXC_IDIOMA=es';
  
  const res = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  });

  if (!res.ok) return null;

  const xml = await res.text();
  
  // Buscar el valor del fix en el XML/RSS
  const matchValor = xml.match(/FIX[^<]*?(\d{2}\.\d{4})/i) 
    || xml.match(/(1[5-9]\.\d{4})/);
  
  if (matchValor) {
    const valor = parseFloat(matchValor[1]);
    if (!isNaN(valor) && valor > 12 && valor < 40) {
      const matchFecha = xml.match(/(\d{2}\/\d{2}\/\d{4})/);
      return { valor: round4(valor), fecha: matchFecha?.[1] ?? 'Hoy' };
    }
  }

  return null;
}

// ── Extraer valor del HTML del DOF ───────────────────────────────────────────
function extractValor(html: string): number | null {
  const patterns = [
    // Pattern 1: tabla con class="txt"
    /\d{2}[\s-]\d{2}[\s-]\d{4}<\/td>\s*<td[^>]*class="txt"[^>]*>\s*([\d,\.]+)/i,
    // Pattern 2: tabla genérica fecha/valor
    /\d{2}[\s-]\d{2}[\s-]\d{4}<\/td>\s*<td[^>]*>\s*([\d,\.]+)/i,
    // Pattern 3: align center con class txt
    /align="center"[^>]*class="txt"[^>]*>\s*(1[0-9][\.,]\d{4,})/i,
    // Pattern 4: cualquier número que parezca TC
    />\s*(1[5-9][\.,]\d{4,}|2[0-4][\.,]\d{4,})\s*</,
    // Pattern 5: valor con espacio (DOF a veces pone "17.240000")
    /(\d{2}\.\d{4,6})\s*<\/td>/i,
  ];

  for (const re of patterns) {
    const match = html.match(re);
    if (match) {
      const valor = parseFloat(match[1].replace(',', '.').replace(/\s/g, ''));
      if (!Number.isNaN(valor) && valor > 12 && valor < 40) {
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