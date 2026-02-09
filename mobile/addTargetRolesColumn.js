import { supabase } from './lib/supabase.js';

async function addTargetRolesColumn() {
  try {
    console.log('🔧 Adicionando coluna target_roles à tabela trails...');
    
    // 1. Adicionar a coluna target_roles
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Adicionar campo para especificar quais grupos podem acessar cada trilha
        ALTER TABLE trails 
        ADD COLUMN IF NOT EXISTS target_roles TEXT[] DEFAULT ARRAY['funcionario', 'gerente', 'admin', 'caixa'];
        
        -- Adicionar campo para categoria da trilha
        ALTER TABLE trails 
        ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'geral';
      `
    });
    
    if (alterError) {
      console.error('❌ Erro ao adicionar colunas:', alterError.message);
      
      // Tentar uma abordagem alternativa usando SQL direto
      console.log('🔄 Tentando abordagem alternativa...');
      
      // Verificar se a coluna já existe
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'trails')
        .eq('column_name', 'target_roles');
      
      if (columnsError) {
        console.error('❌ Erro ao verificar colunas:', columnsError.message);
        return;
      }
      
      if (columns.length === 0) {
        console.log('❌ Coluna target_roles não existe e não foi possível criar via RPC');
        console.log('💡 Você precisa executar o script SQL manualmente no Supabase Dashboard');
        return;
      }
    }
    
    console.log('✅ Colunas adicionadas com sucesso!');
    
    // 2. Atualizar trilhas existentes com target_roles específicos
    console.log('🔧 Atualizando trilhas com target_roles específicos...');
    
    // Trilhas para funcionários
    const funcionarioTrails = [
      'Atendimento ao Cliente - Funcionário',
      'Procedimentos Operacionais - Funcionário',
      'Atendimento',
      'Produtos Pet',
      'Relacionamento'
    ];
    
    for (const trailTitle of funcionarioTrails) {
      const { error: updateError } = await supabase
        .from('trails')
        .update({ 
          target_roles: ['funcionario'],
          category: 'funcionario'
        })
        .eq('title', trailTitle);
      
      if (updateError) {
        console.error(`❌ Erro ao atualizar ${trailTitle}:`, updateError.message);
      } else {
        console.log(`✅ ${trailTitle} → funcionario`);
      }
    }
    
    // Trilhas para gerentes
    const gerenteTrails = [
      'Liderança e Gestão - Gerente',
      'Gestão Financeira - Gerente',
      'Liderança',
      'Gestão de Loja'
    ];
    
    for (const trailTitle of gerenteTrails) {
      const { error: updateError } = await supabase
        .from('trails')
        .update({ 
          target_roles: ['gerente', 'admin'],
          category: 'gerente'
        })
        .eq('title', trailTitle);
      
      if (updateError) {
        console.error(`❌ Erro ao atualizar ${trailTitle}:`, updateError.message);
      } else {
        console.log(`✅ ${trailTitle} → gerente, admin`);
      }
    }
    
    // Trilhas para caixa
    const caixaTrails = [
      'Operações de Caixa - Caixa',
      'Atendimento Rápido - Caixa',
      'PDV',
      'Fechamento'
    ];
    
    for (const trailTitle of caixaTrails) {
      const { error: updateError } = await supabase
        .from('trails')
        .update({ 
          target_roles: ['caixa'],
          category: 'caixa'
        })
        .eq('title', trailTitle);
      
      if (updateError) {
        console.error(`❌ Erro ao atualizar ${trailTitle}:`, updateError.message);
      } else {
        console.log(`✅ ${trailTitle} → caixa`);
      }
    }
    
    // Trilhas compartilhadas
    const sharedTrails = [
      'Vendas',
      'Estoque',
      'Segurança e Compliance',
      'Cultura Organizacional'
    ];
    
    for (const trailTitle of sharedTrails) {
      const { error: updateError } = await supabase
        .from('trails')
        .update({ 
          target_roles: ['funcionario', 'gerente', 'admin', 'caixa'],
          category: 'geral'
        })
        .eq('title', trailTitle);
      
      if (updateError) {
        console.error(`❌ Erro ao atualizar ${trailTitle}:`, updateError.message);
      } else {
        console.log(`✅ ${trailTitle} → todos`);
      }
    }
    
    console.log('🎉 Atualização concluída!');
    
    // 3. Verificar resultado
    console.log('\\n📋 Verificando resultado...');
    const { data: updatedTrails, error: checkError } = await supabase
      .from('trails')
      .select('title, target_roles, category')
      .order('order_index');
    
    if (checkError) {
      console.error('❌ Erro ao verificar resultado:', checkError.message);
      return;
    }
    
    updatedTrails.forEach(trail => {
      console.log(`  - ${trail.title}: ${JSON.stringify(trail.target_roles)} (${trail.category})`);
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

addTargetRolesColumn();