import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Alert } from 'react-native';

const InteractiveQuiz = ({ quiz, onAnswerSubmit, onNext, isLastQuiz }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [scaleAnim] = useState(new Animated.Value(1));

  const handleAnswerSelect = (optionIndex) => {
    if (showFeedback) return; // Não permitir mudança após feedback
    
    setSelectedAnswer(optionIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) {
      Alert.alert('Atenção', 'Por favor, selecione uma resposta antes de continuar.');
      return;
    }

    // Verificar se a resposta está correta
    const correct = selectedAnswer === quiz.correct_answer;
    setIsCorrect(correct);
    setShowFeedback(true);

    // Animação de feedback
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Chamar callback com resultado
    onAnswerSubmit({
      quizId: quiz.id,
      selectedAnswer: selectedAnswer,
      isCorrect: correct,
      explanation: quiz.explanation
    });
  };

  const handleNext = () => {
    // Animação de saída
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Reset para próxima pergunta
      setSelectedAnswer(null);
      setShowFeedback(false);
      setIsCorrect(false);
      fadeAnim.setValue(1);
      onNext();
    });
  };

  const getOptionStyle = (optionIndex) => {
    const baseStyle = [styles.option];
    
    if (showFeedback) {
      if (optionIndex === quiz.correct_answer) {
        // Resposta correta sempre verde
        baseStyle.push(styles.optionCorrect);
      } else if (optionIndex === selectedAnswer && !isCorrect) {
        // Resposta selecionada incorreta em vermelho
        baseStyle.push(styles.optionIncorrect);
      } else {
        // Outras opções ficam desabilitadas
        baseStyle.push(styles.optionDisabled);
      }
    } else if (selectedAnswer === optionIndex) {
      // Opção selecionada (antes do feedback)
      baseStyle.push(styles.optionSelected);
    }
    
    return baseStyle;
  };

  const getOptionTextStyle = (optionIndex) => {
    const baseStyle = [styles.optionText];
    
    if (showFeedback) {
      if (optionIndex === quiz.correct_answer) {
        baseStyle.push(styles.optionTextCorrect);
      } else if (optionIndex === selectedAnswer && !isCorrect) {
        baseStyle.push(styles.optionTextIncorrect);
      } else {
        baseStyle.push(styles.optionTextDisabled);
      }
    } else if (selectedAnswer === optionIndex) {
      baseStyle.push(styles.optionTextSelected);
    }
    
    return baseStyle;
  };

  const parseOptions = (options) => {
    if (Array.isArray(options)) {
      return options;
    }
    
    if (typeof options === 'string') {
      try {
        return JSON.parse(options);
      } catch (error) {
        console.error('❌ [parseOptions] Erro ao parsear string JSON:', error);
        return [];
      }
    }
    
    return [];
  };

  const options = parseOptions(quiz.options || []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.questionContainer}>
        <Text style={styles.questionNumber}>
          Pergunta {quiz.order_index || 1}
        </Text>
        <Text style={styles.question}>{quiz.question}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {options.map((option, index) => (
          <Pressable
            key={index}
            style={getOptionStyle(index)}
            onPress={() => handleAnswerSelect(index)}
            disabled={showFeedback}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionIndicator}>
                <Text style={styles.optionLetter}>
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>
              <Text style={getOptionTextStyle(index)}>
                {option}
              </Text>
            </View>
            
            {showFeedback && index === quiz.correct_answer && (
              <Text style={styles.correctIcon}>✓</Text>
            )}
            {showFeedback && index === selectedAnswer && !isCorrect && (
              <Text style={styles.incorrectIcon}>✗</Text>
            )}
          </Pressable>
        ))}
      </View>

      {showFeedback && (
        <View style={[styles.feedbackContainer, isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect]}>
          <Text style={styles.feedbackTitle}>
            {isCorrect ? '🎉 Correto!' : '❌ Incorreto'}
          </Text>
          <Text style={styles.feedbackExplanation}>
            {quiz.explanation}
          </Text>
          {isCorrect && (
            <Text style={styles.xpReward}>
              +{quiz.xp_reward || 10} XP
            </Text>
          )}
        </View>
      )}

      <View style={styles.buttonContainer}>
        {!showFeedback ? (
          <Pressable
            style={[
              styles.submitButton,
              selectedAnswer === null && styles.submitButtonDisabled
            ]}
            onPress={handleSubmitAnswer}
            disabled={selectedAnswer === null}
          >
            <Text style={styles.submitButtonText}>Confirmar Resposta</Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {isLastQuiz ? 'Finalizar Aula' : 'Próxima Pergunta'}
            </Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  questionContainer: {
    marginBottom: 30,
  },
  questionNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    fontWeight: '600',
  },
  question: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 28,
  },
  optionsContainer: {
    marginBottom: 30,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  optionCorrect: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
  },
  optionIncorrect: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  optionDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetter: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    lineHeight: 22,
  },
  optionTextSelected: {
    color: '#2196f3',
    fontWeight: '600',
  },
  optionTextCorrect: {
    color: '#4caf50',
    fontWeight: '600',
  },
  optionTextIncorrect: {
    color: '#f44336',
    fontWeight: '600',
  },
  optionTextDisabled: {
    color: '#999',
  },
  correctIcon: {
    fontSize: 20,
    color: '#4caf50',
    fontWeight: 'bold',
  },
  incorrectIcon: {
    fontSize: 20,
    color: '#f44336',
    fontWeight: 'bold',
  },
  feedbackContainer: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  feedbackCorrect: {
    backgroundColor: '#e8f5e8',
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  feedbackIncorrect: {
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  feedbackExplanation: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  xpReward: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff9800',
  },
  buttonContainer: {
    marginTop: 'auto',
  },
  submitButton: {
    backgroundColor: '#2196f3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InteractiveQuiz;