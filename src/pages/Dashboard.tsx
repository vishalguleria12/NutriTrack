import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useProfile } from '@/hooks/useProfile';
import { useMealLogs } from '@/hooks/useMealLogs';
import { AppLayout } from '@/components/AppLayout';
import { CircularProgress } from '@/components/CircularProgress';
import { MacroCard } from '@/components/MacroCard';
import { MealCard } from '@/components/MealCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MealType } from '@/types/nutrition';
import { CalendarDays, ChevronLeft, ChevronRight, Flame, Plus, Scale, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { profile } = useProfile();
  const { mealsByType, dailyTotals, deleteMealLog } = useMealLogs(selectedDate);
  const navigate = useNavigate();
  const { toast } = useToast();

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  
  const calorieTarget = profile?.daily_calorie_target || 2000;
  const proteinTarget = profile?.daily_protein_target || 150;
  const carbsTarget = profile?.daily_carbs_target || 225;
  const fatTarget = profile?.daily_fat_target || 67;

  const caloriesRemaining = calorieTarget - dailyTotals.calories;
  const caloriePercentage = Math.round((dailyTotals.calories / calorieTarget) * 100);

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    if (!isToday) {
      const next = new Date(selectedDate);
      next.setDate(next.getDate() + 1);
      setSelectedDate(next);
    }
  };

  const handleAddMeal = (mealType: MealType) => {
    navigate(`/food-search?meal=${mealType}&date=${format(selectedDate, 'yyyy-MM-dd')}`);
  };

  const handleDeleteMeal = async (id: string) => {
    try {
      await deleteMealLog.mutateAsync(id);
      toast({ title: 'Food removed' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Hello, {profile?.name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-muted-foreground">Track your nutrition today</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/weight')}
          >
            <Scale className="h-5 w-5" />
          </Button>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" size="icon" onClick={handlePrevDay}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 text-center">
            <CalendarDays className="h-5 w-5 text-primary" />
            <span className="font-medium">
              {isToday ? 'Today' : format(selectedDate, 'EEE, MMM d')}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleNextDay} disabled={isToday}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Calorie Summary */}
        <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CircularProgress
                  value={dailyTotals.calories}
                  max={calorieTarget}
                  size={160}
                  strokeWidth={12}
                  showOverage
                >
                  <div className="text-center">
                    <Flame className="h-6 w-6 text-primary mx-auto mb-1" />
                    <span className="text-3xl font-bold text-foreground">
                      {dailyTotals.calories}
                    </span>
                    <p className="text-sm text-muted-foreground">
                      / {calorieTarget} cal
                    </p>
                  </div>
                </CircularProgress>
              </div>
              <div className="flex-1 space-y-3">
                <div className="text-center p-3 rounded-lg bg-card border border-border/50">
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className={`text-2xl font-bold ${caloriesRemaining < 0 ? 'text-destructive' : 'text-success'}`}>
                    {caloriesRemaining > 0 ? caloriesRemaining : Math.abs(caloriesRemaining)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {caloriesRemaining < 0 ? 'over' : 'to go'}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-card border border-border/50">
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-lg font-bold text-primary">{caloriePercentage}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Macro Breakdown */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Macronutrients
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <MacroCard
              label="Protein"
              value={dailyTotals.protein}
              target={proteinTarget}
              color="protein"
            />
            <MacroCard
              label="Carbs"
              value={dailyTotals.carbs}
              target={carbsTarget}
              color="carbs"
            />
            <MacroCard
              label="Fats"
              value={dailyTotals.fat}
              target={fatTarget}
              color="fats"
            />
          </div>
        </div>

        {/* Today's Meals */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Today's Meals</h2>
            <Button size="sm" onClick={() => navigate('/food-search')}>
              <Plus className="h-4 w-4 mr-1" />
              Add Food
            </Button>
          </div>
          <div className="space-y-3">
            <MealCard
              mealType="breakfast"
              meals={mealsByType.breakfast}
              onAddClick={() => handleAddMeal('breakfast')}
              onDeleteMeal={handleDeleteMeal}
            />
            <MealCard
              mealType="lunch"
              meals={mealsByType.lunch}
              onAddClick={() => handleAddMeal('lunch')}
              onDeleteMeal={handleDeleteMeal}
            />
            <MealCard
              mealType="dinner"
              meals={mealsByType.dinner}
              onAddClick={() => handleAddMeal('dinner')}
              onDeleteMeal={handleDeleteMeal}
            />
            <MealCard
              mealType="snack"
              meals={mealsByType.snack}
              onAddClick={() => handleAddMeal('snack')}
              onDeleteMeal={handleDeleteMeal}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
