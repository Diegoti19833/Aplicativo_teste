-- =====================================================
-- SISTEMA DE CONCLUSÃO AUTOMÁTICA DE AULAS
-- Descrição: Marca aula como concluída quando todos os quizzes são completados
-- =====================================================

-- Função para verificar se todos os quizzes de uma aula foram completados
CREATE OR REPLACE FUNCTION check_lesson_quiz_completion(
    p_user_id UUID,
    p_lesson_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    total_quizzes INTEGER;
    completed_quizzes INTEGER;
BEGIN
    -- Conta o total de quizzes ativos na aula
    SELECT COUNT(*) INTO total_quizzes
    FROM quizzes
    WHERE lesson_id = p_lesson_id AND is_active = true;
    
    -- Se não há quizzes, considera a aula como completável
    IF total_quizzes = 0 THEN
        RETURN true;
    END IF;
    
    -- Conta quantos quizzes foram respondidos corretamente pelo usuário
    SELECT COUNT(DISTINCT quiz_id) INTO completed_quizzes
    FROM quiz_attempts
    WHERE user_id = p_user_id 
      AND quiz_id IN (
          SELECT id FROM quizzes 
          WHERE lesson_id = p_lesson_id AND is_active = true
      )
      AND is_correct = true;
    
    -- Retorna true se todos os quizzes foram completados
    RETURN (completed_quizzes >= total_quizzes);
END;
$$ LANGUAGE plpgsql;

-- Função para marcar aula como concluída automaticamente
CREATE OR REPLACE FUNCTION auto_complete_lesson_on_quiz_success(
    p_user_id UUID,
    p_lesson_id UUID
)
RETURNS VOID AS $$
DECLARE
    lesson_completed BOOLEAN;
    existing_progress RECORD;
    lesson_xp INTEGER := 50; -- XP base por completar uma aula
BEGIN
    -- Verifica se todos os quizzes da aula foram completados
    lesson_completed := check_lesson_quiz_completion(p_user_id, p_lesson_id);
    
    IF lesson_completed THEN
        -- Verifica se já existe progresso para esta aula
        SELECT * INTO existing_progress
        FROM user_progress
        WHERE user_id = p_user_id 
          AND lesson_id = p_lesson_id
          AND progress_type = 'lesson_completed';
        
        -- Se não existe registro de conclusão, cria um
        IF existing_progress IS NULL THEN
            -- Busca o trail_id da lição
            INSERT INTO user_progress (
                user_id,
                lesson_id,
                trail_id,
                progress_type,
                completion_percentage,
                xp_earned,
                is_completed,
                completed_at
            )
            SELECT 
                p_user_id,
                p_lesson_id,
                l.trail_id,
                'lesson_completed',
                100,
                lesson_xp,
                true,
                NOW()
            FROM lessons l
            WHERE l.id = p_lesson_id;
            
            -- Log da conclusão automática
            RAISE NOTICE 'Aula % automaticamente completada para usuário %! XP de % concedido.', 
                p_lesson_id, p_user_id, lesson_xp;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Função trigger para verificar conclusão automática de aula após resposta correta em quiz
CREATE OR REPLACE FUNCTION check_auto_lesson_completion_on_quiz()
RETURNS TRIGGER AS $$
BEGIN
    -- Só processa se for uma resposta correta
    IF NEW.is_correct = true THEN
        -- Busca o lesson_id do quiz
        PERFORM auto_complete_lesson_on_quiz_success(
            NEW.user_id, 
            (SELECT lesson_id FROM quizzes WHERE id = NEW.quiz_id)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para verificar conclusão automática de aula
DROP TRIGGER IF EXISTS auto_lesson_completion_trigger ON quiz_attempts;
CREATE TRIGGER auto_lesson_completion_trigger
    AFTER INSERT ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION check_auto_lesson_completion_on_quiz();

-- Função para obter progresso detalhado de uma aula (incluindo quizzes)
CREATE OR REPLACE FUNCTION get_lesson_progress_detail(
    p_user_id UUID,
    p_lesson_id UUID
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    total_quizzes INTEGER;
    completed_quizzes INTEGER;
    lesson_completed BOOLEAN;
    lesson_progress RECORD;
BEGIN
    -- Conta total de quizzes na aula
    SELECT COUNT(*) INTO total_quizzes
    FROM quizzes
    WHERE lesson_id = p_lesson_id AND is_active = true;
    
    -- Conta quizzes completados
    SELECT COUNT(DISTINCT quiz_id) INTO completed_quizzes
    FROM quiz_attempts
    WHERE user_id = p_user_id 
      AND quiz_id IN (
          SELECT id FROM quizzes 
          WHERE lesson_id = p_lesson_id AND is_active = true
      )
      AND is_correct = true;
    
    -- Verifica se a aula foi marcada como concluída
    SELECT * INTO lesson_progress
    FROM user_progress
    WHERE user_id = p_user_id 
      AND lesson_id = p_lesson_id
      AND progress_type = 'lesson_completed';
    
    lesson_completed := (lesson_progress IS NOT NULL);
    
    result := json_build_object(
        'lesson_id', p_lesson_id,
        'total_quizzes', total_quizzes,
        'completed_quizzes', completed_quizzes,
        'quiz_completion_percentage', 
            CASE 
                WHEN total_quizzes > 0 THEN 
                    ROUND((completed_quizzes::DECIMAL / total_quizzes::DECIMAL) * 100, 2)
                ELSE 100
            END,
        'all_quizzes_completed', (completed_quizzes >= total_quizzes AND total_quizzes > 0),
        'lesson_completed', lesson_completed,
        'lesson_completion_date', 
            CASE 
                WHEN lesson_progress IS NOT NULL THEN lesson_progress.completed_at
                ELSE NULL
            END,
        'lesson_xp_earned',
            CASE 
                WHEN lesson_progress IS NOT NULL THEN lesson_progress.xp_earned
                ELSE 0
            END
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para forçar verificação de conclusão de aula (útil para dados existentes)
CREATE OR REPLACE FUNCTION force_check_lesson_completion(
    p_user_id UUID,
    p_lesson_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    lesson_record RECORD;
    processed_count INTEGER := 0;
    completed_count INTEGER := 0;
BEGIN
    -- Se lesson_id específico foi fornecido
    IF p_lesson_id IS NOT NULL THEN
        PERFORM auto_complete_lesson_on_quiz_success(p_user_id, p_lesson_id);
        processed_count := 1;
        
        -- Verifica se foi completada
        IF check_lesson_quiz_completion(p_user_id, p_lesson_id) THEN
            completed_count := 1;
        END IF;
    ELSE
        -- Processa todas as aulas que o usuário tem quiz attempts
        FOR lesson_record IN
            SELECT DISTINCT l.id as lesson_id
            FROM lessons l
            JOIN quizzes q ON q.lesson_id = l.id
            JOIN quiz_attempts qa ON qa.quiz_id = q.id
            WHERE qa.user_id = p_user_id
              AND l.is_active = true
              AND q.is_active = true
        LOOP
            PERFORM auto_complete_lesson_on_quiz_success(p_user_id, lesson_record.lesson_id);
            processed_count := processed_count + 1;
            
            -- Verifica se foi completada
            IF check_lesson_quiz_completion(p_user_id, lesson_record.lesson_id) THEN
                completed_count := completed_count + 1;
            END IF;
        END LOOP;
    END IF;
    
    RETURN json_build_object(
        'processed_lessons', processed_count,
        'completed_lessons', completed_count,
        'message', 'Verificação de conclusão de aulas processada com sucesso'
    );
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON FUNCTION check_lesson_quiz_completion IS 'Verifica se todos os quizzes de uma aula foram completados corretamente';
COMMENT ON FUNCTION auto_complete_lesson_on_quiz_success IS 'Marca aula como concluída automaticamente quando todos os quizzes são completados';
COMMENT ON FUNCTION get_lesson_progress_detail IS 'Retorna progresso detalhado de uma aula incluindo status dos quizzes';
COMMENT ON FUNCTION force_check_lesson_completion IS 'Força verificação de conclusão de aulas para dados existentes';

-- Verificação final
SELECT 'Sistema de conclusão automática de aulas criado com sucesso!' as status;

-- Verificar se as funções foram criadas
SELECT 
    'check_lesson_quiz_completion' as function_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'check_lesson_quiz_completion'
    ) THEN 'CRIADA' ELSE 'ERRO' END as status
UNION ALL
SELECT 
    'auto_complete_lesson_on_quiz_success' as function_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'auto_complete_lesson_on_quiz_success'
    ) THEN 'CRIADA' ELSE 'ERRO' END as status
UNION ALL
SELECT 
    'get_lesson_progress_detail' as function_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'get_lesson_progress_detail'
    ) THEN 'CRIADA' ELSE 'ERRO' END as status
UNION ALL
SELECT 
    'force_check_lesson_completion' as function_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'force_check_lesson_completion'
    ) THEN 'CRIADA' ELSE 'ERRO' END as status;