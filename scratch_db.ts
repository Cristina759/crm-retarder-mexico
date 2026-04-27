import { supabaseAdmin } from './lib/supabase/admin';

async function check() {
  console.log('Checking if table "empresas" exists...');
  const { data, error } = await supabaseAdmin.from('empresas').select('*').limit(1);
  console.log('Result:', { data, error });

  if (error && error.message.includes('schema cache')) {
    console.log('Attempting to reload schema cache...');
    const { error: reloadErr } = await supabaseAdmin.rpc('reload_schema'); // if such function exists
    console.log('Reload result:', reloadErr);
  }
}

check();
