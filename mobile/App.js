import React, { useMemo, useRef, useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, TextInput, Image, Alert } from 'react-native'
import Constants from 'expo-constants'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Rect } from 'react-native-svg'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useUserData } from './hooks/useUserData'
import { useTrails } from './hooks/useTrails'
import { useDashboard } from './hooks/useDashboard'
import { useStore } from './hooks/useStore'
import { useLessons } from './hooks/useLessons'
import { useQuizzes } from './hooks/useQuizzes'
import { supabase } from './lib/supabase'
import VideoPlayer from './components/VideoPlayer'
import InteractiveQuiz from './components/InteractiveQuiz'
import QuizGame from './components/QuizGame'

function TrailCard({ trail, userData, navigate }) {
  const pct = Math.max(0, Math.min(100, trail.progress?.progress_percentage || 0))
  const scale = useRef(new Animated.Value(1)).current
  const handlePressIn = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start()
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()
  const fallbackIcon = trail.title?.toLowerCase().includes('venda') ? '💰' : trail.title?.toLowerCase().includes('produto') ? '🦴' : '🐾'

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }] }]}>      
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{trail.icon_url || fallbackIcon}</Text>
        <Text style={styles.cardTitle}>{trail.title}</Text>
        <View style={{ flex: 1 }} />
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Nível {userData?.level || 1}</Text>
        </View>
      </View>

      <Text style={styles.subtitleSmall}>Nível {userData?.level || 1} • {trail.progress?.total_xp || 0} XP</Text>

      <View style={styles.progressTrack}>
        <LinearGradient
          colors={["#00924A", "#00b563"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${pct}%` }]}
        />
      </View>

      <View style={styles.badgesRow}>
        <Text style={styles.badge}><Text aria-hidden>🥇</Text> Conquista</Text>
        <Text style={styles.badge}><Text aria-hidden>⭐</Text> Destaque</Text>
      </View>

      <Pressable
        onPress={() => navigate('trail-details', trail)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>Continuar de onde parei</Text>
      </Pressable>
    </Animated.View>
  )
}

function MascotCTA() {
  const bounce = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -4, duration: 600, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start()
  }, [bounce])

  return (
    <View style={styles.mascotCta}>
      <Animated.Text style={[styles.mascotEmoji, { transform: [{ translateY: bounce }] }]} aria-label="Mascote Pop Dog">🐶</Animated.Text>
      <Text style={styles.mascotText}>Continue para ganhar XP!</Text>
    </View>
  )
}

// Ícones SVG replicados da versão web
function IconHome({color='#111', size=20}){
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 10.5 12 3l9 7.5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 10v10h14V10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
function IconTrails({color='#111', size=20}){
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h16" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M4 12h16" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M4 18h16" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}
function IconRank({color='#111', size=20}){
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 21V10" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M12 21V3" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M17 21v-6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}
function IconUser({color='#111', size=20}){
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 21a8 8 0 0 1 16 0" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
function IconMail({color='#111', size=20}){
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h16v12H4z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m4 8 8 6 8-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
function IconLock({color='#111', size=20}){
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={11} width={14} height={10} rx={2} stroke={color} strokeWidth={2} />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
function IconArrowRight({color='#111', size=20}){
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h12" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="m12 5 7 7-7 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
function IconStore({color='#111', size=20}){
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 7h18" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M5 7v12h14V7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 11h6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('funcionario')
  const [loading, setLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const { signIn, signUp } = useAuth()
  const canProceed = email && password && (!isRegistering || name) && !loading
  
  const handleLogin = async () => {
    if (!canProceed) return
    
    setLoading(true)
    const result = await signIn(email, password)
    
    if (result.success) {
      onLogin(result.data.user)
    } else {
      Alert.alert('Erro no Login', result.error)
    }
    setLoading(false)
  }

  const handleRegister = async () => {
    if (!canProceed) return

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)
    const result = await signUp(email, password, { name, role })
    
    if (result.success) {
      Alert.alert('Sucesso', 'Conta criada com sucesso! Faça login para continuar.')
      setIsRegistering(false)
      setName('')
      setPassword('')
    } else {
      Alert.alert('Erro no Cadastro', result.error)
    }
    setLoading(false)
  }

  const onForgot = () => Alert.alert('Recuperação de Senha', 'Vamos enviar um link de recuperação para seu e-mail.')

  // Suporte a imagem do herói via expo.extra.loginHero (URL) ou fallback local
  const extra = Constants.expoConfig?.extra || {}
  const heroSource = extra.loginHero ? { uri: extra.loginHero } : require('./assets/splash-icon.png')
  const logoSource = extra.loginLogo ? { uri: extra.loginLogo } : null

  return (
    <SafeAreaView style={styles.loginContainer}>
      <LinearGradient colors={["#0C3B8D", "#1C74D9", "#5CD1F5"]} start={{x:0,y:0}} end={{x:0,y:1}} style={styles.loginGradient}>
        <ScrollView contentContainerStyle={styles.loginContentCenter}>
          <View style={styles.loginCard}>
            {logoSource ? (
              <Image source={logoSource} resizeMode="contain" style={styles.logoInline} accessibilityLabel="Logo PET CLASS" />
            ) : (
              <View style={styles.brandInlineRow}>
                <View style={styles.brandMarkCircle}><Text style={styles.brandPaw}>🐾</Text></View>
                <Text style={styles.brandTextDark}>PET CLASS</Text>
              </View>
            )}
            <Text style={styles.loginTitle}>{isRegistering ? 'Criar Conta' : 'Bem-vindo!'}</Text>
            <Text style={styles.loginSubtitle}>{isRegistering ? 'Preencha os dados para se cadastrar' : 'Faça login para continuar'}</Text>

            {isRegistering && (
              <View style={[styles.inputWrap, { marginTop: 12 }]}>
                <View style={styles.inputIconWrap}><IconUser color="#3F3F46" size={20} /></View>
                <TextInput style={styles.input} placeholder="Nome completo" value={name} onChangeText={setName} />
              </View>
            )}

            <View style={[styles.inputWrap, { marginTop: 12 }]}>
              <View style={styles.inputIconWrap}><IconMail color="#3F3F46" size={20} /></View>
              <TextInput style={styles.input} placeholder="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={[styles.inputWrap, { marginTop: 12 }]}>
              <View style={styles.inputIconWrap}><IconLock color="#3F3F46" size={20} /></View>
              <TextInput secureTextEntry style={styles.input} placeholder="Senha" value={password} onChangeText={setPassword} />
            </View>

            {isRegistering && (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.loginSubtitle, { textAlign: 'left', marginBottom: 8 }]}>Função:</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable 
                    style={[styles.roleButton, role === 'funcionario' && styles.roleButtonActive]}
                    onPress={() => setRole('funcionario')}
                  >
                    <Text style={[styles.roleButtonText, role === 'funcionario' && styles.roleButtonTextActive]}>
                      Funcionário
                    </Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.roleButton, role === 'cliente' && styles.roleButtonActive]}
                    onPress={() => setRole('cliente')}
                  >
                    <Text style={[styles.roleButtonText, role === 'cliente' && styles.roleButtonTextActive]}>
                      Cliente
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {!isRegistering && (
              <View style={styles.forgotLink}>
                <Pressable onPress={onForgot}><Text style={styles.btnLink}>Esqueci minha senha!</Text></Pressable>
              </View>
            )}

            <Pressable 
              style={[styles.primaryButton, { alignSelf: 'center', marginTop: 16 }, !canProceed && { opacity: 0.6, pointerEvents:'none' }]} 
              disabled={!canProceed} 
              onPress={isRegistering ? handleRegister : handleLogin}
            >
              <View style={{flexDirection:'row', alignItems:'center', gap:8}}>
                <Text style={styles.primaryButtonText}>
                  {loading ? (isRegistering ? 'Criando...' : 'Entrando...') : (isRegistering ? 'Criar Conta' : 'Entrar')}
                </Text>
                {!loading && <IconArrowRight color="#fff" size={20} />}
              </View>
            </Pressable>

            <View style={[styles.forgotLink, { marginTop: 12 }]}>
              <Pressable onPress={() => setIsRegistering(!isRegistering)}>
                <Text style={styles.btnLink}>
                  {isRegistering ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  )
}

// Seleção de perfil como na web
function SelectRoleScreen({ onSelect }){
  const roles = [
    {key:'gerente', label:'Gerente'},
    {key:'funcionario', label:'Funcionário'},
    {key:'caixa', label:'Caixa'},
  ]
  return (
    <SafeAreaView style={styles.containerAlt}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, {textAlign:'left'}]}>Selecione seu perfil</Text>
        <View style={styles.grid3}>
          {roles.map(r=> (
            <View key={r.key} style={[styles.card, {alignItems:'center'}]}>
              <Text style={styles.cardIcon}>🐾</Text>
              <Text style={[styles.title, {fontSize:16, marginTop:6}]}>{r.label}</Text>
              <Pressable style={[styles.primaryButton, {marginTop:8}]} onPress={()=>onSelect(r.key)}>
                <Text style={styles.primaryButtonText}>Entrar como {r.label}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function TrailsScreen({ role, navigate }) {
  const { trails, loading, getTrailsByRole } = useTrails()
  const { userData } = useUserData()
  const userRole = userData?.role || role || 'funcionario'
  
  const filteredTrails = useMemo(() => {
    return getTrailsByRole(trails, userRole)
  }, [trails, userRole, getTrailsByRole])
  
  return (
    <SafeAreaView style={styles.containerAlt}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Trilhas de Aprendizado 🐾</Text>
            <Text style={styles.headerSubtitle}>XP total: {userData?.xp_total || 0}</Text>
          </View>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconEmoji}>🏆</Text>
          </View>
        </View>
        <View style={styles.missionBadge}>
          <Text style={styles.missionText}><Text style={{marginRight:6}}>🎯</Text> Missão do dia: Ganhe 10 XP hoje para manter sua sequência!</Text>
        </View>
        <MascotCTA />
        {loading ? (
          <View style={styles.card}>
            <Text style={styles.subtitle}>Carregando trilhas...</Text>
          </View>
        ) : (
          <>
            {filteredTrails.map((trail) => (
              <TrailCard
                key={trail.id}
                trail={trail}
                userData={userData}
                navigate={navigate}
              />
            ))}
          </>
        )}
        <View style={{ height: 24 }} />
        <Text style={styles.footerNote}>🐶 Continue treinando para desbloquear o próximo prêmio!</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

function AulaQuizScreen({ onDone }){
  const [answer,setAnswer] = useState(null)
  const confirm = () => {
    const ok = answer === 'Ouvir com atenção'
    if (ok) {
      alert('Você acertou! +10 pontos')
      onDone && onDone()
    } else {
      alert('Tente novamente! Dica: escute com atenção e ofereça ajuda.')
    }
  }
  return (
    <SafeAreaView style={styles.containerAlt}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, {alignItems:'center'}]}>
          <Text style={styles.title}>Pergunta 1</Text>
          <Text style={styles.subtitle}>O que fazer quando o cliente reclama?</Text>
          {['Ouvir com atenção','Interromper','Ignorar','Fazer cara séria'].map(opt=> (
            <Pressable key={opt} onPress={()=>setAnswer(opt)} style={[styles.primaryButton, {marginTop:8, backgroundColor: (answer===opt?'#0ea5e9':'#0C3B8D')}]}>
              <Text style={styles.primaryButtonText}>{opt}</Text>
            </Pressable>
          ))}
          <Pressable style={[styles.primaryButton, {marginTop:12}]} onPress={confirm}>
            <Text style={styles.primaryButtonText}>Confirmar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function BottomNav({ current, onNavigate }) {
  const Item = ({ id, label, IconComp }) => {
    const isActive = current === id
    const color = isActive ? '#166534' : '#111'
    return (
      <Pressable style={[styles.bottomNavItem, isActive && styles.bottomNavItemActive]} onPress={()=>onNavigate(id)}>
        <IconComp color={color} size={20} />
        <Text style={[styles.bottomNavLabel, isActive && styles.bottomNavLabelActive]}>{label}</Text>
      </Pressable>
    )
  }
  return (
    <View style={styles.bottomNav}>
      <Item id="home" label="Início" IconComp={IconHome} />
      <Item id="trilhas" label="Trilhas" IconComp={IconTrails} />
      <Item id="ranking" label="Ranking" IconComp={IconRank} />
      <Item id="loja" label="Loja" IconComp={IconStore} />
      <Item id="perfil" label="Perfil" IconComp={IconUser} />
    </View>
  )
}

function DashboardScreen({ navigate }) {
  const { userData, loading } = useUserData()
  const { dashboardData, loading: dashboardLoading, refetch } = useDashboard()

  useEffect(() => {
    refetch()
  }, [])

  if (loading || dashboardLoading) {
    return (
      <SafeAreaView style={styles.containerAlt}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.subtitle}>Carregando dashboard...</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  const totalXp = dashboardData?.stats?.total_xp ?? userData?.xp_total ?? 0
  const level = dashboardData?.stats?.level ?? userData?.level ?? 1

  return (
    <SafeAreaView style={styles.containerAlt}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Olá, {userData?.name || 'Usuário'}! 👋</Text>
            <Text style={styles.headerSubtitle}>Continue aprendendo</Text>
          </View>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconEmoji}>🐾</Text>
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Seu progresso</Text>
          <Text style={styles.subtitle}>
            XP Total: {totalXp} • Nível: {level}
          </Text>
          <Text style={styles.subtitle}>
            Sequência: {userData?.streak_days || 0} dias
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => navigate('trilhas')}>
            <Text style={styles.primaryButtonText}>Ir para trilhas</Text>
          </Pressable>
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Próximas aulas</Text>
          <View style={styles.grid3}>
            <Pressable style={styles.gridItem}>
              <Text style={styles.gridIcon}>🐾</Text>
              <Text style={styles.gridLabel}>Atendimento</Text>
            </Pressable>
            <Pressable style={styles.gridItem}>
              <Text style={styles.gridIcon}>🛒</Text>
              <Text style={styles.gridLabel}>Vendas</Text>
            </Pressable>
            <Pressable style={styles.gridItem}>
              <Text style={styles.gridIcon}>🐶</Text>
              <Text style={styles.gridLabel}>Produtos Pet</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Conquistas</Text>
          <View style={styles.grid3}>
            <Text style={styles.badge}>🥇 Medalha Ouro</Text>
            <Text style={styles.badge}>🔥 Série {userData?.streak_days || 0} dias</Text>
            <Text style={styles.badge}>⭐ Destaque</Text>
          </View>
        </View>
        <MascotCTA />
      </ScrollView>
    </SafeAreaView>
  )
}

function RankingScreen() {
  const { user } = useAuth()
  const { userData } = useUserData()
  const [myRanking, setMyRanking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchMyRanking()
  }, [user])

  const fetchMyRanking = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .rpc('get_my_ranking', { user_id_param: user.id })

      if (error) throw error
      setMyRanking(data)
    } catch (err) {
      console.error('Erro ao buscar ranking:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.containerAlt}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.subtitle}>Carregando ranking...</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  const position = myRanking?.position || '-'
  const totalUsers = myRanking?.total_users || 0
  const totalXp = myRanking?.total_xp || userData?.total_xp || 0
  const level = myRanking?.level || userData?.level || 1
  const streak = myRanking?.current_streak || 0
  const lessonsCount = myRanking?.lessons_completed || 0
  const quizzesCount = myRanking?.quizzes_completed || 0

  return (
    <SafeAreaView style={styles.containerAlt}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Meu Ranking</Text>
          <Text style={styles.subtitle}>Sua posicao entre {totalUsers} participantes</Text>
        </View>

        <View style={[styles.card, { backgroundColor: '#e6f7ff', alignItems: 'center', paddingVertical: 24 }]}>
          <Text style={{ fontSize: 48, fontWeight: 'bold', color: '#00924A' }}>{position}º</Text>
          <Text style={[styles.title, { marginTop: 4 }]}>{myRanking?.name || userData?.name}</Text>
          <Text style={styles.subtitle}>de {totalUsers} participantes</Text>
        </View>

        <View style={styles.card}>
          <Text style={[styles.title, { marginBottom: 12 }]}>Suas Estatisticas</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={styles.subtitle}>XP Total</Text>
            <Text style={styles.title}>{totalXp}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={styles.subtitle}>Nivel</Text>
            <Text style={styles.title}>{level}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={styles.subtitle}>Sequencia</Text>
            <Text style={styles.title}>{streak} dias</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={styles.subtitle}>Aulas Concluidas</Text>
            <Text style={styles.title}>{lessonsCount}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.subtitle}>Quizzes Corretos</Text>
            <Text style={styles.title}>{quizzesCount}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.subtitle}>
            Continue estudando para subir no ranking! Cada aula e quiz completado aumenta sua posicao.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function PerfilScreen() {
  const { user, signOut } = useAuth()
  const { userData, loading } = useUserData()
  const { dashboardData, refetch } = useDashboard()

  useEffect(() => {
    refetch()
  }, [])
  
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: async () => {
            const result = await signOut()
            if (!result.success) {
              Alert.alert('Erro', 'Não foi possível fazer logout')
            }
          }
        }
      ]
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.containerAlt}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.subtitle}>Carregando perfil...</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  const totalXp = dashboardData?.stats?.total_xp ?? userData?.xp_total ?? 0
  const level = dashboardData?.stats?.level ?? userData?.level ?? 1

  return (
    <SafeAreaView style={styles.containerAlt}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Perfil</Text>
          <Text style={styles.subtitle}>Nome: {userData?.name || 'Usuário'}</Text>
          <Text style={styles.subtitle}>E-mail: {user?.email || 'N/A'}</Text>
          <Text style={styles.subtitle}>Papel: {userData?.role || 'N/A'}</Text>
          <Text style={styles.subtitle}>XP Total: {totalXp}</Text>
          <Text style={styles.subtitle}>Nível: {level}</Text>
          <Text style={styles.subtitle}>Sequência: {userData?.streak_days || 0} dias</Text>
          
          <Pressable style={[styles.primaryButton, { marginTop: 20, backgroundColor: '#dc2626' }]} onPress={handleLogout}>
            <Text style={styles.primaryButtonText}>Sair</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function TrailDetailsScreen({ trail, navigate }) {
  const { lessons, loading, markLessonComplete } = useLessons(trail?.id)
  const { userData } = useUserData()

  const handleLessonPress = (lesson) => {
    if (!lesson.isUnlocked) {
      alert('Complete a lição anterior para desbloquear esta!');
      return;
    }
    navigate('lesson-details', { trail, lesson })
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.containerAlt}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.subtitle}>Carregando aulas...</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.containerAlt}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Pressable 
            style={{ marginBottom: 16 }}
            onPress={() => navigate('trilhas')}
          >
            <Text style={styles.linkText}>← Voltar para trilhas</Text>
          </Pressable>
          <Text style={styles.title}>{trail?.title}</Text>
          <Text style={styles.subtitle}>{trail?.description}</Text>
          <Text style={styles.subtitle}>
            Progresso: {lessons.filter(l => l.completed).length}/{lessons.length} aulas
          </Text>
        </View>
        
        {lessons.map((lesson, index) => (
          <View key={lesson.id} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  {index + 1}. {lesson.title}
                </Text>
                <Text style={styles.subtitle}>{lesson.description}</Text>
                <Text style={styles.subtitle}>XP: {lesson.xp_reward}</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                {lesson.completed ? (
                  <Text style={{ fontSize: 24 }}>✅</Text>
                ) : lesson.isUnlocked ? (
                  <Pressable 
                    style={styles.primaryButton}
                    onPress={() => handleLessonPress(lesson)}
                  >
                    <Text style={styles.primaryButtonText}>Iniciar</Text>
                  </Pressable>
                ) : (
                  <View style={styles.lockedButton}>
                    <Text style={{ fontSize: 24 }}>🔒</Text>
                    <Text style={styles.lockedButtonText}>Bloqueada</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}
        
        {lessons.length === 0 && (
          <View style={styles.card}>
            <Text style={styles.subtitle}>Nenhuma aula encontrada nesta trilha.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function LessonDetailsScreen({ trail, lesson, navigate }) {
  const { user } = useAuth()
  const { quizzes, loading: quizzesLoading, submitQuizAnswer } = useQuizzes(lesson?.id)
  const { completeLesson, checkAutoCompletion, refreshLessonProgress, refetch } = useLessons(trail?.id)
  const [showResults, setShowResults] = useState(false)
  const [lessonCompleted, setLessonCompleted] = useState(false)
  const [showVideo, setShowVideo] = useState(true)
  const [videoCompleted, setVideoCompleted] = useState(false)
  const [quizResults, setQuizResults] = useState([])
  const [totalXP, setTotalXP] = useState(0)

  const handleVideoComplete = () => {
    setVideoCompleted(true)
    setShowVideo(false)
  }

  const handleQuizComplete = async (results, earnedXP) => {
    // Salvar resultados do quiz
    setQuizResults(results)
    setTotalXP(earnedXP)
    setShowResults(true)
    
    // Verificar conclusão automática da aula após completar todos os quizzes
    try {
      // Aguardar um pouco para o trigger processar as tentativas
      setTimeout(async () => {
        await checkAutoCompletion(lesson.id)
        await refreshLessonProgress()
        
        // Verificar se a aula foi marcada como concluída automaticamente
        const updatedLessons = await refetch()
        const updatedLesson = updatedLessons.find(l => l.id === lesson.id)
        if (updatedLesson?.is_completed) {
          setLessonCompleted(true)
        }
      }, 1000) // Aguardar 1 segundo para o sistema processar
    } catch (error) {
      console.error('Erro ao verificar conclusão automática:', error)
      
      // Fallback: marcar manualmente se a verificação automática falhar
      try {
        const completeResult = await completeLesson(lesson.id)
        if (completeResult.success) {
          setLessonCompleted(true)
        }
      } catch (fallbackError) {
        console.error('Erro no fallback de conclusão:', fallbackError)
      }
    }
  }

  const handleQuizAnswerSubmit = async (quizId, isCorrect, xpEarned) => {
    // Callback individual para cada quiz (opcional)
    console.log(`Quiz ${quizId}: ${isCorrect ? 'Correto' : 'Incorreto'}, XP: ${xpEarned}`)
  }

  const handleFinishLesson = async () => {
    // Marcar aula como concluída (para aulas sem quiz)
    if (!lessonCompleted) {
      const completeResult = await completeLesson(lesson.id)
      if (completeResult.success) {
        setLessonCompleted(true)
        setShowResults(true)
        return
      }
    }
    // Voltar para a trilha
    navigate('trail-details', trail)
  }

  if (quizzesLoading) {
    return (
      <SafeAreaView style={styles.containerAlt}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.subtitle}>Carregando aula...</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  if (showResults) {
    const correctAnswers = quizResults.filter(result => result.correct).length
    const percentage = quizResults.length > 0 ? Math.round((correctAnswers / quizResults.length) * 100) : 0

    return (
      <SafeAreaView style={styles.containerAlt}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.title}>🎉 Aula Concluída!</Text>
            <Text style={styles.subtitle}>
              Desempenho: {correctAnswers} de {quizResults.length} perguntas corretas ({percentage}%)
            </Text>
            <Text style={styles.subtitle}>
              XP ganho: {totalXP}
            </Text>
            
            {percentage >= 80 && (
              <Text style={styles.subtitle}>⭐ Excelente desempenho!</Text>
            )}
            {percentage >= 60 && percentage < 80 && (
              <Text style={styles.subtitle}>👍 Bom trabalho!</Text>
            )}
            {percentage < 60 && (
              <Text style={styles.subtitle}>📚 Continue estudando!</Text>
            )}
            
            {lessonCompleted && (
              <Text style={styles.subtitle}>✅ Progresso salvo!</Text>
            )}
            
            <Pressable 
              style={[styles.primaryButton, { marginTop: 20 }]}
              onPress={handleFinishLesson}
            >
              <Text style={styles.primaryButtonText}>Voltar para trilha</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  if (quizzes.length === 0) {
    return (
      <SafeAreaView style={styles.containerAlt}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Pressable 
              style={{ marginBottom: 16 }}
              onPress={() => navigate('trail-details', trail)}
            >
              <Text style={styles.linkText}>← Voltar para trilha</Text>
            </Pressable>
            <Text style={styles.title}>{lesson?.title}</Text>
            <Text style={styles.subtitle}>{lesson?.description}</Text>
            <Text style={styles.subtitle}>Esta aula não possui quizzes.</Text>
            <Pressable 
              style={[styles.primaryButton, { marginTop: 20 }]}
              onPress={async () => {
                const result = await markLessonComplete(lesson.id)
                if (result.success) {
                  Alert.alert('Sucesso', 'Aula concluída!')
                  navigate('trail-details', trail)
                }
              }}
            >
              <Text style={styles.primaryButtonText}>Marcar como concluída</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.containerAlt}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Pressable 
            style={{ marginBottom: 16 }}
            onPress={() => navigate('trail-details', trail)}
          >
            <Text style={styles.linkText}>← Voltar para trilha</Text>
          </Pressable>
          <Text style={styles.title}>{lesson?.title}</Text>
          <Text style={styles.subtitle}>{lesson?.description}</Text>
          
          {/* Vídeo da aula */}
          {showVideo && (
            <View>
              <VideoPlayer
                videoUrl={lesson.video_url}
                onVideoComplete={handleVideoComplete}
                lesson={lesson}
              />
            </View>
          )}
          
          {/* Quiz interativo */}
          {videoCompleted && !showResults && (
            <View style={{ marginTop: 20 }}>
              {quizzesLoading ? (
                <Text style={styles.subtitle}>Carregando quiz...</Text>
              ) : quizzes.length === 0 ? (
                // Aula sem quiz
                <Pressable 
                  style={[styles.primaryButton, { marginTop: 20 }]}
                  onPress={handleFinishLesson}
                >
                  <Text style={styles.primaryButtonText}>Marcar como concluída</Text>
                </Pressable>
              ) : (
                // Quiz interativo estilo Duolingo
                <QuizGame
                  quizzes={quizzes}
                  user={user}
                  onComplete={handleQuizComplete}
                  onQuizComplete={handleQuizAnswerSubmit}
                />
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function LojaScreen() {
  const { userData } = useUserData()
  const { items, loading, purchaseItem, hasItem, canAffordItem } = useStore()

  const handlePurchase = async (item) => {
    if (!canAffordItem(item.id, userData?.coins || 0)) {
      Alert.alert('Moedas insuficientes', `Você precisa de ${item.price} moedas para comprar este item.`)
      return
    }

    if (hasItem(item.id)) {
      Alert.alert('Item já possui', 'Você já possui este item.')
      return
    }

    const result = await purchaseItem(item.id)
    if (result.success) {
      Alert.alert('Compra realizada!', `Você comprou ${item.name} por ${item.price} moedas.`)
    } else {
      Alert.alert('Erro na compra', result.error || 'Não foi possível realizar a compra.')
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.containerAlt}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.subtitle}>Carregando loja...</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.containerAlt}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Loja</Text>
          <Text style={styles.subtitle}>Suas moedas: {userData?.coins || 0} 🪙</Text>
        </View>
        
        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.subtitle}>{item.description}</Text>
                <Text style={styles.subtitle}>Preço: {item.price} 🪙</Text>
              </View>
              <Pressable 
                style={[
                  styles.primaryButton, 
                  { 
                    backgroundColor: hasItem(item.id) ? '#6b7280' : 
                                   canAffordItem(item.id, userData?.coins || 0) ? '#00924A' : '#dc2626',
                    minWidth: 80
                  }
                ]} 
                onPress={() => handlePurchase(item)}
                disabled={hasItem(item.id)}
              >
                <Text style={styles.primaryButtonText}>
                  {hasItem(item.id) ? 'Possui' : 'Comprar'}
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
        
        {items.length === 0 && (
          <View style={styles.card}>
            <Text style={styles.subtitle}>Nenhum item disponível na loja.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function AppContent() {
  const { user, loading } = useAuth()
  const [route, setRoute] = useState('home')
  const [screenParams, setScreenParams] = useState(null)
  
  const goto = (newRoute, params = null) => {
    setRoute(newRoute)
    setScreenParams(params)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.containerAlt}>
        <View style={[styles.scrollContent, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.subtitle}>Carregando...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!user) {
    return <LoginScreen onLogin={() => setRoute('home')} />
  }

  return (
    <View style={{ flex: 1 }}>
      {route==='home' && <DashboardScreen navigate={goto} />}
      {route==='trilhas' && <TrailsScreen navigate={goto} />}
      {route==='ranking' && <RankingScreen />}
      {route==='perfil' && <PerfilScreen />}
      {route==='loja' && <LojaScreen />}
      {route==='trail-details' && <TrailDetailsScreen navigate={goto} trail={screenParams} />}
      {route==='lesson-details' && <LessonDetailsScreen navigate={goto} trail={screenParams?.trail} lesson={screenParams?.lesson} />}
      <BottomNav current={route} onNavigate={goto} />
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

const styles = StyleSheet.create({
  // Login hero layout
  loginContainer: {
    flex: 1,
    backgroundColor: '#0C3B8D',
  },
  loginGradient: {
    flex: 1,
  },
  loginContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  loginContentCenter: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
  },
  brandMarkCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandPaw: {
    fontSize: 22,
  },
  brandText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 24,
    letterSpacing: 1,
  },
  heroContainer: {
    width: '100%',
    height: 300,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 12,
    // iOS shadow
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    // Android elevation
    elevation: 6,
    backgroundColor: '#0C3B8D',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  brandInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 6,
  },
  brandTextDark: {
    color: '#0C3B8D',
    fontWeight: '800',
    fontSize: 24,
    letterSpacing: 1,
  },
  logoInline: {
    width: 180,
    height: 58,
    alignSelf: 'center',
    marginBottom: 8,
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#f7f7f8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  containerAlt: {
    flex: 1,
    backgroundColor: '#f7f7f8',
    paddingHorizontal: 16,
    paddingBottom: 72,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginTop: 2,
  },
  headerIcon: {
    marginLeft: 'auto',
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    padding: 8,
  },
  headerIconEmoji: {
    fontSize: 18,
  },
  missionBadge: {
    marginTop: 6,
    marginBottom: 4,
    backgroundColor: '#F0FDF4',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderColor: '#DCFCE7',
    borderWidth: 1,
  },
  missionText: {
    color: '#166534',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
    width: '100%',
    // iOS shadow
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    // Android elevation
    elevation: 4,
    marginTop: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    textAlign: 'center',
    lineHeight: 36,
    fontSize: 18,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginLeft: 8,
  },
  levelBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3730A3',
  },
  subtitleSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderColor: '#e5ece8',
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 6,
  },
  badge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
    borderWidth: 1,
    color: '#166534',
    fontWeight: '700',
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#0C3B8D',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  lockedButton: {
    backgroundColor: '#9CA3AF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    opacity: 0.7,
  },
  lockedButtonText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    textAlign: 'center',
    marginBottom: 12,
  },
  mascotCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 10,
  },
  mascotEmoji: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    textAlign: 'center',
    lineHeight: 40,
    fontSize: 22,
    marginRight: 8,
    elevation: 2,
  },
  mascotText: {
    color: '#0C4A6E',
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  footerNote: {
    marginTop: 10,
    textAlign: 'center',
    color: '#555',
  },
  // Login specific styles
  loginCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    // iOS shadow
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    // Android elevation
    elevation: 6,
    marginTop: 12,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  inputIconWrap: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#111',
  },
  forgotLink: {
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 2,
  },
  btnLink: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    // iOS shadow
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    // Android elevation
    elevation: 8,
  },
  bottomNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  bottomNavItemActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
    borderWidth: 1,
  },
  bottomNavIcon: {
    fontSize: 18,
    color: '#111',
  },
  bottomNavIconActive: {
    color: '#166534',
  },
  bottomNavLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111',
    marginTop: 2,
  },
  bottomNavLabelActive: {
    color: '#166534',
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 6,
  },
  badge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
    borderWidth: 1,
    color: '#166534',
    fontWeight: '700',
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#0C3B8D',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    textAlign: 'center',
    marginBottom: 12,
  },
  mascotCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 10,
  },
  mascotEmoji: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    textAlign: 'center',
    lineHeight: 40,
    fontSize: 22,
    marginRight: 8,
    elevation: 2,
  },
  mascotText: {
    color: '#0C4A6E',
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  footerNote: {
    marginTop: 10,
    textAlign: 'center',
    color: '#555',
  },
  roleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#3730A3',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  roleButtonTextActive: {
     color: '#3730A3',
   },
   quizOption: {
     padding: 16,
     marginVertical: 8,
     borderRadius: 8,
     borderWidth: 1,
     borderColor: '#E5E7EB',
     backgroundColor: '#F9FAFB',
   },
   quizOptionSelected: {
     backgroundColor: '#EEF2FF',
     borderColor: '#3730A3',
   },
   quizOptionText: {
     fontSize: 16,
     color: '#374151',
   },
   quizOptionTextSelected: {
     color: '#3730A3',
     fontWeight: '600',
   },
 })
