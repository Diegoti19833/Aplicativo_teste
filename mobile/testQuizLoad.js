import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ijbdkochrgafvpicpncc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqYmRrb2NocmdhZnZwaWNwbmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MTA0NTcsImV4cCI6MjA3NTk4NjQ1N30.AmbW_h7YD2C-9UedfRb-cvRtDF1ypjdBhYwGi-hxUso';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuizLoad() {
  const lessonId = '650e8400-e29b-41d4-a716-446655440001';
  
  console.log('🔍 Testando carregamento de quizzes...');
  console.log('📚 Lesson ID:', lessonId);
  
  try {
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('lesson_id', lessonId);
    
    if (error) {
      console.error('❌ Erro ao buscar quizzes:', error);
      return;
    }
    
    console.log('✅ Quizzes encontrados:', quizzes?.length || 0);
    
    if (quizzes && quizzes.length > 0) {
      console.log('📝 Detalhes dos quizzes:');
      quizzes.forEach((quiz, index) => {
        console.log(`  ${index + 1}. ${quiz.question}`);
        console.log(`     Opções: ${quiz.options}`);
        console.log(`     Resposta correta: ${quiz.correct_answer}`);
        console.log(`     XP: ${quiz.xp_reward}`);
        console.log('');
      });
    }
    
  } catch (err) {
    console.error('💥 Erro inesperado:', err);
  }
}

testQuizLoad();