# TAREA: Re-migrar órdenes de servicio con datos esenciales

## PASO 1 — Borrar las órdenes mal migradas (con empresa_id NULL)
```sql
DELETE FROM public.ordenes_servicio WHERE empresa_id IS NULL;
```

## PASO 2 — Verificar empresas existentes
```sql
SELECT id, nombre FROM public.empresas ORDER BY nombre;
```
(Si algún cliente no existe en la tabla empresas, crearlo primero)

## PASO 3 — Insertar las 22 órdenes con solo los campos esenciales

| CLIENTE | OS | FACTURA | SUBTOTAL | TOTAL |
|---|---|---|---|---|
| MINERIA BURVAL | 487 | B558 | $20,971.22 | $24,326.62 |
| LA CANTERA | 486 | B577 | $37,500.00 | $43,500.00 |
| RAUNEL RUIZ | 488 | B568 | $34,836.71 | $40,410.58 |
| AUSTIN BACIS | - | B559 | $15,500.00 | $17,980.00 |
| AUSTIN BACIS | 519 | B560 | $153,635.13 | $178,216.75 |
| AUSTIN BACIS | 507 | B561 | $6,750.00 | $7,830.00 |
| AUSTIN BACIS | 506 | B562 | $6,750.00 | $7,830.00 |
| AUSTIN BACIS | 505 | B563 | $6,750.00 | $7,830.00 |
| AUSTIN BACIS | 504 | B564 | $6,750.00 | $7,830.00 |
| AUSTIN BACIS | 503 | B565 | $6,750.00 | $7,830.00 |
| AUSTIN BACIS | 502 | B566 | $6,750.00 | $7,830.00 |
| AUSTIN BACIS | 501 | B567 | $6,750.00 | $7,830.00 |
| MAPLE TRANSPORTES | - | B569 | $751,116.00 | $871,294.56 |
| LA CANTERA | 492 | B570 | $8,690.80 | $10,081.33 |
| LA CANTERA | 497 | B571 | $6,750.00 | $7,830.00 |
| LA CANTERA | 496 | B572 | $8,690.80 | $10,081.33 |
| LA CANTERA | 495 | B573 | $7,381.16 | $8,562.15 |
| LA CANTERA | 494 | B574 | $6,750.00 | $7,830.00 |
| LA CANTERA | 493 | B575 | $6,750.00 | $7,830.00 |
| LA CANTERA | 492 | B576 | $8,940.80 | $10,371.33 |
| PROMACO | 618 | B578 | $11,530.40 | $13,375.26 |
| PROMACO | 617 | B579 | $34,060.72 | $39,510.44 |

## Campos a insertar por orden:
- `numero_orden` = número de OS
- `numero_factura` = número de factura (B558, B577, etc.)
- `empresa_id` = UUID buscando por nombre en tabla `empresas`
- `subtotal` = subtotal
- `total` = total
- `status` = 'completado'

## PASO 4 — Verificar
```sql
SELECT numero_orden, numero_factura, total FROM public.ordenes_servicio ORDER BY numero_orden;
```
