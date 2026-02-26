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

      // Buscar trilhas ativas
      const { data: trailsData, error: trailsError } = await supabase
        .from('trails')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      console.log('🔍 [useTrails] Resultado:', trailsData?.length || 0, 'trilhas');

      if (trailsError) throw trailsError;

      if (user) {
        // Buscar o role do usuário
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        const userRole = userData?.role;
        console.log('🔍 [useTrails] Role do usuário:', userRole);

        // Filtrar trilhas baseado em target_roles do banco
        const accessibleTrails = await Promise.all(
          trailsData.map(async (trail) => {
            const targetRoles = trail.target_roles || [];

            // Admin vê tudo
            // Se target_roles está vazio ou contém o role do usuário, permite acesso
            const canAccess = userRole === 'admin'
              || targetRoles.length === 0
              || targetRoles.includes(userRole);

            console.log('🔍 [useTrails]', trail.title, '→', canAccess, `(roles: ${targetRoles.join(',')})`);

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

        const finalTrails = accessibleTrails.filter(trail => trail !== null);
        console.log('🔍 [useTrails] Trilhas acessíveis:', finalTrails.length);
        setTrails(finalTrails);
      } else {
        const guestTrails = trailsData.map(trail => ({
          ...trail,
          progress: { progress_percentage: 0, completed_lessons: 0, total_lessons: 0 }
        }));
        setTrails(guestTrails);
      }
    } catch (err) {
      console.error('Erro ao buscar trilhas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    trails,
    loading,
    error,
    refetch: fetchTrails,
  };
};
