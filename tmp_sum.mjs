import { VENTAS_REALES } from './src/lib/data/ventas-reales.js'; // I'll rename this to .js temporarily or just evaluate the content

const sumTotal = VENTAS_REALES.reduce((s, v) => s + v.total, 0);
const sumCobrado = VENTAS_REALES.filter(v => v.pagado).reduce((s, v) => s + v.total, 0);
const sumPorCobrar = sumTotal - sumCobrado;

console.log('Total:', sumTotal);
console.log('Cobrado:', sumCobrado);
console.log('Por Cobrar:', sumPorCobrar);
console.log('Count:', VENTAS_REALES.length);
