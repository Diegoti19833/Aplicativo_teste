-- =====================================================
-- SCRIPT DE ATUALIZAÇÃO COMPLETO DO SUPABASE
-- =====================================================
-- Este script corrige todos os erros encontrados:
-- - PGRST202: Função get_user_dashboard não encontrada
-- - PGRST204: Coluna last_activity_date não encontrada
-- - PGRST205: Tabela user_store_items não encontrada (corrigida no frontend)
-- - 42703: Coluna is_completed não existe

-- 1. Verificar e adicionar coluna last_activity_date na tabela users se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_activity_date'
    ) THEN
        ALTER TABLE users ADD COLUMN last_activity_date DATE DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- 2. Verificar e criar tabelas ausentes
-- Criar tabela user_lesson_progress se não existir
CREATE TABLE IF NOT EXISTS user_lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    xp_earned INTEGER DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Criar índices para user_lesson_progress se não existirem
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id ON user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson_id ON user_lesson_progress(lesson_id);

-- 3. Verificar e adicionar outras colunas que podem estar faltando
DO $$
BEGIN
    -- Verificar coluna streak_days
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'streak_days'
    ) THEN
        ALTER TABLE users ADD COLUMN streak_days INTEGER DEFAULT 0;
    END IF;
    
    -- Verificar coluna xp_total
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'xp_total'
    ) THEN
        ALTER TABLE users ADD COLUMN xp_total INTEGER DEFAULT 0;
    END IF;
    
    -- Verificar coluna level
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'level'
    ) THEN
        ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1;
    END IF;
    
    -- Verificar coluna role
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'funcionario';
    END IF;
    
    -- Verificar coluna avatar_url
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- 4. Função para calcular XP total do usuário
-- Primeiro, remover a função existente se houver conflito de parâmetros
DROP FUNCTION IF EXISTS calculate_user_total_xp(uuid);

