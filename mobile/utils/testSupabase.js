import { supabase, testConnection } from '../lib/supabase';

// Função para testar a conexão com Supabase
export const runSupabaseTests = async () => {
  console.log('🔄 Testando conexão com Supabase...');
  
  try {
    // Teste 1: Verificar conexão básica
    const connectionTest = await testConnection();
    if (connectionTest.success) {
      console.log('✅ Conexão com Supabase estabelecida com sucesso!');
    } else {
      console.error('❌ Erro na conexão:', connectionTest.error);
      return false;
    }

    // Teste 2: Verificar se as tabelas existem
    console.log('🔄 Verificando estrutura do banco...');
    
    const tables = ['users', 'trails', 'lessons', 'quizzes'];
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.error(`❌ Erro ao acessar tabela ${table}:`, error.message);
        } else {
          console.log(`✅ Tabela ${table} acessível`);
        }
      } catch (err) {
        console.error(`❌ Erro ao verificar tabela ${table}:`, err.message);
      }
    }

    // Teste 3: Verificar funções RPC
    console.log('🔄 Verificando funções do banco...');
    
    try {
      // Teste da função get_weekly_ranking
      const { data, error } = await supabase.rpc('get_weekly_ranking', {
        limit_param: 1
      });
      
      if (error) {
        console.error('❌ Erro ao testar função get_weekly_ranking:', error.message);
      } else {
        console.log('✅ Função get_weekly_ranking funcionando');
      }
    } catch (err) {
      console.error('❌ Erro ao testar funções RPC:', err.message);
    }

    console.log('🎉 Testes do Supabase concluídos!');
    return true;

  } catch (error) {
    console.error('❌ Erro geral nos testes:', error.message);
    return false;
  }
};

// Função para testar autenticação
export const testAuth = async (email, password) => {
  console.log('🔄 Testando autenticação...');
  
  try {
    // Tentar fazer login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Erro na autenticação:', error.message);
      return false;
    }

    console.log('✅ Autenticação bem-sucedida!');
    console.log('👤 Usuário:', data.user.email);
    
    return true;
  } catch (error) {
    console.error('❌ Erro no teste de autenticação:', error.message);
    return false;
  }
};

// Função para verificar configuração
export const checkConfiguration = () => {
  console.log('🔄 Verificando configuração...');
  
  const config = {
    url: supabase.supabaseUrl,
    key: supabase.supabaseKey ? '***configurada***' : 'não configurada',
  };
  
  console.log('📋 Configuração atual:');
  console.log('   URL:', config.url);
  console.log('   Key:', config.key);
  
  if (config.url.includes('YOUR_SUPABASE_URL')) {
    console.warn('⚠️  URL do Supabase não configurada!');
    return false;
  }
  
  if (!supabase.supabaseKey || supabase.supabaseKey.includes('YOUR_SUPABASE_ANON_KEY')) {
    console.warn('⚠️  Chave do Supabase não configurada!');
    return false;
  }
  
  console.log('✅ Configuração válida!');
  return true;
};

export default {
  runSupabaseTests,
  testAuth,
  checkConfiguration,
};