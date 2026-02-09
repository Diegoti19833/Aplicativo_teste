-- =====================================================
-- TABELA: user_achievements
-- Descrição: Conquistas desbloqueadas pelos usuários
-- =====================================================

CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress_value INTEGER DEFAULT 0,
    is_notified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar conquistas duplicadas
    UNIQUE(user_id, achievement_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at);
CREATE INDEX IF NOT EXISTS idx_user_achievements_is_notified ON user_achievements(is_notified);

-- Função para dar recompensas quando conquista é desbloqueada
CREATE OR REPLACE FUNCTION reward_user_achievement()
RETURNS TRIGGER AS $$
DECLARE
    achievement_xp INTEGER;
    achievement_coins INTEGER;
BEGIN
    -- Busca as recompensas da conquista
    SELECT xp_reward, coins_reward
    INTO achievement_xp, achievement_coins
    FROM achievements
    WHERE id = NEW.achievement_id;
    
    -- Adiciona recompensas ao usuário
    UPDATE users
    SET total_xp = total_xp + achievement_xp,
        coins = coins + achievement_coins,
        last_activity_at = NOW()
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reward_user_achievement_trigger ON user_achievements;
CREATE TRIGGER reward_user_achievement_trigger
    AFTER INSERT ON user_achievements
    FOR EACH ROW
    EXECUTE FUNCTION reward_user_achievement();

-- Comentários
COMMENT ON TABLE user_achievements IS 'Conquistas desbloqueadas pelos usuários';
COMMENT ON COLUMN user_achievements.progress_value IS 'Valor atual do progresso para conquistas progressivas';
COMMENT ON COLUMN user_achievements.is_notified IS 'Se o usuário foi notificado sobre a conquista';