CREATE OR REPLACE FUNCTION calculate_user_total_xp(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    total_xp INTEGER := 0;
    lesson_xp INTEGER := 0;
    quiz_xp INTEGER := 0;
    achievement_xp INTEGER := 0;
    mission_xp INTEGER := 0;
BEGIN
    -- XP de aulas completadas
    SELECT COALESCE(SUM(xp_earned), 0) INTO lesson_xp
    FROM user_progress
    WHERE user_id = user_id_param AND is_completed = true;
    
    -- XP de quizzes corretos
    SELECT COALESCE(SUM(q.xp_reward), 0) INTO quiz_xp
    FROM quiz_attempts qa
    JOIN quizzes q ON qa.quiz_id = q.id
    WHERE qa.user_id = user_id_param AND qa.is_correct = true;
    
    -- XP de conquistas
    SELECT COALESCE(SUM(a.xp_reward), 0) INTO achievement_xp
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = user_id_param;
    
    -- XP de missões diárias
    SELECT COALESCE(SUM(dm.xp_reward), 0) INTO mission_xp
    FROM user_daily_missions udm
    JOIN daily_missions dm ON udm.mission_id = dm.id
    WHERE udm.user_id = user_id_param AND udm.is_completed = true;
    
    total_xp := lesson_xp + quiz_xp + achievement_xp + mission_xp;
    
    RETURN total_xp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Função para calcular nível do usuário
-- Primeiro, remover a função existente se houver conflito de parâmetros
DROP FUNCTION IF EXISTS calculate_user_level(uuid);

CREATE OR REPLACE FUNCTION calculate_user_level(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    total_xp INTEGER;
    user_level INTEGER := 1;
BEGIN
    total_xp := calculate_user_total_xp(user_id_param);
    
    -- Cada nível requer 100 XP a mais que o anterior
    -- Nível 1: 0-99 XP, Nível 2: 100-299 XP, Nível 3: 300-599 XP, etc.
    user_level := FLOOR((-100 + SQRT(10000 + 800 * total_xp)) / 200) + 1;
    
    RETURN GREATEST(1, user_level);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Função principal do dashboard
-- Primeiro, remover a função existente se houver conflito de parâmetros
DROP FUNCTION IF EXISTS get_user_dashboard(uuid);

CREATE OR REPLACE FUNCTION get_user_dashboard(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
    user_data RECORD;
    total_xp INTEGER;
    user_level INTEGER;
    total_lessons INTEGER;
    completed_lessons INTEGER;
    total_achievements INTEGER;
    unlocked_achievements INTEGER;
    current_streak INTEGER;
    result JSON;
BEGIN
    -- Buscar dados básicos do usuário
    SELECT * INTO user_data FROM users WHERE id = user_id_param;
    
    IF user_data IS NULL THEN
        RETURN json_build_object('error', 'Usuário não encontrado');
    END IF;
    
    -- Calcular estatísticas
    total_xp := calculate_user_total_xp(user_id_param);
    user_level := calculate_user_level(user_id_param);
    
    -- Contar aulas totais e completadas
    SELECT COUNT(*) INTO total_lessons FROM lessons WHERE is_active = true;
    SELECT COUNT(*) INTO completed_lessons
    FROM user_progress
    WHERE user_id = user_id_param AND is_completed = true;
    
    -- Contar conquistas
    SELECT COUNT(*) INTO total_achievements FROM achievements;
    SELECT COUNT(*) INTO unlocked_achievements
    FROM user_achievements
    WHERE user_id = user_id_param;
    
    -- Buscar streak atual
    SELECT COALESCE(current_streak, 0) INTO current_streak
    FROM user_streaks
    WHERE user_id = user_id_param;
    
    -- Montar resultado
    result := json_build_object(
        'user', json_build_object(
            'id', user_data.id,
            'name', user_data.name,
            'email', user_data.email,
            'role', user_data.role,
            'avatar_url', user_data.avatar_url,
            'level', user_level,
            'xp_total', total_xp,
            'streak_days', current_streak,
            'last_activity_date', user_data.last_activity_date
        ),
        'stats', json_build_object(
            'total_lessons', total_lessons,
            'completed_lessons', completed_lessons,
            'completion_percentage', CASE 
                WHEN total_lessons > 0 THEN (completed_lessons::NUMERIC / total_lessons::NUMERIC) * 100
                ELSE 0
            END,
            'total_achievements', total_achievements,
            'unlocked_achievements', unlocked_achievements,
            'achievement_percentage', CASE 
                WHEN total_achievements > 0 THEN (unlocked_achievements::NUMERIC / total_achievements::NUMERIC) * 100
                ELSE 0
            END
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Outras funções necessárias
-- Primeiro, remover funções existentes se houver conflito de parâmetros
DROP FUNCTION IF EXISTS mark_lesson_complete(uuid, uuid, integer);
DROP FUNCTION IF EXISTS mark_lesson_complete(uuid, uuid);

CREATE OR REPLACE FUNCTION mark_lesson_complete(
    user_id_param UUID,
    lesson_id_param UUID,
    xp_earned_param INTEGER DEFAULT 10
)
RETURNS JSON AS $$
DECLARE
    existing_progress RECORD;
    result JSON;
BEGIN
    -- Verificar se já existe progresso
    SELECT * INTO existing_progress
    FROM user_progress
    WHERE user_id = user_id_param AND lesson_id = lesson_id_param;
    
    IF existing_progress IS NULL THEN
        -- Criar novo progresso
        INSERT INTO user_progress (user_id, lesson_id, is_completed, xp_earned, completed_at)
        VALUES (user_id_param, lesson_id_param, true, xp_earned_param, NOW());
    ELSE
        -- Atualizar progresso existente
        UPDATE user_progress
        SET is_completed = true, xp_earned = xp_earned_param, completed_at = NOW()
        WHERE user_id = user_id_param AND lesson_id = lesson_id_param;
    END IF;
    
    result := json_build_object(
        'success', true,
        'lesson_id', lesson_id_param,
        'xp_earned', xp_earned_param
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Função para submeter resposta de quiz
-- Primeiro, remover a função existente se houver conflito de parâmetros
DROP FUNCTION IF EXISTS submit_quiz_answer(uuid, uuid, uuid);

CREATE OR REPLACE FUNCTION submit_quiz_answer(
    user_id_param UUID,
    quiz_id_param UUID,
    selected_option_id_param UUID
)
RETURNS JSON AS $$
DECLARE
    quiz_data RECORD;
    option_data RECORD;
    is_correct BOOLEAN := false;
    xp_earned INTEGER := 0;
    result JSON;
BEGIN
    -- Buscar dados do quiz
    SELECT * INTO quiz_data FROM quizzes WHERE id = quiz_id_param;
    
    IF quiz_data IS NULL THEN
        RETURN json_build_object('error', 'Quiz não encontrado');
    END IF;
    
    -- Buscar dados da opção selecionada
    SELECT * INTO option_data FROM quiz_options WHERE id = selected_option_id_param;
    
    IF option_data IS NULL THEN
        RETURN json_build_object('error', 'Opção não encontrada');
    END IF;
    
    is_correct := option_data.is_correct;
    
    IF is_correct THEN
        xp_earned := quiz_data.xp_reward;
    END IF;
    
    -- Registrar tentativa
    INSERT INTO quiz_attempts (user_id, quiz_id, selected_option_id, is_correct, xp_earned)
    VALUES (user_id_param, quiz_id_param, selected_option_id_param, is_correct, xp_earned);
    
    result := json_build_object(
        'success', true,
        'is_correct', is_correct,
        'xp_earned', xp_earned,
        'correct_option_id', (
            SELECT id FROM quiz_options 
            WHERE quiz_id = quiz_id_param AND is_correct = true 
            LIMIT 1
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mensagem de conclusão
SELECT 'Atualização do Supabase concluída com sucesso!' as status;