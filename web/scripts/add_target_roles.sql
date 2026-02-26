-- =====================================================
-- GARANTIR COLUNA target_roles NA TABELA TRAILS
-- =====================================================

-- 1. Garantir que a coluna existe (já existe, mas por segurança)
ALTER TABLE trails
ADD COLUMN IF NOT EXISTS target_roles TEXT[] DEFAULT ARRAY['funcionario', 'gerente', 'caixa'];

-- 2. Atualizar trilhas que têm target_roles vazio ou nulo
UPDATE trails
SET target_roles = ARRAY['funcionario', 'gerente', 'caixa']
WHERE target_roles IS NULL OR target_roles = '{}';

-- 3. Criar índice para busca eficiente por roles
CREATE INDEX IF NOT EXISTS idx_trails_target_roles ON trails USING GIN (target_roles);

-- 4. Verificar resultado
SELECT id, title, target_roles FROM trails ORDER BY order_index;
