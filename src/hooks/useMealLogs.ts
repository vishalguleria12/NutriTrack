import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MealLog, MealType, DailyNutrition } from '@/types/nutrition';
import { format } from 'date-fns';

export function useMealLogs(date?: Date) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const dateStr = date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

  const query = useQuery({
    queryKey: ['meal_logs', user?.id, dateStr],
    queryFn: async (): Promise<MealLog[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('meal_logs')
        .select(`
          *,
          food:foods(*)
        `)
        .eq('user_id', user.id)
        .eq('logged_date', dateStr)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as MealLog[];
    },
    enabled: !!user,
  });

  const addMealLog = useMutation({
    mutationFn: async (log: {
      food_id: string;
      meal_type: MealType;
      servings: number;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      logged_date?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('meal_logs')
        .insert({
          user_id: user.id,
          ...log,
          logged_date: log.logged_date || dateStr,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal_logs', user?.id] });
    },
  });

  const updateMealLog = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MealLog> & { id: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('meal_logs')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal_logs', user?.id] });
    },
  });

  const deleteMealLog = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('meal_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal_logs', user?.id] });
    },
  });

  // Calculate daily totals
  const dailyTotals: DailyNutrition = (query.data || []).reduce(
    (acc, log) => ({
      calories: acc.calories + (log.calories || 0),
      protein: acc.protein + (log.protein || 0),
      carbs: acc.carbs + (log.carbs || 0),
      fat: acc.fat + (log.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Group logs by meal type
  const mealsByType = {
    breakfast: (query.data || []).filter(log => log.meal_type === 'breakfast'),
    lunch: (query.data || []).filter(log => log.meal_type === 'lunch'),
    dinner: (query.data || []).filter(log => log.meal_type === 'dinner'),
    snack: (query.data || []).filter(log => log.meal_type === 'snack'),
  };

  return {
    mealLogs: query.data || [],
    mealsByType,
    dailyTotals,
    isLoading: query.isLoading,
    error: query.error,
    addMealLog,
    updateMealLog,
    deleteMealLog,
  };
}
