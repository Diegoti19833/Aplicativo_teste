-- =====================================================
-- TABELA: user_streaks
-- Descrição: Controle de sequências (streaks) dos usuários
-- =====================================================

CREATE TABLE IF NOT EXISTS user_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    streak_date DATE NOT NULL,
    activities_completed INTEGER DEFAULT 0,
    lessons_completed INTEGER DEFAULT 0,
    quizzes_completed INTEGER DEFAULT 0,
    total_xp_earned INTEGER DEFAULT 0,
    study_time_minutes INTEGER DEFAULT 0,
    is_streak_day BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar duplicatas por usuário e data
    UNIQUE(user_id, streak_date)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_date ON user_streaks(streak_date);
CREATE INDEX IF NOT EXISTS idx_user_streaks_is_streak ON user_streaks(is_streak_day);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_user_streaks_updated_at ON user_streaks;
CREATE TRIGGER update_user_streaks_updated_at
    BEFORE UPDATE ON user_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para verificar se o dia conta como streak
CREATE OR REPLACE FUNCTION check_streak_day()
RETURNS TRIGGER AS $$
BEGIN
    -- Um dia conta como streak se o usuário completou pelo menos 1 aula ou 3 quizzes
    NEW.is_streak_day := (NEW.lessons_completed >= 1 OR NEW.quizzes_completed >= 3);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_streak_day_trigger ON user_streaks;
CREATE TRIGGER check_streak_day_trigger
    BEFORE INSERT OR UPDATE ON user_streaks
    FOR EACH ROW
    EXECUTE FUNCTION check_streak_day();

-- Função para atualizar streak atual do usuário
CREATE OR REPLACE FUNCTION update_user_current_streak()
RETURNS TRIGGER AS $$
DECLARE
    current_streak INTEGER := 0;
    streak_record RECORD;
BEGIN
    -- Calcula o streak atual contando dias consecutivos de trás para frente
    FOR streak_record IN 
        SELECT streak_date, is_streak_day
        FROM user_streaks
        WHERE user_id = NEW.user_id
          AND streak_date <= NEW.streak_date
        ORDER BY streak_date DESC
    LOOP
        IF streak_record.is_streak_day THEN
            current_streak := current_streak + 1;
        ELSE
            EXIT; -- Para no primeiro dia sem streak
        END IF;
    END LOOP;
    
    -- Atualiza o streak atual do usuário
    UPDATE users
    SET current_streak = current_streak,
        last_activity_at = NOW()
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_current_streak_trigger ON user_streaks;
CREATE TRIGGER update_user_current_streak_trigger
    AFTER INSERT OR UPDATE ON user_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_user_current_streak();

-- Função para registrar atividade do dia
CREATE OR REPLACE FUNCTION record_daily_activity(
    p_user_id UUID,
    p_activity_type VARCHAR,
    p_xp_earned INTEGER DEFAULT 0,
    p_study_time INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_streaks (
        user_id, 
        streak_date, 
        activities_completed,
        lessons_completed,
        quizzes_completed,
        total_xp_earned,
        study_time_minutes
    )
    VALUES (
        p_user_id,
        CURRENT_DATE,
        1,
        CASE WHEN p_activity_type = 'lesson' THEN 1 ELSE 0 END,
        CASE WHEN p_activity_type = 'quiz' THEN 1 ELSE 0 END,
        p_xp_earned,
        p_study_time
    )
    ON CONFLICT (user_id, streak_date)
    DO UPDATE SET
        activities_completed = user_streaks.activities_completed + 1,
        lessons_completed = user_streaks.lessons_completed + 
            CASE WHEN p_activity_type = 'lesson' THEN 1 ELSE 0 END,
        quizzes_completed = user_streaks.quizzes_completed + 
            CASE WHEN p_activity_type = 'quiz' THEN 1 ELSE 0 END,
        total_xp_earned = user_streaks.total_xp_earned + p_xp_earned,
        study_time_minutes = user_streaks.study_time_minutes + p_study_time,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE user_streaks IS 'Controle de sequências (streaks) diárias dos usuários';
COMMENT ON COLUMN user_streaks.activities_completed IS 'Total de atividades completadas no dia';
COMMENT ON COLUMN user_streaks.is_streak_day IS 'Se o dia conta para o streak (1+ aula ou 3+ quizzes)';
COMMENT ON COLUMN user_streaks.study_time_minutes IS 'Tempo total de estudo no dia em minutos';