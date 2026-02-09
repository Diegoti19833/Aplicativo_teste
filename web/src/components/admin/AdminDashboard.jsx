import React, { useEffect, useState } from 'react';
import {
  LayoutGrid, BookOpen, Users, Award, ShoppingBag, Target,
  Search, Bell, LogOut, Settings, BarChart3,
  TrendingUp, FileText, ChevronRight, Trophy
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { AdminDb } from '../../services/adminDb';

import AdminTrilhas from './AdminTrilhas';
import AdminUsers from './AdminUsers';
import AdminRelatorios from './AdminRelatorios';
import AdminConfig from './AdminConfig';
import AdminRanking from './AdminRanking';
import AdminLoja from './AdminLoja';
import AdminMissoes from './AdminMissoes';

function DashboardHome() {
  const [overview, setOverview] = useState(null);
  const [trails, setTrails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const [dashData, trailsData] = await Promise.all([
          AdminDb.reports.getAdminDashboard().catch(() => null),
          AdminDb.trails.list().catch(() => [])
        ]);
        if (!alive) return;
        setOverview(dashData);
        setTrails(trailsData.slice(0, 5));
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, []);

  const kpis = overview?.success ? {
    totalUsers: overview.total_users || 0,
    totalXp: overview.total_xp || 0,
    lessonsCompleted: overview.total_lessons_completed || 0,
    newUsers: overview.new_users_30d || 0,
    totalPurchases: overview.total_purchases || 0,
    coinsSpent: overview.total_coins_spent || 0,
    activeUsers: overview.active_users || 0,
  } : { totalUsers: 0, totalXp: 0, lessonsCompleted: 0, newUsers: 0, totalPurchases: 0, coinsSpent: 0, activeUsers: 0 };

  const monthlyData = overview?.monthly_completions || [];
  const chartData = monthlyData.map(d => ({ name: d.month, completions: d.completions }));

  const COLORS = ['#0047AB', '#10B981', '#F59E0B', '#EF4444'];

  const pieData = [
    { name: 'Ativos', value: kpis.activeUsers },
    { name: 'Inativos', value: Math.max(0, kpis.totalUsers - kpis.activeUsers) },
  ];

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>
        Carregando dados do dashboard...
      </div>
    );
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Visao Geral do Sistema</h1>
        <p style={{ color: '#6B7280' }}>Dados em tempo real do seu app de gamificacao.</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32 }}>
        <KPICard title="Total de Usuarios" value={kpis.totalUsers.toLocaleString()} icon={<Users size={24} color="#0047AB"/>} subtitle={`${kpis.activeUsers} ativos`} />
        <KPICard title="XP Total Gerado" value={kpis.totalXp.toLocaleString()} icon={<Award size={24} color="#F59E0B"/>} subtitle="todos os usuarios" />
        <KPICard title="Aulas Concluidas" value={kpis.lessonsCompleted.toLocaleString()} icon={<BookOpen size={24} color="#10B981"/>} subtitle="total geral" />
        <KPICard title="Novos (30 dias)" value={kpis.newUsers.toLocaleString()} icon={<TrendingUp size={24} color="#8B5CF6"/>} subtitle={`${kpis.totalPurchases} compras na loja`} />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Conclusoes Mensais de Aulas</h3>
          <div style={{ height: 300 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="completions" fill="#0047AB" radius={[4, 4, 0, 0]} barSize={40} name="Conclusoes" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#9CA3AF' }}>
                Sem dados de conclusoes ainda
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Usuarios Ativos vs Inativos</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Economia e Trilhas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Economia da Loja</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#F0FDF4', borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#059669' }}>{kpis.totalPurchases}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>Compras Realizadas</div>
            </div>
            <div style={{ background: '#FEF3C7', borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#D97706' }}>{kpis.coinsSpent.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>Coins Gastos</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Trilhas Ativas</h3>
          {trails.length > 0 ? trails.map((trail, i) => (
            <div key={trail.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < trails.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: trail.color || '#0047AB' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{trail.title}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{trail.total_lessons || 0} aulas</div>
              </div>
              <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, background: trail.is_active ? '#D1FAE5' : '#FEE2E2', color: trail.is_active ? '#059669' : '#DC2626' }}>
                {trail.is_active ? 'Ativa' : 'Inativa'}
              </span>
            </div>
          )) : (
            <div style={{ color: '#9CA3AF', textAlign: 'center', padding: 20 }}>Nenhuma trilha cadastrada</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const session = await AdminDb.auth.getSession();
        if (!session) {
          localStorage.removeItem('pa_user');
          navigate('/login');
          return;
        }
        await AdminDb.auth.ensureUserRow();
        const p = await AdminDb.auth.getMyProfile();
        if (!alive) return;
        if (p && !['admin', 'gerente'].includes(p.role)) {
          navigate('/login');
          return;
        }
        setProfile(p);
      } catch (e) {
        console.error('Erro no AdminDashboard check:', e);
      } finally {
        if (alive) setProfileLoading(false);
      }
    };
    run();
    return () => { alive = false; };
  }, [navigate]);

  const roleLabel = (role) => {
    const r = String(role || '').toLowerCase();
    if (r === 'admin') return 'Admin';
    if (r === 'gerente') return 'Gerente';
    if (r === 'caixa') return 'Caixa';
    return 'Funcionario';
  };

  const handleLogout = async () => {
    try {
      await AdminDb.auth.signOut();
    } finally {
      localStorage.removeItem('pa_user');
      navigate('/login');
    }
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'trilhas': return <AdminTrilhas />;
      case 'users': return <AdminUsers />;
      case 'ranking': return <AdminRanking />;
      case 'loja': return <AdminLoja />;
      case 'missoes': return <AdminMissoes />;
      case 'reports': return <AdminRelatorios />;
      case 'settings': return <AdminConfig />;
      default: return <DashboardHome />;
    }
  };

  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', background: '#F3F4F6' }}>

      {/* Sidebar */}
      <aside style={{
        width: 260,
        background: '#fff',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        zIndex: 10
      }}>
        <div className="brand" style={{
          height: 70,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          borderBottom: '1px solid #f3f4f6',
          gap: 12
        }}>
          <div style={{ width: 32, height: 32, background: 'var(--brand)', borderRadius: 8, display: 'grid', placeItems: 'center', color: '#fff' }}>
            <Award size={20} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--brand-dark)' }}>PET CLASS</span>
        </div>

        <nav style={{ padding: 20, flex: 1 }}>
          <MenuItem icon={<LayoutGrid size={20}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <MenuItem icon={<BookOpen size={20}/>} label="Trilhas & Aulas" active={activeTab === 'trilhas'} onClick={() => setActiveTab('trilhas')} />
          <MenuItem icon={<Users size={20}/>} label="Usuarios" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <MenuItem icon={<Trophy size={20}/>} label="Ranking" active={activeTab === 'ranking'} onClick={() => setActiveTab('ranking')} />
          <MenuItem icon={<ShoppingBag size={20}/>} label="Loja & Premios" active={activeTab === 'loja'} onClick={() => setActiveTab('loja')} />
          <MenuItem icon={<Target size={20}/>} label="Missoes Diarias" active={activeTab === 'missoes'} onClick={() => setActiveTab('missoes')} />
          <MenuItem icon={<FileText size={20}/>} label="Relatorios" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
          <div style={{ margin: '20px 0', borderTop: '1px solid #f3f4f6' }} />
          <MenuItem icon={<Settings size={20}/>} label="Configuracoes" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div style={{ padding: 20 }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))',
            borderRadius: 16,
            padding: 20,
            color: '#fff',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Pet Class Pro</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>Painel Administrativo</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: 260 }}>

        {/* Header */}
        <header style={{
          height: 70,
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 9
        }}>
          <div style={{ fontSize: 14, color: '#6B7280' }}>
            Painel Administrativo
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>
                  {profileLoading ? 'Carregando...' : (profile?.name || 'Admin')}
                </div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>
                  {profileLoading ? '' : roleLabel(profile?.role)}
                </div>
              </div>
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'Admin')}&background=0047AB&color=fff`}
                alt="Admin"
                style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
              />
              <button onClick={handleLogout} style={{ background: '#FEF2F2', border: 'none', padding: 8, borderRadius: 8, cursor: 'pointer', marginLeft: 8 }}>
                <LogOut size={18} color="#EF4444" />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        {renderContent()}

      </main>
    </div>
  );
}

function MenuItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '12px 16px',
        border: 'none',
        background: active ? '#EFF6FF' : 'transparent',
        color: active ? '#0047AB' : '#6B7280',
        borderRadius: 12,
        cursor: 'pointer',
        marginBottom: 4,
        fontWeight: active ? 600 : 400,
        transition: 'all 0.2s ease'
      }}
    >
      {icon}
      <span style={{ fontSize: 14 }}>{label}</span>
      {active && <ChevronRight size={16} style={{ marginLeft: 'auto' }} />}
    </button>
  );
}

function KPICard({ title, value, icon, subtitle }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F9FAFB', display: 'grid', placeItems: 'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{value}</div>
        {subtitle && <div style={{ fontSize: 11, color: '#6B7280' }}>{subtitle}</div>}
      </div>
    </div>
  );
}
