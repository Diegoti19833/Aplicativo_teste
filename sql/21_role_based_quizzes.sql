-- =====================================================
-- QUIZZES ESPECÍFICOS PARA TRILHAS POR GRUPO
-- Descrição: Quizzes para cada lição das trilhas por grupo de funcionários
-- =====================================================

-- =====================================================
-- QUIZZES PARA FUNCIONÁRIOS - ATENDIMENTO AO CLIENTE
-- =====================================================

DO $$ 
DECLARE 
    lesson_record RECORD;
    trail_funcionario_atendimento UUID;
BEGIN
    SELECT id INTO trail_funcionario_atendimento 
    FROM trails 
    WHERE title = 'Atendimento ao Cliente - Funcionário';
    
    -- Quiz para "Fundamentos do Atendimento"
    FOR lesson_record IN 
        SELECT id FROM lessons 
        WHERE trail_id = trail_funcionario_atendimento 
        AND title = 'Fundamentos do Atendimento'
    LOOP
        INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index) VALUES
        (lesson_record.id, trail_funcionario_atendimento, 'Quiz: Fundamentos do Atendimento', 
         'Qual é o elemento mais importante no primeiro contato com o cliente?',
         '["Velocidade no atendimento", "Sorriso e cordialidade", "Conhecimento técnico", "Preço dos produtos"]',
         1, 'O sorriso e cordialidade criam uma primeira impressão positiva e estabelecem um ambiente acolhedor.', 
         25, 1, 1);
    END LOOP;
    
    -- Quiz para "Comunicação Efetiva"
    FOR lesson_record IN 
        SELECT id FROM lessons 
        WHERE trail_id = trail_funcionario_atendimento 
        AND title = 'Comunicação Efetiva'
    LOOP
        INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index) VALUES
        (lesson_record.id, trail_funcionario_atendimento, 'Quiz: Comunicação Efetiva', 
         'O que caracteriza a escuta ativa no atendimento?',
         '["Falar mais que o cliente", "Interromper para dar soluções", "Prestar atenção total ao que o cliente diz", "Pensar na resposta enquanto o cliente fala"]',
         2, 'A escuta ativa envolve prestar atenção total ao cliente, demonstrando interesse genuíno em suas necessidades.', 
         30, 1, 1);
    END LOOP;
    
    -- Quiz para "Resolução de Problemas Básicos"
    FOR lesson_record IN 
        SELECT id FROM lessons 
        WHERE trail_id = trail_funcionario_atendimento 
        AND title = 'Resolução de Problemas Básicos'
    LOOP
        INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index) VALUES
        (lesson_record.id, trail_funcionario_atendimento, 'Quiz: Resolução de Problemas', 
         'Qual é o primeiro passo para resolver um problema do cliente?',
         '["Oferecer uma solução imediata", "Entender completamente o problema", "Chamar o supervisor", "Verificar o sistema"]',
         1, 'É essencial entender completamente o problema antes de propor qualquer solução.', 
         35, 2, 1);
    END LOOP;
    
    -- Quiz para "Lidando com Reclamações"
    FOR lesson_record IN 
        SELECT id FROM lessons 
        WHERE trail_id = trail_funcionario_atendimento 
        AND title = 'Lidando com Reclamações'
    LOOP
        INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index) VALUES
        (lesson_record.id, trail_funcionario_atendimento, 'Quiz: Lidando com Reclamações', 
         'Como você deve reagir quando um cliente está visivelmente irritado?',
         '["Defender a empresa imediatamente", "Manter a calma e demonstrar empatia", "Transferir para outro funcionário", "Explicar que não é sua culpa"]',
         1, 'Manter a calma e demonstrar empatia ajuda a acalmar o cliente e criar um ambiente para resolver o problema.', 
         40, 2, 1);
    END LOOP;
END $$;

-- =====================================================
-- QUIZZES PARA FUNCIONÁRIOS - PROCEDIMENTOS OPERACIONAIS
-- =====================================================

DO $$ 
DECLARE 
    lesson_record RECORD;
    trail_funcionario_operacional UUID;
