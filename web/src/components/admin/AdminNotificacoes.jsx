import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  Send,
  Calendar,
  Users,
  Search,
  Trash2,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  XCircle,
  RefreshCw,
  Zap,
  Award,
  Flame,
  Target,
  Eye,
  EyeOff,
  Download
} from 'lucide-react';
import { AdminDb } from '../../services/adminDb';
import { useToast } from './ToastContext';

const AdminNotificacoes = () => {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, unread, custom
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    audience: 'all'
  });

  // ─── Carregar notificações do banco ───
  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await AdminDb.notifications.list();
      setNotifications(data);
    } catch (e) {
      console.error('Erro ao carregar notificações:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNotifications(); }, []);

  // ─── Filtrar notificações ───
  const filteredNotifications = useMemo(() => {
    return notifications.filter(item => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.body.toLowerCase().includes(searchQuery.toLowerCase());

      if (activeTab === 'unread') return matchesSearch && !item.is_read;
      if (activeTab === 'custom') return matchesSearch && item.type === 'custom';
      return matchesSearch;
    });
  }, [notifications, searchQuery, activeTab]);

  // ─── Enviar notificação customizada via Supabase RPC ───
  const handleSend = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      toast.warning('Campos obrigatórios', 'Por favor, preencha o título e a mensagem.');
      return;
    }

    setSending(true);
    try {
      const targetRole = formData.audience === 'all' ? null : formData.audience;
      const count = await AdminDb.notifications.sendCustom({
        title: formData.title,
        body: formData.message,
        targetRole
      });
      closeModal();
      toast.success('Sucesso', `Notificação enviada para ${count} usuário(s)!`);
      loadNotifications();
    } catch (e) {
      toast.error('Erro ao enviar', e?.message || 'Falha ao processar o envio.');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta notificação?')) return;
    try {
      await AdminDb.notifications.delete(id);
      setNotifications(prev => prev.filter(item => item.id !== id));
      toast.success('Excluída', 'Notificação removida com sucesso.');
    } catch (e) {
      toast.error('Erro ao excluir', e?.message || 'Não foi possível completar a exclusão.');
    }
  };

  const openModal = () => {
    setFormData({ title: '', message: '', audience: 'all' });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'achievement': return <Award className="text-yellow-500" size={20} />;
      case 'streak_risk': return <Flame className="text-red-500" size={20} />;
      case 'rank_change': return <Zap className="text-blue-500" size={20} />;
      case 'mission_expiring': return <Target className="text-orange-500" size={20} />;
      case 'custom': return <MessageSquare className="text-purple-500" size={20} />;
      default: return <Bell className="text-gray-500" size={20} />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'achievement': return 'Conquista';
      case 'streak_risk': return 'Sequência em Risco';
      case 'rank_change': return 'Ranking';
      case 'mission_expiring': return 'Missão Expirando';
      case 'custom': return 'Customizada';
      default: return 'Geral';
    }
  };

  const getTypeBg = (type) => {
    switch (type) {
      case 'achievement': return 'bg-yellow-50 border-yellow-200';
      case 'streak_risk': return 'bg-red-50 border-red-200';
      case 'rank_change': return 'bg-blue-50 border-blue-200';
      case 'mission_expiring': return 'bg-orange-50 border-orange-200';
      case 'custom': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  // ─── Estatísticas ───
  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.is_read).length;
    const custom = notifications.filter(n => n.type === 'custom').length;
    const today = notifications.filter(n => {
      const d = new Date(n.created_at);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length;
    return { total, unread, custom, today };
  }, [notifications]);

  // ─── Exportar CSV ───
  const exportCSV = () => {
    const headers = ['ID', 'Usuário', 'Título', 'Corpo', 'Tipo', 'Lida', 'Data'];
    const rows = filteredNotifications.map(n => [
      n.id,
      n.user?.name || n.user_id,
      `"${n.title}"`,
      `"${n.body}"`,
      getTypeLabel(n.type),
      n.is_read ? 'Sim' : 'Não',
      new Date(n.created_at).toLocaleString('pt-BR')
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notificacoes_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="text-purple-600" />
            Central de Notificações
          </h1>
          <p className="text-gray-500 mt-1">Envie alertas e gerencie notificações do sistema.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadNotifications}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download size={18} />
            CSV
          </button>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
          >
            <Send size={20} />
            Enviar Notificação
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: <Bell size={20} />, color: 'bg-blue-50 text-blue-600' },
          { label: 'Não Lidas', value: stats.unread, icon: <EyeOff size={20} />, color: 'bg-amber-50 text-amber-600' },
          { label: 'Customizadas', value: stats.custom, icon: <MessageSquare size={20} />, color: 'bg-purple-50 text-purple-600' },
          { label: 'Hoje', value: stats.today, icon: <Calendar size={20} />, color: 'bg-green-50 text-green-600' },
        ].map((s, i) => (
          <div key={i} className="glass-panel p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-xl ${s.color}`}>{s.icon}</div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 font-medium uppercase mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 w-full md:w-auto">
          {[
            { key: 'all', label: 'Todas' },
            { key: 'unread', label: 'Não Lidas' },
            { key: 'custom', label: 'Customizadas' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar notificações..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map(item => (
            <div
              key={item.id}
              className={`bg-white p-5 rounded-xl shadow-sm border transition-shadow hover:shadow-md ${item.is_read ? 'border-gray-100' : 'border-l-4 border-l-purple-500 border-gray-100'
                }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl flex-shrink-0 ${item.type === 'achievement' ? 'bg-yellow-50' :
                  item.type === 'streak_risk' ? 'bg-red-50' :
                    item.type === 'rank_change' ? 'bg-blue-50' :
                      item.type === 'mission_expiring' ? 'bg-orange-50' :
                        'bg-purple-50'
                  }`}>
                  {getTypeIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
                    <h3 className={`text-base font-bold ${item.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(item.created_at).toLocaleString('pt-BR')}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeBg(item.type)}`}>
                        {getTypeLabel(item.type)}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-2">{item.body}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {item.user && (
                        <span className="flex items-center gap-1.5">
                          <Users size={14} />
                          {item.user.name || item.user.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        {item.is_read
                          ? <><Eye size={14} className="text-green-500" /> Lida</>
                          : <><EyeOff size={14} className="text-amber-500" /> Não lida</>
                        }
                      </span>
                    </div>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredNotifications.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
              <Bell size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Nenhuma notificação encontrada</h3>
              <p className="text-gray-500 mt-1">Envie uma notificação customizada para seus usuários.</p>
              <button
                onClick={openModal}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Send size={18} /> Enviar Primeira Notificação
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal - Enviar Notificação Customizada */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Send className="text-purple-600" size={22} />
                Enviar Notificação Push
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSend} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  placeholder="Ex: Nova trilha disponível!"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
                <textarea
                  required
                  rows="3"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
                  placeholder="Conteúdo da mensagem que será enviada ao usuário..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Público Alvo</label>
                <select
                  value={formData.audience}
                  onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                >
                  <option value="all">Todos os Usuários</option>
                  <option value="funcionario">Funcionários</option>
                  <option value="gerente">Gerentes</option>
                  <option value="caixa">Caixas</option>
                  <option value="admin">Administradores</option>
                </select>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <p className="text-sm text-purple-700 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  A notificação será enviada imediatamente para {formData.audience === 'all' ? 'todos os usuários ativos' : `todos os ${formData.audience}s ativos`}.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Send size={18} />
                  {sending ? 'Enviando...' : 'Enviar Agora'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificacoes;
