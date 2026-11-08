import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm shadow-brand-600/20',
  secondary: 'bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-950',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-navy-900',
  outline: 'border border-slate-300 text-navy-800 bg-white hover:bg-slate-50 hover:border-slate-400',
  danger: 'bg-error-600 text-white hover:bg-error-700',
  success: 'bg-success-600 text-white hover:bg-success-700',
};

const sizes: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5 rounded-lg gap-1.5',
  md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
  lg: 'text-base px-6 py-3 rounded-xl gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
