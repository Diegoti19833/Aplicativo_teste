import { supabase } from './lib/supabase.js';

const lessonId = '650e8400-e29b-41d4-a716-446655440001';

const quizzes = [
  {
    lesson_id: lessonId,
    title: 'Quiz: Primeiros Passos',
    question: 'Qual é a primeira coisa que você deve fazer ao atender um cliente?',
    options: ["Perguntar o que ele quer", "Cumprimentar com cordialidade", "Mostrar os produtos", "Falar sobre promoções"],
    correct_answer: 1,
    explanation: 'Cumprimentar com cordialidade cria uma primeira impressão positiva e estabelece um ambiente acolhedor.',
    xp_reward: 25,
    difficulty_level: 1,
    order_index: 1
  },
  {
    lesson_id: lessonId,
    title: 'Quiz: Primeiros Passos',
    question: 'Como você deve se apresentar ao cliente?',
    options: ["Apenas dizer seu nome", "Nome e função na empresa", "Só cumprimentar", "Não precisa se apresentar"],
    correct_answer: 1,
    explanation: 'Apresentar-se com nome e função ajuda a criar confiança e profissionalismo no atendimento.',
    xp_reward: 25,
    difficulty_level: 1,
    order_index: 2
  },
  {
    lesson_id: lessonId,
    title: 'Quiz: Primeiros Passos',
    question: 'Qual a importância da linguagem corporal no atendimento?',
    options: ["Não é importante", "Importante apenas para vendas", "Fundamental para transmitir confiança", "Só importa a fala"],
    correct_answer: 2,
    explanation: 'A linguagem corporal representa mais de 50% da comunicação e é fundamental para transmitir confiança e profissionalismo.',
    xp_reward: 30,
    difficulty_level: 1,
    order_index: 3
  },
  {
    lesson_id: lessonId,
    title: 'Quiz: Primeiros Passos',
    question: 'O que fazer quando não souber responder uma pergunta do cliente?',
    options: ["Inventar uma resposta", "Ignorar a pergunta", "Admitir que não sabe e buscar ajuda", "Mudar de assunto"],
    correct_answer: 2,
    explanation: 'A honestidade e busca por informações corretas demonstra profissionalismo e gera confiança no cliente.',
    xp_reward: 25,
    difficulty_level: 1,
    order_index: 4
  }
];

async function insertQuizzes() {
  try {
    console.log('🚀 Inserindo quizzes para a aula:', lessonId);
    
    const { data, error } = await supabase
      .from('quizzes')
      .insert(quizzes);
    
    if (error) {
      console.error('❌ Erro ao inserir quizzes:', error);
    } else {
      console.log('✅ Quizzes inseridos com sucesso!');
      console.log('📊 Dados inseridos:', data);
    }
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

insertQuizzes();