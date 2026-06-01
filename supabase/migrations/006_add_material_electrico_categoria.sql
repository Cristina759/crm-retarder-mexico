-- Ampliar el check constraint de refacciones para incluir MATERIAL ELÉCTRICO
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
