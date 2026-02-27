-- ============================================================================
-- FIX: record_daily_activity function
-- Corrige o erro: window functions are not allowed in WHERE
-- ============================================================================

CREATE OR REPLACE FUNCTION record_daily_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_xp_earned INTEGER DEFAULT 0,
  p_study_time INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_streaks (user_id, streak_date, activities_completed, lessons_completed, quizzes_completed, total_xp_earned, study_time_minutes)
  VALUES (p_user_id, CURRENT_DATE, 1,
    CASE WHEN p_activity_type = 'lesson' THEN 1 ELSE 0 END,
    CASE WHEN p_activity_type = 'quiz' THEN 1 ELSE 0 END,
    p_xp_earned, p_study_time)
  ON CONFLICT (user_id, streak_date)
  DO UPDATE SET
    activities_completed = user_streaks.activities_completed + 1,
    lessons_completed = user_streaks.lessons_completed + CASE WHEN p_activity_type = 'lesson' THEN 1 ELSE 0 END,
    quizzes_completed = user_streaks.quizzes_completed + CASE WHEN p_activity_type = 'quiz' THEN 1 ELSE 0 END,
    total_xp_earned = user_streaks.total_xp_earned + p_xp_earned,
    study_time_minutes = user_streaks.study_time_minutes + p_study_time;

  -- Atualizar is_streak_day
  UPDATE user_streaks
  SET is_streak_day = (lessons_completed >= 1 OR quizzes_completed >= 3)
  WHERE user_id = p_user_id AND streak_date = CURRENT_DATE;

  -- A trigger em user_streaks ('update_user_current_streak_trigger') já atualiza o current_streak em 'users'.
  -- Nós só precisamos garantir que o max_streak seja atualizado baseado no novo current_streak.
  UPDATE users 
  SET max_streak = GREATEST(COALESCE(max_streak, 0), COALESCE(current_streak, 0))
  WHERE id = p_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
