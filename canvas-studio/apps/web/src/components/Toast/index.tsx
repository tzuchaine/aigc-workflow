import { useEffect } from 'react';
import { cn } from '@/utils/cn';
import { useToast } from '@/hooks/useToast';

type ToastProps = {
  className?: string;
};

export const Toast = ({ className }: ToastProps) => {
  const { toasts, remove } = useToast();

  useEffect(() => {
    const timers = toasts.map((toast) =>
      setTimeout(() => {
        remove(toast.id);
      }, toast.duration ?? 3000)
    );
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [toasts, remove]);

  return (
    <div className={cn('fixed bottom-4 right-4 z-[2000] space-y-2', className)}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="rounded-lg border border-components-panel-border bg-components-panel-bg px-4 py-2 text-sm text-text-primary shadow-lg"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};
