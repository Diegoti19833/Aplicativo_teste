-- =====================================================
-- LIÇÕES ESPECÍFICAS PARA TRILHAS POR GRUPO
-- Descrição: Lições detalhadas para cada trilha por grupo de funcionários
-- =====================================================

-- =====================================================
-- LIÇÕES PARA FUNCIONÁRIOS
-- =====================================================

-- Lições para "Atendimento ao Cliente - Funcionário"
DO $$ 
DECLARE 
    trail_funcionario_atendimento UUID;
BEGIN
    SELECT id INTO trail_funcionario_atendimento 
    FROM trails 
    WHERE title = 'Atendimento ao Cliente - Funcionário';
    
    -- Lição 1
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_funcionario_atendimento, 'Fundamentos do Atendimento', 
     'Aprenda os princípios básicos de um atendimento de qualidade',
     'Nesta lição você aprenderá sobre a importância do primeiro contato, linguagem corporal e verbal adequada.',
     'https://www.youtube.com/watch?v=example1', 15, 50, 1, 'video');
    
    -- Lição 2
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_funcionario_atendimento, 'Comunicação Efetiva', 
     'Técnicas de comunicação clara e empática com clientes',
     'Desenvolva habilidades de escuta ativa, empatia e comunicação assertiva.',
     'https://www.youtube.com/watch?v=example2', 20, 60, 2, 'video');
    
    -- Lição 3
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_funcionario_atendimento, 'Resolução de Problemas Básicos', 
     'Como identificar e resolver problemas comuns no atendimento',
     'Aprenda a identificar necessidades do cliente e oferecer soluções adequadas.',
     'https://www.youtube.com/watch?v=example3', 25, 70, 3, 'video');
    
    -- Lição 4
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_funcionario_atendimento, 'Lidando com Reclamações', 
     'Estratégias para transformar reclamações em oportunidades',
     'Técnicas para manter a calma, ouvir ativamente e encontrar soluções satisfatórias.',
     'https://www.youtube.com/watch?v=example4', 30, 80, 4, 'video');
END $$;

-- Lições para "Procedimentos Operacionais Básicos"
DO $$ 
DECLARE 
    trail_funcionario_operacional UUID;
BEGIN
    SELECT id INTO trail_funcionario_operacional 
    FROM trails 
    WHERE title = 'Procedimentos Operacionais Básicos';
    
    -- Lição 1
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_funcionario_operacional, 'Normas de Segurança no Trabalho', 
     'Procedimentos essenciais de segurança no ambiente de trabalho',
     'Conheça as normas de segurança, uso de EPIs e prevenção de acidentes.',
     'https://www.youtube.com/watch?v=safety1', 20, 60, 1, 'video');
    
    -- Lição 2
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_funcionario_operacional, 'Organização do Ambiente de Trabalho', 
     'Como manter o local de trabalho organizado e produtivo',
     'Técnicas de organização, limpeza e otimização do espaço de trabalho.',
     'https://www.youtube.com/watch?v=organization1', 15, 50, 2, 'video');
    
    -- Lição 3
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_funcionario_operacional, 'Protocolos de Emergência', 
     'Procedimentos em situações de emergência',
     'Aprenda como agir em situações de emergência, evacuação e primeiros socorros básicos.',
     'https://www.youtube.com/watch?v=emergency1', 25, 70, 3, 'video');
END $$;

-- =====================================================
-- LIÇÕES PARA GERENTES
-- =====================================================

-- Lições para "Liderança e Gestão de Equipes"
DO $$ 
DECLARE 
    trail_gerente_lideranca UUID;
BEGIN
    SELECT id INTO trail_gerente_lideranca 
    FROM trails 
    WHERE title = 'Liderança e Gestão de Equipes';
    
    -- Lição 1
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_gerente_lideranca, 'Estilos de Liderança', 
     'Conheça diferentes estilos de liderança e quando aplicá-los',
     'Explore liderança situacional, democrática, autocrática e transformacional.',
     'https://www.youtube.com/watch?v=leadership1', 30, 100, 1, 'video');
    
    -- Lição 2
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_gerente_lideranca, 'Motivação e Engajamento', 
     'Técnicas para motivar e engajar sua equipe',
     'Aprenda sobre teorias motivacionais e como aplicá-las na prática.',
     'https://www.youtube.com/watch?v=motivation1', 35, 110, 2, 'video');
    
    -- Lição 3
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_gerente_lideranca, 'Feedback e Desenvolvimento', 
     'Como dar feedback construtivo e desenvolver talentos',
     'Técnicas de feedback efetivo, coaching e desenvolvimento de pessoas.',
     'https://www.youtube.com/watch?v=feedback1', 40, 120, 3, 'video');
    
    -- Lição 4
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_gerente_lideranca, 'Gestão de Conflitos', 
     'Estratégias para resolver conflitos na equipe',
     'Aprenda a mediar conflitos, negociar soluções e manter a harmonia.',
     'https://www.youtube.com/watch?v=conflict1', 35, 110, 4, 'video');
    
    -- Lição 5
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_gerente_lideranca, 'Tomada de Decisões Estratégicas', 
     'Processo estruturado para tomada de decisões importantes',
     'Ferramentas e metodologias para decisões estratégicas eficazes.',
     'https://www.youtube.com/watch?v=decisions1', 40, 120, 5, 'video');
