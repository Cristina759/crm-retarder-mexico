const fs=require('fs');
const p='src/app/(dashboard)/dashboard/page.tsx';
let c=fs.readFileSync(p,'utf8');
c=c.replace(
  'const totalCobrado',
  'const {data:nd}=await supabase.from("notas_credito").select("total");const totalNotas=(nd||[]).reduce((a,n)=>a+(Number(n.total)||0),0);\nconst totalCobrado'
);
c=c.replace('totalVentas - totalNotas','totalVentas');
c=c.replace('setStats({','setStats({totalNotas,');
fs.writeFileSync(p,c,'utf8');
console.log('OK');
