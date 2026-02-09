-- Correção para o CASE statement na função calculate_quiz_result
-- Esta função é executada automaticamente quando uma resposta é submetida

-- Remove primeiro o trigger que depende da função
DROP TRIGGER IF EXISTS calculate_quiz_result_trigger ON quiz_attempts;

-- Remove a função existente
DROP FUNCTION IF EXISTS calculate_quiz_result();

-- Recria a função com CASE statement corrigido
CREATE OR REPLACE FUNCTION calculate_quiz_result()
RETURNS TRIGGER AS $$
DECLARE
    quiz_xp_reward INTEGER;
    user_attempt_count INTEGER;
    option_is_correct BOOLEAN;
BEGIN
    -- Busca o XP do quiz
    SELECT xp_reward 
    INTO quiz_xp_reward
    FROM quizzes 
    WHERE id = NEW.quiz_id;
    
    -- Verifica se a opção selecionada está correta
    SELECT is_correct 
    INTO option_is_correct
    FROM quiz_options 
    WHERE id = NEW.selected_option_id;
    
    NEW.is_correct := option_is_correct;
    
    -- Conta tentativas anteriores do usuário neste quiz
    SELECT COUNT(*) + 1
    INTO user_attempt_count
    FROM quiz_attempts
    WHERE user_id = NEW.user_id AND quiz_id = NEW.quiz_id;
    
    NEW.attempt_number := user_attempt_count;
    
    -- Calcula XP baseado na correção e número de tentativas
    IF NEW.is_correct THEN
        CASE 
            WHEN NEW.attempt_number = 1 THEN
                NEW.xp_earned := quiz_xp_reward; -- XP completo na primeira tentativa
            WHEN NEW.attempt_number = 2 THEN
                NEW.xp_earned := quiz_xp_reward / 2; -- Metade do XP na segunda tentativa
            WHEN NEW.attempt_number >= 3 THEN
                NEW.xp_earned := quiz_xp_reward / 4; -- 1/4 do XP nas demais tentativas
            ELSE
                NEW.xp_earned := 0; -- Fallback para casos não previstos
        END CASE;
    ELSE
        NEW.xp_earned := 0; -- Sem XP para respostas incorretas
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recria o trigger
CREATE TRIGGER calculate_quiz_result_trigger
    BEFORE INSERT ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION calculate_quiz_result();