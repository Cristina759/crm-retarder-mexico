# TAREA: Integrar Tipo de Cambio USD/MXN Automático en el módulo de Cotizaciones

## Contexto
Proyecto Next.js + Supabase + Clerk desplegado en Vercel.
El tipo de cambio se usará únicamente en el módulo de **Cotizaciones**.
La fuente oficial es **Banxico (API REST gratuita)** — mismo dato que publica el DOF diario.
Serie utilizada: `SF43718` (Tipo de cambio FIX USD/MXN).

---

## PASO 1 — Crear el archivo de variable de entorno

En `.env.local` agregar:
```
BANXICO_TOKEN=AQUI_VA_EL_TOKEN_DE_BANXICO
```
> El token se obtiene gratis en: https://www.banxico.org.mx/SieAPIRest/service/v1/token
> También debe agregarse en Vercel → Settings → Environment Variables con el nombre `BANXICO_TOKEN`

---

## PASO 2 — Crear el API Route

**Ruta:** `app/api/tipo-cambio/route.js`

```js
import { NextResponse } from "next/server";

const BANXICO_TOKEN = process.env.BANXICO_TOKEN;
const SERIE = "SF43718";
const URL = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/${SERIE}/datos/oportuno`;

export async function GET() {
  try {
    const res = await fetch(URL, {
      headers: {
        "Bmx-Token": BANXICO_TOKEN,
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error("Error al conectar con Banxico");

    const data = await res.json();
    const dato = data?.bmx?.series?.[0]?.datos?.[0];

    if (!dato) throw new Error("No se pudo leer el dato de Banxico");

    return NextResponse.json({
      fecha: dato.fecha,
      tipoCambio: parseFloat(dato.dato),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

## PASO 3 — Crear el Hook personalizado

**Ruta:** `hooks/useTipoCambio.js`

```js
import { useState, useEffect, useCallback } from "react";

export function useTipoCambio() {
  const [tipoCambio, setTipoCambio] = useState(null);
  const [fecha, setFecha] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTipoCambio = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tipo-cambio");
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setTipoCambio(data.tipoCambio);
      setFecha(data.fecha);
    } catch (err) {
      setError("No se pudo obtener el tipo de cambio");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTipoCambio();
  }, [fetchTipoCambio]);

  return { tipoCambio, fecha, loading, error, refetch: fetchTipoCambio };
}
```

---

## PASO 4 — Crear el Widget visual

**Ruta:** `components/TipoCambioWidget.jsx`

```jsx
"use client";

import { useTipoCambio } from "@/hooks/useTipoCambio";

export default function TipoCambioWidget() {
  const { tipoCambio, fecha, loading, error, refetch } = useTipoCambio();

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm w-fit">
      <div>
        <p className="text-xs text-gray-400">Tipo de cambio DOF/Banxico</p>
        {loading && <p className="text-sm text-gray-500">Consultando...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {tipoCambio && !loading && (
          <p className="text-lg font-bold text-gray-800">
            ${tipoCambio.toLocaleString("es-MX", {
              minimumFractionDigits: 4,
              maximumFractionDigits: 4,
            })}{" "}
            <span className="text-sm font-normal text-gray-400">MXN/USD</span>
          </p>
        )}
        {fecha && (
          <p className="text-xs text-gray-400">Fecha: {fecha}</p>
        )}
      </div>

      <button
        onClick={refetch}
        disabled={loading}
        className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {loading ? "..." : "↻ Actualizar"}
      </button>
    </div>
  );
}
```

---

## PASO 5 — Integrar en la página de Cotizaciones

En el componente de cotizaciones donde se necesite el tipo de cambio:

```jsx
// Solo para mostrar el widget visual:
import TipoCambioWidget from "@/components/TipoCambioWidget";
<TipoCambioWidget />

// Si además necesitas el valor numérico para calcular precios:
import { useTipoCambio } from "@/hooks/useTipoCambio";
const { tipoCambio } = useTipoCambio();
// tipoCambio = número ej: 20.1543 — listo para multiplicar

// Ejemplo conversión USD → MXN:
const precioMXN = precioUSD * tipoCambio;
```

---

## Comportamiento esperado
- ✅ Al entrar a cotizaciones: consulta automáticamente el tipo de cambio vigente
- ✅ Botón "↻ Actualizar": refresca sin recargar la página
- ✅ Caché de 1 hora en Vercel: no sobrecarga la API
- ✅ Dato oficial: FIX Banxico = mismo que DOF