BEGIN
    SELECT id INTO trail_funcionario_operacional 
    FROM trails 
    WHERE title = 'Procedimentos Operacionais Básicos';
    
    -- Quiz para "Normas de Segurança no Trabalho"
    FOR lesson_record IN 
        SELECT id FROM lessons 
        WHERE trail_id = trail_funcionario_operacional 
        AND title = 'Normas de Segurança no Trabalho'
    LOOP
        INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index) VALUES
        (lesson_record.id, trail_funcionario_operacional, 'Quiz: Segurança no Trabalho', 
         'Quando você deve usar equipamentos de proteção individual (EPI)?',
         '["Apenas quando há fiscalização", "Somente em atividades perigosas", "Sempre que especificado nos procedimentos", "Apenas se sentir necessário"]',
         2, 'Os EPIs devem ser usados sempre que especificado nos procedimentos de segurança, independente da percepção pessoal de risco.', 
         30, 1, 1);
    END LOOP;
    
    -- Quiz para "Organização do Ambiente de Trabalho"
    FOR lesson_record IN 
        SELECT id FROM lessons 
        WHERE trail_id = trail_funcionario_operacional 
        AND title = 'Organização do Ambiente de Trabalho'
    LOOP
        INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index) VALUES
        (lesson_record.id, trail_funcionario_operacional, 'Quiz: Organização do Trabalho', 
         'Qual é o principal benefício de manter o ambiente de trabalho organizado?',
         '["Impressionar os supervisores", "Aumentar a produtividade e segurança", "Facilitar a limpeza", "Seguir as regras da empresa"]',
         1, 'Um ambiente organizado aumenta a produtividade, reduz acidentes e melhora a qualidade do trabalho.', 
         25, 1, 1);
    END LOOP;
    
    -- Quiz para "Protocolos de Emergência"
    FOR lesson_record IN 
        SELECT id FROM lessons 
        WHERE trail_id = trail_funcionario_operacional 
        AND title = 'Protocolos de Emergência'
    LOOP
        INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index) VALUES
        (lesson_record.id, trail_funcionario_operacional, 'Quiz: Emergências', 
         'Em caso de incêndio, qual deve ser sua primeira ação?',
         '["Tentar apagar o fogo", "Acionar o alarme de emergência", "Buscar seus pertences", "Ligar para a família"]',
         1, 'A primeira ação deve ser acionar o alarme de emergência para alertar todos sobre o perigo.', 
         35, 2, 1);
    END LOOP;
END $$;

-- =====================================================
-- QUIZZES PARA GERENTES - LIDERANÇA
-- =====================================================

DO $$ 
DECLARE 
    lesson_record RECORD;
    trail_gerente_lideranca UUID;
BEGIN
    SELECT id INTO trail_gerente_lideranca 
    FROM trails 
    WHERE title = 'Liderança e Gestão de Equipes';
    
    -- Quiz para "Estilos de Liderança"
    FOR lesson_record IN 
        SELECT id FROM lessons 
        WHERE trail_id = trail_gerente_lideranca 
        AND title = 'Estilos de Liderança'
    LOOP
        INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index) VALUES
        (lesson_record.id, trail_gerente_lideranca, 'Quiz: Estilos de Liderança', 
         'Qual estilo de liderança é mais adequado para uma equipe experiente e motivada?',
         '["Autocrático", "Democrático", "Delegativo", "Paternalista"]',
         2, 'O estilo delegativo é ideal para equipes experientes e motivadas, pois permite autonomia e desenvolvimento.', 
         50, 3, 1);
    END LOOP;
    
    -- Quiz para "Motivação e Engajamento"
    FOR lesson_record IN 
        SELECT id FROM lessons 
        WHERE trail_id = trail_gerente_lideranca 
        AND title = 'Motivação e Engajamento'
    LOOP
        INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index) VALUES
        (lesson_record.id, trail_gerente_lideranca, 'Quiz: Motivação', 
         'Segundo a teoria de Maslow, qual necessidade deve ser atendida primeiro?',
         '["Autorrealização", "Estima", "Fisiológicas", "Segurança"]',
         2, 'As necessidades fisiológicas (alimentação, sono, abrigo) são a base da pirâmide de Maslow.', 
         55, 3, 1);
    END LOOP;
    
    -- Quiz para "Feedback e Desenvolvimento"
    FOR lesson_record IN 
        SELECT id FROM lessons 
        WHERE trail_id = trail_gerente_lideranca 
        AND title = 'Feedback e Desenvolvimento'
    LOOP
        INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index) VALUES
        (lesson_record.id, trail_gerente_lideranca, 'Quiz: Feedback', 
         'Qual é a característica mais importante de um feedback efetivo?',
         '["Ser dado publicamente", "Ser específico e construtivo", "Focar apenas nos pontos negativos", "Ser dado apenas anualmente"]',
         1, 'Feedback efetivo deve ser específico, construtivo e focado em comportamentos observáveis.', 
         60, 3, 1);
    END LOOP;
END $$;

-- =====================================================
-- QUIZZES PARA CAIXAS - OPERAÇÕES
-- =====================================================

DO $$ 
DECLARE 
    lesson_record RECORD;
    trail_caixa_operacoes UUID;
