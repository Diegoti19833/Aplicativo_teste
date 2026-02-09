-- ============================================================================
-- POLÍTICAS RLS COMPLETAS - Pet Franchise Gamification App
-- ============================================================================
-- Execute APÓS o 99_unified_migration.sql
-- ============================================================================

-- ============================================================================
-- 0. FUNÇÕES AUXILIARES
-- ============================================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'gerente')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_owner(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() = check_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 1. users
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS users_insert_own ON users;
DROP POLICY IF EXISTS users_admin_select_all ON users;
DROP POLICY IF EXISTS users_admin_update_all ON users;
DROP POLICY IF EXISTS users_admin_insert_all ON users;

-- Usuário vê somente seus próprios dados
CREATE POLICY users_select_own ON users FOR SELECT
  USING (auth.uid() = id);

-- Usuário pode atualizar seus próprios dados
CREATE POLICY users_update_own ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Usuário pode criar sua própria entrada
CREATE POLICY users_insert_own ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admin/gerente pode ver todos
CREATE POLICY users_admin_select_all ON users FOR SELECT
  USING (is_admin());

-- Admin/gerente pode atualizar todos
CREATE POLICY users_admin_update_all ON users FOR UPDATE
  USING (is_admin());

-- Admin/gerente pode inserir (criar novos usuários)
CREATE POLICY users_admin_insert_all ON users FOR INSERT
  WITH CHECK (is_admin());

-- Admin pode deletar
CREATE POLICY users_admin_delete ON users FOR DELETE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================================
-- 2. app_settings
-- ============================================================================
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_settings_select_all ON app_settings;
DROP POLICY IF EXISTS app_settings_admin_all ON app_settings;

-- Todos autenticados podem ler configurações
CREATE POLICY app_settings_select_all ON app_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Apenas admin/gerente pode modificar
CREATE POLICY app_settings_admin_all ON app_settings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 3. trails
-- ============================================================================
ALTER TABLE trails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trails_select_active ON trails;
DROP POLICY IF EXISTS trails_admin_all ON trails;

-- Todos autenticados veem trilhas ativas
CREATE POLICY trails_select_active ON trails FOR SELECT
  USING (is_active = true OR is_admin());

-- Admin/gerente CRUD completo
CREATE POLICY trails_admin_all ON trails FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 4. lessons
-- ============================================================================
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lessons_select_active ON lessons;
DROP POLICY IF EXISTS lessons_admin_all ON lessons;

CREATE POLICY lessons_select_active ON lessons FOR SELECT
  USING (is_active = true OR is_admin());

CREATE POLICY lessons_admin_all ON lessons FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 5. quizzes
-- ============================================================================
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quizzes_select_active ON quizzes;
DROP POLICY IF EXISTS quizzes_admin_all ON quizzes;

CREATE POLICY quizzes_select_active ON quizzes FOR SELECT
  USING (is_active = true OR is_admin());

CREATE POLICY quizzes_admin_all ON quizzes FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 6. quiz_options
-- ============================================================================
ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quiz_options_select_all ON quiz_options;
DROP POLICY IF EXISTS quiz_options_admin_all ON quiz_options;

-- Todos autenticados podem ver opções de quizzes ativos
CREATE POLICY quiz_options_select_all ON quiz_options FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM quizzes q WHERE q.id = quiz_options.quiz_id AND (q.is_active = true OR is_admin()))
  );

CREATE POLICY quiz_options_admin_all ON quiz_options FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 7. user_progress
-- ============================================================================
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_progress_select_own ON user_progress;
DROP POLICY IF EXISTS user_progress_insert_own ON user_progress;
DROP POLICY IF EXISTS user_progress_update_own ON user_progress;
DROP POLICY IF EXISTS user_progress_admin_all ON user_progress;

CREATE POLICY user_progress_select_own ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY user_progress_insert_own ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_progress_update_own ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY user_progress_admin_all ON user_progress FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 8. quiz_attempts
-- ============================================================================
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quiz_attempts_select_own ON quiz_attempts;
DROP POLICY IF EXISTS quiz_attempts_insert_own ON quiz_attempts;
DROP POLICY IF EXISTS quiz_attempts_admin_all ON quiz_attempts;

