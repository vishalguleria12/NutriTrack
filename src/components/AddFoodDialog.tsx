import { useState, useEffect, useMemo } from 'react';
import { Food, MealType } from '@/types/nutrition';
import { 
  calculateNutrition, 
  getCalculationBreakdown, 
  getAvailableUnits, 
  getDefaultUnit,
  QuantityUnit,
  isLiquid,
} from '@/lib/nutritionCalculator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Check, Loader2, Plus, Minus, ChevronDown, Calculator, Info } from 'lucide-react';

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

interface AddFoodDialogProps {
  food: Food | null;
  initialMealType: MealType;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    food: Food;
    quantity: number;
    unit: QuantityUnit;
    mealType: MealType;
    nutrition: { calories: number; protein: number; carbs: number; fat: number };
  }) => void;
  isAdding: boolean;
}

export function AddFoodDialog({ 
  food, 
  initialMealType, 
  isOpen, 
  onClose, 
  onAdd,
  isAdding,
}: AddFoodDialogProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<QuantityUnit>('serving');
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Reset state when food changes
  useEffect(() => {
    if (food) {
      const defaultUnit = getDefaultUnit(food.category);
      setUnit(defaultUnit);
      setQuantity(defaultUnit === 'serving' ? 1 : food.serving_grams || 100);
      setMealType(initialMealType);
    }
  }, [food, initialMealType]);

  // Calculate nutrition based on current inputs
  const nutrition = useMemo(() => {
    if (!food) return null;
    return calculateNutrition(food, quantity, unit);
  }, [food, quantity, unit]);

  // Get calculation breakdown for transparency
  const breakdown = useMemo(() => {
    if (!food) return null;
    return getCalculationBreakdown(food, quantity, unit);
  }, [food, quantity, unit]);

  // Get available units for this food
  const availableUnits = useMemo(() => {
    if (!food) return [];
    return getAvailableUnits(food.category);
  }, [food]);

  const handleQuantityChange = (value: string) => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      setQuantity(parsed);
    } else if (value === '') {
      setQuantity(0);
    }
  };

  const handleQuantityStep = (delta: number) => {
    const step = unit === 'serving' ? 0.5 : 10;
    const newValue = Math.max(0, quantity + (delta * step));
    setQuantity(unit === 'serving' ? newValue : Math.round(newValue));
  };

  const handleUnitChange = (newUnit: QuantityUnit) => {
    if (!food) return;
    
    // Convert quantity to appropriate value for new unit
    const servingGrams = food.serving_grams || 100;
    
    if (unit === 'serving' && (newUnit === 'g' || newUnit === 'ml')) {
      // Converting from servings to g/ml
      setQuantity(Math.round(quantity * servingGrams));
    } else if ((unit === 'g' || unit === 'ml') && newUnit === 'serving') {
      // Converting from g/ml to servings
      setQuantity(Math.round((quantity / servingGrams) * 10) / 10);
    }
    // g to ml or ml to g: keep the same value
    
    setUnit(newUnit);
  };

  const handleAdd = () => {
    if (!food || !nutrition) return;
    onAdd({
      food,
      quantity,
      unit,
      mealType,
      nutrition: {
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
      },
    });
  };

  if (!food || !nutrition) return null;

  const baseUnit = isLiquid(food.category) ? 'ml' : 'g';

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{food.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Serving Size Info */}
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm">
            <Info className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">
              1 serving = <span className="font-medium text-foreground">{food.serving_grams}{baseUnit}</span>
              {food.serving_size !== `${food.serving_grams}g` && (
                <span className="text-muted-foreground"> ({food.serving_size})</span>
              )}
            </span>
          </div>

          {/* Nutrition Display */}
          <div className="grid grid-cols-4 gap-2 p-3 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{nutrition.calories}</p>
              <p className="text-xs text-muted-foreground">Calories</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-chart-protein">{nutrition.protein}g</p>
              <p className="text-xs text-muted-foreground">Protein</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-chart-carbs">{nutrition.carbs}g</p>
              <p className="text-xs text-muted-foreground">Carbs</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-chart-fats">{nutrition.fat}g</p>
              <p className="text-xs text-muted-foreground">Fat</p>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label>Quantity</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityStep(-1)}
                disabled={quantity <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="text-center w-24"
                step={unit === 'serving' ? 0.5 : 1}
                min={0}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityStep(1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Unit Selection */}
          <div className="space-y-2">
            <Label>Unit</Label>
            <Select value={unit} onValueChange={(v) => handleUnitChange(v as QuantityUnit)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableUnits.map((u) => (
                  <SelectItem key={u.value} value={u.value}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Meal Type */}
          <div className="space-y-2">
            <Label>Add to</Label>
            <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map((meal) => (
                  <SelectItem key={meal.value} value={meal.value}>
                    {meal.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Calculation Breakdown (Collapsible) */}
          {breakdown && (
            <Collapsible open={showBreakdown} onOpenChange={setShowBreakdown}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center">
                <Calculator className="h-4 w-4" />
                <span>Show calculation</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3 p-3 bg-muted/30 rounded-lg space-y-2 text-xs font-mono">
                  <p className="text-muted-foreground">
                    Per {breakdown.baseAmount}{breakdown.baseUnit}:
                  </p>
                  <div className="pl-2 border-l-2 border-border space-y-1">
                    <p>Calories: {breakdown.perBaseNutrition.calories}</p>
                    <p>Protein: {breakdown.perBaseNutrition.protein}g</p>
                    <p>Carbs: {breakdown.perBaseNutrition.carbs}g</p>
                    <p>Fat: {breakdown.perBaseNutrition.fat}g</p>
                  </div>
                  <p className="text-muted-foreground pt-1">
                    Multiplier: ×{breakdown.multiplier}
                  </p>
                  <div className="pt-1 border-t border-border">
                    <p className="text-foreground font-semibold">
                      Final: {nutrition.displayQuantity}
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={isAdding || quantity <= 0}>
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Add to Meal
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
