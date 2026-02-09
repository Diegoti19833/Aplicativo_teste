import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreVertical, Book, PlayCircle, X, Check, Video, FileText } from 'lucide-react';
import { AdminDb } from '../../services/adminDb';

export default function AdminTrilhas() {
  const [trails, setTrails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingTrail, setSavingTrail] = useState(false);
  const [savingLesson, setSavingLesson] = useState(false);
  const [showNewTrailModal, setShowNewTrailModal] = useState(false);
  const [showNewLessonModal, setShowNewLessonModal] = useState(false);
  const [selectedTrail, setSelectedTrail] = useState(null);
  const [search, setSearch] = useState('');
  
  // Form states
  const [newTrailData, setNewTrailData] = useState({ title: '', level: 'Básico', estimatedMinutes: 60, description: '' });
  const [newLessonData, setNewLessonData] = useState({ title: '', type: 'video', content: '', durationMinutes: 15 });

  useEffect(() => {
    loadTrails();
  }, []);

  const formatMinutes = (mins) => {
    const m = Number(mins) || 0;
    const h = Math.floor(m / 60);
    const r = m % 60;
    if (h <= 0) return `${r}min`;
    if (r <= 0) return `${h}h`;
    return `${h}h ${r}min`;
  };

  const loadTrails = async () => {
    try {
      setLoading(true);
      const data = await AdminDb.trails.list();
      setTrails(data);
    } catch (e) {
      alert(e?.message || 'Falha ao carregar trilhas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrail = async () => {
    if (!newTrailData.title) return alert('Preencha o título da trilha');
    try {
      setSavingTrail(true);
      await AdminDb.trails.create({
        title: newTrailData.title,
        description: newTrailData.description,
        levelLabel: newTrailData.level,
        estimatedMinutes: newTrailData.estimatedMinutes,
      });
      setNewTrailData({ title: '', level: 'Básico', estimatedMinutes: 60, description: '' });
      setShowNewTrailModal(false);
      await loadTrails();
      alert('Trilha criada com sucesso!');
    } catch (e) {
      alert(e?.message || 'Falha ao criar trilha');
    } finally {
      setSavingTrail(false);
    }
  };

  const handleCreateLesson = async () => {
    if (!newLessonData.title || !selectedTrail) return alert('Preencha os dados da aula');
    try {
      setSavingLesson(true);
      await AdminDb.lessons.create({
        trailId: selectedTrail.id,
        title: newLessonData.title,
        type: newLessonData.type,
        contentOrUrl: newLessonData.content,
        durationMinutes: newLessonData.durationMinutes,
      });
      setNewLessonData({ title: '', type: 'video', content: '', durationMinutes: 15 });
      setShowNewLessonModal(false);
      await loadTrails();
      alert('Aula criada com sucesso!');
    } catch (e) {
      alert(e?.message || 'Falha ao criar aula');
    } finally {
      setSavingLesson(false);
    }
  };

  const openLessonModal = (trail) => {
    setSelectedTrail(trail);
    setShowNewLessonModal(true);
  };

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Trilhas & Aulas</h1>
          <p style={{ color: '#6B7280' }}>Gerencie o conteúdo educacional da plataforma.</p>
        </div>
        <button 
          onClick={() => setShowNewTrailModal(true)}
          className="btn-primary" 
          style={{ 
            background: '#0047AB', color: 'white', border: 'none', padding: '10px 20px', 
            borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 
          }}
        >
          <Plus size={20} />
          Nova Trilha
        </button>
      </div>

      {/* List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 20, borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: 10 }} />
            <input 
              placeholder="Buscar trilhas..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ 
                width: '100%', padding: '8px 12px 8px 40px', borderRadius: 8, 
                border: '1px solid #e5e7eb', fontSize: 14 
              }} 
            />
          </div>
          <select style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white' }}>
            <option>Todos os Níveis</option>
            <option>Básico</option>
            <option>Intermediário</option>
            <option>Avançado</option>
          </select>
        </div>

        {loading ? (
          <div style={{ padding: 24 }}>Carregando trilhas...</div>
        ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>TÍTULO</th>
              <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>MÓDULOS</th>
              <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>DURAÇÃO</th>
              <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>STATUS</th>
              <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {trails
              .filter((t) => {
                if (!search.trim()) return true
                return String(t.title || '').toLowerCase().includes(search.trim().toLowerCase())
              })
              .map((trail) => (
              <tr key={trail.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, background: '#EFF6FF', borderRadius: 8, display: 'grid', placeItems: 'center', color: '#0047AB' }}>
                      <Book size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1F2937' }}>{trail.title}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>Nível {trail.difficulty_level}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px', color: '#6B7280' }}>{trail.total_lessons || 0} módulos</td>
                <td style={{ padding: '16px 24px', color: '#6B7280' }}>{formatMinutes(trail.estimated_duration)}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ 
                    padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                    background: trail.is_active ? '#ECFDF5' : '#F3F4F6',
                    color: trail.is_active ? '#059669' : '#4B5563'
                  }}>
                    {trail.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <button 
                    onClick={() => openLessonModal(trail)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginRight: 8 }}
                    title="Adicionar Aula"
                  >
                    <Plus size={18} color="#0047AB" />
                  </button>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <MoreVertical size={18} color="#9CA3AF" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {/* Quick Action Card */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 32 }}>
        <div 
          onClick={() => { setSelectedTrail(trails[0]); setShowNewLessonModal(true); }}
          className="card" 
          style={{ padding: 24, border: '1px dashed #e5e7eb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, cursor: 'pointer', background: '#f9fafb' }}
        >
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#E0E7FF', display: 'grid', placeItems: 'center', marginBottom: 16 }}>
            <PlayCircle size={24} color="#4F46E5" />
          </div>
          <div style={{ fontWeight: 600, color: '#1F2937', marginBottom: 4 }}>Criar Nova Aula Rápida</div>
          <div style={{ fontSize: 14, color: '#6B7280', textAlign: 'center' }}>Adicione conteúdo para a primeira trilha.</div>
        </div>
      </div>

      {/* Modals */}
      {showNewTrailModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div className="card" style={{ width: 500, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Nova Trilha</h3>
              <button onClick={() => setShowNewTrailModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Título</label>
                <input className="input" style={{ width: '100%' }} value={newTrailData.title} onChange={e => setNewTrailData({...newTrailData, title: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Nível</label>
                <select className="input" style={{ width: '100%' }} value={newTrailData.level} onChange={e => setNewTrailData({...newTrailData, level: e.target.value})}>
                  <option>Básico</option>
                  <option>Intermediário</option>
                  <option>Avançado</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Duração Estimada (min)</label>
                <input className="input" type="number" style={{ width: '100%' }} value={newTrailData.estimatedMinutes} onChange={e => setNewTrailData({...newTrailData, estimatedMinutes: Number(e.target.value)})} />
              </div>
              <button onClick={handleCreateTrail} disabled={savingTrail} className="btn-primary" style={{ marginTop: 8, justifyContent: 'center' }}>
                {savingTrail ? 'Criando...' : 'Criar Trilha'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewLessonModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div className="card" style={{ width: 500, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Nova Aula para "{selectedTrail?.title}"</h3>
              <button onClick={() => setShowNewLessonModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Título da Aula</label>
                <input className="input" style={{ width: '100%' }} value={newLessonData.title} onChange={e => setNewLessonData({...newLessonData, title: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Tipo de Conteúdo</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button 
                    onClick={() => setNewLessonData({...newLessonData, type: 'video'})}
                    style={{ 
                      flex: 1, padding: 12, border: newLessonData.type === 'video' ? '2px solid #0047AB' : '1px solid #e5e7eb', 
                      borderRadius: 8, background: newLessonData.type === 'video' ? '#EFF6FF' : 'white', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
                    }}
                  >
                    <Video size={20} color={newLessonData.type === 'video' ? '#0047AB' : '#6B7280'} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Vídeo</span>
                  </button>
                  <button 
                    onClick={() => setNewLessonData({...newLessonData, type: 'text'})}
                    style={{ 
                      flex: 1, padding: 12, border: newLessonData.type === 'text' ? '2px solid #0047AB' : '1px solid #e5e7eb', 
                      borderRadius: 8, background: newLessonData.type === 'text' ? '#EFF6FF' : 'white', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
                    }}
                  >
                    <FileText size={20} color={newLessonData.type === 'text' ? '#0047AB' : '#6B7280'} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Texto / Quiz</span>
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Duração (min)</label>
                <input className="input" type="number" style={{ width: '100%' }} value={newLessonData.durationMinutes} onChange={e => setNewLessonData({...newLessonData, durationMinutes: Number(e.target.value)})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Conteúdo / URL</label>
                <input className="input" style={{ width: '100%' }} placeholder="URL do vídeo ou texto..." value={newLessonData.content} onChange={e => setNewLessonData({...newLessonData, content: e.target.value})} />
              </div>
              <button onClick={handleCreateLesson} disabled={savingLesson} className="btn-primary" style={{ marginTop: 8, justifyContent: 'center' }}>
                {savingLesson ? 'Salvando...' : 'Salvar Aula'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
