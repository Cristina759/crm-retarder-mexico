import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Soportería - Precios de la columna "$ Final" del Excel
const soporteria = [
  { nombre: 'Placa 300 X 400',                                     precio_venta: 3587.50 },
  { nombre: 'Placa Soporte chasis (PK-PK1)',                       precio_venta: 975.00  },
  { nombre: 'Juego Silentblocks (Modelos PK/PS/P7/P10)',           precio_venta: 2172.96 },
  { nombre: 'Placa Soporte chasis (PS-PS1)',                       precio_venta: 1025.00 },
  { nombre: 'Placa Soporte chasis (Modelo P7)',                    precio_venta: 900.00  },
  { nombre: 'Placa Soporte chasis (Modelo P10)',                   precio_venta: 1025.00 },
  
  // Modelo F16-65
  { nombre: 'Placa Base 320 X 300 X 20 MM',                        precio_venta: 575.00  },
  { nombre: 'Placa 140 X 140 X 140',                               precio_venta: 1150.00 },
  { nombre: 'Albardon 200 X 200 X 70 MM',                          precio_venta: 37.50   },
  { nombre: 'Albardon 5mm 140 X 70 MM',                            precio_venta: 87.50   },
  { nombre: 'Placa Soporte chasis (F16-65)',                       precio_venta: 975.00  },
  { nombre: 'Juego Silentblocks (F16-65)',                         precio_venta: 5521.66 },

  // Modelo F18-200
  { nombre: 'Placa 384 X 635 X 25 MM',                             precio_venta: 1062.50 },
  { nombre: 'Placa 300 X 300 X 200',                               precio_venta: 1050.00 },
  { nombre: 'Albardon 300 X 400 X 70 MM',                          precio_venta: 87.50   },
  { nombre: 'Albardon 140 X 70 X 20 MM',                           precio_venta: 37.50   },
  { nombre: 'Placa Soporte chasis (F18-200)',                      precio_venta: 1025.00 },
  { nombre: 'Juego Silentblocks (F18-200)',                        precio_venta: 5410.63 },
];

async function run() {
  console.log('Insertando Soportería...');
  let ok = 0, fail = 0;
  for (const item of soporteria) {
    const { error } = await supabase.from('refacciones').insert({
      nombre: item.nombre,
      categoria: 'SOPORTERÍA',
      precio_venta: item.precio_venta,
      activo: true,
    });
    if (error) { console.error(`✗ ${item.nombre}: ${error.message}`); fail++; }
    else        { console.log(`✓ ${item.nombre}`); ok++; }
  }
  console.log(`\nListo: ${ok} insertados, ${fail} errores.`);
}

run();
