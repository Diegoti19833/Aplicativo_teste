// Teste simulado da filtragem de trilhas por papel
// Este teste demonstra como a lógica de filtragem funciona sem depender do Supabase

// Dados simulados das trilhas (baseado nas trilhas criadas)
const mockTrails = [
  // Trilhas originais (compartilhadas)
  { id: 1, title: 'Atendimento', category: 'Geral', level: 1, duration: 60 },
  { id: 2, title: 'Vendas', category: 'Geral', level: 1, duration: 60 },
  { id: 3, title: 'Produtos Pet', category: 'Geral', level: 1, duration: 60 },
  { id: 4, title: 'Liderança', category: 'Geral', level: 1, duration: 60 },
  { id: 5, title: 'Gestão de Loja', category: 'Geral', level: 1, duration: 60 },
  { id: 6, title: 'Estoque', category: 'Geral', level: 1, duration: 60 },
  { id: 7, title: 'PDV', category: 'Geral', level: 1, duration: 60 },
  { id: 8, title: 'Fechamento', category: 'Geral', level: 1, duration: 60 },
  { id: 9, title: 'Relacionamento', category: 'Geral', level: 1, duration: 60 },
  
  // Trilhas específicas para funcionário
  { id: 10, title: 'Atendimento ao Cliente - Funcionário', category: 'Funcionário', level: 1, duration: 120 },
  { id: 11, title: 'Procedimentos Operacionais - Funcionário', category: 'Funcionário', level: 1, duration: 90 },
  
  // Trilhas específicas para gerente
  { id: 12, title: 'Liderança e Gestão - Gerente', category: 'Gerente', level: 2, duration: 150 },
  { id: 13, title: 'Gestão Financeira - Gerente', category: 'Gerente', level: 2, duration: 120 },
  
  // Trilhas específicas para caixa
  { id: 14, title: 'Operações de Caixa - Caixa', category: 'Caixa', level: 1, duration: 100 },
  { id: 15, title: 'Atendimento Rápido - Caixa', category: 'Caixa', level: 1, duration: 80 },
  
  // Trilhas compartilhadas
  { id: 16, title: 'Segurança e Compliance', category: 'Compartilhada', level: 1, duration: 60 },
  { id: 17, title: 'Cultura Organizacional', category: 'Compartilhada', level: 1, duration: 45 }
];

// Função de filtragem (mesma lógica implementada no hook)
const getTrailsByRole = (trails, userRole) => {
  if (!userRole) return trails;
  
  return trails.filter(trail => {
    // Verifica se a trilha é específica para o papel do usuário
    const trailTitle = trail.title.toLowerCase();
    
    // Trilhas específicas por papel
    if (userRole === 'funcionario') {
      return trailTitle.includes('funcionário') || 
             (!trailTitle.includes('gerente') && !trailTitle.includes('caixa') && 
              !trailTitle.includes('liderança') && !trailTitle.includes('gestão financeira') && 
              !trailTitle.includes('operações de caixa'));
    }
    
    if (userRole === 'gerente') {
      return trailTitle.includes('gerente') || trailTitle.includes('liderança') || 
             trailTitle.includes('gestão') ||
             (!trailTitle.includes('funcionário') && !trailTitle.includes('caixa') && 
              !trailTitle.includes('operações de caixa') && !trailTitle.includes('atendimento rápido'));
    }
    
    if (userRole === 'caixa') {
      return trailTitle.includes('caixa') || trailTitle.includes('pdv') || 
             trailTitle.includes('fechamento') ||
             (!trailTitle.includes('funcionário') && !trailTitle.includes('gerente') && 
              !trailTitle.includes('liderança') && !trailTitle.includes('gestão financeira'));
    }
    
    // Para admin ou outros papéis, mostra todas as trilhas
    if (userRole === 'admin') {
      return true;
    }
    
    // Trilhas compartilhadas (sem especificação de papel no título)
    return !trailTitle.includes('funcionário') && !trailTitle.includes('gerente') && 
           !trailTitle.includes('caixa') && !trailTitle.includes('liderança') && 
           !trailTitle.includes('gestão financeira') && !trailTitle.includes('operações de caixa');
  });
};

// Função de teste
function testTrailsFiltering() {
  console.log('🧪 Teste de Filtragem de Trilhas por Papel\n');
  console.log(`📚 Total de trilhas disponíveis: ${mockTrails.length}\n`);
  
  const roles = ['funcionario', 'gerente', 'caixa', 'admin'];
  
  roles.forEach(role => {
    console.log(`👤 Testando para papel: ${role.toUpperCase()}`);
    console.log('─'.repeat(50));
    
    const filteredTrails = getTrailsByRole(mockTrails, role);
    console.log(`✅ Trilhas visíveis: ${filteredTrails.length}`);
    
    filteredTrails.forEach(trail => {
      console.log(`  • ${trail.title} (${trail.category})`);
    });
    
    console.log('');
  });
  
  // Teste específico para funcionário
  console.log('🎯 Verificação específica para FUNCIONÁRIO:');
  console.log('─'.repeat(50));
  
  const employeeTrails = getTrailsByRole(mockTrails, 'funcionario');
  
  // Trilhas que DEVEM aparecer para funcionário
  const shouldAppear = [
    'Atendimento ao Cliente - Funcionário',
    'Procedimentos Operacionais - Funcionário',
    'Atendimento',
    'Vendas',
    'Produtos Pet',
    'Estoque',
    'PDV',
    'Fechamento',
    'Relacionamento',
    'Segurança e Compliance',
    'Cultura Organizacional'
  ];
  
  // Trilhas que NÃO DEVEM aparecer para funcionário
  const shouldNotAppear = [
    'Liderança e Gestão - Gerente',
    'Gestão Financeira - Gerente',
    'Operações de Caixa - Caixa',
    'Atendimento Rápido - Caixa'
  ];
  
  console.log('✅ Trilhas que DEVEM aparecer:');
  shouldAppear.forEach(title => {
    const found = employeeTrails.find(trail => trail.title === title);
    console.log(`  ${found ? '✅' : '❌'} ${title}`);
  });
  
  console.log('\n🚫 Trilhas que NÃO DEVEM aparecer:');
  shouldNotAppear.forEach(title => {
    const found = employeeTrails.find(trail => trail.title === title);
    console.log(`  ${!found ? '✅' : '❌'} ${title} ${!found ? '(corretamente oculta)' : '(incorretamente visível)'}`);
  });
  
  console.log('\n🎉 Teste concluído!');
  console.log('\n📋 Resumo:');
  console.log(`• Funcionário pode ver ${employeeTrails.length} trilhas`);
  console.log(`• Inclui ${employeeTrails.filter(t => t.title.includes('Funcionário')).length} trilhas específicas para funcionário`);
  console.log(`• Inclui ${employeeTrails.filter(t => !t.title.includes('Funcionário') && !t.title.includes('Gerente') && !t.title.includes('Caixa')).length} trilhas compartilhadas`);
}

// Executar teste
testTrailsFiltering();