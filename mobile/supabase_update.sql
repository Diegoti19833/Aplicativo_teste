-- Script de Atualização do Supabase - GamePop
-- Este script corrige todos os erros identificados na aplicação

-- 1. Adicionar coluna last_activity_date na tabela users (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_activity_date'
    ) THEN
        ALTER TABLE users ADD COLUMN last_activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 2. Adicionar coluna total_xp na tabela users (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'total_xp'
    ) THEN
        ALTER TABLE users ADD COLUMN total_xp INTEGER DEFAULT 0;
    END IF;
END $$;

-- 3. Criar tabela user_lesson_progress (se não existir)
CREATE TABLE IF NOT EXISTS user_lesson_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    score INTEGER,
    time_spent INTEGER, -- em segundos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance da tabela user_lesson_progress
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id ON user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson_id ON user_lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_completed ON user_lesson_progress(is_completed);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_lesson_progress_unique ON user_lesson_progress(user_id, lesson_id);

-- 4. Criar tabela user_purchases (se não existir)
CREATE TABLE IF NOT EXISTS user_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL,
    item_type VARCHAR(50) NOT NULL, -- 'skin', 'power_up', etc.
    purchase_price INTEGER NOT NULL,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Índices para performance da tabela user_purchases
CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id ON user_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_item_id ON user_purchases(item_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_type ON user_purchases(item_type);

-- 5. Função para calcular XP total do usuário
CREATE OR REPLACE FUNCTION calculate_user_total_xp(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    total_xp INTEGER := 0;
BEGIN
    -- XP de quizzes completados
    SELECT COALESCE(SUM(xp_earned), 0) INTO total_xp
    FROM user_progress 
    WHERE user_id = user_id_param;
    
    -- XP de lições completadas (se aplicável)
    SELECT total_xp + COALESCE(COUNT(*) * 10, 0) INTO total_xp
    FROM user_lesson_progress 
    WHERE user_id = user_id_param AND is_completed = true;
    
    RETURN total_xp;
END;
$$ LANGUAGE plpgsql;

-- 6. Função para calcular nível do usuário
CREATE OR REPLACE FUNCTION calculate_user_level(total_xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Fórmula simples: nível = sqrt(total_xp / 100) + 1
    RETURN FLOOR(SQRT(total_xp::FLOAT / 100.0)) + 1;
END;
$$ LANGUAGE plpgsql;

-- 7. Função principal do dashboard
CREATE OR REPLACE FUNCTION get_user_dashboard(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
    user_data JSON;
    total_xp INTEGER;
    user_level INTEGER;
    completed_quizzes INTEGER;
    completed_lessons INTEGER;
    total_coins INTEGER;
    streak_days INTEGER;
    last_activity DATE;
BEGIN
    -- Buscar dados básicos do usuário
    SELECT row_to_json(u) INTO user_data
    FROM (
        SELECT 
            users.id,
            users.name,
            users.email,
            users.coins,
            users.created_at,
            users.last_activity_at,
            users.total_xp as stored_xp
        FROM users 
        WHERE users.id = user_id_param
    ) u;
    
    IF user_data IS NULL THEN
        RETURN json_build_object('error', 'Usuário não encontrado');
    END IF;
    
    -- Calcular XP total atual
    total_xp := calculate_user_total_xp(user_id_param);
    
    -- Calcular nível
    user_level := calculate_user_level(total_xp);
    
    -- Contar quizzes completados
    SELECT COUNT(*) INTO completed_quizzes
    FROM user_progress 
    WHERE user_id = user_id_param AND progress_type = 'quiz_completed';
    
    -- Contar lições completadas
    SELECT COUNT(*) INTO completed_lessons
    FROM user_lesson_progress 
    WHERE user_id = user_id_param AND is_completed = true;
    
    -- Buscar moedas atuais
    SELECT COALESCE(coins, 0) INTO total_coins
    FROM users 
    WHERE id = user_id_param;
    
    -- Calcular streak (simplificado)
    SELECT COALESCE(EXTRACT(DAY FROM NOW() - last_activity_date), 0) INTO streak_days
    FROM users 
    WHERE id = user_id_param;
    
    -- Retornar dados consolidados
    RETURN json_build_object(
        'user', user_data,
        'stats', json_build_object(
            'total_xp', total_xp,
            'level', user_level,
            'completed_quizzes', completed_quizzes,
            'completed_lessons', completed_lessons,
            'total_coins', total_coins,
            'streak_days', GREATEST(0, 7 - streak_days)
        )
    );
END;
$$ LANGUAGE plpgsql;

-- 8. Outras funções necessárias
CREATE OR REPLACE FUNCTION get_user_store_items(user_id_param UUID)
RETURNS TABLE(
    item_id UUID,
    item_name VARCHAR,
    item_type VARCHAR,
    price INTEGER,
    is_purchased BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        si.id as item_id,
        si.name as item_name,
        si.type as item_type,
        si.price,
        CASE 
            WHEN up.id IS NOT NULL THEN true 
            ELSE false 
        END as is_purchased
    FROM store_items si
    LEFT JOIN user_purchases up ON si.id = up.item_id AND up.user_id = user_id_param
    ORDER BY si.type, si.price;
END;
$$ LANGUAGE plpgsql;

-- 9. Função para submeter resposta de quiz
CREATE OR REPLACE FUNCTION submit_quiz_answer(
    user_id_param UUID,
    quiz_id_param UUID,
    answer_param TEXT,
    is_correct_param BOOLEAN,
    xp_earned_param INTEGER DEFAULT 10
)
RETURNS JSON AS $$
DECLARE
    progress_id UUID;
    user_coins INTEGER;
    new_total_xp INTEGER;
BEGIN
    -- Inserir progresso do quiz
    INSERT INTO user_progress (user_id, quiz_id, answer, is_correct, xp_earned)
    VALUES (user_id_param, quiz_id_param, answer_param, is_correct_param, xp_earned_param)
    RETURNING id INTO progress_id;
    
    -- Se resposta correta, atualizar moedas e XP
    IF is_correct_param THEN
        UPDATE users 
        SET 
            coins = COALESCE(coins, 0) + (xp_earned_param / 2),
            total_xp = calculate_user_total_xp(user_id_param),
            last_activity_date = NOW()
        WHERE id = user_id_param
        RETURNING coins INTO user_coins;
        
        RETURN json_build_object(
            'success', true,
            'progress_id', progress_id,
            'xp_earned', xp_earned_param,
            'coins_earned', xp_earned_param / 2,
            'total_coins', user_coins
        );
    ELSE
        -- Atualizar apenas última atividade
        UPDATE users 
        SET last_activity_date = NOW()
        WHERE id = user_id_param;
        
        RETURN json_build_object(
            'success', true,
            'progress_id', progress_id,
            'xp_earned', 0,
            'coins_earned', 0
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 10. Atualizar XP total para usuários existentes
UPDATE users 
SET total_xp = calculate_user_total_xp(id)
WHERE total_xp IS NULL OR total_xp = 0;

-- Mensagem de conclusão
SELECT 'Atualização do Supabase concluída com sucesso!' as status;