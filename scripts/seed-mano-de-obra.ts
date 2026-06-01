import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Tabulador de Mano de Obra - TGR column - orden exacto del Excel
const manoDeObra = [
  // ── ELÉCTRICO ─────────────────────────────────────────────────────────────────
  { nombre: 'SERVICIO PREVENTIVO',                                                                                    categoria: 'ELÉCTRICO',         precio: 4250.00 },
  { nombre: 'CAMBIO Y RECONECTAR RELEY DE CORTE O VELOCIDAD /RELEVADOR)',                                            categoria: 'ELÉCTRICO',         precio: 300.00  },
  { nombre: 'CAMBIO DE BULBO DE AIRE',                                                                               categoria: 'ELÉCTRICO',         precio: 300.00  },
  { nombre: 'CAMBIO PALANCA',                                                                                         categoria: 'ELÉCTRICO',         precio: 300.00  },
  { nombre: 'CAMBIO CAJA DE CONTACTORES',                                                                            categoria: 'ELÉCTRICO',         precio: 600.00  },
  { nombre: 'CAMBIO CAJA ELECTRONICA',                                                                               categoria: 'ELÉCTRICO',         precio: 800.00  },
  { nombre: 'CAMBIO DE FOCO PILOTO',                                                                                 categoria: 'ELÉCTRICO',         precio: 100.00  },
  { nombre: 'REPARACION ARNES SENSOR VELOCIDAD',                                                                     categoria: 'ELÉCTRICO',         precio: 150.00  },
  { nombre: 'CAMBIO DE SENSOR DE VELOCIDAD',                                                                         categoria: 'ELÉCTRICO',         precio: 350.00  },
  { nombre: 'CAMBIO ARNES CORRIENTE (CAL 0) (CAJA CONTACTORES)(BATERIA POSITIVO)',                                   categoria: 'ELÉCTRICO',         precio: 250.00  },
  { nombre: 'CAMBIO ARNES DE TIERRA (CAL 8) REPARACION DE MAZA NEGATIVO',                                           categoria: 'ELÉCTRICO',         precio: 250.00  },
  { nombre: 'CAMBIO DE ARNES (7 VIAS)',                                                                               categoria: 'ELÉCTRICO',         precio: 800.00  },
  { nombre: 'CAMBIO DE ARNES DE POTENCIA (4 VIAS)',                                                                  categoria: 'ELÉCTRICO',         precio: 350.00  },
  { nombre: 'CAMBIO DE ARNES TIERRA (DE FRENO A BATERIAS) REP. O FAB. MAZA NEGATIVO',                               categoria: 'ELÉCTRICO',         precio: 250.00  },
  { nombre: 'REPARACION DE ARNES DE CONTROL (CAMBIO DE TERMINALES) 4 LINEAS BLOCK CONEXIÓN',                        categoria: 'ELÉCTRICO',         precio: 150.00  },
  { nombre: 'SISTEMA DE CONTROL COMPLETO CAJA MECANICA',                                                            categoria: 'ELÉCTRICO',         precio: 2000.00 },
  { nombre: 'FABRICACION LINEAS SENSOR C/CONECTOR',                                                                 categoria: 'ELÉCTRICO',         precio: 150.00  },
  { nombre: 'SISTEMA DE CONTROL COMPLETO CAJA ELECTRONICA',                                                         categoria: 'ELÉCTRICO',         precio: 2500.00 },
  { nombre: 'CAMBIO DE INTERRUPTOR',                                                                                 categoria: 'ELÉCTRICO',         precio: 150.00  },
  { nombre: 'CAMBIO DE BLOCK CONEXIONES',                                                                            categoria: 'ELÉCTRICO',         precio: 400.00  },
  { nombre: 'REPARACION LINEAS DE TABLERO',                                                                          categoria: 'ELÉCTRICO',         precio: 200.00  },
  { nombre: 'REPARACION LINEAS DE TABLERO ALIMENTACION O PORT FUSIBLE',                                             categoria: 'ELÉCTRICO',         precio: 200.00  },
  { nombre: 'REPARACION ARNES DE 7 VIAS (SIN Realizar cambio completo)',                                            categoria: 'ELÉCTRICO',         precio: 250.00  },
  { nombre: 'REPARACION CAJA CONTACTORES',                                                                           categoria: 'ELÉCTRICO',         precio: 300.00  },
  { nombre: 'CAMBIO DE MEGA FUSIBLE O PORTA MEGA FUSIBLE',                                                          categoria: 'ELÉCTRICO',         precio: 200.00  },
  { nombre: 'INSTALACION DE SISTEMA ELECTRICO COMPLETO',                                                            categoria: 'ELÉCTRICO',         precio: 3000.00 },
  { nombre: 'REVISIÓN DE CONSUMOS',                                                                                  categoria: 'ELÉCTRICO',         precio: 500.00  },
  // ── SISTEMA NEUMÁTICO ─────────────────────────────────────────────────────────
  { nombre: 'INSTALACIÓN SISTEMA NEUMATICO',                                                                         categoria: 'NEUMÁTICO', precio: 1000.00 },
  { nombre: 'REPARACION SISTEMA NEUMATICO (BULBO)',                                                                  categoria: 'NEUMÁTICO', precio: 300.00  },
  { nombre: 'CAMBIO MANGUERA',                                                                                        categoria: 'NEUMÁTICO', precio: 250.00  },
  { nombre: 'KIT DE LUCES LED',                                                                                       categoria: 'NEUMÁTICO', precio: 4250.00 },
  // ── MECÁNICO ──────────────────────────────────────────────────────────────────
  { nombre: 'LIMPIEZA DE FRENOS SIN DESARMAR',                                                                       categoria: 'MECÁNICO',          precio: 400.00  },
  { nombre: 'INSTALACION MECANICA O REINSTALACION DE FRENO',                                                         categoria: 'MECÁNICO',          precio: 3500.00 },
  { nombre: 'SOLO BAJAR PURO FRENO',                                                                                  categoria: 'MECÁNICO',          precio: 1500.00 },
  { nombre: 'CAMBIO DE SOPORTE DE CHASIS TIPO "L" C/U',                                                             categoria: 'MECÁNICO',          precio: 400.00  },
  { nombre: 'CAMBIO DE ROTOR FRENO INSTALADO C/U',                                                                  categoria: 'MECÁNICO',          precio: 600.00  },
  { nombre: 'MONTAJE DE FRENO (AXIAL) COMPLETO CON KIT DE CONTROL',                                                 categoria: 'MECÁNICO',          precio: 6000.00 },
  { nombre: 'CAMBIO DE SILENTBLOKS',                                                                                  categoria: 'MECÁNICO',          precio: 2500.00 },
  { nombre: 'CAMBIO DE RETEN DE FRENO',                                                                               categoria: 'MECÁNICO',          precio: 700.00  },
  { nombre: 'CAMBIO O REPARARCION DE ARNES INTERIOR (CONEXIÓN)',                                                     categoria: 'MECÁNICO',          precio: 500.00  },
  { nombre: 'BAJAR CARDANES Y DESCONECTAR ARNESES DE FRENO',                                                        categoria: 'MECÁNICO',          precio: 750.00  },
  { nombre: 'MONTAJE DE CARDANES Y ARNESES DE FRENO',                                                                categoria: 'MECÁNICO',          precio: 750.00  },
  { nombre: 'CAMBIO DE PLACAS LATERALES C/U',                                                                        categoria: 'MECÁNICO',          precio: 300.00  },
  { nombre: 'DESARMADO DE FRENO QUITANDO BOBINAS (SIEMPRE Y CUANDO SALGAN)',                                         categoria: 'MECÁNICO',          precio: 1000.00 },
  { nombre: 'REPARACION DE FRENO (BALEROS, RETENES Y CASQUILLOS, REPARACION ARMADO) SIN BOBINAS',                   categoria: 'MECÁNICO',          precio: 2500.00 },
  { nombre: 'CAMBIO O REPARACION ARNES INTERIOR (CONEXIÓN)',                                                         categoria: 'MECÁNICO',          precio: 500.00  },
  { nombre: 'CAMBIO KIT DE ENGRASE SISTEMA DE LUBRICACION',                                                          categoria: 'MECÁNICO',          precio: 570.00  },
  { nombre: 'CAMBIO DE 1 KIT DE REPARACION DE BOBINA',                                                              categoria: 'MECÁNICO',          precio: 200.00  },
  { nombre: 'REPARACION DE CUERDA DE FRENO O PLACA LATERAL C/U',                                                    categoria: 'MECÁNICO',          precio: 100.00  },
  { nombre: 'REFRESCO, CUERDAS DE TORNILLOS, DE CRUCETA C/U',                                                       categoria: 'MECÁNICO',          precio: 100.00  },
  { nombre: 'CAMBIO SEGUROS DE CRUCETAS',                                                                             categoria: 'MECÁNICO',          precio: 200.00  },
  { nombre: 'CAMBIO DE CRUCETA',                                                                                      categoria: 'MECÁNICO',          precio: 500.00  },
  { nombre: 'CAMBIO DE BOBINA C/U',                                                                                  categoria: 'MECÁNICO',          precio: 300.00  },
  { nombre: 'CAMBIO DE PLACA POLAR C/U',                                                                             categoria: 'MECÁNICO',          precio: 200.00  },
  { nombre: 'CALIBRACION ENTRE HIERRO ROTOR',                                                                        categoria: 'MECÁNICO',          precio: 550.00  },
  { nombre: 'BAJAR Y SUBIR CARDANES LADO DE FRENO CAJA Y DIFERENCIAL',                                              categoria: 'MECÁNICO',          precio: 1500.00 },
  { nombre: 'CAMBIO TORNILLO PLATO ACOPLE C/U',                                                                      categoria: 'MECÁNICO',          precio: 75.00   },
  { nombre: 'DESINSTALACION FRENO (CON ARNES)',                                                                      categoria: 'MECÁNICO',          precio: 2500.00 },
  { nombre: 'CAMBIO DE TERMINALES',                                                                                   categoria: 'MECÁNICO',          precio: 200.00  },
  { nombre: 'RECONEXIÓN ELECTRICA',                                                                                  categoria: 'MECÁNICO',          precio: 200.00  },
  { nombre: 'SUBIR FRENO',                                                                                            categoria: 'MECÁNICO',          precio: 750.00  },
  { nombre: 'CAMBIO CORTA CORRIENTE',                                                                                 categoria: 'MECÁNICO',          precio: 350.00  },
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
