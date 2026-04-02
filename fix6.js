const fs=require('fs');
const p='src/app/(dashboard)/dashboard/page.tsx';
let c=fs.readFileSync(p,'utf8');
c=c.replace(/select\('\*'\)/g,"select('*, empresa:empresas(nombre_comercial)')");
fs.writeFileSync(p,c,'utf8');
console.log('OK');