BEGIN
    SELECT id INTO trail_caixa_operacoes 
    FROM trails 
    WHERE title = 'Operações de Caixa e Pagamentos';
    
    -- Quiz para "Abertura e Fechamento de Caixa"
    FOR lesson_record IN 
        SELECT id FROM lessons 
        WHERE trail_id = trail_caixa_operacoes 
        AND title = 'Abertura e Fechamento de Caixa'
    LOOP
        INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index) VALUES
        (lesson_record.id, trail_caixa_operacoes, 'Quiz: Abertura de Caixa', 
         'O que deve ser verificado primeiro na abertura do caixa?',
         '["Funcionamento da impressora", "Valor do fundo de caixa", "Limpeza do terminal", "Horário de funcionamento"]',
         1, 'O valor do fundo de caixa deve ser conferido primeiro para garantir que está correto para iniciar as operações.', 
         35, 2, 1);
    END LOOP;
    
    -- Quiz para "Formas de Pagamento"
    FOR lesson_record IN 
        SELECT id FROM lessons 
        WHERE trail_id = trail_caixa_operacoes 
        AND title = 'Formas de Pagamento'
    LOOP
        INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index) VALUES
        (lesson_record.id, trail_caixa_operacoes, 'Quiz: Formas de Pagamento', 
         'Qual informação é obrigatória para processar um pagamento via PIX?',
         '["CPF do cliente", "Chave PIX ou QR Code", "Endereço do cliente", "Telefone do cliente"]',
         1, 'Para processar um PIX é necessário a chave PIX ou QR Code para identificar o destinatário.', 
         40, 2, 1);
    END LOOP;
    
    -- Quiz para "Segurança no Caixa"
    FOR lesson_record IN 
        SELECT id FROM lessons 
        WHERE trail_id = trail_caixa_operacoes 
        AND title = 'Segurança no Caixa'
    LOOP
        INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index) VALUES
        (lesson_record.id, trail_caixa_operacoes, 'Quiz: Segurança', 
         'Como identificar uma nota falsa?',
         '["Apenas pela cor", "Textura, marca d\'água e elementos de segurança", "Somente pelo tamanho", "Apenas pelo cheiro"]',
         1, 'Notas verdadeiras possuem textura especial, marca d\'água e diversos elementos de segurança que devem ser verificados.', 
         40, 2, 1);
    END LOOP;
END $$;

-- =====================================================
-- QUIZZES PARA TRILHAS COMPARTILHADAS
-- =====================================================

DO $$ 
DECLARE 
    lesson_record RECORD;
    trail_seguranca UUID;
BEGIN
    SELECT id INTO trail_seguranca 
    FROM trails 
    WHERE title = 'Segurança e Compliance Empresarial';
    
    -- Quiz para "LGPD e Proteção de Dados"
    FOR lesson_record IN 
        SELECT id FROM lessons 
        WHERE trail_id = trail_seguranca 
        AND title = 'LGPD e Proteção de Dados'
    LOOP
        INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index) VALUES
        (lesson_record.id, trail_seguranca, 'Quiz: LGPD', 
         'Qual é um direito do titular de dados segundo a LGPD?',
         '["Vender seus dados", "Solicitar a exclusão de seus dados", "Alterar dados de terceiros", "Acessar dados de outros clientes"]',
         1, 'A LGPD garante ao titular o direito de solicitar a exclusão de seus dados pessoais.', 
         45, 2, 1);
    END LOOP;
    
    -- Quiz para "Compliance e Ética"
    FOR lesson_record IN 
        SELECT id FROM lessons 
        WHERE trail_id = trail_seguranca 
        AND title = 'Compliance e Ética'
    LOOP
        INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index) VALUES
        (lesson_record.id, trail_seguranca, 'Quiz: Ética', 
         'O que caracteriza um conflito de interesses?',
         '["Trabalhar em equipe", "Situação onde interesses pessoais podem influenciar decisões profissionais", "Discordar do supervisor", "Ter opiniões diferentes"]',
         1, 'Conflito de interesses ocorre quando interesses pessoais podem comprometer a imparcialidade nas decisões profissionais.', 
         50, 2, 1);
    END LOOP;
END $$;

DO $$ 
DECLARE 
    lesson_record RECORD;
    trail_cultura UUID;
BEGIN
    SELECT id INTO trail_cultura 
    FROM trails 
    WHERE title = 'Cultura e Valores Organizacionais';
    
    -- Quiz para "Missão, Visão e Valores"
    FOR lesson_record IN 
        SELECT id FROM lessons 
        WHERE trail_id = trail_cultura 
        AND title = 'Missão, Visão e Valores'
    LOOP
        INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index) VALUES
        (lesson_record.id, trail_cultura, 'Quiz: Missão e Visão', 
         'Qual é a diferença entre missão e visão da empresa?',
         '["Não há diferença", "Missão é o propósito atual, visão é o futuro desejado", "Visão é mais importante", "Missão muda todo ano"]',
         1, 'A missão define o propósito atual da empresa, enquanto a visão representa onde ela quer chegar no futuro.', 
         25, 1, 1);
    END LOOP;
    
    -- Quiz para "Comportamentos e Atitudes"
    FOR lesson_record IN 
        SELECT id FROM lessons 
        WHERE trail_id = trail_cultura 
        AND title = 'Comportamentos e Atitudes'
    LOOP
        INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index) VALUES
        (lesson_record.id, trail_cultura, 'Quiz: Comportamentos', 
         'Como você deve demonstrar os valores da empresa no trabalho?',
         '["Apenas em reuniões importantes", "Em todas as ações e decisões diárias", "Somente com clientes", "Apenas quando solicitado"]',
         1, 'Os valores da empresa devem ser demonstrados em todas as ações e decisões do dia a dia de trabalho.', 
         35, 1, 1);
    END LOOP;
END $$;

\echo '✅ Quizzes específicos por grupo criados com sucesso!'