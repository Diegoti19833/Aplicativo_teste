import { supabase } from './lib/supabase.js';

async function testUserCanAccessTrail() {
  try {
    console.log('🧪 Testando função user_can_access_trail...');
    
    // 1. Buscar o usuário
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role');
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }
    
    const user = users[0];
    console.log('👤 Usuário:', user);
    
    // 2. Buscar uma trilha específica para funcionários
    const { data: trail, error: trailError } = await supabase
      .from('trails')
      .select('id, title, target_roles')
      .eq('title', 'Atendimento ao Cliente para Funcionários')
      .single();
    
    if (trailError) {
      console.error('❌ Erro ao buscar trilha:', trailError.message);
      return;
    }
    
    console.log('🛤️ Trilha:', trail);
    
    // 3. Testar a função user_can_access_trail
    console.log('🔍 Testando user_can_access_trail...');
    const { data: canAccess, error: accessError } = await supabase
      .rpc('user_can_access_trail', {
        p_user_id: user.id,
        p_trail_id: trail.id
      });
    
    if (accessError) {
      console.error('❌ Erro na função user_can_access_trail:', accessError.message);
      return;
    }
    
    console.log('🔐 Resultado da função:', canAccess);
    
    // 4. Verificação manual
    const userRole = user.role;
    const trailRoles = trail.target_roles;
    const shouldHaveAccess = trailRoles && trailRoles.includes(userRole);
    
    console.log('🔍 Verificação manual:');
    console.log('  - Role do usuário:', userRole);
    console.log('  - Roles da trilha:', trailRoles);
    console.log('  - Array includes funcionario:', trailRoles?.includes('funcionario'));
    console.log('  - Deveria ter acesso:', shouldHaveAccess);
    
    // 5. Testar com outras trilhas
    console.log('\\n🔍 Testando com todas as trilhas...');
    const { data: allTrails, error: allTrailsError } = await supabase
      .from('trails')
      .select('id, title, target_roles')
      .limit(5);
    
    if (allTrailsError) {
      console.error('❌ Erro ao buscar todas as trilhas:', allTrailsError.message);
      return;
    }
    
    for (const testTrail of allTrails) {
      const { data: testCanAccess, error: testAccessError } = await supabase
        .rpc('user_can_access_trail', {
          p_user_id: user.id,
          p_trail_id: testTrail.id
        });
      
      console.log(`  - ${testTrail.title}:`);
      console.log(`    Roles: ${JSON.stringify(testTrail.target_roles)}`);
      console.log(`    Pode acessar: ${testCanAccess}`);
      console.log(`    Erro: ${testAccessError?.message || 'nenhum'}`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testUserCanAccessTrail();