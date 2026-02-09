-- ============================================================================
-- MIGRAÇÃO UNIFICADA - Pet Franchise Gamification App
-- ============================================================================
-- Este script reconcilia os dois schemas divergentes (supabase_schema.sql vs sql/)
-- e cria/altera todas as tabelas necessárias de forma segura (IF NOT EXISTS).
-- Execute este script no Supabase SQL Editor.
-- ============================================================================

-- ============================================================================
-- 0. EXTENSÕES
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. FUNÇÃO GENÉRICA updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. TABELA users - garantir que todas as colunas existem
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(50) NOT NULL DEFAULT 'funcionario',
  total_xp INTEGER NOT NULL DEFAULT 0,
  coins INTEGER NOT NULL DEFAULT 100,
  level INTEGER NOT NULL DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  max_streak INTEGER NOT NULL DEFAULT 0,
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  quizzes_completed INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar colunas que podem estar faltando em tabelas existentes
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS total_xp INTEGER NOT NULL DEFAULT 0;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS coins INTEGER NOT NULL DEFAULT 100;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS max_streak INTEGER NOT NULL DEFAULT 0;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS lessons_completed INTEGER NOT NULL DEFAULT 0;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS quizzes_completed INTEGER NOT NULL DEFAULT 0;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Compatibilidade: se existir xp_total mas não total_xp, criar alias
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='xp_total')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='total_xp') THEN
    ALTER TABLE users RENAME COLUMN xp_total TO total_xp;
  END IF;
END $$;

-- Compatibilidade: streak_days -> current_streak
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='streak_days')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='current_streak') THEN
    ALTER TABLE users RENAME COLUMN streak_days TO current_streak;
  END IF;
END $$;

-- Atualizar CHECK constraint de role para incluir todos os valores
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('funcionario', 'gerente', 'admin', 'caixa'));

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_total_xp ON users(total_xp);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. TABELA app_settings
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL DEFAULT 'default',
  company_name TEXT DEFAULT 'Pet Pop',
  primary_color VARCHAR(7) DEFAULT '#008037',
  secondary_color VARCHAR(7) DEFAULT '#00A94F',
  daily_xp_limit INTEGER DEFAULT 1000,
  global_ranking BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir configuração padrão se não existir
INSERT INTO app_settings (key) VALUES ('default') ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 4. TABELA trails
-- ============================================================================
CREATE TABLE IF NOT EXISTS trails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(10) DEFAULT '📚',
  icon_url TEXT,
  color VARCHAR(7) DEFAULT '#008037',
  target_roles TEXT[] DEFAULT ARRAY['funcionario','gerente','admin','caixa'],
  category VARCHAR(100) DEFAULT 'geral',
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  estimated_duration INTEGER DEFAULT 30,
  total_lessons INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar colunas que podem estar faltando
DO $$ BEGIN
  ALTER TABLE trails ADD COLUMN IF NOT EXISTS target_roles TEXT[] DEFAULT ARRAY['funcionario','gerente','admin','caixa'];
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE trails ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'geral';
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE trails ADD COLUMN IF NOT EXISTS difficulty_level INTEGER DEFAULT 1;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE trails ADD COLUMN IF NOT EXISTS total_lessons INTEGER DEFAULT 0;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE trails ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#008037';
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE trails ADD COLUMN IF NOT EXISTS icon_url TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_trails_order ON trails(order_index);
CREATE INDEX IF NOT EXISTS idx_trails_active ON trails(is_active);

DROP TRIGGER IF EXISTS update_trails_updated_at ON trails;
CREATE TRIGGER update_trails_updated_at
  BEFORE UPDATE ON trails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. TABELA lessons
