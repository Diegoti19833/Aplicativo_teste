import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const useUserData = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setUserData(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      // Se não há dados do usuário, criar um registro inicial
      if (!data) {
        const newUserData = {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email.split('@')[0],
          role: 'funcionario', // role padrão
          xp_total: 0,
          level: 1,
          streak_days: 0,
          last_activity_date: new Date().toISOString().split('T')[0]
        };

        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert(newUserData)
          .select()
          .single();

        if (createError) throw createError;
        setUserData(createdUser);
      } else {
        setUserData(data);
      }
    } catch (err) {
      console.error('Erro ao buscar dados do usuário:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUserData = async (updates) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUserData(data);
      return { success: true, data };
    } catch (err) {
      console.error('Erro ao atualizar dados do usuário:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    userData,
    loading,
    error,
    refetch: fetchUserData,
    updateUserData,
  };
};
