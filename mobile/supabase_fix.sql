-- =====================================================
-- SCRIPT DE CORREÇÃO FINAL - GamePop
-- Corrige referência ambígua da coluna total_xp
-- =====================================================

-- Função para calcular XP total do usuário (CORRIGIDA)
CREATE OR REPLACE FUNCTION calculate_user_total_xp(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    quiz_xp INTEGER := 0;
    lesson_xp INTEGER := 0;
    total INTEGER := 0;
BEGIN
    -- XP de quizzes completados
    SELECT COALESCE(SUM(xp_earned), 0) INTO quiz_xp
    FROM user_progress 
    WHERE user_id = user_id_param AND progress_type = 'quiz_completed';
    
    -- XP de lições completadas (10 XP por lição)
    SELECT COALESCE(COUNT(*) * 10, 0) INTO lesson_xp
    FROM user_lesson_progress 
    WHERE user_id = user_id_param AND is_completed = true;
    
    total := quiz_xp + lesson_xp;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar dashboard do usuário (CORRIGIDA - SEM REFERÊNCIA AMBÍGUA)
CREATE OR REPLACE FUNCTION get_user_dashboard(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
    user_data JSON;
    total_xp INTEGER;
    user_level INTEGER;
    completed_quizzes INTEGER;
    completed_lessons INTEGER;
    total_coins INTEGER;
    streak_days INTEGER;
    last_activity DATE;
BEGIN
    -- Buscar dados básicos do usuário (com qualificação de tabela para evitar ambiguidade)
    SELECT row_to_json(u) INTO user_data
    FROM (
        SELECT 
            users.id,
            users.name,
            users.email,
            users.coins,
            users.created_at,
            users.last_activity_at,
            users.total_xp as stored_xp
        FROM users 
        WHERE users.id = user_id_param
    ) u;
    
    IF user_data IS NULL THEN
        RETURN json_build_object('error', 'Usuário não encontrado');
    END IF;
    
    -- Calcular XP total atual
    total_xp := calculate_user_total_xp(user_id_param);
    
    -- Calcular nível
    user_level := calculate_user_level(total_xp);
    
    -- Contar quizzes completados
    SELECT COUNT(*) INTO completed_quizzes
    FROM user_progress 
    WHERE user_id = user_id_param AND progress_type = 'quiz_completed';
    
    -- Contar lições completadas
    SELECT COUNT(*) INTO completed_lessons
    FROM user_lesson_progress 
    WHERE user_id = user_id_param AND is_completed = true;
    
    -- Buscar moedas atuais
    SELECT COALESCE(users.coins, 0) INTO total_coins
    FROM users 
    WHERE users.id = user_id_param;
    
    -- Calcular streak (simplificado)
    SELECT COALESCE(EXTRACT(DAY FROM NOW() - users.last_activity_at), 0) INTO streak_days
    FROM users 
    WHERE users.id = user_id_param;
    
    -- Retornar dados consolidados
    RETURN json_build_object(
        'user', user_data,
        'stats', json_build_object(
            'total_xp', total_xp,
            'level', user_level,
            'completed_quizzes', completed_quizzes,
            'completed_lessons', completed_lessons,
            'total_coins', total_coins,
            'streak_days', GREATEST(0, 7 - streak_days)
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Mensagem de conclusão
SELECT 'Referência ambígua corrigida com sucesso!' as status;