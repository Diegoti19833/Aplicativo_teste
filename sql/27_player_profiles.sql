-- ==============================================================================
-- POP DOG GAMIFICATION - PLAYER PROFILES & ONBOARDING QUIZ
-- ==============================================================================
-- This script creates the core structure for the "Perfil de Jogador" feature,
-- which includes archetypes, quiz questions, options, and user profiles.
-- ==============================================================================

-- 1. Tabela de Arquétipos
CREATE TABLE IF NOT EXISTS public.player_archetypes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    traits JSONB DEFAULT '[]'::jsonb
);

-- 2. Tabela de Perguntas do Quiz
CREATE TABLE IF NOT EXISTS public.player_profile_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_num INTEGER NOT NULL,
    text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Tabela de Opções de Resposta
CREATE TABLE IF NOT EXISTS public.player_profile_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES public.player_profile_questions(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    archetype_id TEXT REFERENCES public.player_archetypes(id),
    order_num INTEGER NOT NULL
);

-- 4. Tabela de Perfil do Usuário
CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    archetype_id TEXT REFERENCES public.player_archetypes(id),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- SEED DATA (Arquétipos e Perguntas)
-- ==============================================================================

-- Limpar dados existentes para re-inserção segura (em ambiente dev/teste)
TRUNCATE TABLE public.player_profile_options CASCADE;
TRUNCATE TABLE public.player_profile_questions CASCADE;
TRUNCATE TABLE public.player_archetypes CASCADE;

-- Inserir Arquétipos
INSERT INTO public.player_archetypes (id, name, description, icon, traits) VALUES
('especialista', 'O Especialista', 'Focado em conhecimento técnico, produtos e saúde pet. Você é a referência quando surge uma dúvida complexa.', 'microscope', '["Analítico", "Estudioso", "Detalhista"]'),
('encantador', 'O Encantador', 'Focado em atendimento, carisma e relacionamento. Você tem o dom de fazer clientes e pets se sentirem em casa.', 'heart', '["Empático", "Comunicativo", "Acolhedor"]'),
('estrategista', 'O Estrategista', 'Focado em vendas, metas e organização. Você vê o quadro geral e sabe exatamente como impulsionar os resultados.', 'target', '["Focado", "Ambicioso", "Planejador"]'),
('agil', 'O Ágil', 'Focado em operação, rapidez e resolução de problemas. Você é quem faz a loja girar e nunca deixa a peteca cair.', 'zap', '["Dinâmico", "Proativo", "Eficiente"]');

-- Inserir Perguntas e Opções
DO $$
DECLARE
    q1_id UUID := uuid_generate_v4();
    q2_id UUID := uuid_generate_v4();
    q3_id UUID := uuid_generate_v4();
    q4_id UUID := uuid_generate_v4();
    q5_id UUID := uuid_generate_v4();
    q6_id UUID := uuid_generate_v4();
    q7_id UUID := uuid_generate_v4();
    q8_id UUID := uuid_generate_v4();
