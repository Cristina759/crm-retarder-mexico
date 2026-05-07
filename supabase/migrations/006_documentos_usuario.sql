-- Tabla para documentos adjuntos de usuarios

CREATE TABLE IF NOT EXISTS documentos_usuario (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre       TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  tipo         TEXT,
  tamanio      BIGINT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documentos_usuario_usuario_id
  ON documentos_usuario(usuario_id);

CREATE INDEX IF NOT EXISTS idx_documentos_usuario_created_at
  ON documentos_usuario(created_at DESC);

ALTER TABLE documentos_usuario ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'documentos_usuario'
      AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY "service_role_all"
      ON documentos_usuario
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;