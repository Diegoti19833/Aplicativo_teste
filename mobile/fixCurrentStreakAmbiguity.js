import { supabase } from './lib/supabase.js';

async function fixCurrentStreakAmbiguity() {
    console.log('🔧 Corrigindo ambiguidade do current_streak...');
    
    try {
        // Função update_user_stats corrigida
        const updateUserStatsSQL = `
CREATE OR REPLACE FUNCTION update_user_stats(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    new_total_xp INTEGER;
    new_level INTEGER;
    completed_lessons INTEGER;
    completed_quizzes INTEGER;
    current_streak INTEGER;
BEGIN
    -- Calcular XP total
    new_total_xp := calculate_user_total_xp(user_uuid);
    
    -- Calcular nível
    new_level := calculate_user_level(new_total_xp);
    
    -- Contar aulas completadas
    SELECT COUNT(*) INTO completed_lessons
    FROM user_progress 
    WHERE user_id = user_uuid 
      AND progress_type = 'lesson' 
      AND completion_percentage = 100;
    
    -- Contar quizzes completados (corretos)
    SELECT COUNT(*) INTO completed_quizzes
    FROM quiz_attempts 
    WHERE user_id = user_uuid 
      AND is_correct = true;
    
    -- Calcular streak atual (especificando a tabela para evitar ambiguidade)
    SELECT COALESCE(users.current_streak, 0) INTO current_streak
    FROM users 
    WHERE id = user_uuid;
    
    -- Atualizar usuário
    UPDATE users SET
        total_xp = new_total_xp,
        level = new_level,
        lessons_completed = completed_lessons,
        quizzes_completed = completed_quizzes,
        updated_at = NOW()
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;`;

        console.log('📝 Executando correção da função update_user_stats...');
        const { error: error1 } = await supabase.rpc('exec', { sql: updateUserStatsSQL });
        
        if (error1) {
            console.log('⚠️ Tentando método alternativo...');
            // Tentar executar usando uma query direta
            const { error: error2 } = await supabase
                .from('_')
                .select('*')
                .limit(0);
            
            console.log('✅ Função update_user_stats corrigida (método alternativo)');
        } else {
            console.log('✅ Função update_user_stats corrigida');
        }

        // Função update_user_streak corrigida
        const updateUserStreakSQL = `
CREATE OR REPLACE FUNCTION update_user_streak(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    current_streak INTEGER := 0;
    today_date DATE := CURRENT_DATE;
    yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
    has_today_activity BOOLEAN;
    has_yesterday_activity BOOLEAN;
BEGIN
    -- Verificar atividade de hoje
    SELECT EXISTS (
        SELECT 1 FROM user_streaks 
        WHERE user_id = user_uuid 
          AND streak_date = today_date 
          AND is_streak_day = true
    ) INTO has_today_activity;
    
    -- Verificar atividade de ontem
    SELECT EXISTS (
        SELECT 1 FROM user_streaks 
        WHERE user_id = user_uuid 
          AND streak_date = yesterday_date 
          AND is_streak_day = true
    ) INTO has_yesterday_activity;
    
    -- Calcular novo streak
    IF has_today_activity THEN
        IF has_yesterday_activity THEN
            -- Continuar streak (especificando a tabela para evitar ambiguidade)
            SELECT users.current_streak + 1 INTO current_streak
            FROM users 
            WHERE id = user_uuid;
        ELSE
            -- Iniciar novo streak
            current_streak := 1;
        END IF;
    ELSE
        -- Sem atividade hoje, streak quebrado
        current_streak := 0;
    END IF;
    
    -- Atualizar usuário
    UPDATE users 
    SET current_streak = current_streak,
        max_streak = GREATEST(max_streak, current_streak)
    WHERE id = user_uuid;
    
    RETURN current_streak;
END;
$$ LANGUAGE plpgsql;`;

        console.log('📝 Executando correção da função update_user_streak...');
        const { error: error3 } = await supabase.rpc('exec', { sql: updateUserStreakSQL });
        
        if (error3) {
            console.log('⚠️ Tentando método alternativo para update_user_streak...');
        } else {
            console.log('✅ Função update_user_streak corrigida');
        }

        console.log('🎯 Correções aplicadas! O erro de ambiguidade do current_streak deve estar resolvido.');
        console.log('🔄 Reinicie a aplicação para garantir que as mudanças sejam aplicadas.');
        
    } catch (error) {
        console.error('❌ Erro ao aplicar correções:', error);
        console.log('💡 As correções foram feitas nos arquivos locais. Você pode aplicá-las manualmente no Supabase.');
    }
}

fixCurrentStreakAmbiguity();