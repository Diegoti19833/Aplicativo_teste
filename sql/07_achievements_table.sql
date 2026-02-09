-- =====================================================
-- TABELA: achievements
-- Descrição: Conquistas disponíveis no sistema
-- =====================================================

CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url TEXT,
    badge_color VARCHAR(7) DEFAULT '#FFD700',
    achievement_type VARCHAR(50) NOT NULL CHECK (achievement_type IN ('xp_milestone', 'streak', 'lessons_completed', 'quizzes_perfect', 'trail_completed', 'special')),
    requirement_value INTEGER DEFAULT 1,
    xp_reward INTEGER DEFAULT 50,
    coins_reward INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_achievements_is_active ON achievements(is_active);
CREATE INDEX IF NOT EXISTS idx_achievements_rarity ON achievements(rarity);
CREATE INDEX IF NOT EXISTS idx_achievements_order ON achievements(order_index);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_achievements_updated_at ON achievements;
CREATE TRIGGER update_achievements_updated_at
    BEFORE UPDATE ON achievements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE achievements IS 'Conquistas disponíveis no sistema de gamificação';
COMMENT ON COLUMN achievements.achievement_type IS 'Tipo de conquista: xp_milestone, streak, lessons_completed, quizzes_perfect, trail_completed, special';
COMMENT ON COLUMN achievements.requirement_value IS 'Valor necessário para desbloquear a conquista';
COMMENT ON COLUMN achievements.rarity IS 'Raridade da conquista: common, rare, epic, legendary';