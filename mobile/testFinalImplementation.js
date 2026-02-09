import { supabase } from './lib/supabase.js';

async function testFinalImplementation() {
  console.log('🎯 Teste Final da Implementação de Filtragem de Trilhas');
  console.log('=' .repeat(60));
  
  try {
    // 1. Verificar se o usuário está logado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ Usuário não está logado');
      return;
    }
    
    console.log('✅ Usuário logado:', user.email);
    
    // 2. Buscar o role do usuário
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (roleError) {
      console.log('❌ Erro ao buscar role do usuário:', roleError.message);
      return;
    }
    
    console.log('👤 Role do usuário:', userData.role);
    
    // 3. Buscar todas as trilhas
    const { data: trails, error: trailsError } = await supabase
      .from('trails')
      .select('*')
      .eq('is_active', true)
      .order('order_index');
    
    if (trailsError) {
      console.log('❌ Erro ao buscar trilhas:', trailsError.message);
      return;
    }
    
    console.log('📚 Total de trilhas no banco:', trails.length);
    
    // 4. Aplicar a lógica de filtragem
    const accessRules = {
      funcionario: [
        'Atendimento ao Cliente - Funcionário',
        'Procedimentos Operacionais - Funcionário', 
        'Atendimento',
        'Produtos Pet',
        'Relacionamento',
        'Vendas',
        'Estoque',
        'Segurança e Compliance',
        'Cultura Organizacional'
      ],
      gerente: [
        'Liderança e Gestão - Gerente',
        'Gestão Financeira - Gerente',
        'Liderança',
        'Gestão de Loja',
        'Vendas',
        'Estoque', 
        'Segurança e Compliance',
        'Cultura Organizacional'
      ],
      caixa: [
        'Operações de Caixa - Caixa',
        'Atendimento Rápido - Caixa',
        'PDV',
        'Fechamento',
        'Vendas',
        'Estoque',
        'Segurança e Compliance', 
        'Cultura Organizacional'
      ],
      admin: [
        'Atendimento ao Cliente - Funcionário',
        'Procedimentos Operacionais - Funcionário',
        'Liderança e Gestão - Gerente', 
        'Gestão Financeira - Gerente',
        'Operações de Caixa - Caixa',
        'Atendimento Rápido - Caixa',
        'Atendimento',
        'Vendas',
        'Produtos Pet',
        'Liderança',
        'Gestão de Loja',
        'Estoque',
        'PDV',
        'Fechamento',
        'Relacionamento',
        'Segurança e Compliance',
        'Cultura Organizacional'
      ]
    };
    
    const userRole = userData.role;
    const allowedTrails = accessRules[userRole] || [];
    
    console.log('📋 Trilhas permitidas para', userRole + ':', allowedTrails.length);
    
    // 5. Filtrar trilhas acessíveis
    const accessibleTrails = trails.filter(trail => allowedTrails.includes(trail.title));
    
    console.log('✅ Trilhas acessíveis:', accessibleTrails.length);
    
    // 6. Mostrar resultado detalhado
    console.log('\n📝 Trilhas que o usuário pode acessar:');
    accessibleTrails.forEach((trail, index) => {
      console.log(`   ${index + 1}. ${trail.title}`);
    });
    
    // 7. Verificar se há trilhas não acessíveis
    const inaccessibleTrails = trails.filter(trail => !allowedTrails.includes(trail.title));
    
    if (inaccessibleTrails.length > 0) {
      console.log('\n🚫 Trilhas não acessíveis:');
      inaccessibleTrails.forEach((trail, index) => {
        console.log(`   ${index + 1}. ${trail.title}`);
      });
    }
    
    // 8. Resultado final
    console.log('\n' + '=' .repeat(60));
    console.log('🎯 RESULTADO FINAL:');
    console.log(`   Usuário: ${user.email}`);
    console.log(`   Role: ${userRole}`);
    console.log(`   Trilhas totais: ${trails.length}`);
    console.log(`   Trilhas acessíveis: ${accessibleTrails.length}`);
    console.log(`   Filtragem: ${accessibleTrails.length > 0 ? '✅ FUNCIONANDO' : '❌ FALHOU'}`);
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testFinalImplementation().catch(console.error);