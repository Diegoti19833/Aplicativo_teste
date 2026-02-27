-- ============================================================================
-- FIX: update_user_current_streak function (Trigger on user_streaks)
-- Corrige o erro: column reference "current_streak" is ambiguous
-- Substituindo a variável current_streak por v_current_streak para evitar conflito com a coluna da tabela users
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_current_streak()
RETURNS TRIGGER AS $$
DECLARE
    v_current_streak INTEGER := 0;
    streak_record RECORD;
BEGIN
    -- Calcula o streak atual contando dias consecutivos de trás para frente
    FOR streak_record IN 
        SELECT streak_date, is_streak_day
        FROM user_streaks
        WHERE user_id = NEW.user_id
          AND streak_date <= NEW.streak_date
        ORDER BY streak_date DESC
    LOOP
        IF streak_record.is_streak_day THEN
            v_current_streak := v_current_streak + 1;
        ELSE
            EXIT; -- Para no primeiro dia sem streak
        END IF;
    END LOOP;
    
    -- Atualiza o streak atual do usuário
    UPDATE users
    SET current_streak = v_current_streak,
        last_activity_at = NOW()
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