-- ============================================================================
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trail_id UUID NOT NULL REFERENCES trails(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  video_url TEXT,
  lesson_type VARCHAR(50) DEFAULT 'text' CHECK (lesson_type IN ('video','text','interactive','quiz')),
  duration_minutes INTEGER DEFAULT 10,
  xp_reward INTEGER NOT NULL DEFAULT 20,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE lessons ADD COLUMN IF NOT EXISTS lesson_type VARCHAR(50) DEFAULT 'text';
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_lessons_trail ON lessons(trail_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(trail_id, order_index);

DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;
CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar total_lessons na trail
CREATE OR REPLACE FUNCTION update_trail_lesson_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE trails SET total_lessons = (
      SELECT COUNT(*) FROM lessons WHERE trail_id = OLD.trail_id AND is_active = true
    ) WHERE id = OLD.trail_id;
    RETURN OLD;
  ELSE
    UPDATE trails SET total_lessons = (
      SELECT COUNT(*) FROM lessons WHERE trail_id = NEW.trail_id AND is_active = true
    ) WHERE id = NEW.trail_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_trail_lesson_count_trigger ON lessons;
CREATE TRIGGER update_trail_lesson_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_trail_lesson_count();

-- ============================================================================
-- 6. TABELA quizzes
-- ============================================================================
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  trail_id UUID REFERENCES trails(id) ON DELETE SET NULL,
  title VARCHAR(255),
  question TEXT NOT NULL,
  question_type VARCHAR(50) DEFAULT 'multiple_choice'
    CHECK (question_type IN ('multiple_choice','true_false','text')),
  options JSONB,
  correct_answer TEXT,
  explanation TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 10,
  difficulty_level INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS trail_id UUID REFERENCES trails(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS title VARCHAR(255);
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS options JSONB;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS correct_answer TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS explanation TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS difficulty_level INTEGER DEFAULT 1;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_quizzes_lesson ON quizzes(lesson_id);

DROP TRIGGER IF EXISTS update_quizzes_updated_at ON quizzes;
CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON quizzes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. TABELA quiz_options
-- ============================================================================
CREATE TABLE IF NOT EXISTS quiz_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_options_quiz ON quiz_options(quiz_id);

-- ============================================================================
-- 8. TABELA user_progress (CRÍTICA - referenciada em todo lugar mas nunca criada)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trail_id UUID REFERENCES trails(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  progress_type VARCHAR(50) NOT NULL DEFAULT 'lesson_completed'
    CHECK (progress_type IN ('lesson_started','lesson_completed','quiz_completed','trail_completed')),
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson ON user_progress(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_trail ON user_progress(user_id, trail_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_type ON user_progress(progress_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_progress_unique_lesson
  ON user_progress(user_id, lesson_id, progress_type)
  WHERE lesson_id IS NOT NULL;

DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. TABELA quiz_attempts (CRÍTICA - referenciada mas nunca criada)
-- ============================================================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES quiz_options(id),
  selected_option TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  xp_earned INTEGER DEFAULT 0,
  attempt_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(user_id, quiz_id);

-- ============================================================================
-- 10. TABELA achievements
-- ============================================================================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(10) DEFAULT '🏆',
  icon_url TEXT,
  achievement_type VARCHAR(50) DEFAULT 'xp_milestone'
    CHECK (achievement_type IN ('xp_milestone','streak','completion','special','lessons','quizzes','coins')),
  target_value INTEGER DEFAULT 1,
  xp_reward INTEGER DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compatibilidade: badge_type -> achievement_type
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='achievements' AND column_name='badge_type')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='achievements' AND column_name='achievement_type') THEN
    ALTER TABLE achievements RENAME COLUMN badge_type TO achievement_type;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='achievements' AND column_name='requirement_value')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='achievements' AND column_name='target_value') THEN
    ALTER TABLE achievements RENAME COLUMN requirement_value TO target_value;
  END IF;
END $$;
DO $$ BEGIN
  ALTER TABLE achievements ADD COLUMN IF NOT EXISTS icon_url TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE achievements ADD COLUMN IF NOT EXISTS achievement_type VARCHAR(50) DEFAULT 'xp_milestone';
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE achievements ADD COLUMN IF NOT EXISTS target_value INTEGER DEFAULT 1;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================================================
-- 11. TABELA user_achievements
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  progress_value INTEGER DEFAULT 0,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

DO $$ BEGIN
  ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS progress_value INTEGER DEFAULT 0;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

-- ============================================================================
-- 12. TABELA store_items
-- ============================================================================
CREATE TABLE IF NOT EXISTS store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  icon VARCHAR(10) DEFAULT '🎁',
  image_url TEXT,
  item_type VARCHAR(50) DEFAULT 'cosmetic'
    CHECK (item_type IN ('avatar','theme','boost','decoration','special','badge','cosmetic')),
  item_data JSONB,
  price INTEGER NOT NULL CHECK (price > 0),
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary')),
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_limited BOOLEAN DEFAULT false,
  stock_quantity INTEGER,
  purchase_limit INTEGER DEFAULT 1,
  discount_percentage INTEGER DEFAULT 0 CHECK (discount_percentage BETWEEN 0 AND 100),
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compatibilidade: se existir price_xp mas não price
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='store_items' AND column_name='price_xp')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='store_items' AND column_name='price') THEN
    ALTER TABLE store_items RENAME COLUMN price_xp TO price;
  END IF;
END $$;
-- Se usar title sem name
DO $$ BEGIN
  ALTER TABLE store_items ADD COLUMN IF NOT EXISTS name VARCHAR(255);
EXCEPTION WHEN others THEN NULL;
END $$;
-- Copiar title para name onde name está null
UPDATE store_items SET name = title WHERE name IS NULL AND title IS NOT NULL;
DO $$ BEGIN
  ALTER TABLE store_items ADD COLUMN IF NOT EXISTS price INTEGER NOT NULL DEFAULT 10;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE store_items ADD COLUMN IF NOT EXISTS stock_quantity INTEGER;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE store_items ADD COLUMN IF NOT EXISTS purchase_limit INTEGER DEFAULT 1;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE store_items ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE store_items ADD COLUMN IF NOT EXISTS rarity VARCHAR(20) DEFAULT 'common';
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE store_items ADD COLUMN IF NOT EXISTS image_url TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE store_items ADD COLUMN IF NOT EXISTS item_data JSONB;
EXCEPTION WHEN others THEN NULL;
END $$;

DROP TRIGGER IF EXISTS update_store_items_updated_at ON store_items;
CREATE TRIGGER update_store_items_updated_at
  BEFORE UPDATE ON store_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 13. TABELA user_purchases
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES store_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price INTEGER NOT NULL DEFAULT 0,
  total_price INTEGER NOT NULL DEFAULT 0,
  discount_applied INTEGER DEFAULT 0,
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE user_purchases ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE user_purchases ADD COLUMN IF NOT EXISTS unit_price INTEGER NOT NULL DEFAULT 0;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE user_purchases ADD COLUMN IF NOT EXISTS total_price INTEGER NOT NULL DEFAULT 0;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE user_purchases ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE user_purchases ADD COLUMN IF NOT EXISTS purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW();
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_purchases_user ON user_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_item ON user_purchases(item_id);

-- ============================================================================
-- 14. TABELA daily_missions
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  mission_type VARCHAR(50) NOT NULL
    CHECK (mission_type IN ('complete_lessons','answer_quizzes','earn_xp','study_time','perfect_streak','login_daily')),
  target_value INTEGER NOT NULL CHECK (target_value > 0),
  xp_reward INTEGER NOT NULL DEFAULT 20,
  coins_reward INTEGER NOT NULL DEFAULT 5,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 3),
  icon_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE daily_missions ADD COLUMN IF NOT EXISTS coins_reward INTEGER NOT NULL DEFAULT 5;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE daily_missions ADD COLUMN IF NOT EXISTS difficulty_level INTEGER DEFAULT 1;
