import supabase from './config/supabase.js';

// Função para simular a filtragem de trilhas por papel
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

async function testTrailsForEmployee() {
  try {
    console.log('🧪 Testando filtragem de trilhas para funcionário...\n');
    
    // Buscar todas as trilhas ativas
    const { data: trails, error } = await supabase
      .from('trails')
      .select('*')
      .eq('is_active', true)
      .order('order_index');
    
    if (error) {
      console.error('❌ Erro ao buscar trilhas:', error.message);
      return;
    }
    
    console.log(`📚 Total de trilhas ativas: ${trails.length}`);
    console.log('Todas as trilhas:');
    trails.forEach(trail => {
      console.log(`  - ${trail.title} (${trail.category || 'Sem categoria'})`);
    });
    
    console.log('\n🔍 Filtrando trilhas para funcionário...');
    
    // Filtrar trilhas para funcionário
    const employeeTrails = getTrailsByRole(trails, 'funcionario');
    
    console.log(`\n✅ Trilhas visíveis para funcionário: ${employeeTrails.length}`);
    employeeTrails.forEach(trail => {
      console.log(`  - ${trail.title} (${trail.category || 'Sem categoria'})`);
    });
    
    // Verificar se as trilhas específicas para funcionário estão sendo exibidas
    const expectedTrails = [
      'Atendimento ao Cliente - Funcionário',
      'Procedimentos Operacionais - Funcionário'
    ];
    
    console.log('\n🎯 Verificando trilhas específicas para funcionário...');
    expectedTrails.forEach(expectedTitle => {
      const found = employeeTrails.find(trail => trail.title === expectedTitle);
      if (found) {
        console.log(`  ✅ ${expectedTitle} - ENCONTRADA`);
      } else {
        console.log(`  ❌ ${expectedTitle} - NÃO ENCONTRADA`);
      }
    });
    
    // Verificar se trilhas de outros papéis não estão sendo exibidas
    const forbiddenTrails = [
      'Liderança e Gestão - Gerente',
      'Gestão Financeira - Gerente',
      'Operações de Caixa - Caixa',
      'Atendimento Rápido - Caixa'
    ];
    
    console.log('\n🚫 Verificando se trilhas de outros papéis estão ocultas...');
    forbiddenTrails.forEach(forbiddenTitle => {
      const found = employeeTrails.find(trail => trail.title === forbiddenTitle);
      if (!found) {
        console.log(`  ✅ ${forbiddenTitle} - CORRETAMENTE OCULTA`);
      } else {
        console.log(`  ❌ ${forbiddenTitle} - INCORRETAMENTE VISÍVEL`);
      }
    });
    
    console.log('\n🎉 Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testTrailsForEmployee();