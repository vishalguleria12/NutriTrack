import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFoods } from '@/hooks/useFoods';
import { useToast } from '@/hooks/use-toast';
import { FoodCategory } from '@/types/nutrition';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';

const FOOD_CATEGORIES: { value: FoodCategory; label: string }[] = [
  { value: 'proteins', label: 'Proteins' },
  { value: 'grains', label: 'Grains' },
  { value: 'fruits', label: 'Fruits' },
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'fats', label: 'Fats & Oils' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'custom', label: 'Custom' },
];

const createFoodSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  category: z.enum(['fruits', 'vegetables', 'proteins', 'grains', 'dairy', 'fats', 'beverages', 'snacks', 'custom'] as const),
  serving_size: z.string().trim().min(1, 'Serving size is required').max(50, 'Serving size is too long'),
  serving_grams: z.number().min(1, 'Must be at least 1g').max(2000, 'Value too large'),
  calories_per_serving: z.number().min(0, 'Cannot be negative').max(5000, 'Value too large'),
  protein_grams: z.number().min(0, 'Cannot be negative').max(500, 'Value too large'),
  carbs_grams: z.number().min(0, 'Cannot be negative').max(500, 'Value too large'),
  fat_grams: z.number().min(0, 'Cannot be negative').max(500, 'Value too large'),
});

type CreateFoodFormData = z.infer<typeof createFoodSchema>;

interface CreateFoodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFoodDialog({ open, onOpenChange }: CreateFoodDialogProps) {
  const { toast } = useToast();
  const { addFood } = useFoods();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateFoodFormData>({
    resolver: zodResolver(createFoodSchema),
    defaultValues: {
      name: '',
      category: 'custom',
      serving_size: '100g',
      serving_grams: 100,
      calories_per_serving: 0,
      protein_grams: 0,
      carbs_grams: 0,
      fat_grams: 0,
    },
  });

  const onSubmit = async (data: CreateFoodFormData) => {
    setIsSubmitting(true);
    try {
      await addFood.mutateAsync({
        name: data.name,
        category: data.category,
        serving_size: data.serving_size,
        serving_grams: data.serving_grams,
        calories_per_serving: data.calories_per_serving,
        protein_grams: data.protein_grams,
        carbs_grams: data.carbs_grams,
        fat_grams: data.fat_grams,
      });
      toast({
        title: 'Food created!',
        description: `${data.name} has been added to your foods.`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create food',
        variant: 'destructive',
      });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Create Custom Food
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Food Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Homemade Kheer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FOOD_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="serving_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serving Size</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 1 cup" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serving_grams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grams per Serving</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="100"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="calories_per_serving"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calories per Serving</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="protein_grams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protein (g)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="carbs_grams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carbs (g)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fat_grams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fat (g)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <p>💡 Tip: Check the nutrition label on the product packaging for accurate values.</p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Create Food'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
