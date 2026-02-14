import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Profile, OnboardingData, calculateBMR, calculateTDEE, calculateCalorieTarget, calculateMacroTargets } from '@/types/nutrition';

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data as unknown as Profile;
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const completeOnboarding = useMutation({
    mutationFn: async (data: OnboardingData) => {
      if (!user) throw new Error('Not authenticated');

      // Convert to metric if imperial
      const weightKg = data.unit_system === 'imperial' 
        ? data.current_weight / 2.205 
        : data.current_weight;
      const heightCm = data.unit_system === 'imperial'
        ? data.height * 2.54
        : data.height;

      // Calculate targets using Mifflin-St Jeor + evidence-based macros
      const bmr = calculateBMR(weightKg, heightCm, data.age, data.gender);
      const tdee = calculateTDEE(bmr, data.activity_level);
      const calorieTarget = calculateCalorieTarget(tdee, data.goal_type);
      const macros = calculateMacroTargets(calorieTarget, data.goal_type, weightKg);

      const profileData = {
        name: data.name,
        age: data.age,
        gender: data.gender,
        current_weight: data.current_weight,
        height: data.height,
        target_weight: data.target_weight,
        goal_type: data.goal_type,
        activity_level: data.activity_level,
        unit_system: data.unit_system,
        daily_calorie_target: calorieTarget,
        daily_protein_target: macros.protein,
        daily_carbs_target: macros.carbs,
        daily_fat_target: macros.fat,
        onboarding_completed: true,
      };

      const { data: result, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const recalculateTargets = useMutation({
    mutationFn: async () => {
      if (!user || !query.data) throw new Error('Not authenticated or no profile');
      
      const profile = query.data;
      if (!profile.current_weight || !profile.height || !profile.age || !profile.gender) {
        throw new Error('Missing profile data');
      }

      // Convert to metric if imperial for accurate calculations
      const weightKg = profile.unit_system === 'imperial'
        ? profile.current_weight / 2.205
        : profile.current_weight;
      const heightCm = profile.unit_system === 'imperial'
        ? profile.height * 2.54
        : profile.height;

      const bmr = calculateBMR(weightKg, heightCm, profile.age, profile.gender);
      const tdee = calculateTDEE(bmr, profile.activity_level);
      const calorieTarget = calculateCalorieTarget(tdee, profile.goal_type);
      const macros = calculateMacroTargets(calorieTarget, profile.goal_type, weightKg);

      const { data, error } = await supabase
        .from('profiles')
        .update({
          daily_calorie_target: calorieTarget,
          daily_protein_target: macros.protein,
          daily_carbs_target: macros.carbs,
          daily_fat_target: macros.fat,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateProfile,
    completeOnboarding,
    recalculateTargets,
  };
}
