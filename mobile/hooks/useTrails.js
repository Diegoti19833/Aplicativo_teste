import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const useTrails = () => {
  const { user } = useAuth();
  const [trails, setTrails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrails();
  }, [user]);

  const fetchTrails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 [useTrails] Iniciando busca de trilhas...');
      console.log('🔍 [useTrails] Usuário logado:', !!user, user?.email);

      // Buscar trilhas ativas
      const { data: trailsData, error: trailsError } = await supabase
        .from('trails')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      console.log('🔍 [useTrails] Resultado da busca:', { 
        trilhas: trailsData?.length || 0, 
        erro: trailsError?.message 
      });

      if (trailsError) throw trailsError;

      // Se usuário logado, filtrar trilhas por role e buscar progresso
      if (user) {
        // Primeiro, vamos verificar o role do usuário
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        console.log('🔍 [useTrails] Role do usuário:', userData?.role, userError?.message);
        
        const userRole = userData?.role;
        
        // Definir regras de acesso baseadas no título da trilha
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
        
        const allowedTrails = accessRules[userRole] || [];
        console.log('🔍 [useTrails] Trilhas permitidas para', userRole, ':', allowedTrails.length);
        
        // Filtrar trilhas que o usuário pode acessar
        const accessibleTrails = await Promise.all(
          trailsData.map(async (trail) => {
            const canAccess = allowedTrails.includes(trail.title);
            console.log('🔍 [useTrails] Verificando trilha:', trail.title, '→', canAccess);

            if (canAccess) {
              const { data: progressData } = await supabase
                .rpc('get_trail_progress', {
                  user_id_param: user.id,
                  trail_id_param: trail.id
                });

              return {
                ...trail,
                progress: progressData || { progress_percentage: 0, completed_lessons: 0, total_lessons: 0 }
              };
            }
            return null;
          })
        );

        // Filtrar trilhas nulas (que o usuário não pode acessar)
        const finalTrails = accessibleTrails.filter(trail => trail !== null);
        console.log('🔍 [useTrails] Trilhas acessíveis:', finalTrails.length);
        console.log('🔍 [useTrails] Títulos das trilhas:', finalTrails.map(t => t.title));
        setTrails(finalTrails);
      } else {
        const guestTrails = trailsData.map(trail => ({
          ...trail,
          progress: { progress_percentage: 0, completed_lessons: 0, total_lessons: 0 }
        }));
        console.log('🔍 [useTrails] Trilhas para visitante:', guestTrails.length);
        setTrails(guestTrails);
      }
    } catch (err) {
      console.error('Erro ao buscar trilhas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  return {
    trails,
    loading,
    error,
    refetch: fetchTrails,
    getTrailsByRole,
  };
};
