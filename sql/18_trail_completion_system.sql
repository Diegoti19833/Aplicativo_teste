-- =====================================================
-- SISTEMA DE PONTUAÇÃO POR TRILHA COMPLETADA
-- Descrição: Funções para detectar trilhas completadas e dar pontos extras
-- =====================================================

-- Função para verificar se uma trilha foi completada por um usuário
CREATE OR REPLACE FUNCTION check_trail_completion(p_user_id UUID, p_trail_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    total_lessons INTEGER;
    completed_lessons INTEGER;
BEGIN
    -- Conta o total de lições ativas na trilha
    SELECT COUNT(*) INTO total_lessons
    FROM lessons
    WHERE trail_id = p_trail_id AND is_active = true;
    
    -- Conta quantas lições foram completadas pelo usuário
    SELECT COUNT(DISTINCT lesson_id) INTO completed_lessons
    FROM user_progress
    WHERE user_id = p_user_id 
      AND trail_id = p_trail_id 
      AND progress_type = 'lesson_completed'
      AND completed_at IS NOT NULL;
    
    -- Retorna true se todas as lições foram completadas
    RETURN (total_lessons > 0 AND completed_lessons >= total_lessons);
END;
$$ LANGUAGE plpgsql;

-- Função para calcular pontos de bônus por trilha completada
CREATE OR REPLACE FUNCTION calculate_trail_completion_bonus(p_trail_id UUID)
RETURNS INTEGER AS $$
DECLARE
    difficulty_level INTEGER;
    total_lessons INTEGER;
    base_bonus INTEGER := 100; -- Bônus base
    difficulty_multiplier DECIMAL;
BEGIN
    -- Busca o nível de dificuldade e total de lições da trilha
    SELECT t.difficulty_level, t.total_lessons
    INTO difficulty_level, total_lessons
    FROM trails t
    WHERE t.id = p_trail_id;
    
    -- Define multiplicador baseado na dificuldade
    CASE difficulty_level
        WHEN 1 THEN difficulty_multiplier := 1.0;   -- Iniciante
        WHEN 2 THEN difficulty_multiplier := 1.5;   -- Intermediário
        WHEN 3 THEN difficulty_multiplier := 2.0;   -- Avançado
        ELSE difficulty_multiplier := 1.0;
    END CASE;
    
    -- Calcula bônus: base + (10 pontos por lição) * multiplicador de dificuldade
    RETURN ROUND(base_bonus + (total_lessons * 10) * difficulty_multiplier);
END;
$$ LANGUAGE plpgsql;

-- Função para processar conclusão de trilha e dar pontos extras
CREATE OR REPLACE FUNCTION process_trail_completion(p_user_id UUID, p_trail_id UUID)
RETURNS VOID AS $$
DECLARE
    trail_completed BOOLEAN;
    completion_bonus INTEGER;
    existing_completion UUID;
BEGIN
    -- Verifica se a trilha foi completada
    trail_completed := check_trail_completion(p_user_id, p_trail_id);
    
    IF trail_completed THEN
        -- Verifica se já existe um registro de conclusão da trilha
        SELECT id INTO existing_completion
        FROM user_progress
        WHERE user_id = p_user_id 
          AND trail_id = p_trail_id 
          AND progress_type = 'trail_completed'
          AND completed_at IS NOT NULL;
        
        -- Se não existe registro de conclusão, cria um
        IF existing_completion IS NULL THEN
            -- Calcula o bônus de conclusão
            completion_bonus := calculate_trail_completion_bonus(p_trail_id);
            
            -- Insere registro de trilha completada com bônus
            INSERT INTO user_progress (
                user_id,
                trail_id,
                progress_type,
                completion_percentage,
                xp_earned,
                completed_at
            ) VALUES (
                p_user_id,
                p_trail_id,
                'trail_completed',
                100,
                completion_bonus,
                NOW()
            );
            
            -- Log da conclusão (opcional)
            RAISE NOTICE 'Trilha % completada pelo usuário %! Bônus de % XP concedido.', 
                p_trail_id, p_user_id, completion_bonus;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Função trigger para verificar conclusão de trilha após completar lição
CREATE OR REPLACE FUNCTION check_trail_completion_on_lesson_complete()
RETURNS TRIGGER AS $$
BEGIN
    -- Só processa se for uma conclusão de lição
    IF NEW.progress_type = 'lesson_completed' AND NEW.completed_at IS NOT NULL THEN
        -- Verifica se a trilha foi completada e processa bônus
        PERFORM process_trail_completion(NEW.user_id, NEW.trail_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para verificar conclusão de trilha automaticamente
DROP TRIGGER IF EXISTS check_trail_completion_trigger ON user_progress;
CREATE TRIGGER check_trail_completion_trigger
    AFTER INSERT OR UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION check_trail_completion_on_lesson_complete();

-- Função para obter estatísticas de trilhas do usuário
CREATE OR REPLACE FUNCTION get_user_trail_stats(p_user_id UUID)
RETURNS TABLE (
    trail_id UUID,
    trail_title VARCHAR,
    total_lessons INTEGER,
    completed_lessons INTEGER,
    completion_percentage INTEGER,
    is_completed BOOLEAN,
    completion_date TIMESTAMP WITH TIME ZONE,
    total_xp_earned INTEGER,
    completion_bonus INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as trail_id,
        t.title as trail_title,
        t.total_lessons,
        COALESCE(lesson_progress.completed_count, 0) as completed_lessons,
        CASE 
            WHEN t.total_lessons > 0 THEN 
                ROUND((COALESCE(lesson_progress.completed_count, 0)::DECIMAL / t.total_lessons) * 100)::INTEGER
            ELSE 0
        END as completion_percentage,
        COALESCE(trail_completion.is_completed, false) as is_completed,
        trail_completion.completed_at as completion_date,
        COALESCE(total_xp.total_earned, 0) as total_xp_earned,
        COALESCE(trail_completion.completion_bonus, 0) as completion_bonus
    FROM trails t
    LEFT JOIN (
        -- Conta lições completadas por trilha
        SELECT 
            trail_id,
            COUNT(DISTINCT lesson_id) as completed_count
        FROM user_progress
        WHERE user_id = p_user_id 
          AND progress_type = 'lesson_completed'
          AND completed_at IS NOT NULL
        GROUP BY trail_id
    ) lesson_progress ON t.id = lesson_progress.trail_id
    LEFT JOIN (
        -- Verifica se trilha foi completada
        SELECT 
            trail_id,
            true as is_completed,
            completed_at,
            xp_earned as completion_bonus
        FROM user_progress
        WHERE user_id = p_user_id 
          AND progress_type = 'trail_completed'
          AND completed_at IS NOT NULL
    ) trail_completion ON t.id = trail_completion.trail_id
    LEFT JOIN (
        -- Soma XP total ganho na trilha
        SELECT 
            trail_id,
            SUM(xp_earned) as total_earned
        FROM user_progress
        WHERE user_id = p_user_id
        GROUP BY trail_id
    ) total_xp ON t.id = total_xp.trail_id
    WHERE t.is_active = true
    ORDER BY t.order_index, t.created_at;
END;
$$ LANGUAGE plpgsql;

-- Atualizar o tipo de progresso para incluir 'trail_completed'
ALTER TABLE user_progress 
DROP CONSTRAINT IF EXISTS user_progress_progress_type_check;

ALTER TABLE user_progress 
ADD CONSTRAINT user_progress_progress_type_check 
CHECK (progress_type IN ('trail_started', 'lesson_completed', 'quiz_completed', 'trail_completed'));

-- Comentários
COMMENT ON FUNCTION check_trail_completion IS 'Verifica se uma trilha foi completada por um usuário';
COMMENT ON FUNCTION calculate_trail_completion_bonus IS 'Calcula pontos de bônus baseado na dificuldade e número de lições';
COMMENT ON FUNCTION process_trail_completion IS 'Processa conclusão de trilha e concede pontos extras';
COMMENT ON FUNCTION get_user_trail_stats IS 'Retorna estatísticas completas das trilhas do usuário';