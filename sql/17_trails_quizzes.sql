-- =====================================================
-- SCRIPT: QUIZZES PARA AS TRILHAS EDUCATIVAS
-- Descrição: Adiciona perguntas para todas as lições
-- =====================================================

-- =====================================================
-- QUIZZES - TRILHA 1: FUNDAMENTOS DE PROGRAMAÇÃO
-- =====================================================

DO $$
DECLARE
    trail_id UUID;
    lesson_id UUID;
BEGIN
    -- Obter ID da trilha
    SELECT id INTO trail_id FROM trails WHERE title = 'Fundamentos de Programação';
    
    -- QUIZZES PARA LIÇÃO 1: O que é Programação?
    SELECT id INTO lesson_id FROM lessons WHERE trail_id = trail_id AND title = 'O que é Programação?';
    
    INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index)
    VALUES 
    (lesson_id, trail_id, 'Conceito de Programação', 'O que é programação?', 
     '["Uma forma de arte", "Instruções para computadores", "Um tipo de matemática", "Uma linguagem humana"]', 
     1, 'Programação é o processo de criar instruções que computadores podem executar para realizar tarefas específicas.', 10, 1, 1),
    
    (lesson_id, trail_id, 'Linguagens de Programação', 'Qual das opções abaixo é uma linguagem de programação?', 
     '["Microsoft Word", "Python", "Google Chrome", "Windows"]', 
     1, 'Python é uma linguagem de programação popular e fácil de aprender.', 10, 1, 2);
    
    -- QUIZZES PARA LIÇÃO 2: Variáveis e Tipos de Dados
    SELECT id INTO lesson_id FROM lessons WHERE trail_id = trail_id AND title = 'Variáveis e Tipos de Dados';
    
    INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index)
    VALUES 
    (lesson_id, trail_id, 'Conceito de Variável', 'O que é uma variável em programação?', 
     '["Um número fixo", "Um espaço para armazenar dados", "Um tipo de erro", "Uma função especial"]', 
     1, 'Variáveis são espaços na memória onde podemos armazenar e modificar dados durante a execução do programa.', 10, 1, 1),
    
    (lesson_id, trail_id, 'Tipos de Dados', 'Qual tipo de dado representa texto?', 
     '["Integer", "String", "Boolean", "Float"]', 
     1, 'String é o tipo de dado usado para representar texto e caracteres.', 10, 1, 2);
    
    -- QUIZZES PARA LIÇÃO 3: Estruturas de Controle
    SELECT id INTO lesson_id FROM lessons WHERE trail_id = trail_id AND title = 'Estruturas de Controle';
    
    INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index)
    VALUES 
    (lesson_id, trail_id, 'Estrutura Condicional', 'Qual estrutura permite tomar decisões no código?', 
     '["for", "if/else", "print", "input"]', 
     1, 'A estrutura if/else permite que o programa execute diferentes códigos baseado em condições.', 15, 2, 1),
    
    (lesson_id, trail_id, 'Loops', 'Para que serve um loop?', 
     '["Parar o programa", "Repetir código", "Criar variáveis", "Deletar dados"]', 
     1, 'Loops permitem repetir um bloco de código múltiplas vezes, evitando repetição desnecessária.', 15, 2, 2);
    
    -- QUIZZES PARA LIÇÃO 4: Funções
    SELECT id INTO lesson_id FROM lessons WHERE trail_id = trail_id AND title = 'Funções';
    
    INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index)
    VALUES 
    (lesson_id, trail_id, 'Conceito de Função', 'O que é uma função?', 
     '["Um tipo de variável", "Um bloco de código reutilizável", "Um erro de sintaxe", "Um tipo de loop"]', 
     1, 'Funções são blocos de código que podem ser chamados múltiplas vezes, tornando o código mais organizado.', 15, 2, 1),
    
    (lesson_id, trail_id, 'Parâmetros', 'O que são parâmetros de uma função?', 
     '["Erros da função", "Valores de entrada", "Resultados da função", "Tipos de dados"]', 
     1, 'Parâmetros são valores que passamos para uma função para que ela possa trabalhar com esses dados.', 15, 2, 2);
END $$;

-- =====================================================
-- QUIZZES - TRILHA 2: DESENVOLVIMENTO WEB
-- =====================================================

DO $$
DECLARE
    trail_id UUID;
    lesson_id UUID;
