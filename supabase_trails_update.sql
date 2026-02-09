-- =====================================================
-- SCRIPT DE ATUALIZAÇÃO PARA TRILHAS POR GRUPO
-- =====================================================
-- Este script adiciona as funcionalidades de trilhas específicas por grupo

-- 1. Atualizar role na tabela users para incluir 'caixa'
DO $$
BEGIN
    -- Verificar se a constraint existe e removê-la
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'users' AND constraint_name = 'users_role_check'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
    END IF;
    
    -- Adicionar nova constraint com 'caixa'
    ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('funcionario', 'gerente', 'admin', 'caixa'));
END $$;

-- 2. Adicionar colunas target_roles e category à tabela trails
DO $$
BEGIN
    -- Adicionar coluna target_roles se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trails' AND column_name = 'target_roles'
    ) THEN
        ALTER TABLE trails ADD COLUMN target_roles TEXT[];
    END IF;
    
    -- Adicionar coluna category se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trails' AND column_name = 'category'
    ) THEN
        ALTER TABLE trails ADD COLUMN category VARCHAR(100);
    END IF;
END $$;

-- 3. Criar índices para as novas colunas
CREATE INDEX IF NOT EXISTS idx_trails_target_roles ON trails USING GIN(target_roles);
CREATE INDEX IF NOT EXISTS idx_trails_category ON trails(category);

