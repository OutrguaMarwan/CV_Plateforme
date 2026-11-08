import { type ReactNode, type HTMLAttributes } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
};

const padMap = { sm: 'p-4', md: 'p-5 sm:p-6', lg: 'p-6 sm:p-8' };

export function Card({ children, hover, padding = 'md', className = '', ...rest }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-card border border-slate-200/70 ${padMap[padding]} ${
        hover ? 'transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-start gap-3">
        {icon && <div className="shrink-0 mt-0.5 text-brand-600">{icon}</div>}
        <div>
          <h3 className="font-semibold text-navy-900 leading-tight">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