EXCEPTION WHEN others THEN NULL;
END $$;

DROP TRIGGER IF EXISTS update_daily_missions_updated_at ON daily_missions;
CREATE TRIGGER update_daily_missions_updated_at
  BEFORE UPDATE ON daily_missions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 15. TABELA user_daily_missions
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES daily_missions(id) ON DELETE CASCADE,
  current_progress INTEGER NOT NULL DEFAULT 0,
  target_value INTEGER NOT NULL DEFAULT 1,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  mission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, mission_id, mission_date)
);

DO $$ BEGIN
  ALTER TABLE user_daily_missions ADD COLUMN IF NOT EXISTS target_value INTEGER NOT NULL DEFAULT 1;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_daily_missions_user ON user_daily_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_missions_date ON user_daily_missions(user_id, mission_date);

DROP TRIGGER IF EXISTS update_user_daily_missions_updated_at ON user_daily_missions;
CREATE TRIGGER update_user_daily_missions_updated_at
  BEFORE UPDATE ON user_daily_missions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 16. TABELA user_streaks
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  streak_date DATE NOT NULL,
  activities_completed INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  quizzes_completed INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  study_time_minutes INTEGER DEFAULT 0,
  is_streak_day BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, streak_date)
);

CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_date ON user_streaks(user_id, streak_date);

DROP TRIGGER IF EXISTS update_user_streaks_updated_at ON user_streaks;
CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON user_streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 17. TABELA audit_log (nova - para auditoria)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_date ON audit_log(created_at);

-- ============================================================================
-- 18. TABELA franchise_units (nova - para gestão por franquia)
-- ============================================================================
CREATE TABLE IF NOT EXISTS franchise_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  manager_id UUID REFERENCES users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar franchise_unit_id à tabela users
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS franchise_unit_id UUID REFERENCES franchise_units(id);
EXCEPTION WHEN others THEN NULL;
END $$;

DROP TRIGGER IF EXISTS update_franchise_units_updated_at ON franchise_units;
CREATE TRIGGER update_franchise_units_updated_at
  BEFORE UPDATE ON franchise_units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 19. FUNÇÕES DE NEGÓCIO (corrigidas)
-- ============================================================================

