import React, { useState, useEffect } from 'react';
import {
  Plus, Search, MoreVertical, Book, PlayCircle, X, Check, Video, FileText,
  Pencil, Trash, List, Clock, AlignLeft, ExternalLink, HelpCircle,
  ChevronDown, ChevronUp, Users, Eye, ToggleLeft, ToggleRight, TrendingUp, UserCheck, Briefcase, Shield
} from 'lucide-react';
import { AdminDb } from '../../services/adminDb';
import { useToast } from './ToastContext';

function TrailStatsCard({ title, value, icon, color }) {
  const gradients = {
    blue: 'from-blue-500 to-indigo-600',
    purple: 'from-violet-500 to-purple-600',
    green: 'from-emerald-500 to-teal-600',
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

const QuizBuilder = ({ value, onChange }) => {
  const quiz = value || { title: '', questions: [] };

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      text: '',
      options: [
        { id: Date.now() + 1, text: '', isCorrect: false },
        { id: Date.now() + 2, text: '', isCorrect: false }
      ]
    };
    onChange({ ...quiz, questions: [...(quiz.questions || []), newQuestion] });
  };

  const updateQuestion = (qId, updates) => {
    const newQuestions = (quiz.questions || []).map(q => q.id === qId ? { ...q, ...updates } : q);
    onChange({ ...quiz, questions: newQuestions });
  };

  const removeQuestion = (qId) => {
    onChange({ ...quiz, questions: (quiz.questions || []).filter(q => q.id !== qId) });
  };

  const addOption = (qId) => {
    const newQuestions = (quiz.questions || []).map(q => {
      if (q.id === qId) {
        return {
          ...q,
          options: [...(q.options || []), { id: Date.now(), text: '', isCorrect: false }]
        };
      }
      return q;
    });
    onChange({ ...quiz, questions: newQuestions });
  };

  const updateOption = (qId, optId, updates) => {
    const newQuestions = (quiz.questions || []).map(q => {
      if (q.id === qId) {
        const newOptions = (q.options || []).map(o => o.id === optId ? { ...o, ...updates } : o);
        if (updates.isCorrect) {
          newOptions.forEach(o => {
            if (o.id !== optId) o.isCorrect = false;
          });
        }
        return { ...q, options: newOptions };
      }
      return q;
    });
    onChange({ ...quiz, questions: newQuestions });
  };

  const removeOption = (qId, optId) => {
    const newQuestions = (quiz.questions || []).map(q => {
      if (q.id === qId) {
        return { ...q, options: (q.options || []).filter(o => o.id !== optId) };
      }
      return q;
    });
    onChange({ ...quiz, questions: newQuestions });
  };

  return (
    <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2">
      <div>
        <label className="block mb-1.5 text-sm font-medium text-gray-700">Título do Quiz</label>
        <input
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={quiz.title || ''}
          onChange={e => onChange({ ...quiz, title: e.target.value })}
          placeholder="Ex: Avaliação de Conhecimentos"
        />
      </div>

      <div className="flex flex-col gap-6">
        {quiz.questions?.map((q, index) => (
          <div key={q.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between mb-3">
              <span className="font-semibold text-gray-700">Pergunta {index + 1}</span>
              <button onClick={() => removeQuestion(q.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Remover Pergunta</button>
            </div>

            <input
              className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={q.text}
              onChange={e => updateQuestion(q.id, { text: e.target.value })}
              placeholder="Digite a pergunta..."
            />

            <div className="grid gap-2 pl-3">
              {(q.options || []).map((opt, optIndex) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <div
                    onClick={() => updateOption(q.id, opt.id, { isCorrect: true })}
                    className={`w-5 h-5 rounded-full border-2 cursor-pointer flex-shrink-0 flex items-center justify-center transition-colors
                        ${opt.isCorrect ? 'border-green-600 bg-green-600' : 'border-gray-300 bg-transparent'}`}
                    title="Marcar como correta"
                  >
                    {opt.isCorrect && <Check size={12} color="white" />}
                  </div>
                  <span className="text-sm font-semibold text-gray-500 w-5">{String.fromCharCode(65 + optIndex)}</span>
                  <input
                    className={`flex-1 px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500
                         ${opt.isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                    value={opt.text}
                    onChange={e => updateOption(q.id, opt.id, { text: e.target.value })}
                    placeholder={`Opção ${String.fromCharCode(65 + optIndex)}`}
                  />
                  <button onClick={() => removeOption(q.id, opt.id)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                </div>
              ))}
              <button
                onClick={() => addOption(q.id)}
                className="text-blue-600 hover:text-blue-800 text-sm font-semibold text-left mt-1"
              >
                + Adicionar Alternativa
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addQuestion}
        className="w-full py-3 border border-dashed border-blue-300 bg-blue-50 text-blue-700 rounded-lg font-semibold hover:bg-blue-100 transition-colors"
      >
        + Adicionar Pergunta
      </button>
    </div>
  );
};

export default function AdminTrilhas() {
  const toast = useToast();
  const [trails, setTrails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingTrail, setSavingTrail] = useState(false);
  const [savingLesson, setSavingLesson] = useState(false);

  // Modals state
  const [showNewTrailModal, setShowNewTrailModal] = useState(false);
  const [showEditTrailModal, setShowEditTrailModal] = useState(false);
  const [showNewLessonModal, setShowNewLessonModal] = useState(false);
  const [showEditLessonModal, setShowEditLessonModal] = useState(false);

  // Selection state
  const [selectedTrail, setSelectedTrail] = useState(null);
  const [currentTrailLessons, setCurrentTrailLessons] = useState([]);
  const [expandedTrailId, setExpandedTrailId] = useState(null);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [search, setSearch] = useState('');

  // Form states
  const ROLE_OPTIONS = [
    { value: 'funcionario', label: 'Funcionário', icon: UserCheck, color: 'blue' },
    { value: 'gerente', label: 'Gerente', icon: Briefcase, color: 'purple' },
    { value: 'caixa', label: 'Caixa', icon: Shield, color: 'amber' },
  ];

  const [filterRole, setFilterRole] = useState('todos');
  const [newTrailData, setNewTrailData] = useState({ title: '', level: 'Básico', estimatedMinutes: 60, description: '', targetRoles: ['funcionario', 'gerente', 'caixa'] });
  const [editingTrailData, setEditingTrailData] = useState(null);
  const [newLessonData, setNewLessonData] = useState({ title: '', type: 'video', content: '', durationMinutes: 15, quizData: null });
  const [editingLessonData, setEditingLessonData] = useState(null);

  const MOCK_TRAILS = [
    { id: 1, title: 'Atendimento ao Cliente', description: 'Técnicas essenciais de atendimento e relacionamento.', difficulty_level: 1, level_label: 'Básico', estimated_duration: 120, is_active: true, total_lessons: 8, enrolled_count: 245 },
    { id: 2, title: 'Técnicas de Vendas', description: 'Estratégias avançadas para aumentar conversões.', difficulty_level: 3, level_label: 'Intermediário', estimated_duration: 180, is_active: true, total_lessons: 12, enrolled_count: 189 },
    { id: 3, title: 'Gestão de Conflitos', description: 'Como resolver situações difíceis com clientes.', difficulty_level: 3, level_label: 'Intermediário', estimated_duration: 90, is_active: true, total_lessons: 6, enrolled_count: 134 },
    { id: 4, title: 'Liderança e Equipes', description: 'Desenvolvimento de habilidades de liderança.', difficulty_level: 5, level_label: 'Avançado', estimated_duration: 240, is_active: false, total_lessons: 15, enrolled_count: 67 },
  ];

  const loadTrails = async () => {
    try {
      setLoading(true);
      const data = await AdminDb.trails.list();
      setTrails(data && data.length > 0 ? data : MOCK_TRAILS);
    } catch (e) {
      console.error(e);
      setTrails(MOCK_TRAILS);
    } finally {
      setLoading(false);
    }
  };

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

  const toggleExpandTrail = async (trailId) => {
    if (expandedTrailId === trailId) {
      setExpandedTrailId(null);
      return;
    }

    setExpandedTrailId(trailId);
    setLoadingLessons(true);
    try {
      const lessons = await AdminDb.lessons.listByTrail({ trailId });
      setCurrentTrailLessons(lessons);
    } catch (e) {
      console.error('Erro ao carregar aulas:', e);
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleToggleActive = async (e, trail) => {
    e.stopPropagation();
    try {
      const newState = !trail.is_active;
      await AdminDb.trails.setActive({ id: trail.id, isActive: newState });

      setTrails(prev => prev.map(t => t.id === trail.id ? { ...t, is_active: newState } : t));
    } catch (err) {
      alert(err?.message || 'Erro ao alterar status da trilha');
    }
  };

  const handleCreateTrail = async () => {
    if (!newTrailData.title) return alert('Preencha o título da trilha');
    if (!newTrailData.targetRoles || newTrailData.targetRoles.length === 0) return alert('Selecione pelo menos uma função');
    try {
      setSavingTrail(true);
      await AdminDb.trails.create({
        title: newTrailData.title,
        description: newTrailData.description,
        levelLabel: newTrailData.level,
        estimatedMinutes: newTrailData.estimatedMinutes,
        targetRoles: newTrailData.targetRoles,
      });
      setNewTrailData({ title: '', level: 'Básico', estimatedMinutes: 60, description: '', targetRoles: ['funcionario', 'gerente', 'caixa'] });
      setShowNewTrailModal(false);
      await loadTrails();
    } catch (e) {
      alert(e?.message || 'Falha ao criar trilha');
    } finally {
      setSavingTrail(false);
    }
  };

  const handleUpdateTrail = async () => {
    if (!editingTrailData.title) return alert('Preencha o título da trilha');
    try {
      setSavingTrail(true);
      await AdminDb.trails.update({
        id: editingTrailData.id,
        title: editingTrailData.title,
        description: editingTrailData.description,
        levelLabel: editingTrailData.level,
        estimatedMinutes: editingTrailData.estimatedMinutes,
        isActive: editingTrailData.is_active,
        targetRoles: editingTrailData.targetRoles,
      });
      setEditingTrailData(null);
      setShowEditTrailModal(false);
      await loadTrails();
    } catch (e) {
      alert(e?.message || 'Falha ao atualizar trilha');
    } finally {
      setSavingTrail(false);
    }
  };

  const handleDeleteTrail = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta trilha? Todas as aulas serão removidas.')) return;
    try {
      await AdminDb.trails.remove({ id });
      await loadTrails();
    } catch (e) {
      alert(e?.message || 'Falha ao excluir trilha');
    }
  };

  const openEditTrailModal = (e, trail) => {
    e.stopPropagation();
    setEditingTrailData({
      id: trail.id,
      title: trail.title,
      description: trail.description || '',
      level: trail.difficulty_level === 1 ? 'Básico' : trail.difficulty_level === 3 ? 'Intermediário' : 'Avançado',
      estimatedMinutes: trail.estimated_duration,
      is_active: trail.is_active,
      targetRoles: trail.target_roles || ['funcionario', 'gerente', 'caixa'],
    });
    setShowEditTrailModal(true);
  };

  const handleCreateLesson = async () => {
    if (!newLessonData.title || !selectedTrail) return alert('Preencha os dados da aula');
    try {
      setSavingLesson(true);

      let finalContent = newLessonData.content;
      if (newLessonData.type === 'quiz') {
        finalContent = JSON.stringify(newLessonData.quizData || { title: newLessonData.title, questions: [] });
      }

      await AdminDb.lessons.create({
        trailId: selectedTrail.id,
        title: newLessonData.title,
        type: newLessonData.type,
        contentOrUrl: finalContent,
        durationMinutes: newLessonData.durationMinutes,
      });
      setNewLessonData({ title: '', type: 'video', content: '', durationMinutes: 15, quizData: null });
      setShowNewLessonModal(false);

      // Update expanded view if open
      if (expandedTrailId === selectedTrail.id) {
        const lessons = await AdminDb.lessons.listByTrail({ trailId: selectedTrail.id });
        setCurrentTrailLessons(lessons);
      }

      await loadTrails(); // Update total lessons count
    } catch (e) {
      alert(e?.message || 'Falha ao criar aula');
    } finally {
      setSavingLesson(false);
    }
  };

  const handleUpdateLesson = async () => {
    if (!editingLessonData.title) return alert('Preencha o título da aula');
    try {
      setSavingLesson(true);

      let finalContent = editingLessonData.content;
      if (editingLessonData.type === 'quiz') {
        finalContent = JSON.stringify(editingLessonData.quizData || { title: editingLessonData.title, questions: [] });
      }

      await AdminDb.lessons.update({
        id: editingLessonData.id,
        title: editingLessonData.title,
        type: editingLessonData.type,
        contentOrUrl: finalContent,
        durationMinutes: editingLessonData.durationMinutes,
      });
      setEditingLessonData(null);
      setShowEditLessonModal(false);

      // Update expanded view if open
      if (expandedTrailId) {
        const lessons = await AdminDb.lessons.listByTrail({ trailId: expandedTrailId });
        setCurrentTrailLessons(lessons);
      }
      await loadTrails();
    } catch (e) {
      alert(e?.message || 'Falha ao atualizar aula');
    } finally {
      setSavingLesson(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta aula?')) return;
    try {
      await AdminDb.lessons.remove({ id: lessonId });
      // Update expanded view
      if (expandedTrailId) {
        const lessons = await AdminDb.lessons.listByTrail({ trailId: expandedTrailId });
        setCurrentTrailLessons(lessons);
      }
      await loadTrails();
    } catch (e) {
      alert(e?.message || 'Falha ao excluir aula');
    }
  };

  const openLessonModal = (e, trail) => {
    e.stopPropagation();
    setSelectedTrail(trail);
    setShowNewLessonModal(true);
  };

  const openEditLessonModal = (lesson) => {
    let quizData = null;
    const type = lesson.lesson_type === 'video' ? 'video' : lesson.lesson_type === 'quiz' ? 'quiz' : 'text';
    let content = lesson.video_url || lesson.content || '';

    if (type === 'quiz') {
      try {
        quizData = typeof lesson.content === 'string' ? JSON.parse(lesson.content) : lesson.content;
      } catch {
        quizData = { title: lesson.title, questions: [] };
      }
    }

    setEditingLessonData({
      id: lesson.id,
      title: lesson.title,
      type: type,
      content: content,
      durationMinutes: lesson.duration,
      quizData: quizData
    });
    setShowEditLessonModal(true);
  };

  const handlePreview = (e) => {
    e.stopPropagation();
    alert('Funcionalidade de Preview em desenvolvimento. Em breve você poderá visualizar como o aluno vê a trilha.');
  };

  const totalTrails = trails.length;
  const activeTrails = trails.filter(t => t.isActive || t.is_active).length;
  const totalModules = trails.reduce((acc, t) => acc + (t.modules?.length || 0), 0);

  return (
    <div className="p-8 space-y-6 animate-fade-in relative z-10">
      {/* Mini Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <TrailStatsCard title="Total de Trilhas" value={totalTrails} icon={<Book />} color="blue" />
        <TrailStatsCard title="Trilhas Ativas" value={activeTrails} icon={<Check />} color="green" />
        <TrailStatsCard title="Módulos Criados" value={totalModules} icon={<List />} color="purple" />
        <TrailStatsCard title="Engajamento Médio" value="85%" icon={<TrendingUp />} color="orange" />
      </div>

      <div className="glass-panel p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Trilhas de Aprendizagem</h1>
            <p className="text-gray-500">Gerencie cursos, módulos e conteúdos educacionais.</p>
          </div>
          <button
            onClick={() => setShowNewTrailModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            <Plus size={20} />
            Nova Trilha
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Buscar trilhas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <select className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option>Todos os Níveis</option>
              <option>Básico</option>
              <option>Intermediário</option>
              <option>Avançado</option>
            </select>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="todos">Todas as Funções</option>
              <option value="funcionario">Funcionário</option>
              <option value="gerente">Gerente</option>
              <option value="caixa">Caixa</option>
            </select>
          </div>
        </div>

        {/* Grid Layout */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse h-64"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trails.filter(t => {
              if (search.trim() && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
              if (filterRole !== 'todos' && Array.isArray(t.target_roles) && !t.target_roles.includes(filterRole)) return false;
              return true;
            }).map((trail) => (
              <div
                key={trail.id}
                className={`bg-white rounded-xl shadow-sm border transition-all duration-200 group
                ${expandedTrailId === trail.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-100 hover:border-blue-300 hover:shadow-md'}
              `}
              >
                {/* Card Header */}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <Book size={24} />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleToggleActive(e, trail)}
                        className={`p-1.5 rounded-lg transition-colors ${trail.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                        title={trail.is_active ? "Desativar Trilha" : "Ativar Trilha"}
                      >
                        {trail.is_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                      </button>
                      <div className="relative group/menu">
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                          <MoreVertical size={20} />
                        </button>
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 hidden group-hover/menu:block z-10">
                          <button onClick={(e) => openEditTrailModal(e, trail)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <Pencil size={14} /> Editar Detalhes
                          </button>
                          <button onClick={() => handleDeleteTrail(trail.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                            <Trash size={14} /> Excluir Trilha
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1" title={trail.title}>{trail.title}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2 h-10">{trail.description || 'Sem descrição definida.'}</p>

                  {/* Target Roles Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(trail.target_roles || ['funcionario', 'gerente', 'caixa']).map(role => {
                      const roleInfo = ROLE_OPTIONS.find(r => r.value === role);
                      if (!roleInfo) return null;
                      const colors = {
                        blue: 'bg-blue-50 text-blue-700 border-blue-200',
                        purple: 'bg-purple-50 text-purple-700 border-purple-200',
                        amber: 'bg-amber-50 text-amber-700 border-amber-200',
                      };
                      return (
                        <span key={role} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[roleInfo.color]}`}>
                          {React.createElement(roleInfo.icon, { size: 10 })}
                          {roleInfo.label}
                        </span>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Clock size={16} className="text-gray-400" />
                      {formatMinutes(trail.estimated_duration)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <AlignLeft size={16} className="text-gray-400" />
                      Nível {trail.difficulty_level === 1 ? 'Básico' : trail.difficulty_level === 3 ? 'Interm.' : 'Avançado'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500" title="Aulas">
                        <List size={14} /> {trail.total_lessons || 0}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500" title="Alunos Matriculados">
                        <Users size={14} /> {Math.floor(Math.random() * 50)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handlePreview(e)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Eye size={14} /> Preview
                    </button>
                  </div>
                </div>

                {/* Expandable Lessons Area */}
                <div className={`bg-gray-50 border-t border-gray-100 transition-all duration-300 ${expandedTrailId === trail.id ? 'max-h-96' : 'max-h-12'} overflow-hidden flex flex-col`}>
                  <button
                    onClick={() => toggleExpandTrail(trail.id)}
                    className="w-full px-5 py-3 flex items-center justify-between text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                  >
                    <span>{expandedTrailId === trail.id ? 'Ocultar Aulas' : 'Ver Aulas & Conteúdo'}</span>
                    {expandedTrailId === trail.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {expandedTrailId === trail.id && (
                    <div className="px-5 pb-5 overflow-y-auto custom-scrollbar flex-1">
                      {loadingLessons ? (
                        <div className="text-center py-4 text-sm text-gray-500">Carregando aulas...</div>
                      ) : currentTrailLessons.length === 0 ? (
                        <div className="text-center py-6 text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                          <p className="mb-2">Nenhuma aula nesta trilha.</p>
                          <button onClick={(e) => openLessonModal(e, trail)} className="text-blue-600 font-semibold hover:underline">+ Adicionar Primeira Aula</button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {currentTrailLessons.map((lesson, idx) => (
                            <div key={lesson.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg group/lesson hover:border-blue-300 transition-colors">
                              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">
                                {idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-medium text-gray-900 truncate">{lesson.title}</h4>
                                  {lesson.lesson_type === 'video' && <Video size={12} className="text-gray-400" />}
                                  {lesson.lesson_type === 'quiz' && <HelpCircle size={12} className="text-purple-400" />}
                                  {lesson.lesson_type === 'text' && <FileText size={12} className="text-amber-400" />}
                                </div>
                                <div className="text-xs text-gray-500">{lesson.duration} min</div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover/lesson:opacity-100 transition-opacity">
                                <button onClick={() => openEditLessonModal(lesson)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded"><Pencil size={14} /></button>
                                <button onClick={() => handleDeleteLesson(lesson.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><Trash size={14} /></button>
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={(e) => openLessonModal(e, trail)}
                            className="w-full py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg border border-dashed border-blue-200 transition-colors"
                          >
                            + Adicionar Nova Aula
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Trail Modal */}
      {
        showNewTrailModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-800">Nova Trilha</h3>
                <button onClick={() => setShowNewTrailModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título da Trilha</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newTrailData.title}
                    onChange={e => setNewTrailData({ ...newTrailData, title: e.target.value })}
                    placeholder="Ex: Onboarding"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                    value={newTrailData.description}
                    onChange={e => setNewTrailData({ ...newTrailData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nível</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newTrailData.level}
                      onChange={e => setNewTrailData({ ...newTrailData, level: e.target.value })}
                    >
                      <option>Básico</option>
                      <option>Intermediário</option>
                      <option>Avançado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duração (min)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newTrailData.estimatedMinutes}
                      onChange={e => setNewTrailData({ ...newTrailData, estimatedMinutes: e.target.value })}
                    />
                  </div>
                </div>
                {/* Público-alvo por Função */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Público-alvo (Funções)</label>
                  <div className="flex flex-wrap gap-2">
                    {ROLE_OPTIONS.map(role => {
                      const isSelected = (newTrailData.targetRoles || []).includes(role.value);
                      const colorMap = {
                        blue: isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400',
                        purple: isSelected ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400',
                        amber: isSelected ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-300 hover:border-amber-400',
                      };
                      return (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => {
                            const current = newTrailData.targetRoles || [];
                            const next = isSelected ? current.filter(r => r !== role.value) : [...current, role.value];
                            setNewTrailData({ ...newTrailData, targetRoles: next });
                          }}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${colorMap[role.color]}`}
                        >
                          {React.createElement(role.icon, { size: 14 })}
                          {role.label}
                          {isSelected && <Check size={14} />}
                        </button>
                      );
                    })}
                  </div>
                  {(newTrailData.targetRoles || []).length === 0 && (
                    <p className="text-xs text-red-500 mt-1">Selecione pelo menos uma função</p>
                  )}
                </div>
                <button
                  onClick={handleCreateTrail}
                  disabled={savingTrail}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
                >
                  {savingTrail ? 'Criando...' : 'Criar Trilha'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Edit Trail Modal */}
      {
        showEditTrailModal && editingTrailData && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-800">Editar Trilha</h3>
                <button onClick={() => setShowEditTrailModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingTrailData.title}
                    onChange={e => setEditingTrailData({ ...editingTrailData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                    value={editingTrailData.description}
                    onChange={e => setEditingTrailData({ ...editingTrailData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nível</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editingTrailData.level}
                      onChange={e => setEditingTrailData({ ...editingTrailData, level: e.target.value })}
                    >
                      <option>Básico</option>
                      <option>Intermediário</option>
                      <option>Avançado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duração (min)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editingTrailData.estimatedMinutes}
                      onChange={e => setEditingTrailData({ ...editingTrailData, estimatedMinutes: e.target.value })}
                    />
                  </div>
                </div>
                {/* Público-alvo por Função */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Público-alvo (Funções)</label>
                  <div className="flex flex-wrap gap-2">
                    {ROLE_OPTIONS.map(role => {
                      const isSelected = (editingTrailData.targetRoles || []).includes(role.value);
                      const colorMap = {
                        blue: isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400',
                        purple: isSelected ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400',
                        amber: isSelected ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-300 hover:border-amber-400',
                      };
                      return (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => {
                            const current = editingTrailData.targetRoles || [];
                            const next = isSelected ? current.filter(r => r !== role.value) : [...current, role.value];
                            setEditingTrailData({ ...editingTrailData, targetRoles: next });
                          }}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${colorMap[role.color]}`}
                        >
                          {React.createElement(role.icon, { size: 14 })}
                          {role.label}
                          {isSelected && <Check size={14} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button
                  onClick={handleUpdateTrail}
                  disabled={savingTrail}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
                >
                  {savingTrail ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* New/Edit Lesson Modal */}
      {
        (showNewLessonModal || showEditLessonModal) && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-800">
                  {showEditLessonModal ? 'Editar Aula' : 'Nova Aula'}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    em {selectedTrail?.title || (editingLessonData ? 'Trilha' : '')}
                  </span>
                </h3>
                <button onClick={() => { setShowNewLessonModal(false); setShowEditLessonModal(false); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>

              <div className="p-6 overflow-y-auto">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Título da Aula</label>
                      <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={showEditLessonModal ? editingLessonData.title : newLessonData.title}
                        onChange={e => showEditLessonModal
                          ? setEditingLessonData({ ...editingLessonData, title: e.target.value })
                          : setNewLessonData({ ...newLessonData, title: e.target.value })
                        }
                        placeholder="Ex: Introdução ao Módulo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duração (min)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={showEditLessonModal ? editingLessonData.durationMinutes : newLessonData.durationMinutes}
                        onChange={e => showEditLessonModal
                          ? setEditingLessonData({ ...editingLessonData, durationMinutes: e.target.value })
                          : setNewLessonData({ ...newLessonData, durationMinutes: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Conteúdo</label>
                    <div className="flex gap-4">
                      {['video', 'text', 'quiz'].map(type => (
                        <label key={type} className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors
                        ${(showEditLessonModal ? editingLessonData.type : newLessonData.type) === type
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                          }`}
                        >
                          <input
                            type="radio"
                            name="lessonType"
                            className="hidden"
                            checked={(showEditLessonModal ? editingLessonData.type : newLessonData.type) === type}
                            onChange={() => showEditLessonModal
                              ? setEditingLessonData({ ...editingLessonData, type })
                              : setNewLessonData({ ...newLessonData, type })
                            }
                          />
                          {type === 'video' && <Video size={18} />}
                          {type === 'text' && <FileText size={18} />}
                          {type === 'quiz' && <HelpCircle size={18} />}
                          <span className="capitalize font-medium">
                            {type === 'video' ? 'Vídeo' : type === 'text' ? 'Texto' : 'Quiz'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {(showEditLessonModal ? editingLessonData.type : newLessonData.type) === 'video' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL do Vídeo (YouTube/Vimeo)</label>
                      <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={showEditLessonModal ? editingLessonData.content : newLessonData.content}
                        onChange={e => showEditLessonModal
                          ? setEditingLessonData({ ...editingLessonData, content: e.target.value })
                          : setNewLessonData({ ...newLessonData, content: e.target.value })
                        }
                        placeholder="https://youtube.com/..."
                      />
                    </div>
                  )}

                  {(showEditLessonModal ? editingLessonData.type : newLessonData.type) === 'text' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo em Texto</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-48"
                        value={showEditLessonModal ? editingLessonData.content : newLessonData.content}
                        onChange={e => showEditLessonModal
                          ? setEditingLessonData({ ...editingLessonData, content: e.target.value })
                          : setNewLessonData({ ...newLessonData, content: e.target.value })
                        }
                        placeholder="Escreva o conteúdo da aula..."
                      />
                    </div>
                  )}

                  {(showEditLessonModal ? editingLessonData.type : newLessonData.type) === 'quiz' && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <QuizBuilder
                        value={showEditLessonModal ? editingLessonData.quizData : newLessonData.quizData}
                        onChange={val => showEditLessonModal
                          ? setEditingLessonData({ ...editingLessonData, quizData: val })
                          : setNewLessonData({ ...newLessonData, quizData: val })
                        }
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => { setShowNewLessonModal(false); setShowEditLessonModal(false); }}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium shadow-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={showEditLessonModal ? handleUpdateLesson : handleCreateLesson}
                  disabled={savingLesson}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
                >
                  {savingLesson ? 'Salvando...' : (showEditLessonModal ? 'Salvar Alterações' : 'Criar Aula')}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
