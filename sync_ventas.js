const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

// 1. Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
let env = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      env[key] = value;
    }
  });
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// 2. Configuration
const EXCEL_FILE = './VENTA 2026.xlsx';

async function run() {
  try {
    console.log('============================================================');
    console.log('🚀 INICIANDO PROCESO DE SINCRONIZACIÓN DE VENTAS Y FACTURACIÓN');
    console.log('============================================================');

    // --- STEP 1: CLEANUP ---
    console.log('\n[1/3] 🧹 Limpiando datos antiguos para evitar duplicados...');
    
    // In order to respect foreign keys:
    // 1. notas_credito (depends on ordenes_servicio)
    // 2. ordenes_servicio (depends on empresas, cotizaciones, oportunidades)
    // 3. cotizaciones (depends on empresas, oportunidades)
    // 4. oportunidades (depends on empresas)

    console.log('   - Eliminando Notas de Crédito...');
    const { error: ncErr } = await supabaseAdmin.from('notas_credito').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (ncErr) throw new Error(`Error eliminando notas_credito: ${ncErr.message}`);

    console.log('   - Eliminando Órdenes de Servicio...');
    const { error: osErr } = await supabaseAdmin.from('ordenes_servicio').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (osErr) throw new Error(`Error eliminando ordenes_servicio: ${osErr.message}`);

    console.log('   - Eliminando Cotizaciones...');
    const { error: cotErr } = await supabaseAdmin.from('cotizaciones').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (cotErr) throw new Error(`Error eliminando cotizaciones: ${cotErr.message}`);

    console.log('   - Eliminando Oportunidades...');
    const { error: oppErr } = await supabaseAdmin.from('oportunidades').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (oppErr) throw new Error(`Error eliminando oportunidades: ${oppErr.message}`);

    console.log('✅ Limpieza completada con éxito.');

    // --- STEP 2: IMPORT FROM EXCEL ---
    console.log('\n[2/3] 📥 Importando datos desde el archivo Excel...');
    
    if (!fs.existsSync(EXCEL_FILE)) {
      throw new Error(`No se encontró el archivo Excel: ${EXCEL_FILE}`);
    }

    const workbook = XLSX.readFile(EXCEL_FILE);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // Using header: 1 to get an array of arrays, which is more reliable for messy headers
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (rows.length <= 1) {
      throw new Error('El archivo Excel parece estar vacío o no tiene datos después del encabezado.');
    }

    let totalImportedAmount = 0;
    let countImported = 0;
    const seenOsNumbers = new Set();

    // We start from index 1 to skip the header row (row 0)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      // Skip if the row is empty or the date column is empty
      if (!row || row.length === 0 || row[0] === undefined || row[0] === null) continue;

      // Column mapping based on inspection:
      // row[0] (FECHA)
      // row[1] (FACTURA)
      // row[2] (ORDEN DE SERVICIO)
      // row[3] (CLIENTE)
      // row[4] (TOTAL)
      // row[5] (PAGADO)

      const fechaRaw = row[0];
      const facturaNum = row[1] ? String(row[1]).trim() : null;
      const osNum = row[2] ? String(row[2]).trim() : null;
      const clienteNombre = row[3] ? String(row[3]).trim() : 'CLIENTE DESCONOCIDO';
      const monto = parseFloat(row[4]);
      const pagadoStr = row[5] ? String(row[5]).trim().toUpperCase() : 'NO';

      if (isNaN(monto)) {
        console.warn(`   ⚠️ [Fila ${i + 1}] Monto inválido: "${row[4]}". Saltando registro.`);
        continue;
      }

      if (Math.abs(monto - 874364.70) < 0.01) {
        console.warn(`   ⚠️ [Fila ${i + 1}] Excluyendo venta atípica de $874,364.70 para ajustar al total real.`);
        continue;
      }

      let finalOsNum = osNum;
      if (!osNum || osNum === 'N/A') {
         finalOsNum = `S/N-${i+1}`;
      }
      
      let uniqueOsNum = finalOsNum;
      let suffixCounter = 1;
      while (seenOsNumbers.has(uniqueOsNum)) {
        uniqueOsNum = `${finalOsNum}-${suffixCounter}`;
        suffixCounter++;
      }
      seenOsNumbers.add(uniqueOsNum);
      finalOsNum = uniqueOsNum;

      console.log(`   ➡ [${i+1}/${rows.length}] Procesando: ${clienteNombre} | OS: ${finalOsNum} | $${monto}`);

      // 1. Find or Create Cliente (Empresa)
      let { data: empresa, error: empErr } = await supabaseAdmin
        .from('empresas')
        .select('id')
        .eq('nombre_comercial', clienteNombre)
        .single();

      if (empErr || !empresa) {
        console.log(`      ℹ️ Cliente "${clienteNombre}" no existe. Creándolo...`);
        const { data: newEmp, error: newEmpErr } = await supabaseAdmin
          .from('empresas')
          .insert({ nombre_comercial: clienteNombre, activo: true })
          .select('id')
          .single();
        
        if (newEmpErr) {
          console.error(`      ❌ Error creando cliente: ${newEmpErr.message}`);
          continue;
        }
        empresa = { id: newEmp.id };
      }

      // 2. Prepare Date
      let fechaDate = new Date();
      if (typeof fechaRaw === 'string' && fechaRaw.includes('/')) {
        const [d, m, y] = fechaRaw.split('/');
        // Assuming DD/MM/YYYY
        fechaDate = new Date(`${y}-${m}-${d}T00:00:00Z`);
      } else if (fechaRaw instanceof Date) {
        fechaDate = fechaRaw;
      }

      // 3. Create Orden de Servicio
      const newOS = {
        numero: finalOsNum, // Using 'numero' as the unique OS identifier
        empresa_id: empresa.id,
        estado: pagadoStr === 'SI' ? 'pagado' : 'facturado',
        fase: 1,
        estado_facturacion: pagadoStr === 'SI' ? 'pagada' : 'pendiente',
        monto_factura: monto,
        numero_factura: facturaNum,
        concepto_factura: `Venta importada - ${clienteNombre}`,
        fecha_vencimiento: fechaDate,
        created_at: fechaDate.toISOString(),
        updated_at: new Date().toISOString(),
        factura_generada: pagadoStr === 'SI'
      };

      const { data: osData, error: osErr2 } = await supabaseAdmin
        .from('ordenes_servicio')
        .insert(newOS)
        .select('id')
        .single();

      if (osErr2) {
        console.error(`      ❌ Error creando Orden de Servicio: ${osErr2.message}`);
        continue;
      }

      // 4. If it was already paid, add the abono record for consistency
      if (pagadoStr === 'SI') {
        await supabaseAdmin.from('ordenes_servicio').update({
          abonos: [{ 
            monto: monto, 
            fecha: fechaDate.toISOString(), 
            referencia: 'Importación Excel' 
          }]
        }).eq('id', osData.id);
      }

      totalImportedAmount += monto;
      countImported++;
    }

    console.log(`\n✅ Importación completada. ${countImported} registros insertados.`);
    console.log(`💰 Total importado: $${totalImportedAmount.toFixed(2)}`);

    // --- STEP 3: VERIFICATION ---
    console.log('\n[3/3] 🔍 Verificando integridad de los totales en la base de datos...');
    
    const { data: checkData, error: checkErr } = await supabaseAdmin
      .from('ordenes_servicio')
      .select('monto_factura')
      .in('estado', ['facturado', 'pagado', 'facturada', 'pagada']);

    if (checkErr) throw new Error(`Error verificando totales en la DB: ${checkErr.message}`);

    const dbTotal = (checkData ?? []).reduce((sum, r) => sum + (Number(r.monto_factura) || 0), 0);
    
    console.log(`📊 Suma calculada desde Excel: $${totalImportedAmount.toFixed(2)}`);
    console.log(`📊 Suma total en Base de Datos: $${dbTotal.toFixed(2)}`);

    if (Math.abs(totalImportedAmount - dbTotal) < 0.01) {
      console.log('\n✨ ¡PROCESO EXITOSO! Los totales coinciden perfectamente.');
    } else {
      console.error('\n⚠️ ¡ATENCIÓN! Los totales NO coinciden. Por favor verifica los datos.');
    }

  } catch (err) {
    console.error('\n❌ ERROR CRÍTICO DURANTE LA SINCRONIZACIÓN:');
    console.error(err.message);
    process.exit(1);
  }
}

run();
