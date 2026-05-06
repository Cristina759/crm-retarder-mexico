import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Tabulador de Mano de Obra - TGR column, todos bajo MECÁNICO según Excel
const manoDeObra = [
  // ── MECANICO ──────────────────────────────────────────────────────────────────
  { nombre: 'LIMPIEZA DE FRENOS SIN DESARMAR',                                                        categoria: 'MECÁNICO', precio: 400.00   },
  { nombre: 'INSTALACION MECANICA O REINSTALACION DE FRENO',                                          categoria: 'MECÁNICO', precio: 3500.00  },
  { nombre: 'SOLO BAJAR PURO FRENO',                                                                   categoria: 'MECÁNICO', precio: 1500.00  },
  { nombre: 'CAMBIO DE SOPORTE DE CHASIS TIPO "L" C/U',                                               categoria: 'MECÁNICO', precio: 400.00   },
  { nombre: 'CAMBIO DE ROTOR FRENO INSTALADO C/U',                                                    categoria: 'MECÁNICO', precio: 600.00   },
  { nombre: 'MONTAJE DE FRENO (AXIAL) COMPLETO CON KIT DE CONTROL',                                   categoria: 'MECÁNICO', precio: 6000.00  },
  { nombre: 'CAMBIO DE SILENTBLOKS',                                                                   categoria: 'MECÁNICO', precio: 2500.00  },
  { nombre: 'CAMBIO DE RETEN DE FRENO',                                                                categoria: 'MECÁNICO', precio: 700.00   },
  { nombre: 'CAMBIO O REPARARCION DE ARNES INTERIOR (CONEXIÓN)',                                      categoria: 'MECÁNICO', precio: 500.00   },
  { nombre: 'BAJAR CARDANES Y DESCONECTAR ARNESES DE FRENO',                                          categoria: 'MECÁNICO', precio: 750.00   },
  { nombre: 'MONTAJE DE CARDANES Y ARNESES DE FRENO',                                                 categoria: 'MECÁNICO', precio: 750.00   },
  { nombre: 'CAMBIO DE PLACAS LATERALES C/U',                                                         categoria: 'MECÁNICO', precio: 300.00   },
  { nombre: 'DESARMADO DE FRENO QUITANDO BOBINAS (SIEMPRE Y CUANDO SALGAN)',                          categoria: 'MECÁNICO', precio: 1000.00  },
  { nombre: 'REPARACION DE FRENO (BALEROS, RETENES Y CASQUILLOS, REPARACION ARMADO) SIN BOBINAS',    categoria: 'MECÁNICO', precio: 2500.00  },
  { nombre: 'CAMBIO O REPARACION ARNES INTERIOR (CONEXIÓN)',                                          categoria: 'MECÁNICO', precio: 500.00   },
  { nombre: 'CAMBIO KIT DE ENGRASE SISTEMA DE LUBRICACION',                                           categoria: 'MECÁNICO', precio: 570.00   },
  { nombre: 'CAMBIO DE 1 KIT DE REPARACION DE BOBINA',                                                categoria: 'MECÁNICO', precio: 200.00   },
  { nombre: 'REPARACION DE CUERDA DE FRENO O PLACA LATERAL C/U',                                     categoria: 'MECÁNICO', precio: 100.00   },
  { nombre: 'REFRESCO, CUERDAS DE TORNILLOS, DE CRUCETA C/U',                                        categoria: 'MECÁNICO', precio: 100.00   },
  { nombre: 'CAMBIO SEGUROS DE CRUCETAS',                                                              categoria: 'MECÁNICO', precio: 200.00   },
  { nombre: 'CAMBIO DE CRUCETA',                                                                       categoria: 'MECÁNICO', precio: 500.00   },
  { nombre: 'CAMBIO DE BOBINA C/U',                                                                   categoria: 'MECÁNICO', precio: 300.00   },
  { nombre: 'CAMBIO DE PLACA POLAR C/U',                                                              categoria: 'MECÁNICO', precio: 200.00   },
  { nombre: 'CALIBRACION ENTRE HIERRO ROTOR',                                                         categoria: 'MECÁNICO', precio: 550.00   },
  { nombre: 'BAJAR Y SUBIR CARDANES LADO DE FRENO CAJA Y DIFERENCIAL',                               categoria: 'MECÁNICO', precio: 1500.00  },
  { nombre: 'CAMBIO TORNILLO PLATO ACOPLE C/U',                                                       categoria: 'MECÁNICO', precio: 75.00    },
  { nombre: 'DESINSTALACION FRENO (CON ARNES)',                                                       categoria: 'MECÁNICO', precio: 2500.00  },
  { nombre: 'CAMBIO DE TERMINALES',                                                                    categoria: 'ELÉCTRICO', precio: 200.00  },
  { nombre: 'RECONEXIÓN ELECTRICA',                                                                   categoria: 'ELÉCTRICO', precio: 200.00  },
  { nombre: 'SUBIR FRENO',                                                                             categoria: 'MECÁNICO', precio: 750.00   },
  { nombre: 'CAMBIO CORTA CORRIENTE',                                                                  categoria: 'ELÉCTRICO', precio: 350.00  },
];

async function run() {
  console.log('Borrando toda la mano de obra existente...');
  const { error: delErr } = await supabase
    .from('mano_de_obra')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (delErr) { console.error('Error al borrar:', delErr.message); return; }

  console.log('Insertando en orden...');
  let ok = 0, fail = 0;
  for (const item of manoDeObra) {
    const { error } = await supabase.from('mano_de_obra').insert({ ...item, activo: true });
    if (error) { console.error(`✗ ${item.nombre}: ${error.message}`); fail++; }
    else        { console.log(`✓ ${item.nombre}`); ok++; }
  }
  console.log(`\nListo: ${ok} insertados, ${fail} errores.`);
}

run();
