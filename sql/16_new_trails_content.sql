-- =====================================================
-- SCRIPT: NOVAS TRILHAS EDUCATIVAS COMPLETAS
-- Descrição: Adiciona trilhas com vídeos, lições e quizzes
-- =====================================================

-- =====================================================
-- 1. TRILHAS EDUCATIVAS
-- =====================================================

-- Trilha 1: Fundamentos de Programação
INSERT INTO trails (id, title, description, icon_url, color, difficulty_level, estimated_duration, order_index, is_active)
VALUES 
(gen_random_uuid(), 'Fundamentos de Programação', 'Aprenda os conceitos básicos de programação de forma prática e divertida', 'https://img.icons8.com/color/96/code.png', '#3B82F6', 1, 120, 1, true);

-- Trilha 2: Desenvolvimento Web
INSERT INTO trails (id, title, description, icon_url, color, difficulty_level, estimated_duration, order_index, is_active)
VALUES 
(gen_random_uuid(), 'Desenvolvimento Web', 'Domine HTML, CSS e JavaScript para criar sites incríveis', 'https://img.icons8.com/color/96/web.png', '#10B981', 2, 180, 2, true);

-- Trilha 3: Banco de Dados
INSERT INTO trails (id, title, description, icon_url, color, difficulty_level, estimated_duration, order_index, is_active)
VALUES 
(gen_random_uuid(), 'Banco de Dados', 'Aprenda SQL e conceitos de banco de dados relacionais', 'https://img.icons8.com/color/96/database.png', '#8B5CF6', 2, 150, 3, true);

-- Trilha 4: Mobile Development
INSERT INTO trails (id, title, description, icon_url, color, difficulty_level, estimated_duration, order_index, is_active)
VALUES 
(gen_random_uuid(), 'Desenvolvimento Mobile', 'Crie aplicativos móveis com React Native', 'https://img.icons8.com/color/96/smartphone.png', '#F59E0B', 3, 200, 4, true);

-- Trilha 5: DevOps e Cloud
INSERT INTO trails (id, title, description, icon_url, color, difficulty_level, estimated_duration, order_index, is_active)
VALUES 
(gen_random_uuid(), 'DevOps e Cloud', 'Aprenda sobre deploy, CI/CD e computação em nuvem', 'https://img.icons8.com/color/96/cloud.png', '#EF4444', 4, 160, 5, true);

-- =====================================================
-- 2. LIÇÕES COM VÍDEOS - TRILHA 1: FUNDAMENTOS
-- =====================================================

-- Obter ID da trilha de Fundamentos
DO $$
DECLARE
    trail_fundamentos_id UUID;
    lesson_id UUID;
BEGIN
    SELECT id INTO trail_fundamentos_id FROM trails WHERE title = 'Fundamentos de Programação';
    
    -- Lição 1: O que é Programação?
    INSERT INTO lessons (id, trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type)
    VALUES 
    (gen_random_uuid(), trail_fundamentos_id, 'O que é Programação?', 'Introdução aos conceitos básicos de programação', 
     'Programação é a arte de criar instruções para computadores executarem tarefas específicas. Nesta lição, você aprenderá os conceitos fundamentais que todo programador precisa conhecer.',
     'https://www.youtube.com/embed/S9uPNppGsGo', 15, 20, 1, 'video');
    
    -- Lição 2: Variáveis e Tipos de Dados
    INSERT INTO lessons (id, trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type)
    VALUES 
    (gen_random_uuid(), trail_fundamentos_id, 'Variáveis e Tipos de Dados', 'Aprenda sobre variáveis e diferentes tipos de dados', 
     'Variáveis são como caixas que armazenam informações. Existem diferentes tipos: números, textos, verdadeiro/falso. Vamos explorar cada um deles!',
     'https://www.youtube.com/embed/7WpfIKO6rhU', 20, 25, 2, 'video');
    
    -- Lição 3: Estruturas de Controle
    INSERT INTO lessons (id, trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type)
    VALUES 
    (gen_random_uuid(), trail_fundamentos_id, 'Estruturas de Controle', 'Condicionais e loops para controlar o fluxo do programa', 
     'As estruturas de controle permitem que seu programa tome decisões (if/else) e repita ações (loops). São fundamentais para criar lógica complexa.',
     'https://www.youtube.com/embed/1Ij6R1GRtMk', 25, 30, 3, 'video');
    
    -- Lição 4: Funções
    INSERT INTO lessons (id, trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type)
    VALUES 
    (gen_random_uuid(), trail_fundamentos_id, 'Funções', 'Organize seu código com funções reutilizáveis', 
     'Funções são blocos de código que executam tarefas específicas. Elas tornam o código mais organizado, reutilizável e fácil de manter.',
     'https://www.youtube.com/embed/N8ap4k_1QEQ', 20, 25, 4, 'video');
