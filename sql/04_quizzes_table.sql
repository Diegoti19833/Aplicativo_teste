-- =====================================================
-- TABELA: quizzes
-- Descrição: Quizzes e perguntas das aulas
-- =====================================================

CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    trail_id UUID REFERENCES trails(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array de opções: ["Opção A", "Opção B", "Opção C", "Opção D"]
    correct_answer INTEGER NOT NULL CHECK (correct_answer BETWEEN 0 AND 3),
    explanation TEXT,
    xp_reward INTEGER DEFAULT 5,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id ON quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_trail_id ON quizzes(trail_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_is_active ON quizzes(is_active);
CREATE INDEX IF NOT EXISTS idx_quizzes_difficulty ON quizzes(difficulty_level);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_quizzes_updated_at ON quizzes;
CREATE TRIGGER update_quizzes_updated_at
    BEFORE UPDATE ON quizzes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para validar formato das opções
CREATE OR REPLACE FUNCTION validate_quiz_options()
RETURNS TRIGGER AS $$
BEGIN
    -- Verifica se options é um array com 4 elementos
    IF jsonb_array_length(NEW.options) != 4 THEN
        RAISE EXCEPTION 'Quiz deve ter exatamente 4 opções';
    END IF;
    
    -- Verifica se correct_answer está dentro do range válido
    IF NEW.correct_answer < 0 OR NEW.correct_answer > 3 THEN
        RAISE EXCEPTION 'correct_answer deve estar entre 0 e 3';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_quiz_options_trigger ON quizzes;
CREATE TRIGGER validate_quiz_options_trigger
    BEFORE INSERT OR UPDATE ON quizzes
    FOR EACH ROW
    EXECUTE FUNCTION validate_quiz_options();

-- Comentários
COMMENT ON TABLE quizzes IS 'Perguntas e quizzes das aulas';
COMMENT ON COLUMN quizzes.options IS 'Array JSON com 4 opções de resposta';
COMMENT ON COLUMN quizzes.correct_answer IS 'Índice da resposta correta (0-3)';
COMMENT ON COLUMN quizzes.difficulty_level IS 'Nível de dificuldade de 1 (fácil) a 5 (muito difícil)';