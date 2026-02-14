import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, Calculator } from 'lucide-react';
import { useState } from 'react';
import { Profile, Gender, ActivityLevel, GoalType } from '@/types/nutrition';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, { multiplier: number; label: string }> = {
  sedentary: { multiplier: 1.2, label: 'Sedentary (little/no exercise)' },
  lightly_active: { multiplier: 1.375, label: 'Lightly Active (1-3 days/week)' },
  moderately_active: { multiplier: 1.55, label: 'Moderately Active (3-5 days/week)' },
  very_active: { multiplier: 1.725, label: 'Very Active (6-7 days/week)' },
  extra_active: { multiplier: 1.9, label: 'Extra Active (very hard exercise)' },
};

const GOAL_ADJUSTMENTS: Record<GoalType, { multiplier: number; label: string }> = {
  lose: { multiplier: 0.80, label: 'Fat Loss (-20% deficit)' },
  maintain: { multiplier: 1.0, label: 'Maintenance (no adjustment)' },
  gain: { multiplier: 1.10, label: 'Muscle Gain (+10% surplus)' },
};

const PROTEIN_PER_KG: Record<GoalType, number> = {
  lose: 2.0,
  maintain: 1.6,
  gain: 1.8,
};

interface CalculationBreakdownProps {
  profile: Profile | null;
}

export function CalculationBreakdown({ profile }: CalculationBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!profile?.current_weight || !profile?.height || !profile?.age || !profile?.gender) {
    return null;
  }

  // Convert to metric if needed
  const weightKg = profile.unit_system === 'imperial' 
    ? profile.current_weight / 2.205 
    : profile.current_weight;
  const heightCm = profile.unit_system === 'imperial' 
    ? profile.height * 2.54 
    : profile.height;

  // Calculate BMR using Mifflin-St Jeor
  const genderOffset = profile.gender === 'male' ? 5 : -161;
  const bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * profile.age + genderOffset);

  // Calculate TDEE
  const activityLevel = profile.activity_level || 'moderately_active';
  const activityData = ACTIVITY_MULTIPLIERS[activityLevel];
  const tdee = Math.round(bmr * activityData.multiplier);

  // Calculate calorie target
  const goalType = profile.goal_type || 'maintain';
  const goalData = GOAL_ADJUSTMENTS[goalType];
  const calorieTarget = Math.round(tdee * goalData.multiplier);

  // Calculate macros
  const proteinPerKg = PROTEIN_PER_KG[goalType];
  const protein = Math.round(weightKg * proteinPerKg);
  const proteinCal = protein * 4;

  const fatCal = Math.round(calorieTarget * 0.25);
  const fat = Math.round(fatCal / 9);

  const carbsCal = calorieTarget - proteinCal - (fat * 9);
  const carbs = Math.round(Math.max(0, carbsCal) / 4);

  const totalCal = proteinCal + (carbs * 4) + (fat * 9);

  return (
    <Card className="border-border/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Calculation Breakdown
            </CardTitle>
            <ChevronDown 
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`} 
            />
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4 text-sm">
            {/* Step 1: BMR */}
            <div className="space-y-1">
              <p className="font-medium text-foreground">Step 1: Basal Metabolic Rate (BMR)</p>
              <p className="text-muted-foreground text-xs">Mifflin-St Jeor Equation</p>
              <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs space-y-1">
                <p>(10 × {weightKg.toFixed(1)}kg) + (6.25 × {heightCm.toFixed(0)}cm) - (5 × {profile.age}) {genderOffset >= 0 ? '+' : ''} {genderOffset}</p>
                <p className="text-primary font-semibold">= {bmr} kcal/day</p>
              </div>
            </div>

            {/* Step 2: TDEE */}
            <div className="space-y-1">
              <p className="font-medium text-foreground">Step 2: Total Daily Energy Expenditure (TDEE)</p>
              <p className="text-muted-foreground text-xs">{activityData.label}</p>
              <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs space-y-1">
                <p>BMR × Activity Multiplier ({activityData.multiplier})</p>
                <p>{bmr} × {activityData.multiplier} = <span className="text-primary font-semibold">{tdee} kcal/day</span></p>
              </div>
            </div>

            {/* Step 3: Goal Adjustment */}
            <div className="space-y-1">
              <p className="font-medium text-foreground">Step 3: Goal Adjustment</p>
              <p className="text-muted-foreground text-xs">{goalData.label}</p>
              <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs space-y-1">
                <p>TDEE × {goalData.multiplier}</p>
                <p>{tdee} × {goalData.multiplier} = <span className="text-primary font-semibold">{calorieTarget} kcal/day</span></p>
              </div>
            </div>

            {/* Step 4: Macro Distribution */}
            <div className="space-y-1">
              <p className="font-medium text-foreground">Step 4: Macro Distribution</p>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Protein ({proteinPerKg}g/kg × {weightKg.toFixed(1)}kg)</span>
                  <span className="font-mono text-chart-protein">{protein}g ({proteinCal} cal)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fat (25% of calories)</span>
                  <span className="font-mono text-chart-fats">{fat}g ({fat * 9} cal)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Carbs (remaining calories)</span>
                  <span className="font-mono text-chart-carbs">{carbs}g ({carbs * 4} cal)</span>
                </div>
                <div className="border-t border-border/50 pt-2 flex justify-between font-medium">
                  <span>Total</span>
                  <span className="font-mono">{totalCal} cal</span>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
