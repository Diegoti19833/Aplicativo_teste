import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useAnalytics() {
    const [loading, setLoading] = useState(false);
    const [analytics, setAnalytics] = useState(null);

    const fetchAnalytics = useCallback(async (days = 7) => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase.rpc('get_manager_analytics', {
                p_manager_id: user.id,
                p_days: days
            });

            if (error) throw error;
            setAnalytics(data);
        } catch (e) {
            console.error('Error fetching analytics:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        analytics,
        fetchAnalytics
    };
}
