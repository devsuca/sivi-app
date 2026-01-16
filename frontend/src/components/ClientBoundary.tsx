'use client';

import { ReactNode, useEffect, useState } from 'react';

interface ClientBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ClientBoundary({ children, fallback = null }: ClientBoundaryProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
