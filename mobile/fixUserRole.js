import { supabase } from './lib/supabase.js';

async function fixUserRole() {
  try {
    console.log('🔧 Verificando e corrigindo role do usuário...');
    
    // 1. Buscar todos os usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role');
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }
    
    console.log('👥 Usuários encontrados:', users.length);
    users.forEach(user => {
      console.log(`  - ${user.email}: role = "${user.role}"`);
    });
    
    // 2. Encontrar usuários sem role ou com role null
    const usersWithoutRole = users.filter(user => !user.role || user.role === null);
    
    if (usersWithoutRole.length === 0) {
      console.log('✅ Todos os usuários já têm role definido!');
      return;
    }
    
    console.log(`🔧 Encontrados ${usersWithoutRole.length} usuários sem role. Definindo como "funcionario"...`);
    
    // 3. Atualizar usuários sem role para "funcionario"
    for (const user of usersWithoutRole) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'funcionario' })
        .eq('id', user.id);
      
      if (updateError) {
        console.error(`❌ Erro ao atualizar ${user.email}:`, updateError.message);
      } else {
        console.log(`✅ ${user.email} agora tem role "funcionario"`);
      }
    }
    
    // 4. Verificar resultado final
    const { data: updatedUsers, error: finalError } = await supabase
      .from('users')
      .select('id, email, role');
    
    if (finalError) {
      console.error('❌ Erro ao verificar resultado:', finalError.message);
      return;
    }
    
    console.log('🎉 Resultado final:');
    updatedUsers.forEach(user => {
      console.log(`  - ${user.email}: role = "${user.role}"`);
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixUserRole();