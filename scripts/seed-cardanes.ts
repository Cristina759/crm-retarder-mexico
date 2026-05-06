import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Precios = X Cantidad / cantidad (precio unitario final con margen)
const cardanes = [
  // ── PK - PK1 Ó F16-65 (tubo 1480) ───────────────────────────────────────────
  { nombre: 'Soldable 1480 para tubo 3342mm',  precio_venta: 600.00   },
  { nombre: 'Espiga 1480 para tubo 3342mm',    precio_venta: 1375.00  },
  { nombre: 'Deslizable 1480 para tubo 3342',  precio_venta: 1625.00  },
  { nombre: 'Cruceta 1480',                    precio_venta: 312.50   },
  { nombre: 'Plato Brida para 1480',           precio_venta: 637.50   },

  // ── PK - PK1 Ó F16-80 (tubo 1550) ───────────────────────────────────────────
  { nombre: 'Soldable 1550',                   precio_venta: 750.75   },
  { nombre: 'Espiga 1550',                     precio_venta: 1251.25  },
  { nombre: 'Deslizable 1550',                 precio_venta: 1278.88  },
  { nombre: 'Cruceta 1550',                    precio_venta: 253.50   },
  { nombre: 'Plato Brida para 1550',           precio_venta: 755.63   },

  // ── PK5-PK5-1 Ó F16-140 (1610) ───────────────────────────────────────────────
  { nombre: 'Soldable 1610',                   precio_venta: 1062.50  },
  { nombre: 'Espiga 1610',                     precio_venta: 1937.50  },
  { nombre: 'Deslizable 1610',                 precio_venta: 3000.00  },
  { nombre: 'Cruceta 1610',                    precio_venta: 565.50   },
  { nombre: 'Plato Brida para 1610',           precio_venta: 2437.50  },

  // ── PK5-PK5-1 Ó F16-140 (1710) ───────────────────────────────────────────────
  { nombre: 'Soldable 1710',                   precio_venta: 1250.00  },
  { nombre: 'Espiga 1710',                     precio_venta: 2375.00  },
  { nombre: 'Deslizable 1710',                 precio_venta: 3125.00  },
  { nombre: 'Cubrepolvo 1710',                 precio_venta: 419.25   },
  { nombre: 'Cruceta 1710',                    precio_venta: 812.50   },
  { nombre: 'Plato Brida para 1710',           precio_venta: 2437.50  },

  // ── P7 Ó F16-200 al 300 (1810) ───────────────────────────────────────────────
  { nombre: 'Soldable 1810',                   precio_venta: 2125.00  },
  { nombre: 'Espiga 1810',                     precio_venta: 3250.00  },
  { nombre: 'Deslizable 1810',                 precio_venta: 4687.50  },
  { nombre: 'Cubrepolvo 1810',                 precio_venta: 723.13   },
  { nombre: 'Plato Brida para 1810',           precio_venta: 2562.50  },
  { nombre: 'Tornillos 7/16" X 1 1/2" cuerda fina', precio_venta: 13.75 },
  { nombre: 'Tuercas cuerda fina de 7/16"',   precio_venta: 7.50     },

  // ── Tornillos comunes de cardán ───────────────────────────────────────────────
  { nombre: 'Tornillos 3/8" X 1" cuerda fina',     precio_venta: 7.50  },
  { nombre: 'Tornillos 3/8" X 1 1/2" cuerda fina', precio_venta: 7.50  },
  { nombre: 'Tuercas cuerda fina de 3/8"',          precio_venta: 5.00  },

  // ── P10 Ó F10-200 al 300 (SPL250) ────────────────────────────────────────────
  { nombre: 'Soldable SPL250',                 precio_venta: 625.00   },
  { nombre: 'Yugo Espiga SPL250',              precio_venta: 3125.00  },
  { nombre: 'Camisa SPL250',                   precio_venta: 6375.00  },
  { nombre: 'Cubrepolvo SPL250',               precio_venta: 937.50   },
  { nombre: 'Cruceta SPL250',                  precio_venta: 1500.00  },
  { nombre: 'Plato Brida para SPL250',         precio_venta: 15500.00 },
  { nombre: 'Seguros Cruceto SPL250',          precio_venta: 750.00   },
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
