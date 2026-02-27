-- ============================================================================
-- FIX: complete_lesson function 
-- Corrige o erro: record "v_lesson" has no field "coin_reward"
-- Substituindo a função no Supabase pela versão correta sem o campo inexistente
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_lesson(
  p_user_id UUID,
  p_lesson_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_lesson RECORD;
  v_existing RECORD;
  v_xp INTEGER;
  v_result JSON;
BEGIN
  -- Verificar se a aula existe
  SELECT * INTO v_lesson FROM lessons WHERE id = p_lesson_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Aula não encontrada');
  END IF;

  -- Verificar se já foi completada
  SELECT * INTO v_existing FROM user_progress
  WHERE user_id = p_user_id AND lesson_id = p_lesson_id
    AND progress_type = 'lesson_completed';

  IF FOUND AND v_existing.is_completed THEN
    RETURN json_build_object('success', true, 'message', 'Aula já completada', 'xp_earned', 0);
  END IF;

  v_xp := COALESCE(v_lesson.xp_reward, 20);

  -- Inserir ou atualizar progresso
  INSERT INTO user_progress (user_id, trail_id, lesson_id, progress_type, xp_earned, is_completed, completed_at, completion_percentage)
  VALUES (p_user_id, v_lesson.trail_id, p_lesson_id, 'lesson_completed', v_xp, true, NOW(), 100)
  ON CONFLICT (user_id, lesson_id, progress_type)
  DO UPDATE SET is_completed = true, completed_at = NOW(), xp_earned = v_xp, completion_percentage = 100;

  -- Atualizar stats do usuário
  PERFORM update_user_stats(p_user_id);

  -- Registrar atividade no streak
  PERFORM record_daily_activity(p_user_id, 'lesson', v_xp, COALESCE(v_lesson.duration, 10));

  RETURN json_build_object(
    'success', true,
    'xp_earned', v_xp,
    'lesson_title', v_lesson.title
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
