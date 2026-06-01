-- ============================================================
-- ACTUALIZACIÓN DE CATÁLOGOS - CRM Retarder
-- Pega este SQL en el Editor SQL de Supabase y dale Run
-- ============================================================

-- 1. Ampliar el check constraint para incluir MATERIAL ELÉCTRICO
ALTER TABLE refacciones DROP CONSTRAINT IF EXISTS ref_categoria_check;
ALTER TABLE refacciones ADD CONSTRAINT ref_categoria_check
  CHECK (categoria IN (
    'ELÉCTRICO',
    'NEUMÁTICO',
    'TORNILLERÍA',
    'MECÁNICO',
    'SOPORTERÍA',
    'CARDANES',
    'MATERIAL ELÉCTRICO'
  ));

-- 2. Borrar material eléctrico anterior si existe
DELETE FROM refacciones WHERE categoria = 'MATERIAL ELÉCTRICO';

-- 3. Insertar Material Eléctrico
INSERT INTO refacciones (nombre, categoria, precio_venta, activo) VALUES
  ('CAJA MECANICA',                                         'MATERIAL ELÉCTRICO', 15638.96, true),
  ('CAJA ELECTRONICA',                                      'MATERIAL ELÉCTRICO', 16708.29, true),
  ('PALANCA CONTROL',                                       'MATERIAL ELÉCTRICO', 4253.86,  true),
  ('RELAY DE CORTE DE VELOCIDAD',                           'MATERIAL ELÉCTRICO', 7322.66,  true),
  ('CABLE 4 VIAS',                                          'MATERIAL ELÉCTRICO', 308.63,   true),
  ('CABLE CALIBRE #0 CORRIENTE GRUESO (01 X 2AWG 35 mm2)', 'MATERIAL ELÉCTRICO', 272.48,   true),
  ('CABLE CALIBRE #0 TIERRA DELGADO (01 X4AWG 25 mm2)',    'MATERIAL ELÉCTRICO', 133.67,   true),
  ('CABLE 7 VIAS',                                          'MATERIAL ELÉCTRICO', 174.50,   true),
  ('FOCO PILOTO',                                           'MATERIAL ELÉCTRICO', 217.50,   true),
  ('KIT DE TERMINALES',                                     'MATERIAL ELÉCTRICO', 915.07,   true),
  ('TORNILLOS SUJECIÓN DE CAJA 5/16 *1/2',                 'MATERIAL ELÉCTRICO', 6.25,     true),
  ('TUERCAS SUJECION DE CAJA 5/16 *1/2',                   'MATERIAL ELÉCTRICO', 2.49,     true),
  ('ARANDELAS DE PRESION 5/16 *1/2',                       'MATERIAL ELÉCTRICO', 2.49,     true),
  ('CABLE CALIBRE 14',                                      'MATERIAL ELÉCTRICO', 11.37,    true),
  ('CABLE NEGATIVO CALIBRE 8',                              'MATERIAL ELÉCTRICO', 58.01,    true),
  ('SENSOR DE ROSCA 4 VIAS',                                'MATERIAL ELÉCTRICO', 2411.31,  true),
  ('#ONES DE SENSOR ROSCA 4 VIAS',                          'MATERIAL ELÉCTRICO', 435.00,   true),
  ('MANTA FOIL',                                            'MATERIAL ELÉCTRICO', 118.39,   true),
  ('INTERRUPTOR COLA RATA REFORSADO',                       'MATERIAL ELÉCTRICO', 346.43,   true),
  ('CONECTOR 4 VIAS SENSOR DE CLIP',                        'MATERIAL ELÉCTRICO', 435.00,   true),
  ('FUSIBLE 1AMP',                                          'MATERIAL ELÉCTRICO', 14.50,    true),
  ('FUSIBLE 5 AMP',                                         'MATERIAL ELÉCTRICO', 14.50,    true),
  ('FUSIBLE 300 AMP',                                       'MATERIAL ELÉCTRICO', 217.50,   true),
  ('PORTAFUSIBLE',                                          'MATERIAL ELÉCTRICO', 139.88,   true),
  ('POLIFLEX 1/2',                                          'MATERIAL ELÉCTRICO', 16.48,    true),
  ('POLIFLEX 1/4',                                          'MATERIAL ELÉCTRICO', 8.19,     true),
  ('POLIFLEX 3/4',                                          'MATERIAL ELÉCTRICO', 21.46,    true),
  ('POLIFLEX 3/8',                                          'MATERIAL ELÉCTRICO', 10.71,    true),
  ('CINCHOS',                                               'MATERIAL ELÉCTRICO', 2.88,     true),
  ('CINTA DE AISLAR NEGRA',                                 'MATERIAL ELÉCTRICO', 20.66,    true),
  ('CINTA DE AISLAR ROJA',                                  'MATERIAL ELÉCTRICO', 20.66,    true),
  ('PINTURA NEGRA',                                         'MATERIAL ELÉCTRICO', 170.52,   true),
  ('ALMEJA',                                                'MATERIAL ELÉCTRICO', 7.25,     true),
  ('TERMINAL DE OJILLO 5/16 CAL 14',                        'MATERIAL ELÉCTRICO', 1.31,     true),
  ('TERMINAL DEL #8 CAL 10',                                'MATERIAL ELÉCTRICO', 7.25,     true),
  ('TERMINAL ENCHUFE FORRADA ROJA',                         'MATERIAL ELÉCTRICO', 2.03,     true),
  ('TERMINAL ESPADA CALIBRE #14',                           'MATERIAL ELÉCTRICO', 1.45,     true),
  ('TERMINAL OJILLO AZUL DE 1/4 MASA CAJA CONTACTORES',    'MATERIAL ELÉCTRICO', 1.51,     true),
  ('TERMINALES DE OJILLO CAL "0" * 5/16',                  'MATERIAL ELÉCTRICO', 15.20,    true),
  ('TERMINALES DE OJILLO CAL 0" 3/8',                       'MATERIAL ELÉCTRICO', 15.95,    true),
  ('TERMO CONTRACTIL 3/8',                                  'MATERIAL ELÉCTRICO', 10.88,    true),
  ('TERMOCONTRACTIL DE 3/4" PARA',                          'MATERIAL ELÉCTRICO', 36.25,    true),
  ('TOPES CONECTOR',                                        'MATERIAL ELÉCTRICO', 1.73,     true),
  ('CORTA CORRIENTE 250 AMP',                               'MATERIAL ELÉCTRICO', 1015.00,  true),
  ('CORTA CORRIENTE 300 AMP',                               'MATERIAL ELÉCTRICO', 1342.24,  true),
  ('PORTAMEGAFUSIBLE',                                      'MATERIAL ELÉCTRICO', 725.00,   true),
  ('MEGAFUSIBLE 300 AMP',                                   'MATERIAL ELÉCTRICO', 531.16,   true),
  ('RELAY HELLA 12 VOLT',                                   'MATERIAL ELÉCTRICO', 187.34,   true),
  ('RELAY HELLA 24 VOLT',                                   'MATERIAL ELÉCTRICO', 232.00,   true),
  ('PORTA RELE HELLA',                                      'MATERIAL ELÉCTRICO', 116.00,   true),
  ('LUZ LED VERDE',                                         'MATERIAL ELÉCTRICO', 343.48,   true),
  ('SENSOR DE ROSCA DE 2 VIAS',                             'MATERIAL ELÉCTRICO', 1620.33,  true),
  ('SENSOR DE VELOCIDAD CLIP 2 VIAS',                       'MATERIAL ELÉCTRICO', 1775.67,  true),
  ('SENSOR DE VELOCIDAD CLIP 4 VIAS',                       'MATERIAL ELÉCTRICO', 2632.20,  true),
  ('FUSIBLE CAJAS',                                         'MATERIAL ELÉCTRICO', 58.00,    true),
  ('GRASERA RECTA DE 3/8',                                  'MATERIAL ELÉCTRICO', 33.06,    true),
  ('KIT REPARACION BOBINA DE COBRE',                        'MATERIAL ELÉCTRICO', 343.48,   true),
  ('CONEXIÓN NEUMATICA 1/4',                                'MATERIAL ELÉCTRICO', 254.40,   true),
  ('CONEXIÓN "T" NEUMATICA 1/4',                            'MATERIAL ELÉCTRICO', 469.80,   true),
  ('MANGUERA DE 1/4',                                       'MATERIAL ELÉCTRICO', 113.44,   true),
  ('CONEXIÓN NEUMATICA 3/8',                                'MATERIAL ELÉCTRICO', 275.50,   true),
  ('CONEXIÓN "T" NEUMATICA 3/8',                            'MATERIAL ELÉCTRICO', 783.00,   true),
  ('MANGUERA 3/8',                                          'MATERIAL ELÉCTRICO', 156.60,   true),
  ('REDUCCIÓN BUSHING 3/8 A 1/4',                           'MATERIAL ELÉCTRICO', 52.93,    true),
  ('BULBO DE AIRE HOBS',                                    'MATERIAL ELÉCTRICO', 4227.69,  true),
  ('KIT LUCES LED COMPLETO',                                'MATERIAL ELÉCTRICO', 4930.00,  true);

SELECT 'Material Eléctrico insertado: ' || COUNT(*) FROM refacciones WHERE categoria = 'MATERIAL ELÉCTRICO';
