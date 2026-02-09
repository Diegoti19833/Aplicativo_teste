import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useAchievements() {
  const { user } = useAuth()
  const [achievements, setAchievements] = useState([])
  const [userAchievements, setUserAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAchievements = async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar todas as conquistas
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('xp_reward', { ascending: true })

      if (achievementsError) throw achievementsError

      setAchievements(achievementsData || [])

      // Se o usuário estiver logado, buscar suas conquistas
      if (user) {
        const { data: userAchievementsData, error: userAchievementsError } = await supabase
          .from('user_achievements')
          .select(`
            *,
            achievement:achievements(*)
          `)
          .eq('user_id', user.id)

        if (userAchievementsError) throw userAchievementsError

        setUserAchievements(userAchievementsData || [])
      }
    } catch (err) {
      console.error('Erro ao buscar conquistas:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const checkAchievement = async (achievementId) => {
    if (!user) return { success: false, error: 'Usuário não logado' }

    try {
      const { data, error } = await supabase.rpc('check_achievement', {
        p_user_id: user.id,
        p_achievement_id: achievementId
      })

      if (error) throw error

      // Atualizar a lista de conquistas do usuário
      await fetchAchievements()

      return { success: true, data }
    } catch (err) {
      console.error('Erro ao verificar conquista:', err)
      return { success: false, error: err.message }
    }
  }

  const getAchievementProgress = (achievement) => {
    if (!user || !achievement) return 0

    const userAchievement = userAchievements.find(
      ua => ua.achievement_id === achievement.id
    )

    if (userAchievement) {
      return userAchievement.progress || 0
    }

    return 0
  }

  const isAchievementUnlocked = (achievementId) => {
    return userAchievements.some(
      ua => ua.achievement_id === achievementId && ua.unlocked_at
    )
  }

  useEffect(() => {
    fetchAchievements()
  }, [user])

  return {
    achievements,
    userAchievements,
    loading,
    error,
    checkAchievement,
    getAchievementProgress,
    isAchievementUnlocked,
    refetch: fetchAchievements
  }
}