import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { OnboardingData, Gender, GoalType, ActivityLevel } from '@/types/nutrition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, ArrowLeft, Target, Activity, User, Scale, Check } from 'lucide-react';

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
  { value: 'lightly_active', label: 'Lightly Active', description: 'Light exercise 1-3 days/week' },
  { value: 'moderately_active', label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week' },
  { value: 'very_active', label: 'Very Active', description: 'Hard exercise 6-7 days/week' },
  { value: 'extra_active', label: 'Extra Active', description: 'Very hard exercise & physical job' },
];

const GOAL_TYPES: { value: GoalType; label: string; description: string }[] = [
  { value: 'lose', label: 'Lose Weight', description: 'Reduce body fat' },
  { value: 'maintain', label: 'Maintain Weight', description: 'Stay at current weight' },
  { value: 'gain', label: 'Gain Weight', description: 'Build muscle mass' },
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<Partial<OnboardingData>>({
    unit_system: 'metric',
    activity_level: 'moderately_active',
    goal_type: 'maintain',
    gender: 'male',
  });
  
  const { completeOnboarding } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!data.name || !data.age || !data.gender || !data.current_weight || 
        !data.height || !data.target_weight || !data.goal_type || !data.activity_level) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await completeOnboarding.mutateAsync(data as OnboardingData);
      toast({
        title: 'Welcome to NutriTrack!',
        description: 'Your personalized nutrition plan is ready.',
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Setup failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
    
    setIsSubmitting(false);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return data.name && data.age && data.gender;
      case 2: return data.current_weight && data.height;
      case 3: return data.target_weight && data.goal_type;
      case 4: return data.activity_level;
      case 5: return true;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col">
      {/* Header with Progress */}
      <div className="max-w-lg mx-auto w-full mb-8">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-foreground">Set Up Your Profile</h1>
          <p className="text-muted-foreground">Step {step} of {totalSteps}</p>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-lg border-border/50 shadow-lg">
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Let's get to know you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={data.name || ''}
                    onChange={(e) => updateData({ name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    min={13}
                    max={120}
                    value={data.age || ''}
                    onChange={(e) => updateData({ age: parseInt(e.target.value) || undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <RadioGroup
                    value={data.gender}
                    onValueChange={(value) => updateData({ gender: value as Gender })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other">Other</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Body Metrics */}
          {step === 2 && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Scale className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Body Metrics</CardTitle>
                <CardDescription>Your current measurements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={data.unit_system === 'metric' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateData({ unit_system: 'metric' })}
                    className="flex-1"
                  >
                    Metric (kg/cm)
                  </Button>
                  <Button
                    variant={data.unit_system === 'imperial' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateData({ unit_system: 'imperial' })}
                    className="flex-1"
                  >
                    Imperial (lbs/ft)
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">
                    Current Weight ({data.unit_system === 'metric' ? 'kg' : 'lbs'})
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder={data.unit_system === 'metric' ? '70' : '154'}
                    value={data.current_weight || ''}
                    onChange={(e) => updateData({ current_weight: parseFloat(e.target.value) || undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">
                    Height ({data.unit_system === 'metric' ? 'cm' : 'inches'})
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    placeholder={data.unit_system === 'metric' ? '175' : '69'}
                    value={data.height || ''}
                    onChange={(e) => updateData({ height: parseFloat(e.target.value) || undefined })}
                  />
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: Goals */}
          {step === 3 && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Your Goals</CardTitle>
                <CardDescription>What do you want to achieve?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="target_weight">
                    Target Weight ({data.unit_system === 'metric' ? 'kg' : 'lbs'})
                  </Label>
                  <Input
                    id="target_weight"
                    type="number"
                    step="0.1"
                    placeholder={data.unit_system === 'metric' ? '65' : '143'}
                    value={data.target_weight || ''}
                    onChange={(e) => updateData({ target_weight: parseFloat(e.target.value) || undefined })}
                  />
                </div>
                <div className="space-y-3">
                  <Label>Goal Type</Label>
                  <RadioGroup
                    value={data.goal_type}
                    onValueChange={(value) => updateData({ goal_type: value as GoalType })}
                    className="space-y-2"
                  >
                    {GOAL_TYPES.map(goal => (
                      <div
                        key={goal.value}
                        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          data.goal_type === goal.value
                            ? 'border-primary bg-accent'
                            : 'border-border hover:bg-muted'
                        }`}
                        onClick={() => updateData({ goal_type: goal.value })}
                      >
                        <RadioGroupItem value={goal.value} id={goal.value} />
                        <div className="flex-1">
                          <Label htmlFor={goal.value} className="font-medium cursor-pointer">
                            {goal.label}
                          </Label>
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 4: Activity Level */}
          {step === 4 && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Activity Level</CardTitle>
                <CardDescription>How active are you typically?</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={data.activity_level}
                  onValueChange={(value) => updateData({ activity_level: value as ActivityLevel })}
                  className="space-y-2"
                >
                  {ACTIVITY_LEVELS.map(level => (
                    <div
                      key={level.value}
                      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        data.activity_level === level.value
                          ? 'border-primary bg-accent'
                          : 'border-border hover:bg-muted'
                      }`}
                      onClick={() => updateData({ activity_level: level.value })}
                    >
                      <RadioGroupItem value={level.value} id={level.value} />
                      <div className="flex-1">
                        <Label htmlFor={level.value} className="font-medium cursor-pointer">
                          {level.label}
                        </Label>
                        <p className="text-sm text-muted-foreground">{level.description}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </>
          )}

          {/* Step 5: Confirmation */}
          {step === 5 && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-2">
                  <Check className="h-6 w-6 text-success" />
                </div>
                <CardTitle>Ready to Go!</CardTitle>
                <CardDescription>Review your information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 bg-muted/50 rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{data.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Age</span>
                    <span className="font-medium">{data.age} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Weight</span>
                    <span className="font-medium">
                      {data.current_weight} {data.unit_system === 'metric' ? 'kg' : 'lbs'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target Weight</span>
                    <span className="font-medium">
                      {data.target_weight} {data.unit_system === 'metric' ? 'kg' : 'lbs'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Goal</span>
                    <span className="font-medium capitalize">{data.goal_type?.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Activity</span>
                    <span className="font-medium capitalize">{data.activity_level?.replace('_', ' ')}</span>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="p-6 pt-0 flex gap-3">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            {step < totalSteps ? (
              <Button onClick={handleNext} disabled={!canProceed()} className="flex-1">
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Get Started
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
