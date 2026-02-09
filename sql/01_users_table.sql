-- =====================================================
-- TABELA: users
-- Descrição: Dados dos usuários da aplicação
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'funcionario' CHECK (role IN ('funcionario', 'gerente', 'admin')),
    total_xp INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 100,
    current_streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    lessons_completed INTEGER DEFAULT 0,
    quizzes_completed INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_total_xp ON users(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_users_current_streak ON users(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários da tabela
COMMENT ON TABLE users IS 'Usuários da aplicação de treinamento';
COMMENT ON COLUMN users.email IS 'Email único do usuário';
COMMENT ON COLUMN users.name IS 'Nome completo do usuário';
COMMENT ON COLUMN users.role IS 'Papel do usuário no sistema (funcionario, gerente, admin)';
COMMENT ON COLUMN users.total_xp IS 'Pontos de experiência acumulados';
COMMENT ON COLUMN users.coins IS 'Moedas virtuais do usuário';
COMMENT ON COLUMN users.current_streak IS 'Sequência atual de dias consecutivos';
COMMENT ON COLUMN users.max_streak IS 'Maior sequência de dias consecutivos já alcançada';
COMMENT ON COLUMN users.lessons_completed IS 'Número total de aulas completadas';
COMMENT ON COLUMN users.quizzes_completed IS 'Número total de quizzes completados corretamente';
COMMENT ON COLUMN users.is_active IS 'Se o usuário está ativo no sistema';