-- 4. Função para verificar se usuário pode acessar trilha
CREATE OR REPLACE FUNCTION user_can_access_trail(
    p_user_id UUID,
    p_trail_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR(50);
    trail_roles TEXT[];
BEGIN
    -- Buscar role do usuário
    SELECT role INTO user_role
    FROM users
    WHERE id = p_user_id;
    
    -- Buscar roles permitidos na trilha
    SELECT target_roles INTO trail_roles
    FROM trails
    WHERE id = p_trail_id;
    
    -- Se target_roles for NULL ou vazio, permitir acesso a todos
    IF trail_roles IS NULL OR array_length(trail_roles, 1) IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar se o role do usuário está na lista de roles permitidos
    RETURN user_role = ANY(trail_roles);
END;
$$ LANGUAGE plpgsql;

-- 5. Função para obter progresso da trilha
CREATE OR REPLACE FUNCTION get_trail_progress(
    user_id_param UUID,
    trail_id_param UUID
)
RETURNS TABLE(
    progress_percentage DECIMAL,
    completed_lessons INTEGER,
    total_lessons INTEGER,
    is_completed BOOLEAN
) AS $$
DECLARE
    total_lessons_count INTEGER;
    completed_lessons_count INTEGER;
    progress_percent DECIMAL;
    trail_completed BOOLEAN;
BEGIN
    -- Contar total de lições na trilha
    SELECT COUNT(*) INTO total_lessons_count
    FROM lessons
    WHERE trail_id = trail_id_param AND is_active = true;
    
    -- Contar lições completadas pelo usuário
    SELECT COUNT(*) INTO completed_lessons_count
    FROM user_progress up
    JOIN lessons l ON up.lesson_id = l.id
    WHERE up.user_id = user_id_param 
      AND l.trail_id = trail_id_param 
      AND up.progress_type = 'lesson_completed'
      AND up.is_completed = true;
    
    -- Calcular porcentagem de progresso
    IF total_lessons_count > 0 THEN
        progress_percent := (completed_lessons_count::DECIMAL / total_lessons_count::DECIMAL) * 100;
    ELSE
        progress_percent := 0;
    END IF;
    
    -- Verificar se a trilha está completada
    trail_completed := (completed_lessons_count = total_lessons_count AND total_lessons_count > 0);
    
    -- Retornar resultado
    RETURN QUERY SELECT 
        progress_percent,
        completed_lessons_count,
        total_lessons_count,
        trail_completed;
END;
$$ LANGUAGE plpgsql;

-- 6. Atualizar trilhas existentes para ter target_roles = ['all']
UPDATE trails 
SET target_roles = ARRAY['funcionario', 'gerente', 'caixa', 'admin']
WHERE target_roles IS NULL;

-- 7. Inserir trilhas específicas por grupo
DO $$
DECLARE
    trail_funcionario_atendimento UUID;
    trail_funcionario_procedimentos UUID;
    trail_gerente_lideranca UUID;
    trail_gerente_financeiro UUID;
    trail_caixa_operacoes UUID;
    trail_caixa_atendimento UUID;
    trail_seguranca UUID;
    trail_cultura UUID;
BEGIN
    -- Trilhas para Funcionários
    INSERT INTO trails (
        id, title, description, icon_url, color, difficulty_level, 
        estimated_duration, category, target_roles, order_index, is_active
    ) VALUES (
        gen_random_uuid(), 'Atendimento ao Cliente - Funcionário',
        'Aprenda as melhores práticas de atendimento ao cliente, comunicação efetiva e resolução de problemas básicos.',
        'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', '#10B981', 1, 120,
        'atendimento', ARRAY['funcionario'], 100, true
    ) RETURNING id INTO trail_funcionario_atendimento;

    INSERT INTO trails (
        id, title, description, icon_url, color, difficulty_level, 
        estimated_duration, category, target_roles, order_index, is_active
    ) VALUES (
        gen_random_uuid(), 'Procedimentos Operacionais Básicos',
        'Domine os procedimentos operacionais essenciais para o dia a dia de trabalho.',
        'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', '#3B82F6', 1, 90,
        'operacional', ARRAY['funcionario'], 101, true
    ) RETURNING id INTO trail_funcionario_procedimentos;

    -- Trilhas para Gerentes
    INSERT INTO trails (
        id, title, description, icon_url, color, difficulty_level, 
        estimated_duration, category, target_roles, order_index, is_active
    ) VALUES (
        gen_random_uuid(), 'Liderança e Gestão de Equipes',
        'Desenvolva habilidades de liderança, gestão de pessoas e tomada de decisões estratégicas.',
        'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', '#8B5CF6', 2, 150,
        'lideranca', ARRAY['gerente'], 200, true
    ) RETURNING id INTO trail_gerente_lideranca;

    INSERT INTO trails (
        id, title, description, icon_url, color, difficulty_level, 
        estimated_duration, category, target_roles, order_index, is_active
    ) VALUES (
        gen_random_uuid(), 'Gestão Financeira e KPIs',
        'Aprenda a analisar indicadores financeiros, controlar custos e otimizar resultados.',
        'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', '#F59E0B', 2, 120,
        'financeiro', ARRAY['gerente'], 201, true
    ) RETURNING id INTO trail_gerente_financeiro;

    -- Trilhas para Caixas
    INSERT INTO trails (
        id, title, description, icon_url, color, difficulty_level, 
        estimated_duration, category, target_roles, order_index, is_active
    ) VALUES (
        gen_random_uuid(), 'Operações de Caixa e Pagamentos',
        'Domine todas as operações de caixa, formas de pagamento e procedimentos de segurança.',
        'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', '#EF4444', 1, 100,
        'caixa', ARRAY['caixa'], 300, true
    ) RETURNING id INTO trail_caixa_operacoes;

    INSERT INTO trails (
        id, title, description, icon_url, color, difficulty_level, 
        estimated_duration, category, target_roles, order_index, is_active
    ) VALUES (
        gen_random_uuid(), 'Atendimento Rápido e Eficiente no Caixa',
        'Aprenda técnicas para agilizar o atendimento mantendo a qualidade e cortesia.',
        'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', '#06B6D4', 1, 80,
        'atendimento', ARRAY['caixa'], 301, true
    ) RETURNING id INTO trail_caixa_atendimento;

    -- Trilhas Compartilhadas
    INSERT INTO trails (
        id, title, description, icon_url, color, difficulty_level, 
        estimated_duration, category, target_roles, order_index, is_active
    ) VALUES (
        gen_random_uuid(), 'Segurança e Compliance Empresarial',
        'Conheça as normas de segurança, compliance e boas práticas corporativas.',
        'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', '#DC2626', 1, 60,
        'seguranca', ARRAY['funcionario', 'gerente', 'caixa'], 400, true
    ) RETURNING id INTO trail_seguranca;

    INSERT INTO trails (
        id, title, description, icon_url, color, difficulty_level, 
        estimated_duration, category, target_roles, order_index, is_active
    ) VALUES (
        gen_random_uuid(), 'Cultura e Valores Organizacionais',
        'Entenda a missão, visão, valores e cultura da empresa.',
        'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', '#7C3AED', 1, 45,
        'cultura', ARRAY['funcionario', 'gerente', 'caixa'], 401, true
    ) RETURNING id INTO trail_cultura;

END $$;

-- Mensagem de sucesso
SELECT 'Atualização de trilhas por grupo concluída com sucesso!' as status;