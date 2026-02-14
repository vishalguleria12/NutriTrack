import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserFavorite } from '@/types/nutrition';

export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async (): Promise<UserFavorite[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          *,
          food:foods(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as UserFavorite[];
    },
    enabled: !!user,
  });

  const addFavorite = useMutation({
    mutationFn: async (foodId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          food_id: foodId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (foodId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('food_id', foodId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
  });

  const isFavorite = (foodId: string): boolean => {
    return (query.data || []).some(fav => fav.food_id === foodId);
  };

  const toggleFavorite = async (foodId: string) => {
    if (isFavorite(foodId)) {
      await removeFavorite.mutateAsync(foodId);
    } else {
      await addFavorite.mutateAsync(foodId);
    }
  };

  return {
    favorites: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
  };
}
