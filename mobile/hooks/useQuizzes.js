import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const useQuizzes = (lessonId) => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (lessonId) {
      fetchQuizzes();
    }
  }, [lessonId, user]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar quizzes da aula
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index');

      if (quizzesError) throw quizzesError;

      // Se usuário logado, buscar tentativas
      if (user) {
        const quizzesWithAttempts = await Promise.all(
          quizzesData.map(async (quiz) => {
            const { data: attemptData } = await supabase
              .from('quiz_attempts')
              .select('*')
              .eq('user_id', user.id)
              .eq('quiz_id', quiz.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            return {
              ...quiz,
              lastAttempt: attemptData,
              answered: !!attemptData,
              correct: attemptData?.is_correct || false
            };
          })
        );

        setQuizzes(quizzesWithAttempts);
      } else {
        setQuizzes(quizzesData.map(quiz => ({
          ...quiz,
          lastAttempt: null,
          answered: false,
          correct: false
        })));
      }
    } catch (err) {
      console.error('Erro ao buscar quizzes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const answerQuiz = async (quizId, selectedOption) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    try {
      const { data, error } = await supabase
        .rpc('answer_quiz', {
          user_id_param: user.id,
          quiz_id_param: quizId,
          selected_option_param: selectedOption
        });

      if (error) throw error;

      // Atualizar estado local
      setQuizzes(prev => prev.map(quiz => 
        quiz.id === quizId 
          ? { 
              ...quiz, 
              answered: true, 
              correct: data.is_correct,
              lastAttempt: data 
            }
          : quiz
      ));

      return { success: true, data };
    } catch (err) {
      console.error('Erro ao responder quiz:', err);
      return { success: false, error: err.message };
    }
  };

  const submitQuizAnswer = async (quizId, selectedOptionId) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    try {
      const { data, error } = await supabase
        .rpc('submit_quiz_answer', {
          user_id_param: user.id,
          quiz_id_param: quizId,
          selected_option_param: selectedOptionId
        });

      if (error) throw error;

      // Atualizar estado local
      setQuizzes(prev => prev.map(quiz => 
        quiz.id === quizId 
          ? { 
              ...quiz, 
              answered: true, 
              correct: data.is_correct,
              lastAttempt: data 
            }
          : quiz
      ));

      return { success: true, data };
    } catch (err) {
      console.error('Erro ao submeter resposta do quiz:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    quizzes,
    loading,
    error,
    refetch: fetchQuizzes,
    answerQuiz,
    submitQuizAnswer,
  };
};