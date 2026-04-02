const fs=require('fs');
const p='src/app/(dashboard)/facturacion/notas-credito/page.tsx';
let c=fs.readFileSync(p,'utf8');
c=c.split("o.empresa ||").join("o.empresa?.nombre_comercial ||");
c=c.split("o.empresa,").join("o.empresa?.nombre_comercial,");
fs.writeFileSync(p,c,'utf8');
console.log('OK');
