import React, { useState, useEffect } from 'react';
import {
    Users, Plus, Search, Edit2, Trash2, Shield,
    UserPlus, UserMinus, Award, TrendingUp, X
} from 'lucide-react';
import { AdminDb } from '../../services/adminDb';
import { useToast } from './ToastContext';

export default function AdminTimes() {
    const toast = useToast();
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);
    const [teamForm, setTeamForm] = useState({ name: '', description: '' });

    // Members Modal
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [membersLoading, setMembersLoading] = useState(false);

    useEffect(() => {
        loadTeams();
    }, []);

    const loadTeams = async () => {
        setLoading(true);
        try {
            // Using the RPC function to get teams with their stats
            const data = await AdminDb.teams.getRanking();
            setTeams(data);
        } catch (error) {
            toast.error('Erro ao carregar times', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTeam = async (e) => {
        e.preventDefault();
        try {
            if (editingTeam) {
                await AdminDb.teams.update({ id: editingTeam.id, ...teamForm });
                toast.success('Time atualizado com sucesso!');
            } else {
                await AdminDb.teams.create(teamForm);
                toast.success('Time criado com sucesso!');
            }
            setIsTeamModalOpen(false);
            loadTeams();
        } catch (error) {
            toast.error('Erro ao salvar time', error.message);
        }
    };

    const handleDeleteTeam = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este time? Todos os membros serão removidos (mas não excluídos do sistema).')) return;
        try {
            await AdminDb.teams.delete(id);
            toast.success('Time excluído com sucesso!');
            loadTeams();
        } catch (error) {
            toast.error('Erro ao excluir time', error.message);
        }
    };

    const openMembersModal = async (team) => {
        setSelectedTeam(team);
        setIsMembersModalOpen(true);
        setMembersLoading(true);
        try {
            const [members, allUsers] = await Promise.all([
                AdminDb.teams.getMembers(team.team_id),
                AdminDb.users.list()
            ]);

            setTeamMembers(members);

            // Filter available users (active users not currently in a team, or we just show everyone and let managers reassign)
            // For simplicity, let's just get the IDs of current members to exclude them from the "Add" list
            const memberIds = members.map(m => m.user_id);
            setAvailableUsers(allUsers.filter(u => !memberIds.includes(u.id) && u.is_active));

        } catch (error) {
            toast.error('Erro ao carregar membros', error.message);
        } finally {
            setMembersLoading(false);
        }
    };

    const handleAddMember = async (userId) => {
        try {
            await AdminDb.teams.addMember(selectedTeam.team_id, userId);
            toast.success('Membro adicionado!');
            // Refresh modal data
            openMembersModal(selectedTeam);
        } catch (error) {
            toast.error('Erro ao adicionar membro', error.message);
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!window.confirm('Remover este usuário do time?')) return;
        try {
            await AdminDb.teams.removeMember(selectedTeam.team_id, userId);
            toast.success('Membro removido!');
            openMembersModal(selectedTeam);
        } catch (error) {
            toast.error('Erro ao remover membro', error.message);
        }
    };

    const filteredTeams = teams.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in relative z-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white/50 p-6 rounded-2xl border border-white/50 backdrop-blur-sm shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-[#129151] rounded-lg text-white shadow-lg shadow-green-500/20">
                            <Users size={24} />
                        </div>
                        Gestão de Equipes
                    </h1>
                    <p className="text-gray-500 mt-1 ml-14">Crie times e acompanhe o ranking coletivo da sua franquia.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingTeam(null);
                        setTeamForm({ name: '', description: '' });
                        setIsTeamModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-[#129151] hover:bg-[#0B6E3D] text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-green-500/30 font-semibold"
                >
                    <Plus size={20} />
                    Novo Time
                </button>
            </div>

            {/* Config warning if no teams exist */}
            {!loading && teams.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-6 rounded-2xl mb-8 flex items-start gap-4 shadow-sm">
                    <Shield className="text-blue-500 shrink-0 mt-1" size={24} />
                    <div>
                        <h3 className="font-bold text-lg mb-1">Ainda não há equipes cadastradas</h3>
                        <p className="text-sm opacity-90">
                            Crie seu primeiro time clicando em "Novo Time" acima. Depois, adicione colaboradores para que eles possam competir no ranking por equipes!
                        </p>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="glass-panel p-6 bg-white/80">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Award className="text-amber-500" /> Ranking Atual
                    </h2>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar time..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#129151] focus:border-[#129151] transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="py-10 text-center text-gray-400">Carregando times...</div>
                    ) : filteredTeams.length > 0 ? (
                        filteredTeams.map((team, index) => (
                            <div key={team.team_id} className="bg-white border border-gray-100 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow group">
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#129151]/20 to-[#129151]/5 border-2 border-[#129151]/20 flex items-center justify-center text-[#129151] font-bold text-xl">
                                            {team.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        {index < 3 && (
                                            <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-amber-100 rounded-full border-2 border-white flex items-center justify-center text-amber-600 font-bold text-xs">
                                                #{index + 1}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">{team.name}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                <Users size={14} /> {team.member_count} membros
                                            </span>
                                            <span className="text-sm font-bold text-[#129151] flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-md">
                                                <TrendingUp size={14} /> {team.total_xp} XP Total
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                                    <button
                                        onClick={() => openMembersModal(team)}
                                        className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold rounded-lg transition-colors flex items-center gap-2 text-sm"
                                    >
                                        <UserPlus size={16} /> Gerenciar Membros
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingTeam({ id: team.team_id, name: team.name, description: '' });
                                            setTeamForm({ name: team.name, description: '' });
                                            setIsTeamModalOpen(true);
                                        }}
                                        className="p-2 text-gray-400 hover:text-[#129151] hover:bg-[#129151]/10 rounded-lg transition-colors"
                                        title="Editar Time"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTeam(team.team_id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Excluir Time"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-10 text-center text-gray-400">Nenhum time encontrado.</div>
                    )}
                </div>
            </div>

            {/* Create/Edit Team Modal */}
            {isTeamModalOpen && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {editingTeam ? <Edit2 className="text-[#129151]" /> : <Plus className="text-[#129151]" />}
                                {editingTeam ? 'Editar Time' : 'Novo Time'}
                            </h2>
                            <button onClick={() => setIsTeamModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveTeam} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Time</label>
                                <input
                                    type="text"
                                    value={teamForm.name}
                                    onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                                    className="input-field"
                                    placeholder="Ex: Tropa de Elite, Vendas Sul..."
                                    required
                                    maxLength={50}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Descrição (Opcional)</label>
                                <textarea
                                    value={teamForm.description}
                                    onChange={e => setTeamForm({ ...teamForm, description: e.target.value })}
                                    className="input-field min-h-[100px] resize-none"
                                    placeholder="Qual o propósito ou região deste time?"
                                    maxLength={200}
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsTeamModalOpen(false)} className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors flex-1">Cancelar</button>
                                <button type="submit" className="px-4 py-3 bg-[#129151] hover:bg-[#0B6E3D] text-white rounded-xl font-bold transition-colors flex-1">Salvar Time</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Members Modal */}
            {isMembersModalOpen && selectedTeam && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-slide-up flex flex-col h-[85vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Users className="text-blue-500" />
                                    Membros: {selectedTeam.name}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">Gerencie os colaboradores deste time.</p>
                            </div>
                            <button onClick={() => setIsMembersModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-gray-50">
                            {/* Left: Current Members */}
                            <div className="flex-1 flex flex-col border-r border-gray-200">
                                <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center shrink-0">
                                    <h3 className="font-bold text-gray-700">Membros Atuais ({teamMembers.length})</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    {membersLoading ? (
                                        <p className="text-center text-gray-400 py-4">Carregando...</p>
                                    ) : teamMembers.length > 0 ? (
                                        teamMembers.map(member => (
                                            <div key={member.user_id} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#129151]/10 text-[#129151] flex items-center justify-center font-bold text-xs uppercase">
                                                        {member.users?.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{member.users?.name}</p>
                                                        <p className="text-xs text-gray-500">{member.users?.total_xp} XP</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveMember(member.user_id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Remover do time"
                                                >
                                                    <UserMinus size={16} />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                                            <Users size={32} className="mx-auto text-gray-300 mb-2" />
                                            <p className="text-sm text-gray-500">Este time ainda não tem membros.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Available Users to Add */}
                            <div className="flex-1 flex flex-col">
                                <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center shrink-0">
                                    <h3 className="font-bold text-gray-700">Adicionar Colaborador</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    {membersLoading ? (
                                        <p className="text-center text-gray-400 py-4">Carregando...</p>
                                    ) : availableUsers.length > 0 ? (
                                        availableUsers.map(user => (
                                            <div key={user.id} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between hover:border-blue-200 transition-colors cursor-default">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs uppercase">
                                                        {user.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleAddMember(user.id)}
                                                    className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold rounded-lg transition-colors flex items-center gap-1 text-xs"
                                                >
                                                    <Plus size={14} /> Adicionar
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10">
                                            <p className="text-sm text-gray-500">Todos os usuários já estão neste time.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
