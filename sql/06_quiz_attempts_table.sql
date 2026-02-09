-- =====================================================
-- TABELA: quiz_attempts
-- Descrição: Tentativas dos usuários nos quizzes
-- =====================================================

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    selected_option_id UUID REFERENCES quiz_options(id) ON DELETE CASCADE,
    is_correct BOOLEAN NOT NULL,
    xp_earned INTEGER DEFAULT 0,
    time_taken INTEGER DEFAULT 0, -- em segundos
    attempt_number INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_is_correct ON quiz_attempts(is_correct);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_created_at ON quiz_attempts(created_at);

-- Função para calcular se a resposta está correta e XP
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
            ELSE
                NEW.xp_earned := quiz_xp_reward / 4; -- 1/4 do XP nas demais tentativas
        END CASE;
    ELSE
        NEW.xp_earned := 0; -- Sem XP para respostas incorretas
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_quiz_result_trigger ON quiz_attempts;
CREATE TRIGGER calculate_quiz_result_trigger
    BEFORE INSERT ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION calculate_quiz_result();

-- Função para atualizar XP do usuário após tentativa de quiz
CREATE OR REPLACE FUNCTION update_user_xp_on_quiz_attempt()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.xp_earned > 0 THEN
        UPDATE users 
        SET total_xp = total_xp + NEW.xp_earned,
            last_activity_at = NOW()
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_xp_on_quiz_attempt_trigger ON quiz_attempts;
CREATE TRIGGER update_user_xp_on_quiz_attempt_trigger
    AFTER INSERT ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_user_xp_on_quiz_attempt();

-- Comentários
COMMENT ON TABLE quiz_attempts IS 'Tentativas dos usuários nos quizzes';
COMMENT ON COLUMN quiz_attempts.selected_option_id IS 'ID da opção selecionada pelo usuário';
COMMENT ON COLUMN quiz_attempts.attempt_number IS 'Número da tentativa do usuário neste quiz';
COMMENT ON COLUMN quiz_attempts.time_taken IS 'Tempo gasto para responder em segundos';