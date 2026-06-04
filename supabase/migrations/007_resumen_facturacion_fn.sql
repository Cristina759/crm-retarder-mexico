-- ── Función RPC: resumen de facturación con aritmética NUMERIC exacta ──────────
CREATE OR REPLACE FUNCTION get_resumen_facturacion()
RETURNS TABLE (
  total_facturado      NUMERIC,
  total_cobrado        NUMERIC,
  total_neto_facturado NUMERIC,
  total_pendiente      NUMERIC,
  total_notas_credito  NUMERIC,
  cnt_pendientes       INTEGER,
  cnt_vencidas         INTEGER
)
LANGUAGE sql
STABLE
AS $$
  WITH os_base AS (
    -- OS elegibles (misma condición que el código JS)
    SELECT
      os.id,
      os.estado_facturacion,
      COALESCE(
        NULLIF(os.monto_factura, 0),
        cot.total_mxn,
        0
      )::numeric AS monto,
      COALESCE(os.abonos, '[]'::jsonb) AS abonos
    FROM ordenes_servicio os
    LEFT JOIN cotizaciones cot ON cot.id = os.cotizacion_id
    WHERE (
      os.monto_factura > 0
      OR os.numero_factura IS NOT NULL
      OR os.estado_facturacion IN ('facturada','pagada','pago_parcial','vencida')
    )
      AND COALESCE(os.estado_facturacion, '') != 'cancelado'
  ),

  nc_por_os AS (
    SELECT os_id, SUM(monto::numeric) AS nc_total
    FROM notas_credito
    WHERE os_id IS NOT NULL
    GROUP BY os_id
  ),

  os_con_neto AS (
    SELECT
      ob.id,
      ob.estado_facturacion,
      ob.monto,
      GREATEST(0::numeric, ob.monto - COALESCE(n.nc_total, 0)) AS monto_neto,
      ob.abonos
    FROM os_base ob
    LEFT JOIN nc_por_os n ON n.os_id = ob.id
  ),

  os_cobrado AS (
    SELECT
      id,
      estado_facturacion,
      monto,
      monto_neto,
      COALESCE((
        SELECT ROUND(SUM((a->>'monto')::numeric), 2)
        FROM jsonb_array_elements(abonos) AS a
        WHERE a->>'monto' IS NOT NULL
      ), 0::numeric) AS abonos_sum
    FROM os_con_neto
  ),

  os_final AS (
    SELECT
      monto,
      monto_neto,
      estado_facturacion,
      CASE
        WHEN estado_facturacion = 'pagada' AND abonos_sum = 0
          THEN monto_neto
        ELSE LEAST(abonos_sum, monto_neto)
      END AS cobrado
    FROM os_cobrado
  ),

  totales AS (
    SELECT
      ROUND(SUM(monto),   2) AS total_facturado,
      ROUND(SUM(cobrado), 2) AS total_cobrado,
      SUM(CASE WHEN estado_facturacion IN
            ('pendiente','facturada','enviada_cliente','pago_parcial')
          THEN 1 ELSE 0 END)::integer AS cnt_pendientes,
      SUM(CASE WHEN estado_facturacion = 'vencida'
          THEN 1 ELSE 0 END)::integer AS cnt_vencidas
    FROM os_final
  ),

  nc_total_cte AS (
    SELECT ROUND(SUM(monto::numeric), 2) AS nc_total
    FROM notas_credito
  )

  SELECT
    t.total_facturado,
    t.total_cobrado,
    ROUND(t.total_facturado - nc.nc_total, 2)                              AS total_neto_facturado,
    ROUND(GREATEST(0::numeric, (t.total_facturado - nc.nc_total) - t.total_cobrado), 2) AS total_pendiente,
    nc.nc_total                                                             AS total_notas_credito,
    t.cnt_pendientes,
    t.cnt_vencidas
  FROM totales t, nc_total_cte nc;
$$;
