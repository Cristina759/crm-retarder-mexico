-- ============================================================
-- CRM Retarder México v2 — Catálogos de Mano de Obra y Refacciones
-- ============================================================

-- MANO DE OBRA
CREATE TABLE mano_de_obra (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre     TEXT NOT NULL,
  categoria  TEXT NOT NULL,
  precio     NUMERIC(10,2) NOT NULL DEFAULT 0,
  activo     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT mo_categoria_check CHECK (categoria IN ('ELÉCTRICO','NEUMÁTICO','MECÁNICO','OTRO'))
);

-- REFACCIONES
CREATE TABLE refacciones (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre       TEXT NOT NULL,
  categoria    TEXT NOT NULL,
  precio_venta NUMERIC(10,2) NOT NULL DEFAULT 0,
  numero_parte TEXT,
  activo       BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT ref_categoria_check CHECK (categoria IN ('ELÉCTRICO','NEUMÁTICO','TORNILLERÍA','MECÁNICO'))
);

-- Índices
CREATE INDEX idx_mo_categoria  ON mano_de_obra(categoria);
CREATE INDEX idx_mo_activo     ON mano_de_obra(activo);
CREATE INDEX idx_ref_categoria ON refacciones(categoria);
CREATE INDEX idx_ref_activo    ON refacciones(activo);

-- RLS
ALTER TABLE mano_de_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE refacciones  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON mano_de_obra FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON refacciones  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- SEED — MANO DE OBRA ELÉCTRICO
-- ============================================================
INSERT INTO mano_de_obra (nombre, categoria, precio) VALUES
  ('SERVICIO PREVENTIVO',                                                               'ELÉCTRICO',  4250.00),
  ('CAMBIO Y RECONECTAR RELEY DE CORTE O VELOCIDAD (RELEVADOR)',                        'ELÉCTRICO',   300.00),
  ('CAMBIO DE BULBO DE AIRE',                                                           'ELÉCTRICO',   300.00),
  ('CAMBIO PALANCA',                                                                    'ELÉCTRICO',   300.00),
  ('CAMBIO CAJA DE CONTACTORES',                                                        'ELÉCTRICO',   600.00),
  ('CAMBIO CAJA ELECTRONICA',                                                           'ELÉCTRICO',   800.00),
  ('CAMBIO DE FOCO PILOTO',                                                             'ELÉCTRICO',   100.00),
  ('REPARACION ARNES SENSOR VELOCIDAD',                                                 'ELÉCTRICO',   150.00),
  ('CAMBIO DE SENSOR DE VELOCIDAD',                                                     'ELÉCTRICO',   350.00),
  ('CAMBIO ARNES CORRIENTE (CAL 0) CAJA CONTACTORES / BATERIA POSITIVO',               'ELÉCTRICO',   250.00),
  ('CAMBIO ARNES DE TIERRA (CAL 8) REPARACION DE MAZA NEGATIVO',                       'ELÉCTRICO',   250.00),
  ('CAMBIO DE ARNES 7 VIAS',                                                            'ELÉCTRICO',   800.00),
  ('CAMBIO DE ARNES DE POTENCIA 4 VIAS',                                                'ELÉCTRICO',   350.00),
  ('CAMBIO DE ARNES TIERRA (DE FRENO A BATERIAS) REP. O FAB. MAZA NEGATIVO',           'ELÉCTRICO',   250.00),
  ('REPARACION DE ARNES DE CONTROL (CAMBIO DE TERMINALES) 4 LINEAS BLOCK CONEXIONES',  'ELÉCTRICO',   150.00),
  ('SISTEMA DE CONTROL COMPLETO CAJA MECANICA',                                         'ELÉCTRICO',  2000.00),
  ('FABRICACION LINEAS SENSOR C/CONECTOR',                                              'ELÉCTRICO',   150.00),
  ('SISTEMA DE CONTROL COMPLETO CAJA ELECTRONICA',                                      'ELÉCTRICO',  2500.00),
  ('CAMBIO DE INTERRUPTOR',                                                             'ELÉCTRICO',   150.00),
  ('CAMBIO DE BLOCK CONEXIONES',                                                        'ELÉCTRICO',   400.00),
  ('REPARACION LINEAS DE TABLERO',                                                      'ELÉCTRICO',   200.00),
  ('REPARACION LINEAS DE TABLERO ALIMENTACION O PORT FUSIBLE',                          'ELÉCTRICO',   200.00),
  ('REPARACION ARNES DE 7 VIAS (SIN REALIZAR CAMBIO COMPLETO)',                         'ELÉCTRICO',   250.00),
  ('REPARACION CAJA CONTACTORES',                                                       'ELÉCTRICO',   300.00),
  ('CAMBIO DE MEGA FUSIBLE O PORTA MEGA FUSIBLE',                                       'ELÉCTRICO',   200.00),
  ('INSTALACION DE SISTEMA ELECTRICO COMPLETO',                                         'ELÉCTRICO',  3000.00),
  ('REVISIÓN DE CONSUMOS',                                                              'ELÉCTRICO',   500.00),
  ('KIT DE LUCES LED',                                                                  'ELÉCTRICO',  4250.00);