END $$;

-- Lições para "Gestão Financeira e KPIs"
DO $$ 
DECLARE 
    trail_gerente_financeiro UUID;
BEGIN
    SELECT id INTO trail_gerente_financeiro 
    FROM trails 
    WHERE title = 'Gestão Financeira e KPIs';
    
    -- Lição 1
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_gerente_financeiro, 'Fundamentos Financeiros', 
     'Conceitos básicos de gestão financeira empresarial',
     'Aprenda sobre fluxo de caixa, DRE, balanço patrimonial e análise financeira.',
     'https://www.youtube.com/watch?v=finance1', 45, 130, 1, 'video');
    
    -- Lição 2
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_gerente_financeiro, 'Indicadores de Performance (KPIs)', 
     'Como definir, medir e interpretar KPIs essenciais',
     'Conheça os principais KPIs empresariais e como utilizá-los na gestão.',
     'https://www.youtube.com/watch?v=kpis1', 40, 120, 2, 'video');
    
    -- Lição 3
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_gerente_financeiro, 'Orçamento e Planejamento', 
     'Elaboração e controle de orçamentos departamentais',
     'Técnicas de planejamento orçamentário e controle de custos.',
     'https://www.youtube.com/watch?v=budget1', 35, 110, 3, 'video');
    
    -- Lição 4
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_gerente_financeiro, 'Análise de Resultados', 
     'Como interpretar relatórios e tomar decisões baseadas em dados',
     'Aprenda a analisar variações, tendências e tomar ações corretivas.',
     'https://www.youtube.com/watch?v=analysis1', 30, 100, 4, 'video');
END $$;

-- =====================================================
-- LIÇÕES PARA CAIXAS
-- =====================================================

-- Lições para "Operações de Caixa e Pagamentos"
DO $$ 
DECLARE 
    trail_caixa_operacoes UUID;
BEGIN
    SELECT id INTO trail_caixa_operacoes 
    FROM trails 
    WHERE title = 'Operações de Caixa e Pagamentos';
    
    -- Lição 1
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_caixa_operacoes, 'Abertura e Fechamento de Caixa', 
     'Procedimentos corretos para iniciar e finalizar o turno',
     'Aprenda a conferir valores, registrar movimentações e fechar o caixa.',
     'https://www.youtube.com/watch?v=cashier1', 20, 70, 1, 'video');
    
    -- Lição 2
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_caixa_operacoes, 'Formas de Pagamento', 
     'Processamento de diferentes tipos de pagamento',
     'Dinheiro, cartões, PIX, vouchers e outras formas de pagamento.',
     'https://www.youtube.com/watch?v=payments1', 25, 80, 2, 'video');
    
    -- Lição 3
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_caixa_operacoes, 'Cálculo de Troco e Conferência', 
     'Técnicas para calcular troco rapidamente e evitar erros',
     'Métodos práticos de cálculo mental e conferência de valores.',
     'https://www.youtube.com/watch?v=change1', 15, 60, 3, 'video');
    
    -- Lição 4
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_caixa_operacoes, 'Segurança no Caixa', 
     'Procedimentos de segurança e prevenção de fraudes',
     'Como identificar notas falsas, prevenir furtos e manter a segurança.',
     'https://www.youtube.com/watch?v=security1', 25, 80, 4, 'video');
    
    -- Lição 5
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_caixa_operacoes, 'Sistema de Vendas (PDV)', 
     'Como utilizar o sistema de ponto de venda eficientemente',
     'Navegação no sistema, códigos de produtos, promoções e descontos.',
     'https://www.youtube.com/watch?v=pos1', 20, 70, 5, 'video');
END $$;

