import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Search, Download } from 'lucide-react';
import { AdminDb } from '../../services/adminDb';

export default function AdminRanking() {
  const [ranking, setRanking] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadRanking();
  }, []);

  const loadRanking = async () => {
    try {
      setLoading(true);
      const data = await AdminDb.ranking.getFull({ limit: 100 });
      if (data?.success) {
        setRanking(data.ranking || []);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error('Erro ao carregar ranking:', e);
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = (role) => {
    const r = String(role || '').toLowerCase();
    if (r === 'admin') return 'Admin';
    if (r === 'gerente') return 'Gerente';
    if (r === 'caixa') return 'Caixa';
    return 'Funcionario';
  };

  const roleBadgeColor = (role) => {
    const r = String(role || '').toLowerCase();
    if (r === 'admin') return { bg: '#FEF3C7', color: '#D97706' };
    if (r === 'gerente') return { bg: '#DBEAFE', color: '#2563EB' };
    if (r === 'caixa') return { bg: '#E0E7FF', color: '#4F46E5' };
    return { bg: '#D1FAE5', color: '#059669' };
  };

  const positionIcon = (pos) => {
    if (pos === 1) return '🥇';
    if (pos === 2) return '🥈';
    if (pos === 3) return '🥉';
    return `${pos}`;
  };

  const filtered = ranking.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const exportCSV = () => {
    const headers = ['Posicao,Nome,Email,Funcao,XP,Nivel,Coins,Streak,Aulas,Quizzes'];
    const rows = filtered.map(u =>
      `${u.position},"${u.name}","${u.email}",${roleLabel(u.role)},${u.total_xp},${u.level},${u.coins},${u.current_streak},${u.lessons_completed},${u.quizzes_completed}`
    );
    const csv = [...headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ranking_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Carregando ranking...</div>;
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
            <Trophy size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Ranking Completo
          </h1>
          <p style={{ color: '#6B7280' }}>{total} usuarios no ranking</p>
        </div>
        <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#059669', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      {/* Top 3 cards */}
      {ranking.length >= 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
          {ranking.slice(0, 3).map((u, i) => (
            <div key={u.id} className="card" style={{ textAlign: 'center', padding: 20, border: i === 0 ? '2px solid #F59E0B' : '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>{positionIcon(i + 1)}</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{u.name}</div>
              <div style={{ color: '#6B7280', fontSize: 13 }}>{roleLabel(u.role)}</div>
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 16 }}>
                <div><div style={{ fontWeight: 700, color: '#0047AB' }}>{u.total_xp}</div><div style={{ fontSize: 11, color: '#9CA3AF' }}>XP</div></div>
                <div><div style={{ fontWeight: 700, color: '#059669' }}>{u.level}</div><div style={{ fontSize: 11, color: '#9CA3AF' }}>Nivel</div></div>
                <div><div style={{ fontWeight: 700, color: '#D97706' }}>{u.current_streak}</div><div style={{ fontSize: 11, color: '#9CA3AF' }}>Streak</div></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 16, maxWidth: 400 }}>
        <Search size={18} color="#9CA3AF" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou email..."
          style={{ border: 'none', background: 'transparent', marginLeft: 10, outline: 'none', fontSize: 14, width: '100%' }}
        />
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>#</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>USUARIO</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>FUNCAO</th>
              <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>XP</th>
              <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>NIVEL</th>
              <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>COINS</th>
              <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>STREAK</th>
              <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>AULAS</th>
              <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>QUIZZES</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => {
              const badge = roleBadgeColor(u.role);
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '12px 8px', fontWeight: 700, fontSize: 16 }}>{positionIcon(u.position)}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ fontWeight: 500 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, background: badge.bg, color: badge.color, fontWeight: 600 }}>
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>{u.total_xp?.toLocaleString()}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right' }}>{u.level}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right' }}>{u.coins?.toLocaleString()}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right' }}>{u.current_streak}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right' }}>{u.lessons_completed}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right' }}>{u.quizzes_completed}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Nenhum usuario encontrado</div>
        )}
      </div>
    </div>
  );
}
