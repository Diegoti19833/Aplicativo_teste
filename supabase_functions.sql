-- =====================================================
-- FUNÇÕES AUXILIARES - PET CLASS
-- Descrição: Funções para gamificação e lógica de negócio
-- =====================================================

-- =====================================================
-- FUNÇÕES DE PROGRESSO E XP
-- =====================================================

-- Função para calcular XP total do usuário
CREATE OR REPLACE FUNCTION calculate_user_total_xp(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_xp INTEGER := 0;
BEGIN
    -- XP de progresso em aulas
    SELECT COALESCE(SUM(xp_earned), 0) INTO total_xp
    FROM user_progress 
    WHERE user_id = user_uuid;
    
    -- XP de tentativas de quiz
    total_xp := total_xp + COALESCE((
        SELECT SUM(xp_earned) 
        FROM quiz_attempts 
        WHERE user_id = user_uuid
    ), 0);
    
    -- XP de conquistas
    total_xp := total_xp + COALESCE((
        SELECT SUM(a.xp_reward) 
        FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.user_id = user_uuid
    ), 0);
    
    -- XP de missões diárias
    total_xp := total_xp + COALESCE((
        SELECT SUM(dm.xp_reward) 
        FROM user_daily_missions udm
        JOIN daily_missions dm ON udm.mission_id = dm.id
        WHERE udm.user_id = user_uuid AND udm.is_completed = true
    ), 0);
    
    RETURN total_xp;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular nível do usuário baseado no XP
CREATE OR REPLACE FUNCTION calculate_user_level(total_xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Fórmula: Nível = sqrt(XP / 100)
    -- Cada nível requer progressivamente mais XP
    RETURN GREATEST(1, FLOOR(SQRT(total_xp / 100.0))::INTEGER);
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar estatísticas do usuário
CREATE OR REPLACE FUNCTION update_user_stats(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    new_total_xp INTEGER;
    new_level INTEGER;
    completed_lessons INTEGER;
    completed_quizzes INTEGER;
    current_streak INTEGER;
BEGIN
    -- Calcular XP total
    new_total_xp := calculate_user_total_xp(user_uuid);
    
    -- Calcular nível
    new_level := calculate_user_level(new_total_xp);
    
    -- Contar aulas completadas
    SELECT COUNT(*) INTO completed_lessons
    FROM user_progress 
    WHERE user_id = user_uuid 
      AND progress_type = 'lesson' 
      AND completion_percentage = 100;
    
    -- Contar quizzes completados (corretos)
    SELECT COUNT(*) INTO completed_quizzes
    FROM quiz_attempts 
    WHERE user_id = user_uuid 
      AND is_correct = true;
    
    -- Calcular streak atual
    SELECT COALESCE(users.current_streak, 0) INTO current_streak
    FROM users 
    WHERE id = user_uuid;
    
    -- Atualizar usuário
    UPDATE users SET
        total_xp = new_total_xp,
        level = new_level,
        lessons_completed = completed_lessons,
        quizzes_completed = completed_quizzes,
        updated_at = NOW()
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÕES DE QUIZ E AVALIAÇÃO
-- =====================================================

-- Função para obter quiz com opções
CREATE OR REPLACE FUNCTION get_quiz_with_options(quiz_uuid UUID)
RETURNS JSON AS $$
DECLARE
    quiz_data JSON;
    options_data JSON;
BEGIN
    -- Buscar dados do quiz
    SELECT row_to_json(q) INTO quiz_data
    FROM (
        SELECT id, lesson_id, trail_id, title, question, 
               xp_reward, difficulty_level, order_index
        FROM quizzes 
        WHERE id = quiz_uuid AND is_active = true
    ) q;
    
    -- Buscar opções do quiz
    SELECT json_agg(
        json_build_object(
            'id', id,
            'option_text', option_text,
            'order_index', order_index
        ) ORDER BY order_index
    ) INTO options_data
    FROM quiz_options 
    WHERE quiz_id = quiz_uuid;
    
    -- Combinar dados
    RETURN json_build_object(
        'quiz', quiz_data,
        'options', options_data
    );
END;
$$ LANGUAGE plpgsql;

-- Função para verificar resposta do quiz
CREATE OR REPLACE FUNCTION check_quiz_answer(
    quiz_uuid UUID, 
    selected_option_uuid UUID, 
    user_uuid UUID
)
RETURNS JSON AS $$
DECLARE
    is_correct BOOLEAN;
    xp_earned INTEGER := 0;
    attempt_count INTEGER;
    quiz_xp INTEGER;
BEGIN
    -- Verificar se a opção está correta
    SELECT qo.is_correct INTO is_correct
    FROM quiz_options qo
    WHERE qo.id = selected_option_uuid;
    
    -- Buscar XP do quiz
    SELECT xp_reward INTO quiz_xp
    FROM quizzes 
    WHERE id = quiz_uuid;
    
    -- Contar tentativas anteriores
    SELECT COUNT(*) INTO attempt_count
    FROM quiz_attempts 
    WHERE user_id = user_uuid AND quiz_id = quiz_uuid;
    
    -- Calcular XP baseado na tentativa
    IF is_correct THEN
        CASE attempt_count
            WHEN 0 THEN xp_earned := quiz_xp; -- Primeira tentativa: XP completo
            WHEN 1 THEN xp_earned := quiz_xp * 0.7; -- Segunda tentativa: 70%
            WHEN 2 THEN xp_earned := quiz_xp * 0.5; -- Terceira tentativa: 50%
            ELSE xp_earned := quiz_xp * 0.3; -- Demais tentativas: 30%
        END CASE;
    ELSE
        xp_earned := 0; -- Resposta incorreta não ganha XP
    END IF;
    
    -- Registrar tentativa
    INSERT INTO quiz_attempts (
        user_id, quiz_id, selected_option_id, 
        is_correct, xp_earned, attempt_number
    ) VALUES (
        user_uuid, quiz_uuid, selected_option_uuid,
        is_correct, xp_earned, attempt_count + 1
    );
    
    -- Atualizar estatísticas do usuário
    PERFORM update_user_stats(user_uuid);
    
    -- Retornar resultado
    RETURN json_build_object(
        'is_correct', is_correct,
        'xp_earned', xp_earned,
        'attempt_number', attempt_count + 1,
        'total_attempts', attempt_count + 1
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÕES DE CONQUISTAS
-- =====================================================

-- Função para verificar e desbloquear conquistas
CREATE OR REPLACE FUNCTION check_achievements(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    achievement_record RECORD;
    user_stats RECORD;
    unlocked_count INTEGER := 0;
BEGIN
    -- Buscar estatísticas do usuário
    SELECT total_xp, level, lessons_completed, quizzes_completed, 
           current_streak, coins
    INTO user_stats
    FROM users 
    WHERE id = user_uuid;
    
    -- Verificar cada conquista ativa
    FOR achievement_record IN 
        SELECT * FROM achievements 
        WHERE is_active = true
          AND id NOT IN (
              SELECT achievement_id 
              FROM user_achievements 
              WHERE user_id = user_uuid
          )
    LOOP
        DECLARE
            should_unlock BOOLEAN := false;
            progress_value INTEGER := 0;
        BEGIN
            -- Verificar critério baseado no tipo
            CASE achievement_record.achievement_type
                WHEN 'xp_milestone' THEN
                    should_unlock := user_stats.total_xp >= achievement_record.requirement_value;
                    progress_value := user_stats.total_xp;
                    
                WHEN 'level_reached' THEN
                    should_unlock := user_stats.level >= achievement_record.requirement_value;
                    progress_value := user_stats.level;
                    
                WHEN 'lessons_completed' THEN
                    should_unlock := user_stats.lessons_completed >= achievement_record.requirement_value;
                    progress_value := user_stats.lessons_completed;
                    
                WHEN 'quizzes_completed' THEN
                    should_unlock := user_stats.quizzes_completed >= achievement_record.requirement_value;
                    progress_value := user_stats.quizzes_completed;
                    
                WHEN 'streak' THEN
                    should_unlock := user_stats.current_streak >= achievement_record.requirement_value;
                    progress_value := user_stats.current_streak;
                    
                WHEN 'perfect_quiz' THEN
                    -- Verificar se tem quiz perfeito (primeira tentativa correta)
                    SELECT COUNT(*) INTO progress_value
                    FROM quiz_attempts 
                    WHERE user_id = user_uuid 
                      AND is_correct = true 
                      AND attempt_number = 1;
                    should_unlock := progress_value >= achievement_record.requirement_value;
                ELSE
                    -- Tipo de conquista não reconhecido
                    should_unlock := false;
                    progress_value := 0;
            END CASE;
            
            -- Desbloquear conquista se critério atendido
            IF should_unlock THEN
                INSERT INTO user_achievements (
                    user_id, achievement_id, progress_value
                ) VALUES (
                    user_uuid, achievement_record.id, progress_value
                );
                unlocked_count := unlocked_count + 1;
            END IF;
        END;
    END LOOP;
    
    -- Atualizar estatísticas se houve desbloqueios
    IF unlocked_count > 0 THEN
        PERFORM update_user_stats(user_uuid);
    END IF;
    
    RETURN unlocked_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÕES DE MISSÕES DIÁRIAS
-- =====================================================

-- Função para gerar missões diárias para um usuário
CREATE OR REPLACE FUNCTION generate_daily_missions(user_uuid UUID, mission_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
    mission_record RECORD;
    generated_count INTEGER := 0;
BEGIN
    -- Verificar se já existem missões para esta data
    IF EXISTS (
        SELECT 1 FROM user_daily_missions 
        WHERE user_id = user_uuid AND mission_date = mission_date
    ) THEN
        RETURN 0; -- Já existem missões para hoje
    END IF;
    
    -- Gerar 3 missões aleatórias para o usuário
    FOR mission_record IN 
        SELECT * FROM daily_missions 
        WHERE is_active = true
        ORDER BY RANDOM()
        LIMIT 3
    LOOP
        INSERT INTO user_daily_missions (
            user_id, mission_id, target_value, mission_date
        ) VALUES (
            user_uuid, mission_record.id, mission_record.target_value, mission_date
        );
        generated_count := generated_count + 1;
    END LOOP;
    
    RETURN generated_count;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar progresso de missões diárias
CREATE OR REPLACE FUNCTION update_daily_mission_progress(
    user_uuid UUID, 
    mission_type_param TEXT, 
    increment_value INTEGER DEFAULT 1
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
    mission_record RECORD;
BEGIN
    -- Atualizar progresso das missões do tipo especificado
    FOR mission_record IN
        SELECT udm.*, dm.mission_type, dm.xp_reward, dm.coins_reward
        FROM user_daily_missions udm
        JOIN daily_missions dm ON udm.mission_id = dm.id
        WHERE udm.user_id = user_uuid
          AND udm.mission_date = CURRENT_DATE
          AND dm.mission_type = mission_type_param
          AND udm.is_completed = false
    LOOP
        -- Incrementar progresso
        UPDATE user_daily_missions 
        SET current_progress = LEAST(current_progress + increment_value, target_value),
            updated_at = NOW()
        WHERE id = mission_record.id;
        
        -- Verificar se completou a missão
        IF mission_record.current_progress + increment_value >= mission_record.target_value THEN
            UPDATE user_daily_missions 
            SET is_completed = true,
                completed_at = NOW()
            WHERE id = mission_record.id;
            
            -- Recompensar usuário
            UPDATE users 
            SET coins = coins + mission_record.coins_reward
            WHERE id = user_uuid;
            
            updated_count := updated_count + 1;
        END IF;
    END LOOP;
    
    -- Atualizar estatísticas se houve completações
    IF updated_count > 0 THEN
        PERFORM update_user_stats(user_uuid);
    END IF;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÕES DE LOJA E COMPRAS
-- =====================================================

-- Função para processar compra na loja
CREATE OR REPLACE FUNCTION process_store_purchase(
    user_uuid UUID,
    item_uuid UUID,
    quantity_param INTEGER DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
    item_record RECORD;
    user_coins INTEGER;
    total_cost INTEGER;
    final_price INTEGER;
    user_purchase_count INTEGER;
BEGIN
    -- Buscar item da loja
    SELECT * INTO item_record
    FROM store_items 
    WHERE id = item_uuid AND is_available = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Item não encontrado ou indisponível');
    END IF;
    
    -- Verificar estoque
    IF item_record.stock_quantity IS NOT NULL AND item_record.stock_quantity < quantity_param THEN
        RETURN json_build_object('success', false, 'error', 'Estoque insuficiente');
    END IF;
    
    -- Verificar limite de compras por usuário
    IF item_record.purchase_limit IS NOT NULL THEN
        SELECT COUNT(*) INTO user_purchase_count
        FROM user_purchases 
        WHERE user_id = user_uuid AND item_id = item_uuid;
        
        IF user_purchase_count + quantity_param > item_record.purchase_limit THEN
            RETURN json_build_object('success', false, 'error', 'Limite de compras excedido');
        END IF;
    END IF;
    
    -- Calcular preço final com desconto
    final_price := FLOOR(item_record.price * (100 - COALESCE(item_record.discount_percentage, 0)) / 100.0);
    total_cost := final_price * quantity_param;
    
    -- Verificar moedas do usuário
    SELECT coins INTO user_coins
    FROM users 
    WHERE id = user_uuid;
    
    IF user_coins < total_cost THEN
        RETURN json_build_object('success', false, 'error', 'Moedas insuficientes');
    END IF;
    
    -- Processar compra
    INSERT INTO user_purchases (
        user_id, item_id, quantity, unit_price, 
        total_price, discount_applied
    ) VALUES (
        user_uuid, item_uuid, quantity_param, final_price,
        total_cost, COALESCE(item_record.discount_percentage, 0)
    );
    
    -- Deduzir moedas do usuário
    UPDATE users 
    SET coins = coins - total_cost
    WHERE id = user_uuid;
    
    -- Atualizar estoque se aplicável
    IF item_record.stock_quantity IS NOT NULL THEN
        UPDATE store_items 
        SET stock_quantity = stock_quantity - quantity_param
        WHERE id = item_uuid;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'total_cost', total_cost,
        'remaining_coins', user_coins - total_cost
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÕES DE RANKING E ESTATÍSTICAS
-- =====================================================

-- Função para obter ranking semanal
CREATE OR REPLACE FUNCTION get_weekly_ranking(limit_param INTEGER DEFAULT 10)
RETURNS TABLE(
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    total_xp INTEGER,
    user_level INTEGER,
    weekly_xp INTEGER,
    rank_position INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH weekly_stats AS (
        SELECT 
            u.id,
            u.username,
            u.avatar_url,
            u.total_xp,
            u.level,
            COALESCE(SUM(
                CASE 
                    WHEN up.created_at >= date_trunc('week', CURRENT_DATE) 
                    THEN up.xp_earned 
                    ELSE 0 
                END
            ), 0) + COALESCE(SUM(
                CASE 
                    WHEN qa.created_at >= date_trunc('week', CURRENT_DATE) 
                    THEN qa.xp_earned 
                    ELSE 0 
                END
            ), 0) as week_xp
        FROM users u
        LEFT JOIN user_progress up ON u.id = up.user_id
        LEFT JOIN quiz_attempts qa ON u.id = qa.user_id
        WHERE u.is_active = true
        GROUP BY u.id, u.username, u.avatar_url, u.total_xp, u.level
    )
    SELECT 
        ws.id,
        ws.username,
        ws.avatar_url,
        ws.total_xp,
        ws.level,
        ws.week_xp::INTEGER,
        ROW_NUMBER() OVER (ORDER BY ws.week_xp DESC, ws.total_xp DESC)::INTEGER
    FROM weekly_stats ws
    ORDER BY ws.week_xp DESC, ws.total_xp DESC
    LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÕES DE STREAK
-- =====================================================

-- Função para atualizar streak do usuário
CREATE OR REPLACE FUNCTION update_user_streak(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
    current_streak INTEGER := 0;
    has_today_activity BOOLEAN := false;
    has_yesterday_activity BOOLEAN := false;
BEGIN
    -- Verificar atividade de hoje
    SELECT EXISTS (
        SELECT 1 FROM user_streaks 
        WHERE user_id = user_uuid 
          AND streak_date = today_date 
          AND is_streak_day = true
    ) INTO has_today_activity;
    
    -- Verificar atividade de ontem
    SELECT EXISTS (
        SELECT 1 FROM user_streaks 
        WHERE user_id = user_uuid 
          AND streak_date = yesterday_date 
          AND is_streak_day = true
    ) INTO has_yesterday_activity;
    
    -- Calcular novo streak
    IF has_today_activity THEN
        IF has_yesterday_activity THEN
            -- Continuar streak
            SELECT users.current_streak + 1 INTO current_streak
            FROM users 
            WHERE id = user_uuid;
        ELSE
            -- Iniciar novo streak
            current_streak := 1;
        END IF;
    ELSE
        -- Sem atividade hoje, streak quebrado
        current_streak := 0;
    END IF;
    
    -- Atualizar usuário
    UPDATE users 
    SET current_streak = current_streak,
        max_streak = GREATEST(max_streak, current_streak)
    WHERE id = user_uuid;
    
    RETURN current_streak;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS AUTOMÁTICOS
-- =====================================================

-- Trigger para atualizar estatísticas após progresso
CREATE OR REPLACE FUNCTION trigger_update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_user_stats(NEW.user_id);
    PERFORM check_achievements(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em tabelas relevantes
DROP TRIGGER IF EXISTS update_stats_on_progress ON user_progress;
CREATE TRIGGER update_stats_on_progress
    AFTER INSERT OR UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_user_stats();

DROP TRIGGER IF EXISTS update_stats_on_quiz_attempt ON quiz_attempts;
CREATE TRIGGER update_stats_on_quiz_attempt
    AFTER INSERT ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_user_stats();

-- =====================================================
-- FUNÇÕES DE DASHBOARD E DADOS CONSOLIDADOS
-- =====================================================

-- Função para buscar dados completos do dashboard do usuário
CREATE OR REPLACE FUNCTION get_user_dashboard(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    user_data RECORD;
    total_xp INTEGER;
    user_level INTEGER;
    current_streak INTEGER;
    next_lessons JSON;
    recent_achievements JSON;
BEGIN
    -- Buscar dados básicos do usuário
    SELECT * INTO user_data FROM auth.users WHERE id = user_id_param;
    
    IF user_data IS NULL THEN
        RETURN json_build_object('error', 'Usuário não encontrado');
    END IF;
    
    -- Calcular XP total e nível
    total_xp := calculate_user_total_xp(user_id_param);
    user_level := calculate_user_level(total_xp);
    
    -- Buscar streak atual
    SELECT COALESCE(current_streak, 0) INTO current_streak
    FROM user_streaks 
    WHERE user_id = user_id_param;
    
    -- Buscar próximas aulas (últimas 3 em progresso)
    SELECT json_agg(
        json_build_object(
            'id', l.id,
            'title', l.title,
            'trail_title', t.title,
            'progress_percentage', COALESCE(up.progress_percentage, 0)
        )
    ) INTO next_lessons
    FROM lessons l
    JOIN trails t ON l.trail_id = t.id
    LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = user_id_param
    WHERE up.is_completed = false OR up.id IS NULL
    ORDER BY l.order_index
    LIMIT 3;
    
    -- Buscar conquistas recentes (últimas 3)
    SELECT json_agg(
        json_build_object(
            'id', a.id,
            'title', a.title,
            'description', a.description,
            'icon_url', a.icon_url,
            'unlocked_at', ua.unlocked_at
        )
    ) INTO recent_achievements
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = user_id_param
    ORDER BY ua.unlocked_at DESC
    LIMIT 3;
    
    -- Construir resultado final
    result := json_build_object(
        'user_id', user_id_param,
        'name', COALESCE(user_data.raw_user_meta_data->>'name', 'Usuário'),
        'email', user_data.email,
        'xp_total', total_xp,
        'level', user_level,
        'current_streak', current_streak,
        'next_lessons', COALESCE(next_lessons, '[]'::json),
        'recent_achievements', COALESCE(recent_achievements, '[]'::json)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar aula como completa
CREATE OR REPLACE FUNCTION mark_lesson_complete(
    user_id_param UUID,
    lesson_id_param UUID,
    xp_earned_param INTEGER DEFAULT 10
)
RETURNS JSON AS $$
DECLARE
    existing_progress RECORD;
    result JSON;
BEGIN
    -- Verificar se já existe progresso para esta aula
    SELECT * INTO existing_progress 
    FROM user_progress 
    WHERE user_id = user_id_param AND lesson_id = lesson_id_param;
    
    IF existing_progress IS NULL THEN
        -- Criar novo progresso
        INSERT INTO user_progress (
            user_id, 
            lesson_id, 
            progress_percentage, 
            is_completed, 
            xp_earned,
            completed_at
        ) VALUES (
            user_id_param, 
            lesson_id_param, 
            100, 
            true, 
            xp_earned_param,
            NOW()
        );
    ELSE
        -- Atualizar progresso existente
        UPDATE user_progress 
        SET 
            progress_percentage = 100,
            is_completed = true,
            xp_earned = GREATEST(xp_earned, xp_earned_param),
            completed_at = COALESCE(completed_at, NOW()),
            updated_at = NOW()
        WHERE user_id = user_id_param AND lesson_id = lesson_id_param;
    END IF;
    
    -- Atualizar estatísticas do usuário
    PERFORM update_user_stats(user_id_param);
    
    result := json_build_object(
        'success', true,
        'xp_earned', xp_earned_param,
        'message', 'Aula marcada como completa'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar resposta de quiz
CREATE OR REPLACE FUNCTION submit_quiz_answer(
    user_id_param UUID,
    quiz_id_param UUID,
    selected_option_id_param UUID
)
RETURNS JSON AS $$
DECLARE
    quiz_data RECORD;
    option_data RECORD;
    is_correct BOOLEAN;
    xp_earned INTEGER := 0;
    result JSON;
BEGIN
    -- Buscar dados do quiz
    SELECT * INTO quiz_data FROM quizzes WHERE id = quiz_id_param;
    
    IF quiz_data IS NULL THEN
        RETURN json_build_object('error', 'Quiz não encontrado');
    END IF;
    
    -- Buscar dados da opção selecionada
    SELECT * INTO option_data FROM quiz_options WHERE id = selected_option_id_param;
    
    IF option_data IS NULL THEN
        RETURN json_build_object('error', 'Opção não encontrada');
    END IF;
    
    -- Verificar se a resposta está correta
    is_correct := option_data.is_correct;
    
    -- Calcular XP baseado na correção
    IF is_correct THEN
        xp_earned := COALESCE(quiz_data.xp_reward, 5);
    END IF;
    
    -- Registrar tentativa
    INSERT INTO quiz_attempts (
        user_id,
        quiz_id,
        selected_option_id,
        is_correct,
        xp_earned
    ) VALUES (
        user_id_param,
        quiz_id_param,
        selected_option_id_param,
        is_correct,
        xp_earned
    );
    
    -- Atualizar estatísticas do usuário
    PERFORM update_user_stats(user_id_param);
    
    result := json_build_object(
        'success', true,
        'is_correct', is_correct,
        'xp_earned', xp_earned,
        'correct_option_id', (
            SELECT id FROM quiz_options 
            WHERE quiz_id = quiz_id_param AND is_correct = true 
            LIMIT 1
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter progresso da trilha
CREATE OR REPLACE FUNCTION get_trail_progress(
    user_id_param UUID,
    trail_id_param UUID
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    total_lessons INTEGER;
    completed_lessons INTEGER;
    total_xp INTEGER;
    progress_percentage NUMERIC;
BEGIN
    -- Contar total de aulas na trilha
    SELECT COUNT(*) INTO total_lessons
    FROM lessons
    WHERE trail_id = trail_id_param;
    
    -- Contar aulas completadas pelo usuário
    SELECT COUNT(*) INTO completed_lessons
    FROM user_progress up
    JOIN lessons l ON up.lesson_id = l.id
    WHERE up.user_id = user_id_param 
    AND l.trail_id = trail_id_param 
    AND up.is_completed = true;
    
    -- Calcular XP total ganho na trilha
    SELECT COALESCE(SUM(up.xp_earned), 0) INTO total_xp
    FROM user_progress up
    JOIN lessons l ON up.lesson_id = l.id
    WHERE up.user_id = user_id_param 
    AND l.trail_id = trail_id_param;
    
    -- Calcular porcentagem de progresso
    IF total_lessons > 0 THEN
        progress_percentage := (completed_lessons::NUMERIC / total_lessons::NUMERIC) * 100;
    ELSE
        progress_percentage := 0;
    END IF;
    
    result := json_build_object(
        'trail_id', trail_id_param,
        'total_lessons', total_lessons,
        'completed_lessons', completed_lessons,
        'progress_percentage', progress_percentage,
        'total_xp', total_xp
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para completar aula (alias para mark_lesson_complete)
CREATE OR REPLACE FUNCTION complete_lesson(
    user_id_param UUID,
    lesson_id_param UUID,
    xp_earned_param INTEGER DEFAULT 10
)
RETURNS JSON AS $$
BEGIN
    RETURN mark_lesson_complete(user_id_param, lesson_id_param, xp_earned_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para comprar item da loja (alias para process_store_purchase)
CREATE OR REPLACE FUNCTION purchase_store_item(
    user_id_param UUID,
    item_id_param UUID,
    quantity_param INTEGER DEFAULT 1
)
RETURNS JSON AS $$
BEGIN
    RETURN process_store_purchase(user_id_param, item_id_param, quantity_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para usar item da loja
CREATE OR REPLACE FUNCTION use_store_item(
    user_id_param UUID,
    item_id_param UUID,
    quantity_param INTEGER DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
    user_item RECORD;
    item_data RECORD;
    result JSON;
BEGIN
    -- Verificar se o usuário possui o item
    SELECT * INTO user_item
    FROM user_purchases
    WHERE user_id = user_id_param AND item_id = item_id_param;
    
    IF user_item IS NULL THEN
        RETURN json_build_object('error', 'Item não encontrado no inventário');
    END IF;
    
    IF user_item.quantity < quantity_param THEN
        RETURN json_build_object('error', 'Quantidade insuficiente');
    END IF;
    
    -- Buscar dados do item
    SELECT * INTO item_data FROM store_items WHERE id = item_id_param;
    
    -- Atualizar quantidade do item
    UPDATE user_purchases
    SET 
        quantity = quantity - quantity_param,
        updated_at = NOW()
    WHERE user_id = user_id_param AND item_id = item_id_param;
    
    -- Se quantidade chegou a zero, remover o registro
    DELETE FROM user_purchases
    WHERE user_id = user_id_param AND item_id = item_id_param AND quantity <= 0;
    
    result := json_build_object(
        'success', true,
        'item_used', item_data.name,
        'quantity_used', quantity_param,
        'remaining_quantity', GREATEST(0, user_item.quantity - quantity_param)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para responder quiz (alias para submit_quiz_answer)
CREATE OR REPLACE FUNCTION answer_quiz(
    user_id_param UUID,
    quiz_id_param UUID,
    selected_option_id_param UUID
)
RETURNS JSON AS $$
BEGIN
    RETURN submit_quiz_answer(user_id_param, quiz_id_param, selected_option_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar conquista específica
CREATE OR REPLACE FUNCTION check_achievement(
    user_id_param UUID,
    achievement_id_param UUID
)
RETURNS JSON AS $$
DECLARE
    achievement_data RECORD;
    user_achievement RECORD;
    progress_value INTEGER := 0;
    is_unlocked BOOLEAN := false;
    result JSON;
BEGIN
    -- Buscar dados da conquista
    SELECT * INTO achievement_data FROM achievements WHERE id = achievement_id_param;
    
    IF achievement_data IS NULL THEN
        RETURN json_build_object('error', 'Conquista não encontrada');
    END IF;
    
    -- Verificar se o usuário já possui a conquista
    SELECT * INTO user_achievement
    FROM user_achievements
    WHERE user_id = user_id_param AND achievement_id = achievement_id_param;
    
    is_unlocked := user_achievement IS NOT NULL;
    
    -- Calcular progresso baseado no tipo de conquista
    CASE achievement_data.achievement_type
        WHEN 'xp_total' THEN
            progress_value := calculate_user_total_xp(user_id_param);
        WHEN 'lessons_completed' THEN
            SELECT COUNT(*) INTO progress_value
            FROM user_progress
            WHERE user_id = user_id_param AND is_completed = true;
        WHEN 'streak_days' THEN
            SELECT COALESCE(users.current_streak, 0) INTO progress_value
            FROM users
            WHERE id = user_id_param;
        WHEN 'quizzes_correct' THEN
            SELECT COUNT(*) INTO progress_value
            FROM quiz_attempts
            WHERE user_id = user_id_param AND is_correct = true;
        ELSE
            progress_value := 0;
    END CASE;
    
    -- Verificar se deve desbloquear a conquista
    IF NOT is_unlocked AND progress_value >= achievement_data.target_value THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        VALUES (user_id_param, achievement_id_param);
        is_unlocked := true;
    END IF;
    
    result := json_build_object(
        'achievement_id', achievement_id_param,
        'is_unlocked', is_unlocked,
        'progress_value', progress_value,
        'target_value', achievement_data.target_value,
        'progress_percentage', LEAST(100, (progress_value::NUMERIC / achievement_data.target_value::NUMERIC) * 100)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION calculate_user_total_xp(UUID) IS 'Calcula o XP total do usuário somando todas as fontes';
COMMENT ON FUNCTION calculate_user_level(INTEGER) IS 'Calcula o nível do usuário baseado no XP total';
COMMENT ON FUNCTION update_user_stats(UUID) IS 'Atualiza todas as estatísticas do usuário';
COMMENT ON FUNCTION get_quiz_with_options(UUID) IS 'Retorna quiz com suas opções em formato JSON';
COMMENT ON FUNCTION check_quiz_answer(UUID, UUID, UUID) IS 'Verifica resposta do quiz e calcula XP';
COMMENT ON FUNCTION check_achievements(UUID) IS 'Verifica e desbloqueia conquistas do usuário';
COMMENT ON FUNCTION generate_daily_missions(UUID, DATE) IS 'Gera missões diárias para o usuário';
COMMENT ON FUNCTION process_store_purchase(UUID, UUID, INTEGER) IS 'Processa compra na loja virtual';
COMMENT ON FUNCTION get_weekly_ranking(INTEGER) IS 'Retorna ranking semanal dos usuários';
COMMENT ON FUNCTION update_user_streak(UUID) IS 'Atualiza streak diário do usuário';
COMMENT ON FUNCTION get_user_dashboard(UUID) IS 'Retorna dados completos do dashboard do usuário';
COMMENT ON FUNCTION mark_lesson_complete(UUID, UUID, INTEGER) IS 'Marca aula como completa e atualiza progresso';
COMMENT ON FUNCTION submit_quiz_answer(UUID, UUID, UUID) IS 'Registra resposta de quiz e calcula XP';