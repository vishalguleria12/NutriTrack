import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Food, FoodCategory } from '@/types/nutrition';

export function useFoods(searchQuery?: string, category?: FoodCategory) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['foods', searchQuery, category],
    queryFn: async (): Promise<Food[]> => {
      let queryBuilder = supabase
        .from('foods')
        .select('*')
        .order('name', { ascending: true });

      if (searchQuery) {
        queryBuilder = queryBuilder.ilike('name', `%${searchQuery}%`);
      }

      if (category) {
        queryBuilder = queryBuilder.eq('category', category);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      return (data || []) as unknown as Food[];
    },
  });

  const addFood = useMutation({
    mutationFn: async (food: Omit<Food, 'id' | 'created_at' | 'is_system_food' | 'created_by'>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('foods')
        .insert({
          ...food,
          created_by: user.id,
          is_system_food: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods'] });
    },
  });

  const updateFood = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Food> & { id: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('foods')
        .update(updates)
        .eq('id', id)
        .eq('created_by', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods'] });
    },
  });

  const deleteFood = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('foods')
        .delete()
        .eq('id', id)
        .eq('created_by', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods'] });
    },
  });

  return {
    foods: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    addFood,
    updateFood,
    deleteFood,
  };
}
