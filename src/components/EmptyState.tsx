import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-display font-bold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-[240px]">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="tap-target">{actionLabel}</Button>
      )}
    </div>
  );
}
