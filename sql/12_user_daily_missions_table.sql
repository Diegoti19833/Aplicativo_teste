-- =====================================================
-- TABELA: user_daily_missions
-- Descrição: Progresso dos usuários nas missões diárias
-- =====================================================

CREATE TABLE IF NOT EXISTS user_daily_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mission_id UUID NOT NULL REFERENCES daily_missions(id) ON DELETE CASCADE,
    current_progress INTEGER DEFAULT 0,
    target_value INTEGER NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    mission_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar missões duplicadas no mesmo dia
    UNIQUE(user_id, mission_id, mission_date)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_daily_missions_user_id ON user_daily_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_missions_mission_id ON user_daily_missions(mission_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_missions_date ON user_daily_missions(mission_date);
CREATE INDEX IF NOT EXISTS idx_user_daily_missions_completed ON user_daily_missions(is_completed);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_user_daily_missions_updated_at ON user_daily_missions;
CREATE TRIGGER update_user_daily_missions_updated_at
    BEFORE UPDATE ON user_daily_missions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para verificar conclusão de missão
CREATE OR REPLACE FUNCTION check_mission_completion()
RETURNS TRIGGER AS $$
DECLARE
    mission_xp INTEGER;
    mission_coins INTEGER;
BEGIN
    -- Verifica se a missão foi completada
    IF NEW.current_progress >= NEW.target_value AND NOT OLD.is_completed THEN
        NEW.is_completed := true;
        NEW.completed_at := NOW();
        
        -- Busca recompensas da missão
        SELECT xp_reward, coins_reward
        INTO mission_xp, mission_coins
        FROM daily_missions
        WHERE id = NEW.mission_id;
        
        -- Adiciona recompensas ao usuário
        UPDATE users
        SET total_xp = total_xp + mission_xp,
            coins = coins + mission_coins,
            last_activity_at = NOW()
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_mission_completion_trigger ON user_daily_missions;
CREATE TRIGGER check_mission_completion_trigger
    BEFORE UPDATE ON user_daily_missions
    FOR EACH ROW
    EXECUTE FUNCTION check_mission_completion();

-- Função para atualizar progresso de missões baseado em atividades
CREATE OR REPLACE FUNCTION update_mission_progress(
    p_user_id UUID,
    p_mission_type VARCHAR,
    p_progress_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
    UPDATE user_daily_missions
    SET current_progress = LEAST(current_progress + p_progress_increment, target_value),
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND mission_date = CURRENT_DATE
      AND is_completed = false
      AND mission_id IN (
          SELECT id FROM daily_missions 
          WHERE mission_type = p_mission_type AND is_active = true
      );
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE user_daily_missions IS 'Progresso dos usuários nas missões diárias';
COMMENT ON COLUMN user_daily_missions.current_progress IS 'Progresso atual do usuário na missão';
COMMENT ON COLUMN user_daily_missions.mission_date IS 'Data da missão (para controle diário)';