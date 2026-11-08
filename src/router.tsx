import { useEffect, useState } from 'react';

export interface Route {
  path: string;
  params: Record<string, string>;
  query: URLSearchParams;
}

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/dashboard';
  const [pathPart, queryPart] = raw.split('?');
  return {
    path: pathPart || '/dashboard',
    params: {},
    query: new URLSearchParams(queryPart || ''),
  };
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(parseHash);

  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}

export function navigate(path: string) {
  window.location.hash = path;
}

export function Link({
  to,
  children,
  className,
  onClick,
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const handle = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(to);
    onClick?.();
  };
  return (
    <a href={`#${to}`} onClick={handle} className={className}>
      {children}
    </a>
  );
}
