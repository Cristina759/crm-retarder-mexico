import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Material Eléctrico - precio_venta = TOTAL (precio + IVA). Orden exacto del Excel.
const materialElectrico = [
  // ── MATERIAL ELÉCTRICO ────────────────────────────────────────────────────────
  { nombre: 'CAJA MECANICA',                                        precio_venta: 15638.96 },
  { nombre: 'CAJA ELECTRONICA',                                     precio_venta: 16708.29 },
  { nombre: 'PALANCA CONTROL',                                      precio_venta: 4253.86  },
  { nombre: 'RELAY DE CORTE DE VELOCIDAD',                          precio_venta: 7322.66  },
  { nombre: 'CABLE 4 VIAS',                                         precio_venta: 308.63   },
  { nombre: 'CABLE CALIBRE #0 CORRIENTE GRUESO (01 X 2AWG 35 mm2)',precio_venta: 272.48   },
  { nombre: 'CABLE CALIBRE #0 TIERRA DELGADO (01 X4AWG 25 mm2)',   precio_venta: 133.67   },
  { nombre: 'CABLE 7 VIAS',                                         precio_venta: 174.50   },
  { nombre: 'FOCO PILOTO',                                          precio_venta: 217.50   },
  { nombre: 'KIT DE TERMINALES',                                    precio_venta: 915.07   },
  { nombre: 'TORNILLOS SUJECIÓN DE CAJA 5/16 *1/2',                precio_venta: 6.25     },
  { nombre: 'TUERCAS SUJECION DE CAJA 5/16 *1/2',                  precio_venta: 2.49     },
  { nombre: 'ARANDELAS DE PRESION 5/16 *1/2',                      precio_venta: 2.49     },
  { nombre: 'CABLE CALIBRE 14',                                     precio_venta: 11.37    },
  { nombre: 'CABLE NEGATIVO CALIBRE 8',                             precio_venta: 58.01    },
  { nombre: 'SENSOR DE ROSCA 4 VIAS',                               precio_venta: 2411.31  },
  { nombre: '#ONES DE SENSOR ROSCA 4 VIAS',                         precio_venta: 435.00   },
  { nombre: 'MANTA FOIL',                                           precio_venta: 118.39   },
  { nombre: 'INTERRUPTOR COLA RATA REFORSADO',                      precio_venta: 346.43   },
  { nombre: 'CONECTOR 4 VIAS SENSOR DE CLIP',                       precio_venta: 435.00   },
  { nombre: 'FUSIBLE 1AMP',                                         precio_venta: 14.50    },
  { nombre: 'FUSIBLE 5 AMP',                                        precio_venta: 14.50    },
  { nombre: 'FUSIBLE 300 AMP',                                      precio_venta: 217.50   },
  { nombre: 'PORTAFUSIBLE',                                         precio_venta: 139.88   },
  { nombre: 'POLIFLEX 1/2',                                         precio_venta: 16.48    },
  { nombre: 'POLIFLEX 1/4',                                         precio_venta: 8.19     },
  { nombre: 'POLIFLEX 3/4',                                         precio_venta: 21.46    },
  { nombre: 'POLIFLEX 3/8',                                         precio_venta: 10.71    },
  { nombre: 'CINCHOS',                                              precio_venta: 2.88     },
  { nombre: 'CINTA DE AISLAR NEGRA',                                precio_venta: 20.66    },
  { nombre: 'CINTA DE AISLAR ROJA',                                 precio_venta: 20.66    },
  { nombre: 'PINTURA NEGRA',                                        precio_venta: 170.52   },
  { nombre: 'ALMEJA',                                               precio_venta: 7.25     },
  { nombre: 'TERMINAL DE OJILLO 5/16 CAL 14',                      precio_venta: 1.31     },
  { nombre: 'TERMINAL DEL #8 CAL 10',                               precio_venta: 7.25     },
  { nombre: 'TERMINAL ENCHUFE FORRADA ROJA',                        precio_venta: 2.03     },
  { nombre: 'TERMINAL ESPADA CALIBRE #14',                          precio_venta: 1.45     },
  { nombre: 'TERMINAL OJILLO AZUL DE 1/4 MASA CAJA CONTACTORES',   precio_venta: 1.51     },
  { nombre: 'TERMINALES DE OJILLO CAL "0" * 5/16',                 precio_venta: 15.20    },
  { nombre: 'TERMINALES DE OJILLO CAL 0" 3/8',                     precio_venta: 15.95    },
  { nombre: 'TERMO CONTRACTIL 3/8',                                 precio_venta: 10.88    },
  { nombre: 'TERMOCONTRACTIL DE 3/4" PARA',                        precio_venta: 36.25    },
  { nombre: 'TOPES CONECTOR',                                       precio_venta: 1.73     },
  { nombre: 'CORTA CORRIENTE 250 AMP',                              precio_venta: 1015.00  },
  { nombre: 'CORTA CORRIENTE 300 AMP',                              precio_venta: 1342.24  },
  { nombre: 'PORTAMEGAFUSIBLE',                                     precio_venta: 725.00   },
  { nombre: 'MEGAFUSIBLE 300 AMP',                                  precio_venta: 531.16   },
  { nombre: 'RELAY HELLA 12 VOLT',                                  precio_venta: 187.34   },
  { nombre: 'RELAY HELLA 24 VOLT',                                  precio_venta: 232.00   },
  { nombre: 'PORTA RELE HELLA',                                     precio_venta: 116.00   },
  { nombre: 'LUZ LED VERDE',                                        precio_venta: 343.48   },
  { nombre: 'SENSOR DE ROSCA DE 2 VIAS',                            precio_venta: 1620.33  },
  { nombre: 'SENSOR DE VELOCIDAD CLIP 2 VIAS',                      precio_venta: 1775.67  },
  { nombre: 'SENSOR DE VELOCIDAD CLIP 4 VIAS',                      precio_venta: 2632.20  },
  { nombre: 'FUSIBLE CAJAS',                                        precio_venta: 58.00    },
  { nombre: 'GRASERA RECTA DE 3/8',                                 precio_venta: 33.06    },
  { nombre: 'KIT REPARACION BOBINA DE COBRE',                       precio_venta: 343.48   },
  // ── SISTEMA NEUMÁTICO ─────────────────────────────────────────────────────────
  { nombre: 'CONEXIÓN NEUMATICA 1/4',                               precio_venta: 254.40   },
  { nombre: 'CONEXIÓN "T" NEUMATICA 1/4',                           precio_venta: 469.80   },
  { nombre: 'MANGUERA DE 1/4',                                      precio_venta: 113.44   },
  { nombre: 'CONEXIÓN NEUMATICA 3/8',                               precio_venta: 275.50   },
  { nombre: 'CONEXIÓN "T" NEUMATICA 3/8',                           precio_venta: 783.00   },
  { nombre: 'MANGUERA 3/8',                                         precio_venta: 156.60   },
  { nombre: 'REDUCCIÓN BUSHING 3/8 A 1/4',                          precio_venta: 52.93    },
  { nombre: 'BULBO DE AIRE HOBS',                                   precio_venta: 4227.69  },
  { nombre: 'KIT LUCES LED COMPLETO',                               precio_venta: 4930.00  },
];

async function run() {
  console.log('Insertando Material Eléctrico...');
  let ok = 0, fail = 0;
  for (const item of materialElectrico) {
    const { error } = await supabase.from('refacciones').insert({
      nombre: item.nombre,
      categoria: 'MATERIAL ELÉCTRICO',
      precio_venta: item.precio_venta,
      activo: true,
    });
    if (error) { console.error(`✗ ${item.nombre}: ${error.message}`); fail++; }
    else        { console.log(`✓ ${item.nombre}`); ok++; }
  }
  console.log(`\nListo: ${ok} insertados, ${fail} errores.`);
}

run();
