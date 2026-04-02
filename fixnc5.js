const fs=require('fs');
const p='src/app/(dashboard)/facturacion/notas-credito/page.tsx';
let c=fs.readFileSync(p,'utf8');
c=c.split("o.empresa?.nombre_comercial || 'N/A'").join("(o.empresa && typeof o.empresa === 'object' ? o.empresa.nombre_comercial : o.empresa) || 'N/A'");
c=c.split("o.empresa?.nombre_comercial || ''").join("(o.empresa && typeof o.empresa === 'object' ? o.empresa.nombre_comercial : o.empresa) || ''");
fs.writeFileSync(p,c,'utf8');
console.log('OK');
