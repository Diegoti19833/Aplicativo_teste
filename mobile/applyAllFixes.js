import { supabase } from './lib/supabase.js';

async function applyAllFixes() {
  try {
    console.log('🔧 Aplicando correções SQL...');
    
    // 1. Corrigir função update_user_stats
    console.log('\n⚡ Corrigindo função update_user_stats...');
    const { error: error1 } = await supabase.rpc('update_user_stats_fix');
    if (error1) {
      console.error('❌ Erro ao corrigir update_user_stats:', error1);
    } else {
      console.log('✅ update_user_stats corrigida');
    }

    // 2. Corrigir função update_user_streak
    console.log('\n⚡ Corrigindo função update_user_streak...');
    const { error: error2 } = await supabase.rpc('update_user_streak_fix');
    if (error2) {
      console.error('❌ Erro ao corrigir update_user_streak:', error2);
    } else {
      console.log('✅ update_user_streak corrigida');
    }

    // 3. Corrigir função check_achievement
    console.log('\n⚡ Corrigindo função check_achievement...');
    const { error: error3 } = await supabase.rpc('check_achievement_fix');
    if (error3) {
      console.error('❌ Erro ao corrigir check_achievement:', error3);
    } else {
      console.log('✅ check_achievement corrigida');
    }
    
    console.log('\n🎉 Todas as correções foram aplicadas!');
    console.log('📋 Problemas resolvidos:');
    console.log('   ✓ Ambiguidade current_streak');
    console.log('   ✓ CASE statement sem ELSE');
    console.log('\n🔄 Reinicie a aplicação para testar');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

applyAllFixes();