-- ============================================================
-- SEED — MANO DE OBRA NEUMÁTICO
-- ============================================================
INSERT INTO mano_de_obra (nombre, categoria, precio) VALUES
  ('INSTALACIÓN SISTEMA NEUMATICO',       'NEUMÁTICO', 1000.00),
  ('REPARACION SISTEMA NEUMATICO (BULBO)','NEUMÁTICO',  300.00),
  ('CAMBIO MANGUERA',                     'NEUMÁTICO',  250.00);

-- ============================================================
-- SEED — MANO DE OBRA MECÁNICO
-- ============================================================
INSERT INTO mano_de_obra (nombre, categoria, precio) VALUES
  ('LIMPIEZA DE FRENOS SIN DESARMAR',                                                           'MECÁNICO',   400.00),
  ('INSTALACION MECANICA O REINSTALACION DE FRENO',                                             'MECÁNICO',  3500.00),
  ('SOLO BAJAR PURO FRENO',                                                                     'MECÁNICO',  1500.00),
  ('CAMBIO DE SOPORTE DE CHASIS TIPO L C/U',                                                    'MECÁNICO',   400.00),
  ('CAMBIO DE ROTOR FRENO INSTALADO C/U',                                                       'MECÁNICO',   600.00),
  ('MONTAJE DE FRENO (AXIAL) COMPLETO CON KIT DE CONTROL',                                      'MECÁNICO',  6000.00),
  ('CAMBIO DE SILENTBLOKS',                                                                     'MECÁNICO',  2500.00),
  ('CAMBIO DE RETEN DE FRENO',                                                                  'MECÁNICO',   700.00),
  ('CAMBIO O REPARACION DE ARNES INTERIOR (CONEXIÓN)',                                          'MECÁNICO',   500.00),
  ('BAJAR, CARDANES Y DESCONECTAR ARNESES DE FRENO',                                            'MECÁNICO',   750.00),
  ('MONTAJE DE CARDANES Y ARNESES DE FRENO',                                                    'MECÁNICO',   750.00),
  ('CAMBIO DE PLACAS LATERALES C/U',                                                            'MECÁNICO',   300.00),
  ('DESARMADO DE FRENO QUITANDO BOBINAS (SIEMPRE Y CUANDO SALGAN)',                             'MECÁNICO',  1000.00),
  ('REPARACION DE FRENO (BALEROS, RETENES Y CASQUILLOS, REPARACION ARMADO) SIN KIT',           'MECÁNICO',  2500.00),
  ('CAMBIO KIT DE ENGRASE SISTEMA DE LUBRICACION',                                              'MECÁNICO',   570.00),
  ('CAMBIO DE 1 KIT DE REPARACION DE BOBINA',                                                  'MECÁNICO',   200.00),
  ('REPARACION DE CUERDA DE FRENO O PLACA LATERAL C/U',                                        'MECÁNICO',   100.00),
  ('REFRESCO, CUERDAS DE TORNILLOS, DE CRUCETA C/U',                                           'MECÁNICO',   100.00),
  ('CAMBIO SEGUROS DE CRUCETAS',                                                                'MECÁNICO',   200.00),
  ('CAMBIO DE CRUCETA',                                                                         'MECÁNICO',   500.00),
  ('CAMBIO DE BOBINA C/U',                                                                      'MECÁNICO',   300.00),
  ('CAMBIO DE PLACA POLAR C/U',                                                                 'MECÁNICO',   200.00),
  ('CALIBRACION ENTRE HIERRO ROTOR',                                                            'MECÁNICO',   550.00),
  ('BAJAR Y SUBIR CARDANES LADO DE FRENO CAJA Y DIFERENCIAL',                                  'MECÁNICO',  1500.00),
  ('CAMBIO TORNILLO PLATO ACOPLE C/U',                                                          'MECÁNICO',    75.00),
  ('DESINSTALACION FRENO (CON ARNES)',                                                           'MECÁNICO',  2500.00),
  ('CAMBIO DE TERMINALES',                                                                      'MECÁNICO',   200.00),
  ('RECONEXIÓN ELECTRICA',                                                                      'MECÁNICO',   200.00),
  ('SUBIR FRENO',                                                                               'MECÁNICO',   750.00),
  ('CAMBIO CORTA CORRIENTE',                                                                    'MECÁNICO',   350.00);

