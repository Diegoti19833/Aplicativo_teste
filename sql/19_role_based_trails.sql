-- =====================================================
-- SISTEMA DE TRILHAS POR GRUPO DE FUNCIONÁRIOS
-- Descrição: Trilhas específicas para funcionário, gerente e caixa
-- =====================================================

-- Primeiro, vamos atualizar os roles para incluir 'caixa'
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('funcionario', 'gerente', 'admin', 'caixa'));

-- Adicionar campo para especificar quais grupos podem acessar cada trilha
ALTER TABLE trails 
ADD COLUMN IF NOT EXISTS target_roles TEXT[] DEFAULT ARRAY['funcionario', 'gerente', 'admin', 'caixa'];

-- Adicionar campo para categoria da trilha
ALTER TABLE trails 
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'geral';

-- Índice para performance nas consultas por role
CREATE INDEX IF NOT EXISTS idx_trails_target_roles ON trails USING GIN(target_roles);
CREATE INDEX IF NOT EXISTS idx_trails_category ON trails(category);

-- Função para verificar se usuário pode acessar trilha
CREATE OR REPLACE FUNCTION user_can_access_trail(p_user_id UUID, p_trail_id UUID)
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
    
    -- Verificar se o role do usuário está na lista de roles permitidos
    RETURN user_role = ANY(trail_roles);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRILHAS ESPECÍFICAS PARA FUNCIONÁRIOS
-- =====================================================

-- Trilha 1: Atendimento ao Cliente para Funcionários
INSERT INTO trails (
    id,
    title,
    description,
    icon_url,
    color,
    difficulty_level,
    estimated_duration,
    category,
    target_roles,
    order_index
) VALUES (
    gen_random_uuid(),
    'Atendimento ao Cliente - Funcionário',
    'Aprenda as melhores práticas de atendimento ao cliente, comunicação efetiva e resolução de problemas básicos.',
    'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    '#10B981',
    1,
    120,
    'atendimento',
    ARRAY['funcionario'],
    100
);

-- Trilha 2: Procedimentos Operacionais para Funcionários
INSERT INTO trails (
    id,
    title,
    description,
    icon_url,
    color,
    difficulty_level,
    estimated_duration,
    category,
    target_roles,
    order_index
) VALUES (
    gen_random_uuid(),
    'Procedimentos Operacionais Básicos',
    'Conheça os procedimentos essenciais do dia a dia, normas de segurança e protocolos básicos da empresa.',
    'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    '#3B82F6',
    1,
    90,
    'operacional',
    ARRAY['funcionario'],
    101
);

-- =====================================================
-- TRILHAS ESPECÍFICAS PARA GERENTES
-- =====================================================

-- Trilha 3: Liderança e Gestão de Equipes
INSERT INTO trails (
    id,
    title,
    description,
    icon_url,
    color,
    difficulty_level,
    estimated_duration,
    category,
    target_roles,
    order_index
) VALUES (
    gen_random_uuid(),
    'Liderança e Gestão de Equipes',
    'Desenvolva habilidades de liderança, gestão de pessoas, motivação de equipes e tomada de decisões estratégicas.',
    'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    '#8B5CF6',
    3,
    180,
    'lideranca',
    ARRAY['gerente'],
    200
);

-- Trilha 4: Gestão Financeira e Indicadores
INSERT INTO trails (
    id,
    title,
    description,
    icon_url,
    color,
    difficulty_level,
    estimated_duration,
    category,
    target_roles,
    order_index
) VALUES (
    gen_random_uuid(),
    'Gestão Financeira e KPIs',
    'Aprenda a interpretar relatórios financeiros, analisar indicadores de performance e tomar decisões baseadas em dados.',
    'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    '#F59E0B',
    3,
    150,
    'financeiro',
    ARRAY['gerente'],
    201
);

-- =====================================================
-- TRILHAS ESPECÍFICAS PARA CAIXAS
-- =====================================================

-- Trilha 5: Operações de Caixa e Pagamentos
INSERT INTO trails (
    id,
    title,
    description,
    icon_url,
    color,
    difficulty_level,
    estimated_duration,
    category,
    target_roles,
    order_index
) VALUES (
    gen_random_uuid(),
    'Operações de Caixa e Pagamentos',
    'Domine as operações de caixa, diferentes formas de pagamento, troco, fechamento de caixa e procedimentos de segurança.',
    'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    '#EF4444',
    2,
    100,
    'caixa',
    ARRAY['caixa'],
    300
);

-- Trilha 6: Atendimento Rápido e Eficiente
INSERT INTO trails (
    id,
    title,
    description,
    icon_url,
    color,
    difficulty_level,
    estimated_duration,
    category,
    target_roles,
    order_index
) VALUES (
    gen_random_uuid(),
    'Atendimento Rápido e Eficiente no Caixa',
    'Técnicas para agilizar o atendimento, reduzir filas, lidar com situações de estresse e manter a qualidade do serviço.',
    'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    '#06B6D4',
    2,
    80,
    'atendimento',
    ARRAY['caixa'],
    301
);

-- =====================================================
-- TRILHAS COMPARTILHADAS (TODOS OS GRUPOS)
-- =====================================================

-- Trilha 7: Segurança e Compliance
INSERT INTO trails (
    id,
    title,
    description,
    icon_url,
    color,
    difficulty_level,
    estimated_duration,
    category,
    target_roles,
    order_index
) VALUES (
    gen_random_uuid(),
    'Segurança e Compliance Empresarial',
    'Normas de segurança, LGPD, prevenção de acidentes e compliance regulatório aplicável a todos os funcionários.',
    'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    '#DC2626',
    2,
    120,
    'seguranca',
    ARRAY['funcionario', 'gerente', 'caixa'],
    400
);

-- Trilha 8: Cultura e Valores da Empresa
INSERT INTO trails (
    id,
    title,
    description,
    icon_url,
    color,
    difficulty_level,
    estimated_duration,
    category,
    target_roles,
    order_index
) VALUES (
    gen_random_uuid(),
    'Cultura e Valores Organizacionais',
    'Conheça a missão, visão, valores da empresa e como aplicá-los no dia a dia de trabalho.',
    'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    '#7C3AED',
    1,
    60,
    'cultura',
    ARRAY['funcionario', 'gerente', 'caixa'],
    401
);

\echo '✅ Trilhas específicas por grupo criadas com sucesso!'