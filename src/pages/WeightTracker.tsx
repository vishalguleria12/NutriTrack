import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useProfile } from '@/hooks/useProfile';
import { useWeightLogs } from '@/hooks/useWeightLogs';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Plus, Scale, TrendingUp, TrendingDown, Target, Loader2 } from 'lucide-react';

export default function WeightTracker() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useProfile();
  const { weightLogs, latestWeight, addWeightLog, isLoading } = useWeightLogs(90);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const targetWeight = profile?.target_weight;
  const startWeight = weightLogs.length > 0 ? weightLogs[0].weight : latestWeight;
  const weightChange = latestWeight && startWeight ? latestWeight - startWeight : null;
  const progressToGoal = targetWeight && startWeight && latestWeight
    ? Math.abs(startWeight - latestWeight) / Math.abs(startWeight - targetWeight) * 100
    : null;

  const chartData = weightLogs.map(log => ({
    date: format(new Date(log.logged_date), 'MMM d'),
    weight: log.weight,
  }));

  const handleAddWeight = async () => {
    const weight = parseFloat(newWeight);
    if (!weight || weight <= 0) {
      toast({
        title: 'Invalid weight',
        description: 'Please enter a valid weight.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await addWeightLog.mutateAsync({ weight });
      toast({ title: 'Weight logged!' });
      setIsDialogOpen(false);
      setNewWeight('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
    
    setIsSubmitting(false);
  };

  const unitLabel = profile?.unit_system === 'imperial' ? 'lbs' : 'kg';

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Weight Tracker</h1>
              <p className="text-sm text-muted-foreground">Monitor your progress</p>
            </div>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Log Weight
          </Button>
        </div>

        {/* Current Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-border/50">
            <CardContent className="pt-4 text-center">
              <Scale className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {latestWeight ? `${latestWeight} ${unitLabel}` : '—'}
              </p>
              <p className="text-sm text-muted-foreground">Current</p>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="pt-4 text-center">
              <Target className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {targetWeight ? `${targetWeight} ${unitLabel}` : '—'}
              </p>
              <p className="text-sm text-muted-foreground">Target</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-4 text-center">
              {weightChange !== null && weightChange < 0 ? (
                <TrendingDown className="h-6 w-6 text-success mx-auto mb-2" />
              ) : (
                <TrendingUp className="h-6 w-6 text-warning mx-auto mb-2" />
              )}
              <p className={`text-2xl font-bold ${
                weightChange !== null && weightChange < 0 ? 'text-success' : 'text-warning'
              }`}>
                {weightChange !== null 
                  ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} ${unitLabel}`
                  : '—'
                }
              </p>
              <p className="text-sm text-muted-foreground">Change (90d)</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-4 text-center">
              <div className="h-6 w-6 rounded-full bg-primary/20 mx-auto mb-2 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">%</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {progressToGoal !== null ? `${Math.min(100, Math.round(progressToGoal))}%` : '—'}
              </p>
              <p className="text-sm text-muted-foreground">To Goal</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Weight Trend (90 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No weight entries yet. Start logging to see your progress!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Weight History */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Recent Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {weightLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No entries yet</p>
            ) : (
              <div className="space-y-2">
                {[...weightLogs].reverse().slice(0, 10).map(log => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(log.logged_date), 'EEEE, MMM d')}
                    </span>
                    <span className="font-medium">
                      {log.weight} {unitLabel}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Weight Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Weight</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Weight ({unitLabel})</Label>
              <Input
                type="number"
                step="0.1"
                placeholder={profile?.unit_system === 'imperial' ? '154.5' : '70.0'}
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddWeight} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
