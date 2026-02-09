import React, { useEffect, useState } from 'react';
import { Target, Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { AdminDb } from '../../services/adminDb';

const missionTypes = [
  { value: 'complete_lessons', label: 'Completar Aulas' },
  { value: 'answer_quizzes', label: 'Responder Quizzes' },
  { value: 'earn_xp', label: 'Ganhar XP' },
  { value: 'study_time', label: 'Tempo de Estudo' },
  { value: 'perfect_streak', label: 'Streak Perfeito' },
  { value: 'login_daily', label: 'Login Diario' },
];

export default function AdminMissoes() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', missionType: 'complete_lessons',
    targetValue: 1, xpReward: 20, coinsReward: 5, difficultyLevel: 1
  });

  useEffect(() => { loadMissions(); }, []);

  const loadMissions = async () => {
    try {
      setLoading(true);
      const data = await AdminDb.missions.list();
      setMissions(data);
    } catch (e) {
      console.error('Erro:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await AdminDb.missions.create({
        title: form.title,
        description: form.description,
        missionType: form.missionType,
        targetValue: parseInt(form.targetValue),
        xpReward: parseInt(form.xpReward),
        coinsReward: parseInt(form.coinsReward),
        difficultyLevel: parseInt(form.difficultyLevel),
      });
      setShowForm(false);
      setForm({ title: '', description: '', missionType: 'complete_lessons', targetValue: 1, xpReward: 20, coinsReward: 5, difficultyLevel: 1 });
      loadMissions();
    } catch (e) {
      alert('Erro ao criar missao: ' + e.message);
    }
  };

  const toggleActive = async (mission) => {
    try {
      await AdminDb.missions.setActive({ id: mission.id, isActive: !mission.is_active });
      loadMissions();
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  };

  const removeMission = async (mission) => {
    if (!confirm(`Remover missao "${mission.title}"?`)) return;
    try {
      await AdminDb.missions.remove({ id: mission.id });
      loadMissions();
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  };

  const difficultyLabel = (level) => {
    if (level === 1) return { text: 'Facil', color: '#059669', bg: '#D1FAE5' };
    if (level === 2) return { text: 'Medio', color: '#D97706', bg: '#FEF3C7' };
    return { text: 'Dificil', color: '#DC2626', bg: '#FEE2E2' };
  };

  const missionTypeLabel = (type) => missionTypes.find(t => t.value === type)?.label || type;

  if (loading) {
    return <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Carregando missoes...</div>;
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
            <Target size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Missoes Diarias
          </h1>
          <p style={{ color: '#6B7280' }}>{missions.length} missoes cadastradas | {missions.filter(m => m.is_active).length} ativas</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#059669', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          <Plus size={16} /> Nova Missao
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Nova Missao Diaria</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Titulo da missao" required style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Descricao" style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <select value={form.missionType} onChange={e => setForm({...form, missionType: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }}>
              {missionTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input type="number" value={form.targetValue} onChange={e => setForm({...form, targetValue: e.target.value})} placeholder="Meta (valor alvo)" min="1" required style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <input type="number" value={form.xpReward} onChange={e => setForm({...form, xpReward: e.target.value})} placeholder="Recompensa XP" min="0" style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <input type="number" value={form.coinsReward} onChange={e => setForm({...form, coinsReward: e.target.value})} placeholder="Recompensa Coins" min="0" style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <select value={form.difficultyLevel} onChange={e => setForm({...form, difficultyLevel: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <option value="1">Facil</option>
              <option value="2">Medio</option>
              <option value="3">Dificil</option>
            </select>
            <div />
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
              <button type="submit" style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Criar Missao</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: '#f3f4f6', color: '#374151', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {missions.map(mission => {
          const diff = difficultyLabel(mission.difficulty_level);
          return (
            <div key={mission.id} className="card" style={{ padding: 20, opacity: mission.is_active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{mission.title}</div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{mission.description}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => toggleActive(mission)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    {mission.is_active ? <ToggleRight size={20} color="#059669" /> : <ToggleLeft size={20} color="#DC2626" />}
                  </button>
                  <button onClick={() => removeMission(mission)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <Trash2 size={16} color="#DC2626" />
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, background: '#EFF6FF', color: '#0047AB', fontWeight: 600 }}>{missionTypeLabel(mission.mission_type)}</span>
                <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, background: '#F3F4F6', color: '#374151' }}>Meta: {mission.target_value}</span>
                <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, background: '#FEF3C7', color: '#D97706', fontWeight: 600 }}>{mission.xp_reward} XP + {mission.coins_reward} coins</span>
                <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, background: diff.bg, color: diff.color, fontWeight: 600 }}>{diff.text}</span>
                <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, background: mission.is_active ? '#D1FAE5' : '#FEE2E2', color: mission.is_active ? '#059669' : '#DC2626' }}>
                  {mission.is_active ? 'Ativa' : 'Inativa'}
                </span>
              </div>
            </div>
          );
        })}
        {missions.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Nenhuma missao cadastrada ainda</div>
        )}
      </div>
    </div>
  );
}
