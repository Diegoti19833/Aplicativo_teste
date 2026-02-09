import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Search, MoreVertical, Shield, ShieldCheck, Mail, X } from 'lucide-react';
import { AdminDb } from '../../services/adminDb';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: '', email: '', role: 'Funcionário' });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Todas as Funções');
  const [saving, setSaving] = useState(false);

  const computeLevel = (totalXp) => Math.max(1, Math.floor((Number(totalXp) || 0) / 500) + 1);

  const roleLabel = (role) => {
    const r = String(role || '').toLowerCase();
    if (r === 'admin') return 'Admin';
    if (r === 'gerente') return 'Gerente';
    if (r === 'caixa') return 'Caixa';
    return 'Funcionário';
  };

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const roleParam = roleFilter === 'Todas as Funções' ? null : roleFilter;
      const data = await AdminDb.users.list({ search, role: roleParam });
      setUsers(data);
    } catch (e) {
      alert(e?.message || 'Falha ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreateUser = async () => {
    if (!newUserData.name || !newUserData.email) return alert('Preencha nome e email');
    try {
      setSaving(true);
      await AdminDb.users.create(newUserData);
      setNewUserData({ name: '', email: '', role: 'Funcionário' });
      setShowNewUserModal(false);
      await loadUsers();
      alert('Usuário criado na tabela users. Para login, ele ainda precisa criar conta no Supabase Auth.');
    } catch (e) {
      alert(e?.message || 'Falha ao criar usuário');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id, isActive) => {
    try {
      await AdminDb.users.setActive({ id, isActive: !isActive });
      await loadUsers();
    } catch (e) {
      alert(e?.message || 'Falha ao atualizar status');
    }
  };

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Usuários & Ranking</h1>
          <p style={{ color: '#6B7280' }}>Gerencie o acesso e acompanhe o desempenho da equipe.</p>
        </div>
        <button 
          onClick={() => setShowNewUserModal(true)}
          className="btn-primary" 
          style={{ 
            background: '#0047AB', color: 'white', border: 'none', padding: '10px 20px', 
            borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 
          }}
        >
          <Plus size={20} />
          Novo Usuário
        </button>
      </div>

      {/* List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 20, borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: 10 }} />
            <input 
              placeholder="Buscar usuários..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ 
                width: '100%', padding: '8px 12px 8px 40px', borderRadius: 8, 
                border: '1px solid #e5e7eb', fontSize: 14 
              }} 
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white' }}
          >
            <option>Todas as Funções</option>
            <option>Admin</option>
            <option>Gerente</option>
            <option>Funcionário</option>
            <option>Caixa</option>
          </select>
        </div>

        {loading ? (
          <div style={{ padding: 24 }}>Carregando usuários...</div>
        ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>USUÁRIO</th>
              <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>FUNÇÃO</th>
              <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>XP / NÍVEL</th>
              <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>STATUS</th>
              <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, background: '#E0E7FF', borderRadius: '50%', display: 'grid', placeItems: 'center', color: '#0047AB', fontWeight: 700 }}>
                      {(user.name || '?').charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1F2937' }}>{user.name}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Mail size={12} /> {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {String(user.role).toLowerCase() === 'gerente' || String(user.role).toLowerCase() === 'admin' ? (
                      <ShieldCheck size={16} color="#0047AB" />
                    ) : (
                      <Shield size={16} color="#6B7280" />
                    )}
                    <span
                      style={{
                        color:
                          String(user.role).toLowerCase() === 'gerente' || String(user.role).toLowerCase() === 'admin'
                            ? '#0047AB'
                            : '#374151',
                        fontWeight:
                          String(user.role).toLowerCase() === 'gerente' || String(user.role).toLowerCase() === 'admin'
                            ? 600
                            : 400,
                      }}
                    >
                      {roleLabel(user.role)}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ fontWeight: 600, color: '#1F2937' }}>{user.total_xp || 0} XP</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>Nível {computeLevel(user.total_xp)}</div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span 
                    onClick={() => toggleStatus(user.id, user.is_active)}
                    style={{ 
                      padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      background: user.is_active ? '#ECFDF5' : '#FEF2F2',
                      color: user.is_active ? '#059669' : '#DC2626'
                    }}
                  >
                    {user.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <select
                    value={user.role}
                    onChange={async (e) => {
                      try {
                        await AdminDb.users.setRole({ id: user.id, role: e.target.value });
                        await loadUsers();
                      } catch (err) {
                        alert('Erro ao alterar funcao: ' + err.message);
                      }
                    }}
                    style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, cursor: 'pointer' }}
                  >
                    <option value="funcionario">Funcionario</option>
                    <option value="gerente">Gerente</option>
                    <option value="admin">Admin</option>
                    <option value="caixa">Caixa</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {/* Modal */}
      {showNewUserModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div className="card" style={{ width: 500, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Novo Usuário</h3>
              <button onClick={() => setShowNewUserModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Nome Completo</label>
                <input className="input" style={{ width: '100%' }} value={newUserData.name} onChange={e => setNewUserData({...newUserData, name: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Email Corporativo</label>
                <input className="input" style={{ width: '100%' }} value={newUserData.email} onChange={e => setNewUserData({...newUserData, email: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Função</label>
                <select className="input" style={{ width: '100%' }} value={newUserData.role} onChange={e => setNewUserData({...newUserData, role: e.target.value})}>
                  <option>Funcionário</option>
                  <option>Gerente</option>
                  <option>Caixa</option>
                </select>
              </div>
              <button onClick={handleCreateUser} disabled={saving} className="btn-primary" style={{ marginTop: 8, justifyContent: 'center' }}>
                {saving ? 'Adicionando...' : 'Adicionar Usuário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
