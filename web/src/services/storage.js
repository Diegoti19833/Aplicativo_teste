
const STORAGE_KEYS = {
  TRAILS: 'gamepop_trails',
  USERS: 'gamepop_users',
  CONFIG: 'gamepop_config',
  LESSONS: 'gamepop_lessons'
};

const DEFAULT_TRAILS = [
  { id: 1, title: 'Fundamentos do Atendimento', modules: 4, duration: '2h 30m', status: 'Ativo', level: 'Básico', description: 'Aprenda os pilares do atendimento ao cliente.' },
  { id: 2, title: 'Técnicas de Vendas Pet', modules: 6, duration: '4h 15m', status: 'Ativo', level: 'Intermediário', description: 'Como vender mais produtos pet.' },
  { id: 3, title: 'Cuidados Básicos', modules: 3, duration: '1h 45m', status: 'Rascunho', level: 'Básico', description: 'Saúde e bem-estar animal inicial.' },
  { id: 4, title: 'Gestão de Estoque', modules: 5, duration: '3h 20m', status: 'Ativo', level: 'Avançado', description: 'Controle de produtos e validade.' },
];

const DEFAULT_USERS = [
  { id: 1, name: 'Ana Silva', email: 'ana.silva@petclass.com', role: 'Funcionário', xp: 1250, level: 5, status: 'Ativo' },
  { id: 2, name: 'Carlos Souza', email: 'carlos.souza@petclass.com', role: 'Gerente', xp: 3400, level: 12, status: 'Ativo' },
  { id: 3, name: 'Beatriz Costa', email: 'bia.costa@petclass.com', role: 'Funcionário', xp: 850, level: 3, status: 'Inativo' },
  { id: 4, name: 'João Paulo', email: 'joao.paulo@petclass.com', role: 'Funcionário', xp: 2100, level: 8, status: 'Ativo' },
  { id: 5, name: 'Fernanda Lima', email: 'fernanda.lima@petclass.com', role: 'Caixa', xp: 1500, level: 6, status: 'Ativo' },
];

const DEFAULT_CONFIG = {
  companyName: 'Pet Class',
  primaryColor: '#0047AB',
  secondaryColor: '#FFD700',
  dailyXpLimit: 1000,
  globalRanking: true,
  soundEnabled: true
};

// Helper to get data or default
const get = (key, defaultVal) => {
  const stored = localStorage.getItem(key);
  if (!stored) return defaultVal;
  try {
    return JSON.parse(stored);
  } catch {
    return defaultVal;
  }
};

// Helper to set data
const set = (key, val) => {
  localStorage.setItem(key, JSON.stringify(val));
};

export const StorageService = {
  // Trails
  getTrails: () => get(STORAGE_KEYS.TRAILS, DEFAULT_TRAILS),
  addTrail: (trail) => {
    const trails = get(STORAGE_KEYS.TRAILS, DEFAULT_TRAILS);
    const newTrail = { ...trail, id: Date.now(), status: 'Ativo', modules: 0 };
    set(STORAGE_KEYS.TRAILS, [newTrail, ...trails]);
    return newTrail;
  },
  deleteTrail: (id) => {
    const trails = get(STORAGE_KEYS.TRAILS, DEFAULT_TRAILS);
    set(STORAGE_KEYS.TRAILS, trails.filter(t => t.id !== id));
  },

  // Lessons (stored separately or nested, let's store separately for simplicity and link by trailId)
  getLessons: (trailId) => {
    const allLessons = get(STORAGE_KEYS.LESSONS, []);
    return allLessons.filter(l => l.trailId === trailId);
  },
  addLesson: (lesson) => {
    const allLessons = get(STORAGE_KEYS.LESSONS, []);
    const newLesson = { ...lesson, id: Date.now() };
    set(STORAGE_KEYS.LESSONS, [...allLessons, newLesson]);
    
    // Update module count in trail
    const trails = get(STORAGE_KEYS.TRAILS, DEFAULT_TRAILS);
    const trailIndex = trails.findIndex(t => t.id === lesson.trailId);
    if (trailIndex >= 0) {
      trails[trailIndex].modules = (trails[trailIndex].modules || 0) + 1;
      set(STORAGE_KEYS.TRAILS, trails);
    }
    return newLesson;
  },

  // Users
  getUsers: () => get(STORAGE_KEYS.USERS, DEFAULT_USERS),
  addUser: (user) => {
    const users = get(STORAGE_KEYS.USERS, DEFAULT_USERS);
    const newUser = { ...user, id: Date.now(), xp: 0, level: 1, status: 'Ativo' };
    set(STORAGE_KEYS.USERS, [newUser, ...users]);
    return newUser;
  },
  toggleUserStatus: (id) => {
    const users = get(STORAGE_KEYS.USERS, DEFAULT_USERS);
    const updated = users.map(u => u.id === id ? { ...u, status: u.status === 'Ativo' ? 'Inativo' : 'Ativo' } : u);
    set(STORAGE_KEYS.USERS, updated);
  },

  // Config
  getConfig: () => get(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG),
  saveConfig: (config) => set(STORAGE_KEYS.CONFIG, config),
  
  // Reset (for debug)
  reset: () => {
    localStorage.clear();
    window.location.reload();
  }
};
