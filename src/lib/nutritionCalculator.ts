import { Food } from '@/types/nutrition';

export type QuantityUnit = 'g' | 'ml' | 'serving';

export interface NutritionResult {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  displayQuantity: string;
}

export interface CalculationBreakdown {
  baseAmount: number;
  baseUnit: 'g' | 'ml';
  perBaseNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  multiplier: number;
  finalNutrition: NutritionResult;
}

/**
 * Calculate nutrition values based on quantity and unit type.
 * Uses per-serving data as base, then scales proportionally.
 * 
 * Calculation rules:
 * - All foods are stored with nutrition per serving_grams (typically 100g)
 * - Grams/ml: (quantity / serving_grams) * nutrition_per_serving
 * - Servings: quantity * nutrition_per_serving
 * 
 * Rounding is deferred until final output to maintain accuracy.
 */
export function calculateNutrition(
  food: Food,
  quantity: number,
  unit: QuantityUnit
): NutritionResult {
  // Food stores nutrition for the amount in serving_grams (e.g., 100g = X calories)
  const servingGrams = food.serving_grams || 100;
  
  let multiplier: number;
  let displayQuantity: string;
  
  switch (unit) {
    case 'g':
      // Grams: scale based on serving_grams
      multiplier = quantity / servingGrams;
      displayQuantity = `${quantity}g`;
      break;
    case 'ml':
      // Milliliters: treat same as grams (1ml ≈ 1g for most foods)
      multiplier = quantity / servingGrams;
      displayQuantity = `${quantity}ml`;
      break;
    case 'serving':
      // Servings: each serving = serving_grams
      multiplier = quantity;
      displayQuantity = `${quantity} ${quantity === 1 ? 'serving' : 'servings'} (${Math.round(quantity * servingGrams)}${isLiquid(food.category) ? 'ml' : 'g'})`;
      break;
    default:
      multiplier = quantity;
      displayQuantity = `${quantity} servings`;
  }
  
  // Calculate with full precision, round only at the end
  const rawCalories = food.calories_per_serving * multiplier;
  const rawProtein = food.protein_grams * multiplier;
  const rawCarbs = food.carbs_grams * multiplier;
  const rawFat = food.fat_grams * multiplier;
  
  return {
    calories: Math.round(rawCalories),
    protein: roundToDecimal(rawProtein, 1),
    carbs: roundToDecimal(rawCarbs, 1),
    fat: roundToDecimal(rawFat, 1),
    displayQuantity,
  };
}

/**
 * Get detailed calculation breakdown for transparency
 */
export function getCalculationBreakdown(
  food: Food,
  quantity: number,
  unit: QuantityUnit
): CalculationBreakdown {
  const servingGrams = food.serving_grams || 100;
  const baseUnit: 'g' | 'ml' = isLiquid(food.category) ? 'ml' : 'g';
  
  // Per 100g/ml nutrition
  const per100 = {
    calories: (food.calories_per_serving / servingGrams) * 100,
    protein: (food.protein_grams / servingGrams) * 100,
    carbs: (food.carbs_grams / servingGrams) * 100,
    fat: (food.fat_grams / servingGrams) * 100,
  };
  
  let multiplier: number;
  switch (unit) {
    case 'g':
    case 'ml':
      multiplier = quantity / servingGrams;
      break;
    case 'serving':
    default:
      multiplier = quantity;
  }
  
  const finalNutrition = calculateNutrition(food, quantity, unit);
  
  return {
    baseAmount: 100,
    baseUnit,
    perBaseNutrition: {
      calories: roundToDecimal(per100.calories, 1),
      protein: roundToDecimal(per100.protein, 1),
      carbs: roundToDecimal(per100.carbs, 1),
      fat: roundToDecimal(per100.fat, 1),
    },
    multiplier: roundToDecimal(multiplier, 2),
    finalNutrition,
  };
}

/**
 * Check if a food category is typically a liquid
 */
export function isLiquid(category: string): boolean {
  return category === 'beverages';
}

/**
 * Get the default unit for a food based on its category
 */
export function getDefaultUnit(category: string): QuantityUnit {
  if (isLiquid(category)) {
    return 'ml';
  }
  return 'serving';
}

/**
 * Get available units for a food
 */
export function getAvailableUnits(category: string): { value: QuantityUnit; label: string }[] {
  const baseUnits: { value: QuantityUnit; label: string }[] = [
    { value: 'serving', label: 'Servings' },
  ];
  
  if (isLiquid(category)) {
    baseUnits.push({ value: 'ml', label: 'Milliliters (ml)' });
    baseUnits.push({ value: 'g', label: 'Grams (g)' });
  } else {
    baseUnits.push({ value: 'g', label: 'Grams (g)' });
    baseUnits.push({ value: 'ml', label: 'Milliliters (ml)' });
  }
  
  return baseUnits;
}

/**
 * Validate that macros approximately match calories
 * (protein: 4cal/g, carbs: 4cal/g, fat: 9cal/g)
 */
export function validateMacroCalorieMatch(
  calories: number,
  protein: number,
  carbs: number,
  fat: number
): { isValid: boolean; calculatedCalories: number; difference: number } {
  const calculatedCalories = (protein * 4) + (carbs * 4) + (fat * 9);
  const difference = Math.abs(calories - calculatedCalories);
  // Allow 5% tolerance for rounding
  const tolerance = calories * 0.05;
  
  return {
    isValid: difference <= tolerance || difference <= 5,
    calculatedCalories: Math.round(calculatedCalories),
    difference: Math.round(difference),
  };
}

/**
 * Round to specified decimal places
 */
function roundToDecimal(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Convert servings to equivalent grams
 */
export function servingsToGrams(servings: number, servingGrams: number): number {
  return servings * servingGrams;
}

/**
 * Convert grams to equivalent servings
 */
export function gramsToServings(grams: number, servingGrams: number): number {
  return grams / servingGrams;
}
