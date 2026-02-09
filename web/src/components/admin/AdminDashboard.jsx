import React, { useEffect, useState } from 'react';
import { 
  LayoutGrid, BookOpen, Users, Award, 
  Search, Bell, LogOut, Settings, 
  TrendingUp, FileText, ChevronRight 
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { AdminDb } from '../../services/adminDb';

import AdminTrilhas from './AdminTrilhas';
import AdminUsers from './AdminUsers';
import AdminRelatorios from './AdminRelatorios';
import AdminConfig from './AdminConfig';

const dataBar = [
  { name: 'Jan', uv: 4000, pv: 2400 },
  { name: 'Fev', uv: 3000, pv: 1398 },
  { name: 'Mar', uv: 2000, pv: 9800 },
  { name: 'Abr', uv: 2780, pv: 3908 },
  { name: 'Mai', uv: 1890, pv: 4800 },
  { name: 'Jun', uv: 2390, pv: 3800 },
];

const dataLine = [
  { name: 'Seg', xp: 400 },
  { name: 'Ter', xp: 300 },
  { name: 'Qua', xp: 550 },
  { name: 'Qui', xp: 450 },
  { name: 'Sex', xp: 700 },
  { name: 'Sáb', xp: 800 },
  { name: 'Dom', xp: 600 },
];

const popularTrails = [
  { id: 1, name: 'Fundamentos do Atendimento', students: 1250, completed: 850, rating: 4.8 },
  { id: 2, name: 'Técnicas de Vendas Pet', students: 980, completed: 620, rating: 4.9 },
  { id: 3, name: 'Cuidados Básicos', students: 850, completed: 400, rating: 4.7 },
  { id: 4, name: 'Gestão de Estoque', students: 600, completed: 580, rating: 4.6 },
];

function DashboardHome() {
  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Visão Geral do Sistema</h1>
        <p style={{ color: '#6B7280' }}>Bem-vindo ao painel de controle da Pet Class.</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32 }}>
        <KPICard title="Total de Alunos" value="1.500" icon={<Users size={24} color="#0047AB"/>} trend="+12%" />
        <KPICard title="XP Gerado" value="25.000" icon={<Award size={24} color="#F59E0B"/>} trend="+8%" />
        <KPICard title="Aulas Concluídas" value="120" icon={<BookOpen size={24} color="#10B981"/>} trend="+24%" />
        <KPICard title="Novos Cadastros" value="45" icon={<TrendingUp size={24} color="#8B5CF6"/>} trend="+5%" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Main Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Progresso Geral das Trilhas</h3>
            <select style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12 }}>
              <option>Últimos 6 meses</option>
              <option>Este ano</option>
            </select>
          </div>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataBar}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Bar dataKey="uv" fill="#0047AB" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="pv" fill="#93C5FD" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Chart */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Atividade Diária (XP)</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataLine}>
                <defs>
                  <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0047AB" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0047AB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <Tooltip />
                <Area type="monotone" dataKey="xp" stroke="#0047AB" fillOpacity={1} fill="url(#colorXp)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Popular Trails Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Trilhas Mais Populares</h3>
          <button style={{ color: 'var(--brand)', background: 'none', border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Ver todas</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              <th style={{ textAlign: 'left', padding: '12px 0', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>NOME DA TRILHA</th>
              <th style={{ textAlign: 'left', padding: '12px 0', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>ALUNOS</th>
              <th style={{ textAlign: 'left', padding: '12px 0', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>CONCLUSÕES</th>
              <th style={{ textAlign: 'right', padding: '12px 0', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>AVALIAÇÃO</th>
            </tr>
          </thead>
          <tbody>
            {popularTrails.map((trail, index) => (
              <tr key={trail.id} style={{ borderBottom: index !== popularTrails.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                <td style={{ padding: '16px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, background: '#EFF6FF', borderRadius: 8, display: 'grid', placeItems: 'center', color: '#0047AB', fontWeight: 700, fontSize: 12 }}>
                      {index + 1}
                    </div>
                    <span style={{ fontWeight: 500, color: '#1F2937' }}>{trail.name}</span>
                  </div>
                </td>
                <td style={{ padding: '16px 0', color: '#6B7280' }}>{trail.students}</td>
                <td style={{ padding: '16px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 60, height: 6, background: '#f3f4f6', borderRadius: 3 }}>
                      <div style={{ width: `${(trail.completed/trail.students)*100}%`, height: '100%', background: '#10B981', borderRadius: 3 }}></div>
                    </div>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>{Math.round((trail.completed/trail.students)*100)}%</span>
                  </div>
                </td>
                <td style={{ padding: '16px 0', textAlign: 'right' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FFFBEB', color: '#B45309', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                    ★ {trail.rating}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
          console.warn('Sessão inválida no AdminDashboard');
          // localStorage.removeItem('pa_user'); // Evitar logout forçado imediato para debug
          // navigate('/login');
          return;
        }
        await AdminDb.auth.ensureUserRow();
        const p = await AdminDb.auth.getMyProfile();
        if (!alive) return;
        setProfile(p);
      } catch (e) {
        console.error('Erro no AdminDashboard check:', e);
        // localStorage.removeItem('pa_user');
        // navigate('/login');
      } finally {
        if (alive) setProfileLoading(false);
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [navigate]);

  const roleLabel = (role) => {
    const r = String(role || '').toLowerCase();
    if (r === 'admin') return 'Admin';
    if (r === 'gerente') return 'Gerente';
    if (r === 'caixa') return 'Caixa';
    return 'Funcionário';
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
          <MenuItem icon={<Users size={20}/>} label="Usuários & Ranking" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <MenuItem icon={<FileText size={20}/>} label="Relatórios" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
          <div style={{ margin: '20px 0', borderTop: '1px solid #f3f4f6' }} />
          <MenuItem icon={<Settings size={20}/>} label="Configurações" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
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
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 12 }}>Acesso total liberado</div>
            <button style={{ 
              background: 'rgba(255,255,255,0.2)', 
              border: 'none', 
              borderRadius: 8, 
              padding: '6px 12px', 
              color: '#fff', 
              fontSize: 12,
              cursor: 'pointer'
            }}>Ver planos</button>
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
          <div style={{ display: 'flex', alignItems: 'center', background: '#F3F4F6', padding: '8px 16px', borderRadius: 8, width: 300 }}>
            <Search size={18} color="#9CA3AF" />
            <input 
              placeholder="Buscar trilhas, alunos..." 
              style={{ 
                border: 'none', 
                background: 'transparent', 
                marginLeft: 10, 
                outline: 'none', 
                fontSize: 14, 
                width: '100%' 
              }} 
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
              <Bell size={20} color="#6B7280" />
              <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: '#EF4444', borderRadius: '50%' }} />
            </button>
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

function KPICard({ title, value, icon, trend }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F9FAFB', display: 'grid', placeItems: 'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>{trend} este mês</div>
      </div>
    </div>
  );
}
