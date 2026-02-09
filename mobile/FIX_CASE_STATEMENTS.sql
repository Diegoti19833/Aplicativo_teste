-- =====================================================
-- CORREÇÃO DEFINITIVA PARA CASE STATEMENTS SEM ELSE
-- Execute este script no painel SQL do Supabase
-- =====================================================

-- 1. Remover função existente e recriar com correção
DROP FUNCTION IF EXISTS check_quiz_answer(uuid,uuid,uuid);

-- Corrigir função check_quiz_answer (CASE statement sem ELSE para resposta incorreta)
CREATE OR REPLACE FUNCTION check_quiz_answer(
    user_uuid UUID,
    quiz_uuid UUID,
    selected_option_uuid UUID
)
RETURNS JSON AS $$
DECLARE
    is_correct BOOLEAN := false;
    quiz_xp INTEGER := 0;
    attempt_count INTEGER := 0;
    xp_earned INTEGER := 0;
    result JSON;
BEGIN
    -- Verificar se a resposta está correta
    SELECT (selected_option_uuid = q.correct_answer_id) INTO is_correct
    FROM quizzes q
    WHERE q.id = quiz_uuid;
    
    -- Buscar XP do quiz
    SELECT xp_reward INTO quiz_xp
    FROM quizzes 
    WHERE id = quiz_uuid;
    
    -- Contar tentativas anteriores
    SELECT COUNT(*) INTO attempt_count
    FROM quiz_attempts 
    WHERE user_id = user_uuid AND quiz_id = quiz_uuid;
    
    -- Calcular XP baseado na tentativa (CORRIGIDO: ELSE para resposta incorreta)
    IF is_correct THEN
        CASE attempt_count
            WHEN 0 THEN xp_earned := quiz_xp; -- Primeira tentativa: XP completo
            WHEN 1 THEN xp_earned := quiz_xp * 0.7; -- Segunda tentativa: 70%
            WHEN 2 THEN xp_earned := quiz_xp * 0.5; -- Terceira tentativa: 50%
            ELSE xp_earned := quiz_xp * 0.3; -- Demais tentativas: 30%
        END CASE;
    ELSE
        xp_earned := 0; -- Resposta incorreta não ganha XP
    END IF;
    
    -- Registrar tentativa
    INSERT INTO quiz_attempts (
        user_id, quiz_id, selected_option_id, 
        is_correct, xp_earned, attempt_number
    ) VALUES (
        user_uuid, quiz_uuid, selected_option_uuid,
        is_correct, xp_earned, attempt_count + 1
    );
    
    -- Atualizar estatísticas do usuário
    PERFORM update_user_stats(user_uuid);
    
    -- Verificar conquistas
    PERFORM check_achievements(user_uuid);
    
    -- Retornar resultado
    result := json_build_object(
        'is_correct', is_correct,
        'xp_earned', xp_earned,
        'attempt_number', attempt_count + 1,
        'total_attempts', attempt_count + 1
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Remover função existente e recriar com correção
DROP FUNCTION IF EXISTS answer_quiz(uuid,uuid,text);

-- Criar função answer_quiz corrigida (baseada no arquivo answer_quiz_function.sql)
CREATE OR REPLACE FUNCTION answer_quiz(
    user_id_param UUID,
    quiz_id_param UUID,
    selected_option_param TEXT
)
RETURNS JSON AS $$
DECLARE
    quiz_data RECORD;
    is_correct BOOLEAN := false;
    attempt_count INTEGER := 0;
    xp_earned INTEGER := 0;
    result JSON;
BEGIN
    -- Buscar dados do quiz
    SELECT * INTO quiz_data FROM quizzes WHERE id = quiz_id_param;
    
    IF quiz_data IS NULL THEN
        RETURN json_build_object('error', 'Quiz não encontrado');
    END IF;
    
    -- Verificar se a resposta está correta
    is_correct := (selected_option_param = quiz_data.correct_answer);
    
    -- Contar tentativas anteriores para este quiz
    SELECT COUNT(*) INTO attempt_count
    FROM quiz_attempts 
    WHERE user_id = user_id_param AND quiz_id = quiz_id_param;
    
    -- Calcular XP baseado na tentativa (CORRIGIDO: ELSE para resposta incorreta)
    IF is_correct THEN
        CASE attempt_count
            WHEN 0 THEN xp_earned := quiz_data.xp_reward; -- Primeira tentativa: XP completo
            WHEN 1 THEN xp_earned := ROUND(quiz_data.xp_reward * 0.7); -- Segunda tentativa: 70%
            WHEN 2 THEN xp_earned := ROUND(quiz_data.xp_reward * 0.5); -- Terceira tentativa: 50%
            ELSE xp_earned := ROUND(quiz_data.xp_reward * 0.3); -- Demais tentativas: 30%
        END CASE;
    ELSE
        xp_earned := 0; -- Resposta incorreta não ganha XP
    END IF;
    
    -- Registrar tentativa na tabela quiz_attempts
    INSERT INTO quiz_attempts (
        user_id, 
        quiz_id, 
        selected_option_id, 
        is_correct, 
        xp_earned, 
        attempt_number,
        created_at
    ) VALUES (
        user_id_param, 
        quiz_id_param, 
        NULL, -- Como não temos quiz_options, usamos NULL
        is_correct, 
        xp_earned, 
        attempt_count + 1,
        NOW()
    );
    
    -- Atualizar XP do usuário se ganhou pontos
    IF xp_earned > 0 THEN
        UPDATE users 
        SET total_xp = COALESCE(total_xp, 0) + xp_earned,
            updated_at = NOW()
        WHERE id = user_id_param;
    END IF;
    
    -- Atualizar estatísticas
    PERFORM update_user_stats(user_id_param);
    
    -- Verificar conquistas
    PERFORM check_achievements(user_id_param);
    
    -- Retornar resultado
    result := json_build_object(
        'is_correct', is_correct,
        'xp_earned', xp_earned,
        'attempt_number', attempt_count + 1,
        'quiz_id', quiz_id_param,
        'selected_option', selected_option_param,
        'correct_answer', quiz_data.correct_answer
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INSTRUÇÕES:
-- 1. Copie todo este código
-- 2. Vá para o painel do Supabase > SQL Editor
-- 3. Cole o código e execute
-- 4. Teste a submissão de resposta no quiz
-- =====================================================