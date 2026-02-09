-- =====================================================
-- CORREÇÕES PARA ERROS SQL NO GAMEPOP
-- Execute este script no painel SQL do Supabase
-- =====================================================

-- 1. Corrigir função update_user_stats (ambiguidade current_streak)
CREATE OR REPLACE FUNCTION update_user_stats(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    new_total_xp INTEGER;
    new_level INTEGER;
    completed_lessons INTEGER;
    completed_quizzes INTEGER;
    current_streak INTEGER;
BEGIN
    -- Calcular XP total
    new_total_xp := calculate_user_total_xp(user_uuid);
    
    -- Calcular nível
    new_level := calculate_user_level(new_total_xp);
    
    -- Contar aulas completadas
    SELECT COUNT(*) INTO completed_lessons
    FROM user_progress 
    WHERE user_id = user_uuid 
      AND progress_type = 'lesson' 
      AND completion_percentage = 100;
    
    -- Contar quizzes completados (corretos)
    SELECT COUNT(*) INTO completed_quizzes
    FROM quiz_attempts 
    WHERE user_id = user_uuid 
      AND is_correct = true;
    
    -- Calcular streak atual (CORRIGIDO: especificando users.current_streak)
    SELECT COALESCE(users.current_streak, 0) INTO current_streak
    FROM users 
    WHERE id = user_uuid;
    
    -- Atualizar usuário
    UPDATE users SET
        total_xp = new_total_xp,
        level = new_level,
        lessons_completed = completed_lessons,
        quizzes_completed = completed_quizzes,
        updated_at = NOW()
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- 2. Corrigir função update_user_streak (ambiguidade current_streak)
CREATE OR REPLACE FUNCTION update_user_streak(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    current_streak INTEGER := 0;
    today_date DATE := CURRENT_DATE;
    yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
    has_today_activity BOOLEAN;
    has_yesterday_activity BOOLEAN;
BEGIN
    -- Verificar atividade de hoje
    SELECT EXISTS (
        SELECT 1 FROM user_streaks 
        WHERE user_id = user_uuid 
          AND streak_date = today_date 
          AND is_streak_day = true
    ) INTO has_today_activity;
    
    -- Verificar atividade de ontem
    SELECT EXISTS (
        SELECT 1 FROM user_streaks 
        WHERE user_id = user_uuid 
          AND streak_date = yesterday_date 
          AND is_streak_day = true
    ) INTO has_yesterday_activity;
    
    -- Calcular novo streak
    IF has_today_activity THEN
        IF has_yesterday_activity THEN
            -- Continuar streak (CORRIGIDO: especificando users.current_streak)
            SELECT users.current_streak + 1 INTO current_streak
            FROM users 
            WHERE id = user_uuid;
        ELSE
            -- Iniciar novo streak
            current_streak := 1;
        END IF;
    ELSE
        -- Sem atividade hoje, streak quebrado
        current_streak := 0;
    END IF;
    
    -- Atualizar usuário
    UPDATE users 
    SET current_streak = current_streak,
        max_streak = GREATEST(max_streak, current_streak)
    WHERE id = user_uuid;
    
    RETURN current_streak;
END;
$$ LANGUAGE plpgsql;

-- 3. Corrigir função check_achievement (CASE statement sem ELSE adequado)
CREATE OR REPLACE FUNCTION check_achievement(
    user_id_param UUID,
    achievement_id_param UUID
)
RETURNS JSON AS $$
DECLARE
    achievement_data RECORD;
    user_achievement RECORD;
    progress_value INTEGER := 0;
    is_unlocked BOOLEAN := false;
    result JSON;
BEGIN
    -- Buscar dados da conquista
    SELECT * INTO achievement_data FROM achievements WHERE id = achievement_id_param;
    
    IF achievement_data IS NULL THEN
        RETURN json_build_object('error', 'Conquista não encontrada');
    END IF;
    
    -- Verificar se o usuário já possui a conquista
    SELECT * INTO user_achievement
    FROM user_achievements
    WHERE user_id = user_id_param AND achievement_id = achievement_id_param;
    
    is_unlocked := user_achievement IS NOT NULL;
    
    -- Calcular progresso baseado no tipo de conquista (CORRIGIDO: CASE com ELSE explícito)
    CASE achievement_data.achievement_type
        WHEN 'xp_total' THEN
            progress_value := calculate_user_total_xp(user_id_param);
        WHEN 'lessons_completed' THEN
            SELECT COUNT(*) INTO progress_value
            FROM user_progress
            WHERE user_id = user_id_param AND is_completed = true;
        WHEN 'streak_days' THEN
            SELECT COALESCE(users.current_streak, 0) INTO progress_value
            FROM users
            WHERE id = user_id_param;
        WHEN 'quizzes_correct' THEN
            SELECT COUNT(*) INTO progress_value
            FROM quiz_attempts
            WHERE user_id = user_id_param AND is_correct = true;
        ELSE
            progress_value := 0; -- ELSE explícito para evitar erro
    END CASE;
    
    -- Verificar se deve desbloquear a conquista
    IF NOT is_unlocked AND progress_value >= achievement_data.target_value THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        VALUES (user_id_param, achievement_id_param);
        is_unlocked := true;
    END IF;
    
    result := json_build_object(
        'achievement_id', achievement_id_param,
        'is_unlocked', is_unlocked,
        'progress_value', progress_value,
        'target_value', achievement_data.target_value,
        'progress_percentage', 
        CASE 
            WHEN achievement_data.target_value > 0 THEN 
                ROUND((progress_value::NUMERIC / achievement_data.target_value::NUMERIC) * 100, 2)
            ELSE 0 
        END
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INSTRUÇÕES:
-- 1. Copie todo este código
-- 2. Vá para o painel do Supabase > SQL Editor
-- 3. Cole o código e execute
-- 4. Reinicie a aplicação Expo
-- =====================================================