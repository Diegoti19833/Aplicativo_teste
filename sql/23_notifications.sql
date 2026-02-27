-- ============================================================================
-- 23_NOTIFICATIONS.SQL
-- Criação do sistema de Notificações In-App e Push (Expo)
-- ============================================================================

-- 1. ADICIONAR COLUNA PARA O TOKEN DO EXPO PUSH NAS USERS
ALTER TABLE users ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- 2. TABELA DE NOTIFICAÇÕES
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'system', -- 'system', 'achievement', 'social', 'team', 'custom'
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
-- Usuários podem ler suas próprias notificações
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Usuários podem atualizar (marcar como lido) suas próprias notificações
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Apenas admins/gerentes podem inserir/deletar notificações manualmente
CREATE POLICY "Admins and managers can insert notifications"
    ON notifications FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'gerente')
        )
    );

-- 3. FUNÇÕES E TRIGGERS AUTOMÁTICOS

-- Função para enviar notificação customizada (via Painel Admin)
CREATE OR REPLACE FUNCTION send_custom_notification(
    p_title VARCHAR,
    p_body TEXT,
    p_target_role TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    IF p_target_role IS NULL THEN
        -- Enviar para todos
        INSERT INTO notifications (user_id, title, body, type)
        SELECT id, p_title, p_body, 'custom' FROM users WHERE is_active = true;
        
        SELECT COUNT(*) INTO v_count FROM users WHERE is_active = true;
    ELSE
        -- Enviar para role específica
        INSERT INTO notifications (user_id, title, body, type)
        SELECT id, p_title, p_body, 'custom' FROM users WHERE is_active = true AND role = p_target_role;
        
        SELECT COUNT(*) INTO v_count FROM users WHERE is_active = true AND role = p_target_role;
    END IF;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Opcional: Trigger para notificar quando uma conquista é desbloqueada (Se a tabela existir)
CREATE OR REPLACE FUNCTION notify_achievement_unlocked() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, title, body, type)
    VALUES (NEW.user_id, 'Nova Conquista Desbloqueada! 🏆', 'Você acabou de ganhar uma nova medalha. Vá conferir no seu perfil!', 'achievement');
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW; -- Ignorar erros silenciosamente para não travar a inserção original
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Exemplo se houvesse tabela user_achievements
-- CREATE TRIGGER on_achievement_unlocked
--     AFTER INSERT ON user_achievements
--     FOR EACH ROW EXECUTE FUNCTION notify_achievement_unlocked();