BEGIN
    SELECT id INTO trail_id FROM trails WHERE title = 'Desenvolvimento Web';
    
    -- QUIZZES PARA LIÇÃO 1: HTML Básico
    SELECT id INTO lesson_id FROM lessons WHERE trail_id = trail_id AND title = 'HTML Básico';
    
    INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index)
    VALUES 
    (lesson_id, trail_id, 'HTML Significado', 'O que significa HTML?', 
     '["High Tech Markup Language", "HyperText Markup Language", "Home Tool Markup Language", "Hyperlink Text Markup Language"]', 
     1, 'HTML significa HyperText Markup Language, a linguagem padrão para criar páginas web.', 15, 2, 1),
    
    (lesson_id, trail_id, 'Tags HTML', 'Qual tag é usada para criar um parágrafo?', 
     '["<div>", "<p>", "<span>", "<text>"]', 
     1, 'A tag <p> é usada para criar parágrafos em HTML.', 15, 2, 2);
    
    -- QUIZZES PARA LIÇÃO 2: CSS Estilização
    SELECT id INTO lesson_id FROM lessons WHERE trail_id = trail_id AND title = 'CSS Estilização';
    
    INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index)
    VALUES 
    (lesson_id, trail_id, 'CSS Função', 'Para que serve o CSS?', 
     '["Criar estrutura", "Estilizar páginas", "Adicionar interatividade", "Conectar banco de dados"]', 
     1, 'CSS (Cascading Style Sheets) é usado para estilizar e dar aparência às páginas web.', 15, 2, 1),
    
    (lesson_id, trail_id, 'Seletores CSS', 'Como selecionar um elemento por ID no CSS?', 
     '["#id", ".id", "id", "*id"]', 
     0, 'O símbolo # é usado para selecionar elementos por ID no CSS.', 15, 2, 2);
    
    -- QUIZZES PARA LIÇÃO 3: JavaScript Interativo
    SELECT id INTO lesson_id FROM lessons WHERE trail_id = trail_id AND title = 'JavaScript Interativo';
    
    INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index)
    VALUES 
    (lesson_id, trail_id, 'JavaScript Função', 'Para que serve o JavaScript?', 
     '["Estilizar páginas", "Criar estrutura", "Adicionar interatividade", "Conectar servidores"]', 
     2, 'JavaScript adiciona interatividade e comportamento dinâmico às páginas web.', 20, 3, 1),
    
    (lesson_id, trail_id, 'DOM Manipulation', 'O que é DOM?', 
     '["Data Object Model", "Document Object Model", "Dynamic Object Model", "Database Object Model"]', 
     1, 'DOM (Document Object Model) representa a estrutura da página que pode ser manipulada com JavaScript.', 20, 3, 2);
END $$;

-- =====================================================
-- QUIZZES - TRILHA 3: BANCO DE DADOS
-- =====================================================

DO $$
DECLARE
    trail_id UUID;
    lesson_id UUID;
BEGIN
    SELECT id INTO trail_id FROM trails WHERE title = 'Banco de Dados';
    
    -- QUIZZES PARA LIÇÃO 1: Introdução a Bancos de Dados
    SELECT id INTO lesson_id FROM lessons WHERE trail_id = trail_id AND title = 'Introdução a Bancos de Dados';
    
    INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index)
    VALUES 
    (lesson_id, trail_id, 'Conceito BD', 'O que é um banco de dados?', 
     '["Um programa", "Sistema organizado para armazenar dados", "Uma linguagem", "Um servidor"]', 
     1, 'Banco de dados é um sistema organizado para armazenar, gerenciar e recuperar informações.', 15, 2, 1),
    
    (lesson_id, trail_id, 'Tabelas', 'Como os dados são organizados em bancos relacionais?', 
     '["Em arquivos", "Em tabelas", "Em pastas", "Em documentos"]', 
     1, 'Em bancos relacionais, os dados são organizados em tabelas com linhas e colunas.', 15, 2, 2);
    
    -- QUIZZES PARA LIÇÃO 2: SQL Básico
    SELECT id INTO lesson_id FROM lessons WHERE trail_id = trail_id AND title = 'SQL Básico';
    
    INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index)
    VALUES 
    (lesson_id, trail_id, 'SQL SELECT', 'Qual comando SQL é usado para consultar dados?', 
     '["GET", "SELECT", "FIND", "SEARCH"]', 
     1, 'SELECT é o comando SQL usado para consultar e recuperar dados de tabelas.', 20, 3, 1),
    
    (lesson_id, trail_id, 'SQL INSERT', 'Qual comando adiciona novos dados?', 
     '["ADD", "INSERT", "CREATE", "NEW"]', 
     1, 'INSERT é usado para adicionar novos registros em uma tabela.', 20, 3, 2);
    
    -- QUIZZES PARA LIÇÃO 3: Relacionamentos e JOINs
    SELECT id INTO lesson_id FROM lessons WHERE trail_id = trail_id AND title = 'Relacionamentos e JOINs';
    
    INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index)
    VALUES 
    (lesson_id, trail_id, 'JOIN Conceito', 'Para que serve o JOIN?', 
     '["Deletar dados", "Conectar tabelas", "Criar tabelas", "Modificar estrutura"]', 
     1, 'JOIN é usado para conectar e consultar dados de múltiplas tabelas relacionadas.', 25, 4, 1);
