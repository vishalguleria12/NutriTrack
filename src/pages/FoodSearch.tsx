import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useFoods } from '@/hooks/useFoods';
import { useFavorites } from '@/hooks/useFavorites';
import { useMealLogs } from '@/hooks/useMealLogs';
import { AppLayout } from '@/components/AppLayout';
import { CreateFoodDialog } from '@/components/CreateFoodDialog';
import { AddFoodDialog } from '@/components/AddFoodDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Food, MealType, FoodCategory } from '@/types/nutrition';
import { QuantityUnit } from '@/lib/nutritionCalculator';
import { Search, Star, Loader2, ArrowLeft, PlusCircle } from 'lucide-react';

const FOOD_CATEGORIES: { value: FoodCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'proteins', label: 'Proteins' },
  { value: 'grains', label: 'Grains' },
  { value: 'fruits', label: 'Fruits' },
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'fats', label: 'Fats' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'snacks', label: 'Snacks' },
];

export default function FoodSearch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const initialMealType = (searchParams.get('meal') as MealType) || 'lunch';
  const dateStr = searchParams.get('date') || undefined;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'all'>('all');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [showCreateFood, setShowCreateFood] = useState(false);

  const { foods, isLoading } = useFoods(
    searchQuery || undefined,
    selectedCategory !== 'all' ? selectedCategory : undefined
  );
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const { addMealLog } = useMealLogs();

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
  };

  const handleAddToMeal = async (data: {
    food: Food;
    quantity: number;
    unit: QuantityUnit;
    mealType: MealType;
    nutrition: { calories: number; protein: number; carbs: number; fat: number };
  }) => {
    setIsAddingMeal(true);
    
    try {
      // Convert to servings for storage (servings = quantity when unit is 'serving')
      const servingGrams = data.food.serving_grams || 100;
      const servings = data.unit === 'serving' 
        ? data.quantity 
        : data.quantity / servingGrams;

      await addMealLog.mutateAsync({
        food_id: data.food.id,
        meal_type: data.mealType,
        servings,
        ...data.nutrition,
        logged_date: dateStr,
      });

      toast({
        title: 'Food added!',
        description: `${data.food.name} added to ${data.mealType}`,
      });

      setSelectedFood(null);
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
    
    setIsAddingMeal(false);
  };

  const FoodItem = ({ food }: { food: Food }) => {
    const isFav = isFavorite(food.id);
    
    return (
      <div
        className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:bg-accent/50 cursor-pointer transition-colors"
        onClick={() => handleSelectFood(food)}
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{food.name}</p>
          <p className="text-sm text-muted-foreground">
            {food.calories_per_serving} cal · {food.serving_size}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right text-xs text-muted-foreground">
            <span className="block">P: {food.protein_grams}g</span>
            <span className="block">C: {food.carbs_grams}g · F: {food.fat_grams}g</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(food.id);
            }}
          >
            <Star className={`h-4 w-4 ${isFav ? 'fill-warning text-warning' : ''}`} />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Add Food</h1>
              <p className="text-sm text-muted-foreground">
                Search and add foods to your meal log
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateFood(true)}
            className="gap-1"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Create</span>
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search foods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {FOOD_CATEGORIES.map(cat => (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.value)}
                className="whitespace-nowrap"
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Food List */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All Foods</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-2 mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : foods.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No foods found matching your search' : 'No foods available'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              foods.map(food => <FoodItem key={food.id} food={food} />)
            )}
          </TabsContent>

          <TabsContent value="favorites" className="space-y-2 mt-4">
            {favorites.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-8 text-center">
                  <Star className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No favorites yet</p>
                  <p className="text-sm text-muted-foreground">
                    Star foods to add them to your favorites
                  </p>
                </CardContent>
              </Card>
            ) : (
              favorites.map(fav => fav.food && <FoodItem key={fav.id} food={fav.food} />)
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Food Dialog */}
      <AddFoodDialog
        food={selectedFood}
        initialMealType={initialMealType}
        isOpen={!!selectedFood}
        onClose={() => setSelectedFood(null)}
        onAdd={handleAddToMeal}
        isAdding={isAddingMeal}
      />

      {/* Create Food Dialog */}
      <CreateFoodDialog open={showCreateFood} onOpenChange={setShowCreateFood} />
    </AppLayout>
  );
}
