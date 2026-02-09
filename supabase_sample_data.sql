-- =====================================================
-- DADOS DE EXEMPLO - PET CLASS GAMEPOP
-- =====================================================

-- =====================================================
-- INSERIR TRILHAS
-- =====================================================
INSERT INTO trails (id, title, description, icon_url, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Atendimento', 'Aprenda as melhores práticas de atendimento ao cliente no pet shop', '🐾', 1),
('550e8400-e29b-41d4-a716-446655440002', 'Vendas', 'Técnicas de vendas e relacionamento com clientes', '💰', 2),
('550e8400-e29b-41d4-a716-446655440003', 'Produtos Pet', 'Conhecimento sobre produtos para animais de estimação', '🦴', 3),
('550e8400-e29b-41d4-a716-446655440004', 'Liderança', 'Desenvolvimento de habilidades de liderança e gestão de equipe', '👑', 4),
('550e8400-e29b-41d4-a716-446655440005', 'Gestão de Loja', 'Administração e operações do pet shop', '🏪', 5),
('550e8400-e29b-41d4-a716-446655440006', 'Estoque', 'Controle e gestão de estoque de produtos', '📦', 6),
('550e8400-e29b-41d4-a716-446655440007', 'PDV', 'Operação do ponto de venda e sistema de caixa', '💳', 7),
('550e8400-e29b-41d4-a716-446655440008', 'Fechamento', 'Procedimentos de fechamento de caixa', '🧮', 8),
('550e8400-e29b-41d4-a716-446655440009', 'Relacionamento', 'Relacionamento com clientes no caixa', '🤝', 9);

-- =====================================================
-- INSERIR AULAS
-- =====================================================

-- Aulas da trilha Atendimento
INSERT INTO lessons (id, trail_id, title, description, content, xp_reward, order_index) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Primeiros Passos no Atendimento', 'Como receber e cumprimentar clientes', 'Nesta aula você aprenderá a importância do primeiro contato com o cliente...', 15, 1),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Escuta Ativa', 'Técnicas para ouvir e entender as necessidades do cliente', 'A escuta ativa é fundamental para um bom atendimento...', 20, 2),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Resolvendo Problemas', 'Como lidar com reclamações e problemas', 'Aprenda a transformar problemas em oportunidades...', 25, 3);

-- Aulas da trilha Vendas
INSERT INTO lessons (id, trail_id, title, description, content, xp_reward, order_index) VALUES
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Técnicas de Abordagem', 'Como abordar clientes de forma efetiva', 'Aprenda diferentes formas de iniciar uma conversa de vendas...', 15, 1),
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Identificando Necessidades', 'Como descobrir o que o cliente realmente precisa', 'Faça as perguntas certas para entender as necessidades...', 20, 2),
('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Fechamento de Vendas', 'Técnicas para finalizar a venda', 'Aprenda quando e como fechar uma venda...', 25, 3);

