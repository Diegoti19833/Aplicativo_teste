-- =====================================================
-- FUNÇÃO PARA OBTER PROGRESSO DA TRILHA
-- =====================================================

-- Função para obter o progresso de uma trilha específica para um usuário
CREATE OR REPLACE FUNCTION get_trail_progress(
    user_id_param UUID,
    trail_id_param UUID
)
RETURNS TABLE(
    progress_percentage DECIMAL,
    completed_lessons INTEGER,
    total_lessons INTEGER,
    is_completed BOOLEAN
) AS $$
DECLARE
    total_lessons_count INTEGER;
    completed_lessons_count INTEGER;
    progress_percent DECIMAL;
    trail_completed BOOLEAN;
BEGIN
    -- Contar total de lições na trilha
    SELECT COUNT(*) INTO total_lessons_count
    FROM lessons
    WHERE trail_id = trail_id_param AND is_active = true;
    
    -- Contar lições completadas pelo usuário
    SELECT COUNT(*) INTO completed_lessons_count
    FROM user_progress up
    JOIN lessons l ON up.lesson_id = l.id
    WHERE up.user_id = user_id_param 
      AND l.trail_id = trail_id_param 
      AND up.progress_type = 'lesson_completed'
      AND up.is_completed = true;
    
    -- Calcular porcentagem de progresso
    IF total_lessons_count > 0 THEN
        progress_percent := (completed_lessons_count::DECIMAL / total_lessons_count::DECIMAL) * 100;
    ELSE
        progress_percent := 0;
    END IF;
    
    -- Verificar se a trilha está completada
    trail_completed := (completed_lessons_count = total_lessons_count AND total_lessons_count > 0);
    
    -- Retornar resultado
    RETURN QUERY SELECT 
        progress_percent,
        completed_lessons_count,
        total_lessons_count,
        trail_completed;
END;
$$ LANGUAGE plpgsql;

-- Comentário sobre a função
COMMENT ON FUNCTION get_trail_progress(UUID, UUID) IS 'Retorna o progresso de uma trilha específica para um usuário, incluindo porcentagem, lições completadas e status de conclusão';