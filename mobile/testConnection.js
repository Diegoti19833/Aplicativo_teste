// Teste simples de conexão com Supabase
import { supabase, testConnection } from './lib/supabase.js';

console.log('🔄 Iniciando teste de conexão com Supabase...');

// Função principal de teste
async function runTest() {
  try {
    // Teste básico de conexão
    console.log('📡 Testando conexão básica...');
    const result = await testConnection();
    
    if (result.success) {
      console.log('✅ Conexão estabelecida com sucesso!');
      console.log('🎉 Supabase configurado corretamente!');
    } else {
      console.error('❌ Erro na conexão:', result.error);
    }

    // Verificar configuração
    console.log('\n📋 Configuração atual:');
    console.log('URL:', supabase.supabaseUrl);
    console.log('Key configurada:', supabase.supabaseKey ? 'Sim' : 'Não');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar teste
runTest();