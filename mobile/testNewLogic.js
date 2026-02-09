import { supabase } from './lib/supabase.js';

async function testNewLogic() {
  console.log('🔍 Testando nova lógica de filtragem...');
  
  // Buscar todas as trilhas
  const { data: trails, error: trailsError } = await supabase
    .from('trails')
    .select('*')
    .eq('is_active', true)
    .order('order_index');

  if (trailsError) {
    console.error('❌ Erro ao buscar trilhas:', trailsError.message);
    return;
  }

  console.log(`📚 Total de trilhas encontradas: ${trails.length}`);
  
  // Definir regras de acesso baseadas no título da trilha
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

  // Testar para cada role
  for (const [role, allowedTrails] of Object.entries(accessRules)) {
    console.log(`\n👤 Testando para role: ${role}`);
    console.log(`📋 Trilhas permitidas: ${allowedTrails.length}`);
    
    const accessibleTrails = trails.filter(trail => allowedTrails.includes(trail.title));
    
    console.log(`✅ Trilhas acessíveis: ${accessibleTrails.length}`);
    console.log('📝 Títulos das trilhas acessíveis:');
    accessibleTrails.forEach(trail => {
      console.log(`   - ${trail.title}`);
    });
    
    console.log('❌ Trilhas não encontradas nas regras:');
    trails.forEach(trail => {
      if (!allowedTrails.includes(trail.title)) {
        console.log(`   - ${trail.title}`);
      }
    });
  }
  
  console.log('\n📊 Resumo de todas as trilhas no banco:');
  trails.forEach((trail, index) => {
    console.log(`${index + 1}. ${trail.title}`);
  });
}

testNewLogic().catch(console.error);