END $$;

-- =====================================================
-- QUIZZES - TRILHA 4: DESENVOLVIMENTO MOBILE
-- =====================================================

DO $$
DECLARE
    trail_id UUID;
    lesson_id UUID;
BEGIN
    SELECT id INTO trail_id FROM trails WHERE title = 'Desenvolvimento Mobile';
    
    -- QUIZZES PARA LIÇÃO 1: Introdução ao React Native
    SELECT id INTO lesson_id FROM lessons WHERE trail_id = trail_id AND title = 'Introdução ao React Native';
    
    INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index)
    VALUES 
    (lesson_id, trail_id, 'React Native', 'O que é React Native?', 
     '["Uma linguagem", "Framework para apps móveis", "Um banco de dados", "Um servidor"]', 
     1, 'React Native é um framework que permite criar aplicativos móveis nativos usando JavaScript.', 20, 3, 1),
    
    (lesson_id, trail_id, 'Vantagens RN', 'Qual a principal vantagem do React Native?', 
     '["É gratuito", "Código compartilhado iOS/Android", "É rápido", "É fácil"]', 
     1, 'React Native permite escrever código uma vez e executar em iOS e Android.', 20, 3, 2);
    
    -- QUIZZES PARA LIÇÃO 2: Componentes e Navegação
    SELECT id INTO lesson_id FROM lessons WHERE trail_id = trail_id AND title = 'Componentes e Navegação';
    
    INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index)
    VALUES 
    (lesson_id, trail_id, 'Componentes', 'O que são componentes no React Native?', 
     '["Arquivos", "Blocos reutilizáveis de UI", "Funções", "Variáveis"]', 
     1, 'Componentes são blocos reutilizáveis que definem partes da interface do usuário.', 25, 4, 1);
END $$;

-- =====================================================
-- QUIZZES - TRILHA 5: DEVOPS E CLOUD
-- =====================================================

DO $$
DECLARE
    trail_id UUID;
    lesson_id UUID;
BEGIN
    SELECT id INTO trail_id FROM trails WHERE title = 'DevOps e Cloud';
    
    -- QUIZZES PARA LIÇÃO 1: Introdução ao DevOps
    SELECT id INTO lesson_id FROM lessons WHERE trail_id = trail_id AND title = 'Introdução ao DevOps';
    
    INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index)
    VALUES 
    (lesson_id, trail_id, 'DevOps Conceito', 'O que é DevOps?', 
     '["Uma linguagem", "Cultura de colaboração Dev+Ops", "Um software", "Um servidor"]', 
     1, 'DevOps é uma cultura que une desenvolvimento e operações para entregar software mais rapidamente.', 25, 4, 1);
    
    -- QUIZZES PARA LIÇÃO 2: Git e Controle de Versão
    SELECT id INTO lesson_id FROM lessons WHERE trail_id = trail_id AND title = 'Git e Controle de Versão';
    
    INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index)
    VALUES 
    (lesson_id, trail_id, 'Git Função', 'Para que serve o Git?', 
     '["Editar código", "Controlar versões", "Executar código", "Testar código"]', 
     1, 'Git é um sistema de controle de versão que rastreia mudanças no código ao longo do tempo.', 25, 4, 1);
    
    -- QUIZZES PARA LIÇÃO 3: Deploy e CI/CD
    SELECT id INTO lesson_id FROM lessons WHERE trail_id = trail_id AND title = 'Deploy e CI/CD';
    
    INSERT INTO quizzes (lesson_id, trail_id, title, question, options, correct_answer, explanation, xp_reward, difficulty_level, order_index)
    VALUES 
    (lesson_id, trail_id, 'CI/CD Conceito', 'O que significa CI/CD?', 
     '["Code Integration/Code Deployment", "Continuous Integration/Continuous Deployment", "Computer Integration/Computer Deployment", "Code Inspection/Code Distribution"]', 
     1, 'CI/CD significa Integração Contínua e Deploy Contínuo, práticas para automatizar entrega de software.', 30, 5, 1);
END $$;

-- Verificar criação dos quizzes
SELECT 'Quizzes criados com sucesso!' as status;
SELECT COUNT(*) as total_quizzes FROM quizzes WHERE is_active = true;