END $$;

-- =====================================================
-- 3. LIÇÕES COM VÍDEOS - TRILHA 2: WEB DEVELOPMENT
-- =====================================================

DO $$
DECLARE
    trail_web_id UUID;
BEGIN
    SELECT id INTO trail_web_id FROM trails WHERE title = 'Desenvolvimento Web';
    
    -- Lição 1: HTML Básico
    INSERT INTO lessons (id, trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type)
    VALUES 
    (gen_random_uuid(), trail_web_id, 'HTML Básico', 'Estruture páginas web com HTML', 
     'HTML é a linguagem de marcação que estrutura páginas web. Aprenda tags, elementos e como criar a estrutura básica de uma página.',
     'https://www.youtube.com/embed/UB1O30fR-EE', 25, 30, 1, 'video');
    
    -- Lição 2: CSS Estilização
    INSERT INTO lessons (id, trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type)
    VALUES 
    (gen_random_uuid(), trail_web_id, 'CSS Estilização', 'Deixe suas páginas bonitas com CSS', 
     'CSS é responsável pela aparência visual das páginas web. Aprenda seletores, propriedades e como criar layouts responsivos.',
     'https://www.youtube.com/embed/yfoY53QXEnI', 30, 35, 2, 'video');
    
    -- Lição 3: JavaScript Interativo
    INSERT INTO lessons (id, trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type)
    VALUES 
    (gen_random_uuid(), trail_web_id, 'JavaScript Interativo', 'Adicione interatividade com JavaScript', 
     'JavaScript torna as páginas web interativas. Aprenda a manipular elementos, responder a eventos e criar experiências dinâmicas.',
     'https://www.youtube.com/embed/PkZNo7MFNFg', 35, 40, 3, 'video');
    
    -- Lição 4: Projeto Prático
    INSERT INTO lessons (id, trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type)
    VALUES 
    (gen_random_uuid(), trail_web_id, 'Projeto Prático', 'Crie sua primeira página web completa', 
     'Vamos juntar tudo que aprendemos para criar uma página web completa com HTML, CSS e JavaScript funcionando em harmonia.',
     'https://www.youtube.com/embed/jaVNP3nIAv0', 40, 50, 4, 'video');
END $$;

-- =====================================================
-- 4. LIÇÕES COM VÍDEOS - TRILHA 3: BANCO DE DADOS
-- =====================================================

DO $$
DECLARE
    trail_db_id UUID;
BEGIN
    SELECT id INTO trail_db_id FROM trails WHERE title = 'Banco de Dados';
    
    -- Lição 1: Introdução a Bancos de Dados
    INSERT INTO lessons (id, trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type)
    VALUES 
    (gen_random_uuid(), trail_db_id, 'Introdução a Bancos de Dados', 'Conceitos fundamentais de banco de dados', 
     'Bancos de dados são sistemas organizados para armazenar e recuperar informações. Aprenda sobre tabelas, registros e relacionamentos.',
     'https://www.youtube.com/embed/Tk1t3WKK_ZY', 20, 25, 1, 'video');
    
    -- Lição 2: SQL Básico
    INSERT INTO lessons (id, trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type)
    VALUES 
    (gen_random_uuid(), trail_db_id, 'SQL Básico', 'Aprenda a linguagem SQL para consultar dados', 
     'SQL é a linguagem padrão para trabalhar com bancos de dados relacionais. Aprenda SELECT, INSERT, UPDATE e DELETE.',
     'https://www.youtube.com/embed/HXV3zeQKqGY', 30, 35, 2, 'video');
    
    -- Lição 3: Relacionamentos e JOINs
    INSERT INTO lessons (id, trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type)
    VALUES 
    (gen_random_uuid(), trail_db_id, 'Relacionamentos e JOINs', 'Conecte tabelas com relacionamentos', 
     'Aprenda como relacionar tabelas e usar JOINs para consultar dados de múltiplas tabelas simultaneamente.',
     'https://www.youtube.com/embed/9yeOJ0ZMUYw', 25, 30, 3, 'video');
