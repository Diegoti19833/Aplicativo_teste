-- =====================================================
-- TABELA: lessons
-- Descrição: Aulas dentro das trilhas
-- =====================================================

CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trail_id UUID NOT NULL REFERENCES trails(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,
    video_url TEXT,
    duration INTEGER DEFAULT 15, -- em minutos
    xp_reward INTEGER DEFAULT 10,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    lesson_type VARCHAR(50) DEFAULT 'video' CHECK (lesson_type IN ('video', 'text', 'interactive', 'quiz')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_lessons_trail_id ON lessons(trail_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order_index ON lessons(order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_is_active ON lessons(is_active);
CREATE INDEX IF NOT EXISTS idx_lessons_type ON lessons(lesson_type);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;
CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar total_lessons na trilha
CREATE OR REPLACE FUNCTION update_trail_lesson_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE trails 
        SET total_lessons = (
            SELECT COUNT(*) 
            FROM lessons 
            WHERE trail_id = NEW.trail_id AND is_active = true
        )
        WHERE id = NEW.trail_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE trails 
        SET total_lessons = (
            SELECT COUNT(*) 
            FROM lessons 
            WHERE trail_id = OLD.trail_id AND is_active = true
        )
        WHERE id = OLD.trail_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE trails 
        SET total_lessons = (
            SELECT COUNT(*) 
            FROM lessons 
            WHERE trail_id = NEW.trail_id AND is_active = true
        )
        WHERE id = NEW.trail_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_trail_lesson_count_trigger ON lessons;
CREATE TRIGGER update_trail_lesson_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_trail_lesson_count();

-- Comentários
COMMENT ON TABLE lessons IS 'Aulas das trilhas de aprendizado';
COMMENT ON COLUMN lessons.duration IS 'Duração estimada da aula em minutos';
COMMENT ON COLUMN lessons.xp_reward IS 'Pontos de experiência ganhos ao completar a aula';
COMMENT ON COLUMN lessons.lesson_type IS 'Tipo da aula: video, text, interactive, quiz';