-- ============================================================================
-- SCRIPT: Resetar Progresso de uma Trilha Específica (Gestão de Equipe)
-- Para testar a emissão do certificado novamente
-- ============================================================================

-- INSTRUÇÕES:
-- 1. Substitua o e-mail 'SEU_EMAIL_DE_TESTE_AQUI' abaixo pelo seu e-mail de login no app.
-- 2. Execute tudo no SQL Editor do Supabase.

DO $$ 
DECLARE
    v_user_id UUID;
    v_trail_id UUID;
BEGIN
    -- Obter ID do usuário (COLOQUE SEU EMAIL AQUI)
    SELECT id INTO v_user_id FROM users WHERE email = 'SEU_EMAIL_DE_TESTE_AQUI' LIMIT 1;
    
    -- Obter ID da trilha
    SELECT id INTO v_trail_id FROM trails 
    WHERE title ILIKE '%Gestão de Equipe%' OR title = 'Gestão de Equipe' LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'Usuário não encontrado.';
        RETURN;
    END IF;

    IF v_trail_id IS NULL THEN
        RAISE NOTICE 'Trilha não encontrada.';
        RETURN;
    END IF;

    -- 1. Deletar o certificado dessa trilha para o usuário
    DELETE FROM certificates 
    WHERE user_id = v_user_id AND trail_id = v_trail_id;

    -- 2. Deletar o progresso das aulas dessa trilha
    DELETE FROM user_progress
    WHERE user_id = v_user_id AND trail_id = v_trail_id;

    -- 3. Deletar tentativas de quiz das aulas dessa trilha
    DELETE FROM quiz_attempts
    WHERE user_id = v_user_id AND quiz_id IN (
        SELECT q.id FROM quizzes q
        JOIN lessons l ON l.id = q.lesson_id
        WHERE l.trail_id = v_trail_id
    );

    RAISE NOTICE 'Progresso da trilha Gestão de Equipe resetado com sucesso para o usuário!';

END $$;
