import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, Modal, ActivityIndicator,
    Animated, Easing, StyleSheet, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

const ARCHETYPE_COLORS = {
    'especialista': ['#2563EB', '#3B82F6'], // Azuis
    'encantador': ['#EC4899', '#F472B6'],   // Rosas
    'estrategista': ['#8B5CF6', '#A855F7'], // Roxos
    'agil': ['#F59E0B', '#FBBF24'],         // Amarelo/Laranja
    'default': ['#129151', '#34D399']       // Verdes
};

export default function PlayerProfileQuiz({ visible, onClose, onComplete }) {
    const { user } = useAuth();

    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const [result, setResult] = useState(null); // The archetype object

    // Animations
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(50));
    const [progressAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible && questions.length === 0 && !result) {
            loadQuestions();
        }
    }, [visible]);

    useEffect(() => {
        if (questions.length > 0 && !result) {
            // Animate progress bar
            Animated.timing(progressAnim, {
                toValue: (currentIndex + 1) / questions.length,
                duration: 300,
                useNativeDriver: false, // width/height can't use native driver
            }).start();

            // Animate question entry
            fadeAnim.setValue(0);
            slideAnim.setValue(30);
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true })
            ]).start();
        }
    }, [currentIndex, questions, result]);

    const loadQuestions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_player_quiz_questions');
            if (error) throw error;
            if (data && data.length > 0) {
                setQuestions(data);
            } else {
                // Fallback if no questions
                onClose();
            }
        } catch (err) {
            console.log('Error loading quiz:', err);
            // Fail gracefully
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOption = (optionId) => {
        if (submitting) return; // Prevent double clicks

        const newAnswers = [...answers, optionId];

        if (currentIndex < questions.length - 1) {
            setAnswers(newAnswers);
            // Wait a tiny bit before advancing for UX
            setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
        } else {
            // Last question!
            submitQuiz(newAnswers);
        }
    };

    const submitQuiz = async (finalAnswers) => {
        setSubmitting(true);
        try {
            const { data, error } = await supabase.rpc('submit_player_profile_quiz', {
                p_user_id: user.id,
                p_answers: finalAnswers
            });
            if (error) throw error;

            // Reveal Result
            setResult(data);

            // Animate result entry
            fadeAnim.setValue(0);
            slideAnim.setValue(50);
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 800, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true })
            ]).start();

        } catch (err) {
            console.log('Error submitting profile quiz', err);
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    const handleFinish = () => {
        if (onComplete) onComplete(result);
        onClose();
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <LinearGradient
                colors={result ? (ARCHETYPE_COLORS[result.archetype_id] || ARCHETYPE_COLORS.default) : ['#F8FAFC', '#EFF6FF']}
                style={styles.container}
            >
                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#129151" />
                        <Text style={styles.loadingText}>Preparando o seu perfil...</Text>
                    </View>
                ) : submitting ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#129151" />
                        <Text style={styles.loadingText}>Analisando suas respostas...</Text>
                    </View>
                ) : result ? (
                    // RESULT SCREEN
                    <Animated.View style={[styles.resultContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <View style={styles.resultCard}>
                            <Text style={styles.resultTitle}>Seu Perfil Pop Dog é:</Text>

                            <View style={[styles.iconBox, { backgroundColor: (ARCHETYPE_COLORS[result.archetype_id] || ARCHETYPE_COLORS.default)[0] + '20' }]}>
                                <Icon name={result.icon || 'star'} size={60} color={(ARCHETYPE_COLORS[result.archetype_id] || ARCHETYPE_COLORS.default)[0]} />
                            </View>

                            <Text style={[styles.archName, { color: (ARCHETYPE_COLORS[result.archetype_id] || ARCHETYPE_COLORS.default)[0] }]}>
                                {result.name}
                            </Text>

                            <Text style={styles.archDesc}>{result.description}</Text>

                            {result.traits && result.traits.length > 0 && (
                                <View style={styles.traitsContainer}>
                                    {result.traits.map((trait, idx) => (
                                        <View key={idx} style={[styles.traitBadge, { backgroundColor: (ARCHETYPE_COLORS[result.archetype_id] || ARCHETYPE_COLORS.default)[0] + '15' }]}>
                                            <Text style={[styles.traitText, { color: (ARCHETYPE_COLORS[result.archetype_id] || ARCHETYPE_COLORS.default)[0] }]}>
                                                {trait}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            <TouchableOpacity style={[styles.btnFinish, { backgroundColor: (ARCHETYPE_COLORS[result.archetype_id] || ARCHETYPE_COLORS.default)[0] }]} onPress={handleFinish}>
                                <Text style={styles.btnFinishText}>Começar a Jogar</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                ) : questions.length > 0 && currentIndex < questions.length ? (
                    // QUESTION SCREEN
                    <View style={styles.quizContainer}>
                        {/* Header / Progress */}
                        <View style={styles.header}>
                            <Text style={styles.progressText}>
                                Questão {currentIndex + 1} de {questions.length}
                            </Text>
                            <View style={styles.progressBarBg}>
                                <Animated.View
                                    style={[styles.progressBarFill, {
                                        width: progressAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', '100%']
                                        })
                                    }]}
                                />
                            </View>
                        </View>

                        <Animated.View style={[styles.questionArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            <Text style={styles.questionText}>
                                {questions[currentIndex].text}
                            </Text>

                            <View style={styles.optionsContainer}>
                                {questions[currentIndex].options?.map((opt, idx) => (
                                    <TouchableOpacity
                                        key={opt.id}
                                        style={styles.optionButton}
                                        onPress={() => handleSelectOption(opt.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.optionLetter}>
                                            <Text style={styles.optionLetterText}>{String.fromCharCode(65 + idx)}</Text>
                                        </View>
                                        <Text style={styles.optionText}>{opt.text}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Animated.View>
                    </View>
                ) : null}
            </LinearGradient>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#1E2D5A',
        fontWeight: '600'
    },
    quizContainer: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: 24,
    },
    header: {
        marginBottom: 40,
    },
    progressText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '700',
        marginBottom: 10,
        textAlign: 'center'
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
        overflow: 'hidden'
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#129151',
        borderRadius: 4,
    },
    questionArea: {
        flex: 1,
    },
    questionText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1E2D5A',
        marginBottom: 32,
        lineHeight: 32,
        letterSpacing: -0.5
    },
    optionsContainer: {
        gap: 16,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        shadowColor: '#1E2D5A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    optionLetter: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    optionLetterText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#64748B'
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#334155',
        lineHeight: 22
    },

    // Result Styles
    resultContainer: {
        flex: 1,
        padding: 24,
        justifyContent: 'center'
    },
    resultCard: {
        backgroundColor: '#FFF',
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 10,
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 24
    },
    iconBox: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24
    },
    archName: {
        fontSize: 32,
        fontWeight: '900',
        marginBottom: 16,
        textAlign: 'center',
        letterSpacing: -1
    },
    archDesc: {
        fontSize: 16,
        color: '#475569',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24
    },
    traitsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 32
    },
    traitBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    traitText: {
        fontSize: 13,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    btnFinish: {
        width: '100%',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    btnFinishText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800'
    }
});
