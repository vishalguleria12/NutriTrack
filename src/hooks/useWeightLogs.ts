import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { WeightLog } from '@/types/nutrition';
import { format, subDays } from 'date-fns';

export function useWeightLogs(days: number = 30) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

  const query = useQuery({
    queryKey: ['weight_logs', user?.id, days],
    queryFn: async (): Promise<WeightLog[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_date', startDate)
        .order('logged_date', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as WeightLog[];
    },
    enabled: !!user,
  });

  const addWeightLog = useMutation({
    mutationFn: async (log: { weight: number; logged_date?: string; notes?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('weight_logs')
        .upsert({
          user_id: user.id,
          weight: log.weight,
          logged_date: log.logged_date || format(new Date(), 'yyyy-MM-dd'),
          notes: log.notes || null,
        }, {
          onConflict: 'user_id,logged_date',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight_logs', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const deleteWeightLog = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('weight_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight_logs', user?.id] });
    },
  });

  // Calculate progress stats
  const latestWeight = query.data?.length ? query.data[query.data.length - 1]?.weight : null;
  const firstWeight = query.data?.length ? query.data[0]?.weight : null;
  const weightChange = latestWeight && firstWeight ? latestWeight - firstWeight : null;

  return {
    weightLogs: query.data || [],
    latestWeight,
    weightChange,
    isLoading: query.isLoading,
    error: query.error,
    addWeightLog,
    deleteWeightLog,
  };
}
