import { MealLog, MealType } from '@/types/nutrition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Coffee, Sun, Moon, Cookie, Trash2 } from 'lucide-react';

interface MealCardProps {
  mealType: MealType;
  meals: MealLog[];
  onAddClick: () => void;
  onDeleteMeal: (id: string) => void;
}

const mealIcons = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
};

const mealLabels = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};

export function MealCard({ mealType, meals, onAddClick, onDeleteMeal }: MealCardProps) {
  const Icon = mealIcons[mealType];
  const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{mealLabels[mealType]}</CardTitle>
            <p className="text-sm text-muted-foreground">{totalCalories} cal</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onAddClick}>
          <Plus className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        {meals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            No foods logged yet
          </p>
        ) : (
          <div className="space-y-2">
            {meals.map(meal => (
              <div
                key={meal.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {meal.food?.name || 'Unknown food'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {meal.servings}x · {meal.calories} cal
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right text-xs text-muted-foreground">
                    <span className="block">P: {Math.round(meal.protein)}g</span>
                    <span className="block">C: {Math.round(meal.carbs)}g · F: {Math.round(meal.fat)}g</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={() => onDeleteMeal(meal.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
