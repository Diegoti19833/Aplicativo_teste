const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ixqfqjqjqjqjqjqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWZxanFqcWpxanFqcWoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNTU3NzE5NSwiZXhwIjoyMDUxMTUzMTk1fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAnswerQuizFunction() {
  const functionSQL = `
-- Função para responder quiz usando a estrutura antiga (options como JSONB)
CREATE OR REPLACE FUNCTION answer_quiz(
    user_id_param UUID,
    quiz_id_param UUID,
    selected_option_param INTEGER
)
RETURNS JSON AS $$
DECLARE
    quiz_data RECORD;
    is_correct BOOLEAN := false;
    xp_earned INTEGER := 0;
    attempt_count INTEGER;
    result JSON;
BEGIN
    -- Buscar dados do quiz
    SELECT * INTO quiz_data FROM quizzes WHERE id = quiz_id_param;
    
    IF quiz_data IS NULL THEN
        RETURN json_build_object('error', 'Quiz não encontrado');
    END IF;
    
    -- Verificar se a resposta está correta
    is_correct := (selected_option_param = quiz_data.correct_answer);
    
    -- Contar tentativas anteriores para este quiz
    SELECT COUNT(*) INTO attempt_count
    FROM quiz_attempts 
    WHERE user_id = user_id_param AND quiz_id = quiz_id_param;
    
    -- Calcular XP baseado na tentativa
    IF is_correct THEN
        CASE attempt_count
            WHEN 0 THEN xp_earned := quiz_data.xp_reward; -- Primeira tentativa: XP completo
            WHEN 1 THEN xp_earned := ROUND(quiz_data.xp_reward * 0.7); -- Segunda tentativa: 70%
            WHEN 2 THEN xp_earned := ROUND(quiz_data.xp_reward * 0.5); -- Terceira tentativa: 50%
            ELSE xp_earned := ROUND(quiz_data.xp_reward * 0.3); -- Demais tentativas: 30%
        END CASE;
    ELSE
        xp_earned := 0; -- Resposta incorreta não ganha XP
    END IF;
    
    -- Registrar tentativa na tabela quiz_attempts
    -- Como não temos quiz_options, vamos usar NULL para selected_option_id
    INSERT INTO quiz_attempts (
        user_id, 
        quiz_id, 
        selected_option_id, 
        is_correct, 
        xp_earned, 
        attempt_number,
        created_at
    ) VALUES (
        user_id_param, 
        quiz_id_param, 
        NULL, -- selected_option_id é NULL pois estamos usando a estrutura antiga
        is_correct, 
        xp_earned, 
        attempt_count + 1,
        NOW()
    );
    
    -- Atualizar XP do usuário se ganhou pontos
    IF xp_earned > 0 THEN
        UPDATE user_profiles 
        SET total_xp = total_xp + xp_earned,
            updated_at = NOW()
        WHERE user_id = user_id_param;
    END IF;
    
    -- Retornar resultado
    result := json_build_object(
        'is_correct', is_correct,
        'xp_earned', xp_earned,
        'attempt_number', attempt_count + 1,
        'selected_option', selected_option_param,
        'correct_answer', quiz_data.correct_answer
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  try {
    const { data, error } = await supabase.rpc('exec', { sql: functionSQL });
    
    if (error) {
      console.error('Erro ao criar função:', error);
    } else {
      console.log('Função answer_quiz criada com sucesso!');
    }
  } catch (err) {
    console.error('Erro:', err);
  }
}

createAnswerQuizFunction();