BEGIN
    -- Pergunta 1
    INSERT INTO public.player_profile_questions (id, order_num, text) VALUES (q1_id, 1, 'Um cliente entra na loja com um filhote agitado pedindo indicação de ração. Qual sua primeira reação?');
    INSERT INTO public.player_profile_options (question_id, order_num, text, archetype_id) VALUES
    (q1_id, 1, 'Pergunto sobre a raça, idade e necessidades nutricionais específicas.', 'especialista'),
    (q1_id, 2, 'Faço carinho no filhote, deixo ele brincar e converso animadamente com o dono.', 'encantador'),
    (q1_id, 3, 'Apresento as opções premium que estão em promoção e o programa de fidelidade.', 'estrategista'),
    (q1_id, 4, 'Pego rapidamente as 3 melhores opções da prateleira para não fazer o cliente esperar.', 'agil');

    -- Pergunta 2
    INSERT INTO public.player_profile_questions (id, order_num, text) VALUES (q2_id, 2, 'A loja está extremamente lotada num sábado de manhã. Onde você se destaca?');
    INSERT INTO public.player_profile_options (question_id, order_num, text, archetype_id) VALUES
    (q2_id, 1, 'Garantindo que a reposição nas gôndolas aconteça na velocidade da luz.', 'agil'),
    (q2_id, 2, 'Aproveitando o fluxo para bater a meta de upsell do dia no PDV.', 'estrategista'),
    (q2_id, 3, 'Tirando dúvidas complexas de clientes que estão indecisos na seção de farmácia.', 'especialista'),
    (q2_id, 4, 'Mantendo o clima leve, sorrindo e organizando a fila de forma amigável.', 'encantador');

    -- Pergunta 3
    INSERT INTO public.player_profile_questions (id, order_num, text) VALUES (q3_id, 3, 'Ao usar o aplicativo Pop Dog, o que você mais gosta?');
    INSERT INTO public.player_profile_options (question_id, order_num, text, archetype_id) VALUES
    (q3_id, 1, 'Fazer os quizzes difíceis e aprender curiosidades sobre saúde animal.', 'especialista'),
    (q3_id, 2, 'Acompanhar o ranking e ver como posso subir de nível mais rápido.', 'estrategista'),
    (q3_id, 3, 'Ganhar os certificados e compartilhar as conquistas com meus colegas.', 'encantador'),
    (q3_id, 4, 'Acessar rápido para fazer missões curtas entre um atendimento e outro.', 'agil');

    -- Pergunta 4
    INSERT INTO public.player_profile_questions (id, order_num, text) VALUES (q4_id, 4, 'Qual a sua abordagem ao vender um brinquedo novo para cachorro?');
    INSERT INTO public.player_profile_options (question_id, order_num, text, archetype_id) VALUES
    (q4_id, 1, 'Mostro como aquele brinquedo ajuda no desenvolvimento cognitivo do pet.', 'especialista'),
    (q4_id, 2, 'Imito os sons do brinquedo e mostro o quanto o dog vai se divertir.', 'encantador'),
    (q4_id, 3, 'Ofereço um combo: se levar o brinquedo, o petisco sai com desconto.', 'estrategista'),
    (q4_id, 4, 'Saco rápido as novidades e já deixo pronto no balcão caso ele decida.', 'agil');

    -- Pergunta 5
    INSERT INTO public.player_profile_questions (id, order_num, text) VALUES (q5_id, 5, 'Um produto derramou no meio do corredor. Como você reage?');
    INSERT INTO public.player_profile_options (question_id, order_num, text, archetype_id) VALUES
    (q5_id, 1, 'Corro buscar o material de limpeza antes que alguém escorregue e já resolvo.', 'agil'),
    (q5_id, 2, 'Aviso a liderança e já planejo como repor o estoque daquele item.', 'estrategista'),
    (q5_id, 3, 'Avalio a embalagem para entender se houve defeito de lote ou desgaste.', 'especialista'),
    (q5_id, 4, 'Isolo a área com delicadeza e peço desculpas aos clientes que passam.', 'encantador');

    -- Pergunta 6
    INSERT INTO public.player_profile_questions (id, order_num, text) VALUES (q6_id, 6, 'Qual é o melhor elogio que você pode receber de um gestor?');
    INSERT INTO public.player_profile_options (question_id, order_num, text, archetype_id) VALUES
    (q6_id, 1, '"Você sabe absolutamente tudo sobre as nossas linhas de produto!"', 'especialista'),
    (q6_id, 2, '"Os clientes sempre perguntam de você quando vêm aqui!"', 'encantador'),
    (q6_id, 3, '"Você teve os melhores indicadores de conversão deste mês!"', 'estrategista'),
    (q6_id, 4, '"Com você na equipe, as coisas fluem muito mais rápido!"', 'agil');

    -- Pergunta 7
    INSERT INTO public.player_profile_questions (id, order_num, text) VALUES (q7_id, 7, 'Um tutor reclama que o cachorro não sentou com o petisco que comprou. Você:');
    INSERT INTO public.player_profile_options (question_id, order_num, text, archetype_id) VALUES
    (q7_id, 1, 'Troca o petisco rapidamente por outra marca para resolver logo o problema.', 'agil'),
    (q7_id, 2, 'Ouve com empatia, acalma o tutor e conta uma história de como adestramento demora.', 'encantador'),
    (q7_id, 3, 'Explica detalhadamente como o reforço positivo funciona e porque requer consistência.', 'especialista'),
    (q7_id, 4, 'Oferece um curso online de adestramento ou um livro do setor como complemento.', 'estrategista');

    -- Pergunta 8
    INSERT INTO public.player_profile_questions (id, order_num, text) VALUES (q8_id, 8, 'Como você se sente sobre os treinamentos da Pop Dog?');
    INSERT INTO public.player_profile_options (question_id, order_num, text, archetype_id) VALUES
    (q8_id, 1, 'Adoro! Sempre faço as trilhas e leio todos os textos adicionais.', 'especialista'),
    (q8_id, 2, 'Acho ótimo para bater minhas metas e entender as métricas da loja.', 'estrategista'),
    (q8_id, 3, 'Gosto muito de poder ajudar melhor os clientes depois que faço uma aula.', 'encantador'),
    (q8_id, 4, 'Prefiro os vídeos curtos para aprender rápido e voltar ao trabalho.', 'agil');
