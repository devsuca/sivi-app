'use client';

import { ReactNode, useEffect, useState } from 'react';
// import { ThemeProvider } from 'next-themes'; // Exemplo
import { AuthProvider } from '@/lib/auth'; // Importar AuthProvider

export default function ClientProviders({ children }: { children: ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Evita erros de hidratação ao não renderizar os provedores no servidor
  if (!hasMounted) {
    return null; // Ou um componente de loading/fallback
  }

  // Envolva os seus provedores aqui
  // <AuthProvider>
  return (
    <AuthProvider>
      {/* <ThemeProvider attribute="class" defaultTheme="system" enableSystem> */}
      {children}
      {/* </ThemeProvider> */}
    </AuthProvider>
  );
}
