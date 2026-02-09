-- Script para corrigir a função complete_lesson
-- Execute este script no Supabase SQL Editor

-- Primeiro, vamos criar a função mark_lesson_complete
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
    -- Verificar se já existe progresso para esta aula
    SELECT * INTO existing_progress 
    FROM user_progress 
    WHERE user_id = user_id_param AND lesson_id = lesson_id_param;
    
    IF existing_progress IS NULL THEN
        -- Criar novo progresso
        INSERT INTO user_progress (
            user_id, 
            lesson_id, 
            progress_percentage, 
            is_completed, 
            xp_earned,
            completed_at
        ) VALUES (
            user_id_param, 
            lesson_id_param, 
            100, 
            true, 
            xp_earned_param,
            NOW()
        );
    ELSE
        -- Atualizar progresso existente
        UPDATE user_progress 
        SET 
            progress_percentage = 100,
            is_completed = true,
            xp_earned = GREATEST(xp_earned, xp_earned_param),
            completed_at = COALESCE(completed_at, NOW()),
            updated_at = NOW()
        WHERE user_id = user_id_param AND lesson_id = lesson_id_param;
    END IF;
    
    -- Atualizar estatísticas do usuário (se a função existir)
    BEGIN
        PERFORM update_user_stats(user_id_param);
    EXCEPTION WHEN undefined_function THEN
        -- Se a função não existir, apenas continue
        NULL;
    END;
    
    result := json_build_object(
        'success', true,
        'xp_earned', xp_earned_param,
        'message', 'Aula marcada como completa'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agora criar a função complete_lesson como alias
CREATE OR REPLACE FUNCTION complete_lesson(
    user_id_param UUID,
    lesson_id_param UUID,
    xp_earned_param INTEGER DEFAULT 10
)
RETURNS JSON AS $$
BEGIN
    RETURN mark_lesson_complete(user_id_param, lesson_id_param, xp_earned_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Criar trigger para atualizar XP automaticamente
DROP TRIGGER IF EXISTS update_user_xp_on_progress_trigger ON user_progress;
CREATE TRIGGER update_user_xp_on_progress_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_user_xp_on_progress();

-- Adicionar comentários
COMMENT ON FUNCTION mark_lesson_complete(UUID, UUID, INTEGER) IS 'Marca aula como completa e atualiza progresso';
COMMENT ON FUNCTION complete_lesson(UUID, UUID, INTEGER) IS 'Alias para mark_lesson_complete - completa uma aula';
COMMENT ON FUNCTION update_user_xp_on_progress() IS 'Trigger function para atualizar XP do usuário baseado no progresso';

-- Verificar se as funções foram criadas
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name IN ('complete_lesson', 'mark_lesson_complete', 'update_user_xp_on_progress')
AND routine_schema = 'public';