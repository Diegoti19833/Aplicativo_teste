import { supabase } from './lib/supabase.js';

async function createUserCanAccessTrailFunction() {
  try {
    console.log('🔧 Criando função user_can_access_trail...');
    
    // Como não podemos executar SQL diretamente, vamos implementar a lógica no JavaScript
    // e atualizar o hook useTrails para usar essa lógica
    
    console.log('💡 A função user_can_access_trail será implementada no JavaScript');
    console.log('📝 Atualizando o hook useTrails para usar lógica baseada no título...');
    
    // Definir as regras de acesso baseadas no título da trilha
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
        // Admin pode acessar todas as trilhas
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
    
    console.log('📋 Regras de acesso definidas:');
    Object.entries(accessRules).forEach(([role, trails]) => {
      console.log(`  ${role}: ${trails.length} trilhas`);
    });
    
    // Testar a lógica
    console.log('\\n🧪 Testando lógica de acesso...');
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .limit(1)
      .single();
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError.message);
      return;
    }
    
    const userRole = user.role;
    const allowedTrails = accessRules[userRole] || [];
    
    console.log(`👤 Usuário com role "${userRole}" pode acessar ${allowedTrails.length} trilhas:`);
    allowedTrails.forEach(trail => {
      console.log(`  - ${trail}`);
    });
    
    return accessRules;
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createUserCanAccessTrailFunction();