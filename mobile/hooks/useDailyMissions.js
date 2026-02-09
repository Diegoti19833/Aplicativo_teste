import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useDailyMissions() {
  const { user } = useAuth()
  const [missions, setMissions] = useState([])
  const [userMissions, setUserMissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDailyMissions = async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar todas as missões diárias ativas
      const { data: missionsData, error: missionsError } = await supabase
        .from('daily_missions')
        .select('*')
        .eq('is_active', true)
        .order('xp_reward', { ascending: true })

      if (missionsError) throw missionsError

      setMissions(missionsData || [])

      // Se o usuário estiver logado, buscar suas missões de hoje
      if (user) {
        const today = new Date().toISOString().split('T')[0]
        
        const { data: userMissionsData, error: userMissionsError } = await supabase
          .from('user_daily_missions')
          .select(`
            *,
            mission:daily_missions(*)
          `)
          .eq('user_id', user.id)
          .eq('date', today)

        if (userMissionsError) throw userMissionsError

        setUserMissions(userMissionsData || [])
      }
    } catch (err) {
      console.error('Erro ao buscar missões diárias:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateMissionProgress = async (missionType, increment = 1) => {
    if (!user) return { success: false, error: 'Usuário não logado' }

    try {
      const { data, error } = await supabase.rpc('update_daily_mission_progress', {
        p_user_id: user.id,
        p_mission_type: missionType,
        p_increment: increment
      })

      if (error) throw error

      // Atualizar a lista de missões do usuário
      await fetchDailyMissions()

      return { success: true, data }
    } catch (err) {
      console.error('Erro ao atualizar progresso da missão:', err)
      return { success: false, error: err.message }
    }
  }

  const getMissionProgress = (missionId) => {
    const userMission = userMissions.find(um => um.mission_id === missionId)
    return userMission ? userMission.progress : 0
  }

  const isMissionCompleted = (missionId) => {
    const userMission = userMissions.find(um => um.mission_id === missionId)
    return userMission ? userMission.completed : false
  }

  const getCompletedMissionsCount = () => {
    return userMissions.filter(um => um.completed).length
  }

  const getTotalXpFromCompletedMissions = () => {
    return userMissions
      .filter(um => um.completed)
      .reduce((total, um) => total + (um.mission?.xp_reward || 0), 0)
  }

  // Função para marcar missão como completa (quando o progresso atinge o objetivo)
  const completeMission = async (missionId) => {
    if (!user) return { success: false, error: 'Usuário não logado' }

    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('user_daily_missions')
        .update({ 
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('mission_id', missionId)
        .eq('date', today)

      if (error) throw error

      // Atualizar a lista de missões
      await fetchDailyMissions()

      return { success: true, data }
    } catch (err) {
      console.error('Erro ao completar missão:', err)
      return { success: false, error: err.message }
    }
  }

  useEffect(() => {
    fetchDailyMissions()
  }, [user])

  return {
    missions,
    userMissions,
    loading,
    error,
    updateMissionProgress,
    getMissionProgress,
    isMissionCompleted,
    getCompletedMissionsCount,
    getTotalXpFromCompletedMissions,
    completeMission,
    refetch: fetchDailyMissions
  }
}