-- Calcular nível baseado em XP
CREATE OR REPLACE FUNCTION calculate_user_level(p_total_xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN GREATEST(1, FLOOR(SQRT(p_total_xp::NUMERIC / 100)));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calcular XP total do usuário
CREATE OR REPLACE FUNCTION calculate_user_total_xp(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total INTEGER;
BEGIN
  SELECT COALESCE(SUM(xp_earned), 0) INTO v_total
  FROM user_progress
  WHERE user_id = p_user_id AND is_completed = true;

  v_total := v_total + COALESCE((
    SELECT SUM(xp_earned) FROM quiz_attempts
    WHERE user_id = p_user_id AND is_correct = true
  ), 0);

  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar estatísticas do usuário
CREATE OR REPLACE FUNCTION update_user_stats(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_xp INTEGER;
  v_level INTEGER;
  v_lessons INTEGER;
  v_quizzes INTEGER;
BEGIN
  v_total_xp := calculate_user_total_xp(p_user_id);
  v_level := calculate_user_level(v_total_xp);

  SELECT COUNT(*) INTO v_lessons
  FROM user_progress
  WHERE user_id = p_user_id AND progress_type = 'lesson_completed' AND is_completed = true;

  SELECT COUNT(DISTINCT quiz_id) INTO v_quizzes
  FROM quiz_attempts
  WHERE user_id = p_user_id AND is_correct = true;

  UPDATE users SET
    total_xp = v_total_xp,
    level = v_level,
    lessons_completed = v_lessons,
    quizzes_completed = v_quizzes,
    last_activity_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 20. FUNÇÃO complete_lesson (SECURITY DEFINER)
-- ============================================================================
CREATE OR REPLACE FUNCTION complete_lesson(
  user_id_param UUID,
  lesson_id_param UUID
)
RETURNS JSON AS $$
DECLARE
  v_lesson RECORD;
  v_existing RECORD;
  v_xp INTEGER;
  v_result JSON;
BEGIN
  -- Verificar se a aula existe
  SELECT * INTO v_lesson FROM lessons WHERE id = lesson_id_param;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Aula não encontrada');
  END IF;

  -- Verificar se já foi completada
  SELECT * INTO v_existing FROM user_progress
  WHERE user_id = user_id_param AND lesson_id = lesson_id_param
    AND progress_type = 'lesson_completed';

  IF FOUND AND v_existing.is_completed THEN
    RETURN json_build_object('success', true, 'message', 'Aula já completada', 'xp_earned', 0);
  END IF;

  v_xp := COALESCE(v_lesson.xp_reward, 20);

  -- Inserir ou atualizar progresso
  INSERT INTO user_progress (user_id, trail_id, lesson_id, progress_type, xp_earned, is_completed, completed_at, completion_percentage)
  VALUES (user_id_param, v_lesson.trail_id, lesson_id_param, 'lesson_completed', v_xp, true, NOW(), 100)
  ON CONFLICT (user_id, lesson_id, progress_type)
  DO UPDATE SET is_completed = true, completed_at = NOW(), xp_earned = v_xp, completion_percentage = 100;

  -- Atualizar stats do usuário
  PERFORM update_user_stats(user_id_param);

  -- Registrar atividade no streak
  PERFORM record_daily_activity(user_id_param, 'lesson', v_xp, COALESCE(v_lesson.duration_minutes, 10));

  RETURN json_build_object(
    'success', true,
    'xp_earned', v_xp,
    'lesson_title', v_lesson.title
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 21. FUNÇÃO answer_quiz / submit_quiz_answer (SECURITY DEFINER)
-- ============================================================================
CREATE OR REPLACE FUNCTION answer_quiz(
  user_id_param UUID,
  quiz_id_param UUID,
  selected_option_param UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_quiz RECORD;
  v_option RECORD;
  v_is_correct BOOLEAN;
  v_xp INTEGER;
  v_attempt_count INTEGER;
  v_xp_multiplier NUMERIC;
BEGIN
  SELECT * INTO v_quiz FROM quizzes WHERE id = quiz_id_param;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Quiz não encontrado');
  END IF;

  -- Verificar resposta
  IF selected_option_param IS NOT NULL THEN
    SELECT * INTO v_option FROM quiz_options WHERE id = selected_option_param;
    v_is_correct := COALESCE(v_option.is_correct, false);
  ELSE
    v_is_correct := false;
  END IF;

  -- Contar tentativas anteriores
  SELECT COUNT(*) INTO v_attempt_count FROM quiz_attempts
  WHERE user_id = user_id_param AND quiz_id = quiz_id_param;

  -- XP com decaimento por tentativas
  v_xp_multiplier := CASE v_attempt_count
    WHEN 0 THEN 1.0
    WHEN 1 THEN 0.7
    WHEN 2 THEN 0.5
    ELSE 0.3
  END;

  v_xp := CASE WHEN v_is_correct THEN FLOOR(COALESCE(v_quiz.xp_reward, 10) * v_xp_multiplier) ELSE 0 END;

  -- Registrar tentativa
  INSERT INTO quiz_attempts (user_id, quiz_id, selected_option_id, selected_option, is_correct, xp_earned, attempt_number)
  VALUES (user_id_param, quiz_id_param, selected_option_param, v_option.option_text, v_is_correct, v_xp, v_attempt_count + 1);

  -- Atualizar stats se acertou
  IF v_is_correct THEN
    PERFORM update_user_stats(user_id_param);
    PERFORM record_daily_activity(user_id_param, 'quiz', v_xp, 2);
  END IF;

  RETURN json_build_object(
    'success', true,
    'is_correct', v_is_correct,
    'xp_earned', v_xp,
    'correct_answer', (SELECT option_text FROM quiz_options WHERE quiz_id = quiz_id_param AND is_correct = true LIMIT 1),
    'explanation', v_quiz.explanation,
    'attempt_number', v_attempt_count + 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alias
CREATE OR REPLACE FUNCTION submit_quiz_answer(
  user_id_param UUID,
  quiz_id_param UUID,
  selected_option_param UUID DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
  RETURN answer_quiz(user_id_param, quiz_id_param, selected_option_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 22. FUNÇÃO get_user_dashboard (SECURITY DEFINER)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_dashboard(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
  v_streak INTEGER;
  v_recent_achievements JSON;
  v_next_lessons JSON;
  v_active_trails JSON;
BEGIN
  SELECT * INTO v_user FROM users WHERE id = user_id_param;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;

  -- Streak atual
  v_streak := COALESCE(v_user.current_streak, 0);

  -- Conquistas recentes
  SELECT json_agg(row_to_json(t)) INTO v_recent_achievements
  FROM (
    SELECT a.title, a.icon, a.icon_url, ua.unlocked_at
    FROM user_achievements ua
    JOIN achievements a ON a.id = ua.achievement_id
    WHERE ua.user_id = user_id_param
    ORDER BY ua.unlocked_at DESC
    LIMIT 5
  ) t;

  -- Próximas aulas (não completadas, desbloqueadas)
  SELECT json_agg(row_to_json(t)) INTO v_next_lessons
  FROM (
    SELECT l.id, l.title, l.xp_reward, l.duration_minutes, tr.title as trail_title, tr.icon
    FROM lessons l
    JOIN trails tr ON tr.id = l.trail_id
    WHERE l.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM user_progress up
        WHERE up.user_id = user_id_param AND up.lesson_id = l.id
          AND up.progress_type = 'lesson_completed' AND up.is_completed = true
      )
    ORDER BY l.order_index
    LIMIT 5
  ) t;

  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'name', v_user.name,
      'email', v_user.email,
      'role', v_user.role,
      'total_xp', v_user.total_xp,
      'coins', v_user.coins,
      'level', v_user.level,
      'current_streak', v_streak,
      'max_streak', v_user.max_streak,
      'lessons_completed', v_user.lessons_completed,
      'quizzes_completed', v_user.quizzes_completed,
      'avatar_url', v_user.avatar_url
    ),
    'recent_achievements', COALESCE(v_recent_achievements, '[]'::json),
    'next_lessons', COALESCE(v_next_lessons, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 23. FUNÇÃO get_trail_progress (SECURITY DEFINER)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_trail_progress(user_id_param UUID, trail_id_param UUID)
RETURNS JSON AS $$
DECLARE
  v_total_lessons INTEGER;
  v_completed_lessons INTEGER;
  v_progress_pct NUMERIC;
BEGIN
  SELECT COUNT(*) INTO v_total_lessons FROM lessons
  WHERE trail_id = trail_id_param AND is_active = true;

  SELECT COUNT(*) INTO v_completed_lessons FROM user_progress
  WHERE user_id = user_id_param AND trail_id = trail_id_param
    AND progress_type = 'lesson_completed' AND is_completed = true;

  IF v_total_lessons > 0 THEN
    v_progress_pct := ROUND((v_completed_lessons::NUMERIC / v_total_lessons) * 100, 1);
  ELSE
    v_progress_pct := 0;
  END IF;

  RETURN json_build_object(
    'total_lessons', v_total_lessons,
    'completed_lessons', v_completed_lessons,
    'progress_percentage', v_progress_pct,
    'is_completed', (v_completed_lessons >= v_total_lessons AND v_total_lessons > 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 24. FUNÇÃO get_my_ranking (SECURITY DEFINER) - Ranking seguro para mobile
-- Retorna APENAS a posição do usuário logado, sem expor dados de outros
-- ============================================================================
CREATE OR REPLACE FUNCTION get_my_ranking(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
  v_position INTEGER;
  v_total_users INTEGER;
BEGIN
  SELECT * INTO v_user FROM users WHERE id = user_id_param AND is_active = true;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;

  -- Calcular posição (quantos usuários ativos têm mais XP)
  SELECT COUNT(*) + 1 INTO v_position
  FROM users
  WHERE is_active = true AND total_xp > v_user.total_xp;

  SELECT COUNT(*) INTO v_total_users FROM users WHERE is_active = true;

  RETURN json_build_object(
    'success', true,
    'position', v_position,
    'total_users', v_total_users,
    'name', v_user.name,
    'total_xp', v_user.total_xp,
    'level', v_user.level,
    'lessons_completed', v_user.lessons_completed,
    'quizzes_completed', v_user.quizzes_completed,
    'current_streak', v_user.current_streak,
    'avatar_url', v_user.avatar_url
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 25. FUNÇÃO get_full_ranking (SECURITY DEFINER) - Ranking completo para admin
-- ============================================================================
CREATE OR REPLACE FUNCTION get_full_ranking(
  limit_param INTEGER DEFAULT 50,
  offset_param INTEGER DEFAULT 0,
  franchise_filter UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_results JSON;
  v_total INTEGER;
BEGIN
  -- Verificar se o chamador é admin/gerente
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'gerente')
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Sem permissão');
  END IF;

  SELECT COUNT(*) INTO v_total FROM users WHERE is_active = true;

  SELECT json_agg(row_to_json(t)) INTO v_results
  FROM (
    SELECT
      u.id, u.name, u.email, u.role, u.total_xp, u.level,
      u.coins, u.current_streak, u.lessons_completed, u.quizzes_completed,
      u.avatar_url, u.franchise_unit_id,
      fu.name as franchise_name,
      ROW_NUMBER() OVER (ORDER BY u.total_xp DESC) as position
    FROM users u
    LEFT JOIN franchise_units fu ON fu.id = u.franchise_unit_id
    WHERE u.is_active = true
      AND (franchise_filter IS NULL OR u.franchise_unit_id = franchise_filter)
    ORDER BY u.total_xp DESC
    LIMIT limit_param OFFSET offset_param
  ) t;

  RETURN json_build_object(
    'success', true,
    'total', v_total,
    'ranking', COALESCE(v_results, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 26. FUNÇÃO purchase_store_item (CORRIGIDA - sem double deduction)
-- ============================================================================
-- Primeiro, remover o trigger process_purchase que causa deduction dupla
DROP TRIGGER IF EXISTS process_purchase_trigger ON user_purchases;

CREATE OR REPLACE FUNCTION purchase_store_item(
  user_id_param UUID,
  item_id_param UUID,
  quantity_param INTEGER DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
  v_item RECORD;
  v_user RECORD;
  v_final_price INTEGER;
  v_total_cost INTEGER;
  v_existing_purchases INTEGER;
BEGIN
  -- Buscar item
  SELECT * INTO v_item FROM store_items WHERE id = item_id_param;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Item não encontrado');
  END IF;

  IF NOT v_item.is_available THEN
    RETURN json_build_object('success', false, 'error', 'Item não disponível');
  END IF;

  -- Verificar estoque
  IF v_item.stock_quantity IS NOT NULL AND v_item.stock_quantity < quantity_param THEN
    RETURN json_build_object('success', false, 'error', 'Estoque insuficiente');
  END IF;

  -- Verificar limite de compra
  SELECT COUNT(*) INTO v_existing_purchases FROM user_purchases
  WHERE user_id = user_id_param AND item_id = item_id_param AND is_active = true;

  IF v_item.purchase_limit IS NOT NULL AND (v_existing_purchases + quantity_param) > v_item.purchase_limit THEN
    RETURN json_build_object('success', false, 'error', 'Limite de compra atingido');
  END IF;

  -- Calcular preço
  v_final_price := v_item.price - FLOOR(v_item.price * COALESCE(v_item.discount_percentage, 0) / 100.0);
  v_total_cost := v_final_price * quantity_param;

  -- Buscar usuário e verificar saldo
  SELECT * INTO v_user FROM users WHERE id = user_id_param;
  IF v_user.coins < v_total_cost THEN
    RETURN json_build_object('success', false, 'error', 'Saldo insuficiente', 'coins', v_user.coins, 'cost', v_total_cost);
  END IF;

  -- Deduzir coins
  UPDATE users SET coins = coins - v_total_cost WHERE id = user_id_param;

  -- Atualizar estoque
  IF v_item.stock_quantity IS NOT NULL THEN
    UPDATE store_items SET stock_quantity = stock_quantity - quantity_param WHERE id = item_id_param;
  END IF;

  -- Registrar compra (sem trigger de deduction!)
  INSERT INTO user_purchases (user_id, item_id, quantity, unit_price, total_price, discount_applied, purchase_date)
  VALUES (user_id_param, item_id_param, quantity_param, v_final_price, v_total_cost, COALESCE(v_item.discount_percentage, 0), NOW());

  -- Log de auditoria
  INSERT INTO audit_log (user_id, action, table_name, record_id, new_data)
  VALUES (user_id_param, 'purchase', 'store_items', item_id_param,
    json_build_object('item', v_item.name, 'quantity', quantity_param, 'total_cost', v_total_cost)::jsonb);

  RETURN json_build_object(
    'success', true,
    'item_name', COALESCE(v_item.name, v_item.title),
    'quantity', quantity_param,
    'total_cost', v_total_cost,
    'remaining_coins', v_user.coins - v_total_cost
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 27. FUNÇÃO use_store_item
-- ============================================================================
CREATE OR REPLACE FUNCTION use_store_item(
  user_id_param UUID,
  item_id_param UUID,
  quantity_param INTEGER DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
  v_purchase RECORD;
BEGIN
  SELECT * INTO v_purchase FROM user_purchases
  WHERE user_id = user_id_param AND item_id = item_id_param AND is_active = true
  ORDER BY purchase_date DESC LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Item não encontrado no inventário');
  END IF;

  IF v_purchase.quantity < quantity_param THEN
    RETURN json_build_object('success', false, 'error', 'Quantidade insuficiente');
  END IF;

  UPDATE user_purchases
  SET quantity = quantity - quantity_param
  WHERE id = v_purchase.id;

  -- Desativar se quantidade zerou
  UPDATE user_purchases SET is_active = false WHERE id = v_purchase.id AND quantity <= 0;

  RETURN json_build_object('success', true, 'remaining', GREATEST(0, v_purchase.quantity - quantity_param));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 28. FUNÇÃO record_daily_activity (corrigida)
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

  -- Atualizar streak do usuário (CORRIGIDO - sem variable shadowing)
  DECLARE
    v_streak_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_streak_count
    FROM (
      SELECT streak_date
      FROM user_streaks
      WHERE user_id = p_user_id AND is_streak_day = true
        AND streak_date <= CURRENT_DATE
      ORDER BY streak_date DESC
    ) consecutive
    WHERE streak_date >= CURRENT_DATE - (ROW_NUMBER() OVER (ORDER BY streak_date DESC) - 1)::INTEGER;

    UPDATE users SET
      current_streak = v_streak_count,
      max_streak = GREATEST(max_streak, v_streak_count)
    WHERE id = p_user_id;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 29. FUNÇÃO update_daily_mission_progress
-- ============================================================================
CREATE OR REPLACE FUNCTION update_daily_mission_progress(
  p_user_id UUID,
  p_mission_type TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
  v_updated INTEGER := 0;
  v_mission RECORD;
BEGIN
  -- Buscar missões ativas do tipo especificado
  FOR v_mission IN
    SELECT dm.id, dm.target_value, dm.xp_reward, dm.coins_reward
    FROM daily_missions dm
    WHERE dm.mission_type = p_mission_type AND dm.is_active = true
  LOOP
    -- Criar entrada para hoje se não existir
    INSERT INTO user_daily_missions (user_id, mission_id, target_value, mission_date)
    VALUES (p_user_id, v_mission.id, v_mission.target_value, CURRENT_DATE)
    ON CONFLICT (user_id, mission_id, mission_date) DO NOTHING;

    -- Atualizar progresso
    UPDATE user_daily_missions
    SET current_progress = LEAST(current_progress + p_increment, v_mission.target_value)
    WHERE user_id = p_user_id
      AND mission_id = v_mission.id
      AND mission_date = CURRENT_DATE
      AND is_completed = false;

    -- Verificar conclusão
    UPDATE user_daily_missions
    SET is_completed = true, completed_at = NOW()
    WHERE user_id = p_user_id
      AND mission_id = v_mission.id
      AND mission_date = CURRENT_DATE
      AND current_progress >= v_mission.target_value
      AND is_completed = false;

    IF FOUND THEN
      -- Premiar XP e coins
      UPDATE users SET
        total_xp = total_xp + COALESCE(v_mission.xp_reward, 0),
        coins = coins + COALESCE(v_mission.coins_reward, 0)
      WHERE id = p_user_id;
      v_updated := v_updated + 1;
    END IF;
  END LOOP;

  RETURN json_build_object('success', true, 'missions_completed', v_updated);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 30. FUNÇÃO check_achievement
-- ============================================================================
CREATE OR REPLACE FUNCTION check_achievement(
  p_user_id UUID,
  p_achievement_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_achievement RECORD;
  v_user RECORD;
  v_current_value INTEGER;
  v_already_unlocked BOOLEAN;
BEGIN
  SELECT * INTO v_achievement FROM achievements WHERE id = p_achievement_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Conquista não encontrada');
  END IF;

  SELECT * INTO v_user FROM users WHERE id = p_user_id;

  -- Verificar se já foi desbloqueada
  SELECT EXISTS(
    SELECT 1 FROM user_achievements WHERE user_id = p_user_id AND achievement_id = p_achievement_id
  ) INTO v_already_unlocked;

  IF v_already_unlocked THEN
    RETURN json_build_object('success', true, 'already_unlocked', true);
  END IF;

  -- Calcular progresso baseado no tipo
  v_current_value := CASE v_achievement.achievement_type
    WHEN 'xp_milestone' THEN v_user.total_xp
    WHEN 'streak' THEN v_user.current_streak
    WHEN 'lessons' THEN v_user.lessons_completed
    WHEN 'quizzes' THEN v_user.quizzes_completed
    WHEN 'coins' THEN v_user.coins
    WHEN 'completion' THEN (SELECT COUNT(*) FROM user_progress WHERE user_id = p_user_id AND progress_type = 'trail_completed')
    ELSE 0
  END;

  -- Verificar se atingiu o objetivo
  IF v_current_value >= v_achievement.target_value THEN
    INSERT INTO user_achievements (user_id, achievement_id, progress_value, unlocked_at)
    VALUES (p_user_id, p_achievement_id, v_current_value, NOW())
    ON CONFLICT (user_id, achievement_id) DO NOTHING;

    -- Premiar XP
    UPDATE users SET total_xp = total_xp + COALESCE(v_achievement.xp_reward, 0) WHERE id = p_user_id;

    RETURN json_build_object('success', true, 'unlocked', true, 'xp_reward', v_achievement.xp_reward);
  END IF;

  RETURN json_build_object(
    'success', true,
    'unlocked', false,
    'current_value', v_current_value,
    'target_value', v_achievement.target_value,
    'progress_percentage', ROUND((v_current_value::NUMERIC / GREATEST(v_achievement.target_value, 1)) * 100, 1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 31. FUNÇÃO get_lesson_progress_detail (faltava)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_lesson_progress_detail(
  p_user_id UUID,
  p_lesson_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_total_quizzes INTEGER;
  v_completed_quizzes INTEGER;
  v_lesson_completed BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO v_total_quizzes FROM quizzes
  WHERE lesson_id = p_lesson_id AND is_active = true;

  SELECT COUNT(DISTINCT qa.quiz_id) INTO v_completed_quizzes
  FROM quiz_attempts qa
  JOIN quizzes q ON q.id = qa.quiz_id
  WHERE qa.user_id = p_user_id AND q.lesson_id = p_lesson_id AND qa.is_correct = true;

  SELECT EXISTS(
    SELECT 1 FROM user_progress
    WHERE user_id = p_user_id AND lesson_id = p_lesson_id
      AND progress_type = 'lesson_completed' AND is_completed = true
  ) INTO v_lesson_completed;

  RETURN json_build_object(
    'total_quizzes', v_total_quizzes,
    'completed_quizzes', v_completed_quizzes,
    'quiz_completion_percentage', CASE WHEN v_total_quizzes > 0
      THEN ROUND((v_completed_quizzes::NUMERIC / v_total_quizzes) * 100, 1)
      ELSE 0 END,
    'all_quizzes_completed', (v_completed_quizzes >= v_total_quizzes AND v_total_quizzes > 0),
    'lesson_completed', v_lesson_completed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 32. FUNÇÃO get_admin_overview (para dashboard admin real)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_admin_overview()
RETURNS JSON AS $$
DECLARE
  v_total_users INTEGER;
  v_active_users INTEGER;
  v_total_xp_all BIGINT;
  v_total_lessons_completed BIGINT;
  v_total_purchases BIGINT;
  v_total_coins_spent BIGINT;
  v_new_users_30d INTEGER;
  v_monthly_data JSON;
BEGIN
  -- Verificar permissão
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'gerente')) THEN
    RETURN json_build_object('success', false, 'error', 'Sem permissão');
  END IF;

  SELECT COUNT(*) INTO v_total_users FROM users;
  SELECT COUNT(*) INTO v_active_users FROM users WHERE is_active = true;
  SELECT COALESCE(SUM(total_xp), 0) INTO v_total_xp_all FROM users;
  SELECT COUNT(*) INTO v_total_lessons_completed FROM user_progress
    WHERE progress_type = 'lesson_completed' AND is_completed = true;
  SELECT COUNT(*) INTO v_total_purchases FROM user_purchases;
  SELECT COALESCE(SUM(total_price), 0) INTO v_total_coins_spent FROM user_purchases;
  SELECT COUNT(*) INTO v_new_users_30d FROM users
    WHERE created_at >= NOW() - INTERVAL '30 days';

  -- Dados mensais (últimos 6 meses)
  SELECT json_agg(row_to_json(t)) INTO v_monthly_data
  FROM (
    SELECT
      TO_CHAR(date_trunc('month', up.completed_at), 'Mon') as month,
      COUNT(*) as completions
    FROM user_progress up
    WHERE up.progress_type = 'lesson_completed' AND up.is_completed = true
      AND up.completed_at >= NOW() - INTERVAL '6 months'
    GROUP BY date_trunc('month', up.completed_at)
    ORDER BY date_trunc('month', up.completed_at)
  ) t;

  RETURN json_build_object(
    'success', true,
    'total_users', v_total_users,
    'active_users', v_active_users,
    'total_xp', v_total_xp_all,
    'total_lessons_completed', v_total_lessons_completed,
    'total_purchases', v_total_purchases,
    'total_coins_spent', v_total_coins_spent,
    'new_users_30d', v_new_users_30d,
    'monthly_completions', COALESCE(v_monthly_data, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 33. DADOS INICIAIS DE CONQUISTAS (se tabela estiver vazia)
-- ============================================================================
INSERT INTO achievements (title, description, icon, achievement_type, target_value, xp_reward)
SELECT * FROM (VALUES
  ('Primeiro Passo', 'Complete sua primeira aula', '🎯', 'lessons', 1, 50),
  ('Estudante Dedicado', 'Complete 10 aulas', '📚', 'lessons', 10, 100),
  ('Mestre do Conhecimento', 'Complete 50 aulas', '🎓', 'lessons', 50, 500),
  ('Quiz Master', 'Acerte 10 quizzes', '🧠', 'quizzes', 10, 100),
  ('Mente Brilhante', 'Acerte 50 quizzes', '💡', 'quizzes', 50, 300),
  ('Sequência de 7', 'Mantenha 7 dias seguidos', '🔥', 'streak', 7, 200),
  ('Sequência de 30', 'Mantenha 30 dias seguidos', '⚡', 'streak', 30, 1000),
  ('XP Hunter', 'Alcance 1000 XP', '⭐', 'xp_milestone', 1000, 150),
  ('XP Legend', 'Alcance 5000 XP', '🌟', 'xp_milestone', 5000, 500),
  ('Colecionador', 'Acumule 500 coins', '💰', 'coins', 500, 100)
) AS v(title, description, icon, achievement_type, target_value, xp_reward)
WHERE NOT EXISTS (SELECT 1 FROM achievements LIMIT 1);

-- ============================================================================
-- 34. DADOS INICIAIS DE MISSÕES DIÁRIAS (se tabela estiver vazia)
-- ============================================================================
INSERT INTO daily_missions (title, description, mission_type, target_value, xp_reward, coins_reward, difficulty_level)
SELECT * FROM (VALUES
  ('Estudante do Dia', 'Complete 1 aula hoje', 'complete_lessons', 1, 20, 5, 1),
  ('Maratonista', 'Complete 3 aulas hoje', 'complete_lessons', 3, 50, 15, 2),
  ('Quiz Rápido', 'Responda 3 quizzes', 'answer_quizzes', 3, 15, 5, 1),
  ('Expert em Quiz', 'Responda 10 quizzes', 'answer_quizzes', 10, 40, 10, 2),
  ('Ganhe XP', 'Ganhe 50 XP hoje', 'earn_xp', 50, 25, 10, 1),
  ('XP Master', 'Ganhe 200 XP hoje', 'earn_xp', 200, 60, 20, 3),
  ('Login Diário', 'Faça login hoje', 'login_daily', 1, 10, 5, 1)
) AS v(title, description, mission_type, target_value, xp_reward, coins_reward, difficulty_level)
WHERE NOT EXISTS (SELECT 1 FROM daily_missions LIMIT 1);

-- ============================================================================
-- 35. DADOS INICIAIS DE ITENS DA LOJA (se tabela estiver vazia)
-- ============================================================================
INSERT INTO store_items (name, title, description, icon, item_type, price, rarity, stock_quantity, purchase_limit)
SELECT * FROM (VALUES
  ('Avatar Dourado', 'Avatar Dourado', 'Moldura dourada para seu avatar', '👑', 'avatar', 100, 'rare', NULL, 1),
  ('Tema Escuro', 'Tema Escuro', 'Modo escuro exclusivo', '🌙', 'theme', 50, 'common', NULL, 1),
  ('Boost de XP', 'Boost de XP', 'Ganhe 2x XP por 24h', '⚡', 'boost', 200, 'epic', 10, 3),
  ('Badge VIP', 'Badge VIP', 'Badge exclusivo VIP', '⭐', 'decoration', 500, 'legendary', 5, 1),
  ('Emoji Pack', 'Emoji Pack', 'Pack de emojis exclusivos', '😎', 'special', 75, 'common', NULL, 1)
) AS v(name, title, description, icon, item_type, price, rarity, stock_quantity, purchase_limit)
WHERE NOT EXISTS (SELECT 1 FROM store_items LIMIT 1);

-- ============================================================================
-- 99. FIM DA MIGRAÇÃO
-- ============================================================================
-- Resumo:
-- - Criadas/ajustadas 17 tabelas
-- - Corrigido bug de double coin deduction na compra
-- - Corrigido variable shadowing em record_daily_activity
-- - Criada função get_my_ranking (ranking seguro para mobile)
-- - Criada função get_full_ranking (ranking completo para admin)
-- - Criada função get_admin_overview (dashboard real para admin)
-- - Criada função get_lesson_progress_detail (faltava)
-- - Criada tabela audit_log para auditoria
-- - Criada tabela franchise_units para gestão por franquia
-- - Adicionados dados iniciais de achievements, daily_missions e store_items
