import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Cardanes - precio_venta = $ Final por unidad. Orden exacto del Excel.
const cardanes = [
  // ── PK-PK1 Ó F16-65 ──────────────────────────────────────────────────────────
  { modelo: 'PK-PK1 / F16-65',     nombre: 'Soldable 1480 para tubo 3342mm',        precio_venta: 600.00   },
  { modelo: 'PK-PK1 / F16-65',     nombre: 'Espiga 1480 para tubo 3342mm',          precio_venta: 1375.00  },
  { modelo: 'PK-PK1 / F16-65',     nombre: 'Deslizable 1480 para tubo 3342',        precio_venta: 1625.00  },
  { modelo: 'PK-PK1 / F16-65',     nombre: 'Cruceta 1480',                          precio_venta: 312.50   },
  { modelo: 'PK-PK1 / F16-65',     nombre: 'Plato Brida para 1480',                 precio_venta: 637.50   },
  // ── PK-PK1 Ó F16-80 ──────────────────────────────────────────────────────────
  { modelo: 'PK-PK1 / F16-80',     nombre: 'Soldable 1550',                         precio_venta: 750.75   },
  { modelo: 'PK-PK1 / F16-80',     nombre: 'Espiga 1550',                           precio_venta: 1251.25  },
  { modelo: 'PK-PK1 / F16-80',     nombre: 'Deslizable 1550',                       precio_venta: 1278.88  },
  { modelo: 'PK-PK1 / F16-80',     nombre: 'Cruceta 1550',                          precio_venta: 253.50   },
  { modelo: 'PK-PK1 / F16-80',     nombre: 'Plato Brida para 1550',                 precio_venta: 755.63   },
  // ── PK5-PK5-1 Ó F16-140 (1610) ───────────────────────────────────────────────
  { modelo: 'PK5-PK5-1 / F16-140', nombre: 'Soldable 1610',                         precio_venta: 1062.50  },
  { modelo: 'PK5-PK5-1 / F16-140', nombre: 'Espiga 1610',                           precio_venta: 1937.50  },
  { modelo: 'PK5-PK5-1 / F16-140', nombre: 'Deslizable 1610',                       precio_venta: 3000.00  },
  { modelo: 'PK5-PK5-1 / F16-140', nombre: 'Cubrepolvo',                            precio_venta: 0.00     },
  { modelo: 'PK5-PK5-1 / F16-140', nombre: 'Cruceta 1610',                          precio_venta: 565.50   },
  { modelo: 'PK5-PK5-1 / F16-140', nombre: 'Plato Brida para 1610',                 precio_venta: 2437.50  },
  { modelo: 'PK5-PK5-1 / F16-140', nombre: 'Tornillos 3/8" X 1 1/2" cuerda fina',  precio_venta: 7.50     },
  { modelo: 'PK5-PK5-1 / F16-140', nombre: 'Tuercas cuerda fina de 3/8"',           precio_venta: 5.00     },
  // ── PK5-PK5-1 Ó F16-140 (1710) ───────────────────────────────────────────────
  { modelo: 'PK5-PK5-1 / F16-140', nombre: 'Soldable 1710',                         precio_venta: 1250.00  },
  { modelo: 'PK5-PK5-1 / F16-140', nombre: 'Espiga 1710',                           precio_venta: 2375.00  },
  { modelo: 'PK5-PK5-1 / F16-140', nombre: 'Deslizable 1710',                       precio_venta: 3125.00  },
  { modelo: 'PK5-PK5-1 / F16-140', nombre: 'Cubrepolvo 1710',                       precio_venta: 419.25   },
  { modelo: 'PK5-PK5-1 / F16-140', nombre: 'Cruceta 1710',                          precio_venta: 812.50   },
  { modelo: 'PK5-PK5-1 / F16-140', nombre: 'Plato Brida para 1710',                 precio_venta: 2437.50  },
  { modelo: 'PK5-PK5-1 / F16-140', nombre: 'Tornillos 3/8" X 1 1/2" cuerda fina',  precio_venta: 7.50     },
  { modelo: 'PK5-PK5-1 / F16-140', nombre: 'Tuercas cuerda fina de 3/8"',           precio_venta: 5.00     },
  // ── P7 Ó F16-200 al 300 ──────────────────────────────────────────────────────
  { modelo: 'P7 / F16-200',        nombre: 'Soldable 1810',                          precio_venta: 2125.00  },
  { modelo: 'P7 / F16-200',        nombre: 'Espiga 1810',                            precio_venta: 3250.00  },
  { modelo: 'P7 / F16-200',        nombre: 'Deslizable 1810',                        precio_venta: 4687.50  },
  { modelo: 'P7 / F16-200',        nombre: 'Cubrepolvo 1810',                        precio_venta: 723.13   },
  { modelo: 'P7 / F16-200',        nombre: 'Cruceta 1810',                           precio_venta: 937.50   },
  { modelo: 'P7 / F16-200',        nombre: 'Plato Brida para 1810',                  precio_venta: 2562.50  },
  { modelo: 'P7 / F16-200',        nombre: 'Tornillos 7/16" X 1 1/2" cuerda fina',  precio_venta: 13.75    },
  { modelo: 'P7 / F16-200',        nombre: 'Tuercas cuerda fina de 7/16"',           precio_venta: 7.50     },
  // ── P10 Ó F16-200 al 300 (SPL250) ────────────────────────────────────────────
  { modelo: 'P10 / F16-200',       nombre: 'Soldable SPL250',                        precio_venta: 625.00   },
  { modelo: 'P10 / F16-200',       nombre: 'Yugo Espiga SPL250',                     precio_venta: 3125.00  },
  { modelo: 'P10 / F16-200',       nombre: 'Camisa SPL250',                          precio_venta: 6375.00  },
  { modelo: 'P10 / F16-200',       nombre: 'Cubrepolvo SPL250',                      precio_venta: 1875.00  },
  { modelo: 'P10 / F16-200',       nombre: 'Cruceta SPL250',                         precio_venta: 1500.00  },
  { modelo: 'P10 / F16-200',       nombre: 'Plato Brida para SPL250',                precio_venta: 15500.00 },
  { modelo: 'P10 / F16-200',       nombre: 'Seguros Cruceta SPL250',                 precio_venta: 750.00   },
  // ── Plato Bridas precio alternativo (15% margen) ──────────────────────────────
  { modelo: 'ALTERNATIVO 15%',     nombre: 'Plato Brida para 1480 (15%)',             precio_venta: 637.50   },
  { modelo: 'ALTERNATIVO 15%',     nombre: 'Plato Brida para 1550 (15%)',             precio_venta: 695.18   },
  { modelo: 'ALTERNATIVO 15%',     nombre: 'Plato Brida para 1610 (15%)',             precio_venta: 2242.50  },
  { modelo: 'ALTERNATIVO 15%',     nombre: 'Plato Brida para 1710 (15%)',             precio_venta: 2242.50  },
  { modelo: 'ALTERNATIVO 15%',     nombre: 'Plato Brida para 1810 (15%)',             precio_venta: 2357.50  },
  { modelo: 'ALTERNATIVO 15%',     nombre: 'Plato Brida para SPL250 (15%)',           precio_venta: 14260.00 },
];

async function run() {
  console.log('Insertando Cardanes...');
  let ok = 0, fail = 0;
  for (const item of cardanes) {
    const { error } = await supabase.from('refacciones').insert({
      nombre: item.nombre,
      categoria: 'CARDANES',
      precio_venta: item.precio_venta,
      activo: true,
    });
    if (error) { console.error(`✗ ${item.nombre}: ${error.message}`); fail++; }
    else        { console.log(`✓ ${item.nombre}`); ok++; }
  }
  console.log(`\nListo: ${ok} insertados, ${fail} errores.`);
}

run();
