import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  Vibration
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useQuizSounds } from '../hooks/useQuizSounds';

const { width, height } = Dimensions.get('window');

const QuizGame = ({ quizzes, onComplete, onQuizComplete, user }) => {
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [sessionXP, setSessionXP] = useState(0); // XP acumulado na sessão atual
  const [userTotalXP, setUserTotalXP] = useState(0); // XP total do usuário
  const [quizResults, setQuizResults] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hook de sons
  const { playCorrectSound, playIncorrectSound } = useQuizSounds();

  // Animações
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const xpAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  const currentQuiz = quizzes[currentQuizIndex];
  const progress = ((currentQuizIndex + 1) / quizzes.length) * 100;

  // Carregar XP total do usuário ao iniciar
  useEffect(() => {
    loadUserTotalXP();
  }, [user]);

  // Função para carregar XP total do usuário
  const loadUserTotalXP = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_user_dashboard', { user_id_param: user.id });
      
      if (error) throw error;
      
      if (data?.user?.xp_total) {
        setUserTotalXP(data.user.xp_total);
      }
    } catch (error) {
      console.error('Erro ao carregar XP total do usuário:', error);
    }
  };

  useEffect(() => {
    // Animar entrada da pergunta
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [currentQuizIndex]);

  const parseOptions = (options) => {
    if (Array.isArray(options)) {
      return options;
    }
    
    if (typeof options === 'string') {
      try {
        return JSON.parse(options);
      } catch (error) {
        console.error('❌ [QuizGame] Erro ao parsear opções:', error);
        return [];
      }
    }
    
    return [];
  };

  const handleOptionSelect = (optionIndex) => {
    if (showResult || isSubmitting) return;
    
    setSelectedOption(optionIndex);
    
    // Animação de seleção
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const submitAnswer = async () => {
    if (selectedOption === null || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Verificar resposta localmente usando a estrutura antiga
      const isCorrect = selectedOption === currentQuiz.correct_answer;
      const xp = isCorrect ? currentQuiz.xp_reward : 0;

      // Registrar tentativa no banco - tentativa simples primeiro
      let attemptData, attemptError;
      
      try {
         // Tentar inserção com selected_answer (estrutura real do banco)
         const result = await supabase
           .from('quiz_attempts')
           .insert({
             user_id: user.id,
             quiz_id: currentQuiz.id,
             selected_answer: selectedOption, // Índice da opção selecionada (0-3)
             is_correct: isCorrect,
             xp_earned: xp,
             attempt_number: 1
           })
           .select()
           .single();
        
        attemptData = result.data;
        attemptError = result.error;
      } catch (error) {
        attemptError = error;
      }

      if (attemptError) throw attemptError;

      // Atualizar estados locais
      setIsCorrect(isCorrect);
      setXpEarned(xp);
      
      // Acumular XP da sessão
      if (xp > 0) {
        setSessionXP(prev => prev + xp);
        
        // Recarregar XP total do usuário do banco (sincronização)
        setTimeout(async () => {
          try {
            const { data, error } = await supabase.rpc('get_user_dashboard', { user_id: user.id });
            if (!error && data?.user?.xp_total !== undefined) {
              setUserTotalXP(data.user.xp_total);
            }
          } catch (error) {
            console.error('Erro ao sincronizar XP total:', error);
          }
        }, 500); // Aguardar 500ms para o trigger processar
      }
      
      setShowResult(true);

      // Adicionar resultado ao array
      setQuizResults(prev => [...prev, {
        quizId: currentQuiz.id,
        correct: isCorrect,
        xpEarned: xp,
        selectedOption
      }]);

      // Feedback de som e vibração
      if (isCorrect) {
        playCorrectSound(); // Som de acerto
        Vibration.vibrate([0, 100, 50, 100]); // Padrão de sucesso
        // Animação de confete
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      } else {
        playIncorrectSound(); // Som de erro
        Vibration.vibrate(200); // Vibração de erro
      }

      // Animação de XP
      if (xp > 0) {
        Animated.timing(xpAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }

      // Callback para quiz individual
      if (onQuizComplete) {
        onQuizComplete(currentQuiz.id, isCorrect, xp);
      }

    } catch (error) {
      console.error('Erro ao submeter resposta:', error);
      Alert.alert('Erro', 'Não foi possível submeter a resposta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextQuestion = () => {
    if (currentQuizIndex < quizzes.length - 1) {
      // Próxima pergunta
      setCurrentQuizIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowResult(false);
      setXpEarned(0); // Reset apenas o XP da pergunta atual
      
      // Reset animações
      slideAnim.setValue(0);
      xpAnim.setValue(0);
      confettiAnim.setValue(0);
      
    } else {
      // Quiz completo - enviar XP total da sessão
      if (onComplete) {
        onComplete(quizResults, sessionXP); // Usar sessionXP em vez de totalXP
      }
    }
  };

  const getOptionStyle = (optionIndex) => {
    if (!showResult) {
      return selectedOption === optionIndex ? styles.optionSelected : styles.option;
    }
    
    // Mostrar resultado
    if (optionIndex === currentQuiz.correct_answer_index) {
      return styles.optionCorrect;
    } else if (selectedOption === optionIndex && !isCorrect) {
      return styles.optionIncorrect;
    }
    
    return styles.option;
  };

  const renderConfetti = () => {
    if (!isCorrect || confettiAnim._value === 0) return null;

    const confettiPieces = Array.from({ length: 20 }, (_, i) => (
      <Animated.View
        key={i}
        style={[
          styles.confettiPiece,
          {
            left: Math.random() * width,
            backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][Math.floor(Math.random() * 5)],
            transform: [
              {
                translateY: confettiAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, height + 50],
                }),
              },
              {
                rotate: confettiAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      />
    ));

    return <View style={styles.confettiContainer}>{confettiPieces}</View>;
  };

  if (!currentQuiz) return null;

  const options = parseOptions(currentQuiz.options);

  return (
    <View style={styles.container}>
      {/* Barra de Progresso */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentQuizIndex + 1} de {quizzes.length}
        </Text>
      </View>

      {/* Pergunta */}
      <Animated.View
        style={[
          styles.questionContainer,
          {
            opacity: slideAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.questionText}>{currentQuiz.question}</Text>
      </Animated.View>

      {/* Opções */}
      <View style={styles.optionsContainer}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={getOptionStyle(index)}
            onPress={() => handleOptionSelect(index)}
            disabled={showResult || isSubmitting}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Feedback de Resultado */}
      {showResult && (
        <Animated.View style={[styles.resultContainer, { opacity: xpAnim }]}>
          <Text style={[styles.resultText, isCorrect ? styles.correctText : styles.incorrectText]}>
            {isCorrect ? '🎉 Correto!' : '❌ Incorreto'}
          </Text>
          {xpEarned > 0 && (
            <Text style={styles.xpText}>+{xpEarned} XP</Text>
          )}
        </Animated.View>
      )}

      {/* Botão de Ação */}
      <View style={styles.actionContainer}>
        {!showResult ? (
          <TouchableOpacity
            style={[
              styles.submitButton,
              selectedOption !== null ? styles.submitButtonActive : styles.submitButtonDisabled
            ]}
            onPress={submitAnswer}
            disabled={selectedOption === null || isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Enviando...' : 'Confirmar'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={nextQuestion}
          >
            <Text style={styles.nextButtonText}>
              {currentQuizIndex < quizzes.length - 1 ? 'Próxima' : 'Finalizar'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* XP Total e Sessão */}
      <View style={styles.xpInfoContainer}>
        <View style={styles.totalXPContainer}>
          <Text style={styles.totalXPText}>XP Total: {userTotalXP}</Text>
        </View>
        {sessionXP > 0 && (
          <View style={styles.sessionXPContainer}>
            <Text style={styles.sessionXPText}>XP desta sessão: +{sessionXP}</Text>
          </View>
        )}
      </View>

      {/* Confete */}
      {renderConfetti()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28A745',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  questionContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    textAlign: 'center',
    lineHeight: 28,
  },
  optionsContainer: {
    flex: 1,
  },
  option: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  optionCorrect: {
    backgroundColor: '#E8F5E8',
    borderColor: '#28A745',
    borderWidth: 2,
  },
  optionIncorrect: {
    backgroundColor: '#FFEBEE',
    borderColor: '#DC3545',
    borderWidth: 2,
  },
  optionText: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
    textAlign: 'center',
  },
  resultContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  resultText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  correctText: {
    color: '#28A745',
  },
  incorrectText: {
    color: '#DC3545',
  },
  xpText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  actionContainer: {
    paddingVertical: 20,
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonActive: {
    backgroundColor: '#007BFF',
  },
  submitButtonDisabled: {
    backgroundColor: '#6C757D',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#28A745',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  xpInfoContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    alignItems: 'flex-end',
  },
  totalXPContainer: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  totalXPText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sessionXPContainer: {
    backgroundColor: '#28A745',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  sessionXPText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default QuizGame;