-- ============================================================
-- SEED — REFACCIONES ELÉCTRICO
-- ============================================================
INSERT INTO refacciones (nombre, categoria, precio_venta) VALUES
  ('CAJA MECANICA',                                      'ELÉCTRICO', 13491.85),
  ('CAJA ELECTRONICA',                                   'ELÉCTRICO', 12537.18),
  ('PALANCA CONTROL',                                    'ELÉCTRICO',  3375.00),
  ('RELAY DE CONTROL DE VELOCIDAD',                      'ELÉCTRICO',  3250.00),
  ('CABLE 4 VIAS',                                       'ELÉCTRICO',   250.23),
  ('CABLE CALIBRE 8 CORRIENTE GRUESO (81 X 24V)',        'ELÉCTRICO',   294.83),
  ('CABLE CALIBRE 8 Y TIERRA DELGADO (81 X 24V)',        'ELÉCTRICO',   115.23),
  ('YOCO PILOTO (FOCO PILOTO)',                           'ELÉCTRICO',   728.00),
  ('KIT DE TERMINALES',                                  'ELÉCTRICO',   237.50),
  ('CABLE CALIBRE 14',                                   'ELÉCTRICO',    58.81),
  ('CABLE NEGATIVO CALIBRE 8',                           'ELÉCTRICO',    58.81),
  ('CONECTORES DE CHICOTE 14',                           'ELÉCTRICO',     3.88),
  ('ARNES DE SENSOR BOSCA 4 VIAS',                       'ELÉCTRICO',  1827.59),
  ('HARTA FOIL',                                         'ELÉCTRICO',   142.24),
  ('INTERRUPTOR COL RATA REFORZADO',                     'ELÉCTRICO',   372.41),
  ('CONECTOR 4 VIAS SENSOR DE CLIP',                     'ELÉCTRICO',    47.41),
  ('FUSIBLE 5AMP',                                       'ELÉCTRICO',    12.50),
  ('FUSIBLE 10AMP',                                      'ELÉCTRICO',    12.50),
  ('FUSIBLE 15AMP',                                      'ELÉCTRICO',    12.50),
  ('PORTAFUSIBLE',                                       'ELÉCTRICO',   128.45),
  ('POLIFLEX 1/2',                                       'ELÉCTRICO',    16.21),
  ('POLIFLEX 3/8',                                       'ELÉCTRICO',    11.21),
  ('POLIFLEX 3/4',                                       'ELÉCTRICO',    18.10),
  ('CINCHOS',                                            'ELÉCTRICO',     2.45),
  ('CINTA DE AISLAM NEGRA',                              'ELÉCTRICO',    17.81),
  ('CINTA DE AISLAM ROJA',                               'ELÉCTRICO',    17.81),
  ('PINTURA NEGRA',                                      'ELÉCTRICO',   146.55),
  ('ALMEJA',                                             'ELÉCTRICO',     5.17),
  ('TERMINAL DE OJILLO 5/16 CAL 14',                     'ELÉCTRICO',     1.13),
  ('TERMINAL DE OJILLO 8 CAL 10',                        'ELÉCTRICO',     1.55),
  ('TERMINAL ENCHUFE FORADA R07A',                       'ELÉCTRICO',     1.25),
  ('TERMINAL ENCHUFE CALIBRE R14',                       'ELÉCTRICO',     1.90),
  ('TERMINAL OJILLO 1/4 MASA CAJA',                      'ELÉCTRICO',     1.38),
  ('TERMINAL DE OJILLO CAL 8 5/16',                      'ELÉCTRICO',    13.10),
  ('TERMINALES DE OJILLO CAL 8 3/8',                     'ELÉCTRICO',    13.10),
  ('TERMINAL CONTRATACTOR 5/16',                         'ELÉCTRICO',    29.31),
  ('TERMO CONTRACTIL 3/4 PARA TOPES CONECTOR',           'ELÉCTRICO',    31.03),
  ('CORTA CORRIENTE 225 AMP',                            'ELÉCTRICO',   875.00),
  ('CORTA CORRIENTE 338 AMP',                            'ELÉCTRICO',   975.00),
  ('PORTAMEGAFUSIBLE',                                   'ELÉCTRICO',   195.69),
  ('MEGAFUSIBLE 250 AMP',                                'ELÉCTRICO',    75.86),
  ('RELAY HELLA 12 VOLT',                                'ELÉCTRICO',   401.59),
  ('PORTA RELAY HELLA',                                  'ELÉCTRICO',   168.10),
  ('LUZ LED VERDE',                                      'ELÉCTRICO',   236.90),
  ('SENSOR DE VELOCIDAD 2 VIAS',                         'ELÉCTRICO',  1250.00),
  ('SENSOR DE VELOCIDAD CLIP 2 VIAS',                    'ELÉCTRICO',  1250.00),
  ('SENSOR DE VELOCIDAD CLIP 4 VIAS',                    'ELÉCTRICO',  1350.00),
  ('FUSIBLE CAJ43',                                      'ELÉCTRICO',    28.88),
  ('KIT REPARACION BOBINA DE COBRE',                     'ELÉCTRICO',  2800.00),
  ('KIT LUCES LED COMPLETO',                             'ELÉCTRICO',  4250.00);

