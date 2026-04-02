// Cat�logo de Mano de Obra — Tabulador TGR
// Extra�do del Excel "COSTOS CRM Henry.xlsx" — Hoja "Mano de Obra"

export interface ConceptoManoObra {
    concepto: string;
    categoria: 'ELÉCTRICO' | 'NEUMÁTICO' | 'MECÁNICO';
    precio_mxn: number;
}

export const CATALOGO_MANO_OBRA: ConceptoManoObra[] = [
    // ─── ELÉCTRICO ───────────────────────────────────
    { concepto: 'SERVICIO PREVENTIVO', categoria: 'ELÉCTRICO', precio_mxn: 4250 },
    { concepto: 'CAMBIO Y RECONECTAR RELEVADOR DE CORTE O VELOCIDAD', categoria: 'ELÉCTRICO', precio_mxn: 300 },
    { concepto: 'CAMBIO DE BULBO DE AIRE', categoria: 'ELÉCTRICO', precio_mxn: 300 },
    { concepto: 'CAMBIO PALANCA', categoria: 'ELÉCTRICO', precio_mxn: 300 },
    { concepto: 'CAMBIO CAJA DE CONTACTORES', categoria: 'ELÉCTRICO', precio_mxn: 600 },
    { concepto: 'CAMBIO CAJA ELECTRÓNICA', categoria: 'ELÉCTRICO', precio_mxn: 800 },
    { concepto: 'CAMBIO DE FOCO PILOTO', categoria: 'ELÉCTRICO', precio_mxn: 100 },
    { concepto: 'REPARACIÓN ARNÉS SENSOR VELOCIDAD', categoria: 'ELÉCTRICO', precio_mxn: 150 },
    { concepto: 'CAMBIO DE SENSOR DE VELOCIDAD', categoria: 'ELÉCTRICO', precio_mxn: 350 },
    { concepto: 'CAMBIO ARNÉS CORRIENTE (CAJA CONTACTORES-BATERÍA POSITIVO)', categoria: 'ELÉCTRICO', precio_mxn: 250 },
    { concepto: 'CAMBIO ARNÉS DE TIERRA (REPARACIÓN DE MAZA NEGATIVO)', categoria: 'ELÉCTRICO', precio_mxn: 250 },
    { concepto: 'CAMBIO DE ARNÉS (7 VÍAS)', categoria: 'ELÉCTRICO', precio_mxn: 800 },
    { concepto: 'CAMBIO DE ARNÉS DE POTENCIA (4 VÍAS)', categoria: 'ELÉCTRICO', precio_mxn: 350 },
    { concepto: 'CAMBIO ARNÉS TIERRA (DE FRENO A BATERÍAS)', categoria: 'ELÉCTRICO', precio_mxn: 250 },
    { concepto: 'REPARACIÓN ARNÉS DE CONTROL (CAMBIO DE TERMINALES)', categoria: 'ELÉCTRICO', precio_mxn: 150 },
    { concepto: 'SISTEMA DE CONTROL COMPLETO CAJA MECÁNICA', categoria: 'ELÉCTRICO', precio_mxn: 2000 },
    { concepto: 'FABRICACIÓN LÍNEAS SENSOR C/CONECTOR', categoria: 'ELÉCTRICO', precio_mxn: 150 },
    { concepto: 'SISTEMA DE CONTROL COMPLETO CAJA ELECTRÓNICA', categoria: 'ELÉCTRICO', precio_mxn: 2500 },
    { concepto: 'CAMBIO DE INTERRUPTOR', categoria: 'ELÉCTRICO', precio_mxn: 150 },
    { concepto: 'CAMBIO DE BLOCK CONEXIONES', categoria: 'ELÉCTRICO', precio_mxn: 400 },
    { concepto: 'REPARACIÓN LÍNEAS DE TABLERO', categoria: 'ELÉCTRICO', precio_mxn: 200 },
    { concepto: 'REPARACIÓN LÍNEAS DE TABLERO ALIMENTACIÓN O PORTAFUSIBLE', categoria: 'ELÉCTRICO', precio_mxn: 200 },
    { concepto: 'REPARACIÓN ARNÉS DE 7 VÍAS (SIN CAMBIO COMPLETO)', categoria: 'ELÉCTRICO', precio_mxn: 250 },
    { concepto: 'REPARACIÓN CAJA CONTACTORES', categoria: 'ELÉCTRICO', precio_mxn: 300 },
    { concepto: 'CAMBIO DE MEGA FUSIBLE O PORTA MEGA FUSIBLE', categoria: 'ELÉCTRICO', precio_mxn: 200 },
    { concepto: 'INSTALACIÓN DE SISTEMA ELÉCTRICO COMPLETO', categoria: 'ELÉCTRICO', precio_mxn: 3000 },
    { concepto: 'REVISIÓN DE CONSUMOS', categoria: 'ELÉCTRICO', precio_mxn: 500 },

    // ─── NEUMÁTICO ───────────────────────────────────
    { concepto: 'INSTALACIÓN SISTEMA NEUMÁTICO', categoria: 'NEUMÁTICO', precio_mxn: 1000 },
    { concepto: 'REPARACIÓN SISTEMA NEUMÁTICO (BULBO)', categoria: 'NEUMÁTICO', precio_mxn: 300 },
    { concepto: 'CAMBIO MANGUERA', categoria: 'NEUMÁTICO', precio_mxn: 250 },
    { concepto: 'KIT DE LUCES LED', categoria: 'NEUMÁTICO', precio_mxn: 4250 },

    // ─── MECÁNICO ────────────────────────────────────
    { concepto: 'LIMPIEZA DE FRENOS SIN DESARMAR', categoria: 'MECÁNICO', precio_mxn: 400 },
    { concepto: 'INSTALACIÓN MECÁNICA O REINSTALACIÓN DE FRENO', categoria: 'MECÁNICO', precio_mxn: 3500 },
    { concepto: 'SOLO BAJAR PURO FRENO', categoria: 'MECÁNICO', precio_mxn: 1500 },
    { concepto: 'CAMBIO DE SOPORTE DE CHASIS TIPO "L" C/U', categoria: 'MECÁNICO', precio_mxn: 400 },
    { concepto: 'CAMBIO DE ROTOR FRENO INSTALADO C/U', categoria: 'MECÁNICO', precio_mxn: 600 },
    { concepto: 'MONTAJE DE FRENO (AXIAL) COMPLETO CON KIT DE CONTROL', categoria: 'MECÁNICO', precio_mxn: 6000 },
    { concepto: 'CAMBIO DE SILENTBLOCKS', categoria: 'MECÁNICO', precio_mxn: 2500 },
    { concepto: 'CAMBIO DE RETÉN DE FRENO', categoria: 'MECÁNICO', precio_mxn: 700 },
    { concepto: 'CAMBIO O REPARACIÓN DE ARNÉS INTERIOR (CONEXIÓN)', categoria: 'MECÁNICO', precio_mxn: 500 },
    { concepto: 'BAJAR CARDANES Y DESCONECTAR ARNESES DE FRENO', categoria: 'MECÁNICO', precio_mxn: 750 },
    { concepto: 'MONTAJE DE CARDANES Y ARNESES DE FRENO', categoria: 'MECÁNICO', precio_mxn: 750 },
    { concepto: 'CAMBIO DE PLACAS LATERALES C/U', categoria: 'MECÁNICO', precio_mxn: 300 },
    { concepto: 'DESARMADO DE FRENO QUITANDO BOBINAS', categoria: 'MECÁNICO', precio_mxn: 1000 },
    { concepto: 'REPARACIÓN DE FRENO (BALEROS, RETENES Y CASQUILLOS)', categoria: 'MECÁNICO', precio_mxn: 2500 },
    { concepto: 'CAMBIO KIT DE ENGRASE SISTEMA DE LUBRICACIÓN', categoria: 'MECÁNICO', precio_mxn: 570 },
    { concepto: 'CAMBIO DE 1 KIT DE REPARACIÓN DE BOBINA', categoria: 'MECÁNICO', precio_mxn: 200 },
    { concepto: 'REPARACIÓN DE CUERDA DE FRENO O PLACA LATERAL C/U', categoria: 'MECÁNICO', precio_mxn: 100 },
    { concepto: 'REFRESCO CUERDAS DE TORNILLOS DE CRUCETA C/U', categoria: 'MECÁNICO', precio_mxn: 100 },
    { concepto: 'CAMBIO SEGUROS DE CRUCETAS', categoria: 'MECÁNICO', precio_mxn: 200 },
    { concepto: 'CAMBIO DE CRUCETA', categoria: 'MECÁNICO', precio_mxn: 500 },
    { concepto: 'CAMBIO DE BOBINA C/U', categoria: 'MECÁNICO', precio_mxn: 300 },
    { concepto: 'CAMBIO DE PLACA POLAR C/U', categoria: 'MECÁNICO', precio_mxn: 200 },
    { concepto: 'CALIBRACIÓN ENTRE HIERRO ROTOR', categoria: 'MECÁNICO', precio_mxn: 550 },
    { concepto: 'BAJAR Y SUBIR CARDANES LADO DE FRENO CAJA Y DIFERENCIAL', categoria: 'MECÁNICO', precio_mxn: 1500 },
    { concepto: 'CAMBIO TORNILLO PLATO ACOPLE C/U', categoria: 'MECÁNICO', precio_mxn: 75 },
    { concepto: 'DESINSTALACIÓN FRENO (CON ARNÉS)', categoria: 'MECÁNICO', precio_mxn: 2500 },
    { concepto: 'CAMBIO DE TERMINALES', categoria: 'MECÁNICO', precio_mxn: 200 },
    { concepto: 'RECONEXIÓN ELÉCTRICA', categoria: 'MECÁNICO', precio_mxn: 200 },
    { concepto: 'SUBIR FRENO', categoria: 'MECÁNICO', precio_mxn: 750 },
    { concepto: 'CAMBIO CORTA CORRIENTE', categoria: 'MECÁNICO', precio_mxn: 350 },
];

export const CATEGORIAS_MANO_OBRA = ['ELÉCTRICO', 'NEUMÁTICO', 'MECÁNICO'] as const;
