// Script para criar trilhas específicas por grupo usando a API do Supabase
import { supabase } from './lib/supabase.js';

async function createRoleBasedTrails() {
  console.log('🚀 Criando trilhas específicas por grupo...');
  
  try {
    // Primeiro, vamos verificar se já existem trilhas específicas
    const { data: existingTrails, error: checkError } = await supabase
      .from('trails')
      .select('id, title')
      .or('title.ilike.%Funcionário%,title.ilike.%Gerente%,title.ilike.%Caixa%');
    
    if (checkError) {
      console.error('❌ Erro ao verificar trilhas existentes:', checkError);
      return;
    }
    
    if (existingTrails && existingTrails.length > 0) {
      console.log('✅ Trilhas específicas já existem:', existingTrails.map(t => t.title));
      return;
    }
    
    console.log('📝 Criando novas trilhas específicas por grupo...');
    
    // Trilhas para Funcionários
    const trailsToCreate = [
      {
        title: 'Atendimento ao Cliente - Funcionário',
        description: 'Aprenda as melhores práticas de atendimento ao cliente, comunicação efetiva e resolução de problemas básicos.',
        icon_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        color: '#10B981',
        difficulty_level: 1,
        estimated_duration: 120,
        order_index: 100,
        is_active: true
      },
      {
        title: 'Procedimentos Operacionais - Funcionário',
        description: 'Domine os procedimentos operacionais essenciais para o dia a dia de trabalho.',
        icon_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        color: '#3B82F6',
        difficulty_level: 1,
        estimated_duration: 90,
        order_index: 101,
        is_active: true
      },
      // Trilhas para Gerentes
      {
        title: 'Liderança e Gestão - Gerente',
        description: 'Desenvolva habilidades de liderança, gestão de pessoas e tomada de decisões estratégicas.',
        icon_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        color: '#8B5CF6',
        difficulty_level: 2,
        estimated_duration: 150,
        order_index: 200,
        is_active: true
      },
      {
        title: 'Gestão Financeira - Gerente',
        description: 'Aprenda a analisar indicadores financeiros, controlar custos e otimizar resultados.',
        icon_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        color: '#F59E0B',
        difficulty_level: 2,
        estimated_duration: 120,
        order_index: 201,
        is_active: true
      },
      // Trilhas para Caixas
      {
        title: 'Operações de Caixa - Caixa',
        description: 'Domine todas as operações de caixa, formas de pagamento e procedimentos de segurança.',
        icon_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        color: '#EF4444',
        difficulty_level: 1,
        estimated_duration: 100,
        order_index: 300,
        is_active: true
      },
      {
        title: 'Atendimento Rápido - Caixa',
        description: 'Aprenda técnicas para agilizar o atendimento mantendo a qualidade e cortesia.',
        icon_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        color: '#06B6D4',
        difficulty_level: 1,
        estimated_duration: 80,
        order_index: 301,
        is_active: true
      },
      // Trilhas Compartilhadas
      {
        title: 'Segurança e Compliance',
        description: 'Conheça as normas de segurança, compliance e boas práticas corporativas.',
        icon_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        color: '#DC2626',
        difficulty_level: 1,
        estimated_duration: 60,
        order_index: 400,
        is_active: true
      },
      {
        title: 'Cultura Organizacional',
        description: 'Entenda a missão, visão, valores e cultura da empresa.',
        icon_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        color: '#7C3AED',
        difficulty_level: 1,
        estimated_duration: 45,
        order_index: 401,
        is_active: true
      }
    ];
    
    // Inserir trilhas uma por uma
    const createdTrails = [];
    for (const trail of trailsToCreate) {
      console.log(`📚 Criando trilha: ${trail.title}...`);
      
      const { data, error } = await supabase
        .from('trails')
        .insert([trail])
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Erro ao criar trilha ${trail.title}:`, error);
      } else {
        console.log(`✅ Trilha criada: ${trail.title}`);
        createdTrails.push(data);
      }
    }
    
    console.log(`\n🎉 ${createdTrails.length} trilhas criadas com sucesso!`);
    
    // Verificar trilhas criadas
    const { data: allTrails, error: allError } = await supabase
      .from('trails')
      .select('id, title, difficulty_level, estimated_duration')
      .eq('is_active', true)
      .order('order_index');
    
    if (allError) {
      console.error('❌ Erro ao verificar trilhas:', allError);
    } else {
      console.log(`\n📊 Total de trilhas ativas: ${allTrails.length}`);
      allTrails.forEach(trail => {
        console.log(`  - ${trail.title} (Nível ${trail.difficulty_level}, ${trail.estimated_duration}min)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar criação das trilhas
createRoleBasedTrails();