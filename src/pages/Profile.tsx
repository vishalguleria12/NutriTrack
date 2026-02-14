import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { GoalType, ActivityLevel, Gender } from '@/types/nutrition';
import { User, Mail, Settings, LogOut, RefreshCw, Loader2 } from 'lucide-react';
import { CalculationBreakdown } from '@/components/CalculationBreakdown';

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'lightly_active', label: 'Lightly Active' },
  { value: 'moderately_active', label: 'Moderately Active' },
  { value: 'very_active', label: 'Very Active' },
  { value: 'extra_active', label: 'Extra Active' },
];

const GOAL_TYPES: { value: GoalType; label: string }[] = [
  { value: 'lose', label: 'Lose Weight' },
  { value: 'maintain', label: 'Maintain Weight' },
  { value: 'gain', label: 'Gain Weight' },
];

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { profile, updateProfile, recalculateTargets, isLoading } = useProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    name: profile?.name || '',
    age: profile?.age || 0,
    current_weight: profile?.current_weight || 0,
    height: profile?.height || 0,
    target_weight: profile?.target_weight || 0,
    goal_type: profile?.goal_type || 'maintain',
    activity_level: profile?.activity_level || 'moderately_active',
    unit_system: profile?.unit_system || 'metric',
  });

  const handleEdit = () => {
    setEditedProfile({
      name: profile?.name || '',
      age: profile?.age || 0,
      current_weight: profile?.current_weight || 0,
      height: profile?.height || 0,
      target_weight: profile?.target_weight || 0,
      goal_type: profile?.goal_type || 'maintain',
      activity_level: profile?.activity_level || 'moderately_active',
      unit_system: profile?.unit_system || 'metric',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile.mutateAsync(editedProfile);
      await recalculateTargets.mutateAsync();
      toast({ title: 'Profile updated!' });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
    setIsSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const unitLabel = profile?.unit_system === 'imperial' ? { weight: 'lbs', height: 'in' } : { weight: 'kg', height: 'cm' };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
            <User className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{profile?.name || 'User'}</h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Mail className="h-4 w-4" />
            {user?.email}
          </p>
        </div>

        {/* Daily Targets */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Daily Targets</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => recalculateTargets.mutate()}
                disabled={recalculateTargets.isPending}
              >
                {recalculateTargets.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
            <CardDescription>Based on your profile and goals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">
                  {profile?.daily_calorie_target || '—'}
                </p>
                <p className="text-sm text-muted-foreground">Calories</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-2xl font-bold text-chart-protein">
                  {profile?.daily_protein_target || '—'}g
                </p>
                <p className="text-sm text-muted-foreground">Protein</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-2xl font-bold text-chart-carbs">
                  {profile?.daily_carbs_target || '—'}g
                </p>
                <p className="text-sm text-muted-foreground">Carbs</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-2xl font-bold text-chart-fats">
                  {profile?.daily_fat_target || '—'}g
                </p>
                <p className="text-sm text-muted-foreground">Fat</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calculation Breakdown */}
        <CalculationBreakdown profile={profile} />

        {/* Profile Info */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Profile Settings
              </CardTitle>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={editedProfile.name}
                      onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input
                      type="number"
                      value={editedProfile.age}
                      onChange={(e) => setEditedProfile({ ...editedProfile, age: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Current Weight ({unitLabel.weight})</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={editedProfile.current_weight}
                      onChange={(e) => setEditedProfile({ ...editedProfile, current_weight: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Weight ({unitLabel.weight})</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={editedProfile.target_weight}
                      onChange={(e) => setEditedProfile({ ...editedProfile, target_weight: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Height ({unitLabel.height})</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editedProfile.height}
                    onChange={(e) => setEditedProfile({ ...editedProfile, height: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Goal</Label>
                  <Select
                    value={editedProfile.goal_type}
                    onValueChange={(v) => setEditedProfile({ ...editedProfile, goal_type: v as GoalType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_TYPES.map(goal => (
                        <SelectItem key={goal.value} value={goal.value}>
                          {goal.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Activity Level</Label>
                  <Select
                    value={editedProfile.activity_level}
                    onValueChange={(v) => setEditedProfile({ ...editedProfile, activity_level: v as ActivityLevel })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{profile?.name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age</span>
                  <span className="font-medium">{profile?.age || '—'} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Weight</span>
                  <span className="font-medium">{profile?.current_weight || '—'} {unitLabel.weight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target Weight</span>
                  <span className="font-medium">{profile?.target_weight || '—'} {unitLabel.weight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Height</span>
                  <span className="font-medium">{profile?.height || '—'} {unitLabel.height}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Goal</span>
                  <span className="font-medium capitalize">{profile?.goal_type?.replace('_', ' ') || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Activity Level</span>
                  <span className="font-medium capitalize">{profile?.activity_level?.replace('_', ' ') || '—'}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Separator />
        
        <Button
          variant="outline"
          className="w-full text-destructive hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </AppLayout>
  );
}
