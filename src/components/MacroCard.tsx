import { CircularProgress } from './CircularProgress';
import { cn } from '@/lib/utils';

interface MacroCardProps {
  label: string;
  value: number;
  target: number;
  unit?: string;
  color: 'protein' | 'carbs' | 'fats';
}

const colorClasses = {
  protein: {
    progress: 'text-chart-protein',
    bg: 'bg-chart-protein/10',
    text: 'text-chart-protein',
  },
  carbs: {
    progress: 'text-chart-carbs',
    bg: 'bg-chart-carbs/10',
    text: 'text-chart-carbs',
  },
  fats: {
    progress: 'text-chart-fats',
    bg: 'bg-chart-fats/10',
    text: 'text-chart-fats',
  },
};

export function MacroCard({ label, value, target, unit = 'g', color }: MacroCardProps) {
  const percentage = target > 0 ? Math.round((value / target) * 100) : 0;
  const isOver = value > target;
  const colors = colorClasses[color];

  return (
    <div className="flex flex-col items-center p-4 bg-card rounded-xl border border-border/50">
      <CircularProgress
        value={value}
        max={target}
        size={80}
        strokeWidth={6}
        progressClassName={colors.progress}
        showOverage
      >
        <div className="text-center">
          <span className="text-lg font-bold text-foreground">{Math.round(value)}</span>
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      </CircularProgress>
      
      <div className="mt-3 text-center">
        <p className="font-medium text-foreground">{label}</p>
        <p className={cn(
          'text-sm',
          isOver ? 'text-destructive' : 'text-muted-foreground'
        )}>
          {Math.round(value)} / {target}{unit}
        </p>
        <span className={cn(
          'inline-block mt-1 px-2 py-0.5 text-xs rounded-full',
          colors.bg,
          colors.text
        )}>
          {percentage}%
        </span>
      </div>
    </div>
  );
}
