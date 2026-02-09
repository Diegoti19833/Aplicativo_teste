-- =====================================================
-- TABELA: quiz_options
-- Descrição: Opções das perguntas dos quizzes
-- =====================================================

CREATE TABLE IF NOT EXISTS quiz_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_quiz_options_quiz_id ON quiz_options(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_options_is_correct ON quiz_options(is_correct);
CREATE INDEX IF NOT EXISTS idx_quiz_options_order ON quiz_options(order_index);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_quiz_options_updated_at ON quiz_options;
CREATE TRIGGER update_quiz_options_updated_at
    BEFORE UPDATE ON quiz_options
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para validar que cada quiz tenha exatamente 4 opções
CREATE OR REPLACE FUNCTION validate_quiz_options_count()
RETURNS TRIGGER AS $$
DECLARE
    options_count INTEGER;
    correct_count INTEGER;
BEGIN
    -- Conta quantas opções o quiz tem
    SELECT COUNT(*) INTO options_count
    FROM quiz_options
    WHERE quiz_id = COALESCE(NEW.quiz_id, OLD.quiz_id);
    
    -- Conta quantas opções corretas o quiz tem
    SELECT COUNT(*) INTO correct_count
    FROM quiz_options
    WHERE quiz_id = COALESCE(NEW.quiz_id, OLD.quiz_id)
      AND is_correct = true;
    
    -- Valida se há exatamente 1 resposta correta
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF correct_count > 1 THEN
            RAISE EXCEPTION 'Quiz pode ter apenas 1 opção correta';
        END IF;
        
        IF correct_count = 0 AND options_count >= 4 THEN
            RAISE EXCEPTION 'Quiz deve ter pelo menos 1 opção correta';
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_quiz_options_count_trigger ON quiz_options;
CREATE TRIGGER validate_quiz_options_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON quiz_options
    FOR EACH ROW
    EXECUTE FUNCTION validate_quiz_options_count();

-- Comentários
COMMENT ON TABLE quiz_options IS 'Opções das perguntas dos quizzes';
COMMENT ON COLUMN quiz_options.option_text IS 'Texto da opção de resposta';
COMMENT ON COLUMN quiz_options.is_correct IS 'Se esta é a opção correta';
COMMENT ON COLUMN quiz_options.order_index IS 'Ordem de exibição da opção';