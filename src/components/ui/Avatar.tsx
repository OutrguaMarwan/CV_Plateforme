export function Avatar({
  name,
  src,
  size = 40,
  color = 'brand',
}: {
  name: string;
  src?: string;
  size?: number;
  color?: 'brand' | 'navy' | 'accent' | 'success';
}) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const bg = {
    brand: 'bg-brand-100 text-brand-700',
    navy: 'bg-navy-100 text-navy-700',
    accent: 'bg-accent-100 text-accent-700',
    success: 'bg-success-100 text-success-700',
  }[color];
  if (src) {
    return <img src={src} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold ${bg}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

export function CompanyLogo({
  name,
  color = 'brand',
  size = 44,
}: {
  name: string;
  color?: string;
  size?: number;
}) {
  const initial = name.charAt(0).toUpperCase();
  const colors: Record<string, string> = {
    brand: 'bg-brand-500',
    accent: 'bg-accent-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
    navy: 'bg-navy-700',
  };
  return (
    <div
      className={`rounded-xl flex items-center justify-center text-white font-bold shrink-0 ${colors[color] || colors.brand}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </div>
  );
}
