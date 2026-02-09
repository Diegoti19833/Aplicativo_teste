-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY) - PET CLASS
-- Descrição: Políticas de segurança para todas as tabelas
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA TABELA USERS
-- =====================================================

-- Usuários podem ver apenas seus próprios dados
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (auth.uid() = id);

-- Usuários podem atualizar apenas seus próprios dados
CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Permitir inserção de novos usuários (registro)
CREATE POLICY "users_insert_own" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins e gerentes podem gerenciar todos os usuários
CREATE POLICY "users_admin_select_all" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'gerente')
        )
    );

CREATE POLICY "users_admin_update_all" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'gerente')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'gerente')
        )
    );

CREATE POLICY "users_admin_insert_all" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'gerente')
        )
    );

-- =====================================================
-- POLÍTICAS PARA TABELA APP_SETTINGS
-- =====================================================

CREATE POLICY "app_settings_admin_all" ON app_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'gerente')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'gerente')
        )
    );

-- =====================================================
-- POLÍTICAS PARA TABELA TRAILS
-- =====================================================

-- Todos podem ver trilhas ativas
CREATE POLICY "trails_select_all" ON trails
    FOR SELECT USING (is_active = true);

-- Apenas admins podem modificar trilhas
CREATE POLICY "trails_admin_all" ON trails
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'gerente')
        )
    );

-- =====================================================
-- POLÍTICAS PARA TABELA LESSONS
-- =====================================================

-- Todos podem ver aulas ativas
CREATE POLICY "lessons_select_all" ON lessons
    FOR SELECT USING (is_active = true);

-- Apenas admins podem modificar aulas
CREATE POLICY "lessons_admin_all" ON lessons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'gerente')
        )
    );

-- =====================================================
-- POLÍTICAS PARA TABELA QUIZZES
-- =====================================================

-- Todos podem ver quizzes ativos
CREATE POLICY "quizzes_select_all" ON quizzes
    FOR SELECT USING (is_active = true);

-- Apenas admins podem modificar quizzes
CREATE POLICY "quizzes_admin_all" ON quizzes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'gerente')
        )
    );

-- =====================================================
-- POLÍTICAS PARA TABELA QUIZ_OPTIONS
-- =====================================================

-- Todos podem ver opções de quizzes ativos
CREATE POLICY "quiz_options_select_all" ON quiz_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quizzes 
            WHERE id = quiz_options.quiz_id AND is_active = true
        )
    );

-- Apenas admins podem modificar opções de quiz
CREATE POLICY "quiz_options_admin_all" ON quiz_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'gerente')
        )
    );

-- =====================================================
-- POLÍTICAS PARA TABELA USER_PROGRESS
-- =====================================================

-- Usuários podem ver apenas seu próprio progresso
CREATE POLICY "user_progress_select_own" ON user_progress
    FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem inserir apenas seu próprio progresso
CREATE POLICY "user_progress_insert_own" ON user_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar apenas seu próprio progresso
CREATE POLICY "user_progress_update_own" ON user_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins podem ver todo o progresso
CREATE POLICY "user_progress_admin_all" ON user_progress
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'gerente')
        )
    );

-- =====================================================
-- POLÍTICAS PARA TABELA QUIZ_ATTEMPTS
-- =====================================================

-- Usuários podem ver apenas suas próprias tentativas
CREATE POLICY "quiz_attempts_select_own" ON quiz_attempts
    FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem inserir apenas suas próprias tentativas
CREATE POLICY "quiz_attempts_insert_own" ON quiz_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins podem ver todas as tentativas
CREATE POLICY "quiz_attempts_admin_all" ON quiz_attempts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'gerente')
        )
    );

-- =====================================================
-- POLÍTICAS PARA TABELA ACHIEVEMENTS
-- =====================================================

-- Todos podem ver conquistas ativas
CREATE POLICY "achievements_select_all" ON achievements
    FOR SELECT USING (is_active = true);

-- Apenas admins podem modificar conquistas
CREATE POLICY "achievements_admin_all" ON achievements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'gerente')
        )
    );

-- =====================================================
-- POLÍTICAS PARA TABELA USER_ACHIEVEMENTS
-- =====================================================