CREATE POLICY quiz_attempts_select_own ON quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY quiz_attempts_insert_own ON quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY quiz_attempts_admin_all ON quiz_attempts FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 9. achievements
-- ============================================================================
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS achievements_select_active ON achievements;
DROP POLICY IF EXISTS achievements_admin_all ON achievements;

CREATE POLICY achievements_select_active ON achievements FOR SELECT
  USING (is_active = true OR is_admin());

CREATE POLICY achievements_admin_all ON achievements FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 10. user_achievements
-- ============================================================================
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_achievements_select_own ON user_achievements;
DROP POLICY IF EXISTS user_achievements_insert_own ON user_achievements;
DROP POLICY IF EXISTS user_achievements_admin_all ON user_achievements;

CREATE POLICY user_achievements_select_own ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY user_achievements_insert_own ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_achievements_admin_all ON user_achievements FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 11. store_items
-- ============================================================================
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_items_select_available ON store_items;
DROP POLICY IF EXISTS store_items_admin_all ON store_items;

CREATE POLICY store_items_select_available ON store_items FOR SELECT
  USING (is_available = true OR is_admin());

CREATE POLICY store_items_admin_all ON store_items FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 12. user_purchases
-- ============================================================================
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_purchases_select_own ON user_purchases;
DROP POLICY IF EXISTS user_purchases_insert_own ON user_purchases;
DROP POLICY IF EXISTS user_purchases_admin_all ON user_purchases;

CREATE POLICY user_purchases_select_own ON user_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY user_purchases_insert_own ON user_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_purchases_admin_all ON user_purchases FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 13. daily_missions
-- ============================================================================
ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS daily_missions_select_active ON daily_missions;
DROP POLICY IF EXISTS daily_missions_admin_all ON daily_missions;

CREATE POLICY daily_missions_select_active ON daily_missions FOR SELECT
  USING (is_active = true OR is_admin());

CREATE POLICY daily_missions_admin_all ON daily_missions FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 14. user_daily_missions
-- ============================================================================
ALTER TABLE user_daily_missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_daily_missions_select_own ON user_daily_missions;
DROP POLICY IF EXISTS user_daily_missions_insert_own ON user_daily_missions;
DROP POLICY IF EXISTS user_daily_missions_update_own ON user_daily_missions;
DROP POLICY IF EXISTS user_daily_missions_admin_all ON user_daily_missions;

CREATE POLICY user_daily_missions_select_own ON user_daily_missions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY user_daily_missions_insert_own ON user_daily_missions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_daily_missions_update_own ON user_daily_missions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY user_daily_missions_admin_all ON user_daily_missions FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 15. user_streaks
-- ============================================================================
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_streaks_select_own ON user_streaks;
DROP POLICY IF EXISTS user_streaks_insert_own ON user_streaks;
DROP POLICY IF EXISTS user_streaks_update_own ON user_streaks;
DROP POLICY IF EXISTS user_streaks_admin_all ON user_streaks;

CREATE POLICY user_streaks_select_own ON user_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY user_streaks_insert_own ON user_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_streaks_update_own ON user_streaks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY user_streaks_admin_all ON user_streaks FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 16. audit_log
-- ============================================================================
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_log_admin_all ON audit_log;

-- Apenas admin pode ver/modificar logs
CREATE POLICY audit_log_admin_all ON audit_log FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 17. franchise_units
-- ============================================================================
ALTER TABLE franchise_units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS franchise_units_select_all ON franchise_units;
DROP POLICY IF EXISTS franchise_units_admin_all ON franchise_units;

-- Todos autenticados podem ver franquias
CREATE POLICY franchise_units_select_all ON franchise_units FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Apenas admin pode gerenciar
CREATE POLICY franchise_units_admin_all ON franchise_units FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 18. GRANTS
-- ============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Acesso limitado para anon (não autenticados)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON trails, lessons, quizzes, quiz_options, achievements, store_items, daily_missions TO anon;
