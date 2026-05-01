import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const refacciones = [
  // MATERIAL ELÉCTRICO
  { nombre: 'CAJA MECANICA', categoria: 'ELÉCTRICO', precio_venta: 15638.96, activo: true },
  { nombre: 'CAJA ELECTRONICA', categoria: 'ELÉCTRICO', precio_venta: 16708.29, activo: true },
  { nombre: 'PALANCA CONTROL', categoria: 'ELÉCTRICO', precio_venta: 4259.86, activo: true },
  { nombre: 'RELAY DE CORTE DE VELOCIDAD', categoria: 'ELÉCTRICO', precio_venta: 7922.66, activo: true },
  { nombre: 'CABLE 4 VIAS', categoria: 'ELÉCTRICO', precio_venta: 308.83, activo: true },
  { nombre: 'CABLE CALIBRE # 0 CORRIENTE GRUESO (01 X 2AWG (35 mm2))', categoria: 'ELÉCTRICO', precio_venta: 272.48, activo: true },
  { nombre: 'CABLE CALIBRE # 0 TIERRA DELGADO (01 X4AWG (25 mm2))', categoria: 'ELÉCTRICO', precio_venta: 133.67, activo: true },
  { nombre: 'CABLE 7 VIAS', categoria: 'ELÉCTRICO', precio_venta: 174.50, activo: true },
  { nombre: 'FOCO PILOTO', categoria: 'ELÉCTRICO', precio_venta: 217.50, activo: true },
  { nombre: 'KIT DE TERMINALES', categoria: 'ELÉCTRICO', precio_venta: 915.07, activo: true },
  { nombre: 'TORNILLOS SUJECCIÓN DE CAJA 5/16 * 1/2', categoria: 'TORNILLERÍA', precio_venta: 6.25, activo: true },
  { nombre: 'TUERCAS SUJECCIÓN DE CAJA 5/16 * 1/2', categoria: 'TORNILLERÍA', precio_venta: 2.49, activo: true },
  { nombre: 'ARANDELAS DE PRESION 5/16 * 1/2', categoria: 'TORNILLERÍA', precio_venta: 2.49, activo: true },
  { nombre: 'CABLE CALIBRE 14', categoria: 'ELÉCTRICO', precio_venta: 11.37, activo: true },
  { nombre: 'CABLE NEGATIVO CALIBRE 8', categoria: 'ELÉCTRICO', precio_venta: 58.01, activo: true },
  { nombre: 'CABLE CALIBRE 14 (Repetido en imagen)', categoria: 'ELÉCTRICO', precio_venta: 11.37, activo: true },
  { nombre: 'SENSOR DE ROSCA 4 VIAS', categoria: 'ELÉCTRICO', precio_venta: 2411.91, activo: true },
  { nombre: 'ARNES DE SENSOR ROSCA 4 VÍAS', categoria: 'ELÉCTRICO', precio_venta: 435.00, activo: true },
  { nombre: 'MANTA FOIL', categoria: 'ELÉCTRICO', precio_venta: 118.39, activo: true },
  { nombre: 'INTERRUPTOR COLA RATA REFORSADO', categoria: 'ELÉCTRICO', precio_venta: 346.49, activo: true },
  { nombre: 'CONECTOR 4 VIAS SENSOR DE CLIP', categoria: 'ELÉCTRICO', precio_venta: 435.00, activo: true },
  { nombre: 'FUSIBLE 1 AMP', categoria: 'ELÉCTRICO', precio_venta: 14.50, activo: true },
  { nombre: 'FUSIBLE 5 AMP', categoria: 'ELÉCTRICO', precio_venta: 14.50, activo: true },
  { nombre: 'FUSIBLE 300 AMP', categoria: 'ELÉCTRICO', precio_venta: 217.50, activo: true },
  { nombre: 'PORTAFUSIBLE', categoria: 'ELÉCTRICO', precio_venta: 139.88, activo: true },
  { nombre: 'POLIFLEX 1/2', categoria: 'ELÉCTRICO', precio_venta: 16.48, activo: true },
  { nombre: 'POLIFLEX 1/4', categoria: 'ELÉCTRICO', precio_venta: 8.19, activo: true },
  { nombre: 'POLIFLEX 3/4', categoria: 'ELÉCTRICO', precio_venta: 21.46, activo: true },
  { nombre: 'POLIFLEX 3/8', categoria: 'ELÉCTRICO', precio_venta: 10.71, activo: true },
  { nombre: 'CINCHOS', categoria: 'ELÉCTRICO', precio_venta: 2.88, activo: true },
  { nombre: 'CINTA DE AISLAR NEGRA', categoria: 'ELÉCTRICO', precio_venta: 20.66, activo: true },
  { nombre: 'CINTA DE AISLAR ROJA', categoria: 'ELÉCTRICO', precio_venta: 20.66, activo: true },
  { nombre: 'PINTURA NEGRA', categoria: 'MECÁNICO', precio_venta: 170.52, activo: true },
  { nombre: 'ALMEJA', categoria: 'ELÉCTRICO', precio_venta: 7.25, activo: true },
  { nombre: 'TERMINAL DE OJILLO 5/16 CAL 14', categoria: 'ELÉCTRICO', precio_venta: 1.31, activo: true },
  { nombre: 'TERMINAL DEL 18 CAL 10', categoria: 'ELÉCTRICO', precio_venta: 7.25, activo: true },
  { nombre: 'TERMINAL ENCHUFE FORRADA ROJA', categoria: 'ELÉCTRICO', precio_venta: 2.03, activo: true },
  { nombre: 'TERMINAL ESPADA CALIBRE 14', categoria: 'ELÉCTRICO', precio_venta: 1.45, activo: true },
  { nombre: 'TERMINAL OJILLO AZUL DE 1/4 MASA CAJA CONTACTORES', categoria: 'ELÉCTRICO', precio_venta: 1.51, activo: true },
  { nombre: 'TERMINALES DE OJILLO CAL "0" * 5/16', categoria: 'ELÉCTRICO', precio_venta: 15.20, activo: true },
  { nombre: 'TERMINALES DE OJILLO CAL 0 * 3/8', categoria: 'ELÉCTRICO', precio_venta: 15.95, activo: true },
  { nombre: 'TERMO CONTRACTIL 3/8', categoria: 'ELÉCTRICO', precio_venta: 10.88, activo: true },
  { nombre: 'TERMOCONTRACTIL DE 3/4" PARA CALIBRE 0', categoria: 'ELÉCTRICO', precio_venta: 36.25, activo: true },
  { nombre: 'TOPES CONECTOR', categoria: 'ELÉCTRICO', precio_venta: 1.79, activo: true },
  
  { nombre: 'CORTA CORRIENTE 250 AMP', categoria: 'ELÉCTRICO', precio_venta: 1015.00, activo: true },
  { nombre: 'CORTA CORRIENTE 300 AMP', categoria: 'ELÉCTRICO', precio_venta: 1342.24, activo: true },
  { nombre: 'PORTAMEGAFUSIBLE', categoria: 'ELÉCTRICO', precio_venta: 725.00, activo: true },
  { nombre: 'MEGAFUSIBLE 300 AMP', categoria: 'ELÉCTRICO', precio_venta: 531.16, activo: true },
  { nombre: 'RELAY HELLA 12 VOLT', categoria: 'ELÉCTRICO', precio_venta: 187.34, activo: true },
  { nombre: 'RELAY HELLA 24 VOLT', categoria: 'ELÉCTRICO', precio_venta: 232.00, activo: true },
  { nombre: 'PORTA RELE HELLA', categoria: 'ELÉCTRICO', precio_venta: 116.00, activo: true },
  { nombre: 'LUZ LED VERDE', categoria: 'ELÉCTRICO', precio_venta: 343.48, activo: true },
  { nombre: 'SENSOR DE ROSCA DE 2 VIAS', categoria: 'ELÉCTRICO', precio_venta: 1620.33, activo: true },
  { nombre: 'SENSOR DE VELOCIDAD CLIP 2 VIAS', categoria: 'ELÉCTRICO', precio_venta: 1775.67, activo: true },
  { nombre: 'SENSOR DE VELOCIDAD CLIP 4 VIAS', categoria: 'ELÉCTRICO', precio_venta: 2632.20, activo: true },
  { nombre: 'FUSIBLE CAJAS', categoria: 'ELÉCTRICO', precio_venta: 58.00, activo: true },
  { nombre: 'GRASERA RECTA DE 3/8', categoria: 'MECÁNICO', precio_venta: 33.06, activo: true },
  { nombre: 'KIT REPARACIÓN BOBINA DE COBRE', categoria: 'ELÉCTRICO', precio_venta: 343.48, activo: true },

  // SISTEMA NEHUMATICO
  { nombre: 'CONEXIÓN NEHUMATICA 1/4', categoria: 'NEUMÁTICO', precio_venta: 254.40, activo: true },
  { nombre: 'CONEXIÓN "T" NEHUMATICA 1/4', categoria: 'NEUMÁTICO', precio_venta: 469.80, activo: true },
  { nombre: 'MANGUERA DE 1/4', categoria: 'NEUMÁTICO', precio_venta: 113.44, activo: true },
  { nombre: 'CONEXIÓN NEHUMATICA 3/8', categoria: 'NEUMÁTICO', precio_venta: 275.50, activo: true },
  { nombre: 'CONEXIÓN "T" NEHUMATICA 3/8', categoria: 'NEUMÁTICO', precio_venta: 783.00, activo: true },
  { nombre: 'MANGUERA DE 3/8', categoria: 'NEUMÁTICO', precio_venta: 156.60, activo: true },
  { nombre: 'REDUCCIÓN BUSHING 3/8 A 1/4', categoria: 'NEUMÁTICO', precio_venta: 52.93, activo: true },
  { nombre: 'BULBO DE AIRE HOBS', categoria: 'NEUMÁTICO', precio_venta: 4227.69, activo: true },
  { nombre: 'KIT LUCES LED COMPLETO', categoria: 'ELÉCTRICO', precio_venta: 4930.00, activo: true },
];

async function run() {
  console.log('Borrando todas las refacciones existentes...');
  const { error: errorDelete } = await supabase.from('refacciones').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (errorDelete) {
    console.error('Error al borrar:', errorDelete.message);
    return;
  }
  
  console.log('Iniciando inserción en orden (con totales como precio de venta)...');
  for (const item of refacciones) {
    const { error } = await supabase.from('refacciones').insert(item);
    if (error) {
      console.error(`Error con ${item.nombre}:`, error.message);
    } else {
      console.log(`Insertado: ${item.nombre}`);
    }
  }
  console.log('Finalizado.');
}

run();
