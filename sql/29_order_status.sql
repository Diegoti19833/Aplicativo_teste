-- =====================================================
-- MIGRAÇÃO: Adicionar status de pedido
-- Adiciona coluna status e admin_notes em user_purchases
-- =====================================================

-- Adicionar coluna status
ALTER TABLE user_purchases 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendente' 
CHECK (status IN ('pendente', 'aprovado', 'enviado', 'entregue', 'cancelado'));

-- Adicionar coluna admin_notes para observações do admin
ALTER TABLE user_purchases 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Criar índice para filtrar por status
CREATE INDEX IF NOT EXISTS idx_user_purchases_status ON user_purchases(status);

-- Atualizar RLS para permitir admin atualizar status
DROP POLICY IF EXISTS user_purchases_admin_update ON user_purchases;
CREATE POLICY user_purchases_admin_update ON user_purchases FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

SELECT 'Migration: order status columns added successfully!' as status;
