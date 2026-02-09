import { getSupabase } from './supabaseClient'

const normalizeRole = (role) => {
  if (!role) return null
  const r = String(role).trim().toLowerCase()
  if (r === 'funcionário') return 'funcionario'
  if (r === 'gerente') return 'gerente'
  if (r === 'caixa') return 'caixa'
  if (r === 'admin') return 'admin'
  return r
}

const normalizeLessonType = (type) => {
  if (!type) return 'text'
  const t = String(type).trim().toLowerCase()
  if (t === 'vídeo') return 'video'
  if (t === 'video') return 'video'
  if (t === 'texto') return 'text'
  return t
}

const difficultyFromLabel = (label) => {
  const v = String(label || '').toLowerCase()
  if (v.includes('avanç')) return 5
  if (v.includes('inter')) return 3
  return 1
}

const safeNumber = (value, fallback) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const requireSupabase = () => {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY')
  return supabase
}

export const AdminDb = {
  auth: {
    getSession: async () => {
      const supabase = requireSupabase()
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      return data.session
    },
    signInWithPassword: async ({ email, password }) => {
      const supabase = requireSupabase()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return data
    },
    signUp: async ({ email, password, name }) => {
      const supabase = requireSupabase()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: name ? { name } : undefined,
        },
      })
      if (error) throw error
      return data
    },
    signOut: async () => {
      const supabase = requireSupabase()
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
    ensureUserRow: async () => {
      const supabase = requireSupabase()
      const { data, error } = await supabase.auth.getUser()
      if (error) throw error
      const user = data.user
      if (!user) return null

      const email = user.email || ''
      const nameFromMeta = user.user_metadata?.name
      const nameFallback = email ? email.split('@')[0] : 'Usuário'

      const bootstrapEmail = import.meta.env.VITE_BOOTSTRAP_ADMIN_EMAIL
      const shouldBootstrapAdmin =
        bootstrapEmail &&
        email &&
        String(email).toLowerCase() === String(bootstrapEmail).toLowerCase()

      const row = {
        id: user.id,
        email,
        name: nameFromMeta || nameFallback,
        ...(shouldBootstrapAdmin ? { role: 'admin' } : {}),
        is_active: true,
      }

      const { error: upsertError } = await supabase.from('users').upsert(row, { onConflict: 'id' })
      if (upsertError) throw upsertError

      return row
    },
    getMyProfile: async () => {
      const supabase = requireSupabase()
      const { data, error } = await supabase.auth.getUser()
      if (error) throw error
      const user = data.user
      if (!user) return null

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id,email,name,role,is_active,total_xp,current_streak,created_at')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) throw profileError
      return profile
    },
  },

  trails: {
    list: async () => {
      const supabase = requireSupabase()
      const { data, error } = await supabase
        .from('trails')
        .select(
          'id,title,description,color,difficulty_level,estimated_duration,total_lessons,is_active,order_index,created_at,updated_at'
        )
        .order('order_index')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    create: async ({ title, description, levelLabel, estimatedMinutes, color }) => {
      const supabase = requireSupabase()
      const payload = {
        title,
        description: description || null,
        difficulty_level: difficultyFromLabel(levelLabel),
        estimated_duration: safeNumber(estimatedMinutes, 60),
        color: color || '#3B82F6',
        is_active: true,
      }
      const { data, error } = await supabase.from('trails').insert(payload).select().single()
      if (error) throw error
      return data
    },
    setActive: async ({ id, isActive }) => {
      const supabase = requireSupabase()
      const { data, error } = await supabase
        .from('trails')
        .update({ is_active: !!isActive })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    remove: async ({ id }) => {
      const supabase = requireSupabase()
      const { error } = await supabase.from('trails').delete().eq('id', id)
      if (error) throw error
    },
  },

  lessons: {
    listByTrail: async ({ trailId }) => {
      const supabase = requireSupabase()
      const { data, error } = await supabase
        .from('lessons')
        .select(
          'id,trail_id,title,description,content,video_url,duration,xp_reward,order_index,is_active,lesson_type,created_at,updated_at'
        )
        .eq('trail_id', trailId)
        .order('order_index')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    create: async ({ trailId, title, type, contentOrUrl, durationMinutes }) => {
      const supabase = requireSupabase()
      const lessonType = normalizeLessonType(type)
      const { data: last, error: lastError } = await supabase
        .from('lessons')
        .select('order_index')
        .eq('trail_id', trailId)
        .order('order_index', { ascending: false })
        .limit(1)

      if (lastError) throw lastError

      const orderIndex = (last && last[0] ? safeNumber(last[0].order_index, 0) : 0) + 1

      const payload = {
        trail_id: trailId,
        title,
        lesson_type: lessonType,
        duration: safeNumber(durationMinutes, 15),
        order_index: orderIndex,
        is_active: true,
        ...(lessonType === 'video'
          ? { video_url: contentOrUrl || null, content: null }
          : { content: contentOrUrl || null, video_url: null }),
      }

      const { data, error } = await supabase.from('lessons').insert(payload).select().single()
      if (error) throw error
      return data
    },
    setActive: async ({ id, isActive }) => {
      const supabase = requireSupabase()
      const { data, error } = await supabase
        .from('lessons')
        .update({ is_active: !!isActive })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    remove: async ({ id }) => {
      const supabase = requireSupabase()
      const { error } = await supabase.from('lessons').delete().eq('id', id)
      if (error) throw error
    },
  },

  users: {
    list: async ({ search, role, isActive } = {}) => {
      const supabase = requireSupabase()
      let query = supabase
        .from('users')
        .select('id,email,name,role,total_xp,current_streak,is_active,created_at')
        .order('total_xp', { ascending: false })
        .order('created_at', { ascending: false })

      const q = String(search || '').trim()
      if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`)

      const normalizedRole = normalizeRole(role)
      if (normalizedRole && normalizedRole !== 'todas as funções') query = query.eq('role', normalizedRole)

      if (typeof isActive === 'boolean') query = query.eq('is_active', isActive)

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    create: async ({ name, email, role }) => {
      const supabase = requireSupabase()
      const payload = {
        name,
        email,
        role: normalizeRole(role) || 'funcionario',
        is_active: true,
      }
      const { data, error } = await supabase.from('users').insert(payload).select().single()
      if (error) throw error
      return data
    },
    setActive: async ({ id, isActive }) => {
      const supabase = requireSupabase()
      const { data, error } = await supabase
        .from('users')
        .update({ is_active: !!isActive })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    setRole: async ({ id, role }) => {
      const supabase = requireSupabase()
      const { data, error } = await supabase
        .from('users')
        .update({ role: normalizeRole(role) })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
  },

  settings: {
    get: async () => {
      const supabase = requireSupabase()
      const { data, error } = await supabase.from('app_settings').select('*').eq('key', 'default').maybeSingle()
      if (error) throw error
      return data || null
    },
    save: async (settings) => {
      const supabase = requireSupabase()
      const payload = {
        key: 'default',
        company_name: settings.companyName,
        primary_color: settings.primaryColor,
        secondary_color: settings.secondaryColor,
        daily_xp_limit: safeNumber(settings.dailyXpLimit, 1000),
        global_ranking: !!settings.globalRanking,
        sound_enabled: !!settings.soundEnabled,
      }
      const { data, error } = await supabase.from('app_settings').upsert(payload, { onConflict: 'key' }).select().single()
      if (error) throw error
      return data
    },
  },

  reports: {
    getOverview: async ({ fromIso, toIso } = {}) => {
      const supabase = requireSupabase()
      const usersQuery = supabase.from('users').select('id', { count: 'exact', head: true })
      const activeUsersQuery = supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_active', true)

      let progressQuery = supabase
        .from('user_progress')
        .select('id,progress_type,completed_at,created_at', { count: 'exact' })
        .eq('progress_type', 'lesson_completed')

      if (fromIso) progressQuery = progressQuery.gte('completed_at', fromIso)
      if (toIso) progressQuery = progressQuery.lte('completed_at', toIso)

      const [{ count: usersCount, error: usersError }, { count: activeCount, error: activeError }, progressResult] =
        await Promise.all([usersQuery, activeUsersQuery, progressQuery])

      if (usersError) throw usersError
      if (activeError) throw activeError
      if (progressResult.error) throw progressResult.error

      return {
        usersCount: usersCount || 0,
        activeUsersCount: activeCount || 0,
        lessonsCompletedCount: progressResult.count || 0,
        lessonCompletedRows: progressResult.data || [],
      }
    },
  },
}