END $$;


-- ==============================================================================
-- FUNÇÕES RPC
-- ==============================================================================

-- 1. Submeter quiz e calcular arquétipo
-- p_answers: um JSON Array de option_ids
CREATE OR REPLACE FUNCTION public.submit_player_profile_quiz(
    p_user_id UUID,
    p_answers JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_archetype_id TEXT;
    v_archetype_record RECORD;
BEGIN
    -- Seleciona o arquétipo mais frequente nas respostas passadas
    SELECT archetype_id INTO v_archetype_id
    FROM public.player_profile_options
    WHERE id IN (SELECT jsonb_array_elements_text(p_answers)::uuid)
    GROUP BY archetype_id
    ORDER BY COUNT(*) DESC, RANDOM() -- Random desempata caso haja empate
    LIMIT 1;

    -- Se não conseguiu calcular por algum motivo (array vazio), fallback para encantador
    IF v_archetype_id IS NULL THEN
        v_archetype_id := 'encantador';
    END IF;

    -- Upsert no user_profiles
    INSERT INTO public.user_profiles (user_id, archetype_id, completed_at, updated_at)
    VALUES (p_user_id, v_archetype_id, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE 
    SET archetype_id = EXCLUDED.archetype_id,
        updated_at = NOW();

    -- Buscar dados do arquétipo para retornar
    SELECT id, name, description, icon, traits INTO v_archetype_record
    FROM public.player_archetypes
    WHERE id = v_archetype_id;

    RETURN jsonb_build_object(
        'success', true,
        'archetype_id', v_archetype_record.id,
        'name', v_archetype_record.name,
        'description', v_archetype_record.description,
        'icon', v_archetype_record.icon,
        'traits', v_archetype_record.traits
    );
END;
$$;


-- 2. Buscar perguntas do quiz formatadas
CREATE OR REPLACE FUNCTION public.get_player_quiz_questions()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', q.id,
            'text', q.text,
            'order', q.order_num,
            'options', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', o.id,
                        'text', o.text
                    ) ORDER BY RANDOM() -- Embaralhar opções
                )
                FROM public.player_profile_options o
                WHERE o.question_id = q.id
            )
        ) ORDER BY q.order_num
    ) INTO v_result
    FROM public.player_profile_questions q
    WHERE q.is_active = true;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 3. Obter perfil de um usuário
CREATE OR REPLACE FUNCTION public.get_user_player_profile(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile RECORD;
BEGIN
    SELECT 
        up.completed_at,
        pa.id,
        pa.name,
        pa.description,
        pa.icon,
        pa.traits
    INTO v_profile
    FROM public.user_profiles up
    JOIN public.player_archetypes pa ON up.archetype_id = pa.id
    WHERE up.user_id = p_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('has_profile', false);
    END IF;

    RETURN jsonb_build_object(
        'has_profile', true,
        'completed_at', v_profile.completed_at,
        'archetype', jsonb_build_object(
            'id', v_profile.id,
            'name', v_profile.name,
            'description', v_profile.description,
            'icon', v_profile.icon,
            'traits', v_profile.traits
        )
    );
END;
$$;


-- ==============================================================================
-- RLS (Row Level Security)
-- ==============================================================================

ALTER TABLE public.player_archetypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_profile_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_profile_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Archetypes, Questions, Options - Leitura para todos os autenticados
CREATE POLICY "Leitura de arquétipos para usuários" ON public.player_archetypes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Leitura de perguntas para usuários" ON public.player_profile_questions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Leitura de opções para usuários" ON public.player_profile_options FOR SELECT USING (auth.role() = 'authenticated');

-- User Profiles
CREATE POLICY "Admin pode ler tudo user profiles" ON public.user_profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('admin', 'gerente'))
);
CREATE POLICY "Usuário pode ler próprio perfil" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
-- Insert via RPC bypassa RLS default se for security definer
