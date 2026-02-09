import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const useDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchDashboard();
    } else {
      setDashboardData(null);
      setLoading(false);
    }
  }, [user]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar dados completos do dashboard
      const { data, error } = await supabase
        .rpc('get_user_dashboard', {
          user_id_param: user.id
        });

      if (error) throw error;

      setDashboardData(data);
    } catch (err) {
      console.error('Erro ao buscar dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    dashboardData,
    loading,
    error,
    refetch: fetchDashboard,
  };
};