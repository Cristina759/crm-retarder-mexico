import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const refacciones = [
  // ── MATERIAL ELÉCTRICO ────────────────────────────────────────────────────────
  { nombre: 'CAJA MECANICA',                                              categoria: 'ELÉCTRICO',    precio_venta: 15638.96 },
  { nombre: 'CAJA ELECTRONICA',                                           categoria: 'ELÉCTRICO',    precio_venta: 16708.29 },
  { nombre: 'PALANCA CONTROL',                                            categoria: 'ELÉCTRICO',    precio_venta: 4259.86  },
  { nombre: 'RELAY DE CORTE DE VELOCIDAD',                               categoria: 'ELÉCTRICO',    precio_venta: 7922.66  },
  { nombre: 'CABLE 4 VIAS',                                               categoria: 'ELÉCTRICO',    precio_venta: 308.83   },
  { nombre: 'CABLE CALIBRE # 0 CORRIENTE GRUESO (01 X 2AWG (35 mm2))',   categoria: 'ELÉCTRICO',    precio_venta: 272.48   },
  { nombre: 'CABLE CALIBRE # 0 TIERRA DELGADO (01 X4AWG (25 mm2))',      categoria: 'ELÉCTRICO',    precio_venta: 133.67   },
  { nombre: 'CABLE 7 VIAS',                                               categoria: 'ELÉCTRICO',    precio_venta: 174.50   },
  { nombre: 'FOCO PILOTO',                                                categoria: 'ELÉCTRICO',    precio_venta: 217.50   },
  { nombre: 'KIT DE TERMINALES',                                          categoria: 'ELÉCTRICO',    precio_venta: 915.07   },
  { nombre: 'TORNILLOS SUJECCIÓN DE CAJA 5/16 * 1/2',                   categoria: 'TORNILLERÍA',  precio_venta: 6.25     },
  { nombre: 'TUERCAS SUJECCIÓN DE CAJA 5/16 * 1/2',                     categoria: 'TORNILLERÍA',  precio_venta: 2.49     },
  { nombre: 'ARANDELAS DE PRESION 5/16 * 1/2',                          categoria: 'TORNILLERÍA',  precio_venta: 2.49     },
  { nombre: 'CABLE CALIBRE 14',                                           categoria: 'ELÉCTRICO',    precio_venta: 11.37    },
  { nombre: 'CABLE NEGATIVO CALIBRE 8',                                   categoria: 'ELÉCTRICO',    precio_venta: 58.01    },
  { nombre: 'SENSOR DE ROSCA 4 VIAS',                                     categoria: 'ELÉCTRICO',    precio_venta: 2411.91  },
  { nombre: 'ARNES DE SENSOR ROSCA 4 VÍAS',                              categoria: 'ELÉCTRICO',    precio_venta: 435.00   },
  { nombre: 'MANTA FOIL',                                                 categoria: 'ELÉCTRICO',    precio_venta: 118.39   },
  { nombre: 'INTERRUPTOR COLA RATA REFORSADO',                            categoria: 'ELÉCTRICO',    precio_venta: 346.49   },
  { nombre: 'CONECTOR 4 VIAS SENSOR DE CLIP',                            categoria: 'ELÉCTRICO',    precio_venta: 435.00   },
  { nombre: 'FUSIBLE 1 AMP',                                              categoria: 'ELÉCTRICO',    precio_venta: 14.50    },
  { nombre: 'FUSIBLE 5 AMP',                                              categoria: 'ELÉCTRICO',    precio_venta: 14.50    },
  { nombre: 'FUSIBLE 300 AMP',                                            categoria: 'ELÉCTRICO',    precio_venta: 217.50   },
  { nombre: 'PORTAFUSIBLE',                                               categoria: 'ELÉCTRICO',    precio_venta: 139.88   },
  { nombre: 'POLIFLEX 1/2',                                               categoria: 'ELÉCTRICO',    precio_venta: 16.48    },
  { nombre: 'POLIFLEX 1/4',                                               categoria: 'ELÉCTRICO',    precio_venta: 8.19     },
  { nombre: 'POLIFLEX 3/4',                                               categoria: 'ELÉCTRICO',    precio_venta: 21.46    },
  { nombre: 'POLIFLEX 3/8',                                               categoria: 'ELÉCTRICO',    precio_venta: 10.71    },
  { nombre: 'CINCHOS',                                                     categoria: 'ELÉCTRICO',    precio_venta: 2.88     },
  { nombre: 'CINTA DE AISLAR NEGRA',                                       categoria: 'ELÉCTRICO',    precio_venta: 20.66    },
  { nombre: 'CINTA DE AISLAR ROJA',                                        categoria: 'ELÉCTRICO',    precio_venta: 20.66    },
  { nombre: 'PINTURA NEGRA',                                               categoria: 'MECÁNICO',     precio_venta: 170.52   },
  { nombre: 'ALMEJA',                                                      categoria: 'ELÉCTRICO',    precio_venta: 7.25     },
  { nombre: 'TERMINAL DE OJILLO 5/16 CAL 14',                            categoria: 'ELÉCTRICO',    precio_venta: 1.31     },
  { nombre: 'TERMINAL DEL 18 CAL 10',                                     categoria: 'ELÉCTRICO',    precio_venta: 7.25     },
  { nombre: 'TERMINAL ENCHUFE FORRADA ROJA',                              categoria: 'ELÉCTRICO',    precio_venta: 2.03     },
  { nombre: 'TERMINAL ESPADA CALIBRE 14',                                 categoria: 'ELÉCTRICO',    precio_venta: 1.45     },
  { nombre: 'TERMINAL OJILLO AZUL DE 1/4 MASA CAJA CONTACTORES',        categoria: 'ELÉCTRICO',    precio_venta: 1.51     },
  { nombre: 'TERMINALES DE OJILLO CAL "0" * 5/16',                       categoria: 'ELÉCTRICO',    precio_venta: 15.20    },
  { nombre: 'TERMINALES DE OJILLO CAL 0 * 3/8',                          categoria: 'ELÉCTRICO',    precio_venta: 15.95    },
  { nombre: 'TERMO CONTRACTIL 3/8',                                       categoria: 'ELÉCTRICO',    precio_venta: 10.88    },
  { nombre: 'TERMOCONTRACTIL DE 3/4" PARA CALIBRE 0',                    categoria: 'ELÉCTRICO',    precio_venta: 36.25    },
  { nombre: 'TOPES CONECTOR',                                              categoria: 'ELÉCTRICO',    precio_venta: 1.79     },
  { nombre: 'CORTA CORRIENTE 250 AMP',                                    categoria: 'ELÉCTRICO',    precio_venta: 1015.00  },
  { nombre: 'CORTA CORRIENTE 300 AMP',                                    categoria: 'ELÉCTRICO',    precio_venta: 1342.24  },
  { nombre: 'PORTAMEGAFUSIBLE',                                            categoria: 'ELÉCTRICO',    precio_venta: 725.00   },
  { nombre: 'MEGAFUSIBLE 300 AMP',                                         categoria: 'ELÉCTRICO',    precio_venta: 531.16   },
  { nombre: 'RELAY HELLA 12 VOLT',                                         categoria: 'ELÉCTRICO',    precio_venta: 187.34   },
  { nombre: 'RELAY HELLA 24 VOLT',                                         categoria: 'ELÉCTRICO',    precio_venta: 232.00   },
  { nombre: 'PORTA RELE HELLA',                                            categoria: 'ELÉCTRICO',    precio_venta: 116.00   },
  { nombre: 'LUZ LED VERDE',                                               categoria: 'ELÉCTRICO',    precio_venta: 343.48   },
  { nombre: 'SENSOR DE ROSCA DE 2 VIAS',                                   categoria: 'ELÉCTRICO',    precio_venta: 1620.33  },
  { nombre: 'SENSOR DE VELOCIDAD CLIP 2 VIAS',                            categoria: 'ELÉCTRICO',    precio_venta: 1775.67  },
  { nombre: 'SENSOR DE VELOCIDAD CLIP 4 VIAS',                            categoria: 'ELÉCTRICO',    precio_venta: 2632.20  },
  { nombre: 'FUSIBLE CAJAS',                                               categoria: 'ELÉCTRICO',    precio_venta: 58.00    },
  { nombre: 'GRASERA RECTA DE 3/8',                                        categoria: 'MECÁNICO',     precio_venta: 33.06    },
  { nombre: 'KIT REPARACIÓN BOBINA DE COBRE',                             categoria: 'ELÉCTRICO',    precio_venta: 343.48   },

  // ── SISTEMA NEUMÁTICO ─────────────────────────────────────────────────────────
  { nombre: 'CONEXIÓN NEHUMATICA 1/4',        categoria: 'NEUMÁTICO', precio_venta: 254.40   },
  { nombre: 'CONEXIÓN "T" NEHUMATICA 1/4',   categoria: 'NEUMÁTICO', precio_venta: 469.80   },
  { nombre: 'MANGUERA DE 1/4',               categoria: 'NEUMÁTICO', precio_venta: 113.44   },
  { nombre: 'CONEXIÓN NEHUMATICA 3/8',        categoria: 'NEUMÁTICO', precio_venta: 275.50   },
  { nombre: 'CONEXIÓN "T" NEHUMATICA 3/8',   categoria: 'NEUMÁTICO', precio_venta: 783.00   },
  { nombre: 'MANGUERA DE 3/8',               categoria: 'NEUMÁTICO', precio_venta: 156.60   },
  { nombre: 'REDUCCIÓN BUSHING 3/8 A 1/4',   categoria: 'NEUMÁTICO', precio_venta: 52.93    },
  { nombre: 'BULBO DE AIRE HOBS',             categoria: 'NEUMÁTICO', precio_venta: 4227.69  },
  { nombre: 'KIT LUCES LED COMPLETO',         categoria: 'ELÉCTRICO', precio_venta: 4930.00  },

  // ── TORNILLERÍA ───────────────────────────────────────────────────────────────
  // Precios tomados de columna "X Cantidad" del Excel
  { nombre: 'Tornillos de 5/16" X 1"',                                   categoria: 'TORNILLERÍA', precio_venta: 3.75   },
  { nombre: 'Tuercas de Seguridad 5/16"',                                categoria: 'TORNILLERÍA', precio_venta: 2.00   },
  { nombre: 'Arandela de Presion de 5/16"',                              categoria: 'TORNILLERÍA', precio_venta: 0.75   },
  { nombre: 'Tornillos de 5/16" X 2"',                                   categoria: 'TORNILLERÍA', precio_venta: 5.00   },
  { nombre: 'Tornillos de 12MM x 90mm',                                  categoria: 'TORNILLERÍA', precio_venta: 25.00  },
  { nombre: 'Tuercas de Seguridad 12MM',                                 categoria: 'TORNILLERÍA', precio_venta: 13.75  },
  { nombre: 'Arandela Automotiva de 1/2" x1°',                          categoria: 'TORNILLERÍA', precio_venta: 8.13   },
  { nombre: 'Arandela Grande de 1/2"X 2°',                              categoria: 'TORNILLERÍA', precio_venta: 30.00  },
  { nombre: 'Tornillo 14 mm',                                             categoria: 'TORNILLERÍA', precio_venta: 20.63  },
  { nombre: 'Arandelas de presion 9/16"',                                categoria: 'TORNILLERÍA', precio_venta: 3.13   },
  { nombre: 'Tornillo 18mm X 50',                                         categoria: 'TORNILLERÍA', precio_venta: 43.13  },
  { nombre: 'Tuerca de Seguridad 18mm',                                   categoria: 'TORNILLERÍA', precio_venta: 18.75  },
  { nombre: 'Tornillos de 18mm X 120mm grado 9.8 paso 1.50',            categoria: 'TORNILLERÍA', precio_venta: 140.00 },
  { nombre: 'Tuercas de Seguridad 18mm paso 1.50',                       categoria: 'TORNILLERÍA', precio_venta: 18.75  },
  { nombre: 'Arandela Automotiva de 3/4"',                               categoria: 'TORNILLERÍA', precio_venta: 12.50  },
  { nombre: 'Arandela Grande de 3/4"x 2 1/2"°',                         categoria: 'TORNILLERÍA', precio_venta: 30.00  },
  { nombre: 'Tornillos de 18mm X 125mm',                                  categoria: 'TORNILLERÍA', precio_venta: 140.00 },
  { nombre: 'Tornillo 3/4" X 2"',                                         categoria: 'TORNILLERÍA', precio_venta: 42.50  },
  { nombre: 'Tuerca de Seguridad 3/4"',                                   categoria: 'TORNILLERÍA', precio_venta: 47.75  },
  { nombre: 'Tornillos de 1/2" X 4"',                                     categoria: 'TORNILLERÍA', precio_venta: 25.00  },
  { nombre: 'Tuercas de Seguridad 1/2"',                                  categoria: 'TORNILLERÍA', precio_venta: 13.75  },
];

async function run() {
  console.log('Borrando TODAS las refacciones...');
  const { error: delErr } = await supabase
    .from('refacciones')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) { console.error('Error al borrar:', delErr.message); return; }

  console.log('Insertando en orden...');
  for (const item of refacciones) {
    const { error } = await supabase.from('refacciones').insert({ ...item, activo: true });
    if (error) console.error(`✗ ${item.nombre}:`, error.message);
    else        console.log(`✓ ${item.nombre}`);
  }
  console.log('Listo.');
}

run();
