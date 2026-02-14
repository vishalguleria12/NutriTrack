export type GoalType = 'lose' | 'maintain' | 'gain';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
export type Gender = 'male' | 'female' | 'other';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type FoodCategory = 'fruits' | 'vegetables' | 'proteins' | 'grains' | 'dairy' | 'fats' | 'beverages' | 'snacks' | 'custom';

export interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  age: number | null;
  gender: Gender | null;
  current_weight: number | null;
  height: number | null;
  target_weight: number | null;
  goal_type: GoalType;
  activity_level: ActivityLevel;
  daily_calorie_target: number | null;
  daily_protein_target: number | null;
  daily_carbs_target: number | null;
  daily_fat_target: number | null;
  unit_system: 'metric' | 'imperial';
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  calories_per_serving: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
  serving_size: string;
  serving_grams: number;
  is_system_food: boolean;
  created_by: string | null;
  created_at: string;
}

export interface MealLog {
  id: string;
  user_id: string;
  food_id: string;
  meal_type: MealType;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_date: string;
  created_at: string;
  food?: Food;
}

export interface WeightLog {
  id: string;
  user_id: string;
  weight: number;
  logged_date: string;
  notes: string | null;
  created_at: string;
}

export interface UserFavorite {
  id: string;
  user_id: string;
  food_id: string;
  created_at: string;
  food?: Food;
}

export interface DailyNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface OnboardingData {
  name: string;
  age: number;
  gender: Gender;
  current_weight: number;
  height: number;
  target_weight: number;
  goal_type: GoalType;
  activity_level: ActivityLevel;
  unit_system: 'metric' | 'imperial';
}

// Calculate BMR using Mifflin-St Jeor Equation (most accurate for modern populations)
export function calculateBMR(
  weight: number, // kg
  height: number, // cm
  age: number,
  gender: Gender
): number {
  // Mifflin-St Jeor: 10 × weight(kg) + 6.25 × height(cm) − 5 × age(years) + s
  // where s = +5 for males, −161 for females
  const base = 10 * weight + 6.25 * height - 5 * age;
  if (gender === 'male') {
    return base + 5;
  } else {
    return base - 161;
  }
}

// Activity level multipliers (standard Katch-McArdle multipliers)
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,        // Little or no exercise
  lightly_active: 1.375, // Light exercise 1-3 days/week
  moderately_active: 1.55, // Moderate exercise 3-5 days/week
  very_active: 1.725,    // Hard exercise 6-7 days/week
  extra_active: 1.9,     // Very hard exercise & physical job
};

// Calculate TDEE (Total Daily Energy Expenditure)
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

// Calculate daily calorie target based on goal
// Uses percentage-based adjustment for sustainable results
export function calculateCalorieTarget(tdee: number, goalType: GoalType): number {
  switch (goalType) {
    case 'lose':
      // 20% deficit (safe range: 15-25%)
      return Math.round(tdee * 0.80);
    case 'gain':
      // 10% surplus (safe range: 5-15% for lean gains)
      return Math.round(tdee * 1.10);
    case 'maintain':
    default:
      return Math.round(tdee);
  }
}

// Calculate macro targets based on body weight and goal (evidence-based approach)
// Protein: 1.6-2.2g/kg (higher during fat loss for muscle preservation)
// Fat: 20-30% of calories (essential for hormones)
// Carbs: remaining calories
export function calculateMacroTargets(
  calorieTarget: number, 
  goalType: GoalType,
  weightKg?: number
) {
  // Default weight if not provided (fallback for backward compatibility)
  const weight = weightKg || 70;
  
  let proteinPerKg: number;
  let fatPercent: number;

  switch (goalType) {
    case 'lose':
      // Higher protein (2.0-2.2g/kg) during deficit to preserve muscle
      proteinPerKg = 2.0;
      // Moderate fat for satiety and hormones
      fatPercent = 0.25;
      break;
    case 'gain':
      // Moderate-high protein (1.8-2.0g/kg) for muscle synthesis
      proteinPerKg = 1.8;
      // Moderate fat
      fatPercent = 0.25;
      break;
    case 'maintain':
    default:
      // Standard protein (1.6-1.8g/kg)
      proteinPerKg = 1.6;
      // Standard fat
      fatPercent = 0.25;
  }

  // Calculate protein (grams) based on body weight
  const protein = Math.round(weight * proteinPerKg);
  const proteinCalories = protein * 4;

  // Calculate fat (grams) based on percentage of total calories
  const fatCalories = calorieTarget * fatPercent;
  const fat = Math.round(fatCalories / 9);

  // Remaining calories go to carbs
  const carbCalories = calorieTarget - proteinCalories - (fat * 9);
  const carbs = Math.round(Math.max(0, carbCalories) / 4);

  // Verify total matches (adjust carbs if needed due to rounding)
  const totalCalories = (protein * 4) + (carbs * 4) + (fat * 9);
  
  return {
    protein,
    carbs,
    fat,
    // Include calculated values for transparency
    _calculatedCalories: totalCalories,
    _proteinPerKg: proteinPerKg,
    _fatPercent: fatPercent,
  };
}

// Convert weight between units
export function convertWeight(value: number, from: 'kg' | 'lbs', to: 'kg' | 'lbs'): number {
  if (from === to) return value;
  if (from === 'kg' && to === 'lbs') return Math.round(value * 2.205 * 10) / 10;
  return Math.round(value / 2.205 * 10) / 10;
}

// Convert height between units
export function convertHeight(value: number, from: 'cm' | 'ft', to: 'cm' | 'ft'): number {
  if (from === to) return value;
  if (from === 'cm' && to === 'ft') return Math.round(value / 30.48 * 10) / 10;
  return Math.round(value * 30.48 * 10) / 10;
}