-- Usuários podem ver apenas suas próprias conquistas
CREATE POLICY "user_achievements_select_own" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem inserir apenas suas próprias conquistas
CREATE POLICY "user_achievements_insert_own" ON user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar apenas suas próprias conquistas
CREATE POLICY "user_achievements_update_own" ON user_achievements
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins podem ver todas as conquistas
CREATE POLICY "user_achievements_admin_all" ON user_achievements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'gerente')
        )
    );

-- =====================================================
-- POLÍTICAS PARA TABELA STORE_ITEMS
-- =====================================================

-- Todos podem ver itens disponíveis na loja
CREATE POLICY "store_items_select_all" ON store_items
    FOR SELECT USING (is_available = true);

-- Apenas admins podem modificar itens da loja
CREATE POLICY "store_items_admin_all" ON store_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'gerente')
        )
    );

-- =====================================================
-- POLÍTICAS PARA TABELA USER_PURCHASES
-- =====================================================

-- Usuários podem ver apenas suas próprias compras
CREATE POLICY "user_purchases_select_own" ON user_purchases
    FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem inserir apenas suas próprias compras
CREATE POLICY "user_purchases_insert_own" ON user_purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar apenas suas próprias compras
CREATE POLICY "user_purchases_update_own" ON user_purchases
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins podem ver todas as compras
CREATE POLICY "user_purchases_admin_all" ON user_purchases
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'gerente')
        )
    );

-- =====================================================
-- POLÍTICAS PARA TABELA DAILY_MISSIONS
-- =====================================================

-- Todos podem ver missões ativas
CREATE POLICY "daily_missions_select_all" ON daily_missions
    FOR SELECT USING (is_active = true);

-- Apenas admins podem modificar missões
CREATE POLICY "daily_missions_admin_all" ON daily_missions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'gerente')
        )
    );

-- =====================================================
-- POLÍTICAS PARA TABELA USER_DAILY_MISSIONS
-- =====================================================

-- Usuários podem ver apenas suas próprias missões
CREATE POLICY "user_daily_missions_select_own" ON user_daily_missions
    FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem inserir apenas suas próprias missões
CREATE POLICY "user_daily_missions_insert_own" ON user_daily_missions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar apenas suas próprias missões
CREATE POLICY "user_daily_missions_update_own" ON user_daily_missions
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins podem ver todas as missões dos usuários
CREATE POLICY "user_daily_missions_admin_all" ON user_daily_missions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'gerente')
        )
    );

-- =====================================================
-- POLÍTICAS PARA TABELA USER_STREAKS
-- =====================================================

-- Usuários podem ver apenas seus próprios streaks
CREATE POLICY "user_streaks_select_own" ON user_streaks
    FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem inserir apenas seus próprios streaks
CREATE POLICY "user_streaks_insert_own" ON user_streaks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar apenas seus próprios streaks
CREATE POLICY "user_streaks_update_own" ON user_streaks
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins podem ver todos os streaks
CREATE POLICY "user_streaks_admin_all" ON user_streaks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'gerente')
        )
    );

-- =====================================================
-- FUNÇÕES AUXILIARES PARA RLS
-- =====================================================

-- Função para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role IN ('admin', 'gerente')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se o usuário é o proprietário
CREATE OR REPLACE FUNCTION is_owner(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS PARA USUÁRIOS AUTENTICADOS
-- =====================================================

-- Conceder permissões básicas para usuários autenticados
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Conceder permissões para usuários anônimos (apenas leitura de conteúdo público)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON trails TO anon;
GRANT SELECT ON lessons TO anon;
GRANT SELECT ON quizzes TO anon;
GRANT SELECT ON quiz_options TO anon;
GRANT SELECT ON achievements TO anon;
GRANT SELECT ON store_items TO anon;
GRANT SELECT ON daily_missions TO anon;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON POLICY "users_select_own" ON users IS 'Usuários podem ver apenas seus próprios dados';
COMMENT ON POLICY "trails_select_all" ON trails IS 'Todos podem ver trilhas ativas';
COMMENT ON POLICY "quiz_options_select_all" ON quiz_options IS 'Todos podem ver opções de quizzes ativos';
COMMENT ON FUNCTION is_admin() IS 'Verifica se o usuário atual é administrador';
COMMENT ON FUNCTION is_owner(UUID) IS 'Verifica se o usuário atual é o proprietário do recurso';
