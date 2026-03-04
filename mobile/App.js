import React, { useMemo, useRef, useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, TextInput, Image, Alert, Easing, Dimensions, TouchableOpacity, Modal, ActivityIndicator } from 'react-native'
import Constants from 'expo-constants'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Rect, Circle, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useUserData } from './hooks/useUserData'
import { useTrails } from './hooks/useTrails'
import { useDashboard } from './hooks/useDashboard'
import { useStore } from './hooks/useStore'
import { useLessons } from './hooks/useLessons'
import { useQuizzes } from './hooks/useQuizzes'
import { useNotifications } from './hooks/useNotifications'
import { supabase } from './lib/supabase'
import VideoPlayer from './components/VideoPlayer'
import InteractiveQuiz from './components/InteractiveQuiz'
import QuizGame from './components/QuizGame'
import PetClassLogo from './components/PetClassLogo'
import PlayerProfileQuiz from './components/PlayerProfileQuiz'
import CertificateModal from './components/CertificateModal'

// --- CONSTANTS & THEME ---
const COLORS = {
  primary: '#129151', // Brand Green
  primaryHover: '#0B6E3D',
  accent: '#EC4899', // Vibrant Pink
  textPrimary: '#1F2937',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  border: '#D1D5DB',
  background: '#F8F9FC',
  card: '#FFFFFF',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
}

const MASCOT_IMAGE = require('./assets/pop_mascot.png')

const AI_MESSAGES = [
  "Olá! Sou o Pop. Vamos aprender algo novo hoje? 🚀",
  "Você sabia que completar metas diárias te dá mais XP? 🎯",
  "Excelente progresso na trilha de Liderança! Continue assim. 👏",
  "Dica: Revise os quizzes para fixar o conteúdo na memória. 🧠",
  "Uau, sua sequência está ficando impressionante! 🔥",
  "Precisa de ajuda com alguma aula? Estou aqui para você! 🤖",
  "Lembre-se: Líderes admiráveis são eternos aprendizes. 📚",
];

const { width } = Dimensions.get('window')

// --- SHARED COMPONENTS ---