-- ============================================================
-- SEED — REFACCIONES NEUMÁTICO
-- ============================================================
INSERT INTO refacciones (nombre, categoria, precio_venta) VALUES
  ('CONEXIÓN NEUMÁTICA 1/4',         'NEUMÁTICO',  219.31),
  ('MANGUERA DE 1/4 (POR METRO)',    'NEUMÁTICO',   37.73),
  ('CONEXIÓN NEUMÁTICA 3/8',         'NEUMÁTICO',  237.50),
  ('CONEXIÓN T NEUMÁTICA 3/8',       'NEUMÁTICO',  271.55),
  ('MANGUERA DE 3/8 (POR METRO)',    'NEUMÁTICO',   66.38),
  ('REDUCCIÓN BUSHING 3/8 A 1/4',   'NEUMÁTICO',   45.10),
  ('BULBO DE AIRE',                  'NEUMÁTICO', 1044.25);

-- ============================================================
-- SEED — REFACCIONES TORNILLERÍA
-- ============================================================
INSERT INTO refacciones (nombre, categoria, precio_venta) VALUES
  ('TORNILLOS DE 5/16" X 1"',                              'TORNILLERÍA',   3.75),
  ('TUERCAS DE SEGURIDAD 5/16"',                           'TORNILLERÍA',   2.00),
  ('ARANDELA DE PRESION 5/16"',                            'TORNILLERÍA',   0.75),
  ('TORNILLOS DE 5/16" X 2"',                              'TORNILLERÍA',   5.00),
  ('TORNILLOS DE 12MM X 90MM',                             'TORNILLERÍA',  25.00),
  ('TUERCAS DE SEGURIDAD 12MM',                            'TORNILLERÍA',  13.75),
  ('ARANDELA AUTOMOTIVA 1/2" X 1°',                        'TORNILLERÍA',   8.13),
  ('ARANDELA GRANDE 1/2" X 2°',                            'TORNILLERÍA',  30.00),
  ('TORNILLO 14MM',                                        'TORNILLERÍA',  20.63),
  ('ARANDELAS DE PRESION 9/16"',                           'TORNILLERÍA',   3.13),
  ('TORNILLO 18MM X 50',                                   'TORNILLERÍA',  43.13),
  ('TUERCA DE SEGURIDAD 18MM',                             'TORNILLERÍA',  18.75),
  ('TORNILLOS 18MM X 120MM GRADO 9.8 PASO 1.50',          'TORNILLERÍA', 140.00),
  ('TUERCAS DE SEGURIDAD 18MM PASO 1.50',                  'TORNILLERÍA',  18.75),
  ('ARANDELA AUTOMOTIVA 3/4"',                             'TORNILLERÍA',  12.50),
  ('ARANDELA GRANDE 3/4" X 2 1/2"',                        'TORNILLERÍA',  30.00),
  ('TORNILLOS 18MM X 125MM',                               'TORNILLERÍA', 140.00),
  ('TORNILLO 3/4" X 2"',                                   'TORNILLERÍA',  42.50),
  ('TUERCA DE SEGURIDAD 3/4"',                             'TORNILLERÍA',  47.75),
  ('TORNILLOS 1/2" X 4"',                                  'TORNILLERÍA',  25.00),
  ('TUERCAS DE SEGURIDAD 1/2"',                            'TORNILLERÍA',  13.75),
  ('JUEGO DE SILENBLOCK MARCA KLAM',                       'TORNILLERÍA',   0.00);
