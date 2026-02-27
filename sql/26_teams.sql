-- ============================================================================
-- ARQUIVO: 26_teams.sql
-- DESCRIÇÃO: Estrutura para Ranking por Equipes (Times)
-- ============================================================================

-- 1. Tabela de Times (Equipes)
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    avatar_url TEXT,
    franchise_unit_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    total_xp INTEGER DEFAULT 0 -- Cache do XP total do time
);

-- Habilitar RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
DROP POLICY IF EXISTS "Times visíveis para todos os usuários logados" ON teams;
CREATE POLICY "Times visíveis para todos os usuários logados"
    ON teams FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Apenas admin/gerente pode inserir times" ON teams;
CREATE POLICY "Apenas admin/gerente pode inserir times"
    ON teams FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'gerente')
        )
    );

DROP POLICY IF EXISTS "Apenas admin/gerente pode atualizar times" ON teams;
CREATE POLICY "Apenas admin/gerente pode atualizar times"
    ON teams FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'gerente')
        )
    );


-- 2. Tabela de Relacionamento (Membros do Time)
-- Um usuário pertence a um time por vez
CREATE TABLE IF NOT EXISTS user_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id) -- Garante que o usuário só está em 1 time ativo por vez
);

ALTER TABLE user_teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Membros dos times visíveis para todos" ON user_teams;
CREATE POLICY "Membros dos times visíveis para todos"
    ON user_teams FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Apenas admin/gerente pode gerenciar membros" ON user_teams;
CREATE POLICY "Apenas admin/gerente pode gerenciar membros"
    ON user_teams FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'gerente')
        )
    );

-- 3. Histórico de Pontos Semanais por Time (Opcional, para manter ranking passado)
CREATE TABLE IF NOT EXISTS team_weekly_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    total_xp_earned INTEGER DEFAULT 0,
    lessons_completed INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, week_start_date)
);

-- ============================================================================
-- FUNÇÕES RPC
-- ============================================================================

-- Função para listar o ranking de times (calcula a soma dos XPs dos membros)
DROP FUNCTION IF EXISTS get_team_ranking(INTEGER, UUID);
CREATE OR REPLACE FUNCTION get_team_ranking(p_limit INTEGER DEFAULT 50, p_franchise_id UUID DEFAULT NULL)
RETURNS TABLE (
    team_id UUID,
    name VARCHAR,
    avatar_url TEXT,
    member_count BIGINT,
    total_xp BIGINT,
    average_xp BIGINT,
    is_user_team BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as team_id,
        t.name,
        t.avatar_url,
        COUNT(ut.user_id) as member_count,
        COALESCE(SUM(u.total_xp), 0)::BIGINT as total_xp,
        -- XP médio é útil se os times tiverem tamanhos desiguais
        CASE WHEN COUNT(ut.user_id) > 0 THEN COALESCE(SUM(u.total_xp), 0)::BIGINT / COUNT(ut.user_id) ELSE 0 END as average_xp,
        EXISTS (
            SELECT 1 FROM user_teams ut2 
            WHERE ut2.team_id = t.id AND ut2.user_id = auth.uid()
        ) as is_user_team
    FROM teams t
    LEFT JOIN user_teams ut ON ut.team_id = t.id
    LEFT JOIN users u ON u.id = ut.user_id
    WHERE t.is_active = true
      AND (p_franchise_id IS NULL OR t.franchise_unit_id = p_franchise_id)
    GROUP BY t.id, t.name, t.avatar_url
    ORDER BY total_xp DESC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Função de trigger para atualizar o XP em cache na tabela de times quando um usuário ganha XP
CREATE OR REPLACE FUNCTION sync_team_total_xp() RETURNS TRIGGER AS $$
DECLARE
    v_team_id UUID;
BEGIN
    -- Se o XP do usuário não mudou, sair
    IF (TG_OP = 'UPDATE' AND NEW.total_xp = OLD.total_xp) THEN
        RETURN NEW;
    END IF;

    -- Achar o time atual do usuário
    SELECT team_id INTO v_team_id FROM user_teams WHERE user_id = NEW.id;

    -- Se ele tem um time, recalcular o XP do time
    IF v_team_id IS NOT NULL THEN
        UPDATE teams
        SET total_xp = (
            SELECT COALESCE(SUM(u.total_xp), 0)
            FROM user_teams ut
            JOIN users u ON u.id = ut.user_id
            WHERE ut.team_id = v_team_id
        )
        WHERE id = v_team_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger atrelada à tabela users
DROP TRIGGER IF EXISTS trg_sync_team_total_xp ON users;
CREATE TRIGGER trg_sync_team_total_xp
AFTER UPDATE OF total_xp ON users
FOR EACH ROW
EXECUTE FUNCTION sync_team_total_xp();

-- Ativar realtime para o ranking de times
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'teams'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE teams;
    END IF;
END $$;
