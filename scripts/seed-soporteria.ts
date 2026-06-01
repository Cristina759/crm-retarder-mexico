import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Soportería - Precios de la columna "$ Final" del Excel, orden exacto por modelo
const soporteria = [
  // ── Modelo PK-PK1 ─────────────────────────────────────────────────────────────
  { modelo: 'PK-PK1', nombre: 'Placas 330 X 400',                                             precio_venta: 3587.50 },
  { modelo: 'PK-PK1', nombre: 'Albardon de 120 X 120',                                        precio_venta: 5.00    },
  { modelo: 'PK-PK1', nombre: 'Albardon 70 x 140',                                            precio_venta: 0.00    },
  { modelo: 'PK-PK1', nombre: 'Placa Soporte chasis 3/8X100X160X240MM C/CAR',                 precio_venta: 975.00  },
  { modelo: 'PK-PK1', nombre: 'Juego Silenblocks',                                            precio_venta: 2172.95 },
  { modelo: 'PK-PK1', nombre: 'Tornillos de 5/16" X 1"',                                     precio_venta: 3.75    },
  { modelo: 'PK-PK1', nombre: 'Tuercas de Seguridad 5/16"',                                  precio_venta: 2.00    },
  { modelo: 'PK-PK1', nombre: 'Arandela de Presion de 5/16"',                                precio_venta: 0.75    },
  { modelo: 'PK-PK1', nombre: 'Tornillos de 5/16" X 2"',                                     precio_venta: 5.00    },
  { modelo: 'PK-PK1', nombre: 'Tornillos de 12MM x 50mm',                                    precio_venta: 25.00   },
  { modelo: 'PK-PK1', nombre: 'Tuercas de Seguridad 12MM',                                   precio_venta: 13.75   },
  { modelo: 'PK-PK1', nombre: 'Arandela Automotiva de 1/2" x1"',                             precio_venta: 8.13    },
  { modelo: 'PK-PK1', nombre: 'Arandela Grande de 1/2" X 2"',                                precio_venta: 30.00   },
  { modelo: 'PK-PK1', nombre: 'Tornillo 14 mm',                                               precio_venta: 20.63   },
  { modelo: 'PK-PK1', nombre: 'Arandelas de presion 9/16"',                                  precio_venta: 3.13    },
  { modelo: 'PK-PK1', nombre: 'Tornillo 18mm X 50',                                           precio_venta: 43.13   },
  { modelo: 'PK-PK1', nombre: 'Tuerca de Seguridad 18mm',                                    precio_venta: 18.75   },
  // ── Modelo P5-P51 ─────────────────────────────────────────────────────────────
  { modelo: 'P5-P51', nombre: 'Placas 330 X 400',                                             precio_venta: 3250.00 },
  { modelo: 'P5-P51', nombre: 'Albardon de 120 X 120',                                        precio_venta: 0.00    },
  { modelo: 'P5-P51', nombre: 'Albardon 70 x 140',                                            precio_venta: 0.00    },
  { modelo: 'P5-P51', nombre: 'Placa Soporte chasis',                                         precio_venta: 1025.00 },
  { modelo: 'P5-P51', nombre: 'Juego Silenblocks',                                            precio_venta: 0.00    },
  { modelo: 'P5-P51', nombre: 'Tornillos de 5/16" X 1"',                                     precio_venta: 3.75    },
  { modelo: 'P5-P51', nombre: 'Tuercas de Seguridad 5/16"',                                  precio_venta: 2.00    },
  { modelo: 'P5-P51', nombre: 'Arandela de Presion de 5/16"',                                precio_venta: 0.75    },
  { modelo: 'P5-P51', nombre: 'Tornillos de 5/16" X 2"',                                     precio_venta: 5.00    },
  { modelo: 'P5-P51', nombre: 'Tornillos de 18mm X 120mm grado 9.8 paso 1.50',               precio_venta: 140.00  },
  { modelo: 'P5-P51', nombre: 'Tuercas de Seguridad 18mm paso 1.50',                         precio_venta: 18.75   },
  { modelo: 'P5-P51', nombre: 'Arandela Automotiva de 3/4"',                                 precio_venta: 12.50   },
  { modelo: 'P5-P51', nombre: 'Arandela Grande de 3/4" x 2 1/2""',                           precio_venta: 30.00   },
  { modelo: 'P5-P51', nombre: 'Tornillo 14 mm',                                               precio_venta: 20.63   },
  { modelo: 'P5-P51', nombre: 'Arandelas de presion 9/16"',                                  precio_venta: 3.13    },
  { modelo: 'P5-P51', nombre: 'Tornillo 18mm X 50',                                           precio_venta: 43.13   },
  { modelo: 'P5-P51', nombre: 'Tuerca de Seguridad 18mm',                                    precio_venta: 18.75   },
  // ── Modelo P7 ─────────────────────────────────────────────────────────────────
  { modelo: 'P7',     nombre: 'Placas 330 X 400',                                             precio_venta: 2860.00 },
  { modelo: 'P7',     nombre: 'Albardon de 120 X 120',                                        precio_venta: 0.00    },
  { modelo: 'P7',     nombre: 'Albardon 70 x 140',                                            precio_venta: 0.00    },
  { modelo: 'P7',     nombre: 'Placa Soporte chasis',                                         precio_venta: 902.00  },
  { modelo: 'P7',     nombre: 'Juego Silenblocks',                                            precio_venta: 2172.96 },
  { modelo: 'P7',     nombre: 'Tornillos de 5/16" X 1"',                                     precio_venta: 3.75    },
  { modelo: 'P7',     nombre: 'Tuercas de Seguridad 5/16"',                                  precio_venta: 2.00    },
  { modelo: 'P7',     nombre: 'Arandela de Presion de 5/16"',                                precio_venta: 0.75    },
  { modelo: 'P7',     nombre: 'Tornillos de 5/16" X 2"',                                     precio_venta: 5.00    },
  { modelo: 'P7',     nombre: 'Tornillos de 18mm X 120mm grado 9.8 paso 1.50',               precio_venta: 140.00  },
  { modelo: 'P7',     nombre: 'Tuercas de Seguridad 18mm paso 1.50',                         precio_venta: 18.75   },
  { modelo: 'P7',     nombre: 'Arandela Automotiva de 3/4"',                                 precio_venta: 12.50   },
  { modelo: 'P7',     nombre: 'Arandela Grande de 3/4" x 2 1/2""',                           precio_venta: 30.00   },
  { modelo: 'P7',     nombre: 'Tornillo 14 mm',                                               precio_venta: 20.63   },
  { modelo: 'P7',     nombre: 'Arandelas de presion 9/16"',                                  precio_venta: 3.13    },
  { modelo: 'P7',     nombre: 'Tornillo 18mm X 50',                                           precio_venta: 43.13   },
  { modelo: 'P7',     nombre: 'Tuerca de Seguridad 18mm',                                    precio_venta: 18.75   },
  // ── Modelo P10 ────────────────────────────────────────────────────────────────
  { modelo: 'P10',    nombre: 'Placas 330 X 400',                                             precio_venta: 3887.50 },
  { modelo: 'P10',    nombre: 'Albardon de 120 X 120',                                        precio_venta: 0.00    },
  { modelo: 'P10',    nombre: 'Albardon 70 x 140',                                            precio_venta: 0.00    },
  { modelo: 'P10',    nombre: 'Placa Soporte chasis',                                         precio_venta: 1025.00 },
  { modelo: 'P10',    nombre: 'Juego Silenblocks',                                            precio_venta: 0.00    },
  { modelo: 'P10',    nombre: 'Tornillos de 5/16" X 1"',                                     precio_venta: 3.75    },
  { modelo: 'P10',    nombre: 'Tuercas de Seguridad 5/16"',                                  precio_venta: 2.00    },
  { modelo: 'P10',    nombre: 'Arandela de Presion de 5/16"',                                precio_venta: 0.75    },
  { modelo: 'P10',    nombre: 'Tornillos de 5/16" X 2"',                                     precio_venta: 5.00    },
  { modelo: 'P10',    nombre: 'Tornillos de 18mm X 125mm',                                   precio_venta: 140.00  },
  { modelo: 'P10',    nombre: 'Tuercas de Seguridad 18mm',                                   precio_venta: 18.75   },
  { modelo: 'P10',    nombre: 'Arandela Automotiva de 3/4"',                                 precio_venta: 12.50   },
  { modelo: 'P10',    nombre: 'Arandela Grande de 3/4" x 2 1/2""',                           precio_venta: 30.00   },
  { modelo: 'P10',    nombre: 'Tornillo 14 mm',                                               precio_venta: 20.63   },
  { modelo: 'P10',    nombre: 'Arandelas de presion 9/16"',                                  precio_venta: 3.13    },
  { modelo: 'P10',    nombre: 'Tornillo 18mm X 50',                                           precio_venta: 43.13   },
  { modelo: 'P10',    nombre: 'Tuerca de Seguridad 18mm',                                    precio_venta: 18.75   },
  // ── Modelo F16-80 ─────────────────────────────────────────────────────────────
  { modelo: 'F16-80', nombre: 'Placas Base 6X260X255MM',                                      precio_venta: 575.00  },
  { modelo: 'F16-80', nombre: 'Placa soporte 6X260X147',                                      precio_venta: 825.00  },
  { modelo: 'F16-80', nombre: 'Albardon de 8X80X50MM',                                        precio_venta: 37.50   },
  { modelo: 'F16-80', nombre: 'Albardon 8mmX140X70MM',                                        precio_venta: 87.50   },
  { modelo: 'F16-80', nombre: 'Placa Soporte chasis 3/8X100X160X240 CON CAR',                 precio_venta: 975.00  },
  { modelo: 'F16-80', nombre: 'Juego Silenblocks',                                            precio_venta: 5521.66 },
  { modelo: 'F16-80', nombre: 'Tornillos de 5/16" X 1"',                                     precio_venta: 3.75    },
  { modelo: 'F16-80', nombre: 'Tuercas de Seguridad 5/16"',                                  precio_venta: 2.00    },
  { modelo: 'F16-80', nombre: 'Arandela de Presion de 5/16"',                                precio_venta: 0.75    },
  { modelo: 'F16-80', nombre: 'Tornillos de 5/16" X 2"',                                     precio_venta: 5.00    },
  { modelo: 'F16-80', nombre: 'Tornillos de 1/2" X 4"',                                      precio_venta: 25.00   },
  { modelo: 'F16-80', nombre: 'Tuercas de Seguridad 1/2"',                                   precio_venta: 13.75   },
  { modelo: 'F16-80', nombre: 'Arandela Automotiva de 1/2" x1"',                             precio_venta: 8.13    },
  { modelo: 'F16-80', nombre: 'Arandela Grande de 1/2" X 2"',                                precio_venta: 30.00   },
  { modelo: 'F16-80', nombre: 'Tornillo 14 mm',                                               precio_venta: 20.63   },
  { modelo: 'F16-80', nombre: 'Arandelas de presion 9/16"',                                  precio_venta: 3.13    },
  { modelo: 'F16-80', nombre: 'Tornillo 18mm X 50',                                           precio_venta: 43.13   },
  { modelo: 'F16-80', nombre: 'Tuerca de Seguridad 18mm',                                    precio_venta: 18.75   },
  // ── Modelo F16-200 ────────────────────────────────────────────────────────────
  { modelo: 'F16-200', nombre: 'Placas 8X400X365MM',                                          precio_venta: 1062.50 },
  { modelo: 'F16-200', nombre: 'Placa Soporte chasis8x 400x100',                              precio_venta: 1050.00 },
  { modelo: 'F16-200', nombre: 'Albardon de 8X140X70MM',                                      precio_venta: 87.50   },
  { modelo: 'F16-200', nombre: 'Albardon 8X80X50MM',                                          precio_venta: 37.50   },
  { modelo: 'F16-200', nombre: 'Placa Soporte chasis 3/8X120X140X170CON CART.',               precio_venta: 1025.00 },
  { modelo: 'F16-200', nombre: 'Juego Silenblocks',                                           precio_venta: 5160.63 },
  { modelo: 'F16-200', nombre: 'Tornillos de 5/16" X 1"',                                    precio_venta: 3.75    },
  { modelo: 'F16-200', nombre: 'Tuercas de Seguridad 5/16"',                                 precio_venta: 2.00    },
  { modelo: 'F16-200', nombre: 'Arandela de Presion de 5/16"',                               precio_venta: 0.75    },
  { modelo: 'F16-200', nombre: 'Tornillos de 5/16" X 2"',                                    precio_venta: 5.00    },
  { modelo: 'F16-200', nombre: 'Tornillos de 18mm X 125mm',                                  precio_venta: 140.00  },
  { modelo: 'F16-200', nombre: 'Tuercas de Seguridad 18mm',                                  precio_venta: 18.75   },
  { modelo: 'F16-200', nombre: 'Arandela Automotiva de 3/4"',                                precio_venta: 12.50   },
  { modelo: 'F16-200', nombre: 'Arandela Grande de 3/4" x 2 1/2""',                          precio_venta: 30.00   },
  { modelo: 'F16-200', nombre: 'Tornillo 14 mm',                                              precio_venta: 20.63   },
  { modelo: 'F16-200', nombre: 'Arandelas de presion 9/16"',                                 precio_venta: 3.13    },
  { modelo: 'F16-200', nombre: 'Tornillo 18mm X 50',                                          precio_venta: 43.13   },
  { modelo: 'F16-200', nombre: 'Tuerca de Seguridad 18mm',                                   precio_venta: 18.75   },
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
