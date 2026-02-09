-- =====================================================
-- TABELA: user_progress
-- Descrição: Progresso dos usuários nas trilhas e aulas
-- =====================================================

CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trail_id UUID REFERENCES trails(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    progress_type VARCHAR(50) NOT NULL CHECK (progress_type IN ('trail_started', 'lesson_completed', 'quiz_completed')),
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
    xp_earned INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0, -- em segundos
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar duplicatas
    UNIQUE(user_id, trail_id, lesson_id, progress_type)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_trail_id ON user_progress(trail_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson_id ON user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_type ON user_progress(progress_type);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON user_progress(completed_at);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar XP do usuário quando progresso é criado/atualizado
CREATE OR REPLACE FUNCTION update_user_xp_on_progress()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Adiciona XP quando novo progresso é criado
        UPDATE users 
        SET total_xp = total_xp + NEW.xp_earned,
            last_activity_at = NOW()
        WHERE id = NEW.user_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Ajusta XP quando progresso é atualizado
        UPDATE users 
        SET total_xp = total_xp - OLD.xp_earned + NEW.xp_earned,
            last_activity_at = NOW()
        WHERE id = NEW.user_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Remove XP quando progresso é deletado
        UPDATE users 
        SET total_xp = total_xp - OLD.xp_earned
        WHERE id = OLD.user_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_xp_on_progress_trigger ON user_progress;
CREATE TRIGGER update_user_xp_on_progress_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_user_xp_on_progress();

-- Comentários
COMMENT ON TABLE user_progress IS 'Progresso dos usuários nas trilhas e aulas';
COMMENT ON COLUMN user_progress.progress_type IS 'Tipo de progresso: trail_started, lesson_completed, quiz_completed';
COMMENT ON COLUMN user_progress.completion_percentage IS 'Percentual de conclusão (0-100)';
COMMENT ON COLUMN user_progress.time_spent IS 'Tempo gasto em segundos';