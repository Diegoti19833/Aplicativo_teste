-- ============================================================================
-- ARQUIVO: 25_analytics.sql
-- DESCRIÇÃO: Funções para o painel de Analytics dos gestores
-- ============================================================================

-- Função principal para retornar todos os dados do dashboard de analytics de uma vez,
-- otimizando as chamadas para o frontend.
CREATE OR REPLACE FUNCTION get_manager_analytics(
  p_manager_id UUID,
  p_days INTEGER DEFAULT 30,
  p_role_filter VARCHAR DEFAULT NULL,
  p_trail_filter UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_manager RECORD;
  v_franchise_id UUID;
  v_start_date TIMESTAMPTZ;
  
  -- Retornos
  v_overview JSON;
  v_users_at_risk JSON;
  v_top_performers JSON;
  v_difficult_lessons JSON;
  v_role_distribution JSON;
  v_daily_activity JSON;
BEGIN
  -- 1. Verificar permissões e contexto do gerente
  SELECT * INTO v_manager FROM users WHERE id = p_manager_id;
  IF NOT FOUND OR v_manager.role NOT IN ('admin', 'gerente') THEN
    RETURN json_build_object('success', false, 'error', 'Permissão negada ou usuário não encontrado.');
  END IF;

  -- Gerentes só veem sua franquia; Admins veem tudo
  IF v_manager.role = 'gerente' THEN
    v_franchise_id := v_manager.franchise_unit_id;
  ELSE
    v_franchise_id := NULL; -- Admin vê todos por padrão na query
  END IF;

  v_start_date := NOW() - (p_days || ' days')::INTERVAL;

  -- 2. Overview Metrics (Total de usuários, ativos, XP total, aulas)
  SELECT json_build_object(
    'total_users', COUNT(*),
    'active_users', COUNT(*) FILTER (WHERE is_active = true),
    'total_xp', COALESCE(SUM(total_xp), 0),
    'lessons_completed', COALESCE(SUM(lessons_completed), 0),
    'quizzes_completed', COALESCE(SUM(quizzes_completed), 0),
    'avg_streak', ROUND(AVG(current_streak)::numeric, 1)
  ) INTO v_overview
  FROM users u
  WHERE (v_franchise_id IS NULL OR u.franchise_unit_id = v_franchise_id)
    AND (p_role_filter IS NULL OR u.role = p_role_filter);

  -- 3. Distribuição por Role (Gráfico de Pizza)
  SELECT json_agg(row_to_json(t)) INTO v_role_distribution
  FROM (
    SELECT role as name, COUNT(*) as value
    FROM users u
    WHERE is_active = true
      AND (v_franchise_id IS NULL OR u.franchise_unit_id = v_franchise_id)
      AND (p_role_filter IS NULL OR u.role = p_role_filter)
    GROUP BY role
  ) t;

  -- 4. Top Performers (Tabela)
  SELECT json_agg(row_to_json(t)) INTO v_top_performers
  FROM (
    SELECT id, name, email, role, total_xp, level, current_streak, avatar_url
    FROM users u
    WHERE is_active = true
      AND (v_franchise_id IS NULL OR u.franchise_unit_id = v_franchise_id)
      AND (p_role_filter IS NULL OR u.role = p_role_filter)
    ORDER BY total_xp DESC
    LIMIT 10
  ) t;

  -- 5. Usuários em Risco (Inativos há mais de 7 dias ou streak = 0)
  SELECT json_agg(row_to_json(t)) INTO v_users_at_risk
  FROM (
    SELECT id, name, role, last_activity_at, current_streak,
           EXTRACT(DAY FROM (NOW() - last_activity_at)) as days_inactive
    FROM users u
    WHERE is_active = true
      AND (v_franchise_id IS NULL OR u.franchise_unit_id = v_franchise_id)
      AND (p_role_filter IS NULL OR u.role = p_role_filter)
      AND (last_activity_at < NOW() - INTERVAL '7 days' OR current_streak = 0)
    ORDER BY last_activity_at ASC NULLS FIRST
    LIMIT 10
  ) t;

  -- 6. Aulas com maior dificuldade (Menor taxa de acerto nos quizzes)
  SELECT json_agg(row_to_json(t)) INTO v_difficult_lessons
  FROM (
    SELECT 
      l.id, 
      l.title as lesson_title,
      tr.title as trail_title,
      COUNT(qa.id) as total_attempts,
      COUNT(qa.id) FILTER (WHERE qa.is_correct = true) as correct_attempts,
      ROUND((COUNT(qa.id) FILTER (WHERE qa.is_correct = true)::numeric / GREATEST(COUNT(qa.id), 1)) * 100, 1) as success_rate
    FROM lessons l
    JOIN trails tr ON tr.id = l.trail_id
    JOIN quizzes q ON q.lesson_id = l.id
    JOIN quiz_attempts qa ON qa.quiz_id = q.id
    JOIN users u ON u.id = qa.user_id
    WHERE qa.created_at >= v_start_date
      AND (v_franchise_id IS NULL OR u.franchise_unit_id = v_franchise_id)
      AND (p_trail_filter IS NULL OR l.trail_id = p_trail_filter)
    GROUP BY l.id, l.title, tr.title
    HAVING COUNT(qa.id) > 5 -- Pelo menos 5 tentativas para ter relevância estatística
    ORDER BY success_rate ASC
    LIMIT 5
  ) t;

  -- 7. Atividade Diária (Gráfico de Barras/Linha - XP e Aulas por dia)
  SELECT json_agg(row_to_json(t)) INTO v_daily_activity
  FROM (
    SELECT 
      TO_CHAR(us.streak_date, 'DD/MM') as "date",
      us.streak_date as full_date,
      SUM(us.total_xp_earned) as total_xp,
      SUM(us.lessons_completed) as lessons
    FROM user_streaks us
    JOIN users u ON u.id = us.user_id
    WHERE us.streak_date >= (CURRENT_DATE - p_days)
      AND (v_franchise_id IS NULL OR u.franchise_unit_id = v_franchise_id)
      AND (p_role_filter IS NULL OR u.role = p_role_filter)
    GROUP BY us.streak_date
    ORDER BY us.streak_date ASC
  ) t;

  -- Retornar todos os dados combinados
  RETURN json_build_object(
    'success', true,
    'overview', v_overview,
    'role_distribution', COALESCE(v_role_distribution, '[]'::json),
    'top_performers', COALESCE(v_top_performers, '[]'::json),
    'users_at_risk', COALESCE(v_users_at_risk, '[]'::json),
    'difficult_lessons', COALESCE(v_difficult_lessons, '[]'::json),
    'daily_activity', COALESCE(v_daily_activity, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
