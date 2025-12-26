import { cn } from '@/utils/cn';

type ProgressBarProps = {
  value: number;
  className?: string;
};

export const ProgressBar = ({ value, className }: ProgressBarProps) => {
  const safe = Math.min(100, Math.max(0, value));
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-neutral-100', className)}>
      <div className="h-full rounded-full bg-sky-500 transition-[width]" style={{ width: `${safe}%` }} />
    </div>
  );
};
