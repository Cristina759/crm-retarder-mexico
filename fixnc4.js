const fs=require('fs');
const p='src/app/(dashboard)/facturacion/notas-credito/page.tsx';
let c=fs.readFileSync(p,'utf8');
c=c.split("'id, numero, empresa, numero_factura, monto, estado, fecha_creado'").join("'id, numero_factura, empresa:empresas(nombre_comercial), total, estado, created_at'");
c=c.split("o.empresa?.nombre_comercial || 'N/A'").join("o.empresa?.nombre_comercial || ''");
c=c.split("Number(o.monto)").join("Number(o.total)");
fs.writeFileSync(p,c,'utf8');
console.log('OK');
