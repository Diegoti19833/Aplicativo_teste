import { supabase } from './lib/supabase.js';

const lessonId = '650e8400-e29b-41d4-a716-446655440001';

async function checkQuizzes() {
  try {
    console.log('🔍 Verificando quizzes para a aula:', lessonId);
    
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order_index');
    
    if (error) {
      console.error('❌ Erro ao buscar quizzes:', error);
    } else {
      console.log('✅ Quizzes encontrados:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('📋 Lista de quizzes:');
        data.forEach((quiz, index) => {
          console.log(`${index + 1}. ${quiz.question}`);
          console.log(`   Opções: ${JSON.stringify(quiz.options)}`);
          console.log(`   Resposta correta: ${quiz.correct_answer}`);
          console.log('');
        });
      }
    }
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

checkQuizzes();