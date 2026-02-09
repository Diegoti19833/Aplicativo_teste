import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const useLessons = (trailId) => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (trailId) {
      fetchLessons();
    }
  }, [trailId, user]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar aulas da trilha
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('trail_id', trailId)
        .eq('is_active', true)
        .order('order_index');

      if (lessonsError) throw lessonsError;

      // Se usuário logado, buscar progresso
      if (user) {
        const lessonsWithProgress = await Promise.all(
          lessonsData.map(async (lesson) => {
            // Buscar progresso da aula
            const { data: progressData } = await supabase
              .from('user_progress')
              .select('*')
              .eq('user_id', user.id)
              .eq('lesson_id', lesson.id)
              .eq('progress_type', 'lesson_completed')
              .single();

            // Buscar progresso detalhado dos quizzes
            let lessonDetail = null;
            try {
              const { data: detailData } = await supabase
                .rpc('get_lesson_progress_detail', {
                  p_user_id: user.id,
                  p_lesson_id: lesson.id
                });
              lessonDetail = detailData;
            } catch (detailError) {
              console.log('Erro ao buscar detalhes da aula:', detailError);
            }

            return {
              ...lesson,
              completed: !!progressData,
              progress: progressData,
              quizProgress: lessonDetail || {
                total_quizzes: 0,
                completed_quizzes: 0,
                quiz_completion_percentage: 0,
                all_quizzes_completed: false,
                lesson_completed: !!progressData
              }
            };
          })
        );

        // Implementar lógica de desbloqueio sequencial
        const lessonsWithUnlockLogic = lessonsWithProgress.map((lesson, index) => {
          let isUnlocked = false;
          
          if (index === 0) {
            // Primeira lição sempre desbloqueada
            isUnlocked = true;
          } else {
            // Lições subsequentes só desbloqueiam se a anterior foi completada
            const previousLesson = lessonsWithProgress[index - 1];
            isUnlocked = previousLesson.completed;
          }

          return {
            ...lesson,
            isUnlocked
          };
        });

        setLessons(lessonsWithUnlockLogic);
      } else {
        // Para usuários não logados, apenas a primeira lição está desbloqueada
        setLessons(lessonsData.map((lesson, index) => ({
          ...lesson,
          completed: false,
          progress: null,
          quizProgress: {
            total_quizzes: 0,
            completed_quizzes: 0,
            quiz_completion_percentage: 0,
            all_quizzes_completed: false,
            lesson_completed: false
          },
          isUnlocked: index === 0
        })));
      }
    } catch (err) {
      console.error('Erro ao buscar aulas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const completeLesson = async (lessonId) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    try {
      const { data, error } = await supabase
        .rpc('complete_lesson', {
          user_id_param: user.id,
          lesson_id_param: lessonId
        });

      if (error) throw error;

      // Atualizar estado local e recalcular desbloqueios
      await refreshLessonProgress();

      return { success: true, data };
    } catch (err) {
      console.error('Erro ao completar aula:', err);
      return { success: false, error: err.message };
    }
  };

  // Função para verificar conclusão automática de aulas baseada nos quizzes
  const checkAutoCompletion = async (lessonId = null) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    try {
      const { data, error } = await supabase
        .rpc('force_check_lesson_completion', {
          p_user_id: user.id,
          p_lesson_id: lessonId
        });

      if (error) throw error;

      // Atualizar estado local após verificação
      await refreshLessonProgress();

      return { success: true, data };
    } catch (err) {
      console.error('Erro ao verificar conclusão automática:', err);
      return { success: false, error: err.message };
    }
  };

  // Função para atualizar o progresso das aulas
  const refreshLessonProgress = async () => {
    if (!user) return;

    try {
      const updatedLessons = await Promise.all(
        lessons.map(async (lesson) => {
          // Buscar progresso atualizado da aula
          const { data: progressData } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('lesson_id', lesson.id)
            .eq('progress_type', 'lesson_completed')
            .single();

          // Buscar progresso detalhado dos quizzes
          let lessonDetail = null;
          try {
            const { data: detailData } = await supabase
              .rpc('get_lesson_progress_detail', {
                p_user_id: user.id,
                p_lesson_id: lesson.id
              });
            lessonDetail = detailData;
          } catch (detailError) {
            console.log('Erro ao buscar detalhes da aula:', detailError);
          }

          return {
            ...lesson,
            completed: !!progressData,
            progress: progressData,
            quizProgress: lessonDetail || {
              total_quizzes: 0,
              completed_quizzes: 0,
              quiz_completion_percentage: 0,
              all_quizzes_completed: false,
              lesson_completed: !!progressData
            }
          };
        })
      );

      // Recalcular lógica de desbloqueio
      const lessonsWithUnlockLogic = updatedLessons.map((lesson, index) => {
        let isUnlocked = false;
        
        if (index === 0) {
          // Primeira lição sempre desbloqueada
          isUnlocked = true;
        } else {
          // Lições subsequentes só desbloqueiam se a anterior foi completada
          const previousLesson = updatedLessons[index - 1];
          isUnlocked = previousLesson.completed;
        }

        return {
          ...lesson,
          isUnlocked
        };
      });

      setLessons(lessonsWithUnlockLogic);
    } catch (err) {
      console.error('Erro ao atualizar progresso das aulas:', err);
    }
  };

  return {
    lessons,
    loading,
    error,
    refetch: fetchLessons,
    completeLesson,
    checkAutoCompletion,
    refreshLessonProgress,
  };
};