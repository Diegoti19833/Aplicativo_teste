// Script de teste para verificar as funções de trilhas
import { supabase } from './lib/supabase.js';

async function testTrailsFunctions() {
  console.log('🧪 Testando funções de trilhas...');
  
  try {
    // 1. Testar se as trilhas existem
    console.log('\n1. Verificando trilhas no banco...');
    const { data: trails, error: trailsError } = await supabase
      .from('trails')
      .select('id, title, target_roles, category')
      .eq('is_active', true);
    
    if (trailsError) {
      console.error('❌ Erro ao buscar trilhas:', trailsError);
      return;
    }
    
    console.log(`✅ Encontradas ${trails.length} trilhas:`);
    trails.forEach(trail => {
      console.log(`  - ${trail.title} (roles: ${trail.target_roles?.join(', ') || 'N/A'})`);
    });
    
    // 2. Testar função user_can_access_trail
    console.log('\n2. Testando função user_can_access_trail...');
    
    // Buscar um usuário funcionário
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'funcionario')
      .limit(1);
    
    if (usersError || !users.length) {
      console.error('❌ Erro ao buscar usuário funcionário:', usersError);
      return;
    }
    
    const user = users[0];
    console.log(`👤 Testando com usuário: ${user.email} (role: ${user.role})`);
    
    // Testar acesso para cada trilha
    for (const trail of trails) {
      const { data: canAccess, error: accessError } = await supabase
        .rpc('user_can_access_trail', {
          p_user_id: user.id,
          p_trail_id: trail.id
        });
      
      if (accessError) {
        console.error(`❌ Erro ao testar acesso à trilha ${trail.title}:`, accessError);
      } else {
        console.log(`${canAccess ? '✅' : '❌'} ${trail.title}: ${canAccess ? 'PODE' : 'NÃO PODE'} acessar`);
      }
    }
    
    // 3. Testar função get_trail_progress
    console.log('\n3. Testando função get_trail_progress...');
    
    if (trails.length > 0) {
      const { data: progress, error: progressError } = await supabase
        .rpc('get_trail_progress', {
          user_id_param: user.id,
          trail_id_param: trails[0].id
        });
      
      if (progressError) {
        console.error('❌ Erro ao buscar progresso:', progressError);
      } else {
        console.log('✅ Progresso da trilha:', progress);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testTrailsFunctions();