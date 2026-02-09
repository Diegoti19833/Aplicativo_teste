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
    getAdminDashboard: async () => {
      const supabase = requireSupabase()
      const { data, error } = await supabase.rpc('get_admin_overview')
      if (error) throw error
      return data
    },
  },

  ranking: {
    getFull: async ({ limit = 50, offset = 0, franchiseId } = {}) => {
      const supabase = requireSupabase()
      const params = { limit_param: limit, offset_param: offset }
      if (franchiseId) params.franchise_filter = franchiseId
      const { data, error } = await supabase.rpc('get_full_ranking', params)
      if (error) throw error
      return data
    },
  },

  storeItems: {
    list: async () => {
      const supabase = requireSupabase()
      const { data, error } = await supabase
        .from('store_items')
        .select('*')
        .order('order_index')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    create: async ({ name, description, icon, itemType, price, rarity, stockQuantity, purchaseLimit }) => {
      const supabase = requireSupabase()
      const payload = {
        name,
        title: name,
        description: description || null,
        icon: icon || '🎁',
        item_type: itemType || 'cosmetic',
        price: safeNumber(price, 10),
        rarity: rarity || 'common',
        stock_quantity: stockQuantity != null ? safeNumber(stockQuantity, null) : null,
        purchase_limit: safeNumber(purchaseLimit, 1),
        is_available: true,
      }
      const { data, error } = await supabase.from('store_items').insert(payload).select().single()
      if (error) throw error
      return data
    },
    update: async ({ id, ...updates }) => {
      const supabase = requireSupabase()
      const payload = {}
      if (updates.name !== undefined) { payload.name = updates.name; payload.title = updates.name; }
      if (updates.description !== undefined) payload.description = updates.description
      if (updates.price !== undefined) payload.price = safeNumber(updates.price, 10)
      if (updates.stockQuantity !== undefined) payload.stock_quantity = updates.stockQuantity
      if (updates.isAvailable !== undefined) payload.is_available = !!updates.isAvailable
      if (updates.icon !== undefined) payload.icon = updates.icon
      const { data, error } = await supabase.from('store_items').update(payload).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    remove: async ({ id }) => {
      const supabase = requireSupabase()
      const { error } = await supabase.from('store_items').delete().eq('id', id)
      if (error) throw error
    },
    setAvailable: async ({ id, isAvailable }) => {
      const supabase = requireSupabase()
      const { data, error } = await supabase
        .from('store_items')
        .update({ is_available: !!isAvailable })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
  },

  purchases: {
    list: async ({ userId, fromIso, toIso } = {}) => {
      const supabase = requireSupabase()
      let query = supabase
        .from('user_purchases')
        .select('*, user:users(id,name,email), item:store_items(id,name,title,icon,price)')
        .order('purchase_date', { ascending: false })
      if (userId) query = query.eq('user_id', userId)
      if (fromIso) query = query.gte('purchase_date', fromIso)
      if (toIso) query = query.lte('purchase_date', toIso)
      const { data, error } = await query
      if (error) throw error
      return data || []
    },
  },

  missions: {
    list: async () => {
      const supabase = requireSupabase()
      const { data, error } = await supabase
        .from('daily_missions')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    create: async ({ title, description, missionType, targetValue, xpReward, coinsReward, difficultyLevel }) => {
      const supabase = requireSupabase()
      const payload = {
        title,
        description: description || null,
        mission_type: missionType,
        target_value: safeNumber(targetValue, 1),
        xp_reward: safeNumber(xpReward, 20),
        coins_reward: safeNumber(coinsReward, 5),
        difficulty_level: safeNumber(difficultyLevel, 1),
        is_active: true,
      }
      const { data, error } = await supabase.from('daily_missions').insert(payload).select().single()
      if (error) throw error
      return data
    },
    setActive: async ({ id, isActive }) => {
      const supabase = requireSupabase()
      const { data, error } = await supabase
        .from('daily_missions')
        .update({ is_active: !!isActive })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    remove: async ({ id }) => {
      const supabase = requireSupabase()
      const { error } = await supabase.from('daily_missions').delete().eq('id', id)
      if (error) throw error
    },
  },

  trails: {
    ...(() => {
      // This is a workaround to avoid redefining the trails namespace.
      // The actual trails object is defined above and this block extends it.
      return {}
    })(),
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
    update: async ({ id, title, description, levelLabel, estimatedMinutes, color, isActive }) => {
      const supabase = requireSupabase()
      const payload = {}
      if (title !== undefined) payload.title = title
      if (description !== undefined) payload.description = description
      if (levelLabel !== undefined) payload.difficulty_level = difficultyFromLabel(levelLabel)
      if (estimatedMinutes !== undefined) payload.estimated_duration = safeNumber(estimatedMinutes, 60)
      if (color !== undefined) payload.color = color
      if (isActive !== undefined) payload.is_active = !!isActive
      const { data, error } = await supabase.from('trails').update(payload).eq('id', id).select().single()
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
}
