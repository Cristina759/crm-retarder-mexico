import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const refacciones = [
  { nombre: 'Tornillos de 5/16" X 1"', categoria: 'TORNILLERÍA', precio_venta: 3.75, activo: true },
  { nombre: 'Tuercas de Seguridad 5/16"', categoria: 'TORNILLERÍA', precio_venta: 2.00, activo: true },
  { nombre: 'Arandela de Presion de 5/16"', categoria: 'TORNILLERÍA', precio_venta: 0.75, activo: true },
  { nombre: 'Tornillos de 5/16" X 2"', categoria: 'TORNILLERÍA', precio_venta: 5.00, activo: true },
  { nombre: 'Tornillos de 12MM x 90mm', categoria: 'TORNILLERÍA', precio_venta: 25.00, activo: true },
  { nombre: 'Tuercas de Seguridad 12MM', categoria: 'TORNILLERÍA', precio_venta: 13.75, activo: true },
  { nombre: 'Arandela Automotiva de 1/2" x1°', categoria: 'TORNILLERÍA', precio_venta: 8.13, activo: true },
  { nombre: 'Arandela Grande de 1/2"X 2°', categoria: 'TORNILLERÍA', precio_venta: 30.00, activo: true },
  { nombre: 'Tornillo 14 mm', categoria: 'TORNILLERÍA', precio_venta: 20.63, activo: true },
  { nombre: 'Arandelas de presion 9/16"', categoria: 'TORNILLERÍA', precio_venta: 3.13, activo: true },
  { nombre: 'Tornillo 18mm X 50', categoria: 'TORNILLERÍA', precio_venta: 43.13, activo: true },
  { nombre: 'Tuerca de Seguridad 18mm', categoria: 'TORNILLERÍA', precio_venta: 18.75, activo: true },
  { nombre: 'Tornillos de 18mm X 120mm grado 9.8 paso 1.50', categoria: 'TORNILLERÍA', precio_venta: 140.00, activo: true },
  { nombre: 'Tuercas de Seguridad 18mm paso 1.50', categoria: 'TORNILLERÍA', precio_venta: 18.75, activo: true },
  { nombre: 'Arandela Automotiva de 3/4"', categoria: 'TORNILLERÍA', precio_venta: 12.50, activo: true },
  { nombre: 'Arandela Grande de 3/4"x 2 1/2"°', categoria: 'TORNILLERÍA', precio_venta: 30.00, activo: true },
  { nombre: 'Tornillos de 18mm X 125mm', categoria: 'TORNILLERÍA', precio_venta: 140.00, activo: true },
  { nombre: 'Tornillo 3/4" X 2"', categoria: 'TORNILLERÍA', precio_venta: 42.50, activo: true },
  { nombre: 'Tuerca de Seguridad 3/4"', categoria: 'TORNILLERÍA', precio_venta: 47.75, activo: true },
  { nombre: 'Tornillos de 1/2" X 4"', categoria: 'TORNILLERÍA', precio_venta: 25.00, activo: true },
  { nombre: 'Tuercas de Seguridad 1/2"', categoria: 'TORNILLERÍA', precio_venta: 13.75, activo: true },
  { nombre: 'JUEGO DE SILENBLOCK MARCA KLAM', categoria: 'MECÁNICO', precio_venta: 0.00, activo: true }
];

async function run() {
  console.log('Iniciando inserción de tornillería sin borrar los anteriores...');
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
