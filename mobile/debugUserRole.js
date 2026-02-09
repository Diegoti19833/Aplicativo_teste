import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase (usando as mesmas do lib/supabase.js)
const SUPABASE_URL = 'https://wnpkmkqtqjqjqjqjqjqj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducGtta3F0cWpxampxampxampxaiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM0NTU5NzI0LCJleHAiOjIwNTAxMzU3MjR9.example';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugUserRole() {
  try {
    console.log('🔍 Verificando role do usuário...');
    
    // 1. Verificar usuário atual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Erro ao buscar usuário:', authError.message);
      return;
    }
    
    if (!user) {
      console.log('❌ Usuário não está logado');
      return;
    }
    
    console.log('✅ Usuário logado:', user.email);
    
    // 2. Verificar dados do usuário na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .eq('id', user.id)
      .single();
    
    if (userError) {
      console.error('❌ Erro ao buscar dados do usuário:', userError.message);
      return;
    }
    
    console.log('👤 Dados do usuário:', userData);
    
    // 3. Verificar uma trilha específica
    const { data: trailData, error: trailError } = await supabase
      .from('trails')
      .select('id, title, target_roles')
      .eq('title', 'Atendimento ao Cliente para Funcionários')
      .single();
    
    if (trailError) {
      console.error('❌ Erro ao buscar trilha:', trailError.message);
      return;
    }
    
    console.log('🛤️ Trilha encontrada:', trailData);
    
    // 4. Testar função user_can_access_trail
    const { data: canAccess, error: accessError } = await supabase
      .rpc('user_can_access_trail', {
        p_user_id: user.id,
        p_trail_id: trailData.id
      });
    
    if (accessError) {
      console.error('❌ Erro na função user_can_access_trail:', accessError.message);
      return;
    }
    
    console.log('🔐 Pode acessar trilha:', canAccess);
    
    // 5. Verificar manualmente se o role está na lista
    const userRole = userData.role;
    const trailRoles = trailData.target_roles;
    const shouldHaveAccess = trailRoles && trailRoles.includes(userRole);
    
    console.log('🔍 Verificação manual:');
    console.log('  - Role do usuário:', userRole);
    console.log('  - Roles da trilha:', trailRoles);
    console.log('  - Deveria ter acesso:', shouldHaveAccess);
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

debugUserRole();