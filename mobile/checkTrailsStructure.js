import { supabase } from './lib/supabase.js';

async function checkTrailsStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela trails...');
    
    // 1. Buscar uma trilha para ver as colunas disponíveis
    const { data: trails, error: trailsError } = await supabase
      .from('trails')
      .select('*')
      .limit(1);
    
    if (trailsError) {
      console.error('❌ Erro ao buscar trilhas:', trailsError.message);
      return;
    }
    
    if (trails.length === 0) {
      console.log('❌ Nenhuma trilha encontrada');
      return;
    }
    
    const trail = trails[0];
    console.log('📋 Colunas disponíveis na tabela trails:');
    Object.keys(trail).forEach(column => {
      console.log(`  - ${column}: ${typeof trail[column]} = ${JSON.stringify(trail[column])}`);
    });
    
    // 2. Buscar todas as trilhas para ver os dados
    console.log('\\n🛤️ Todas as trilhas:');
    const { data: allTrails, error: allTrailsError } = await supabase
      .from('trails')
      .select('id, title, description')
      .order('order_index');
    
    if (allTrailsError) {
      console.error('❌ Erro ao buscar todas as trilhas:', allTrailsError.message);
      return;
    }
    
    allTrails.forEach((trail, index) => {
      console.log(`  ${index + 1}. ${trail.title}`);
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkTrailsStructure();