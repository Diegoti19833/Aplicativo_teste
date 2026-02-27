import React, { useCallback, useEffect, useState } from 'react';
import {
  Plus, Search, MoreVertical, Shield, ShieldCheck, Mail, X, Pencil, Trash,
  Download, Filter, ChevronLeft, ChevronRight, User as UserIcon, Calendar, Activity,
  Clock, CheckCircle, XCircle, Coins, Building2
} from 'lucide-react';
import { AdminDb } from '../../services/adminDb';
import { useToast } from './ToastContext';

function UserStatsCard({ title, value, icon, color }) {
  const gradients = {
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-emerald-500 to-teal-600',
    purple: 'from-violet-500 to-purple-600',
    orange: 'from-orange-400 to-pink-500',
  };
  return (
    <div className="glass-panel p-5 flex items-center justify-between relative overflow-hidden group hover:scale-[1.02] transition-transform">
      <div className={`absolute right-0 top-0 p-3 opacity-10`}>{React.cloneElement(icon, { size: 64 })}</div>
      <div>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradients[color] || gradients.blue} text-white shadow-lg shadow-blue-500/20`}>
        {React.cloneElement(icon, { size: 20 })}
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const toast = useToast();
  // State
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Todos');

  // Modals
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserStats, setSelectedUserStats] = useState(null);
  const [loadingUserStats, setLoadingUserStats] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: '', email: '', role: 'Funcionário', franchise_id: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);
  const [franchisesList, setFranchisesList] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});

  useEffect(() => {
    // Fetch high-level stats (reuse dashboard report)
    AdminDb.reports.getAdminDashboard().then(data => setStats(data)).catch(console.error);
    AdminDb.franchises.list().then(data => setFranchisesList(data)).catch(console.error);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search change
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const MOCK_USERS = [
    { id: '1', name: 'Diego Oliveira', email: 'diegoti19833@gmail.com', role: 'admin', created_at: '2024-01-15', last_sign_in_at: new Date().toISOString(), total_points: 4500, total_xp: 4500, lessons_completed: 32, coins: 1200, is_active: true },
    { id: '2', name: 'Ana Costa', email: 'ana.costa@empresa.com', role: 'gerente', created_at: '2024-02-01', last_sign_in_at: new Date().toISOString(), total_points: 3200, total_xp: 3200, lessons_completed: 24, coins: 850, is_active: true },
    { id: '3', name: 'Carlos Silva', email: 'carlos.silva@empresa.com', role: 'funcionario', created_at: '2024-02-10', last_sign_in_at: new Date().toISOString(), total_points: 1800, total_xp: 1800, lessons_completed: 15, coins: 400, is_active: true },
    { id: '4', name: 'Maria Santos', email: 'maria.santos@empresa.com', role: 'funcionario', created_at: '2024-03-05', last_sign_in_at: new Date().toISOString(), total_points: 2100, total_xp: 2100, lessons_completed: 18, coins: 600, is_active: true },
    { id: '5', name: 'Pedro Alves', email: 'pedro.alves@empresa.com', role: 'funcionario', created_at: '2024-03-12', last_sign_in_at: new Date().toISOString(), total_points: 950, total_xp: 950, lessons_completed: 8, coins: 150, is_active: false },
  ];

  // Load Users
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const offset = (page - 1) * pageSize;
      const roleParam = roleFilter === 'Todos' ? null : roleFilter;

      const response = await AdminDb.users.list({
        search: debouncedSearch,
        role: roleParam,
        limit: pageSize,
        offset: offset
      });

      if (response.data && typeof response.count === 'number' && response.count > 0) {
        setUsers(response.data);
        setTotalUsers(response.count);
      } else {
        const data = Array.isArray(response) && response.length > 0 ? response : MOCK_USERS;
        setUsers(data);
        setTotalUsers(data.length);
      }
    } catch (e) {
      console.error('Erro ao carregar usuários:', e);
      setUsers(MOCK_USERS);
      setTotalUsers(MOCK_USERS.length);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, page, pageSize]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Load User Profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      const newProfiles = { ...userProfiles };
      let missingUsers = false;
      for (const u of users) {
        if (!newProfiles[u.id]) {
          missingUsers = true;
          try {
            const p = await AdminDb.playerProfiles.getByUserId(u.id);
            if (p?.has_profile) {
              newProfiles[u.id] = p.archetype;
            } else {
              newProfiles[u.id] = { id: 'none', name: 'Sem Perfil' };
            }
          } catch (e) {
            // ignore
          }
        }
      }
      if (missingUsers) setUserProfiles(newProfiles);
    };
    if (users.length > 0) fetchProfiles();
  }, [users]);

  // Handlers
  const handleRoleFilterChange = (role) => {
    setRoleFilter(role);
    setPage(1);
  };

  const handleCreateUser = async () => {
    if (!newUserData.name || !newUserData.email) return toast.warning('Preencha nome e email');
    try {
      setSaving(true);
      await AdminDb.users.create(newUserData);
      setNewUserData({ name: '', email: '', role: 'Funcionário', franchise_id: '' });
      setShowNewUserModal(false);
      loadUsers();
    } catch (e) {
      toast.error('Falha ao criar usuário', e?.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser.name || !editingUser.email) return toast.warning('Preencha nome e email');
    try {
      setSaving(true);
      await AdminDb.users.update({
        id: editingUser.id,
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        franchise_id: editingUser.franchise_id
      });
      setEditingUser(null);
      setShowEditUserModal(false);
      loadUsers();
    } catch (e) {
      toast.error('Falha ao atualizar usuário', e?.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover este usuário?')) return;
    try {
      await AdminDb.users.setActive({ id, isActive: false }); // Soft delete/Deactivate
      loadUsers();
      toast.success('Usuário desativado com sucesso');
    } catch (err) {
      toast.error('Erro ao desativar usuário', err?.message);
    }
  };

  const openEditModal = (user) => {
    setEditingUser({ ...user });
    setShowEditUserModal(true);
  };

  const openDetailsModal = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
    setSelectedUserStats(null);
    setLoadingUserStats(true);
    AdminDb.users.getStats({ id: user.id })
      .then((stats) => setSelectedUserStats(stats))
      .catch(() => setSelectedUserStats(null))
      .finally(() => setLoadingUserStats(false));
  };

  const handleExportCSV = () => {
    const exportAll = async () => {
      try {
        toast.info('Iniciando exportação...');
        const roleParam = roleFilter === 'Todos' ? null : roleFilter;

        // Fetch all (with high limit)
        const response = await AdminDb.users.list({
          search: debouncedSearch,
          role: roleParam,
          limit: 1000
        });

        const dataToExport = Array.isArray(response) ? response : (response.data || []);

        const headers = ['ID', 'Nome', 'Email', 'Cargo', 'Pontos', 'Nível', 'Moedas', 'Status', 'Data Cadastro'];
        const csvContent = [
          headers.join(','),
          ...dataToExport.map(u => [
            u.id,
            `"${u.name}"`,
            `"${u.email}"`,
            u.role,
            u.total_xp || 0,
            Math.max(1, Math.floor((Number(u.total_xp) || 0) / 500) + 1),
            u.coins || 0,
            u.is_active ? 'Ativo' : 'Inativo',
            new Date(u.created_at).toLocaleDateString('pt-BR')
          ].join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `usuarios_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();

        toast.success('Exportação concluída!');
      } catch (e) {
        console.error(e);
        toast.error('Erro ao exportar CSV', e.message);
      }
    };

    exportAll();
  };

  // Helper for Last Access
  const getLastAccessInfo = (date) => {
    if (!date) return { label: 'Nunca', tone: 'muted' };
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days <= 0) return { label: 'Hoje', tone: 'good' };
    if (days === 1) return { label: 'Ontem', tone: 'warn' };
    if (days < 7) return { label: `${days} dias atrás`, tone: 'warn' };
    if (days >= 30) return { label: d.toLocaleDateString('pt-BR'), tone: 'bad' };
    return { label: d.toLocaleDateString('pt-BR'), tone: 'muted' };
  };

  const avatarUrlFor = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=0047AB&color=ffffff&bold=true&rounded=true&size=96`;

  const roleBadge = (role) => {
    const r = String(role || '').toLowerCase();
    if (r.includes('admin')) return 'bg-purple-100 text-purple-800';
    if (r.includes('gerente')) return 'bg-blue-100 text-blue-800';
    if (r.includes('franqueado')) return 'bg-emerald-100 text-emerald-800';
    if (r.includes('caixa')) return 'bg-amber-100 text-amber-800';
    return 'bg-gray-100 text-gray-800';
  };

  const accessTone = (tone) => {
    if (tone === 'good') return { dot: 'bg-green-500', text: 'text-green-700' };
    if (tone === 'warn') return { dot: 'bg-amber-500', text: 'text-amber-700' };
    if (tone === 'bad') return { dot: 'bg-red-500', text: 'text-red-700' };
    return { dot: 'bg-gray-300', text: 'text-gray-500' };
  };

  const getArchetypeBadgeStyle = (archId) => {
    switch (archId) {
      case 'especialista': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'encantador': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'estrategista': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'agil': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const totalPages = Math.ceil(totalUsers / pageSize);

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Usuários & Equipe</h1>
          <p className="text-gray-500">Gerencie o acesso, desempenho e estatísticas dos colaboradores.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium shadow-sm"
          >
            <Download size={18} />
            Exportar CSV
          </button>
          <button
            onClick={() => setShowNewUserModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#129151] text-white rounded-lg hover:bg-[#0B6E3D] transition-colors font-medium shadow-sm"
          >
            <Plus size={20} />
            Novo Usuário
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Role Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
            {['Todos', 'Funcionário', 'Gerente', 'Admin', 'Caixa', 'Franqueado'].map(role => (
              <button
                key={role}
                onClick={() => handleRoleFilterChange(role)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${roleFilter === role
                  ? 'bg-brand/10 text-brand'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuário</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Função</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Franquia</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Perfil Pop</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Desempenho</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">POPCOINS</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Último Acesso</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                // Skeleton Loading
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 w-48 bg-gray-200 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-24 bg-gray-200 rounded-full"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-24 bg-gray-200 rounded-full"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-16 bg-gray-200 rounded-full"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-8 w-8 bg-gray-200 rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <button type="button" onClick={() => openDetailsModal(user)} className="flex items-center gap-3 text-left">
                        <img
                          src={user.avatar_url || avatarUrlFor(user.name)}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail size={10} /> {user.email}
                          </div>
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {String(user.role).toLowerCase().includes('admin') || String(user.role).toLowerCase().includes('gerente') ? (
                          <ShieldCheck size={16} className="text-blue-600" />
                        ) : (
                          <UserIcon size={16} className="text-gray-400" />
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadge(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.franchise ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                          <Building2 size={12} />
                          {user.franchise.name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${user.is_active
                          ? 'bg-green-50 text-green-700 border-green-100'
                          : 'bg-red-50 text-red-700 border-red-100'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {userProfiles[user.id] && userProfiles[user.id].id !== 'none' ? (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border capitalize ${getArchetypeBadgeStyle(userProfiles[user.id].id)}`}>
                          {userProfiles[user.id].name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Pendente</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span className="font-medium text-brand">{user.total_xp || 0} XP</span>
                          <span>Nível {Math.max(1, Math.floor((Number(user.total_xp) || 0) / 500) + 1)}</span>
                        </div>
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand rounded-full"
                            style={{ width: `${Math.min(100, ((user.total_xp || 0) % 500) / 5)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-50 rounded-lg">
                          <Coins size={16} className="text-amber-500" />
                        </div>
                        <div>
                          <span className="font-bold text-gray-900">{(user.coins || 0).toLocaleString('pt-BR')}</span>
                          <p className="text-[10px] text-amber-500 font-medium uppercase">POPCOIN</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const info = user.last_activity_date ? getLastAccessInfo(user.last_activity_date) : { label: 'Nunca acessou', tone: 'muted' };
                        const tone = accessTone(info.tone);
                        return (
                          <div className={`flex items-center gap-2 text-sm ${tone.text}`}>
                            <span className={`w-2 h-2 rounded-full ${tone.dot}`} />
                            <span>{info.label}</span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetailsModal(user)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Detalhes"
                        >
                          <MoreVertical size={18} />
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Desativar"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-500">
            Mostrando <span className="font-medium">{totalUsers === 0 ? 0 : ((page - 1) * pageSize + 1)}</span>–<span className="font-medium">{Math.min(page * pageSize, (page - 1) * pageSize + users.length, totalUsers)}</span> de <span className="font-medium">{totalUsers}</span> usuários
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-gray-700 px-2">
              Página {page} de {totalPages || 1}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* New User Modal */}
      {showNewUserModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Novo Usuário</h3>
              <button onClick={() => setShowNewUserModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newUserData.name}
                  onChange={e => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="Ex: João Silva"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Corporativo</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newUserData.email}
                  onChange={e => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="Ex: joao@empresa.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newUserData.role}
                  onChange={e => setNewUserData({ ...newUserData, role: e.target.value })}
                >
                  <option>Funcionário</option>
                  <option>Gerente</option>
                  <option>Caixa</option>
                  <option>Franqueado</option>
                  <option>Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Franquia (Unidade)</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#129151]"
                  value={newUserData.franchise_id}
                  onChange={e => setNewUserData({ ...newUserData, franchise_id: e.target.value })}
                >
                  <option value="">Sem franquia</option>
                  {franchisesList.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleCreateUser}
                disabled={saving}
                className="w-full mt-4 bg-[#129151] hover:bg-[#0B6E3D] text-white font-semibold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2"
              >
                {saving ? 'Salvando...' : 'Criar Usuário'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Editar Usuário</h3>
              <button onClick={() => setShowEditUserModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingUser.name}
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingUser.email}
                  onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingUser.role}
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                >
                  <option>Funcionário</option>
                  <option>Gerente</option>
                  <option>Caixa</option>
                  <option>Franqueado</option>
                  <option>Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Franquia (Unidade)</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#129151]"
                  value={editingUser.franchise_id || ''}
                  onChange={e => setEditingUser({ ...editingUser, franchise_id: e.target.value })}
                >
                  <option value="">Sem franquia</option>
                  {franchisesList.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleUpdateUser}
                disabled={saving}
                className="w-full mt-4 bg-[#129151] hover:bg-[#0B6E3D] text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <UserIcon size={20} className="text-blue-600" />
                Detalhes do Usuário
              </h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* Header Profile */}
              <div className="flex items-start gap-6 mb-8">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-3xl font-bold text-gray-400 border-2 border-white shadow-md">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt={selectedUser.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    (selectedUser.name || '?').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h2>
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <Mail size={14} /> {selectedUser.email}
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">
                      {selectedUser.role}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${selectedUser.is_active ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                      {selectedUser.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                    {selectedUser.franchise && (
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium border border-indigo-100 flex items-center gap-1">
                        <Building2 size={12} />
                        {selectedUser.franchise.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                  <div className="text-2xl font-bold text-amber-500">{selectedUser.total_xp || 0}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Pontos Totais</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                  <div className="text-2xl font-bold text-blue-600">{Math.max(1, Math.floor((Number(selectedUser.total_xp) || 0) / 500) + 1)}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Nível</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                  <div className="text-2xl font-bold text-orange-500">{selectedUser.current_streak || 0}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Assiduidade (Dias)</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                  <div className="text-lg font-bold text-gray-700 overflow-hidden text-ellipsis whitespace-nowrap">
                    {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('pt-BR') : '-'}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Membro desde</div>
                </div>
              </div>

              {/* POPCOINS Card */}
              <div className="mb-8 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-5 border border-amber-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl text-white shadow-md shadow-amber-200">
                      <Coins size={24} />
                    </div>
                    <div>
                      <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">POPCOINS</p>
                      <p className="text-3xl font-bold text-gray-900">{(selectedUser.coins || 0).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-amber-500 font-medium">Saldo disponível</p>
                    <p className="text-sm text-gray-500">para troca na Loja</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {loadingUserStats ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center animate-pulse">
                      <div className="h-7 w-14 bg-gray-200 rounded mx-auto" />
                      <div className="h-3 w-24 bg-gray-200 rounded mx-auto mt-2" />
                    </div>
                  ))
                ) : (
                  <>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                      <div className="text-2xl font-bold text-brand">{selectedUserStats?.lessonsCompleted ?? '-'}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Aulas Concluídas</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                      <div className="text-2xl font-bold text-blue-600">{selectedUserStats?.quizzesAttempts ?? '-'}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Tentativas Quiz</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                      <div className="text-2xl font-bold text-green-600">{selectedUserStats?.quizzesCorrect ?? '-'}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Acertos Quiz</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                      <div className="text-2xl font-bold text-amber-600">{selectedUserStats?.purchasesCount ?? '-'}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Resgates</div>
                    </div>
                  </>
                )}
              </div>

              {!loadingUserStats && selectedUserStats && (
                <div className="mb-8">
                  <div className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-4">
                    <div className="text-sm font-medium text-gray-700">Popcoins gastos</div>
                    <div className="text-sm font-semibold text-gray-900">{Number(selectedUserStats.coinsSpent || 0).toLocaleString('pt-BR')}</div>
                  </div>
                </div>
              )}

              {/* Activity Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-2">Informações de Acesso</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="p-2 bg-white rounded-md shadow-sm text-gray-400">
                      <Clock size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Último Acesso</div>
                      <div className="text-xs text-gray-500">
                        {selectedUser.last_activity_date ? new Date(selectedUser.last_activity_date).toLocaleString('pt-BR') : 'Nunca acessou'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="p-2 bg-white rounded-md shadow-sm text-gray-400">
                      <Activity size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">ID do Usuário</div>
                      <div className="text-xs text-gray-500 font-mono">{selectedUser.id}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium shadow-sm transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  openEditModal(selectedUser);
                }}
                className="px-4 py-2 bg-[#129151] text-white rounded-lg hover:bg-[#0B6E3D] font-medium shadow-sm transition-colors"
              >
                Editar Perfil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
