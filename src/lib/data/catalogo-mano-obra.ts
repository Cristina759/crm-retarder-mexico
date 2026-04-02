// Catlogo de Mano de Obra  Tabulador TGR
// Extrado del Excel "COSTOS CRM Henry.xlsx"  Hoja "Mano de Obra"

export interface ConceptoManoObra {
    concepto: string;
    categoria: 'ELCTRICO' | 'NEUMTICO' | 'MECNICO';
    precio_mxn: number;
}

export const CATALOGO_MANO_OBRA: ConceptoManoObra[] = [
    //  ELCTRICO 
    { concepto: 'SERVICIO PREVENTIVO', categoria: 'ELCTRICO', precio_mxn: 4250 },
    { concepto: 'CAMBIO Y RECONECTAR RELEVADOR DE CORTE O VELOCIDAD', categoria: 'ELCTRICO', precio_mxn: 300 },
    { concepto: 'CAMBIO DE BULBO DE AIRE', categoria: 'ELCTRICO', precio_mxn: 300 },
    { concepto: 'CAMBIO PALANCA', categoria: 'ELCTRICO', precio_mxn: 300 },
    { concepto: 'CAMBIO CAJA DE CONTACTORES', categoria: 'ELCTRICO', precio_mxn: 600 },
    { concepto: 'CAMBIO CAJA ELECTRNICA', categoria: 'ELCTRICO', precio_mxn: 800 },
    { concepto: 'CAMBIO DE FOCO PILOTO', categoria: 'ELCTRICO', precio_mxn: 100 },
    { concepto: 'REPARACIN ARNS SENSOR VELOCIDAD', categoria: 'ELCTRICO', precio_mxn: 150 },
    { concepto: 'CAMBIO DE SENSOR DE VELOCIDAD', categoria: 'ELCTRICO', precio_mxn: 350 },
    { concepto: 'CAMBIO ARNS CORRIENTE (CAJA CONTACTORES-BATERA POSITIVO)', categoria: 'ELCTRICO', precio_mxn: 250 },
    { concepto: 'CAMBIO ARNS DE TIERRA (REPARACIN DE MAZA NEGATIVO)', categoria: 'ELCTRICO', precio_mxn: 250 },
    { concepto: 'CAMBIO DE ARNS (7 VAS)', categoria: 'ELCTRICO', precio_mxn: 800 },
    { concepto: 'CAMBIO DE ARNS DE POTENCIA (4 VAS)', categoria: 'ELCTRICO', precio_mxn: 350 },
    { concepto: 'CAMBIO ARNS TIERRA (DE FRENO A BATERAS)', categoria: 'ELCTRICO', precio_mxn: 250 },
    { concepto: 'REPARACIN ARNS DE CONTROL (CAMBIO DE TERMINALES)', categoria: 'ELCTRICO', precio_mxn: 150 },
    { concepto: 'SISTEMA DE CONTROL COMPLETO CAJA MECNICA', categoria: 'ELCTRICO', precio_mxn: 2000 },
    { concepto: 'FABRICACIN LNEAS SENSOR C/CONECTOR', categoria: 'ELCTRICO', precio_mxn: 150 },
    { concepto: 'SISTEMA DE CONTROL COMPLETO CAJA ELECTRNICA', categoria: 'ELCTRICO', precio_mxn: 2500 },
    { concepto: 'CAMBIO DE INTERRUPTOR', categoria: 'ELCTRICO', precio_mxn: 150 },
    { concepto: 'CAMBIO DE BLOCK CONEXIONES', categoria: 'ELCTRICO', precio_mxn: 400 },
    { concepto: 'REPARACIN LNEAS DE TABLERO', categoria: 'ELCTRICO', precio_mxn: 200 },
    { concepto: 'REPARACIN LNEAS DE TABLERO ALIMENTACIN O PORTAFUSIBLE', categoria: 'ELCTRICO', precio_mxn: 200 },
    { concepto: 'REPARACIN ARNS DE 7 VAS (SIN CAMBIO COMPLETO)', categoria: 'ELCTRICO', precio_mxn: 250 },
    { concepto: 'REPARACIN CAJA CONTACTORES', categoria: 'ELCTRICO', precio_mxn: 300 },
    { concepto: 'CAMBIO DE MEGA FUSIBLE O PORTA MEGA FUSIBLE', categoria: 'ELCTRICO', precio_mxn: 200 },
    { concepto: 'INSTALACIN DE SISTEMA ELCTRICO COMPLETO', categoria: 'ELCTRICO', precio_mxn: 3000 },
    { concepto: 'REVISIN DE CONSUMOS', categoria: 'ELCTRICO', precio_mxn: 500 },

    //  NEUMTICO 
    { concepto: 'INSTALACIN SISTEMA NEUMTICO', categoria: 'NEUMTICO', precio_mxn: 1000 },
    { concepto: 'REPARACIN SISTEMA NEUMTICO (BULBO)', categoria: 'NEUMTICO', precio_mxn: 300 },
    { concepto: 'CAMBIO MANGUERA', categoria: 'NEUMTICO', precio_mxn: 250 },
    { concepto: 'KIT DE LUCES LED', categoria: 'NEUMTICO', precio_mxn: 4250 },

    //  MECNICO 
    { concepto: 'LIMPIEZA DE FRENOS SIN DESARMAR', categoria: 'MECNICO', precio_mxn: 400 },
    { concepto: 'INSTALACIN MECNICA O REINSTALACIN DE FRENO', categoria: 'MECNICO', precio_mxn: 3500 },
    { concepto: 'SOLO BAJAR PURO FRENO', categoria: 'MECNICO', precio_mxn: 1500 },
    { concepto: 'CAMBIO DE SOPORTE DE CHASIS TIPO "L" C/U', categoria: 'MECNICO', precio_mxn: 400 },
    { concepto: 'CAMBIO DE ROTOR FRENO INSTALADO C/U', categoria: 'MECNICO', precio_mxn: 600 },
    { concepto: 'MONTAJE DE FRENO (AXIAL) COMPLETO CON KIT DE CONTROL', categoria: 'MECNICO', precio_mxn: 6000 },
    { concepto: 'CAMBIO DE SILENTBLOCKS', categoria: 'MECNICO', precio_mxn: 2500 },
    { concepto: 'CAMBIO DE RETN DE FRENO', categoria: 'MECNICO', precio_mxn: 700 },
    { concepto: 'CAMBIO O REPARACIN DE ARNS INTERIOR (CONEXIN)', categoria: 'MECNICO', precio_mxn: 500 },
    { concepto: 'BAJAR CARDANES Y DESCONECTAR ARNESES DE FRENO', categoria: 'MECNICO', precio_mxn: 750 },
    { concepto: 'MONTAJE DE CARDANES Y ARNESES DE FRENO', categoria: 'MECNICO', precio_mxn: 750 },
    { concepto: 'CAMBIO DE PLACAS LATERALES C/U', categoria: 'MECNICO', precio_mxn: 300 },
    { concepto: 'DESARMADO DE FRENO QUITANDO BOBINAS', categoria: 'MECNICO', precio_mxn: 1000 },
    { concepto: 'REPARACIN DE FRENO (BALEROS, RETENES Y CASQUILLOS)', categoria: 'MECNICO', precio_mxn: 2500 },
    { concepto: 'CAMBIO KIT DE ENGRASE SISTEMA DE LUBRICACIN', categoria: 'MECNICO', precio_mxn: 570 },
    { concepto: 'CAMBIO DE 1 KIT DE REPARACIN DE BOBINA', categoria: 'MECNICO', precio_mxn: 200 },
    { concepto: 'REPARACIN DE CUERDA DE FRENO O PLACA LATERAL C/U', categoria: 'MECNICO', precio_mxn: 100 },
    { concepto: 'REFRESCO CUERDAS DE TORNILLOS DE CRUCETA C/U', categoria: 'MECNICO', precio_mxn: 100 },
    { concepto: 'CAMBIO SEGUROS DE CRUCETAS', categoria: 'MECNICO', precio_mxn: 200 },
    { concepto: 'CAMBIO DE CRUCETA', categoria: 'MECNICO', precio_mxn: 500 },
    { concepto: 'CAMBIO DE BOBINA C/U', categoria: 'MECNICO', precio_mxn: 300 },
    { concepto: 'CAMBIO DE PLACA POLAR C/U', categoria: 'MECNICO', precio_mxn: 200 },
    { concepto: 'CALIBRACIN ENTRE HIERRO ROTOR', categoria: 'MECNICO', precio_mxn: 550 },
    { concepto: 'BAJAR Y SUBIR CARDANES LADO DE FRENO CAJA Y DIFERENCIAL', categoria: 'MECNICO', precio_mxn: 1500 },
    { concepto: 'CAMBIO TORNILLO PLATO ACOPLE C/U', categoria: 'MECNICO', precio_mxn: 75 },
    { concepto: 'DESINSTALACIN FRENO (CON ARNS)', categoria: 'MECNICO', precio_mxn: 2500 },
    { concepto: 'CAMBIO DE TERMINALES', categoria: 'MECNICO', precio_mxn: 200 },
    { concepto: 'RECONEXIN ELCTRICA', categoria: 'MECNICO', precio_mxn: 200 },
    { concepto: 'SUBIR FRENO', categoria: 'MECNICO', precio_mxn: 750 },
    { concepto: 'CAMBIO CORTA CORRIENTE', categoria: 'MECNICO', precio_mxn: 350 },
];

export const CATEGORIAS_MANO_OBRA = ['ELCTRICO', 'NEUMTICO', 'MECNICO'] as const;
