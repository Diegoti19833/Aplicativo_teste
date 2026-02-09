-- =====================================================
-- TABELA: daily_missions
-- Descrição: Missões diárias disponíveis
-- =====================================================

CREATE TABLE IF NOT EXISTS daily_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    mission_type VARCHAR(50) NOT NULL CHECK (mission_type IN ('complete_lessons', 'answer_quizzes', 'earn_xp', 'study_time', 'perfect_streak', 'login_daily')),
    target_value INTEGER NOT NULL CHECK (target_value > 0),
    xp_reward INTEGER DEFAULT 20,
    coins_reward INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 3),
    icon_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_daily_missions_type ON daily_missions(mission_type);
CREATE INDEX IF NOT EXISTS idx_daily_missions_is_active ON daily_missions(is_active);
CREATE INDEX IF NOT EXISTS idx_daily_missions_difficulty ON daily_missions(difficulty_level);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_daily_missions_updated_at ON daily_missions;
CREATE TRIGGER update_daily_missions_updated_at
    BEFORE UPDATE ON daily_missions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE daily_missions IS 'Missões diárias disponíveis no sistema';
COMMENT ON COLUMN daily_missions.mission_type IS 'Tipo de missão: complete_lessons, answer_quizzes, earn_xp, study_time, perfect_streak, login_daily';
COMMENT ON COLUMN daily_missions.target_value IS 'Valor alvo para completar a missão';
COMMENT ON COLUMN daily_missions.difficulty_level IS 'Nível de dificuldade de 1 (fácil) a 3 (difícil)';