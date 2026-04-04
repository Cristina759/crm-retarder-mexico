-- Agrega columna archivada a ordenes_servicio
-- Las órdenes marcadas como archivadas no aparecen en el pipeline activo
ALTER TABLE ordenes_servicio
    ADD COLUMN IF NOT EXISTS archivada BOOLEAN DEFAULT false;

-- Marcar órdenes existentes en estado 'pagado' como archivadas
UPDATE ordenes_servicio
    SET archivada = true
    WHERE estado = 'pagado' AND archivada IS NOT TRUE;
