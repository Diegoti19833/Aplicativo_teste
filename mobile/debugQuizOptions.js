import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ijbdkochrgafvpicpncc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqYmRrb2NocmdhZnZwaWNwbmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MTA0NTcsImV4cCI6MjA3NTk4NjQ1N30.AmbW_h7YD2C-9UedfRb-cvRtDF1ypjdBhYwGi-hxUso';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugQuizOptions() {
  const lessonId = '650e8400-e29b-41d4-a716-446655440001';
  
  console.log('🔍 Debugando opções dos quizzes...');
  
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
      quizzes.forEach((quiz, index) => {
        console.log(`\n📝 Quiz ${index + 1}:`);
        console.log(`  Pergunta: ${quiz.question}`);
        console.log(`  Opções (tipo): ${typeof quiz.options}`);
        console.log(`  Opções (valor):`, quiz.options);
        console.log(`  É array?`, Array.isArray(quiz.options));
        
        if (typeof quiz.options === 'string') {
          console.log(`  Primeiro caractere: "${quiz.options[0]}"`);
          console.log(`  Últimos 10 caracteres: "${quiz.options.slice(-10)}"`);
        }
      });
    }
    
  } catch (err) {
    console.error('💥 Erro inesperado:', err);
  }
}

debugQuizOptions();