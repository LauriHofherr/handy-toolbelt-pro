import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, back, actions }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border px-4 py-3">
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        {back && (
          <button onClick={() => navigate(-1)} className="tap-target flex items-center justify-center -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-display font-bold truncate">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
