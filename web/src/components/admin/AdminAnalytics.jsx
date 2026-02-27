import React, { useState, useEffect } from 'react';
import {
    TrendingUp, Users, Award, AlertTriangle, BookOpen,
    Download, RefreshCw, Filter, Calendar, BarChart3,
    ChevronRight, Activity, Clock
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { AdminDb } from '../../services/adminDb';
import { useToast } from './ToastContext';

const COLORS = ['#129151', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminAnalytics() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [days, setDays] = useState(30);
    const [roleFilter, setRoleFilter] = useState('');
    const [trailFilter, setTrailFilter] = useState('');
    const [trails, setTrails] = useState([]);
    const [data, setData] = useState(null);

    const loadData = async () => {
        setRefreshing(true);
        try {
            const [analyticsData, trailsData] = await Promise.all([
                AdminDb.analytics.getManagerAnalytics(days, roleFilter || null, trailFilter || null),
                AdminDb.analytics.getTrails()
            ]);
            setData(analyticsData);
            setTrails(trailsData);
        } catch (error) {
            toast.error('Erro ao carregar dados de analytics', error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [days, roleFilter, trailFilter]);

    const handleExportCSV = () => {
        if (!data) return;

        const headers = ['Nome', 'Role', 'Inativo Há (Dias)', 'Última Atividade', 'Ranking XP'];
        const rows = data.users_at_risk.map(u => [
            u.name,
            u.role,
            u.days_inactive,
            new Date(u.last_activity_at).toLocaleDateString(),
            u.total_xp
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `usuarios_em_risco_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Lista de usuários em risco exportada!');
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center h-full">
                <RefreshCw className="animate-spin text-brand" size={32} />
            </div>
        );
    }

    const { overview, role_distribution, top_performers, users_at_risk, difficult_lessons, daily_activity } = data;

    return (
        <div className="p-8 space-y-8 animate-fade-in relative z-10 pb-20">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50 p-6 rounded-2xl border border-white/50 backdrop-blur-sm shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-brand rounded-lg text-white shadow-lg shadow-green-500/20">
                            <BarChart3 size={24} />
                        </div>
                        Analytics de Gestão
                    </h1>
                    <p className="text-gray-500 mt-1 ml-14">Acompanhe o engajamento e a saúde operacional da sua equipe.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="input-field text-sm py-2 bg-white"
                    >
                        <option value={7}>Últimos 7 dias</option>
                        <option value={30}>Últimos 30 dias</option>
                        <option value={90}>Últimos 90 dias</option>
                    </select>

                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="input-field text-sm py-2 bg-white"
                    >
                        <option value="">Todos os Roles</option>
                        <option value="funcionario">Funcionários</option>
                        <option value="caixa">Caixas</option>
                        <option value="gerente">Gerentes</option>
                    </select>

                    <button
                        onClick={loadData}
                        disabled={refreshing}
                        className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total de Usuários"
                    value={overview.total_users}
                    icon={<Users className="text-blue-500" />}
                    subtitle={`${overview.active_users} ativos no momento`}
                />
                <StatCard
                    title="Engajamento XP"
                    value={overview.total_xp.toLocaleString()}
                    icon={<Award className="text-amber-500" />}
                    subtitle="Total acumulado pela equipe"
                />
                <StatCard
                    title="Aulas Concluídas"
                    value={overview.lessons_completed}
                    icon={<BookOpen className="text-green-500" />}
                    subtitle="Meta de aprendizado"
                />
                <StatCard
                    title="Média de Streak"
                    value={`${overview.avg_streak} dias`}
                    icon={<TrendingUp className="text-purple-500" />}
                    subtitle="Consistência de acesso"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Activity Chart */}
                <div className="lg:col-span-2 glass-panel p-6 bg-white/80">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-brand" /> Atividade Diária (XP e Aulas)
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={daily_activity}>
                                <defs>
                                    <linearGradient id="colorXP" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#129151" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#129151" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    cursor={{ stroke: '#129151', strokeWidth: 2 }}
                                />
                                <Area type="monotone" dataKey="total_xp" stroke="#129151" strokeWidth={3} fillOpacity={1} fill="url(#colorXP)" name="XP Gerado" />
                                <Area type="monotone" dataKey="lessons" stroke="#3b82f6" strokeWidth={3} fill="transparent" name="Aulas" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Role Distribution */}
                <div className="glass-panel p-6 bg-white/80 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Users size={20} className="text-blue-600" /> Equipe por Função
                    </h3>
                    <div className="flex-1 min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={role_distribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {role_distribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        {role_distribution.map((item, index) => (
                            <div key={item.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="text-xs font-semibold text-gray-600 capitalize">{item.name}</span>
                                <span className="text-xs text-gray-400 ml-auto">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Users at Risk */}
                <div className="glass-panel p-0 overflow-hidden bg-white/80">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <AlertTriangle size={20} className="text-red-500" /> Usuários em Risco
                        </h3>
                        <button
                            onClick={handleExportCSV}
                            className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
                        >
                            <Download size={14} /> Exportar
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-3">Colaborador</th>
                                    <th className="px-6 py-3">Inativo há</th>
                                    <th className="px-6 py-3">Última Ativ.</th>
                                    <th className="px-6 py-3">Streak</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users_at_risk.length > 0 ? users_at_risk.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs uppercase">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-red-600">
                                            {user.days_inactive} dias
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {user.last_activity_at ? new Date(user.last_activity_at).toLocaleDateString() : 'Nunca'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
                                                {user.current_streak} dias
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-10 text-center text-gray-400">Nenhum usuário em risco identificado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Difficult Lessons */}
                <div className="glass-panel p-0 overflow-hidden bg-white/80">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <RefreshCw size={20} className="text-amber-500" /> Aulas com Maior Dificuldade
                        </h3>
                    </div>
                    <div className="p-6 space-y-6">
                        {difficult_lessons.length > 0 ? difficult_lessons.map(lesson => (
                            <div key={lesson.id} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{lesson.lesson_title}</p>
                                        <p className="text-xs text-gray-500">{lesson.trail_title}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-gray-900">{lesson.success_rate}% de acertos</p>
                                        <p className="text-[10px] text-gray-400">{lesson.total_attempts} tentativas</p>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${lesson.success_rate < 50 ? 'bg-red-500' : 'bg-amber-500'}`}
                                        style={{ width: `${lesson.success_rate}%` }}
                                    />
                                </div>
                            </div>
                        )) : (
                            <div className="py-10 text-center text-gray-400">Dados insuficientes para análise de dificuldade.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Performers */}
            <div className="glass-panel p-6 bg-brand-dark/5 border-brand/10">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Award size={22} className="text-amber-500" /> Líderes de Desempenho (Top 10)
                </h3>
                <div className="flex flex-nowrap gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {top_performers.map((user, index) => (
                        <div
                            key={user.id}
                            className="flex-shrink-0 w-48 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="relative mb-3">
                                <div className="w-16 h-16 rounded-full mx-auto bg-gray-100 border-2 border-brand/20 flex items-center justify-center overflow-hidden">
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xl font-black text-gray-400">{user.name.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-100 text-amber-700 border-2 border-white flex items-center justify-center font-bold text-xs">
                                    #{index + 1}
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                                <p className="text-xs font-black text-brand mt-1">{user.total_xp} XP</p>
                                <div className="flex items-center justify-center gap-1 mt-2">
                                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold">Lvl {user.level}</span>
                                    <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[10px] font-bold">{user.current_streak}d</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, subtitle }) {
    return (
        <div className="glass-panel p-6 bg-white/80 hover:translate-y-[-4px] transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-gray-50 rounded-xl">
                    {icon}
                </div>
                <div className="px-2 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-bold">Ativo</div>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-1">{value}</h3>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
            <p className="text-[10px] text-gray-400 mt-2">{subtitle}</p>
        </div>
    );
}
