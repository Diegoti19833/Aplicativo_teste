-- =====================================================
-- TABELA: trails
-- Descrição: Trilhas de aprendizado
-- =====================================================

CREATE TABLE IF NOT EXISTS trails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    estimated_duration INTEGER DEFAULT 60, -- em minutos
    total_lessons INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_trails_is_active ON trails(is_active);
CREATE INDEX IF NOT EXISTS idx_trails_order_index ON trails(order_index);
CREATE INDEX IF NOT EXISTS idx_trails_difficulty ON trails(difficulty_level);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_trails_updated_at ON trails;
CREATE TRIGGER update_trails_updated_at
    BEFORE UPDATE ON trails
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE trails IS 'Trilhas de aprendizado da aplicação';
COMMENT ON COLUMN trails.difficulty_level IS 'Nível de dificuldade de 1 (fácil) a 5 (muito difícil)';
COMMENT ON COLUMN trails.estimated_duration IS 'Duração estimada em minutos para completar a trilha';
COMMENT ON COLUMN trails.total_lessons IS 'Número total de aulas na trilha';
COMMENT ON COLUMN trails.order_index IS 'Ordem de exibição das trilhas';