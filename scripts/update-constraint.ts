import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Supabase REST API no permite DDL directamente, pero podemos usar la función rpc
// Primero verificamos qué constraint existe
async function run() {
  // Intentamos insertar con MECÁNICO (categoría válida) para confirmar conexión
  const { data, error } = await supabase
    .rpc('exec_sql', { 
      sql: `ALTER TABLE refacciones DROP CONSTRAINT IF EXISTS ref_categoria_check; 
            ALTER TABLE refacciones ADD CONSTRAINT ref_categoria_check 
            CHECK (categoria IN ('ELÉCTRICO','NEUMÁTICO','TORNILLERÍA','MECÁNICO','SOPORTERÍA','CARDANES'));`
    });
  
  if (error) {
    console.log('RPC no disponible, intentando método alternativo...');
    console.log('Error:', error.message);
    
    // Método alternativo: usar MECÁNICO como categoria y actualizarlo con raw SQL
    // Para Supabase, necesitamos ir al dashboard SQL editor manualmente
    console.log('\n=== EJECUTA ESTO EN EL SQL EDITOR DE SUPABASE ===');
    console.log(`ALTER TABLE refacciones DROP CONSTRAINT IF EXISTS ref_categoria_check;`);
    console.log(`ALTER TABLE refacciones ADD CONSTRAINT ref_categoria_check`);
    console.log(`CHECK (categoria IN ('ELÉCTRICO','NEUMÁTICO','TORNILLERÍA','MECÁNICO','SOPORTERÍA','CARDANES'));`);
  } else {
    console.log('Constraint actualizado exitosamente:', data);
  }
}

run();