// Professional Button (No 3D)
const Button = ({
  label,
  onPress,
  variant = 'primary', // primary, outline, danger, ghost
  icon,
  style,
  disabled = false,
  loading = false,
  fullWidth = false
}) => {
  const getColors = () => {
    if (disabled) return { bg: '#E5E7EB', text: '#9CA3AF', border: '#E5E7EB' }
    switch (variant) {
      case 'outline': return { bg: 'transparent', text: COLORS.primary, border: COLORS.primary }
      case 'danger': return { bg: COLORS.danger, text: '#FFF', border: COLORS.danger }
      case 'ghost': return { bg: 'transparent', text: COLORS.textSecondary, border: 'transparent' }
      default: return { bg: COLORS.primary, text: '#FFF', border: COLORS.primary }
    }
  }

  const colors = getColors()

  return (
    <TouchableOpacity
      onPress={!disabled && !loading ? onPress : null}
      activeOpacity={0.8}
      style={[
        styles.btnContainer,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          width: fullWidth ? '100%' : 'auto'
        },
        style
      ]}
    >
      {loading ? (
        <Text style={[styles.btnText, { color: colors.text }]}>Carregando...</Text>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {icon}
          <Text style={[styles.btnText, { color: colors.text }]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

// Professional Progress Bar (Thin)
const ProgressBar = ({ progress = 0, color = COLORS.success, height = 4 }) => {
  return (
    <View style={[styles.progressContainer, { height }]}>
      <View
        style={[
          styles.progressFill,
          {
            backgroundColor: color,
            width: `${Math.max(0, Math.min(100, progress))}%`
          }
        ]}
      />
    </View>
  )
}

// Clean Card (No entrance animation required for professional feel, just subtle fade)
const Card = ({ children, style, onPress }) => {
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start()
  }, [])

  const Container = onPress ? Pressable : View

  return (
    <Animated.View style={[{ opacity }, style]}>
      <Container
        onPress={onPress}
        style={[styles.card]}
      >
        {children}
      </Container>
    </Animated.View>
  )
}

import { Feather } from '@expo/vector-icons';

// Professional Icons (Standardized for Expo)
const Icon = ({ name, size = 20, color = COLORS.textSecondary }) => {
  return <Feather name={name} size={size} color={color} />;
};

// --- SCREENS ---

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('funcionario')
  const [loading, setLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const { signIn, signUp } = useAuth()

  // Animations
  const mascotScale = useRef(new Animated.Value(0)).current
  const cardSlide = useRef(new Animated.Value(40)).current
  const cardOpacity = useRef(new Animated.Value(0)).current
  const mascotBounce = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Mascot pop-in
    Animated.spring(mascotScale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }).start()
    // Card slide up
    Animated.parallel([
      Animated.timing(cardSlide, { toValue: 0, duration: 600, delay: 200, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
    ]).start()
    // Mascot idle bounce loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(mascotBounce, { toValue: -6, duration: 1200, useNativeDriver: true }),
        Animated.timing(mascotBounce, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  const handleLogin = async () => {
    if (!email || !password) return
    setLoading(true)
    const result = await signIn(email, password)
    if (result.success) {
      onLogin(result.data.user)
    } else {
      Alert.alert('Erro de Acesso', result.error || 'Verifique suas credenciais')
    }
    setLoading(false)
  }

  const handleRegister = async () => {
    if (!name || !email || !password) return
    setLoading(true)
    const result = await signUp(email, password, { name, role })
    if (result.success) {
      Alert.alert('Sucesso', 'Conta criada com sucesso!')
      setIsRegistering(false)
    } else {
      Alert.alert('Erro', result.error)
    }
    setLoading(false)
  }

  const inputStyle = (field) => ({
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    borderWidth: 2,
    borderColor: focusedField === field ? '#129151' : '#E8ECE9',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 14,
  })

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F0FFF4' }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── Mascot Hero Section ─── */}
        <Animated.View style={{
          alignItems: 'center',
          marginBottom: 24,
          transform: [{ scale: mascotScale }, { translateY: mascotBounce }],
        }}>
          {/* Green glow behind mascot */}
          <View style={{
            width: 140, height: 140, borderRadius: 70,
            backgroundColor: '#129151',
            opacity: 0.12,
            position: 'absolute', top: 6,
          }} />
          <View style={{
            width: 120, height: 120, borderRadius: 60,
            backgroundColor: '#129151',
            opacity: 0.08,
            position: 'absolute', top: 16,
          }} />
          <Image
            source={MASCOT_IMAGE}
            style={{ width: 130, height: 130, resizeMode: 'contain' }}
          />
        </Animated.View>

        {/* ─── Brand Name ─── */}
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <PetClassLogo scale={1.2} type="dark" />
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14,
          }}>
            <View style={{ width: 20, height: 2, backgroundColor: '#129151', borderRadius: 1, opacity: 0.4 }} />
            <Text style={{
              fontSize: 12, fontWeight: '700', color: '#6B7280',
              textTransform: 'uppercase', letterSpacing: 2,
            }}>Treinamento Corporativo</Text>
            <View style={{ width: 20, height: 2, backgroundColor: '#129151', borderRadius: 1, opacity: 0.4 }} />
          </View>
        </View>

        {/* ─── Login Card ─── */}
        <Animated.View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          paddingHorizontal: 24,
          paddingVertical: 28,
          shadowColor: '#129151',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 24,
          elevation: 8,
          transform: [{ translateY: cardSlide }],
          opacity: cardOpacity,
        }}>
          {/* Header text */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Text style={{
              fontSize: 22, fontWeight: '800', color: '#1F2937',
            }}>{isRegistering ? '🎉 Criar Nova Conta' : '👋 Boas-vindas!'}</Text>
            <Text style={{
              fontSize: 14, color: '#6B7280', marginTop: 4, textAlign: 'center',
            }}>{isRegistering ? 'Preencha os dados abaixo' : 'Faça login para continuar aprendendo'}</Text>
          </View>

          {/* Name field (only for register) */}
          {isRegistering && (
            <View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6, marginLeft: 4 }}>Nome Completo</Text>
              <View style={inputStyle('name')}>
                <Icon name="user" size={18} color={focusedField === 'name' ? '#129151' : '#9CA3AF'} />
                <TextInput
                  style={{ flex: 1, paddingLeft: 12, fontSize: 15, color: '#1F2937' }}
                  placeholder="Seu nome completo"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  placeholderTextColor="#B0B8C1"
                />
              </View>
            </View>
          )}

          {/* Email field */}
          <View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6, marginLeft: 4 }}>Email</Text>
            <View style={inputStyle('email')}>
              <Icon name="mail" size={18} color={focusedField === 'email' ? '#129151' : '#9CA3AF'} />
              <TextInput
                style={{ flex: 1, paddingLeft: 12, fontSize: 15, color: '#1F2937' }}
                placeholder="seu.email@empresa.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholderTextColor="#B0B8C1"
              />
            </View>
          </View>

          {/* Password field */}
          <View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6, marginLeft: 4 }}>Senha</Text>
            <View style={inputStyle('password')}>
              <Icon name="lock" size={18} color={focusedField === 'password' ? '#129151' : '#9CA3AF'} />
              <TextInput
                style={{ flex: 1, paddingLeft: 12, fontSize: 15, color: '#1F2937' }}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholderTextColor="#B0B8C1"
              />
            </View>
          </View>

          {/* Role selector (only for register) */}
          {isRegistering && (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8, marginLeft: 4 }}>Função</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {['funcionario', 'franqueado'].map(r => (
                  <Pressable
                    key={r}
                    onPress={() => setRole(r)}
                    style={{
                      flex: 1, paddingVertical: 12, borderRadius: 12,
                      borderWidth: 2,
                      borderColor: role === r ? '#129151' : '#E8ECE9',
                      backgroundColor: role === r ? '#ECFDF5' : '#F8FAF9',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{
                      fontSize: 14, fontWeight: '700',
                      color: role === r ? '#129151' : '#6B7280',
                    }}>
                      {r === 'funcionario' ? '👤 Funcionário' : '🏢 Franqueado'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* CTA Button */}
          <TouchableOpacity
            onPress={isRegistering ? handleRegister : handleLogin}
            activeOpacity={0.85}
            disabled={loading}
            style={{
              backgroundColor: '#129151',
              borderRadius: 16,
              height: 56,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 10,
              shadowColor: '#129151',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 }}>Autenticando...</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name={isRegistering ? 'user-plus' : 'log-in'} size={20} color="#FFF" />
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 }}>
                  {isRegistering ? 'CRIAR CONTA' : 'ENTRAR'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Toggle link */}
          <Pressable
            onPress={() => setIsRegistering(!isRegistering)}
            style={{ marginTop: 20, alignItems: 'center', paddingVertical: 6 }}
          >
            <Text style={{ fontSize: 14, color: '#129151', fontWeight: '700' }}>
              {isRegistering ? '← Já possui acesso? Entrar' : 'Não tem acesso? Solicitar conta →'}
            </Text>
          </Pressable>
        </Animated.View>

        {/* ─── Footer ─── */}
        <View style={{ alignItems: 'center', marginTop: 24, opacity: 0.7 }}>
          <PetClassLogo scale={0.5} type="dark" />
          <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>© 2026 Pet Class • Todos os direitos reservados</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

// Circular Progress component
function CircularProgress({ size = 140, strokeWidth = 10, progress = 0, color = '#129151', bgColor = '#D1FAE5', children }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={bgColor} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}

function DailyGoalItem({ title, desc, progress, total, icon, color, bg, onPress }) {
  const isCompleted = progress >= total;
  const pct = Math.min((progress / total) * 100, 100);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF', borderRadius: 20, padding: 16,
        shadowColor: '#1E2D5A', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
        borderWidth: 1, borderColor: isCompleted ? 'rgba(22, 163, 74, 0.1)' : 'transparent',
        opacity: pressed ? 0.9 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }]
      })}
    >
      <View style={{
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: bg, alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1, marginLeft: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E2D5A' }}>{title}</Text>
          <Text style={{ fontSize: 11, fontWeight: '800', color: isCompleted ? '#16A34A' : '#8896AB' }}>
            {isCompleted ? '✓ CONCLUÍDO' : `${progress}/${total}`}
          </Text>
        </View>
        <View style={{ height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
          <View style={{ height: 6, width: `${pct}%`, backgroundColor: color, borderRadius: 3 }} />
        </View>
        <Text style={{ fontSize: 11, color: '#8896AB', marginTop: 6, fontWeight: '500' }}>{desc}</Text>
      </View>
    </Pressable>
  );
}

function DashboardScreen({ navigate }) {
  const { userData, loading: userLoading } = useUserData();
  const { trails, loading: trailsLoading } = useTrails();
  const level = userData?.level || 1;
  const points = userData?.total_xp || userData?.total_pontos || 0;
  const pointsForLevel = 2000;
  const pointsInLevel = points % pointsForLevel;
  const progressPct = Math.min((pointsInLevel / pointsForLevel) * 100, 100);
  const coins = userData?.coins || 0;
  const streak = userData?.current_streak || userData?.current_assiduidade || 0;
  const lessons = userData?.lessons_completed || 0;
  const userName = userData?.name || 'Usuário';
  const firstName = userName.split(' ')[0];
  const initials = userName.substring(0, 2).toUpperCase();

  const TRAIL_ICONS = [
    { icon: 'book-open', bg: '#ECFDF5', color: '#129151' },
    { icon: 'trending-up', bg: '#FFF7ED', color: '#F97316' },
    { icon: 'star', bg: '#FEF3C7', color: '#F59E0B' },
    { icon: 'target', bg: '#F0FDF4', color: '#16A34A' },
    { icon: 'award', bg: '#FDF4FF', color: '#A855F7' },
  ];

  const visibleTrails = trails.slice(0, 4);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F7FF' }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── HEADER ─── */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
        }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#1E2D5A', letterSpacing: -0.3 }}>
              Olá, {firstName} 👋
            </Text>
            <Text style={{ fontSize: 14, color: '#8896AB', marginTop: 2, fontWeight: '500' }}>
              Continue aprendendo
            </Text>
          </View>
          <View>
            <View style={{
              width: 48, height: 48, borderRadius: 24,
              backgroundColor: '#129151', alignItems: 'center', justifyContent: 'center',
              shadowColor: '#129151', shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
            }}>
              <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '800' }}>{initials}</Text>
            </View>
            <View style={{
              position: 'absolute', bottom: -2, right: -2,
              backgroundColor: '#F59E0B', borderRadius: 10, padding: 2,
              borderWidth: 1.5, borderColor: '#FFF',
            }}>
              <Icon name="star" size={10} color="#FFF" />
            </View>
          </View>
        </View>

        {/* ─── PROGRESS CARD ─── */}
        <View style={{
          marginHorizontal: 20, marginTop: 16, marginBottom: 20,
          backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24,
          shadowColor: '#129151', shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12, shadowRadius: 20, elevation: 8,
        }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#8896AB', letterSpacing: 0.8, marginBottom: 20, textTransform: 'uppercase' }}>
            Seu Progresso
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>

            {/* Left Metric — XP */}
            <View style={{ alignItems: 'center', gap: 6 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="star" size={22} color="#F59E0B" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#1E2D5A' }}>{points}</Text>
              <Text style={{ fontSize: 12, color: '#8896AB', fontWeight: '600' }}>XP Total</Text>
            </View>

            {/* Center — Circular Progress */}
            <CircularProgress
              size={144}
              strokeWidth={11}
              progress={progressPct}
              color="#129151"
              bgColor="#D1FAE5"
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#8896AB', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Nível</Text>
              <Text style={{ fontSize: 32, fontWeight: '900', color: '#1E2D5A', lineHeight: 36 }}>{level}</Text>
              <Text style={{ fontSize: 11, color: '#8896AB', fontWeight: '600', marginTop: 2 }}>
                {pointsInLevel} / {pointsForLevel}
              </Text>
            </CircularProgress>

            {/* Right Metric — Streak */}
            <View style={{ alignItems: 'center', gap: 6 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="zap" size={22} color="#EF4444" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#1E2D5A' }}>{streak}</Text>
              <Text style={{ fontSize: 12, color: '#8896AB', fontWeight: '600' }}>Sequência</Text>
            </View>
          </View>

          {/* XP Bar */}
          <View style={{ marginTop: 20 }}>
            <View style={{ height: 6, backgroundColor: '#D1FAE5', borderRadius: 3, overflow: 'hidden' }}>
              <LinearGradient
                colors={['#129151', '#34D399']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ height: 6, width: `${progressPct}%`, borderRadius: 3 }}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={{ fontSize: 11, color: '#8896AB' }}>Nível {level}</Text>
              <Text style={{ fontSize: 11, color: '#8896AB' }}>Nível {level + 1}</Text>
            </View>
          </View>
        </View>

        {/* ─── MOEDAS CHIP ─── */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 24 }}>
          <View style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            backgroundColor: '#FFF', borderRadius: 16, paddingVertical: 12,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
          }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="database" size={16} color="#F59E0B" />
            </View>
            <View>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#1E2D5A' }}>{coins}</Text>
              <Text style={{ fontSize: 11, color: '#8896AB', fontWeight: '600' }}>POPCOIN</Text>
            </View>
          </View>
          <View style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            backgroundColor: '#FFF', borderRadius: 16, paddingVertical: 12,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
          }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="book-open" size={16} color="#129151" />
            </View>
            <View>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#1E2D5A' }}>{lessons}</Text>
              <Text style={{ fontSize: 11, color: '#8896AB', fontWeight: '600' }}>Aulas</Text>
            </View>
          </View>
        </View>

        {/* ─── METAS DIÁRIAS ─── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="target" size={20} color="#1E2D5A" />
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E2D5A', letterSpacing: -0.2 }}>
                Metas Diárias
              </Text>
            </View>
            <View style={{ backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 12, color: '#16A34A', fontWeight: '700' }}>1/3 Completo</Text>
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <DailyGoalItem
              title="Aprendiz do Dia"
              desc="Complete 1 aula"
              progress={lessons > 0 ? 1 : 0}
              total={1}
              icon="book-open"
              color="#129151"
              bg="#DCFCE7"
              onPress={() => navigate('trilhas')}
            />
            <DailyGoalItem
              title="Foco Total"
              desc="Ganhe 100 XP hoje"
              progress={35}
              total={100}
              icon="star"
              color="#F59E0B"
              bg="#FEF3C7"
              onPress={() => navigate('trilhas')}
            />
            <DailyGoalItem
              title="Mestre do Quiz"
              desc="Acerte 3 questões"
              progress={2}
              total={3}
              icon="zap"
              color="#EF4444"
              bg="#FEE2E2"
              onPress={() => navigate('trilhas')}
            />
          </View>
        </View>

        {/* ─── PRÓXIMAS AULAS ─── */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E2D5A', letterSpacing: -0.2 }}>
              Próximas Aulas
            </Text>
            <Pressable onPress={() => navigate('trilhas')}>
              <Text style={{ fontSize: 13, color: '#129151', fontWeight: '700' }}>Ver tudo</Text>
            </Pressable>
          </View>

          {trailsLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Text style={{ color: '#8896AB' }}>Carregando...</Text>
            </View>
          ) : visibleTrails.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Text style={{ color: '#8896AB' }}>Nenhuma trilha disponível</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {visibleTrails.map((trail, idx) => {
                const iconData = TRAIL_ICONS[idx % TRAIL_ICONS.length];
                const completedLessons = trail.completedLessons || 0;
                const totalLessons = trail.totalLessons || 0;
                const trailProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

                return (
                  <Pressable
                    key={trail.id}
                    onPress={() => navigate('trail-details', trail)}
                    style={({ pressed }) => [{
                      flexDirection: 'row', alignItems: 'center',
                      backgroundColor: '#FFF', borderRadius: 18, padding: 14,
                      shadowColor: '#1E2D5A', shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
                      opacity: pressed ? 0.92 : 1,
                    }]}
                  >
                    {/* Icon */}
                    <View style={{
                      width: 50, height: 50, borderRadius: 14,
                      backgroundColor: iconData.bg, alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon name={iconData.icon} size={24} color={iconData.color} />
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E2D5A', marginBottom: 4 }} numberOfLines={1}>
                        {trail.title || trail.name}
                      </Text>
                      <View style={{ height: 4, backgroundColor: '#F0F4FF', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                        <View style={{ height: 4, width: `${trailProgress}%`, backgroundColor: iconData.color, borderRadius: 2 }} />
                      </View>
                      <Text style={{ fontSize: 11, color: '#8896AB', fontWeight: '600' }}>
                        {completedLessons}/{totalLessons} aulas concluídas
                      </Text>
                    </View>

                    {/* Chevron */}
                    <View style={{ marginLeft: 8 }}>
                      <Icon name="chevron-right" size={18} color="#C5CEDE" />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function TrailsScreen({ navigate }) {
  const { userData } = useUserData();
  const { trails, loading, error, refetch } = useTrails();

  const TRAIL_PALETTE = [
    { icon: 'book-open', bg: '#ECFDF5', color: '#129151', pill: '#DCFCE7' },
    { icon: 'trending-up', bg: '#FFF7ED', color: '#F97316', pill: '#FFEDD5' },
    { icon: 'star', bg: '#FEF3C7', color: '#F59E0B', pill: '#FDE68A' },
    { icon: 'target', bg: '#F0FDF4', color: '#16A34A', pill: '#DCFCE7' },
    { icon: 'award', bg: '#FDF4FF', color: '#A855F7', pill: '#F3E8FF' },
    { icon: 'zap', bg: '#FFF1F2', color: '#EF4444', pill: '#FFE4E6' },
    { icon: 'users', bg: '#F0FDFA', color: '#0D9488', pill: '#CCFBF1' },
    { icon: 'shield', bg: '#F8FAFC', color: '#64748B', pill: '#E2E8F0' },
  ];

  const totalXp = userData?.total_xp || userData?.total_pontos || 0;
  const level = userData?.level || 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F7FF' }}>
      {/* ─── HEADER ─── */}
      <View style={{
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#1E2D5A', letterSpacing: -0.3 }}>
            Trilhas 📚
          </Text>
          <Text style={{ fontSize: 13, color: '#8896AB', fontWeight: '500', marginTop: 2 }}>
            Escolha e continue aprendendo
          </Text>
        </View>
        {/* XP Pill */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 7,
          borderRadius: 20,
        }}>
          <Icon name="star" size={14} color="#129151" />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#129151' }}>
            {totalXp} XP
          </Text>
        </View>
      </View>

      {/* ─── BODY ─── */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#8896AB', fontSize: 15 }}>Carregando trilhas...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Icon name="alert-circle" size={40} color="#EF4444" />
          <Text style={{ color: '#EF4444', marginTop: 12, marginBottom: 20, fontWeight: '600' }}>
            Erro ao carregar trilhas
          </Text>
          <Button label="Tentar Novamente" onPress={refetch} variant="outline" />
        </View>
      ) : trails.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Icon name="book-open" size={36} color="#129151" />
          </View>
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#1E2D5A' }}>Nenhuma trilha</Text>
          <Text style={{ color: '#8896AB', marginTop: 6, textAlign: 'center' }}>
            Não há trilhas disponíveis para o seu perfil ainda.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 14 }}
          showsVerticalScrollIndicator={false}
        >
          {trails.map((course, idx) => {
            const pal = TRAIL_PALETTE[idx % TRAIL_PALETTE.length];
            const prog = course.progress || {};
            const completed = prog.completed_lessons || 0;
            const total = prog.total_lessons || course.total_lessons || 0;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const isDone = pct === 100;
            const isStarted = completed > 0;

            return (
              <Pressable
                key={course.id}
                onPress={() => navigate('trail-details', course)}
                style={({ pressed }) => ({
                  backgroundColor: '#FFF',
                  borderRadius: 20,
                  padding: 18,
                  shadowColor: '#1E2D5A',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  elevation: 5,
                  opacity: pressed ? 0.93 : 1,
                })}
              >
                {/* Top row */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                  {/* Icon */}
                  <View style={{
                    width: 56, height: 56, borderRadius: 16,
                    backgroundColor: pal.bg, alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={pal.icon} size={28} color={pal.color} />
                  </View>

                  {/* Text */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E2D5A', flex: 1, marginRight: 8 }} numberOfLines={2}>
                        {course.title}
                      </Text>
                      {/* Status badge */}
                      <View style={{
                        backgroundColor: isDone ? '#DCFCE7' : isStarted ? pal.pill : '#F1F5F9',
                        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
                      }}>
                        <Text style={{
                          fontSize: 10, fontWeight: '700',
                          color: isDone ? '#16A34A' : isStarted ? pal.color : '#8896AB',
                        }}>
                          {isDone ? '✓ Concluída' : isStarted ? 'Em andamento' : 'Iniciar'}
                        </Text>
                      </View>
                    </View>

                    {course.description ? (
                      <Text style={{ fontSize: 12, color: '#8896AB', marginTop: 4, lineHeight: 17 }} numberOfLines={2}>
                        {course.description}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Progress */}
                <View style={{ marginTop: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#8896AB' }}>
                      {completed} de {total} aulas
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: pal.color }}>
                      {pct}%
                    </Text>
                  </View>
                  {/* Gradient progress bar */}
                  <View style={{ height: 6, backgroundColor: pal.bg, borderRadius: 3, overflow: 'hidden' }}>
                    <LinearGradient
                      colors={[pal.color, isDone ? pal.color : `${pal.color}99`]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={{ height: 6, width: `${pct}%`, borderRadius: 3 }}
                    />
                  </View>
                </View>

                {/* Footer */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: pal.color }}>
                    {isDone ? 'Trilha Concluída 🎉' : isStarted ? 'Continuar' : 'Começar agora'}
                  </Text>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: pal.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="chevron-right" size={15} color={pal.color} />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function TrailDetailsScreen({ trail, navigate }) {
  const { lessons, loading, error } = useLessons(trail?.id);
  const completedCount = lessons.filter(l => l.completed).length;
  const total = lessons.length;
  const overallPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F7FF' }}>

      {/* ─── HEADER ─── */}
      <View style={{
        backgroundColor: '#FFF',
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: '#ECFDF5',
        shadowColor: '#1E2D5A', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 6, elevation: 4,
      }}>
        {/* Back + Title */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Pressable
            onPress={() => navigate('trilhas')}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F7FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
          >
            <Icon name="chevron-left" size={20} color="#1E2D5A" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#1E2D5A', letterSpacing: -0.2 }} numberOfLines={1}>
              {trail?.title}
            </Text>
            <Text style={{ fontSize: 12, color: '#8896AB', fontWeight: '500', marginTop: 1 }}>
              {completedCount} de {total} aulas concluídas
            </Text>
          </View>
          {/* % Chip */}
          <View style={{
            backgroundColor: overallPct === 100 ? '#DCFCE7' : '#ECFDF5',
            paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: overallPct === 100 ? '#16A34A' : '#129151' }}>
              {overallPct}%
            </Text>
          </View>
        </View>

        {/* Overall progress bar */}
        <View style={{ height: 6, backgroundColor: '#ECFDF5', borderRadius: 3, overflow: 'hidden' }}>
          <LinearGradient
            colors={overallPct === 100 ? ['#16A34A', '#22C55E'] : ['#129151', '#34D399']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ height: 6, width: `${overallPct}%`, borderRadius: 3 }}
          />
        </View>
      </View>

      {/* ─── LIST ─── */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#8896AB', fontSize: 15 }}>Carregando aulas...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 100, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {lessons.map((lesson, index) => {
            const status = lesson.completed ? 'completed' : lesson.isUnlocked ? 'current' : 'locked';
            const isLocked = status === 'locked';
            const isDone = status === 'completed';
            const isCurrent = status === 'current';

            return (
              <Pressable
                key={lesson.id}
                onPress={() => lesson.isUnlocked && navigate('aula', { lesson, trail })}
                disabled={isLocked}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isLocked ? '#F8FAFC' : '#FFF',
                  borderRadius: 18,
                  padding: 16,
                  shadowColor: isLocked ? 'transparent' : '#1E2D5A',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: isLocked ? 0 : 0.07,
                  shadowRadius: 10,
                  elevation: isLocked ? 0 : 4,
                  borderWidth: isCurrent ? 1.5 : 0,
                  borderColor: isCurrent ? '#129151' : 'transparent',
                  opacity: pressed && !isLocked ? 0.92 : 1,
                })}
              >
                {/* Number / Status circle */}
                <View style={{
                  width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: isDone ? '#DCFCE7' : isCurrent ? '#ECFDF5' : '#F1F5F9',
                  marginRight: 14,
                }}>
                  {isDone ? (
                    <Icon name="check" size={20} color="#16A34A" />
                  ) : isLocked ? (
                    <Icon name="lock" size={16} color="#CBD5E1" />
                  ) : (
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#129151' }}>{index + 1}</Text>
                  )}
                </View>

                {/* Text */}
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 14, fontWeight: '700', marginBottom: 4,
                    color: isLocked ? '#CBD5E1' : '#1E2D5A',
                  }} numberOfLines={2}>
                    {lesson.title}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Icon name="star" size={11} color={isLocked ? '#CBD5E1' : '#F59E0B'} />
                      <Text style={{ fontSize: 11, fontWeight: '600', color: isLocked ? '#CBD5E1' : '#8896AB' }}>
                        {lesson.xp_reward || 20} XP
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Icon name="clock" size={11} color={isLocked ? '#CBD5E1' : '#8896AB'} />
                      <Text style={{ fontSize: 11, fontWeight: '600', color: isLocked ? '#CBD5E1' : '#8896AB' }}>
                        {lesson.duration_minutes || 10} min
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Right icon */}
                <View style={{
                  width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: isDone ? '#DCFCE7' : isCurrent ? '#129151' : '#F1F5F9',
                  marginLeft: 10,
                }}>
                  <Icon
                    name={isDone ? 'check' : isLocked ? 'lock' : 'play'}
                    size={14}
                    color={isDone ? '#16A34A' : isCurrent ? '#FFF' : '#CBD5E1'}
                  />
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── CONFETTI EXPLOSION ─────────────────────────────────────────────────────
const CONFETTI_COLORS = [
  '#2563EB', '#F59E0B', '#EF4444', '#16A34A',
  '#A855F7', '#F97316', '#EC4899', '#0D9488',
  '#FBBF24', '#60A5FA', '#34D399', '#F472B6',
];

function ConfettiParticle({ x, y, color, size, angle, speed, rotation, delay }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 900 + Math.random() * 400,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * speed] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * speed + 120] }); // gravity
  const opacity = anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0.9, 0] });
  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${rotation}deg`] });
  const scale = anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1.2, 0.7] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x, top: y,
        opacity,
        transform: [{ translateX }, { translateY }, { rotate }, { scale }],
      }}
    >
      <View style={{
        width: size,
        height: size * (Math.random() > 0.5 ? 1 : 0.5),
        borderRadius: Math.random() > 0.5 ? size / 2 : 2,
        backgroundColor: color,
      }} />
    </Animated.View>
  );
}

function ConfettiExplosion({ visible, originX, originY }) {
  if (!visible) return null;
  const particles = useMemo(() => {
    return Array.from({ length: 48 }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 8 + Math.random() * 8,
      angle: (Math.PI * 2 * i / 48) - Math.PI / 2 + (Math.random() - 0.5) * 1.2,
      speed: 80 + Math.random() * 160,
      rotation: (Math.random() - 0.5) * 720,
      delay: Math.random() * 120,
    }));
  }, [visible]);

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 999 }}>
      {particles.map(p => (
        <ConfettiParticle
          key={p.id}
          x={originX}
          y={originY}
          color={p.color}
          size={p.size}
          angle={p.angle}
          speed={p.speed}
          rotation={p.rotation}
          delay={p.delay}
        />
      ))}
    </View>
  );
}

function LessonDetailsScreen({ lesson, navigate, onOpenCert }) {

  const { user } = useAuth();
  const { quizzes, loading: quizLoading, answerQuiz } = useQuizzes(lesson?.lesson?.id || lesson?.id);
  const { completeLesson } = useLessons(lesson?.trail?.id);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [confettiVisible, setConfettiVisible] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const [videoWatched, setVideoWatched] = useState(false);
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const lessonData = lesson?.lesson || lesson;
  const trailData = lesson?.trail;
  const hasVideo = !!(lessonData?.video_url);
  const showVideo = hasVideo && !videoWatched;

  const currentQuiz = quizzes[currentIdx];
  const progress = quizzes.length > 0 ? ((currentIdx) / quizzes.length) * 100 : 0;

  const parseOptions = (opts) => {
    if (Array.isArray(opts)) return opts;
    if (typeof opts === 'string') { try { return JSON.parse(opts); } catch { return []; } }
    return [];
  };

  const handleSelect = async (optionIndex) => {
    if (answered) return;
    setSelected(optionIndex);
    setAnswered(true);
    const correctIdx = currentQuiz?.correct_answer_index ?? currentQuiz?.correct_answer;
    const correct = optionIndex === correctIdx;
    setIsCorrect(correct);
    if (correct) {
      setScore(s => s + 1);
      // Disparar confetes
      setConfettiKey(k => k + 1);
      setConfettiVisible(true);
      setTimeout(() => setConfettiVisible(false), 1800);
    }
    // Animar feedback
    feedbackAnim.setValue(0);
    Animated.spring(feedbackAnim, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }).start();
    // Registrar no banco
    try { await answerQuiz(currentQuiz.id, optionIndex); } catch (e) { }
  };

  const handleNext = async () => {
    if (currentIdx < quizzes.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelected(null);
      setAnswered(false);
      setIsCorrect(false);
    } else {
      if (user && lessonData?.id) {
        await completeLesson(lessonData.id);

        // Se for a última aula da trilha, tentar emitir certificado
        if (trailData?.id) {
          setIsIssuing(true);
          try {
            const { data, error } = await supabase.rpc('issue_trail_certificate', {
              p_trail_id: trailData.id
            });
            if (data && !error) {
              setIssuedCert(data);
            }
          } catch (e) { console.log('Erro ao emitir certificado:', e); }
          finally { setIsIssuing(false); }
        }
      }
      setShowResult(true);
    }
  };

  if (quizLoading) return (
    <SafeAreaView style={[styles.screenBg, { backgroundColor: '#FFF' }]}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: COLORS.textSecondary }}>Carregando quiz...</Text>
      </View>
    </SafeAreaView>
  );

  if (!showResult && quizzes.length === 0) return (
    <SafeAreaView style={[styles.screenBg, { backgroundColor: '#FFF' }]}>
      <View style={styles.lessonHeader}>
        <Pressable onPress={() => navigate('trail-details', trailData)} style={{ padding: 8 }}>
          <Icon name="x" size={22} color={COLORS.textSecondary} />
        </Pressable>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Icon name="book-open" size={48} color={COLORS.textMuted} />
        <Text style={{ color: COLORS.textMuted, marginTop: 16, textAlign: 'center', fontSize: 16 }}>Nenhum quiz encontrado para esta aula.</Text>
        <Button label="Voltar" onPress={() => navigate('trail-details', trailData)} style={{ marginTop: 24 }} />
      </View>
    </SafeAreaView>
  );

  const quizOptions = parseOptions(currentQuiz?.options);
  const correctIdx = currentQuiz?.correct_answer_index ?? currentQuiz?.correct_answer;

  // ─── TELA DE VÍDEO OBRIGATÓRIO ───────────────────────────────────────────────
  if (showVideo) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1120' }}>
        {/* ── HEADER PREMIUM ── */}
        <LinearGradient
          colors={['#0F1B2D', '#0B1120']}
          style={{
            flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 18,
            borderBottomWidth: 1, borderBottomColor: 'rgba(18,145,81,0.12)',
          }}
        >
          <Pressable
            onPress={() => navigate('trail-details', trailData)}
            style={({ pressed }) => ({
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
              alignItems: 'center', justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Icon name="arrow-left" size={18} color="#94A3B8" />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ color: '#F1F5F9', fontWeight: '800', fontSize: 16, letterSpacing: -0.3 }} numberOfLines={1}>
              {lessonData?.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 }}>
              <LinearGradient
                colors={['#129151', '#0FA968']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}
              >
                <Icon name="film" size={10} color="#FFF" />
                <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>VÍDEO OBRIGATÓRIO</Text>
              </LinearGradient>
            </View>
          </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
          {/* ── Descrição ── */}
          <Text style={{ color: '#94A3B8', fontSize: 14, lineHeight: 23, marginBottom: 22, fontWeight: '500' }}>
            {lessonData?.description}
          </Text>

          {/* ── Player de vídeo ── */}
          <VideoPlayer
            videoUrl={lessonData?.video_url}
            lesson={lessonData}
            onVideoComplete={() => setVideoWatched(true)}
          />

          {/* ── Stats chips ── */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            <View style={{
              flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              backgroundColor: 'rgba(18,145,81,0.1)', borderRadius: 14, paddingVertical: 12,
              borderWidth: 1, borderColor: 'rgba(18,145,81,0.15)',
            }}>
              <Icon name="star" size={16} color="#34D399" />
              <Text style={{ color: '#34D399', fontSize: 13, fontWeight: '700' }}>
                {lessonData?.xp_reward || 20} XP
              </Text>
            </View>
            <View style={{
              flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: 14, paddingVertical: 12,
              borderWidth: 1, borderColor: 'rgba(99,102,241,0.15)',
            }}>
              <Icon name="help-circle" size={16} color="#818CF8" />
              <Text style={{ color: '#818CF8', fontSize: 13, fontWeight: '700' }}>
                {quizzes?.length || 0} perguntas
              </Text>
            </View>
          </View>

          {/* ── Card Como Funciona ── */}
          <View style={{
            backgroundColor: 'rgba(18,145,81,0.06)', borderRadius: 18, padding: 18,
            borderWidth: 1, borderColor: 'rgba(18,145,81,0.15)',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <View style={{
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: 'rgba(18,145,81,0.15)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="info" size={14} color="#34D399" />
              </View>
              <Text style={{ color: '#34D399', fontWeight: '800', fontSize: 14 }}>Como funciona</Text>
            </View>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingLeft: 4 }}>
                <Text style={{ color: '#34D399', fontSize: 13, fontWeight: '800' }}>1.</Text>
                <Text style={{ color: '#94A3B8', fontSize: 13, lineHeight: 20, flex: 1 }}>
                  Assista ao vídeo completo da aula
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingLeft: 4 }}>
                <Text style={{ color: '#34D399', fontSize: 13, fontWeight: '800' }}>2.</Text>
                <Text style={{ color: '#94A3B8', fontSize: 13, lineHeight: 20, flex: 1 }}>
                  Clique no botão abaixo para iniciar o quiz
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingLeft: 4 }}>
                <Text style={{ color: '#34D399', fontSize: 13, fontWeight: '800' }}>3.</Text>
                <Text style={{ color: '#94A3B8', fontSize: 13, lineHeight: 20, flex: 1 }}>
                  Acerte as perguntas e ganhe XP!
                </Text>
              </View>
            </View>
          </View>

          {/* ── Separador ── */}
          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 24 }} />

          {/* ── Botão CTA Premium ── */}
          <Pressable
            onPress={() => setVideoWatched(true)}
            style={({ pressed }) => ({
              borderRadius: 20, overflow: 'hidden',
              shadowColor: '#129151', shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.5, shadowRadius: 16, elevation: 10,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <LinearGradient
              colors={['#129151', '#0FA968', '#16A34A']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 18, borderRadius: 20,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              <Icon name="zap" size={20} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 }}>
                Ir para o Quiz
              </Text>
              <Icon name="chevron-right" size={18} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </Pressable>

          {/* Subtle hint */}
          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center', marginTop: 12, fontWeight: '500' }}>
            Assista o vídeo antes para melhor desempenho no quiz
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // scale/bounce ao receber resposta
  const feedbackScale = feedbackAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });

  return (
    <SafeAreaView style={[styles.screenBg, { backgroundColor: '#FFF' }]}>
      {/* ─── CONFETTI OVERLAY ─── */}
      <ConfettiExplosion
        key={confettiKey}
        visible={confettiVisible}
        originX={width / 2 - 8}
        originY={200}
      />

      {!showResult ? (
        <View style={{ flex: 1 }}>
          {/* ─── HEADER ─── */}
          <View style={styles.lessonHeader}>
            <Pressable onPress={() => navigate('trail-details', trailData)} style={{ padding: 8 }}>
              <Icon name="x" size={22} color={COLORS.textSecondary} />
            </Pressable>
            <View style={{ flex: 1, marginHorizontal: 20 }}>
              <ProgressBar progress={progress} />
            </View>
            <View style={{ backgroundColor: '#F4F7FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
              <Text style={{ fontWeight: '800', color: '#1E2D5A', fontSize: 13 }}>{currentIdx + 1}/{quizzes.length}</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
            {/* ─── QUESTION ─── */}
            <Text style={[styles.questionTitle, { marginBottom: 28, lineHeight: 28 }]}>{currentQuiz?.question}</Text>

            {/* ─── OPTIONS ─── */}
            <View style={{ gap: 12 }}>
              {quizOptions.map((opt, i) => {
                const isSelected = i === selected;
                const isRealCorrect = i === correctIdx;
                let bgColor = '#FAFAFA';
                let borderColor = '#E5E7EB';
                let textColor = '#1F2937';
                let iconName = null;

                if (answered) {
                  if (isSelected && isCorrect) {
                    bgColor = '#F0FDF4'; borderColor = '#16A34A'; textColor = '#16A34A'; iconName = 'check-circle';
                  } else if (isSelected && !isCorrect) {
                    bgColor = '#FFF5F5'; borderColor = '#EF4444'; textColor = '#EF4444'; iconName = 'x-circle';
                  } else if (isRealCorrect && !isCorrect) {
                    bgColor = '#F0FDF4'; borderColor = '#16A34A'; textColor = '#16A34A'; iconName = 'check-circle';
                  } else {
                    borderColor = '#E5E7EB'; textColor = '#9CA3AF';
                  }
                }

                return (
                  <Pressable
                    key={i}
                    onPress={() => handleSelect(i)}
                    disabled={answered}
                    style={({ pressed }) => ({
                      flexDirection: 'row', alignItems: 'center',
                      backgroundColor: bgColor,
                      borderWidth: 1.5, borderColor,
                      borderRadius: 16, padding: 16,
                      opacity: answered && !isSelected && !isRealCorrect ? 0.45 : pressed ? 0.85 : 1,
                      shadowColor: isSelected && answered ? borderColor : 'transparent',
                      shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: isSelected && answered ? 4 : 0,
                    })}
                  >
                    {/* Letter badge */}
                    <View style={{
                      width: 30, height: 30, borderRadius: 15,
                      backgroundColor: answered ? (isSelected || isRealCorrect ? borderColor : '#E5E7EB') : '#ECFDF5',
                      alignItems: 'center', justifyContent: 'center', marginRight: 12,
                    }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: answered && (isSelected || isRealCorrect) ? '#FFF' : '#129151' }}>
                        {['A', 'B', 'C', 'D'][i] || i + 1}
                      </Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: textColor, lineHeight: 21 }}>{opt}</Text>
                    {iconName && answered && (
                      <Icon name={iconName} size={20} color={borderColor} />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* ─── FEEDBACK CARD ─── */}
            {answered && (
              <Animated.View
                style={{
                  marginTop: 20,
                  transform: [{ scale: feedbackScale }],
                }}
              >
                <View style={{
                  padding: 16, borderRadius: 18,
                  backgroundColor: isCorrect ? '#F0FDF4' : '#FFF5F5',
                  borderLeftWidth: 4, borderLeftColor: isCorrect ? '#16A34A' : '#EF4444',
                }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: isCorrect ? '#16A34A' : '#EF4444', marginBottom: 4 }}>
                    {isCorrect ? '🎉 Correto! Ótimo trabalho!' : '😔 Incorreto'}
                  </Text>
                  {currentQuiz?.explanation && (
                    <Text style={{ color: '#4B5563', lineHeight: 20, fontSize: 14 }}>{currentQuiz.explanation}</Text>
                  )}
                </View>
              </Animated.View>
            )}

            {/* ─── NEXT BUTTON ─── */}
            {answered && (
              <Pressable
                onPress={handleNext}
                style={({ pressed }) => ({
                  marginTop: 20, borderRadius: 16, paddingVertical: 16,
                  backgroundColor: '#129151',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: pressed ? 0.85 : 1,
                  shadowColor: '#129151', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
                })}
              >
                <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>
                  {currentIdx < quizzes.length - 1 ? 'Próxima Pergunta →' : 'Ver Resultado 🏆'}
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      ) : (
        // ─── RESULT SCREEN ───
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F4F7FF' }}>
          <ConfettiExplosion
            key={`result-${confettiKey}`}
            visible={score > quizzes.length / 2}
            originX={width / 2 - 8}
            originY={300}
          />
          <View style={{
            width: '100%', backgroundColor: '#FFF', borderRadius: 28, padding: 32,
            alignItems: 'center',
            shadowColor: '#1E2D5A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10,
          }}>
            <Text style={{ fontSize: 64, marginBottom: 8 }}>
              {score === quizzes.length ? '🏆' : score > quizzes.length / 2 ? '🌟' : '📚'}
            </Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#1E2D5A', marginBottom: 6 }}>Aula Concluída!</Text>
            <Text style={{ fontSize: 14, color: '#8896AB', textAlign: 'center', marginBottom: 28, lineHeight: 20 }}>
              {score === quizzes.length ? 'Perfeito! Você acertou tudo! 🎉' : score > quizzes.length / 2 ? 'Excelente! Você domina este conteúdo.' : 'Continue estudando para melhorar!'}
            </Text>

            {/* Stats */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 28 }}>
              <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#ECFDF5', borderRadius: 16, paddingVertical: 14 }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#129151' }}>
                  {quizzes.length > 0 ? Math.round((score / quizzes.length) * 100) : 0}%
                </Text>
                <Text style={{ fontSize: 11, color: '#8896AB', fontWeight: '600', marginTop: 2 }}>Precisão</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#DCFCE7', borderRadius: 16, paddingVertical: 14 }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#16A34A' }}>
                  {score}/{quizzes.length}
                </Text>
                <Text style={{ fontSize: 11, color: '#8896AB', fontWeight: '600', marginTop: 2 }}>Acertos</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#FEF3C7', borderRadius: 16, paddingVertical: 14 }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#F59E0B' }}>
                  +{score * 10}
                </Text>
                <Text style={{ fontSize: 11, color: '#8896AB', fontWeight: '600', marginTop: 2 }}>XP Ganho</Text>
              </View>
            </View>

            {issuedCert && (
              <View style={{ width: '100%', marginBottom: 12 }}>
                <Button
                  label="VER CERTIFICADO 🎓"
                  onPress={() => {
                    onOpenCert && onOpenCert(issuedCert);
                  }}
                  style={{ backgroundColor: COLORS.accent, borderColor: COLORS.accent }}
                />
              </View>
            )}

            {score >= (quizzes.length / 2) && (
              <View style={{
                backgroundColor: '#F0F9FF', paddingHorizontal: 16, paddingVertical: 10,
                borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#BAE6FD',
                flexDirection: 'row', alignItems: 'center', gap: 8
              }}>
                <Text style={{ fontSize: 18 }}>🔓</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0369A1' }}>Próxima aula liberada!</Text>
              </View>
            )}

            <Pressable
              onPress={() => navigate('trail-details', trailData)}
              style={({ pressed }) => ({
                width: '100%', backgroundColor: '#129151', borderRadius: 16, paddingVertical: 16,
                alignItems: 'center',
                opacity: pressed ? 0.85 : 1,
                shadowColor: '#129151', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
              })}
            >
              <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>Voltar para a Trilha</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function RankingScreen() {
  const { user } = useAuth();
  const { userData } = useUserData();
  const [ranking, setRanking] = useState([]);
  const [teamRanking, setTeamRanking] = useState([]);
  const [tab, setTab] = useState('individual'); // 'individual' | 'teams'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (tab === 'individual') {
          const { data } = await supabase
            .from('users')
            .select('id, name, total_xp, level, role')
            .eq('is_active', true)
            .order('total_xp', { ascending: false })
            .limit(20);
          if (data) setRanking(data);
        } else {
          const { data, error } = await supabase.rpc('get_team_ranking');
          if (error) throw error;
          if (data) setTeamRanking(data);
        }
      } catch (e) {
        console.log('Error fetching ranking:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tab]);

  const myPos = ranking.findIndex(r => r.id === user?.id) + 1;
  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3, 10);

  // Paleta de avatares
  const AVATAR_COLORS = [
    '#2563EB', '#F97316', '#16A34A', '#A855F7',
    '#EF4444', '#0D9488', '#F59E0B', '#EC4899',
  ];

  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3; // 2º, 1º, 3º
  const podiumHeights = [90, 120, 70]; // 2º, 1º, 3º
  const podiumColors = ['#C0C0C0', '#FFD700', '#CD7F32'];
  const podiumPositions = [2, 1, 3];
  const podiumBg = ['#F8FAFC', '#FFFBEB', '#FFF8F1'];
  const podiumBorder = ['#CBD5E1', '#F59E0B', '#F97316'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F7FF' }}>
      {/* ─── HEADER ─── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#1E2D5A', letterSpacing: -0.3 }}>
          Ranking 🏆
        </Text>
        <Text style={{ fontSize: 13, color: '#8896AB', fontWeight: '500', marginTop: 2 }}>
          {tab === 'individual' ? 'Top colaboradores por XP' : 'Melhores equipes da semana'}
        </Text>
      </View>

      {/* ─── TABS ─── */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 10 }}>
        <Pressable
          onPress={() => setTab('individual')}
          style={{
            flex: 1, backgroundColor: tab === 'individual' ? '#129151' : '#FFF',
            paddingVertical: 10, borderRadius: 12, alignItems: 'center',
            borderWidth: 1, borderColor: tab === 'individual' ? '#129151' : '#E5E7EB',
          }}
        >
          <Text style={{ color: tab === 'individual' ? '#FFF' : '#64748B', fontWeight: '700', fontSize: 13 }}>Individual</Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('teams')}
          style={{
            flex: 1, backgroundColor: tab === 'teams' ? '#129151' : '#FFF',
            paddingVertical: 10, borderRadius: 12, alignItems: 'center',
            borderWidth: 1, borderColor: tab === 'teams' ? '#129151' : '#E5E7EB',
          }}
        >
          <Text style={{ color: tab === 'teams' ? '#FFF' : '#64748B', fontWeight: '700', fontSize: 13 }}>Equipes</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#8896AB', fontSize: 15 }}>Carregando ranking...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {tab === 'individual' ? (
            <>
              {/* ─── PÓDIO TOP 3 ─── */}
              {top3.length >= 1 && (
                <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                  <View style={{
                    backgroundColor: '#FFF',
                    borderRadius: 24, padding: 20,
                    shadowColor: '#1E2D5A', shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.08, shadowRadius: 16, elevation: 6,
                  }}>
                    <Text style={{ textAlign: 'center', fontSize: 13, fontWeight: '700', color: '#8896AB', letterSpacing: 0.8, marginBottom: 20, textTransform: 'uppercase' }}>
                      Pódio
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 12 }}>
                      {podiumOrder.map((person, idx) => {
                        const height = podiumHeights[idx] || 80;
                        const medalColor = podiumColors[idx];
                        const pos = podiumPositions[idx] || idx + 1;
                        const bg = podiumBg[idx];
                        const border = podiumBorder[idx];
                        const isMe = person?.id === user?.id;
                        const initials = (person?.name || '?').substring(0, 2).toUpperCase();
                        const avatarColor = AVATAR_COLORS[ranking.findIndex(r => r.id === person?.id) % AVATAR_COLORS.length];

                        if (!person) return null;
                        return (
                          <View key={person.id} style={{ alignItems: 'center', flex: 1 }}>
                            {/* Medal */}
                            <View style={{
                              width: 28, height: 28, borderRadius: 14,
                              backgroundColor: medalColor,
                              alignItems: 'center', justifyContent: 'center',
                              marginBottom: 6,
                            }}>
                              <Text style={{ fontSize: 12, fontWeight: '900', color: '#FFF' }}>{pos}</Text>
                            </View>
                            {/* Avatar */}
                            <View style={{
                              width: pos === 1 ? 60 : 50, height: pos === 1 ? 60 : 50,
                              borderRadius: pos === 1 ? 30 : 25,
                              backgroundColor: avatarColor,
                              alignItems: 'center', justifyContent: 'center',
                              borderWidth: 3, borderColor: medalColor,
                              marginBottom: 8,
                              shadowColor: medalColor, shadowOffset: { width: 0, height: 4 },
                              shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
                            }}>
                              <Text style={{ color: '#FFF', fontWeight: '800', fontSize: pos === 1 ? 20 : 16 }}>
                                {initials}
                              </Text>
                            </View>
                            {/* Name */}
                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#1E2D5A', textAlign: 'center', marginBottom: 2 }} numberOfLines={1}>
                              {isMe ? 'Você' : person.name?.split(' ')[0]}
                            </Text>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#8896AB' }}>
                              {person.total_xp || 0} XP
                            </Text>
                            {/* Podium bar */}
                            <View style={{
                              width: '100%', height: height * 0.6 + 30,
                              backgroundColor: bg,
                              borderTopLeftRadius: 8, borderTopRightRadius: 8,
                              borderTopWidth: 2, borderColor: border,
                              marginTop: 10,
                              alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Text style={{ fontSize: 20 }}>
                                {pos === 1 ? '🥇' : pos === 2 ? '🥈' : '🥉'}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>
              )}

              {/* ─── MEU CARD ─── */}
              {myPos > 0 && (
                <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                  <LinearGradient
                    colors={['#129151', '#129151']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center' }}
                  >
                    <View style={{
                      width: 48, height: 48, borderRadius: 24,
                      backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
                      marginRight: 14,
                    }}>
                      <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '800' }}>
                        {(userData?.name || 'U').substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600', marginBottom: 2 }}>SUA POSIÇÃO</Text>
                      <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '900' }}>
                        {myPos}º lugar
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600', marginBottom: 2 }}>SEU XP</Text>
                      <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '900' }}>
                        {userData?.total_xp || 0}
                      </Text>
                    </View>
                  </LinearGradient>
                </View>
              )}

              {/* ─── STATS DO USUÁRIO ─── */}
              <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {[
                    { icon: 'zap', label: 'Sequência', value: `${userData?.current_streak || 0}d`, bg: '#FEE2E2', color: '#EF4444' },
                    { icon: 'book-open', label: 'Aulas', value: userData?.lessons_completed || 0, bg: '#DCFCE7', color: '#129151' },
                    { icon: 'star', label: 'Nível', value: `Nv ${userData?.level || 1}`, bg: '#FEF3C7', color: '#F59E0B' },
                  ].map((s, i) => (
                    <View key={i} style={{
                      flex: 1, alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, paddingVertical: 14,
                      shadowColor: '#1E2D5A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
                    }}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: s.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                        <Icon name={s.icon} size={18} color={s.color} />
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E2D5A' }}>{s.value}</Text>
                      <Text style={{ fontSize: 11, color: '#8896AB', fontWeight: '600', marginTop: 2 }}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* ─── LISTA COMPLETA ─── */}
              <View style={{ paddingHorizontal: 20 }}>
                {rest.map((person, idx) => {
                  const initials = (person.name || '?').substring(0, 2).toUpperCase();
                  const avatarColor = AVATAR_COLORS[(idx + 3) % AVATAR_COLORS.length];
                  return (
                    <View key={person.id} style={{
                      flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
                      padding: 16, borderRadius: 16, marginBottom: 8,
                      borderWidth: 1, borderColor: '#F1F5F9',
                    }}>
                      <Text style={{ width: 28, fontSize: 14, fontWeight: '800', color: '#8896AB' }}>{idx + 4}º</Text>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: avatarColor, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>{initials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E2D5A' }}>{person.name}</Text>
                        <Text style={{ fontSize: 11, color: '#8896AB' }}>{person.role || 'Membro'}</Text>
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: '#129151' }}>{person.total_xp || 0} XP</Text>
                    </View>
                  );
                })}
              </View>
            </>
          ) : (
            /* ─── LISTA DE EQUIPES ─── */
            <View style={{ paddingHorizontal: 20 }}>
              {teamRanking.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={{ color: '#8896AB' }}>Nenhuma equipe encontrada.</Text>
                </View>
              ) : (
                teamRanking.map((team, idx) => {
                  const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                  return (
                    <View key={team.team_id || idx} style={{
                      flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
                      padding: 16, borderRadius: 20, marginBottom: 12,
                      borderWidth: 1, borderColor: team.is_user_team ? '#129151' : '#F1F5F9',
                      shadowColor: '#1E2D5A', shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
                    }}>
                      <View style={{ width: 32, alignItems: 'center' }}>
                        {idx === 0 ? <Text style={{ fontSize: 20 }}>🥇</Text>
                          : idx === 1 ? <Text style={{ fontSize: 20 }}>🥈</Text>
                            : idx === 2 ? <Text style={{ fontSize: 20 }}>🥉</Text>
                              : <Text style={{ fontSize: 14, fontWeight: '800', color: '#8896AB' }}>{idx + 1}º</Text>
                        }
                      </View>
                      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: avatarColor + '20', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <Icon name="users" size={20} color={avatarColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E2D5A' }}>{team.name}</Text>
                          {team.is_user_team && (
                            <View style={{ backgroundColor: '#129151', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 8 }}>
                              <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '900' }}>SUA</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 12, color: '#8896AB', marginTop: 2 }}>{team.member_count} membros</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: '#129151' }}>{team.total_xp}</Text>
                        <Text style={{ fontSize: 10, color: '#8896AB', fontWeight: '700' }}>XP TOTAL</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ShopScreen() {
  const { userData, refetch: refetchUser } = useUserData();
  const { items: storeItems, loading, purchaseItem, hasItem } = useStore();
  const [buying, setBuying] = useState(null);

  const FALLBACK_ITEMS = [
    { id: 1, name: 'Dobro de Pontos (24h)', price: 10, icon_emoji: '⚡', description: 'Ganhe o dobro de XP por 24 horas' },
    { id: 2, name: 'Congelar Sequência', price: 20, icon_emoji: '❄️', description: 'Proteja sua sequência por 1 dia' },
    { id: 3, name: 'Vida Extra', price: 15, icon_emoji: '❤️', description: 'Uma chance a mais no quiz' },
    { id: 4, name: 'Certificado Pro', price: 50, icon_emoji: '📜', description: 'Exibir conquista no perfil' },
    { id: 5, name: 'Boost de Aula', price: 25, icon_emoji: '🚀', description: 'Complete aulas 2x mais rápido' },
    { id: 6, name: 'Theme Especial', price: 30, icon_emoji: '🎨', description: 'Personalize sua interface' },
  ];

  const items = storeItems?.length > 0 ? storeItems : FALLBACK_ITEMS;

  const ITEM_COLORS = [
    { bg: '#FEF3C7', color: '#F59E0B' },
    { bg: '#DCFCE7', color: '#129151' },
    { bg: '#FEE2E2', color: '#EF4444' },
    { bg: '#DCFCE7', color: '#16A34A' },
    { bg: '#F3E8FF', color: '#A855F7' },
    { bg: '#FFEDD5', color: '#F97316' },
  ];

  const handleBuy = async (item) => {
    if ((userData?.coins || 0) < item.price) return Alert.alert('POPCOIN insuficientes', `Você precisa de ${item.price} POPCOIN.`);
    setBuying(item.id);

    const result = await purchaseItem(item.id);

    if (result.success && result.data?.success !== false) {
      await refetchUser();
      Alert.alert('Compra realizada! 🎉', `${item.name} adquirido com sucesso!`);
    } else {
      const errorMsg = result.data?.error || result.error || 'Não foi possível completar a compra.';
      Alert.alert('Erro', errorMsg);
    }

    setBuying(null);
  };

  const coins = userData?.coins || 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F7FF' }}>
      {/* ─── HEADER ─── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#1E2D5A', letterSpacing: -0.3 }}>
          Loja 🛍️
        </Text>
        <Text style={{ fontSize: 13, color: '#8896AB', fontWeight: '500', marginTop: 2 }}>
          Troque seus POPCOIN por recompensas
        </Text>
      </View>

      {/* ─── SALDO BANNER ─── */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
        <LinearGradient
          colors={['#F59E0B', '#FBBF24']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center' }}
        >
          <View style={{
            width: 52, height: 52, borderRadius: 26,
            backgroundColor: 'rgba(255,255,255,0.25)',
            alignItems: 'center', justifyContent: 'center', marginRight: 14,
          }}>
            <Text style={{ fontSize: 26 }}>🪙</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', marginBottom: 2 }}>
              SEU SALDO
            </Text>
            <Text style={{ color: '#FFF', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 }}>
              {coins} <Text style={{ fontSize: 16, fontWeight: '600' }}>POPCOIN</Text>
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600' }}>Complete aulas</Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600' }}>para ganhar mais!</Text>
          </View>
        </LinearGradient>
      </View>

      {/* ─── ITEMS ─── */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#8896AB', fontSize: 15 }}>Carregando loja...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E2D5A', marginBottom: 4 }}>
            Itens disponíveis
          </Text>

          {items.map((item, idx) => {
            const pal = ITEM_COLORS[idx % ITEM_COLORS.length];
            const canAfford = coins >= item.price;
            const isBuying = buying === item.id;
            const alreadyOwned = hasItem(item.id);
            // allow buying again for consumable items
            const isDisabled = !canAfford || isBuying;

            return (
              <View key={item.id} style={{
                backgroundColor: '#FFF', borderRadius: 20, padding: 16,
                shadowColor: '#1E2D5A', shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.07, shadowRadius: 12, elevation: 4,
                flexDirection: 'row', alignItems: 'center', gap: 14,
              }}>
                {/* Item image or emoji fallback */}
                <View style={{
                  width: 58, height: 58, borderRadius: 18,
                  backgroundColor: pal.bg, alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={{ width: 58, height: 58 }} resizeMode="cover" />
                  ) : (
                    <Text style={{ fontSize: 28 }}>{item.icon_emoji || item.icon || '🎁'}</Text>
                  )}
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#1E2D5A', marginBottom: 2 }}>
                    {item.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#8896AB', lineHeight: 16, marginBottom: 6 }}>
                    {item.description}
                  </Text>
                  {/* Price pill */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    backgroundColor: canAfford ? '#FEF3C7' : '#F1F5F9',
                    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
                    alignSelf: 'flex-start',
                  }}>
                    <Text style={{ fontSize: 13 }}>🪙</Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: canAfford ? '#F59E0B' : '#94A3B8' }}>
                      {item.price}
                    </Text>
                  </View>
                </View>

                {/* Buy button */}
                <Pressable
                  onPress={() => handleBuy(item)}
                  disabled={isDisabled}
                  style={({ pressed }) => ({
                    backgroundColor: canAfford ? '#129151' : '#E2E8F0',
                    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14,
                    opacity: pressed ? 0.85 : 1,
                    shadowColor: canAfford ? '#129151' : 'transparent',
                    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
                  })}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: canAfford ? '#FFF' : '#94A3B8' }}>
                    {isBuying ? '...' : (canAfford ? 'Comprar' : 'Sem saldo')}
                  </Text>
                  {alreadyOwned && (
                    <Text style={{ fontSize: 9, color: canAfford ? 'rgba(255,255,255,0.7)' : '#94A3B8', textAlign: 'center', marginTop: 2, fontWeight: '600' }}>
                      (Você já tem)
                    </Text>
                  )}
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function PerfilScreen({ onLogout, navigate, onOpenCert }) {
  const { userData } = useUserData();
  const { signOut, user } = useAuth();
  const { unreadCount } = useNotifications();
  const [managerStats, setManagerStats] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [loadingCerts, setLoadingCerts] = useState(false);

  useEffect(() => {
    // Fetch manager stats if applicable
    if (userData?.role === 'gerente' || userData?.role === 'admin') {
      fetchManagerStats();
    }
    fetchCertificates();
  }, [userData]);

  const fetchManagerStats = async () => {
    try {
      const { data } = await supabase.rpc('get_manager_dashboard_summary');
      if (data) setManagerStats(data);
    } catch (e) { console.log(e); }
  };

  const fetchCertificates = async () => {
    setLoadingCerts(true);
    try {
      const { data } = await supabase
        .from('certificates')
        .select('*')
        .order('issued_at', { ascending: false });
      if (data) setCertificates(data);
    } catch (e) {
      console.log('Error fetching certs:', e);
    } finally {
      setLoadingCerts(false);
    }
  };

  const ARCHETYPE_CONFIG = {
    'especialista': { label: 'Especialista', icon: 'crosshair', color: '#2563EB', bg: '#DBEAFE' },
    'encantador': { label: 'Encantador', icon: 'heart', color: '#DB2777', bg: '#FCE7F3' },
    'estrategista': { label: 'Estrategista', icon: 'compass', color: '#7C3AED', bg: '#F3E8FF' },
    'agil': { label: 'Ágil', icon: 'zap', color: '#D97706', bg: '#FEF3C7' },
  };

  const arc = userData?.archetype ? ARCHETYPE_CONFIG[userData.archetype.toLowerCase()] : null;

  const handleLogout = async () => {
    await signOut();
    onLogout && onLogout();
  };

  const getInitials = (name) => name ? name.substring(0, 2).toUpperCase() : 'UR';
  const xp = userData?.total_xp || userData?.total_pontos || 0;
  const level = userData?.level || 1;
  const xpInLevel = xp % 2000;
  const xpPct = Math.min((xpInLevel / 2000) * 100, 100);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F7FF' }}>
      {/* Search Header */}
      <View style={{
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#1E2D5A', letterSpacing: -0.3 }}>
            Perfil 👤
          </Text>
        </View>

        {/* Floating Bell Icon */}
        <Pressable
          onPress={() => navigate('notificacoes')}
          style={({ pressed }) => ({
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: '#FFF',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: '#ECFDF5',
            shadowColor: '#1E2D5A', shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
            opacity: pressed ? 0.8 : 1
          })}
        >
          <Icon name="bell" size={20} color="#129151" />
          {unreadCount > 0 && (
            <View style={{
              position: 'absolute', top: 10, right: 10,
              width: 16, height: 16, borderRadius: 8,
              backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#FFF',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '900' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── HERO HEADER ─── */}
        <LinearGradient
          colors={['#0B6E3D', '#129151']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ paddingTop: 32, paddingBottom: 40, alignItems: 'center', paddingHorizontal: 20 }}
        >
          {/* Avatar */}
          <View style={{
            width: 84, height: 84, borderRadius: 42,
            backgroundColor: 'rgba(255,255,255,0.18)',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
            marginBottom: 12,
            shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
          }}>
            <Text style={{ color: '#FFF', fontSize: 32, fontWeight: '900' }}>
              {getInitials(userData?.name)}
            </Text>
          </View>

          <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '800', letterSpacing: -0.2, marginBottom: 4 }}>
            {userData?.name || 'Usuário'}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500', marginBottom: 12 }}>
            {userData?.email || 'email@empresa.com'}
          </Text>

          {/* Archetype Badge if exists */}
          {arc && (
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: arc.bg, paddingHorizontal: 16, paddingVertical: 8,
              borderRadius: 30, marginBottom: 16, borderWidth: 1, borderColor: arc.color + '40'
            }}>
              <Icon name={arc.icon} size={14} color={arc.color} />
              <Text style={{ marginLeft: 8, color: arc.color, fontWeight: '800', fontSize: 13 }}>
                ESTILO: {arc.label.toUpperCase()}
              </Text>
            </View>
          )}

          {/* Role pill */}
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.15)',
            paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
          }}>
            <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 }}>
              {(userData?.role || 'Funcionário').toUpperCase()}
            </Text>
          </View>
        </LinearGradient>

        {/* ─── XP LEVEL CARD (overlap) ─── */}
        <View style={{ paddingHorizontal: 20, marginTop: -20 }}>
          <View style={{
            backgroundColor: '#FFF', borderRadius: 22, padding: 20,
            shadowColor: '#1E2D5A', shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.1, shadowRadius: 16, elevation: 8,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 12, color: '#8896AB', fontWeight: '600' }}>PROGRESSO</Text>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E2D5A', marginTop: 2 }}>
                  Nível {level}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 12, color: '#8896AB', fontWeight: '600' }}>TOTAL XP</Text>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#129151', marginTop: 2 }}>
                  {xp} <Text style={{ fontSize: 13, fontWeight: '600' }}>pts</Text>
                </Text>
              </View>
            </View>

            {/* XP bar */}
            <View style={{ height: 8, backgroundColor: '#ECFDF5', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
              <LinearGradient
                colors={['#129151', '#34D399']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ height: 8, width: `${xpPct}%`, borderRadius: 4 }}
              />
            </View>
            <Text style={{ fontSize: 11, color: '#8896AB', fontWeight: '600' }}>
              {xpInLevel} / 2000 XP para o próximo nível
            </Text>
          </View>
        </View>

        {/* ─── MANAGER ANALYTICS (if manager/admin) ─── */}
        {managerStats && (
          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E2D5A', marginBottom: 12 }}>
              Visão do Gestor 📊
            </Text>
            <LinearGradient
              colors={['#1E2D5A', '#2D3E6E']}
              style={{ borderRadius: 20, padding: 20 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                <View>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' }}>MEMBROS ATIVOS</Text>
                  <Text style={{ color: '#FFF', fontSize: 24, fontWeight: '900' }}>{managerStats.total_users || 0}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' }}>LIÇÕES HOJE</Text>
                  <Text style={{ color: '#34D399', fontSize: 24, fontWeight: '900' }}>+{managerStats.lessons_completed_today || 0}</Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 16 }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' }}>XP DA EQUIPE (MÊS)</Text>
                  <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '800' }}>{managerStats.total_xp_month || 0} pts</Text>
                </View>
                <Icon name="activity" size={24} color="rgba(255,255,255,0.2)" />
              </View>
            </LinearGradient>
          </View>
        )}

        {/* ─── STATS GRID ─── */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {[
              { icon: 'award', label: 'Nível', value: `${level}`, bg: '#DCFCE7', color: '#129151' },
              { icon: 'dollar-sign', label: 'POPCOIN', value: `${userData?.coins || 0}`, bg: '#FEF3C7', color: '#F59E0B' },
              { icon: 'zap', label: 'Sequência', value: `${userData?.current_streak || 0}d`, bg: '#DCFCE7', color: '#16A34A' },
              { icon: 'book-open', label: 'Aulas', value: `${userData?.lessons_completed || 0}`, bg: '#F3E8FF', color: '#A855F7' },
            ].map((s, i) => (
              <View key={i} style={{
                width: '47%',
                backgroundColor: '#FFF', borderRadius: 18, padding: 16,
                shadowColor: '#1E2D5A', shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
              }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: s.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 10,
                }}>
                  <Icon name={s.icon} size={20} color={s.color} />
                </View>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#1E2D5A' }}>{s.value}</Text>
                <Text style={{ fontSize: 12, color: '#8896AB', fontWeight: '600', marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── MEUS CERTIFICADOS ─── */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E2D5A' }}>
              Meus Certificados 🎓
            </Text>
            {certificates.length > 0 && (
              <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '700' }}>{certificates.length} obtidos</Text>
            )}
          </View>

          {loadingCerts ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
          ) : certificates.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 10 }}>
              {certificates.map((cert) => (
                <Pressable
                  key={cert.id}
                  onPress={() => onOpenCert && onOpenCert(cert)}
                  style={{
                    width: 160, backgroundColor: '#FFF', borderRadius: 18, padding: 16,
                    borderWidth: 1, borderColor: '#F1F5F9',
                    shadowColor: '#1E2D5A', shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.05, shadowRadius: 10, elevation: 3
                  }}
                >
                  <View style={{
                    width: 32, height: 32, borderRadius: 10, backgroundColor: '#DCFCE7',
                    alignItems: 'center', justifyContent: 'center', marginBottom: 10
                  }}>
                    <Icon name="award" size={16} color="#129151" />
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E2D5A', marginBottom: 4 }} numberOfLines={1}>
                    {cert.trail_title}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#8896AB', fontWeight: '600' }}>
                    {new Date(cert.issued_at).toLocaleDateString()}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={{
              backgroundColor: '#FFF', borderRadius: 20, padding: 24, alignItems: 'center',
              borderWidth: 1, borderColor: '#F1F5F9', borderStyle: 'dashed'
            }}>
              <Icon name="award" size={32} color="#CBD5E1" />
              <Text style={{ color: '#8896AB', fontSize: 13, textAlign: 'center', marginTop: 12, fontWeight: '500' }}>
                Complete uma trilha para ganhar seu primeiro certificado!
              </Text>
            </View>
          )}
        </View>

        {/* ─── DETALHES LIST ─── */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E2D5A', marginBottom: 12 }}>
            Configurações e Detalhes
          </Text>
          <View style={{
            backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden',
            shadowColor: '#1E2D5A', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
          }}>
            <Pressable
              onPress={() => navigate('notificacoes')}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', padding: 16,
                borderBottomWidth: 1, borderBottomColor: '#F4F7FF',
                backgroundColor: pressed ? '#F8FAFC' : '#FFF'
              })}
            >
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginRight: 12,
              }}>
                <Icon name="bell" size={17} color="#129151" />
              </View>
              <Text style={{ flex: 1, fontSize: 14, color: '#1E2D5A', fontWeight: '700' }}>Notificações</Text>
              {unreadCount > 0 && (
                <View style={{ backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginRight: 8 }}>
                  <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>{unreadCount}</Text>
                </View>
              )}
              <Icon name="chevron-right" size={16} color="#CBD5E1" />
            </Pressable>

            {[
              { icon: 'trending-up', label: 'Recorde de Sequência', value: `${userData?.max_streak || 0} dias`, color: '#EF4444', bg: '#FEE2E2' },
              { icon: 'check-circle', label: 'Quizzes Realizados', value: `${userData?.quizzes_completed || 0}`, color: '#16A34A', bg: '#DCFCE7' },
              { icon: 'star', label: 'Maior Pontuação', value: `${userData?.max_xp || xp} XP`, color: '#F59E0B', bg: '#FEF3C7' },
            ].map((row, i, arr) => (
              <View key={i} style={{
                flexDirection: 'row', alignItems: 'center', padding: 16,
                borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                borderBottomColor: '#F4F7FF',
              }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: row.bg, alignItems: 'center', justifyContent: 'center', marginRight: 12,
                }}>
                  <Icon name={row.icon} size={17} color={row.color} />
                </View>
                <Text style={{ flex: 1, fontSize: 14, color: '#64748B', fontWeight: '500' }}>{row.label}</Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E2D5A' }}>{row.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── LOGOUT ─── */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
              backgroundColor: '#FEE2E2', borderRadius: 18, paddingVertical: 16,
              borderWidth: 1.5, borderColor: '#FECACA',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Icon name="log-out" size={18} color="#EF4444" />
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#EF4444' }}>Sair da Conta</Text>
          </Pressable>
        </View>

        <Text style={{ textAlign: 'center', color: '#CBD5E1', fontSize: 12, fontWeight: '500', marginTop: 20 }}>
          Versão 2.1.0 (Enterprise)
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function FloatingAssistant() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bubbleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 1500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    // Auto-show tip after 3 seconds
    const timer = setTimeout(() => handlePress(), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handlePress = () => {
    if (visible && !isThinking) {
      // Close bubble
      Animated.spring(bubbleAnim, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true }).start(() => setVisible(false));
      return;
    }

    // Animation jump
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.2, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();

    setIsThinking(true);
    setVisible(true);
    setMessage('O Pop está pensando...');

    // Animate bubble opening
    Animated.spring(bubbleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();

    // Simulating IA "thinking"
    setTimeout(() => {
      const randomMsg = AI_MESSAGES[Math.floor(Math.random() * AI_MESSAGES.length)];
      setMessage(randomMsg);
      setIsThinking(false);
    }, 1500);
  };

  return (
    <View style={{ position: 'absolute', bottom: 90, right: 15, alignItems: 'flex-end', zIndex: 9999 }}>
      {visible && (
        <Animated.View style={{
          transform: [{ scale: bubbleAnim }, { translateY: bubbleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          opacity: bubbleAnim,
          marginBottom: 10,
          marginRight: 10,
        }}>
          <View style={{
            backgroundColor: '#FFF',
            padding: 14,
            borderRadius: 20,
            maxWidth: 220,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 10,
            borderWidth: 1,
            borderColor: '#E2E8F0',
          }}>
            <Text style={{ fontSize: 13, color: '#1E2D5A', fontWeight: '600', lineHeight: 18 }}>
              {message}
            </Text>
            {/* Triangle for bubble */}
            <View style={{
              position: 'absolute', bottom: -8, right: 20,
              width: 0, height: 0,
              backgroundColor: 'transparent',
              borderStyle: 'solid',
              borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 10,
              borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#FFF',
            }} />
          </View>
        </Animated.View>
      )}

      <Pressable onPress={handlePress}>
        <Animated.View style={{
          transform: [
            { translateY: floatAnim },
            { scale: scaleAnim }
          ]
        }}>
          <View style={{
            width: 70, height: 70, borderRadius: 35,
            backgroundColor: '#FFF',
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#129151', shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25, shadowRadius: 12, elevation: 12,
            borderWidth: 2, borderColor: '#129151',
          }}>
            <Image source={MASCOT_IMAGE} style={{ width: 50, height: 50 }} resizeMode="contain" />

            {/* Status indicator */}
            <View style={{
              position: 'absolute', top: 2, right: 2,
              width: 14, height: 14, borderRadius: 7,
              backgroundColor: '#10B981',
              borderWidth: 2, borderColor: '#FFF',
            }} />
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

function BottomNav({ current, onNavigate, notificationCount = 0 }) {
  const tabs = [
    { id: 'home', icon: 'home', label: 'Início' },
    { id: 'trilhas', icon: 'book-open', label: 'Aulas' },
    { id: 'ranking', icon: 'award', label: 'Ranking' },
    { id: 'loja', icon: 'shopping-bag', label: 'Loja' },
    { id: 'perfil', icon: 'user', label: 'Perfil', badge: notificationCount },
  ];

  return (
    <View style={{
      flexDirection: 'row',
      paddingBottom: 8,
      paddingTop: 8,
      paddingHorizontal: 6,
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#ECFDF5',
      shadowColor: '#1E2D5A',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 12,
    }}>
      {tabs.map(t => {
        const isActive = current === t.id;
        return (
          <Pressable
            key={t.id}
            onPress={() => onNavigate(t.id)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}
          >
            {/* Icon pill */}
            <View style={{
              width: 46,
              height: 32,
              borderRadius: 16,
              backgroundColor: isActive ? '#129151' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 3,
              ...(isActive ? {
                shadowColor: '#129151',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.35,
                shadowRadius: 6,
                elevation: 5,
              } : {}),
            }}>
              <Icon
                name={t.icon}
                color={isActive ? '#FFFFFF' : '#9CA3AF'}
                size={19}
              />
            </View>
            <Text style={{
              fontSize: 10,
              fontWeight: isActive ? '700' : '500',
              color: isActive ? '#129151' : '#9CA3AF',
            }}>
              {t.label}
            </Text>
            {t.badge > 0 && (
              <View style={{
                position: 'absolute', top: 2, right: 10,
                backgroundColor: '#EF4444', borderRadius: 8,
                minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
                paddingHorizontal: 4, borderWidth: 1.5, borderColor: '#FFF',
              }}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#FFF' }}>
                  {t.badge > 9 ? '9+' : t.badge}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── NOTIFICATIONS SCREEN ────────────────────────────────────────────────────
function NotificationsScreen({ navigate }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const getTypeIcon = (type) => {
    switch (type) {
      case 'achievement': return { name: 'award', color: '#F59E0B', bg: '#FEF3C7' };
      case 'streak_risk': return { name: 'zap', color: '#EF4444', bg: '#FEE2E2' };
      case 'rank_change': return { name: 'trending-up', color: '#2563EB', bg: '#DBEAFE' };
      case 'mission_expiring': return { name: 'target', color: '#F97316', bg: '#FFEDD5' };
      case 'custom': return { name: 'message-square', color: '#8B5CF6', bg: '#F3E8FF' };
      default: return { name: 'bell', color: '#6B7280', bg: '#F3F4F6' };
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Agora';
    if (diffMin < 60) return `${diffMin}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F7FF' }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => navigate('perfil')}>
            <Icon name="arrow-left" size={22} color="#1E2D5A" />
          </Pressable>
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#1E2D5A', letterSpacing: -0.3 }}>
              Notificações 🔔
            </Text>
            <Text style={{ fontSize: 13, color: '#8896AB', fontWeight: '500', marginTop: 2 }}>
              {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia!'}
            </Text>
          </View>
        </View>

        {unreadCount > 0 && (
          <Pressable
            onPress={markAllAsRead}
            style={{
              backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 6,
              borderRadius: 12, borderWidth: 1, borderColor: '#D1FAE5',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#129151' }}>Ler Tudo</Text>
          </Pressable>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <Icon name="bell-off" size={48} color="#D1D5DB" />
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#1E2D5A', marginTop: 16, textAlign: 'center' }}>
            Sem notificações
          </Text>
          <Text style={{ fontSize: 14, color: '#8896AB', marginTop: 6, textAlign: 'center' }}>
            Quando houver novidades, elas aparecerão aqui.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ gap: 10 }}>
            {notifications.map(notification => {
              const typeInfo = getTypeIcon(notification.type);
              return (
                <Pressable
                  key={notification.id}
                  onPress={() => {
                    if (!notification.is_read) markAsRead(notification.id);
                  }}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'flex-start',
                    backgroundColor: notification.is_read ? '#FFF' : '#FEFFF7',
                    borderRadius: 18, padding: 16,
                    borderWidth: notification.is_read ? 1 : 2,
                    borderColor: notification.is_read ? '#F1F5F9' : '#129151',
                    shadowColor: '#1E2D5A',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  {/* Icon */}
                  <View style={{
                    width: 44, height: 44, borderRadius: 14,
                    backgroundColor: typeInfo.bg,
                    alignItems: 'center', justifyContent: 'center',
                    marginRight: 14,
                  }}>
                    <Icon name={typeInfo.name} size={20} color={typeInfo.color} />
                  </View>

                  {/* Content */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={{
                        fontSize: 14, fontWeight: notification.is_read ? '600' : '800',
                        color: '#1E2D5A', flex: 1, marginRight: 8,
                      }}>
                        {notification.title}
                      </Text>
                      {!notification.is_read && (
                        <View style={{
                          width: 8, height: 8, borderRadius: 4,
                          backgroundColor: '#129151', marginTop: 4,
                        }} />
                      )}
                    </View>
                    <Text style={{ fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 18 }}>
                      {notification.body}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                      <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>
                        {formatDate(notification.created_at)}
                      </Text>
                      <Pressable
                        onPress={() => deleteNotification(notification.id)}
                        hitSlop={10}
                      >
                        <Icon name="trash-2" size={14} color="#CBD5E1" />
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// --- MAIN APP COMPONENT ---

function AppContent() {
  const [route, setRoute] = useState('login')
  const [params, setParams] = useState({})
  const { user, loading: authLoading } = useAuth()
  const { unreadCount } = useNotifications()

  // Profile Quiz state
  const [profileQuizVisible, setProfileQuizVisible] = useState(false);

  // Certificate Modal state
  const [certificateVisible, setCertificateVisible] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  // Simple router
  const navigate = (to, p = {}) => {
    setParams(p)
    setRoute(to)
  }

  // Auto-show Profile Quiz if missing
  useEffect(() => {
    if (user && user.has_profile === false && route === 'home') {
      // Delay slightly for better UX
      const timer = setTimeout(() => setProfileQuizVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user, route]);

  // Auth Redirect
  useEffect(() => {
    if (!authLoading) {
      if (user && route === 'login') setRoute('home')
      if (!user && route !== 'login') setRoute('login')
    }
  }, [user, authLoading, route])

  if (authLoading) return <View style={styles.loadingScreen}><Text style={{ color: COLORS.textSecondary }}>Carregando sistema...</Text></View>

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {route === 'login' && <LoginScreen onLogin={() => setRoute('home')} />}
      {route === 'home' && <DashboardScreen navigate={navigate} />}
      {route === 'trilhas' && <TrailsScreen navigate={navigate} role={user?.role} />}
      {route === 'trail-details' && <TrailDetailsScreen trail={params} navigate={navigate} />}
      {route === 'aula' && (
        <LessonDetailsScreen
          lesson={params}
          navigate={navigate}
          onOpenCert={(cert) => { setSelectedCertificate(cert); setCertificateVisible(true); }}
        />
      )}
      {route === 'ranking' && <RankingScreen />}
      {route === 'loja' && <ShopScreen />}
      {route === 'perfil' && (
        <PerfilScreen
          onLogout={() => setRoute('login')}
          navigate={navigate}
          onOpenCert={(cert) => { setSelectedCertificate(cert); setCertificateVisible(true); }}
        />
      )}
      {route === 'notificacoes' && <NotificationsScreen navigate={navigate} />}

      {['home', 'trilhas', 'ranking', 'loja', 'perfil'].includes(route) && (
        <>
          <FloatingAssistant />
          <BottomNav current={route} onNavigate={navigate} notificationCount={unreadCount} />
        </>
      )}

      {/* GLOBAL MODALS */}
      <PlayerProfileQuiz
        visible={profileQuizVisible}
        onClose={() => setProfileQuizVisible(false)}
        onComplete={() => setProfileQuizVisible(false)}
      />

      <CertificateModal
        visible={certificateVisible}
        certificate={selectedCertificate}
        onClose={() => setCertificateVisible(false)}
      />
    </View>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

// --- STYLES ---

const styles = StyleSheet.create({
  // Global
  fullScreen: { flex: 1 },
  fullScreenGradient: { flex: 1 },
  screenBg: { flex: 1, backgroundColor: COLORS.background },
  scrollPad: { padding: 16, paddingBottom: 100 },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  screenHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },

  // Text Styles
  screenTitle: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12, marginTop: 24 },
  headerSub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },

  // Quiz Option Button
  optionBtn: { padding: 16, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, backgroundColor: '#FFF', marginBottom: 2 },
  lessonHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  questionTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },

  // Login
  loginContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  loginCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 32, marginTop: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  loginTitle: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  loginSubtitle: { fontSize: 14, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  loginHeader: { fontSize: 20, fontWeight: '600', textAlign: 'center', color: COLORS.textPrimary, marginBottom: 24, marginTop: 16 },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary, marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12 },
  input: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 15, color: COLORS.textPrimary },
  roleSelector: { marginBottom: 20 },
  roleBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: '#F9FAFB' },
  roleBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.accent },
  roleBtnText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  roleBtnTextActive: { color: COLORS.primary, fontWeight: '600' },
  linkText: { fontSize: 14, color: COLORS.primary, fontWeight: '500' },

  // Components
  btnContainer: { height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  btnText: { fontSize: 15, fontWeight: '600' },
  card: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  progressContainer: { width: '100%', backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  badge: { backgroundColor: COLORS.accent, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
  badgeText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },

  // Dashboard
  dashboardContainer: {
    flex: 1,
  },
  dashboardScrollContainer: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  dashboardGreeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  dashboardSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  dashboardAvatarContainer: {
    position: 'relative',
  },
  dashboardAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  dashboardAvatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  dashboardAvatarBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 2,
    shadowColor: "#FBBF24",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  levelCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: "rgba(37, 99, 235, 0.15)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  levelTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  levelPoints: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  levelProgressBarBackground: {
    height: 16,
    backgroundColor: COLORS.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  levelProgressBarFill: {
    height: '100%',
    borderRadius: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: "rgba(0, 0, 0, 0.05)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  dailyQuestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: "rgba(0, 0, 0, 0.05)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  dailyQuestIcon: {
    marginRight: 16,
  },
  dailyQuestText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  dailyQuestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  dailyQuestBadgeText: {
    color: COLORS.success,
    marginLeft: 6,
    fontWeight: 'bold',
  },
  mascotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.12)',
    shadowColor: 'rgba(37, 99, 235, 0.18)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  mascotImage: {
    width: 72,
    height: 72,
    marginRight: 12,
  },
  mascotTextWrap: {
    flex: 1,
  },
  mascotTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  mascotSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  quickAccessTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  quickAccessButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "rgba(0, 0, 0, 0.08)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  quickAccessLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAccessLabel: {
    width: 80,
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  // Trails
  screenHeader: { padding: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trailIconBox: { width: 64, height: 64, backgroundColor: '#F3F4F6', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardDesc: { fontSize: 14, color: COLORS.textSecondary, marginVertical: 8 },
  progressText: { fontSize: 12, color: COLORS.textMuted },
  cardFooter: { borderTopWidth: 1, borderTopColor: COLORS.border, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  cardFooterText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  // Trails Screen
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  courseCardTop: {
    flexDirection: 'row',
    padding: 16,
  },
  courseIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  courseTextContainer: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  courseDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  courseProgressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  courseProgressFill: {
    height: '100%',
    backgroundColor: '#9CA3AF',
    borderRadius: 3,
  },
  courseCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  courseActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },

  // Trail Details
  lessonList: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  lessonItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  lessonNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  lessonNumberText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  lessonTitle: { fontSize: 15, fontWeight: '500', color: COLORS.textPrimary, marginBottom: 2 },
  lessonSub: { fontSize: 12, color: COLORS.textMuted },

  // Lesson Details
  lessonHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  questionTitle: { fontSize: 20, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center', lineHeight: 28 },
  resultStatsRow: { flexDirection: 'row', width: '100%', gap: 16, marginTop: 24 },
  resultStatItem: { flex: 1, alignItems: 'center', padding: 16, backgroundColor: '#F9FAFB', borderRadius: 8 },
  resultStatValue: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary },
  resultStatLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },

  // Ranking
  statBox: { flex: 1, minWidth: '45%', backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 16, alignItems: 'center' },
  statBoxValue: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  statBoxLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  rankingList: { marginTop: 12 },
  rankingRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#FFF', borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  rankPos: { width: 30, fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  rankAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  rankAvatarText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  rankName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  rankDept: { fontSize: 12, color: COLORS.textMuted },
  rankXp: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  // Shop
  shopIconBox: { width: 48, height: 48, backgroundColor: '#F3F4F6', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  shopPrice: { fontSize: 14, fontWeight: '600', color: COLORS.warning, marginTop: 4 },

  // Perfil
  profileAvatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  profileAvatarText: { fontSize: 32, fontWeight: '600', color: COLORS.textSecondary },
  profileName: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  profileEmail: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 12 },
  roleBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  roleBadgeText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  dataList: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 8 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dataLabel: { fontSize: 14, color: COLORS.textSecondary },
  dataValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  versionText: { textAlign: 'center', color: COLORS.textMuted, fontSize: 12, marginTop: 32 },

  // Gamified Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    height: 70,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingTop: 8,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    // Shadow for Android
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  navIconContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    marginBottom: 2,
  },
  navIconContainerActive: {
    backgroundColor: COLORS.primary,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  navLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  }
})
