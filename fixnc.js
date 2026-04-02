const fs=require('fs');
const p='src/app/(dashboard)/facturacion/notas-credito/page.tsx';
let c=fs.readFileSync(p,'utf8');
c=c.split("'id, numero, empresa, numero_factura, monto, estado, fecha_creado'").join("'id, numero_orden_fisica, empresa:empresas(nombre_comercial), numero_factura, total, estado, created_at'");
fs.writeFileSync(p,c,'utf8');
console.log('OK');
