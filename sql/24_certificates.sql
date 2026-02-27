-- ============================================================================
-- 24_certificates.sql
-- Funcionalidade 2: Certificados de Trilha
-- ============================================================================

-- 1. Criar tabela de certificados
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trail_id UUID NOT NULL REFERENCES trails(id) ON DELETE CASCADE,
  certificate_code UUID NOT NULL DEFAULT gen_random_uuid(),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_valid BOOLEAN NOT NULL DEFAULT true,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES users(id),
  CONSTRAINT uq_user_trail_certificate UNIQUE (user_id, trail_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_trail_id ON certificates(trail_id);
CREATE INDEX IF NOT EXISTS idx_certificates_code ON certificates(certificate_code);

-- 2. RLS Policies
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Usuário pode ver seus próprios certificados
CREATE POLICY "users_read_own_certificates"
  ON certificates FOR SELECT
  USING (auth.uid() = user_id);

-- Admins/gerentes podem ler todos os certificados
CREATE POLICY "admins_read_all_certificates"
  ON certificates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'gerente')
    )
  );

-- Service role pode inserir/atualizar certificados
CREATE POLICY "service_insert_certificates"
  ON certificates FOR INSERT
  WITH CHECK (true);

CREATE POLICY "admins_update_certificates"
  ON certificates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'gerente')
    )
  );

-- ============================================================================
-- 3. Função: Emitir certificado de trilha
-- ============================================================================
CREATE OR REPLACE FUNCTION issue_trail_certificate(
  p_user_id UUID,
  p_trail_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_lessons INTEGER;
  v_completed_lessons INTEGER;
  v_existing_cert UUID;
  v_new_cert RECORD;
  v_trail_title TEXT;
  v_user_name TEXT;
BEGIN
  -- Verificar se já existe certificado
  SELECT id INTO v_existing_cert
  FROM certificates
  WHERE user_id = p_user_id AND trail_id = p_trail_id AND is_valid = true;

  IF v_existing_cert IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Certificado já emitido para esta trilha',
      'certificate_id', v_existing_cert
    );
  END IF;

  -- Contar total de aulas da trilha
  SELECT COUNT(*) INTO v_total_lessons
  FROM lessons
  WHERE trail_id = p_trail_id;

  IF v_total_lessons = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Trilha sem aulas');
  END IF;

  -- Contar aulas completadas pelo usuário
  SELECT COUNT(DISTINCT lesson_id) INTO v_completed_lessons
  FROM user_progress
  WHERE user_id = p_user_id
    AND trail_id = p_trail_id
    AND progress_type = 'lesson_completed';

  IF v_completed_lessons < v_total_lessons THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Trilha não concluída',
      'completed', v_completed_lessons,
      'total', v_total_lessons
    );
  END IF;

  -- Buscar dados para o retorno
  SELECT title INTO v_trail_title FROM trails WHERE id = p_trail_id;
  SELECT name INTO v_user_name FROM users WHERE id = p_user_id;

  -- Emitir certificado
  INSERT INTO certificates (user_id, trail_id)
  VALUES (p_user_id, p_trail_id)
  RETURNING * INTO v_new_cert;

  -- Criar notificação (se a tabela existir)
  BEGIN
    INSERT INTO notifications (user_id, title, body, type, metadata)
    VALUES (
      p_user_id,
      '🎓 Certificado Emitido!',
      'Parabéns! Seu certificado de conclusão da trilha "' || COALESCE(v_trail_title, '') || '" está disponível.',
      'achievement',
      jsonb_build_object('certificate_id', v_new_cert.id, 'trail_id', p_trail_id)
    );
  EXCEPTION WHEN OTHERS THEN
    -- Tabela notifications pode não existir
    NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'certificate_id', v_new_cert.id,
    'certificate_code', v_new_cert.certificate_code,
    'trail_title', v_trail_title,
    'user_name', v_user_name,
    'issued_at', v_new_cert.issued_at
  );
END;
$$;

-- ============================================================================
-- 4. Função: Revogar certificado (admin)
-- ============================================================================
CREATE OR REPLACE FUNCTION revoke_certificate(p_certificate_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar permissão
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'gerente')
  ) THEN
    RAISE EXCEPTION 'Sem permissão para revogar certificados';
  END IF;

  UPDATE certificates
  SET is_valid = false,
      revoked_at = now(),
      revoked_by = auth.uid()
  WHERE id = p_certificate_id
  AND is_valid = true;

  RETURN FOUND;
END;
$$;

-- ============================================================================
-- 5. Função: Buscar certificados do usuário
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_certificates(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  trail_id UUID,
  trail_title TEXT,
  certificate_code UUID,
  issued_at TIMESTAMPTZ,
  is_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.trail_id,
    t.title AS trail_title,
    c.certificate_code,
    c.issued_at,
    c.is_valid
  FROM certificates c
  JOIN trails t ON t.id = c.trail_id
  WHERE c.user_id = p_user_id
  ORDER BY c.issued_at DESC;
END;
$$;