-- Aulas da trilha Produtos Pet
INSERT INTO lessons (id, trail_id, title, description, content, xp_reward, order_index) VALUES
('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 'Alimentação Canina', 'Tipos de ração e alimentação para cães', 'Conheça os diferentes tipos de ração e suas indicações...', 15, 1),
('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'Alimentação Felina', 'Nutrição específica para gatos', 'Entenda as necessidades nutricionais dos felinos...', 15, 2),
('650e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440003', 'Brinquedos e Acessórios', 'Produtos para entretenimento e cuidado', 'Conheça os principais brinquedos e acessórios...', 20, 3);

-- =====================================================
-- INSERIR QUIZZES
-- =====================================================

-- Quiz da aula "Escuta Ativa"
INSERT INTO quizzes (id, lesson_id, title, question, options, correct_answer, xp_reward, order_index) VALUES
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002', 'Quiz: Escuta Ativa', 'Qual é a melhor forma de demonstrar que você está ouvindo o cliente?', '["Ouvir com atenção", "Interromper para dar sugestões", "Olhar para o celular", "Falar sobre outros produtos"]', 0, 10, 1);

-- Opções do quiz
INSERT INTO quiz_options (id, quiz_id, option_text, is_correct, order_index) VALUES
('850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'Ouvir com atenção', true, 1),
('850e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440001', 'Interromper para dar sugestões', false, 2),
('850e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440001', 'Olhar para o celular', false, 3),
('850e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440001', 'Falar sobre outros produtos', false, 4);

-- Quiz da aula "Técnicas de Abordagem"
INSERT INTO quizzes (id, lesson_id, title, question, options, correct_answer, xp_reward, order_index) VALUES
('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440004', 'Quiz: Técnicas de Abordagem', 'Qual é a melhor forma de abordar um cliente que acabou de entrar na loja?', '["Cumprimentar e perguntar como pode ajudar", "Seguir o cliente pela loja", "Ignorar até ele pedir ajuda", "Mostrar imediatamente os produtos mais caros"]', 0, 10, 1);

INSERT INTO quiz_options (id, quiz_id, option_text, is_correct, order_index) VALUES
('850e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440002', 'Cumprimentar e perguntar como pode ajudar', true, 1),
('850e8400-e29b-41d4-a716-446655440006', '750e8400-e29b-41d4-a716-446655440002', 'Seguir o cliente pela loja', false, 2),
('850e8400-e29b-41d4-a716-446655440007', '750e8400-e29b-41d4-a716-446655440002', 'Ignorar até ele pedir ajuda', false, 3),
('850e8400-e29b-41d4-a716-446655440008', '750e8400-e29b-41d4-a716-446655440002', 'Mostrar imediatamente os produtos mais caros', false, 4);

-- =====================================================
-- INSERIR CONQUISTAS
-- =====================================================
INSERT INTO achievements (id, title, description, icon_url, achievement_type, requirement_value, xp_reward) VALUES
('950e8400-e29b-41d4-a716-446655440001', 'Primeira Aula', 'Complete sua primeira aula', '🎓', 'lessons_completed', 1, 50),
('950e8400-e29b-41d4-a716-446655440002', 'Sequência de 3 dias', 'Acesse a plataforma por 3 dias seguidos', '🔥', 'streak', 3, 100),
('950e8400-e29b-41d4-a716-446655440003', 'Sequência de 7 dias', 'Acesse a plataforma por 7 dias seguidos', '🔥', 'streak', 7, 200),
('950e8400-e29b-41d4-a716-446655440004', '100 XP', 'Alcance 100 pontos de experiência', '⭐', 'xp_milestone', 100, 25),
('950e8400-e29b-41d4-a716-446655440005', '500 XP', 'Alcance 500 pontos de experiência', '⭐', 'xp_milestone', 500, 50),
('950e8400-e29b-41d4-a716-446655440006', '1000 XP', 'Alcance 1000 pontos de experiência', '🏆', 'xp_milestone', 1000, 100),
('950e8400-e29b-41d4-a716-446655440007', 'Medalha Ouro', 'Complete uma trilha inteira', '🥇', 'trail_completed', 1, 300),
('950e8400-e29b-41d4-a716-446655440008', 'Expert em Atendimento', 'Complete a trilha de Atendimento', '🐾', 'trail_completed', 1, 250),
('950e8400-e29b-41d4-a716-446655440009', 'Mestre das Vendas', 'Complete a trilha de Vendas', '💰', 'trail_completed', 1, 250),
('950e8400-e29b-41d4-a716-446655440010', 'Especialista em Produtos', 'Complete a trilha de Produtos Pet', '🦴', 'trail_completed', 1, 250);

-- =====================================================
-- INSERIR MISSÕES DIÁRIAS
-- =====================================================
INSERT INTO daily_missions (id, title, description, mission_type, target_value, xp_reward) VALUES
('a50e8400-e29b-41d4-a716-446655440001', 'Ganhe 10 XP hoje', 'Acumule 10 pontos de experiência em um dia', 'earn_xp', 10, 20),
('a50e8400-e29b-41d4-a716-446655440002', 'Complete uma aula', 'Finalize pelo menos uma aula hoje', 'complete_lessons', 1, 15),
('a50e8400-e29b-41d4-a716-446655440003', 'Acerte 3 quizzes', 'Responda corretamente 3 perguntas de quiz', 'answer_quizzes', 3, 25),
('a50e8400-e29b-41d4-a716-446655440004', 'Faça login', 'Acesse a plataforma hoje', 'login_daily', 1, 5);

-- =====================================================
-- INSERIR ITENS DA LOJA
-- =====================================================
INSERT INTO store_items (id, name, description, image_url, item_type, price) VALUES
('b50e8400-e29b-41d4-a716-446655440001', 'Avatar Cachorro', 'Avatar personalizado de cachorro', '🐕', 'avatar', 100),
('b50e8400-e29b-41d4-a716-446655440002', 'Avatar Gato', 'Avatar personalizado de gato', '🐱', 'avatar', 100),
('b50e8400-e29b-41d4-a716-446655440003', 'Badge Especial', 'Badge exclusivo para o perfil', '⭐', 'decoration', 150),
('b50e8400-e29b-41d4-a716-446655440004', 'Boost de XP', 'Dobra o XP por 24 horas', '⚡', 'boost', 200),
('b50e8400-e29b-41d4-a716-446655440005', 'Tema Escuro', 'Tema escuro para a interface', '🌙', 'theme', 75),
('b50e8400-e29b-41d4-a716-446655440006', 'Moldura Dourada', 'Moldura dourada para o avatar', '🖼️', 'decoration', 300);

-- =====================================================
-- COMENTÁRIOS SOBRE OS DADOS
-- =====================================================

/*
ESTRUTURA DOS DADOS CRIADOS:

1. TRILHAS (9 trilhas):
   - 3 para funcionários: Atendimento, Vendas, Produtos Pet
   - 3 para gerentes: Liderança, Gestão de Loja, Estoque  
   - 3 para caixa: PDV, Fechamento, Relacionamento

2. AULAS (9 aulas):
   - 3 aulas por trilha (Atendimento, Vendas, Produtos Pet)
   - Cada aula com XP progressivo (15, 20, 25)

3. QUIZZES (2 quizzes):
   - Quiz sobre "Escuta Ativa" com 4 opções
   - Quiz sobre "Técnicas de Abordagem" com 4 opções

4. CONQUISTAS (10 conquistas):
   - Marcos de XP: 100, 500, 1000
   - Sequências: 3 dias, 7 dias
   - Completar trilhas específicas
   - Primeira aula

5. MISSÕES DIÁRIAS (4 missões):
   - Ganhar XP diário
   - Completar aulas
   - Acertar quizzes
   - Fazer login

6. LOJA (6 itens):
   - Avatars personalizados
   - Badges e boosts
   - Temas e molduras

Para adicionar mais conteúdo, basta seguir os padrões estabelecidos
e usar UUIDs únicos para cada novo registro.
*/