END $$;

-- =====================================================
-- 5. LIÇÕES COM VÍDEOS - TRILHA 4: MOBILE
-- =====================================================

DO $$
DECLARE
    trail_mobile_id UUID;
BEGIN
    SELECT id INTO trail_mobile_id FROM trails WHERE title = 'Desenvolvimento Mobile';
    
    -- Lição 1: Introdução ao React Native
    INSERT INTO lessons (id, trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type)
    VALUES 
    (gen_random_uuid(), trail_mobile_id, 'Introdução ao React Native', 'Primeiros passos no desenvolvimento mobile', 
     'React Native permite criar apps nativos usando JavaScript. Aprenda a configurar o ambiente e criar seu primeiro app.',
     'https://www.youtube.com/embed/0-S5a0eXPoc', 30, 35, 1, 'video');
    
    -- Lição 2: Componentes e Navegação
    INSERT INTO lessons (id, trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type)
    VALUES 
    (gen_random_uuid(), trail_mobile_id, 'Componentes e Navegação', 'Crie interfaces e navegação entre telas', 
     'Aprenda a criar componentes reutilizáveis e implementar navegação entre diferentes telas do seu aplicativo.',
     'https://www.youtube.com/embed/VozPNrt-LfE', 35, 40, 2, 'video');
    
    -- Lição 3: APIs e Estado
    INSERT INTO lessons (id, trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type)
    VALUES 
    (gen_random_uuid(), trail_mobile_id, 'APIs e Estado', 'Conecte seu app com APIs e gerencie estado', 
     'Aprenda a consumir APIs REST e gerenciar o estado da aplicação para criar apps dinâmicos e conectados.',
     'https://www.youtube.com/embed/VQ8DCmKWhMM', 40, 45, 3, 'video');
END $$;

-- =====================================================
-- 6. LIÇÕES COM VÍDEOS - TRILHA 5: DEVOPS
-- =====================================================

DO $$
DECLARE
    trail_devops_id UUID;
BEGIN
    SELECT id INTO trail_devops_id FROM trails WHERE title = 'DevOps e Cloud';
    
    -- Lição 1: Introdução ao DevOps
    INSERT INTO lessons (id, trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type)
    VALUES 
    (gen_random_uuid(), trail_devops_id, 'Introdução ao DevOps', 'Conceitos e práticas de DevOps', 
     'DevOps une desenvolvimento e operações para entregar software de forma mais rápida e confiável. Aprenda os conceitos fundamentais.',
     'https://www.youtube.com/embed/UbtB4sMaaNM', 25, 30, 1, 'video');
    
    -- Lição 2: Git e Controle de Versão
    INSERT INTO lessons (id, trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type)
    VALUES 
    (gen_random_uuid(), trail_devops_id, 'Git e Controle de Versão', 'Gerencie código com Git', 
     'Git é essencial para qualquer desenvolvedor. Aprenda comandos básicos, branches, merges e como colaborar em equipe.',
     'https://www.youtube.com/embed/SWYqp7iY_Tc', 30, 35, 2, 'video');
    
    -- Lição 3: Deploy e CI/CD
    INSERT INTO lessons (id, trail_id, title, description, content, video_url, duration, xp_reward, order_index, lesson_type)
    VALUES 
    (gen_random_uuid(), trail_devops_id, 'Deploy e CI/CD', 'Automatize deploys com CI/CD', 
     'Aprenda a automatizar o processo de deploy usando pipelines de CI/CD para entregar código de forma contínua e segura.',
     'https://www.youtube.com/embed/1er2cjUq1UI', 35, 40, 3, 'video');
END $$;

-- Verificar criação das trilhas
SELECT 'Trilhas criadas com sucesso!' as status;
SELECT COUNT(*) as total_trilhas FROM trails WHERE is_active = true;
SELECT COUNT(*) as total_licoes FROM lessons WHERE is_active = true;