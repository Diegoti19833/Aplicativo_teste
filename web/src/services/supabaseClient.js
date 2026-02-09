import { createClient } from '@supabase/supabase-js'

const ENV_URL = import.meta.env.VITE_SUPABASE_URL
const ENV_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const LS_URL_KEY = 'gamepop_supabase_url'
const LS_ANON_KEY = 'gamepop_supabase_anon_key'

let cachedClient = null

export const normalizeSupabaseUrl = (rawUrl) => {
  const raw = String(rawUrl || '').trim()
  if (!raw) return null

  let url = raw

  if (!/^https?:\/\//i.test(url)) {
    if (url.startsWith('//')) {
      url = `https:${url}`
    } else if (/^[a-z0-9-]+$/i.test(url)) {
      url = `https://${url}.supabase.co`
    } else {
      url = `https://${url}`
    }
  }

  let parsed
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('supabaseUrl inválida: use uma URL completa (https://xxxxx.supabase.co)')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('supabaseUrl inválida: precisa começar com http:// ou https://')
  }

  return parsed.toString().replace(/\/+$/, '')
}

const readLocal = (key) => {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

const writeLocal = (key, value) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    return
  }
}

export const isSupabaseConfigured = () => {
  const url = ENV_URL || readLocal(LS_URL_KEY)
  const key = ENV_ANON_KEY || readLocal(LS_ANON_KEY)
  try {
    return !!(normalizeSupabaseUrl(url) && key)
  } catch {
    return false
  }
}

export const saveSupabaseConfig = ({ url, anonKey }) => {
  if (url) writeLocal(LS_URL_KEY, normalizeSupabaseUrl(url))
  if (anonKey) writeLocal(LS_ANON_KEY, anonKey)
  cachedClient = null
}

export const getSupabase = () => {
  if (cachedClient) return cachedClient

  const url = ENV_URL || readLocal(LS_URL_KEY)
  const anonKey = ENV_ANON_KEY || readLocal(LS_ANON_KEY)
  if (!url || !anonKey) return null

  const normalizedUrl = normalizeSupabaseUrl(url)

  if (anonKey && !anonKey.startsWith('eyJ')) {
    console.warn('⚠️ AVISO: A chave anonKey configurada não parece um JWT válido (geralmente começa com "eyJ"). Verifique Project Settings > API > anon public key.')
  }

  cachedClient = createClient(normalizedUrl, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return cachedClient
}
