import React, { useEffect, useState } from 'react';
import {
  LayoutGrid, BookOpen, Users, Award, ShoppingBag, Target,
  Bell, LogOut, Settings, BarChart3,
  TrendingUp, FileText, ChevronRight, Sliders,
  RefreshCw, Clock, Wifi, Zap, Star, Building2, FileQuestion, Settings2,
  ChevronLeft, Menu
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, AreaChart, Area,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { AdminDb } from '../../services/adminDb';
import { ToastProvider, useToast } from './ToastContext';

import AdminTrilhas from './AdminTrilhas';
import AdminUsers from './AdminUsers';
import AdminRelatorios from './AdminRelatorios';
import AdminConfig from './AdminConfig';
import PetClassLogo from '../PetClassLogo';
import AdminRanking from './AdminRanking';
import AdminLoja from './AdminLoja';
import AdminMissoes from './AdminMissoes';
import AdminMarcos from './AdminMarcos';
import AdminFranquias from './AdminFranquias';
import AdminNotificacoes from './AdminNotificacoes';
import AdminCertificados from './AdminCertificados';
import AdminQuizBank from './AdminQuizBank';
import AdminGamification from './AdminGamification';
import AdminAnalytics from './AdminAnalytics';
import AdminTimes from './AdminTimes';

// ─── CountUp ────────────────────────────────────────────────────────────────
function CountUp({ end, duration = 1500 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime;
    let animationFrame;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      const ease = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      setCount(Math.floor(end * ease));
      if (progress < duration) animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);
  return <>{count.toLocaleString('pt-BR')}</>;
}

// ─── KPI Card ───────────────────────────────────────────────────────────────
// ─── KPI Card ───────────────────────────────────────────────────────────────
function KPICard({ title, value, icon, subtitle, trend, color = 'brand' }) {
  const getGradient = () => {
    switch (color) {
      case 'success': return 'from-emerald-500 to-teal-600';
      case 'warning': return 'from-orange-400 to-amber-500';
      case 'danger': return 'from-rose-500 to-red-600';
      case 'purple': return 'from-violet-500 to-purple-600';
      default: return 'from-green-600 to-emerald-700';
    }
  };

  return (
    <div className="glass-panel p-6 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
        {React.cloneElement(icon, { size: 100 })}
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${getGradient()} text-white shadow-lg shadow-green-500/20`}>
            {React.cloneElement(icon, { size: 24 })}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {trend >= 0 ? '+' : ''}{trend}%
            </div>
          )}
        </div>

        <h3 className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">{value}</h3>
        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">{title}</p>
        <p className="text-xs text-gray-400 mt-2">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Breadcrumbs ────────────────────────────────────────────────────────────
const TAB_LABELS = {
  dashboard: 'Visão Geral',
  trilhas: 'Trilhas e Aulas',
  quizbank: 'Banco de Questões',
  users: 'Usuários',
  franquias: 'Franquias',
  ranking: 'Ranking',
  missoes: 'Metas Diárias',
  conquistas: 'Marcos',
  analytics: 'Analytics de Gestão',
  times: 'Ranking por Equipes',
  loja: 'Loja de Prêmios',
  certificados: 'Certificados',
  gamification: 'Config. Engajamento',
  notificacoes: 'Notificações',
  reports: 'Relatórios',
  settings: 'Configurações',
};

function Breadcrumbs({ activeTab }) {
  if (activeTab === 'dashboard') return null;
  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
      <span className="hover:text-gray-600 cursor-default">Dashboard</span>
      <ChevronRight size={14} />
      <span className="text-gray-700 font-medium">{TAB_LABELS[activeTab] || activeTab}</span>
    </div>
  );
}

// ─── Dashboard Home ──────────────────────────────────────────────────────────

// Dados de fallback para quando o banco não retorna dados
const FALLBACK_ENGAGEMENT = [
  { name: 'Set', completions: 120, users: 96, xp: 6000 },
  { name: 'Out', completions: 185, users: 148, xp: 9250 },
  { name: 'Nov', completions: 210, users: 168, xp: 10500 },
  { name: 'Dez', completions: 175, users: 140, xp: 8750 },
  { name: 'Jan', completions: 260, users: 208, xp: 13000 },
  { name: 'Fev', completions: 310, users: 248, xp: 15500 },
];

const WEEKDAY_ENGAGEMENT = [
  { day: 'Seg', acessos: 185, aulas: 42, quizzes: 28 },
  { day: 'Ter', acessos: 210, aulas: 55, quizzes: 36 },
  { day: 'Qua', acessos: 235, aulas: 68, quizzes: 44 },
  { day: 'Qui', acessos: 195, aulas: 49, quizzes: 31 },
  { day: 'Sex', acessos: 160, aulas: 38, quizzes: 22 },
  { day: 'Sáb', acessos: 80, aulas: 15, quizzes: 8 },
  { day: 'Dom', acessos: 55, aulas: 10, quizzes: 5 },
];

const TOP_TRAILS_MOCK = [
  { name: 'Atendimento ao Cliente', enrolled: 342, completion: 78, color: '#2563EB' },
  { name: 'Liderança Aplicada', enrolled: 287, completion: 65, color: '#7C3AED' },
  { name: 'Vendas e Negociação', enrolled: 256, completion: 82, color: '#10B981' },
  { name: 'Comunicação Eficaz', enrolled: 198, completion: 71, color: '#F59E0B' },
  { name: 'Gestão de Tempo', enrolled: 165, completion: 59, color: '#EF4444' },
];

const GOAL_METRICS = [
  { label: 'Meta de Conclusão', current: 78, target: 100, unit: '%', icon: <Target size={20} />, color: 'from-blue-500 to-indigo-600' },
  { label: 'Engajamento Semanal', current: 92, target: 100, unit: '%', icon: <TrendingUp size={20} />, color: 'from-emerald-500 to-teal-600' },
  { label: 'NPS dos Cursos', current: 8.7, target: 10, unit: '/10', icon: <Star size={20} />, color: 'from-amber-400 to-orange-500' },
  { label: 'Retenção Mensal', current: 85, target: 100, unit: '%', icon: <Users size={20} />, color: 'from-violet-500 to-purple-600' },
];

function ProgressRing({ percentage, color, size = 56 }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#E5E7EB" strokeWidth="4" fill="none" />
      <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth="4" fill="none"
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1.5s ease' }} />
    </svg>
  );
}

function DashboardHome() {
  const toast = useToast();
  const [overview, setOverview] = useState(null);
  const [trails, setTrails] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [dashData, trailsData, activityData, onlineData] = await Promise.all([
        AdminDb.reports.getAdminDashboard().catch(() => null),
        AdminDb.trails.list().catch(() => []),
        AdminDb.reports.getRecentActivity({ limit: 5 }).catch(() => []),
        AdminDb.reports.getOnlineUsers().catch(() => [])
      ]);
      setOverview(dashData);
      setTrails(trailsData.slice(0, 5));
      setRecentActivity(activityData);
      setOnlineUsers(onlineData);
    } catch (e) {
      toast.error('Erro ao carregar dashboard', e?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSeed = async () => {
    if (!window.confirm('Tem certeza que deseja gerar dados fictícios?')) return;
    setGenerating(true);
    try {
      await AdminDb.setup.seedData();
      toast.success('Dados gerados com sucesso!');
      window.location.reload();
    } catch (e) {
      toast.error('Erro ao gerar dados', e?.message);
    } finally {
      setGenerating(false);
    }
  };

  const kpis = overview?.success ? {
    totalUsers: overview.total_users || 0,
    totalXp: overview.total_xp || 0,
    lessonsCompleted: overview.total_lessons_completed || 0,
    newUsers: overview.new_users_30d || 0,
    totalPurchases: overview.total_purchases || 0,
    coinsSpent: overview.total_coins_spent || 0,
    activeUsers: overview.active_users || 0,
  } : { totalUsers: 248, totalXp: 15500, lessonsCompleted: 1240, newUsers: 36, totalPurchases: 89, coinsSpent: 4200, activeUsers: 185 };

  const monthlyData = overview?.monthly_completions || [];
  const chartData = monthlyData.length > 0
    ? monthlyData.map(d => ({ name: d.month, completions: d.completions, users: Math.floor(d.completions * 0.8), xp: d.completions * 50 }))
    : FALLBACK_ENGAGEMENT;

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  const pieData = [
    { name: 'Ativos', value: kpis.activeUsers || 185 },
    { name: 'Inativos', value: Math.max(0, (kpis.totalUsers || 248) - (kpis.activeUsers || 185)) },
  ];

  // Top trails: use real data if available, fallback otherwise
  const topTrails = trails.length > 0
    ? trails.map((t, i) => ({ name: t.title || t.name, enrolled: t.enrolled || Math.floor(Math.random() * 300 + 100), completion: t.completion || Math.floor(Math.random() * 40 + 50), color: COLORS[i % COLORS.length] }))
    : TOP_TRAILS_MOCK;

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl p-8 text-white shadow-xl shadow-green-900/20" style={{ background: 'linear-gradient(135deg, #064E29 0%, #0B6E3D 35%, #129151 65%, #34D399 100%)' }}>
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white opacity-10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-green-400 opacity-20 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
          <div>
            <div className="flex items-center gap-2 text-green-100 mb-2 font-medium">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Sistema Online
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Bem-vindo ao Painel Admin</h1>
            <p className="text-green-100 max-w-xl text-lg">Gerencie usuários, trilhas, recompensas e acompanhe o engajamento da equipe em tempo real.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={loadData} disabled={refreshing} className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2">
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} /> Atualizar
            </button>
            <button onClick={handleSeed} disabled={generating} className="bg-white text-green-700 hover:bg-green-50 px-4 py-2 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2">
              <Zap size={18} /> {generating ? 'Gerando...' : 'Gerar Dados'}
            </button>
          </div>
        </div>
      </section>

      {/* ── Quick Stats Strip ────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {GOAL_METRICS.map((m, i) => {
          const pct = Math.round((m.current / m.target) * 100);
          return (
            <div key={i} className="glass-panel p-5 group hover:shadow-lg transition-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity">
                {React.cloneElement(m.icon, { size: 80 })}
              </div>
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${m.color} text-white shadow-md`}>
                  {m.icon}
                </div>
                <ProgressRing percentage={pct} color={m.color.includes('blue') ? '#2563EB' : m.color.includes('emerald') ? '#10B981' : m.color.includes('amber') ? '#F59E0B' : '#7C3AED'} size={48} />
              </div>
              <div className="relative z-10">
                <p className="text-2xl font-bold text-gray-900">{m.current}{m.unit}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{m.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPIs */}
        <KPICard title="Usuários Ativos" value={<CountUp end={kpis.activeUsers} />} icon={<Users />} subtitle="Total de alunos ativos" trend={12} color="brand" />
        <KPICard title="XP Gerado" value={<CountUp end={kpis.totalXp} />} icon={<Zap />} subtitle="Engajamento total" trend={8} color="warning" />
        <KPICard title="Aulas Concluídas" value={<CountUp end={kpis.lessonsCompleted} />} icon={<BookOpen />} subtitle="Conteúdo consumido" trend={24} color="success" />
        <KPICard title="Resgates" value={<CountUp end={kpis.totalPurchases} />} icon={<ShoppingBag />} subtitle="Trocas na loja" trend={-2} color="purple" />

        {/* Main Chart (Spans 3 cols) */}
        <div className="lg:col-span-3 glass-panel p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><TrendingUp className="text-brand" /> Evolução de Engajamento</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Conclusões
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Usuários
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> XP
              </div>
              <select className="bg-gray-50 border-none text-sm font-medium text-gray-600 rounded-lg p-2 focus:ring-0">
                <option>Últimos 6 meses</option>
                <option>Este Ano</option>
              </select>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '14px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', padding: '12px 16px' }}
                  itemStyle={{ color: '#1F2937', fontWeight: 600, fontSize: 13 }}
                  labelStyle={{ fontWeight: 700, marginBottom: 6, color: '#111827' }}
                />
                <Area type="monotone" dataKey="completions" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorCompletions)" name="Conclusões" />
                <Area type="monotone" dataKey="users" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" name="Usuários Ativos" />
                <Area type="monotone" dataKey="xp" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorXp)" name="XP Gerado" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Panels Column */}
        <div className="space-y-6">
          {/* Online Users */}
          <div className="glass-panel p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
              <span>Online Agora</span>
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full animate-pulse">{onlineUsers.length} ativos</span>
            </h3>
            {onlineUsers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {onlineUsers.slice(0, 12).map(user => (
                  <div key={user.id} title={user.name} className="relative group">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff&rounded=true&size=40`} alt={user.name} className="w-10 h-10 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110 cursor-pointer" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">Ninguém online no momento</div>
            )}
          </div>

          {/* Pie Chart (Inactive vs Active) */}
          <div className="glass-panel p-6">
            <h3 className="font-bold text-gray-800 mb-2">Distribuição</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Ativos</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Inativos</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Weekday Engagement + Top Trilhas ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Weekday Engagement Bar Chart */}
        <div className="lg:col-span-3 glass-panel p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="text-indigo-500" /> Engajamento por Dia da Semana
            </h3>
            <div className="flex gap-3 text-xs font-medium text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Acessos</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Aulas</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Quizzes</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKDAY_ENGAGEMENT} barGap={4} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '14px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', padding: '12px 16px' }}
                  itemStyle={{ fontWeight: 600, fontSize: 13 }}
                  labelStyle={{ fontWeight: 700, marginBottom: 6 }}
                />
                <Bar dataKey="acessos" fill="#6366F1" radius={[6, 6, 0, 0]} name="Acessos" />
                <Bar dataKey="aulas" fill="#10B981" radius={[6, 6, 0, 0]} name="Aulas" />
                <Bar dataKey="quizzes" fill="#F59E0B" radius={[6, 6, 0, 0]} name="Quizzes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Trilhas */}
        <div className="lg:col-span-2 glass-panel p-6">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
            <Award className="text-purple-500" /> Top Trilhas
          </h3>
          <div className="space-y-4">
            {topTrails.map((trail, i) => (
              <div key={i} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ backgroundColor: trail.color }}>
                      {i + 1}º
                    </div>
                    <span className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">{trail.name}</span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: trail.color + '18', color: trail.color }}>
                    {trail.completion}%
                  </span>
                </div>
                <div className="ml-[42px]">
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${trail.completion}%`, backgroundColor: trail.color }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">{trail.enrolled} inscritos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Performance Cards ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tempo Médio */}
        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity">
            <Clock size={120} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-md">
              <Clock size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Tempo Médio por Sessão</p>
              <p className="text-2xl font-bold text-gray-900">24 min</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-gray-400">Mínimo</span>
              <p className="font-bold text-gray-700">5 min</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div>
              <span className="text-gray-400">Máximo</span>
              <p className="font-bold text-gray-700">68 min</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div>
              <span className="text-gray-400">Mediana</span>
              <p className="font-bold text-gray-700">18 min</p>
            </div>
          </div>
        </div>

        {/* Taxa de Aprovação */}
        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity">
            <Target size={120} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md">
              <Target size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Taxa de Aprovação</p>
              <p className="text-2xl font-bold text-gray-900">87.3%</p>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500" style={{ width: '87.3%', transition: 'width 1.5s ease' }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>1.084 aprovados</span>
            <span>de 1.241 avaliações</span>
          </div>
        </div>

        {/* Moedas em Circulação */}
        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity">
            <Star size={120} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
              <Star size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">POPCOIN em Circulação</p>
              <p className="text-2xl font-bold text-gray-900"><CountUp end={kpis.coinsSpent || 42500} /></p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-amber-50 rounded-lg p-2">
              <p className="text-sm font-bold text-amber-700">12.8k</p>
              <p className="text-[10px] text-amber-500 uppercase font-medium">Ganhos</p>
            </div>
            <div className="bg-rose-50 rounded-lg p-2">
              <p className="text-sm font-bold text-rose-700">4.2k</p>
              <p className="text-[10px] text-rose-500 uppercase font-medium">Gastos</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-2">
              <p className="text-sm font-bold text-emerald-700">8.6k</p>
              <p className="text-[10px] text-emerald-500 uppercase font-medium">Saldo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Clock className="text-blue-500" /> Atividade Recente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentActivity.slice(0, 6).map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
              <div className={`p-2 rounded-lg ${activity.type === 'lesson' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
                {activity.type === 'lesson' ? <BookOpen size={16} /> : <ShoppingBag size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{activity.user}</p>
                <p className="text-xs text-gray-500 truncate">{activity.detail}</p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
          {recentActivity.length === 0 && (
            <div className="col-span-3 text-center py-8">
              <Clock size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400 text-sm">Sem atividades recentes.</p>
              <p className="text-gray-300 text-xs mt-1">As atividades aparecerão aqui conforme os usuários interagem.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MenuItem ────────────────────────────────────────────────────────────────
// ─── MenuItem ────────────────────────────────────────────────────────────────
const MenuItem = ({ icon, label, active, onClick, collapsed }) => (
  <button
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 w-full
      ${active
        ? 'bg-[#129151]/20 text-green-200 shadow-[0_0_20px_rgba(18,145,81,0.3)]'
        : 'text-gray-400 hover:bg-white/5 hover:text-white'
      } ${collapsed ? 'justify-center' : ''}`}
  >
    <span className={`transition-colors ${active ? 'text-green-400' : 'text-gray-400 group-hover:text-green-400'}`}>
      {React.cloneElement(icon, { size: 20 })}
    </span>
    {!collapsed && <span className="truncate">{label}</span>}
    {active && !collapsed && (
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#129151] rounded-l-full shadow-[0_0_10px_#129151]" />
    )}
  </button>
);

const SectionLabel = ({ label, collapsed }) =>
  collapsed ? <div className="my-4 border-t border-white/10 mx-4" /> : (
    <div className="px-4 py-2 mt-4 mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</div>
  );

// ─── AdminDashboard (root) ───────────────────────────────────────────────────
function AdminDashboardInner() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        // Check localStorage session first (works without Supabase)
        const localSession = JSON.parse(localStorage.getItem('pa_user') || 'null');

        // Try Supabase session
        let supabaseSession = null;
        try {
          supabaseSession = await AdminDb.auth.getSession();
        } catch (e) {
          // Supabase not configured or error - use localStorage
        }

        if (!supabaseSession && !localSession?.logged) {
          navigate('/login');
          return;
        }

        // Try to get profile, but don't block on role check
        try {
          await AdminDb.auth.ensureUserRow();
          const p = await AdminDb.auth.getMyProfile();
          if (!alive) return;
          // Set profile from Supabase or create from localStorage
          setProfile(p || { name: localSession?.name || 'Admin', role: localSession?.role || 'gerente' });
        } catch (e) {
          // Use localStorage profile as fallback
          if (alive && localSession) {
            setProfile({ name: localSession.name || 'Admin', role: localSession.role || 'gerente' });
          }
        }
      } catch (e) {
        console.error('Erro no AdminDashboard check:', e);
        // Don't redirect on error - show what we can
      }
    };
    run();
    return () => { alive = false; };
  }, [navigate]);

  const handleLogout = async () => {
    try { await AdminDb.auth.signOut(); } finally {
      localStorage.removeItem('pa_user');
      navigate('/login');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'trilhas': return <AdminTrilhas />;
      case 'users': return <AdminUsers />;
      case 'franquias': return <AdminFranquias />;
      case 'ranking': return <AdminRanking />;
      case 'notificacoes': return <AdminNotificacoes />;
      case 'certificados': return <AdminCertificados />;
      case 'quizbank': return <AdminQuizBank />;
      case 'loja': return <AdminLoja />;
      case 'missoes': return <AdminMissoes />;
      case 'conquistas': return <AdminMarcos />;
      case 'gamification': return <AdminGamification />;
      case 'analytics': return <AdminAnalytics />;
      case 'times': return <AdminTimes />;
      case 'reports': return <AdminRelatorios />;
      case 'settings': return <AdminConfig />;
      default: return <DashboardHome />;
    }
  };

  const sidebarW = collapsed ? 'w-20' : 'w-72';
  const mainML = collapsed ? 'ml-20' : 'ml-72';

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-gray-900 overflow-x-hidden">
      {/* Sidebar Dark Glass */}
      <aside className={`${sidebarW} sidebar-transition bg-[#0B1120] text-white border-r border-white/5 flex flex-col fixed h-full z-40 shadow-2xl overflow-hidden`}>
        {/* Logo */}
        <div className={`h-24 flex items-center border-b border-white/5 flex-shrink-0 relative overflow-hidden ${collapsed ? 'justify-center px-0' : 'px-8 gap-1'}`}>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-green-900/20 to-transparent pointer-events-none" />

          <div className="relative z-10 transition-transform duration-300">
            <PetClassLogo
              type="light"
              size={collapsed ? 'small' : 'normal'}
              iconOnly={collapsed}
            />
          </div>
        </div>

        {/* Nav */}
        <nav className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-1">
          <MenuItem icon={<LayoutGrid />} label="Visão Geral" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} collapsed={collapsed} />

          <SectionLabel label="Gestão" collapsed={collapsed} />
          <MenuItem icon={<BookOpen />} label="Trilhas e Aulas" active={activeTab === 'trilhas'} onClick={() => setActiveTab('trilhas')} collapsed={collapsed} />
          <MenuItem icon={<FileQuestion />} label="Banco de Questões" active={activeTab === 'quizbank'} onClick={() => setActiveTab('quizbank')} collapsed={collapsed} />
          <MenuItem icon={<Users />} label="Usuários" active={activeTab === 'users'} onClick={() => setActiveTab('users')} collapsed={collapsed} />
          <MenuItem icon={<Building2 />} label="Franquias" active={activeTab === 'franquias'} onClick={() => setActiveTab('franquias')} collapsed={collapsed} />

          <SectionLabel label="Engajamento" collapsed={collapsed} />
          <MenuItem icon={<BarChart3 />} label="Ranking" active={activeTab === 'ranking'} onClick={() => setActiveTab('ranking')} collapsed={collapsed} />
          <MenuItem icon={<Target />} label="Metas Diárias" active={activeTab === 'missoes'} onClick={() => setActiveTab('missoes')} collapsed={collapsed} />
          <MenuItem icon={<Star />} label="Marcos" active={activeTab === 'conquistas'} onClick={() => setActiveTab('conquistas')} collapsed={collapsed} />
          <MenuItem icon={<ShoppingBag />} label="Loja de Prêmios" active={activeTab === 'loja'} onClick={() => setActiveTab('loja')} collapsed={collapsed} />
          <MenuItem icon={<Award />} label="Certificados" active={activeTab === 'certificados'} onClick={() => setActiveTab('certificados')} collapsed={collapsed} />

          <SectionLabel label="Sistema" collapsed={collapsed} />
          <MenuItem icon={<Sliders />} label="Config. Engajamento" active={activeTab === 'gamification'} onClick={() => setActiveTab('gamification')} collapsed={collapsed} />
          <MenuItem icon={<Bell />} label="Notificações" active={activeTab === 'notificacoes'} onClick={() => setActiveTab('notificacoes')} collapsed={collapsed} />
          <MenuItem icon={<BarChart3 />} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} collapsed={collapsed} />
          <MenuItem icon={<Users />} label="Times" active={activeTab === 'times'} onClick={() => setActiveTab('times')} collapsed={collapsed} />
          <MenuItem icon={<FileText />} label="Relatórios" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} collapsed={collapsed} />
          <MenuItem icon={<Settings2 />} label="Configurações" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} collapsed={collapsed} />
        </nav>

        {/* User + Collapse toggle */}
        <div className="p-4 border-t border-white/5 bg-[#0F172A] flex-shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-3 px-3 py-3 mb-4 bg-white/5 rounded-xl border border-white/5 shadow-inner">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#129151] to-[#0B6E3D] flex items-center justify-center font-bold text-white flex-shrink-0 border border-white/10 shadow-lg">
                {profile?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">{profile?.name || 'Admin'}</div>
                <div className="text-xs text-gray-400 capitalize flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div>
                  {profile?.role || 'Online'}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setCollapsed(c => !c)}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            >
              {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-red-400 bg-red-400/10 hover:bg-red-500/20 rounded-lg transition-colors py-2 uppercase tracking-wide"
              >
                <LogOut size={16} /> Sair
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 ${mainML} main-transition min-h-screen relative overflow-hidden`}>
        {/* Background Gradients */}
        <div className="fixed top-0 left-0 w-full h-full bg-[#F8FAFC] -z-20" />
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-green-100 rounded-full blur-[120px] opacity-40 -z-10 translate-x-1/2 -translate-y-1/2" />
        <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-purple-100 rounded-full blur-[140px] opacity-40 -z-10 -translate-x-1/2 translate-y-1/2" />

        <div className="p-8 max-w-[1920px] mx-auto min-h-screen">
          <Breadcrumbs activeTab={activeTab} />
          <div className="mt-6 animate-fade-in pb-12">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ToastProvider>
      <AdminDashboardInner />
    </ToastProvider>
  );
}
