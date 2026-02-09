-- Correção para o CASE statement na função check_achievements
-- Remove e recria a função com CASE statement corrigido

-- Remover trigger primeiro
DROP TRIGGER IF EXISTS trigger_update_user_stats_quiz_attempts ON quiz_attempts;

-- Remover função
DROP FUNCTION IF EXISTS check_achievements(UUID);

-- Recriar função com CASE statement corrigido
CREATE OR REPLACE FUNCTION check_achievements(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    achievement_record RECORD;
    user_stats RECORD;
    unlocked_count INTEGER := 0;
BEGIN
    -- Buscar estatísticas do usuário
    SELECT total_xp, level, lessons_completed, quizzes_completed, 
           current_streak, coins
    INTO user_stats
    FROM users 
    WHERE id = user_uuid;
    
    -- Verificar cada conquista ativa
    FOR achievement_record IN 
        SELECT * FROM achievements 
        WHERE is_active = true
          AND id NOT IN (
              SELECT achievement_id 
              FROM user_achievements 
              WHERE user_id = user_uuid
          )
    LOOP
        DECLARE
            should_unlock BOOLEAN := false;
            progress_value INTEGER := 0;
        BEGIN
            -- Verificar critério baseado no tipo
            CASE achievement_record.achievement_type
                WHEN 'xp_milestone' THEN
                    should_unlock := user_stats.total_xp >= achievement_record.requirement_value;
                    progress_value := user_stats.total_xp;
                    
                WHEN 'level_reached' THEN
                    should_unlock := user_stats.level >= achievement_record.requirement_value;
                    progress_value := user_stats.level;
                    
                WHEN 'lessons_completed' THEN
                    should_unlock := user_stats.lessons_completed >= achievement_record.requirement_value;
                    progress_value := user_stats.lessons_completed;
                    
                WHEN 'quizzes_completed' THEN
                    should_unlock := user_stats.quizzes_completed >= achievement_record.requirement_value;
                    progress_value := user_stats.quizzes_completed;
                    
                WHEN 'streak' THEN
                    should_unlock := user_stats.current_streak >= achievement_record.requirement_value;
                    progress_value := user_stats.current_streak;
                    
                WHEN 'perfect_quiz' THEN
                    -- Verificar se tem quiz perfeito (primeira tentativa correta)
                    SELECT COUNT(*) INTO progress_value
                    FROM quiz_attempts 
                    WHERE user_id = user_uuid 
                      AND is_correct = true 
                      AND attempt_number = 1;
                    should_unlock := progress_value >= achievement_record.requirement_value;
                    
                ELSE
                    -- Tipo de conquista não reconhecido (ELSE explícito)
                    should_unlock := false;
                    progress_value := 0;
            END CASE;
            
            -- Desbloquear conquista se critério atendido
            IF should_unlock THEN
                INSERT INTO user_achievements (
                    user_id, achievement_id, progress_value
                ) VALUES (
                    user_uuid, achievement_record.id, progress_value
                );
                unlocked_count := unlocked_count + 1;
            END IF;
        END;
    END LOOP;
    
    -- Atualizar estatísticas se houve desbloqueios
    IF unlocked_count > 0 THEN
        PERFORM update_user_stats(user_uuid);
    END IF;
    
    RETURN unlocked_count;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger
CREATE TRIGGER trigger_update_user_stats_quiz_attempts
    AFTER INSERT ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_user_stats();