-- Lições para "Atendimento Rápido e Eficiente no Caixa"
DO $$ 
DECLARE 
    trail_caixa_atendimento UUID;
BEGIN
    SELECT id INTO trail_caixa_atendimento 
    FROM trails 
    WHERE title = 'Atendimento Rápido e Eficiente no Caixa';
    
    -- Lição 1
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_caixa_atendimento, 'Técnicas de Agilidade', 
     'Como acelerar o atendimento sem perder qualidade',
     'Organização do espaço, movimentos eficientes e otimização do tempo.',
     'https://www.youtube.com/watch?v=speed1', 20, 70, 1, 'video');
    
    -- Lição 2
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_caixa_atendimento, 'Gestão de Filas', 
     'Estratégias para reduzir tempo de espera dos clientes',
     'Comunicação com clientes na fila, priorização e organização.',
     'https://www.youtube.com/watch?v=queue1', 15, 60, 2, 'video');
    
    -- Lição 3
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_caixa_atendimento, 'Atendimento sob Pressão', 
     'Como manter a qualidade em momentos de alta demanda',
     'Técnicas de controle de estresse e manutenção da cordialidade.',
     'https://www.youtube.com/watch?v=pressure1', 25, 80, 3, 'video');
    
    -- Lição 4
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_caixa_atendimento, 'Comunicação Eficaz no Caixa', 
     'Comunicação clara e rápida com os clientes',
     'Frases-chave, linguagem corporal e comunicação não-verbal.',
     'https://www.youtube.com/watch?v=communication1', 20, 70, 4, 'video');
END $$;

-- =====================================================
-- LIÇÕES PARA TRILHAS COMPARTILHADAS
-- =====================================================

-- Lições para "Segurança e Compliance Empresarial"
DO $$ 
DECLARE 
    trail_seguranca UUID;
BEGIN
    SELECT id INTO trail_seguranca 
    FROM trails 
    WHERE title = 'Segurança e Compliance Empresarial';
    
    -- Lição 1
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_seguranca, 'LGPD e Proteção de Dados', 
     'Lei Geral de Proteção de Dados e suas implicações',
     'Entenda a LGPD, direitos dos titulares e responsabilidades da empresa.',
     'https://www.youtube.com/watch?v=lgpd1', 30, 90, 1, 'video');
    
    -- Lição 2
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_seguranca, 'Prevenção de Acidentes', 
     'Identificação e prevenção de riscos no ambiente de trabalho',
     'Reconhecimento de perigos, uso correto de EPIs e procedimentos seguros.',
     'https://www.youtube.com/watch?v=prevention1', 25, 80, 2, 'video');
    
    -- Lição 3
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_seguranca, 'Compliance e Ética', 
     'Normas éticas e compliance regulatório',
     'Código de conduta, prevenção à corrupção e práticas éticas.',
     'https://www.youtube.com/watch?v=compliance1', 35, 100, 3, 'video');
    
    -- Lição 4
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_seguranca, 'Segurança da Informação', 
     'Proteção de informações e sistemas da empresa',
     'Senhas seguras, phishing, backup de dados e segurança digital.',
     'https://www.youtube.com/watch?v=infosec1', 30, 90, 4, 'video');
END $$;

-- Lições para "Cultura e Valores Organizacionais"
DO $$ 
DECLARE 
    trail_cultura UUID;
BEGIN
    SELECT id INTO trail_cultura 
    FROM trails 
    WHERE title = 'Cultura e Valores Organizacionais';
    
    -- Lição 1
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_cultura, 'Missão, Visão e Valores', 
     'Conheça a identidade e propósito da empresa',
     'Entenda a missão, visão e valores da empresa e como vivenciá-los.',
     'https://www.youtube.com/watch?v=mission1', 15, 50, 1, 'video');
    
    -- Lição 2
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_cultura, 'História e Tradição', 
     'A trajetória e evolução da empresa',
     'Conheça a história, marcos importantes e tradições da organização.',
     'https://www.youtube.com/watch?v=history1', 20, 60, 2, 'video');
    
    -- Lição 3
    INSERT INTO lessons (trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type) VALUES
    (trail_cultura, 'Comportamentos e Atitudes', 
     'Como aplicar os valores no dia a dia de trabalho',
     'Exemplos práticos de como viver os valores da empresa no cotidiano.',
     'https://www.youtube.com/watch?v=behavior1', 25, 70, 3, 'video');
END $$;

\echo '✅ Lições específicas por grupo criadas com sucesso!'