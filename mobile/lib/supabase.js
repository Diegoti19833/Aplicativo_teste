import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const SUPABASE_URL = 'https://ijbdkochrgafvpicpncc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqYmRrb2NocmdhZnZwaWNwbmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MTA0NTcsImV4cCI6MjA3NTk4NjQ1N30.AmbW_h7YD2C-9UedfRb-cvRtDF1ypjdBhYwGi-hxUso';

// Criar cliente do Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Funções de autenticação
export const auth = {
  // Fazer login com email e senha
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Registrar novo usuário
  signUp: async (email, password, userData = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Fazer logout
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Obter usuário atual
  getCurrentUser: () => {
    return supabase.auth.getUser();
  },

  // Escutar mudanças de autenticação
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Resetar senha
  resetPassword: async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

// Funções para operações do banco de dados
export const database = {
  // Completar uma aula
  completeLesson: async (userId, lessonId) => {
    try {
      const { data, error } = await supabase.rpc('complete_lesson', {
        user_id_param: userId,
        lesson_id_param: lessonId,
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Responder um quiz
  answerQuiz: async (userId, quizId, selectedOptionId) => {
    try {
      const { data, error } = await supabase.rpc('answer_quiz', {
        user_id_param: userId,
        quiz_id_param: quizId,
        selected_option_param: selectedOptionId,
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Obter dashboard do usuário
  getUserDashboard: async (userId) => {
    try {
      const { data, error } = await supabase.rpc('get_user_dashboard', {
        user_id_param: userId,
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Obter progresso de uma trilha
  getTrailProgress: async (userId, trailId) => {
    try {
      const { data, error } = await supabase.rpc('get_trail_progress', {
        user_id_param: userId,
        trail_id_param: trailId,
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Obter ranking semanal
  getWeeklyRanking: async (limit = 10) => {
    try {
      const { data, error } = await supabase.rpc('get_weekly_ranking', {
        limit_param: limit,
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Obter todas as trilhas
  getTrails: async () => {
    try {
      const { data, error } = await supabase
        .from('trails')
        .select('*')
        .order('order_index');
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Obter aulas de uma trilha
  getLessons: async (trailId) => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('trail_id', trailId)
        .order('order_index');
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Obter quizzes de uma aula
  getQuizzes: async (lessonId) => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          quiz_options (*)
        `)
        .eq('lesson_id', lessonId);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Obter conquistas do usuário
  getUserAchievements: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements (*)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Obter itens da loja
  getStoreItems: async () => {
    try {
      const { data, error } = await supabase
        .from('store_items')
        .select('*')
        .eq('is_available', true)
        .order('price');
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Comprar item da loja
  purchaseItem: async (userId, itemId) => {
    try {
      const { data, error } = await supabase
        .from('user_purchases')
        .insert({
          user_id: userId,
          item_id: itemId,
          purchased_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Obter missões diárias
  getDailyMissions: async () => {
    try {
      const { data, error } = await supabase
        .from('daily_missions')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Obter progresso das missões do usuário
  getUserMissionProgress: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_daily_missions')
        .select(`
          *,
          daily_missions (*)
        `)
        .eq('user_id', userId)
        .gte('date', new Date().toISOString().split('T')[0]);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

// Função para verificar conexão
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('trails')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    return { success: true, message: 'Conexão com Supabase estabelecida com sucesso!' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default supabase;