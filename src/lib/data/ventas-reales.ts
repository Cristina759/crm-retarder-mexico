export interface VentaReal {
    id: string;
    cliente: string;
    orden_servicio: string;
    factura: string;
    mano_obra: number;
    refacciones: number;
    gastos_traslado: number;
    subtotal: number;
    iva: number;
    total: number;
    pagado: boolean;
}

export const VENTAS_REALES: VentaReal[] = [
    { id: '1', cliente: 'MINERIA BURVAL', orden_servicio: '487', factura: 'B558', mano_obra: 1200, refacciones: 14771.22, gastos_traslado: 5000, subtotal: 20971.22, iva: 3355.4, total: 24326.62, pagado: true },
    { id: '2', cliente: 'LA CANTERA (CAPELA)', orden_servicio: '486', factura: 'B577', mano_obra: 7000, refacciones: 10500, gastos_traslado: 20000, subtotal: 37500, iva: 6000, total: 43500, pagado: false },
    { id: '3', cliente: 'RAUNEL RUIZ', orden_servicio: '488', factura: 'B568', mano_obra: 7000, refacciones: 21836.71, gastos_traslado: 6000, subtotal: 34836.71, iva: 5573.87, total: 40410.58, pagado: false },
    { id: '4', cliente: 'AUSTIN BACIS', orden_servicio: '', factura: 'B559', mano_obra: 0, refacciones: 15500, gastos_traslado: 0, subtotal: 15500, iva: 2480, total: 17980, pagado: true },
    { id: '5', cliente: 'AUSTIN BACIS', orden_servicio: '519', factura: 'B560', mano_obra: 14645.67, refacciones: 124716.9, gastos_traslado: 14272.56, subtotal: 153635.13, iva: 24581.62, total: 178216.75, pagado: true },
    { id: '6', cliente: 'AUSTIN BACIS', orden_servicio: '507', factura: 'B561', mano_obra: 4250, refacciones: 0, gastos_traslado: 2500, subtotal: 6750, iva: 1080, total: 7830, pagado: false },
    { id: '7', cliente: 'AUSTIN BACIS', orden_servicio: '506', factura: 'B562', mano_obra: 4250, refacciones: 0, gastos_traslado: 2500, subtotal: 6750, iva: 1080, total: 7830, pagado: false },
    { id: '8', cliente: 'AUSTIN BACIS', orden_servicio: '505', factura: 'B563', mano_obra: 4250, refacciones: 0, gastos_traslado: 2500, subtotal: 6750, iva: 1080, total: 7830, pagado: false },
    { id: '9', cliente: 'AUSTIN BACIS', orden_servicio: '504', factura: 'B564', mano_obra: 4250, refacciones: 0, gastos_traslado: 2500, subtotal: 6750, iva: 1080, total: 7830, pagado: false },
    { id: '10', cliente: 'AUSTIN BACIS', orden_servicio: '503', factura: 'B565', mano_obra: 4250, refacciones: 0, gastos_traslado: 2500, subtotal: 6750, iva: 1080, total: 7830, pagado: false },
    { id: '11', cliente: 'AUSTIN BACIS', orden_servicio: '502', factura: 'B566', mano_obra: 4250, refacciones: 0, gastos_traslado: 2500, subtotal: 6750, iva: 1080, total: 7830, pagado: false },
    { id: '12', cliente: 'AUSTIN BACIS', orden_servicio: '501', factura: 'B567', mano_obra: 4250, refacciones: 0, gastos_traslado: 2500, subtotal: 6750, iva: 1080, total: 7830, pagado: false },
    { id: '13', cliente: 'MAPLE TRANSPORTES Y SERVICIOS', orden_servicio: '', factura: 'B569', mano_obra: 25788, refacciones: 670312, gastos_traslado: 55016, subtotal: 751116, iva: 120178.56, total: 871294.56, pagado: false },
    { id: '14', cliente: 'LA CANTERA', orden_servicio: '492', factura: 'B570', mano_obra: 4500, refacciones: 1690.8, gastos_traslado: 2500, subtotal: 8690.8, iva: 1390.53, total: 10081.33, pagado: false },
    { id: '15', cliente: 'LA CANTERA', orden_servicio: '497', factura: 'B571', mano_obra: 4250, refacciones: 0, gastos_traslado: 2500, subtotal: 6750, iva: 1080, total: 7830, pagado: false },
    { id: '16', cliente: 'LA CANTERA', orden_servicio: '496', factura: 'B572', mano_obra: 4500, refacciones: 1690.8, gastos_traslado: 2500, subtotal: 8690.8, iva: 1390.53, total: 10081.33, pagado: false },
    { id: '17', cliente: 'LA CANTERA', orden_servicio: '495', factura: 'B573', mano_obra: 4500, refacciones: 381.16, gastos_traslado: 2500, subtotal: 7381.16, iva: 1180.99, total: 8562.15, pagado: false },
    { id: '18', cliente: 'LA CANTERA', orden_servicio: '494', factura: 'B574', mano_obra: 4250, refacciones: 0, gastos_traslado: 2500, subtotal: 6750, iva: 1080, total: 7830, pagado: false },
    { id: '19', cliente: 'LA CANTERA', orden_servicio: '493', factura: 'B575', mano_obra: 4250, refacciones: 0, gastos_traslado: 2500, subtotal: 6750, iva: 1080, total: 7830, pagado: false },
    { id: '20', cliente: 'LA CANTERA', orden_servicio: '492', factura: 'B576', mano_obra: 4750, refacciones: 1690.8, gastos_traslado: 2500, subtotal: 8940.8, iva: 1430.53, total: 10371.33, pagado: false },
    { id: '21', cliente: 'PROMACO', orden_servicio: '618', factura: 'B578', mano_obra: 4530.4, refacciones: 0, gastos_traslado: 7000, subtotal: 11530.4, iva: 1844.86, total: 13375.26, pagado: false },
    { id: '22', cliente: 'PROMACO', orden_servicio: '617', factura: 'B579', mano_obra: 7250, refacciones: 19810.72, gastos_traslado: 7000, subtotal: 34060.72, iva: 5449.72, total: 39510.44, pagado: false },
];
